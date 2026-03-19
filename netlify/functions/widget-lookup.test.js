jest.mock('../../src/lib/supabaseAdmin', () => ({
  getAdminClient: jest.fn(),
}));

const { getAdminClient } = require('../../src/lib/supabaseAdmin');
const { getWidgetConfig } = require('./widget-lookup');

describe('getWidgetConfig', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns null when widget_key not found', async () => {
    getAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { code: 'PGRST116' } })
          })
        })
      })
    });
    const result = await getWidgetConfig('nonexistent');
    expect(result).toBeNull();
  });

  test('returns config for valid widget_key', async () => {
    const mockConfig = {
      id: 'uuid-1',
      type: 'google-reviews',
      widget_key: 'abc123',
      place_id: 'ChIJtest',
    };
    getAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: mockConfig, error: null })
          })
        })
      })
    });
    const result = await getWidgetConfig('abc123');
    expect(result).toEqual(mockConfig);
  });

  test('throws on unexpected database error', async () => {
    getAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { code: 'UNEXPECTED', message: 'db error' } })
          })
        })
      })
    });
    await expect(getWidgetConfig('abc123')).rejects.toThrow('db error');
  });
});
