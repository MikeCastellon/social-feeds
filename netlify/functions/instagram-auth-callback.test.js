jest.mock('../../src/lib/supabaseAdmin', () => ({ getAdminClient: jest.fn() }));
global.fetch = jest.fn();

const { getAdminClient } = require('../../src/lib/supabaseAdmin');
const { handler } = require('./instagram-auth-callback');

describe('instagram-auth-callback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FB_APP_ID = 'test-app-id';
    process.env.FB_APP_SECRET = 'test-secret';
  });

  test('returns 400 if code missing', async () => {
    const r = await handler({ queryStringParameters: {} });
    expect(r.statusCode).toBe(400);
  });

  test('returns 400 if state (user_id) missing', async () => {
    const r = await handler({ queryStringParameters: { code: 'abc' } });
    expect(r.statusCode).toBe(400);
  });

  test('returns 502 if token exchange fails', async () => {
    global.fetch.mockResolvedValue({ ok: false });
    const r = await handler({ queryStringParameters: { code: 'abc', state: 'user-123' } });
    expect(r.statusCode).toBe(502);
  });

  test('saves token and redirects on success', async () => {
    // Mock: short-lived token exchange
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'short-token', user_id: '12345' }),
      })
      // Mock: long-lived token exchange
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'long-token', expires_in: 5183944 }),
      })
      // Mock: get username
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'alocalx', id: '12345' }),
      });

    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    getAdminClient.mockReturnValue({
      from: () => ({ upsert: mockUpsert }),
    });

    const r = await handler({ queryStringParameters: { code: 'auth-code', state: 'user-uuid-123' } });
    expect(r.statusCode).toBe(302);
    expect(r.headers.Location).toContain('/dashboard');
    expect(mockUpsert).toHaveBeenCalled();
    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.instagram_access_token).toBe('long-token');
    expect(upsertArg.instagram_username).toBe('alocalx');
    expect(upsertArg.user_id).toBe('user-uuid-123');
  });
});
