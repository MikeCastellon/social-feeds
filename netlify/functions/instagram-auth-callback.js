const { getAdminClient } = require('../../src/lib/supabaseAdmin');

function generateWidgetKey() {
  return Math.random().toString(36).slice(2, 10);
}

exports.handler = async function (event) {
  const { code, state: rawState } = event.queryStringParameters || {};
  const fromSiteBuilder = rawState?.endsWith('__sitebuilder');
  const userId = fromSiteBuilder ? rawState.replace('__sitebuilder', '') : rawState;
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  // Hardcode to match exactly what the dashboard JS sends (window.location.origin + path)
  const redirectUri = 'https://social-feeds-app.netlify.app/.netlify/functions/instagram-auth-callback';
  console.log('[ig-auth] redirect_uri:', redirectUri);

  console.log('[ig-auth] appId:', appId ? appId.slice(0, 6) + '...' + appId.slice(-4) : 'MISSING');
  console.log('[ig-auth] appSecret:', appSecret ? appSecret.slice(0, 4) + '...' + appSecret.slice(-4) : 'MISSING');
  console.log('[ig-auth] appSecret length:', appSecret ? appSecret.length : 0);

  if (!code) return { statusCode: 400, body: 'Missing code' };
  if (!userId) return { statusCode: 400, body: 'Missing state (user_id)' };

  // Step 1: Exchange code for short-lived token
  const cleanCode = code.replace(/#_$/, ''); // strip trailing #_ if present
  console.log('[ig-auth] redirect_uri:', redirectUri);
  console.log('[ig-auth] code length:', cleanCode.length);

  let shortToken, igUserId;
  let lastError;

  // Try Facebook Graph API first (for Facebook Login flow), then Instagram API (legacy)
  const tokenEndpoints = [
    { url: 'https://graph.facebook.com/v22.0/oauth/access_token', label: 'facebook' },
    { url: 'https://api.instagram.com/oauth/access_token', label: 'instagram' },
  ];

  let tokenSource = null;
  for (const ep of tokenEndpoints) {
    try {
      const tokenBody = new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: cleanCode,
      });
      console.log('[ig-auth] exchanging code at', ep.label, ep.url);
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenBody.toString(),
      });
      const data = await res.json();
      console.log('[ig-auth]', ep.label, 'response:', res.status, JSON.stringify(data).slice(0, 200));
      if (res.ok && data.access_token) {
        shortToken = data.access_token;
        igUserId = data.user_id;
        tokenSource = ep.label;
        console.log('[ig-auth] got token from', ep.label, 'prefix:', shortToken.slice(0, 10), 'length:', shortToken.length);
        break;
      }
      lastError = data;
    } catch (err) {
      lastError = { error: err.message };
      console.log('[ig-auth] error at', ep.label, ':', err.message);
    }
  }

  if (!shortToken) {
    return { statusCode: 502, body: 'Token exchange failed: ' + JSON.stringify(lastError) };
  }

  // Step 2: Exchange for long-lived token
  let longToken, expiresIn;
  if (tokenSource === 'facebook') {
    // Facebook tokens: exchange via fb_exchange_token
    try {
      const url = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;
      console.log('[ig-auth] FB long-lived exchange');
      const res = await fetch(url);
      const data = await res.json();
      console.log('[ig-auth] FB exchange:', res.status, JSON.stringify(data).slice(0, 200));
      if (res.ok && data.access_token) {
        longToken = data.access_token;
        expiresIn = data.expires_in || 5184000;
      }
    } catch (err) {
      console.log('[ig-auth] FB exchange error:', err.message);
    }
  } else {
    // Instagram tokens: exchange via ig_exchange_token
    try {
      const url = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortToken}`;
      console.log('[ig-auth] IG long-lived exchange');
      const res = await fetch(url);
      const data = await res.json();
      console.log('[ig-auth] IG exchange:', res.status, JSON.stringify(data).slice(0, 200));
      if (res.ok && data.access_token) {
        longToken = data.access_token;
        expiresIn = data.expires_in || 5184000;
      }
    } catch (err) {
      console.log('[ig-auth] IG exchange error:', err.message);
    }
  }
  if (!longToken) {
    console.log('[ig-auth] WARNING: long-lived exchange failed, using short token');
    longToken = shortToken;
    expiresIn = tokenSource === 'facebook' ? 5184000 : 3600; // FB short tokens last longer
  }

  // For Facebook Login flow, find the linked Instagram account
  if (tokenSource === 'facebook' && !igUserId) {
    try {
      // Get user's pages, then find linked IG account
      const pagesRes = await fetch(`https://graph.facebook.com/v22.0/me/accounts?access_token=${longToken}`);
      const pagesData = await pagesRes.json();
      console.log('[ig-auth] pages:', JSON.stringify(pagesData).slice(0, 300));
      if (pagesData.data?.length > 0) {
        for (const page of pagesData.data) {
          const igRes = await fetch(`https://graph.facebook.com/v22.0/${page.id}?fields=instagram_business_account&access_token=${longToken}`);
          const igData = await igRes.json();
          if (igData.instagram_business_account?.id) {
            igUserId = igData.instagram_business_account.id;
            console.log('[ig-auth] found IG account:', igUserId, 'via page:', page.name);
            break;
          }
        }
      }
    } catch (err) {
      console.log('[ig-auth] pages/IG lookup error:', err.message);
    }
  }

  // Step 3: Get Instagram username
  let username = 'instagram_user';
  const profileEndpoints = igUserId ? [
    `https://graph.facebook.com/v22.0/${igUserId}?fields=username,name,profile_picture_url&access_token=${longToken}`,
    `https://graph.instagram.com/v22.0/${igUserId}?fields=user_id,username&access_token=${longToken}`,
    `https://graph.instagram.com/${igUserId}?fields=user_id,username&access_token=${longToken}`,
    `https://graph.instagram.com/me?fields=user_id,username&access_token=${longToken}`,
  ] : [
    `https://graph.instagram.com/me?fields=user_id,username&access_token=${longToken}`,
    `https://graph.facebook.com/v22.0/me?fields=username,name&access_token=${longToken}`,
  ];
  for (const ep of profileEndpoints) {
    try {
      const res = await fetch(ep);
      if (res.ok) {
        const data = await res.json();
        username = data.username || data.name || username;
        console.log('[ig-auth] got username:', username, 'from', ep.split('?')[0]);
        break;
      } else {
        const errData = await res.text();
        console.log('[ig-auth] endpoint failed:', ep.split('?')[0], res.status, errData);
      }
    } catch (err) {
      console.log('[ig-auth] endpoint error:', ep.split('?')[0], err.message);
    }
  }
  // If all endpoints fail, proceed anyway — username is nice-to-have, token is essential

  // Step 4: Save to Supabase
  const expiry = new Date(Date.now() + expiresIn * 1000).toISOString();
  const supabase = getAdminClient();

  // Check if an instagram widget already exists for this user — update token if so
  const { data: existing } = await supabase
    .from('widget_configs')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'instagram-feed')
    .limit(1)
    .single();

  let error;
  if (existing) {
    ({ error } = await supabase.from('widget_configs').update({
      instagram_access_token: longToken,
      instagram_user_id: igUserId,
      instagram_username: username,
      instagram_token_expiry: expiry,
      label: `@${username}`,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id));
  } else {
    ({ error } = await supabase.from('widget_configs').insert({
      user_id: userId,
      type: 'instagram-feed',
      widget_key: generateWidgetKey(),
      instagram_access_token: longToken,
      instagram_user_id: igUserId,
      instagram_username: username,
      instagram_token_expiry: expiry,
      label: `@${username}`,
      updated_at: new Date().toISOString(),
    }));
  }

  if (error) {
    console.error('Supabase save error:', error);
    return { statusCode: 500, body: 'Failed to save token: ' + error.message };
  }

  // If opened from site builder, return auto-close page
  if (fromSiteBuilder) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `<!DOCTYPE html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#faf9f7"><div style="text-align:center"><h2>Instagram Connected!</h2><p style="color:#666">This window will close automatically...</p></div><script>setTimeout(()=>window.close(),1500)</script></body></html>`,
    };
  }

  // Redirect back to dashboard
  const dashboardUrl = 'https://social-feeds-app.netlify.app/dashboard.html';
  return {
    statusCode: 302,
    headers: { Location: `${dashboardUrl}?connected=instagram` },
    body: '',
  };
};
