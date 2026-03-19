const FIELDS = 'rating,user_ratings_total,url,reviews';

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, OPTIONS' }, body: '' };
  }

  const { place_id } = event.queryStringParameters || {};
  if (!place_id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'place_id is required' }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=${FIELDS}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Google API error' }) };
  }

  const data = await response.json();
  if (!data.result || data.status !== 'OK') {
    return { statusCode: 502, headers, body: JSON.stringify({ error: `Google Places error: ${data.status}` }) };
  }

  const { rating, user_ratings_total, url: mapsUrl, reviews } = data.result;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ rating, user_ratings_total, url: mapsUrl, reviews }),
  };
};
