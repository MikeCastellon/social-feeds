const FIELDS = 'rating,user_ratings_total,url,reviews';

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const { place_id } = event.queryStringParameters || {};
  if (!place_id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'place_id is required' }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${FIELDS}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Google API error' }) };
  }

  const data = await response.json();
  const { rating, user_ratings_total, url: mapsUrl, reviews } = data.result;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ rating, user_ratings_total, url: mapsUrl, reviews }),
  };
};
