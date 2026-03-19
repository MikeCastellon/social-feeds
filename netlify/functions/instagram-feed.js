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

  const token = config.instagram_access_token;
  if (!token) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Instagram token not configured' }) };
  }

  const base = 'https://graph.instagram.com/me';

  try {
    const profileRes = await fetch(`${base}?fields=${PROFILE_FIELDS}&access_token=${token}`);
    if (!profileRes.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram API error' }) };
    }
    const profile = await profileRes.json();

    const mediaRes = await fetch(`${base}/media?fields=${MEDIA_FIELDS}&limit=24&access_token=${token}`);
    if (!mediaRes.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram media error' }) };
    }
    const mediaData = await mediaRes.json();

    if (!Array.isArray(mediaData.data)) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram API error' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ profile, posts: mediaData.data }),
    };
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram API unavailable' }) };
  }
};
