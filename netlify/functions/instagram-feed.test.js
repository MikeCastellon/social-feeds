jest.mock('./widget-lookup', () => ({ getWidgetConfig: jest.fn() }));
global.fetch = jest.fn();

const { getWidgetConfig } = require('./widget-lookup');
const { handler } = require('./instagram-feed');

const BASE_EVENT = { httpMethod: 'GET', queryStringParameters: {} };
const MOCK_CONFIG = { type: 'instagram-feed', widget_key: 'xyz', instagram_access_token: 'token123' };

describe('instagram-feed function', () => {
  beforeEach(() => jest.clearAllMocks());

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

  test('returns 500 on database error', async () => {
    getWidgetConfig.mockRejectedValue(new Error('db error'));
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'xyz' } });
    expect(r.statusCode).toBe(500);
  });

  test('returns 200 with profile and posts', async () => {
    getWidgetConfig.mockResolvedValue(MOCK_CONFIG);
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1', username: 'alocalx', media_count: 76, followers_count: 739, follows_count: 236, profile_picture_url: 'https://example.com/avatar.jpg' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: 'p1', media_type: 'IMAGE', media_url: 'https://example.com/img.jpg', permalink: 'https://instagram.com/p/abc/' }] }) });
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'xyz' } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.profile.username).toBe('alocalx');
    expect(body.posts).toHaveLength(1);
  });

  test('returns 502 on Instagram API failure', async () => {
    getWidgetConfig.mockResolvedValue(MOCK_CONFIG);
    global.fetch.mockResolvedValue({ ok: false });
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'xyz' } });
    expect(r.statusCode).toBe(502);
  });

  test('returns 502 when fetch throws', async () => {
    getWidgetConfig.mockResolvedValue(MOCK_CONFIG);
    global.fetch.mockRejectedValue(new Error('network'));
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'xyz' } });
    expect(r.statusCode).toBe(502);
  });
});
