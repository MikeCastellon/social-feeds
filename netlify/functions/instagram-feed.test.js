global.fetch = jest.fn();
const { handler } = require('./instagram-feed');

describe('instagram-feed function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INSTAGRAM_ACCESS_TOKEN = 'test-token';
  });

  test('returns 204 for OPTIONS preflight', async () => {
    const result = await handler({ httpMethod: 'OPTIONS', queryStringParameters: {} });
    expect(result.statusCode).toBe(204);
  });

  test('returns 500 when INSTAGRAM_ACCESS_TOKEN not set', async () => {
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    const result = await handler({ httpMethod: 'GET', queryStringParameters: {} });
    expect(result.statusCode).toBe(500);
  });

  test('returns profile and posts', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '123',
          name: 'Roofing & Construction',
          username: 'alocalx',
          profile_picture_url: 'https://example.com/avatar.jpg',
          media_count: 76,
          followers_count: 739,
          follows_count: 236,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'post1',
              media_type: 'IMAGE',
              media_url: 'https://example.com/img.jpg',
              thumbnail_url: null,
              permalink: 'https://www.instagram.com/p/abc/',
              timestamp: '2024-01-01T00:00:00Z',
            },
          ],
        }),
      });

    const result = await handler({ httpMethod: 'GET', queryStringParameters: {} });
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.profile.username).toBe('alocalx');
    expect(body.posts).toHaveLength(1);
  });

  test('returns 502 when profile fetch fails', async () => {
    global.fetch.mockResolvedValue({ ok: false });
    const result = await handler({ httpMethod: 'GET', queryStringParameters: {} });
    expect(result.statusCode).toBe(502);
  });

  test('returns 502 when media fetch fails', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', username: 'alocalx' }),
      })
      .mockResolvedValueOnce({ ok: false });
    const result = await handler({ httpMethod: 'GET', queryStringParameters: {} });
    expect(result.statusCode).toBe(502);
  });
});
