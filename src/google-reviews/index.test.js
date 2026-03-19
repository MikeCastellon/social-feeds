/**
 * @jest-environment jsdom
 */
'use strict';

beforeEach(() => {
  // Reset modules so styles injection check works fresh each test
  jest.resetModules();
  global.fetch = jest.fn();
});

function getModule() {
  return require('./index.js');
}

const MOCK_DATA = {
  rating: 5.0,
  user_ratings_total: 172,
  url: 'https://maps.google.com',
  reviews: [
    {
      author_name: 'Felix 787',
      profile_photo_url: '',
      rating: 5,
      relative_time_description: '18 days ago',
      text: 'exelente servicio al cliente 100%',
    },
  ],
};

describe('mountGoogleReviews', () => {
  test('shows error when data-widget-key missing', () => {
    const { mountGoogleReviews } = getModule();
    const el = document.createElement('div');
    document.body.appendChild(el);
    mountGoogleReviews(el);
    expect(el.textContent).toContain('Missing data-widget-key');
    el.remove();
  });

  test('calls fetch with encoded widget_key', () => {
    global.fetch.mockResolvedValue({ json: async () => MOCK_DATA });
    const { mountGoogleReviews } = getModule();
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.dataset.widgetKey = 'abc+test/123';
    mountGoogleReviews(el);
    expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/google-reviews?widget_key=abc%2Btest%2F123');
    el.remove();
  });

  test('shows loading state immediately', () => {
    global.fetch.mockResolvedValue({ json: async () => MOCK_DATA });
    const { mountGoogleReviews } = getModule();
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.dataset.widgetKey = 'abc-widget-key';
    mountGoogleReviews(el);
    expect(el.innerHTML).toContain('Loading reviews');
    el.remove();
  });

  test('injects styles into document head', () => {
    global.fetch.mockResolvedValue({ json: async () => MOCK_DATA });
    const { mountGoogleReviews } = getModule();
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.dataset.widgetKey = 'abc-widget-key';
    mountGoogleReviews(el);
    expect(document.getElementById('sf-gr-styles')).not.toBeNull();
    el.remove();
  });

  test('renders error message on fetch failure', async () => {
    global.fetch.mockRejectedValue(new Error('network error'));
    const { mountGoogleReviews } = getModule();
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.dataset.widgetKey = 'abc-widget-key';
    mountGoogleReviews(el);
    // Wait for promise to settle
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.textContent).toContain('Could not load reviews');
    el.remove();
  });
});
