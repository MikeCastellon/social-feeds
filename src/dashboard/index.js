const { supabase } = require('./auth.js');

const isLogin = window.location.pathname.includes('login');
const isDashboard = window.location.pathname.includes('dashboard');

// ── AUTH GUARD ──────────────────────────────────────────────
supabase.auth.getSession().then(function(ref) {
  var session = ref.data.session;
  if (isDashboard && !session) {
    window.location.href = '/login.html';
    return;
  }
  if (isLogin && session) {
    window.location.href = '/dashboard.html';
    return;
  }
  if (isLogin) initLogin();
  if (isDashboard) initDashboard(session);
});

// ── LOGIN PAGE ───────────────────────────────────────────────
function initLogin() {
  var btnGoogle = document.getElementById('btnGoogle');
  var btnSendCode = document.getElementById('btnSendCode');
  var btnVerify = document.getElementById('btnVerify');
  var phoneInput = document.getElementById('phoneInput');
  var otpInput = document.getElementById('otpInput');
  var otpSection = document.getElementById('otpSection');
  var msg = document.getElementById('msg');

  btnGoogle.addEventListener('click', function() {
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard.html' } });
  });

  btnSendCode.addEventListener('click', async function() {
    var phone = phoneInput.value.trim();
    if (!phone) { msg.textContent = 'Please enter your phone number'; return; }
    msg.textContent = '';
    btnSendCode.textContent = 'Sending...';
    var ref = await supabase.auth.signInWithOtp({ phone: phone });
    btnSendCode.textContent = 'Send Code';
    if (ref.error) { msg.textContent = ref.error.message; return; }
    otpSection.style.display = 'block';
    document.getElementById('phoneSection').querySelector('button').style.display = 'none';
  });

  btnVerify.addEventListener('click', async function() {
    var phone = phoneInput.value.trim();
    var token = otpInput.value.trim();
    btnVerify.textContent = 'Verifying...';
    var ref = await supabase.auth.verifyOtp({ phone: phone, token: token, type: 'sms' });
    btnVerify.textContent = 'Verify';
    if (ref.error) { msg.textContent = ref.error.message; return; }
    window.location.href = '/dashboard.html';
  });
}

// ── DASHBOARD PAGE ───────────────────────────────────────────
function initDashboard(session) {
  var userId = session.user.id;
  var selectedType = 'google-reviews';
  var selectedPlace = null;

  // Sign out
  document.getElementById('btnLogout').addEventListener('click', async function() {
    await supabase.auth.signOut();
    window.location.href = '/login.html';
  });

  // Load widgets
  loadWidgets();

  async function loadWidgets() {
    var grid = document.getElementById('widgetGrid');
    var ref = await supabase.from('widget_configs').select('*').order('created_at', { ascending: false });
    if (ref.error || !ref.data.length) {
      grid.innerHTML = '<div class="empty">No widgets yet. Click "+ New Widget" to get started.</div>';
      return;
    }
    grid.innerHTML = ref.data.map(function(w) {
      var snippet = w.type === 'google-reviews'
        ? '<div data-widget="google-reviews" data-widget-key="' + w.widget_key + '"></div>'
        : '<div data-widget="instagram-feed" data-widget-key="' + w.widget_key + '"></div>';
      var scriptTag = '<script src="https://socialfeeds.netlify.app/widgets.js"><\/script>';
      return '<div class="widget-card">' +
        '<h3>' + (w.label || w.type) + '</h3>' +
        '<div class="type">' + w.type + (w.instagram_username ? ' · @' + w.instagram_username : '') + '</div>' +
        '<div class="snippet">' + snippet + '\n' + scriptTag + '</div>' +
        '<button class="btn-copy" data-snippet="' + encodeURIComponent(snippet + '\n' + scriptTag) + '">Copy Embed Code</button>' +
        '</div>';
    }).join('');

    grid.querySelectorAll('.btn-copy').forEach(function(btn) {
      btn.addEventListener('click', function() {
        navigator.clipboard.writeText(decodeURIComponent(btn.dataset.snippet));
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy Embed Code'; }, 2000);
      });
    });
  }

  // Modal
  var modal = document.getElementById('modal');
  document.getElementById('btnNew').addEventListener('click', function() { modal.classList.add('open'); });
  document.getElementById('btnCloseModal').addEventListener('click', function() { modal.classList.remove('open'); });

  // Type toggle
  document.querySelectorAll('.modal-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      selectedType = btn.dataset.type;
      document.querySelectorAll('.modal-btn').forEach(function(b) { b.classList.toggle('active', b === btn); });
      document.getElementById('googleForm').style.display = selectedType === 'google-reviews' ? 'block' : 'none';
      document.getElementById('instagramForm').style.display = selectedType === 'instagram-feed' ? 'block' : 'none';
    });
  });

  // Google search
  var searchInput = document.getElementById('searchInput');
  var searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    if (searchInput.value.length < 3) return;
    searchTimeout = setTimeout(function() {
      fetch('/.netlify/functions/places-search?q=' + encodeURIComponent(searchInput.value))
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var results = document.getElementById('searchResults');
          if (!data.results || !data.results.length) { results.style.display = 'none'; return; }
          results.style.display = 'block';
          results.innerHTML = data.results.map(function(p) {
            return '<div class="search-result" data-place-id="' + p.place_id + '" data-name="' + encodeURIComponent(p.name) + '">' +
              '<div class="name">' + p.name + '</div>' +
              '<div class="addr">' + (p.address || '') + (p.rating ? ' · ★ ' + p.rating + ' (' + (p.review_count || 0) + ')' : '') + '</div>' +
              '</div>';
          }).join('');
          results.querySelectorAll('.search-result').forEach(function(el) {
            el.addEventListener('click', function() {
              selectedPlace = { place_id: el.dataset.placeId, name: decodeURIComponent(el.dataset.name) };
              searchInput.value = selectedPlace.name;
              results.style.display = 'none';
              document.getElementById('btnSaveGoogle').style.display = 'block';
            });
          });
        });
    }, 400);
  });

  // Save Google Reviews widget
  document.getElementById('btnSaveGoogle').addEventListener('click', async function() {
    if (!selectedPlace) return;
    var btn = document.getElementById('btnSaveGoogle');
    btn.textContent = 'Saving...';
    await fetch('/.netlify/functions/widget-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, type: 'google-reviews', place_id: selectedPlace.place_id, label: selectedPlace.name }),
    });
    btn.textContent = 'Add Widget';
    modal.classList.remove('open');
    loadWidgets();
  });

  // Connect Instagram
  document.getElementById('btnConnectInstagram').addEventListener('click', function() {
    var appId = '{{FB_APP_ID}}'; // replaced at build time
    var redirectUri = encodeURIComponent(window.location.origin + '/.netlify/functions/instagram-auth-callback');
    var state = encodeURIComponent(userId);
    var scope = 'user_profile,user_media';
    window.location.href = 'https://api.instagram.com/oauth/authorize?client_id=' + appId + '&redirect_uri=' + redirectUri + '&scope=' + scope + '&response_type=code&state=' + state;
  });

  // Handle redirect back from Instagram
  var params = new URLSearchParams(window.location.search);
  if (params.get('connected') === 'instagram') {
    loadWidgets();
  }
}
