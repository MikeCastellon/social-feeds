global.fetch = jest.fn();
const { handler } = require('./places-search');

describe('places-search function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  });

  test('returns 204 for OPTIONS', async () => {
    const r = await handler({ httpMethod: 'OPTIONS', queryStringParameters: {} });
    expect(r.statusCode).toBe(204);
  });

  test('returns 400 if q missing', async () => {
    const r = await handler({ httpMethod: 'GET', queryStringParameters: {} });
    expect(r.statusCode).toBe(400);
  });

  test('returns list of matching places', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        candidates: [
          { name: 'alocalX Roofing', formatted_address: '123 Main St', place_id: 'ChIJtest', rating: 5.0, user_ratings_total: 172 },
        ],
      }),
    });
    const r = await handler({ httpMethod: 'GET', queryStringParameters: { q: 'alocalX Roofing' } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].place_id).toBe('ChIJtest');
  });

  test('returns empty array when no results', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ZERO_RESULTS', candidates: [] }),
    });
    const r = await handler({ httpMethod: 'GET', queryStringParameters: { q: 'nonexistent' } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.results).toHaveLength(0);
  });

  test('returns 502 on Google API failure', async () => {
    global.fetch.mockResolvedValue({ ok: false });
    const r = await handler({ httpMethod: 'GET', queryStringParameters: { q: 'test' } });
    expect(r.statusCode).toBe(502);
  });
});
