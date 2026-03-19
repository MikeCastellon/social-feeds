describe('getAdminClient', () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    process.env.SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    jest.resetModules();
  });

  test('throws when env vars missing', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    jest.resetModules();
    const { getAdminClient } = require('./supabaseAdmin');
    expect(() => getAdminClient()).toThrow('Missing Supabase admin credentials');
  });

  test('returns client when env vars present', () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    jest.resetModules();
    const { getAdminClient } = require('./supabaseAdmin');
    const client = getAdminClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });
});
