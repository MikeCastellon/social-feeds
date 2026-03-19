const { getAdminClient } = require('../../src/lib/supabaseAdmin');

function generateWidgetKey() {
  return Math.random().toString(36).slice(2, 10);
}

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { user_id, type, place_id, label } = payload;
  if (!type || !user_id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id and type are required' }) };
  }

  const supabase = getAdminClient();
  const record = {
    user_id,
    type,
    widget_key: generateWidgetKey(),
    label: label || type,
    updated_at: new Date().toISOString(),
  };
  if (type === 'google-reviews' && place_id) record.place_id = place_id;

  const { data, error } = await supabase
    .from('widget_configs')
    .insert(record)
    .select();

  if (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ widget_key: data[0].widget_key, id: data[0].id }) };
};
