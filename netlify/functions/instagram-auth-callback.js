const { getAdminClient } = require('../../src/lib/supabaseAdmin');

function generateWidgetKey() {
  return Math.random().toString(36).slice(2, 10);
}

exports.handler = async function (event) {
  const { code, state: userId } = event.queryStringParameters || {};
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  const redirectUri = process.env.URL
    ? `${process.env.URL}/.netlify/functions/instagram-auth-callback`
    : 'http://localhost:8888/.netlify/functions/instagram-auth-callback';

  if (!code) return { statusCode: 400, body: 'Missing code' };
  if (!userId) return { statusCode: 400, body: 'Missing state (user_id)' };

  // Step 1: Exchange code for short-lived token
  const tokenUrl = `https://api.instagram.com/oauth/access_token`;
  const tokenBody = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });

  let shortToken;
  try {
    const res = await fetch(tokenUrl, { method: 'POST', body: tokenBody });
    if (!res.ok) return { statusCode: 502, body: 'Token exchange failed' };
    const data = await res.json();
    shortToken = data.access_token;
  } catch (err) {
    return { statusCode: 502, body: 'Token exchange error' };
  }

  // Step 2: Exchange for long-lived token (60 days)
  let longToken, expiresIn;
  try {
    const res = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortToken}`
    );
    if (!res.ok) return { statusCode: 502, body: 'Long-lived token exchange failed' };
    const data = await res.json();
    longToken = data.access_token;
    expiresIn = data.expires_in;
  } catch (err) {
    return { statusCode: 502, body: 'Long-lived token error' };
  }

  // Step 3: Get Instagram username
  let username;
  try {
    const res = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${longToken}`);
    if (!res.ok) return { statusCode: 502, body: 'Failed to get Instagram username' };
    const data = await res.json();
    username = data.username;
  } catch (err) {
    return { statusCode: 502, body: 'Username fetch error' };
  }

  // Step 4: Save to Supabase
  const expiry = new Date(Date.now() + expiresIn * 1000).toISOString();
  const supabase = getAdminClient();
  const { error } = await supabase.from('widget_configs').upsert({
    user_id: userId,
    type: 'instagram-feed',
    widget_key: generateWidgetKey(),
    instagram_access_token: longToken,
    instagram_username: username,
    instagram_token_expiry: expiry,
    label: `@${username}`,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,type' });

  if (error) {
    console.error('Supabase upsert error:', error);
    return { statusCode: 500, body: 'Failed to save token' };
  }

  // Redirect back to dashboard
  const dashboardUrl = process.env.URL ? `${process.env.URL}/dashboard.html` : 'http://localhost:8888/dashboard.html';
  return {
    statusCode: 302,
    headers: { Location: `${dashboardUrl}?connected=instagram` },
    body: '',
  };
};
