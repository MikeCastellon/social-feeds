jest.mock('../../src/lib/supabaseAdmin', () => ({ getAdminClient: jest.fn() }));

const { getAdminClient } = require('../../src/lib/supabaseAdmin');
const { handler } = require('../functions/widget-save');

describe('widget-save function', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 405 for non-POST', async () => {
    const r = await handler({ httpMethod: 'GET', headers: {}, body: '' });
    expect(r.statusCode).toBe(405);
  });

  test('returns 400 if body invalid', async () => {
    const r = await handler({ httpMethod: 'POST', headers: {}, body: 'not-json' });
    expect(r.statusCode).toBe(400);
  });

  test('returns 400 if type missing', async () => {
    const r = await handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ user_id: 'uid', place_id: 'ChIJ' }) });
    expect(r.statusCode).toBe(400);
  });

  test('saves google-reviews config and returns widget_key', async () => {
    const mockChain = { data: [{ widget_key: 'abc12345', id: 'some-uuid' }], error: null };
    getAdminClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockChain)
        })
      })
    });

    const r = await handler({
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({ user_id: 'uid-123', type: 'google-reviews', place_id: 'ChIJtest', label: 'My Shop' }),
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.widget_key).toBe('abc12345');
  });
});
