jest.mock('./widget-lookup', () => ({ getWidgetConfig: jest.fn() }));
global.fetch = jest.fn();

const { getWidgetConfig } = require('./widget-lookup');
const { handler } = require('./google-reviews');

const BASE_EVENT = { httpMethod: 'GET', queryStringParameters: {} };

describe('google-reviews function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  });

  test('returns 204 for OPTIONS', async () => {
    const r = await handler({ httpMethod: 'OPTIONS', queryStringParameters: {} });
    expect(r.statusCode).toBe(204);
  });

  test('returns 400 if widget_key missing', async () => {
    const r = await handler(BASE_EVENT);
    expect(r.statusCode).toBe(400);
  });

  test('returns 404 if widget not found', async () => {
    getWidgetConfig.mockResolvedValue(null);
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'bad' } });
    expect(r.statusCode).toBe(404);
  });

  test('returns 404 if widget is wrong type', async () => {
    getWidgetConfig.mockResolvedValue({ type: 'instagram-feed', widget_key: 'abc' });
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'abc' } });
    expect(r.statusCode).toBe(404);
  });

  test('returns 500 on database error', async () => {
    getWidgetConfig.mockRejectedValue(new Error('db error'));
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'abc' } });
    expect(r.statusCode).toBe(500);
  });

  test('returns 200 with review data', async () => {
    getWidgetConfig.mockResolvedValue({ type: 'google-reviews', widget_key: 'abc', place_id: 'ChIJtest' });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        result: {
          rating: 5.0,
          user_ratings_total: 172,
          url: 'https://maps.google.com/?cid=123',
          reviews: [{ author_name: 'Felix 787', rating: 5, relative_time_description: '18 days ago', text: 'Great!' }],
        },
      }),
    });
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'abc' } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.rating).toBe(5.0);
    expect(body.reviews).toHaveLength(1);
  });

  test('returns 502 on Google API failure', async () => {
    getWidgetConfig.mockResolvedValue({ type: 'google-reviews', widget_key: 'abc', place_id: 'ChIJtest' });
    global.fetch.mockResolvedValue({ ok: false });
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'abc' } });
    expect(r.statusCode).toBe(502);
  });
});
