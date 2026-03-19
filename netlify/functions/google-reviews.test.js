// Mock fetch globally
global.fetch = jest.fn();

const { handler } = require('./google-reviews');

describe('google-reviews function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  });

  test('returns 400 if place_id missing', async () => {
    const result = await handler({ queryStringParameters: {} });
    expect(result.statusCode).toBe(400);
  });

  test('returns formatted review data', async () => {
    const mockApiResponse = {
      result: {
        rating: 5.0,
        user_ratings_total: 172,
        url: 'https://maps.google.com/?cid=123',
        reviews: [
          {
            author_name: 'Felix 787',
            profile_photo_url: 'https://example.com/photo.jpg',
            rating: 5,
            relative_time_description: '18 days ago',
            text: 'exelente servicio al cliente 100%',
          },
        ],
      },
    };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const result = await handler({ queryStringParameters: { place_id: 'ChIJtest' } });
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.rating).toBe(5.0);
    expect(body.reviews).toHaveLength(1);
    expect(body.reviews[0].author_name).toBe('Felix 787');
  });

  test('returns 502 on Google API error', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 403 });
    const result = await handler({ queryStringParameters: { place_id: 'ChIJtest' } });
    expect(result.statusCode).toBe(502);
  });
});
