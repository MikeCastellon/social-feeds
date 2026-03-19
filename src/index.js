// src/index.js
const { mountWidgets } = require('./core/mount.js');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountWidgets);
} else {
  mountWidgets();
}
