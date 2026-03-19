/**
 * @jest-environment jsdom
 */
'use strict';

beforeEach(() => {
  jest.resetModules();
  global.fetch = jest.fn();
});

function getModule() {
  return require('./index.js');
}

const MOCK_DATA = {
  profile: {
    username: 'alocalx',
    profile_picture_url: 'https://example.com/avatar.jpg',
    media_count: 76,
    followers_count: 739,
    follows_count: 236,
  },
  posts: [
    {
      id: '1',
      media_type: 'IMAGE',
      media_url: 'https://example.com/img.jpg',
      thumbnail_url: null,
      permalink: 'https://www.instagram.com/p/abc/',
    },
    {
      id: '2',
      media_type: 'VIDEO',
      media_url: null,
      thumbnail_url: 'https://example.com/thumb.jpg',
      permalink: 'https://www.instagram.com/p/def/',
    },
  ],
};

describe('mountInstagramFeed', () => {
  test('calls instagram-feed function with widget_key', () => {
    global.fetch.mockResolvedValue({ json: async () => MOCK_DATA });
    const { mountInstagramFeed } = getModule();
    const el = document.createElement('div');
    el.dataset.widgetKey = 'test-key-123';
    document.body.appendChild(el);
    mountInstagramFeed(el);
    expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/instagram-feed?widget_key=test-key-123');
    el.remove();
  });

  test('shows error if data-widget-key is missing', () => {
    global.fetch.mockResolvedValue({ json: async () => MOCK_DATA });
    const { mountInstagramFeed } = getModule();
    const el = document.createElement('div');
    document.body.appendChild(el);
    mountInstagramFeed(el);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(el.textContent).toContain('data-widget-key');
    el.remove();
  });

  test('shows loading state immediately', () => {
    global.fetch.mockResolvedValue({ json: async () => MOCK_DATA });
    const { mountInstagramFeed } = getModule();
    const el = document.createElement('div');
    el.dataset.widgetKey = 'test-key-123';
    document.body.appendChild(el);
    mountInstagramFeed(el);
    expect(el.innerHTML).toContain('Loading feed');
    el.remove();
  });

  test('injects styles into document head', () => {
    global.fetch.mockResolvedValue({ json: async () => MOCK_DATA });
    const { mountInstagramFeed } = getModule();
    const el = document.createElement('div');
    el.dataset.widgetKey = 'test-key-123';
    document.body.appendChild(el);
    mountInstagramFeed(el);
    expect(document.getElementById('sf-ig-styles')).not.toBeNull();
    el.remove();
  });

  test('renders error message on fetch failure', async () => {
    global.fetch.mockRejectedValue(new Error('network error'));
    const { mountInstagramFeed } = getModule();
    const el = document.createElement('div');
    el.dataset.widgetKey = 'test-key-123';
    document.body.appendChild(el);
    mountInstagramFeed(el);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.textContent).toContain('Could not load Instagram feed');
    el.remove();
  });

  test('renders profile handle and follow button after fetch', async () => {
    global.fetch.mockResolvedValue({ json: async () => MOCK_DATA });
    const { mountInstagramFeed } = getModule();
    const el = document.createElement('div');
    el.dataset.widgetKey = 'test-key-123';
    document.body.appendChild(el);
    mountInstagramFeed(el);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.innerHTML).toContain('@alocalx');
    expect(el.innerHTML).toContain('Follow');
    el.remove();
  });

  test('renders video icon for VIDEO posts', async () => {
    global.fetch.mockResolvedValue({ json: async () => MOCK_DATA });
    const { mountInstagramFeed } = getModule();
    const el = document.createElement('div');
    el.dataset.widgetKey = 'test-key-123';
    document.body.appendChild(el);
    mountInstagramFeed(el);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.querySelector('.sf-ig-video-icon')).not.toBeNull();
    el.remove();
  });

  test('renders VIDEO post with null thumbnail using media_url fallback', async () => {
    const dataWithNullThumb = {
      profile: MOCK_DATA.profile,
      posts: [{
        id: '3',
        media_type: 'VIDEO',
        media_url: 'https://example.com/video.mp4',
        thumbnail_url: null,
        permalink: 'https://www.instagram.com/p/ghi/',
      }],
    };
    global.fetch.mockResolvedValue({ json: async () => dataWithNullThumb });
    const { mountInstagramFeed } = getModule();
    const el = document.createElement('div');
    el.dataset.widgetKey = 'test-key-123';
    document.body.appendChild(el);
    mountInstagramFeed(el);
    await new Promise(resolve => setTimeout(resolve, 10));
    const img = el.querySelector('.sf-ig-post img');
    expect(img.getAttribute('src')).toBe('https://example.com/video.mp4');
    el.remove();
  });
});
