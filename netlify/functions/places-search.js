exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, OPTIONS' }, body: '' };
  }

  const { q } = event.queryStringParameters || {};
  if (!q || !q.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'q (search query) is required' }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Google API error' }) };
    }
    const data = await response.json();
    if (data.status === 'REQUEST_DENIED') {
      return { statusCode: 500, headers, body: JSON.stringify({ error: data.error_message || 'API key not authorized for Places' }) };
    }
    const results = (data.results || []).slice(0, 8).map(function(c) {
      return {
        name: c.name,
        address: c.formatted_address,
        place_id: c.place_id,
        rating: c.rating,
        review_count: c.user_ratings_total,
      };
    });
    return { statusCode: 200, headers, body: JSON.stringify({ results }) };
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Google API unavailable' }) };
  }
};
