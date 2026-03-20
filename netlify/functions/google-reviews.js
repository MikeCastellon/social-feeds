const FIELDS = 'rating,user_ratings_total,url,reviews';
const { getWidgetConfig } = require('./widget-lookup');

async function fetchPlaceDetails(placeId, apiKey, sort) {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: FIELDS,
    key: apiKey,
  });
  if (sort) params.set('reviews_sort', sort);
  const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.result || data.status !== 'OK') return null;
  return data.result;
}

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

  if (!config || config.type !== 'google-reviews') {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Widget not found' }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
  }

  // Fetch both sort orders in parallel to get up to 10 unique reviews
  const [relevant, newest] = await Promise.all([
    fetchPlaceDetails(config.place_id, apiKey, 'most_relevant'),
    fetchPlaceDetails(config.place_id, apiKey, 'newest'),
  ]);

  if (!relevant) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Google API error' }) };
  }

  const { rating, user_ratings_total, url: mapsUrl } = relevant;

  // Deduplicate by author_name + rating (Google doesn't provide a review ID)
  const seen = new Set();
  const reviews = [];
  for (const list of [relevant.reviews || [], newest?.reviews || []]) {
    for (const r of list) {
      const key = `${r.author_name}|${r.rating}`;
      if (!seen.has(key)) {
        seen.add(key);
        reviews.push(r);
      }
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ rating, user_ratings_total, url: mapsUrl, reviews }),
  };
};
