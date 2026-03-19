// src/core/mount.js
const { mountGoogleReviews } = require('../google-reviews/index.js');
const { mountInstagramFeed } = require('../instagram-feed/index.js');

const WIDGETS = {
  'google-reviews': mountGoogleReviews,
  'instagram-feed': mountInstagramFeed,
};

function mountWidgets() {
  const elements = document.querySelectorAll('[data-widget]');
  elements.forEach((el) => {
    const widgetName = el.dataset.widget;
    const mount = WIDGETS[widgetName];
    if (mount) {
      mount(el);
    } else {
      console.warn(`[SocialFeeds] Unknown widget: "${widgetName}"`);
    }
  });
}

module.exports = { mountWidgets };
