const { styles } = require('./styles.js');

function mountInstagramFeed(el) {
  var widgetKey = el.dataset.widgetKey;
  if (!widgetKey) {
    el.textContent = 'data-widget-key is required';
    return;
  }

  if (!document.getElementById('sf-ig-styles')) {
    var style = document.createElement('style');
    style.id = 'sf-ig-styles';
    style.textContent = styles;
    document.head.appendChild(style);
  }

  el.innerHTML = '<div class="sf-ig-wrap"><div class="sf-ig-loading">Loading feed...</div></div>';

  fetch('/.netlify/functions/instagram-feed?widget_key=' + encodeURIComponent(widgetKey))
    .then(function(r) { return r.json(); })
    .then(function(data) { renderFeed(el, data); })
    .catch(function() {
      var wrap = el.querySelector('.sf-ig-wrap');
      if (wrap) wrap.innerHTML = 'Could not load Instagram feed.';
    });
}

function renderFeed(el, data) {
  var profile = data.profile;
  var posts = data.posts;
  var wrap = el.querySelector('.sf-ig-wrap');

  var postsHTML = posts.map(function(post) {
    var imgSrc = post.media_type === 'VIDEO'
      ? (post.thumbnail_url || post.media_url || '')
      : (post.media_url || '');
    var isVideo = post.media_type === 'VIDEO';
    return '<a class="sf-ig-post" href="' + post.permalink + '" target="_blank" rel="noopener">' +
      '<img src="' + imgSrc + '" alt="Instagram post" loading="lazy">' +
      (isVideo ? '<span class="sf-ig-video-icon">&#9654;</span>' : '') +
      '</a>';
  }).join('');

  wrap.innerHTML =
    '<div class="sf-ig-header">' +
    '<div class="sf-ig-avatar-ring">' +
    '<img src="' + profile.profile_picture_url + '" alt="' + profile.username + '" onerror="this.onerror=null;this.src=\'\'">' +
    '</div>' +
    '<div class="sf-ig-meta">' +
    '<div class="sf-ig-handle">@' + profile.username + '</div>' +
    '<div class="sf-ig-counts">' +
    '<span class="sf-ig-count-item"><strong>' + profile.media_count + '</strong> Posts</span>' +
    '<span class="sf-ig-count-item"><strong>' + profile.followers_count + '</strong> Followers</span>' +
    '<span class="sf-ig-count-item"><strong>' + profile.follows_count + '</strong> Following</span>' +
    '</div></div>' +
    '<a class="sf-ig-follow-btn" href="https://instagram.com/' + profile.username + '" target="_blank" rel="noopener">Follow</a>' +
    '</div>' +
    '<div class="sf-ig-grid">' + postsHTML + '</div>';
}

module.exports = { mountInstagramFeed };
