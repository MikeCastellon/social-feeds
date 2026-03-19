const PROFILE_FIELDS = 'id,name,username,profile_picture_url,media_count,followers_count,follows_count';
const MEDIA_FIELDS = 'id,media_type,media_url,thumbnail_url,permalink,timestamp';

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, OPTIONS' }, body: '' };
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
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
