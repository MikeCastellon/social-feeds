const PROFILE_FIELDS = 'id,name,username,profile_picture_url,media_count,followers_count,follows_count';
const MEDIA_FIELDS = 'id,media_type,media_url,thumbnail_url,permalink,timestamp';
const { getWidgetConfig } = require('./widget-lookup');

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, OPTIONS' }, body: '' };
  }

  const { widget_key } = event.queryStringParameters || {};
  if (!widget_key) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'widget_key is required' }) };
  }

  let config;
  try {
    config = await getWidgetConfig(widget_key);
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error' }) };
  }

  if (!config || config.type !== 'instagram-feed') {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Widget not found' }) };
  }

  let token = config.instagram_access_token;
  const igUserId = config.instagram_user_id;
  if (!token) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Instagram token not configured' }) };
  }

  // Try to refresh token if it's close to expiry or expired
  const tokenExpiry = config.instagram_token_expiry ? new Date(config.instagram_token_expiry) : null;
  const isExpiredOrSoon = tokenExpiry && (tokenExpiry.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000); // within 7 days
  if (isExpiredOrSoon) {
    try {
      const refreshRes = await fetch(
        `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
      );
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        token = refreshData.access_token;
        const newExpiry = new Date(Date.now() + (refreshData.expires_in || 5184000) * 1000).toISOString();
        // Update token in DB
        const { getAdminClient } = require('../../src/lib/supabaseAdmin');
        const supabase = getAdminClient();
        await supabase.from('widget_configs').update({
          instagram_access_token: token,
          instagram_token_expiry: newExpiry,
          updated_at: new Date().toISOString(),
        }).eq('widget_key', widget_key);
        console.log('[ig-feed] refreshed token for', widget_key);
      } else {
        console.log('[ig-feed] token refresh failed:', await refreshRes.text());
      }
    } catch (err) {
      console.log('[ig-feed] token refresh error:', err.message);
    }
  }

  try {
    // Try multiple URL formats — supports both old Basic Display and new Instagram Business Login
    // Facebook Graph API endpoints work with tokens from the new instagram_business_basic flow
    const urls = [
      // Facebook Graph API (new Business Login tokens)
      { profile: `https://graph.facebook.com/v22.0/${igUserId}?fields=${PROFILE_FIELDS}&access_token=${token}`,
        media: `https://graph.facebook.com/v22.0/${igUserId}/media?fields=${MEDIA_FIELDS}&limit=24&access_token=${token}` },
      // Instagram Graph API with user ID (old tokens)
      { profile: `https://graph.instagram.com/v22.0/${igUserId}?fields=${PROFILE_FIELDS}&access_token=${token}`,
        media: `https://graph.instagram.com/v22.0/${igUserId}/media?fields=${MEDIA_FIELDS}&limit=24&access_token=${token}` },
      { profile: `https://graph.instagram.com/${igUserId}?fields=${PROFILE_FIELDS}&access_token=${token}`,
        media: `https://graph.instagram.com/${igUserId}/media?fields=${MEDIA_FIELDS}&limit=24&access_token=${token}` },
      // /me endpoints
      { profile: `https://graph.instagram.com/v22.0/me?fields=${PROFILE_FIELDS}&access_token=${token}`,
        media: `https://graph.instagram.com/v22.0/me/media?fields=${MEDIA_FIELDS}&limit=24&access_token=${token}` },
    ];

    let profileData, mediaData;
    for (const u of urls) {
      const pRes = await fetch(u.profile);
      if (pRes.ok) {
        profileData = await pRes.json();
        const mRes = await fetch(u.media);
        if (mRes.ok) {
          mediaData = await mRes.json();
          console.log('[ig-feed] success with:', u.profile.split('?')[0]);
          break;
        } else {
          const mErr = await mRes.json();
          console.log('[ig-feed] media failed:', u.media.split('?')[0], JSON.stringify(mErr));
        }
      } else {
        const pErr = await pRes.json();
        console.log('[ig-feed] profile failed:', u.profile.split('?')[0], JSON.stringify(pErr));
      }
    }

    if (!profileData || !mediaData) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'All Instagram API endpoints failed' }) };
    }

    if (!Array.isArray(mediaData.data)) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram API returned no media' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ profile: profileData, posts: mediaData.data }),
    };
  } catch (err) {
    console.error('[ig-feed] error:', err.message);
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram API unavailable' }) };
  }
};
