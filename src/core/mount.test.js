/**
 * @jest-environment jsdom
 */
// src/core/mount.test.js

const mockGoogleReviews = jest.fn();
const mockInstagramFeed = jest.fn();

jest.mock('../google-reviews/index.js', () => ({
  mountGoogleReviews: mockGoogleReviews,
}));
jest.mock('../instagram-feed/index.js', () => ({
  mountInstagramFeed: mockInstagramFeed,
}));

const { mountWidgets } = require('./mount.js');

describe('mountWidgets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('mounts google-reviews widget', () => {
    document.body.innerHTML = '<div data-widget="google-reviews" data-place-id="abc"></div>';
    mountWidgets();
    expect(mockGoogleReviews).toHaveBeenCalledTimes(1);
  });

  test('mounts instagram-feed widget', () => {
    document.body.innerHTML = '<div data-widget="instagram-feed" data-username="test"></div>';
    mountWidgets();
    expect(mockInstagramFeed).toHaveBeenCalledTimes(1);
  });

  test('warns on unknown widget', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = '<div data-widget="unknown"></div>';
    mountWidgets();
    expect(warn).toHaveBeenCalledWith('[SocialFeeds] Unknown widget: "unknown"');
    warn.mockRestore();
  });
});
