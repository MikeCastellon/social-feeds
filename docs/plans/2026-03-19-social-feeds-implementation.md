# Social Feeds Widgets Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build two self-hosted embeddable JS widgets (Google Reviews carousel + Instagram Feed grid) that replicate Elfsight's look, hosted on Netlify with serverless API proxies.

**Architecture:** A single `widgets.js` bundle is built from vanilla JS source via esbuild. On load, it scans the DOM for `[data-widget]` divs and mounts the matching widget. Each widget fetches data from a Netlify Function that proxies the real API, keeping credentials out of the browser.

**Tech Stack:** Vanilla JS, esbuild (bundler), Jest (tests), Netlify Functions (Node.js 18), Google Places API, Instagram Graph API.

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `netlify.toml`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/core/mount.js`
- Create: `src/index.js`

**Step 1: Initialize package.json**

```bash
cd C:/Users/mikec/SocialFeeds
npm init -y
npm install --save-dev esbuild jest
```

**Step 2: Update package.json scripts**

Replace the `scripts` section in `package.json`:

```json
{
  "name": "social-feeds",
  "version": "1.0.0",
  "scripts": {
    "build": "esbuild src/index.js --bundle --minify --outfile=public/widgets.js",
    "build:dev": "esbuild src/index.js --bundle --sourcemap --outfile=public/widgets.js",
    "watch": "esbuild src/index.js --bundle --sourcemap --outfile=public/widgets.js --watch",
    "test": "jest"
  },
  "jest": {
    "testEnvironment": "node"
  },
  "devDependencies": {}
}
```

**Step 3: Create netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = "public"
  functions = "netlify/functions"

[dev]
  command = "npm run watch"
  port = 8888

[[headers]]
  for = "/widgets.js"
  [headers.values]
    Cache-Control = "public, max-age=300"
    Access-Control-Allow-Origin = "*"
```

**Step 4: Create .env.example**

```
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
INSTAGRAM_ACCESS_TOKEN=your_instagram_long_lived_token_here
```

**Step 5: Create .gitignore**

```
node_modules/
public/widgets.js
.env
.netlify/
```

**Step 6: Create src/index.js**

```js
import { mountWidgets } from './core/mount.js';

// Auto-mount on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountWidgets);
} else {
  mountWidgets();
}
```

**Step 7: Create src/core/mount.js**

```js
import { mountGoogleReviews } from '../google-reviews/index.js';
import { mountInstagramFeed } from '../instagram-feed/index.js';

const WIDGETS = {
  'google-reviews': mountGoogleReviews,
  'instagram-feed': mountInstagramFeed,
};

export function mountWidgets() {
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
```

**Step 8: Create public/ directory and placeholder**

```bash
mkdir -p public
echo "<!-- placeholder -->" > public/index.html
```

**Step 9: Write test for mount.js**

Create `src/core/mount.test.js`:

```js
const { JSDOM } = require('jsdom');

// Mock widget mounters
const mockGoogleReviews = jest.fn();
const mockInstagramFeed = jest.fn();

jest.mock('../google-reviews/index.js', () => ({
  mountGoogleReviews: mockGoogleReviews,
}));
jest.mock('../instagram-feed/index.js', () => ({
  mountInstagramFeed: mockInstagramFeed,
}));

// Re-import after mocks
const { mountWidgets } = require('./mount.js');

describe('mountWidgets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const dom = new JSDOM('<!DOCTYPE html><body></body>');
    global.document = dom.window.document;
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
  });
});
```

Install jsdom: `npm install --save-dev jest-environment-jsdom jsdom`

**Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: project scaffold with mount system"
```

---

## Task 2: Google Reviews — Netlify Function

**Files:**
- Create: `netlify/functions/google-reviews.js`
- Create: `netlify/functions/google-reviews.test.js`

**Step 1: Write the failing test**

Create `netlify/functions/google-reviews.test.js`:

```js
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
```

**Step 2: Run test — expect FAIL**

```bash
npx jest netlify/functions/google-reviews.test.js
```
Expected: FAIL — "Cannot find module './google-reviews'"

**Step 3: Implement the function**

Create `netlify/functions/google-reviews.js`:

```js
const FIELDS = 'rating,user_ratings_total,url,reviews';

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const { place_id } = event.queryStringParameters || {};
  if (!place_id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'place_id is required' }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${FIELDS}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Google API error' }) };
  }

  const data = await response.json();
  const { rating, user_ratings_total, url: mapsUrl, reviews } = data.result;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ rating, user_ratings_total, url: mapsUrl, reviews }),
  };
};
```

**Step 4: Run test — expect PASS**

```bash
npx jest netlify/functions/google-reviews.test.js
```
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add netlify/functions/google-reviews.js netlify/functions/google-reviews.test.js
git commit -m "feat: google reviews netlify function with tests"
```

---

## Task 3: Instagram Feed — Netlify Function

**Files:**
- Create: `netlify/functions/instagram-feed.js`
- Create: `netlify/functions/instagram-feed.test.js`

**Step 1: Write the failing test**

Create `netlify/functions/instagram-feed.test.js`:

```js
global.fetch = jest.fn();
const { handler } = require('./instagram-feed');

describe('instagram-feed function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INSTAGRAM_ACCESS_TOKEN = 'test-token';
  });

  test('returns profile and posts', async () => {
    // First call: profile
    // Second call: media
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '123',
          name: 'Roofing & Construction',
          username: 'alocalx',
          profile_picture_url: 'https://example.com/avatar.jpg',
          media_count: 76,
          followers_count: 739,
          follows_count: 236,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'post1',
              media_type: 'IMAGE',
              media_url: 'https://example.com/img.jpg',
              thumbnail_url: null,
              permalink: 'https://www.instagram.com/p/abc/',
              timestamp: '2024-01-01T00:00:00Z',
            },
          ],
        }),
      });

    const result = await handler({ queryStringParameters: {} });
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.profile.username).toBe('alocalx');
    expect(body.posts).toHaveLength(1);
  });

  test('returns 502 on API error', async () => {
    global.fetch.mockResolvedValue({ ok: false });
    const result = await handler({ queryStringParameters: {} });
    expect(result.statusCode).toBe(502);
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npx jest netlify/functions/instagram-feed.test.js
```

**Step 3: Implement the function**

Create `netlify/functions/instagram-feed.js`:

```js
const PROFILE_FIELDS = 'id,name,username,profile_picture_url,media_count,followers_count,follows_count';
const MEDIA_FIELDS = 'id,media_type,media_url,thumbnail_url,permalink,timestamp';

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const base = 'https://graph.instagram.com/me';

  const profileRes = await fetch(`${base}?fields=${PROFILE_FIELDS}&access_token=${token}`);
  if (!profileRes.ok) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram API error' }) };
  }
  const profile = await profileRes.json();

  const mediaRes = await fetch(`${base}/media?fields=${MEDIA_FIELDS}&limit=24&access_token=${token}`);
  if (!mediaRes.ok) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram media error' }) };
  }
  const mediaData = await mediaRes.json();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ profile, posts: mediaData.data }),
  };
};
```

**Step 4: Run test — expect PASS**

```bash
npx jest netlify/functions/instagram-feed.test.js
```

**Step 5: Commit**

```bash
git add netlify/functions/instagram-feed.js netlify/functions/instagram-feed.test.js
git commit -m "feat: instagram feed netlify function with tests"
```

---

## Task 4: Google Reviews Widget — UI

**Files:**
- Create: `src/google-reviews/styles.js`
- Create: `src/google-reviews/index.js`
- Create: `src/google-reviews/index.test.js`

**Step 1: Create styles.js**

```js
export const styles = `
  .sf-gr-wrap {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 100%;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    box-sizing: border-box;
  }
  .sf-gr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .sf-gr-header-left { display: flex; flex-direction: column; gap: 4px; }
  .sf-gr-logo { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 16px; }
  .sf-gr-rating-row { display: flex; align-items: center; gap: 8px; font-size: 15px; }
  .sf-gr-score { font-weight: 700; font-size: 18px; }
  .sf-gr-stars { color: #FBBC04; letter-spacing: 2px; }
  .sf-gr-count { color: #666; }
  .sf-gr-btn {
    background: #1a73e8;
    color: #fff;
    border: none;
    border-radius: 24px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }
  .sf-gr-btn:hover { background: #1558b0; }
  .sf-gr-carousel { position: relative; overflow: hidden; }
  .sf-gr-track {
    display: flex;
    gap: 16px;
    transition: transform 0.3s ease;
  }
  .sf-gr-card {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    min-width: calc(25% - 12px);
    flex-shrink: 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    box-sizing: border-box;
  }
  .sf-gr-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .sf-gr-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0;
  }
  .sf-gr-avatar-initials {
    width: 40px; height: 40px; border-radius: 50%;
    background: #1a73e8; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 600; font-size: 14px; flex-shrink: 0;
  }
  .sf-gr-reviewer { display: flex; flex-direction: column; gap: 2px; }
  .sf-gr-name { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 4px; }
  .sf-gr-check { color: #1a73e8; font-size: 12px; }
  .sf-gr-time { color: #888; font-size: 12px; }
  .sf-gr-card-stars { color: #FBBC04; font-size: 14px; margin-bottom: 8px; }
  .sf-gr-text { font-size: 13px; color: #333; line-height: 1.5; }
  .sf-gr-readmore { color: #1a73e8; cursor: pointer; font-size: 13px; }
  .sf-gr-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: #fff; border: 1px solid #ddd; border-radius: 50%;
    width: 36px; height: 36px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; z-index: 2; box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  }
  .sf-gr-arrow:hover { background: #f5f5f5; }
  .sf-gr-prev { left: -18px; }
  .sf-gr-next { right: -18px; }
  .sf-gr-dots { display: flex; justify-content: center; gap: 6px; margin-top: 16px; }
  .sf-gr-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #ccc; cursor: pointer; border: none; padding: 0;
  }
  .sf-gr-dot.active { background: #1a73e8; }
  @media (max-width: 768px) {
    .sf-gr-card { min-width: calc(100% - 0px); }
  }
`;
```

**Step 2: Create src/google-reviews/index.js**

```js
import { styles } from './styles.js';

const GOOGLE_LOGO_SVG = `<svg width="80" height="26" viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
  <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
  <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
  <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
  <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
  <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
  <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
</svg>`;

function starsHTML(rating) {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function cardHTML(review) {
  const maxLen = 120;
  const short = review.text.length > maxLen;
  const displayText = short ? review.text.slice(0, maxLen) + '...' : review.text;
  const avatar = review.profile_photo_url
    ? `<img class="sf-gr-avatar" src="${review.profile_photo_url}" alt="${review.author_name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const initEl = `<div class="sf-gr-avatar-initials" ${review.profile_photo_url ? 'style="display:none"' : ''}>${initials(review.author_name)}</div>`;

  return `
    <div class="sf-gr-card">
      <div class="sf-gr-card-header">
        ${avatar}${initEl}
        <div class="sf-gr-reviewer">
          <div class="sf-gr-name">${review.author_name} <span class="sf-gr-check">✓</span></div>
          <div class="sf-gr-time">${review.relative_time_description}</div>
        </div>
      </div>
      <div class="sf-gr-card-stars">${starsHTML(review.rating)}</div>
      <div class="sf-gr-text">
        <span class="sf-gr-review-body">${displayText}</span>
        ${short ? `<span class="sf-gr-readmore"> Read more</span>` : ''}
      </div>
    </div>
  `;
}

export function mountGoogleReviews(el) {
  const placeId = el.dataset.placeId;
  if (!placeId) { el.textContent = 'Missing data-place-id'; return; }

  // Inject styles once
  if (!document.getElementById('sf-gr-styles')) {
    const style = document.createElement('style');
    style.id = 'sf-gr-styles';
    style.textContent = styles;
    document.head.appendChild(style);
  }

  el.innerHTML = `<div class="sf-gr-wrap"><div class="sf-gr-loading">Loading reviews...</div></div>`;

  fetch(`/.netlify/functions/google-reviews?place_id=${placeId}`)
    .then((r) => r.json())
    .then((data) => renderWidget(el, data))
    .catch(() => { el.querySelector('.sf-gr-wrap').innerHTML = 'Could not load reviews.'; });
}

function renderWidget(el, data) {
  const { rating, user_ratings_total, url, reviews } = data;
  const wrap = el.querySelector('.sf-gr-wrap');

  const cardsPerPage = window.innerWidth <= 768 ? 1 : 4;
  let page = 0;
  const totalPages = Math.ceil(reviews.length / cardsPerPage);

  wrap.innerHTML = `
    <div class="sf-gr-header">
      <div class="sf-gr-header-left">
        <div class="sf-gr-logo">${GOOGLE_LOGO_SVG} Reviews</div>
        <div class="sf-gr-rating-row">
          <span class="sf-gr-score">${rating.toFixed(1)}</span>
          <span class="sf-gr-stars">${starsHTML(rating)}</span>
          <span class="sf-gr-count">(${user_ratings_total})</span>
        </div>
      </div>
      <a class="sf-gr-btn" href="${url}" target="_blank" rel="noopener">Review us on Google</a>
    </div>
    <div class="sf-gr-carousel">
      <button class="sf-gr-arrow sf-gr-prev">&#8249;</button>
      <div class="sf-gr-track">${reviews.map(cardHTML).join('')}</div>
      <button class="sf-gr-arrow sf-gr-next">&#8250;</button>
    </div>
    <div class="sf-gr-dots">${Array.from({ length: totalPages }, (_, i) =>
      `<button class="sf-gr-dot${i === 0 ? ' active' : ''}" data-idx="${i}"></button>`
    ).join('')}</div>
  `;

  // Read more toggle
  wrap.querySelectorAll('.sf-gr-readmore').forEach((btn) => {
    btn.addEventListener('click', () => {
      const body = btn.previousElementSibling;
      const card = btn.closest('.sf-gr-card');
      const idx = [...wrap.querySelectorAll('.sf-gr-card')].indexOf(card);
      body.textContent = data.reviews[idx].text;
      btn.remove();
    });
  });

  const track = wrap.querySelector('.sf-gr-track');
  const dots = wrap.querySelectorAll('.sf-gr-dot');

  function goTo(p) {
    page = Math.max(0, Math.min(p, totalPages - 1));
    const pct = (page / totalPages) * 100;
    track.style.transform = `translateX(-${pct}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === page));
  }

  wrap.querySelector('.sf-gr-prev').addEventListener('click', () => goTo(page - 1));
  wrap.querySelector('.sf-gr-next').addEventListener('click', () => goTo(page + 1));
  dots.forEach((d) => d.addEventListener('click', () => goTo(+d.dataset.idx)));
}
```

**Step 3: Write a basic smoke test**

Create `src/google-reviews/index.test.js`:

```js
const { JSDOM } = require('jsdom');

describe('mountGoogleReviews', () => {
  let dom;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><head></head><body></body>');
    global.document = dom.window.document;
    global.window = dom.window;
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
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
      }),
    });
  });

  test('shows error when place_id missing', () => {
    const { mountGoogleReviews } = require('./index.js');
    const el = document.createElement('div');
    mountGoogleReviews(el);
    expect(el.textContent).toContain('Missing data-place-id');
  });

  test('calls fetch with place_id', () => {
    const { mountGoogleReviews } = require('./index.js');
    const el = document.createElement('div');
    el.dataset.placeId = 'ChIJtest';
    mountGoogleReviews(el);
    expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/google-reviews?place_id=ChIJtest');
  });
});
```

**Step 4: Run tests**

```bash
npx jest src/google-reviews/index.test.js
```

**Step 5: Commit**

```bash
git add src/google-reviews/
git commit -m "feat: google reviews widget UI with carousel"
```

---

## Task 5: Instagram Feed Widget — UI

**Files:**
- Create: `src/instagram-feed/styles.js`
- Create: `src/instagram-feed/index.js`
- Create: `src/instagram-feed/index.test.js`

**Step 1: Create styles.js**

```js
export const styles = `
  .sf-ig-wrap {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 100%;
    box-sizing: border-box;
  }
  .sf-ig-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #dbdbdb;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .sf-ig-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    object-fit: cover;
    border: 2px solid #dbdbdb;
  }
  .sf-ig-avatar-ring {
    width: 60px; height: 60px; border-radius: 50%;
    background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
    padding: 2px; flex-shrink: 0;
  }
  .sf-ig-avatar-ring img {
    width: 100%; height: 100%; border-radius: 50%;
    object-fit: cover; border: 2px solid #fff;
  }
  .sf-ig-meta { flex: 1; }
  .sf-ig-handle { font-weight: 600; font-size: 15px; }
  .sf-ig-counts { display: flex; gap: 20px; margin-top: 4px; font-size: 13px; color: #444; }
  .sf-ig-count-item strong { font-weight: 600; }
  .sf-ig-follow-btn {
    background: #0095f6; color: #fff; border: none;
    border-radius: 8px; padding: 8px 20px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    text-decoration: none;
  }
  .sf-ig-follow-btn:hover { background: #0074cc; }
  .sf-ig-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .sf-ig-post {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    cursor: pointer;
    background: #efefef;
  }
  .sf-ig-post img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.2s;
  }
  .sf-ig-post:hover img { transform: scale(1.04); }
  .sf-ig-video-icon {
    position: absolute; top: 8px; right: 8px;
    color: #fff; font-size: 18px;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  }
  @media (max-width: 600px) {
    .sf-ig-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;
```

**Step 2: Create src/instagram-feed/index.js**

```js
import { styles } from './styles.js';

export function mountInstagramFeed(el) {
  // Inject styles once
  if (!document.getElementById('sf-ig-styles')) {
    const style = document.createElement('style');
    style.id = 'sf-ig-styles';
    style.textContent = styles;
    document.head.appendChild(style);
  }

  el.innerHTML = `<div class="sf-ig-wrap"><div class="sf-ig-loading">Loading feed...</div></div>`;

  fetch(`/.netlify/functions/instagram-feed`)
    .then((r) => r.json())
    .then((data) => renderFeed(el, data))
    .catch(() => { el.querySelector('.sf-ig-wrap').innerHTML = 'Could not load Instagram feed.'; });
}

function renderFeed(el, data) {
  const { profile, posts } = data;
  const wrap = el.querySelector('.sf-ig-wrap');

  const postsHTML = posts.map((post) => {
    const imgSrc = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
    const isVideo = post.media_type === 'VIDEO' || post.media_type === 'CAROUSEL_ALBUM';
    return `
      <a class="sf-ig-post" href="${post.permalink}" target="_blank" rel="noopener">
        <img src="${imgSrc}" alt="Instagram post" loading="lazy">
        ${isVideo ? '<span class="sf-ig-video-icon">▶</span>' : ''}
      </a>
    `;
  }).join('');

  wrap.innerHTML = `
    <div class="sf-ig-header">
      <div class="sf-ig-avatar-ring">
        <img src="${profile.profile_picture_url}" alt="${profile.username}" onerror="this.src=''">
      </div>
      <div class="sf-ig-meta">
        <div class="sf-ig-handle">@${profile.username}</div>
        <div class="sf-ig-counts">
          <span class="sf-ig-count-item"><strong>${profile.media_count}</strong> Posts</span>
          <span class="sf-ig-count-item"><strong>${profile.followers_count}</strong> Followers</span>
          <span class="sf-ig-count-item"><strong>${profile.follows_count}</strong> Following</span>
        </div>
      </div>
      <a class="sf-ig-follow-btn" href="https://instagram.com/${profile.username}" target="_blank" rel="noopener">Follow</a>
    </div>
    <div class="sf-ig-grid">${postsHTML}</div>
  `;
}
```

**Step 3: Write smoke test**

Create `src/instagram-feed/index.test.js`:

```js
const { JSDOM } = require('jsdom');

describe('mountInstagramFeed', () => {
  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><head></head><body></body>');
    global.document = dom.window.document;
    global.window = dom.window;
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
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
        ],
      }),
    });
  });

  test('calls instagram-feed function', () => {
    const { mountInstagramFeed } = require('./index.js');
    const el = document.createElement('div');
    mountInstagramFeed(el);
    expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/instagram-feed');
  });
});
```

**Step 4: Run tests**

```bash
npx jest src/instagram-feed/index.test.js
```

**Step 5: Commit**

```bash
git add src/instagram-feed/
git commit -m "feat: instagram feed widget UI with grid layout"
```

---

## Task 6: Build, Test Page & Deploy

**Files:**
- Create: `public/index.html` (test page)
- Create: `.env` (local secrets, gitignored)

**Step 1: Create test page**

Replace `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Social Feeds Widgets</title>
  <style>
    body { font-family: sans-serif; max-width: 1100px; margin: 40px auto; padding: 0 20px; }
    section { margin-bottom: 60px; }
  </style>
</head>
<body>
  <h1>Widget Test Page</h1>

  <section>
    <h2>Google Reviews</h2>
    <div data-widget="google-reviews" data-place-id="YOUR_PLACE_ID_HERE"></div>
  </section>

  <section>
    <h2>Instagram Feed</h2>
    <div data-widget="instagram-feed"></div>
  </section>

  <script src="/widgets.js"></script>
</body>
</html>
```

**Step 2: Run full test suite**

```bash
npx jest
```
Expected: All tests pass.

**Step 3: Build the bundle**

```bash
npm run build
```
Expected: `public/widgets.js` created.

**Step 4: Set up .env for local dev**

Create `.env` (this file is gitignored):
```
GOOGLE_PLACES_API_KEY=<your key from Google Cloud Console>
INSTAGRAM_ACCESS_TOKEN=<your long-lived token>
```

**Step 5: Test locally with Netlify Dev**

```bash
npx netlify dev
```
Open `http://localhost:8888` — both widgets should render with live data.

**Step 6: Push and deploy to Netlify**

```bash
# Push to GitHub first (create repo if needed)
git remote add origin https://github.com/YOUR_USERNAME/social-feeds.git
git push -u origin main
```

Then in Netlify dashboard:
1. Connect the GitHub repo
2. Add env vars: `GOOGLE_PLACES_API_KEY` and `INSTAGRAM_ACCESS_TOKEN`
3. Deploy

**Step 7: Final commit**

```bash
git add public/index.html
git commit -m "feat: add widget test page, ready for deployment"
```

---

## API Setup Reference

### Google Places API Key
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable "Places API"
3. Create API key → Restrict to "Places API" + your Netlify domain
4. Copy key → add as `GOOGLE_PLACES_API_KEY` in Netlify env vars

### Get Your Place ID
Go to: `https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder`
Search your business name → copy the Place ID (starts with `ChIJ...`)

### Instagram Long-Lived Token
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create App → Add "Instagram Graph API" product
3. Connect your Instagram Business/Creator account
4. Generate a short-lived token → exchange for long-lived token (valid 60 days)
5. Add as `INSTAGRAM_ACCESS_TOKEN` in Netlify env vars

### Embed Snippet (copy-paste anywhere)
```html
<!-- Google Reviews -->
<div data-widget="google-reviews" data-place-id="YOUR_PLACE_ID"></div>

<!-- Instagram Feed -->
<div data-widget="instagram-feed"></div>

<!-- Load once, anywhere on the page -->
<script src="https://YOUR-SITE.netlify.app/widgets.js"></script>
```
