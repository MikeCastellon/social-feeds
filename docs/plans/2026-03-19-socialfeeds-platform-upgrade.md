# Social Feeds Platform Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade SocialFeeds from a single-account widget bundle into a multi-tenant platform with auth, a dashboard, Instagram OAuth, Google Reviews search, and Supabase-backed widget serving.

**Architecture:** Supabase handles auth (phone OTP + Google OAuth) and stores widget configs per user. The existing Netlify Functions are updated to look up credentials from Supabase using a `widget_key` instead of env vars. A new vanilla JS dashboard UI is added alongside the existing widget bundle.

**Tech Stack:** Vanilla JS, esbuild, Jest, Netlify Functions (Node 18), Supabase (auth + postgres), @supabase/supabase-js, Twilio (SMS via Supabase), Instagram Graph API OAuth, Google Places API.

---

## Prerequisites (Manual Steps — Do Before Coding)

### A. Create Supabase Project
1. Go to supabase.com → New project
2. Name it `social-feeds-platform`, pick a region, set a strong DB password
3. Copy from Project Settings → API:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### B. Enable Google OAuth in Supabase
1. Supabase dashboard → Authentication → Providers → Google
2. Enable it, add your Google OAuth Client ID + Secret
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### C. Enable Phone Auth in Supabase
1. Authentication → Providers → Phone → Enable
2. Set SMS provider to Twilio
3. Add Twilio Account SID, Auth Token, From number

### D. Create Facebook App for Instagram OAuth
1. developers.facebook.com → Create App → Business type
2. Add product: Instagram Graph API
3. Set Valid OAuth Redirect URIs: `https://socialfeeds.netlify.app/.netlify/functions/instagram-auth-callback`
4. Copy App ID → `FB_APP_ID`, App Secret → `FB_APP_SECRET`

### E. Add Netlify Environment Variables (in Netlify dashboard for SocialFeeds site)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FB_APP_ID=your_facebook_app_id
FB_APP_SECRET=your_facebook_app_secret
GOOGLE_PLACES_API_KEY=your_existing_key
```

Also update local `.env`:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FB_APP_ID=your_facebook_app_id
FB_APP_SECRET=your_facebook_app_secret
GOOGLE_PLACES_API_KEY=your_existing_key
```

---

## Task 1: Supabase Schema + Install Dependencies

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Modify: `package.json`

**Step 1: Install Supabase client**
```bash
cd "C:/Users/mikec/SocialFeeds"
npm install @supabase/supabase-js
```

**Step 2: Create migration file**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- Profiles (auto-created on signup via trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  phone text,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Widget configurations
CREATE TABLE IF NOT EXISTS widget_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('google-reviews', 'instagram-feed')),
  widget_key text UNIQUE NOT NULL,
  label text,
  place_id text,
  instagram_access_token text,
  instagram_username text,
  instagram_token_expiry timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sites (used by Website Creator)
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_info jsonb NOT NULL DEFAULT '{}',
  template_id text,
  generated_content jsonb NOT NULL DEFAULT '{}',
  widget_config_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, phone)
  VALUES (NEW.id, NEW.phone)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Profiles: users see/edit only their own
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Widget configs: users manage their own
CREATE POLICY "widget_configs_own" ON widget_configs
  FOR ALL USING (auth.uid() = user_id);

-- Sites: users manage their own
CREATE POLICY "sites_own" ON sites
  FOR ALL USING (auth.uid() = user_id);
```

**Step 3: Run migration in Supabase**
Go to Supabase dashboard → SQL Editor → paste the contents of `001_initial_schema.sql` → Run.
Expected: No errors, tables created.

**Step 4: Create Supabase client helper**

Create `src/lib/supabase.js`:
```js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
module.exports = { supabase };
```

Create `src/lib/supabaseAdmin.js` (server-side only, uses service role):
```js
const { createClient } = require('@supabase/supabase-js');

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase admin credentials');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

module.exports = { getAdminClient };
```

**Step 5: Update package.json build scripts**

Update `package.json` to build both widget bundle and dashboard bundle:
```json
{
  "scripts": {
    "build": "npm run build:widgets && npm run build:dashboard",
    "build:widgets": "esbuild src/index.js --bundle --minify --outfile=public/widgets.js",
    "build:dashboard": "esbuild src/dashboard/index.js --bundle --minify --define:process.env.SUPABASE_URL='\"\"' --define:process.env.SUPABASE_ANON_KEY='\"\"' --outfile=public/dashboard.js",
    "build:dev": "npm run build:widgets:dev && npm run build:dashboard:dev",
    "build:widgets:dev": "esbuild src/index.js --bundle --sourcemap --outfile=public/widgets.js",
    "build:dashboard:dev": "esbuild src/dashboard/index.js --bundle --sourcemap --outfile=public/dashboard.js",
    "watch": "concurrently \"npm run build:widgets:dev -- --watch\" \"npm run build:dashboard:dev -- --watch\"",
    "test": "jest"
  }
}
```

Install concurrently: `npm install --save-dev concurrently`

**Step 6: Write test for supabaseAdmin helper**

Create `src/lib/supabaseAdmin.test.js`:
```js
describe('getAdminClient', () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    process.env.SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    jest.resetModules();
  });

  test('throws when env vars missing', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    jest.resetModules();
    const { getAdminClient } = require('./supabaseAdmin');
    expect(() => getAdminClient()).toThrow('Missing Supabase admin credentials');
  });

  test('returns client when env vars present', () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    jest.resetModules();
    const { getAdminClient } = require('./supabaseAdmin');
    const client = getAdminClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });
});
```

**Step 7: Run tests**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest src/lib/supabaseAdmin.test.js --no-coverage
```
Expected: 2 tests pass.

**Step 8: Commit**
```bash
cd "C:/Users/mikec/SocialFeeds"
git add supabase/ src/lib/ package.json package-lock.json
git commit -m "feat: add supabase schema, client helpers, and dual build"
```

---

## Task 2: widget-lookup Netlify Function

This function is the core of multi-tenant widget serving. Given a `widget_key`, return the associated credentials from Supabase.

**Files:**
- Create: `netlify/functions/widget-lookup.js`
- Create: `netlify/functions/widget-lookup.test.js`

**Step 1: Write failing test**

Create `netlify/functions/widget-lookup.test.js`:
```js
jest.mock('../src/lib/supabaseAdmin', () => ({
  getAdminClient: jest.fn(),
}));

const { getAdminClient } = require('../src/lib/supabaseAdmin');
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
```

**Step 2: Run test — expect FAIL**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest netlify/functions/widget-lookup.test.js --no-coverage
```

**Step 3: Implement**

Create `netlify/functions/widget-lookup.js`:
```js
const { getAdminClient } = require('../src/lib/supabaseAdmin');

async function getWidgetConfig(widgetKey) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('widget_configs')
    .select('*')
    .eq('widget_key', widgetKey)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(error.message);
  }
  return data;
}

module.exports = { getWidgetConfig };
```

**Step 4: Run test — expect PASS**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest netlify/functions/widget-lookup.test.js --no-coverage
```
Expected: 3 tests pass.

**Step 5: Commit**
```bash
git add netlify/functions/widget-lookup.js netlify/functions/widget-lookup.test.js
git commit -m "feat: widget-lookup function for supabase credential resolution"
```

---

## Task 3: Update google-reviews.js to use Supabase

Switch from `GOOGLE_PLACES_API_KEY` env var + `place_id` query param to `widget_key` lookup.

**Files:**
- Modify: `netlify/functions/google-reviews.js`
- Modify: `netlify/functions/google-reviews.test.js`

**Step 1: Update google-reviews.js**

Replace the entire file:
```js
const FIELDS = 'rating,user_ratings_total,url,reviews';
const { getWidgetConfig } = require('./widget-lookup');

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, OPTIONS' }, body: '' };
  }

  const { widget_key } = event.queryStringParameters || {};
  if (!widget_key) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'widget_key is required' }) };
  }

  let config;
  try {
    config = await getWidgetConfig(widget_key);
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error' }) };
  }

  if (!config || config.type !== 'google-reviews') {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Widget not found' }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(config.place_id)}&fields=${FIELDS}&key=${apiKey}`;

  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Google API unavailable' }) };
  }

  if (!response.ok) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Google API error' }) };
  }

  const data = await response.json();
  if (!data.result || data.status !== 'OK') {
    return { statusCode: 502, headers, body: JSON.stringify({ error: `Google Places error: ${data.status}` }) };
  }

  const { rating, user_ratings_total, url: mapsUrl, reviews } = data.result;
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ rating, user_ratings_total, url: mapsUrl, reviews }),
  };
};
```

**Step 2: Replace google-reviews.test.js**

```js
jest.mock('./widget-lookup', () => ({ getWidgetConfig: jest.fn() }));
global.fetch = jest.fn();

const { getWidgetConfig } = require('./widget-lookup');
const { handler } = require('./google-reviews');

const BASE_EVENT = { httpMethod: 'GET', queryStringParameters: {} };

describe('google-reviews function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  });

  test('returns 204 for OPTIONS', async () => {
    const r = await handler({ httpMethod: 'OPTIONS', queryStringParameters: {} });
    expect(r.statusCode).toBe(204);
  });

  test('returns 400 if widget_key missing', async () => {
    const r = await handler(BASE_EVENT);
    expect(r.statusCode).toBe(400);
  });

  test('returns 404 if widget not found', async () => {
    getWidgetConfig.mockResolvedValue(null);
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'bad' } });
    expect(r.statusCode).toBe(404);
  });

  test('returns 404 if widget is wrong type', async () => {
    getWidgetConfig.mockResolvedValue({ type: 'instagram-feed', widget_key: 'abc' });
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'abc' } });
    expect(r.statusCode).toBe(404);
  });

  test('returns 500 on database error', async () => {
    getWidgetConfig.mockRejectedValue(new Error('db error'));
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'abc' } });
    expect(r.statusCode).toBe(500);
  });

  test('returns 200 with review data', async () => {
    getWidgetConfig.mockResolvedValue({ type: 'google-reviews', widget_key: 'abc', place_id: 'ChIJtest' });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        result: {
          rating: 5.0,
          user_ratings_total: 172,
          url: 'https://maps.google.com/?cid=123',
          reviews: [{ author_name: 'Felix 787', rating: 5, relative_time_description: '18 days ago', text: 'Great!' }],
        },
      }),
    });
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'abc' } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.rating).toBe(5.0);
    expect(body.reviews).toHaveLength(1);
  });

  test('returns 502 on Google API failure', async () => {
    getWidgetConfig.mockResolvedValue({ type: 'google-reviews', widget_key: 'abc', place_id: 'ChIJtest' });
    global.fetch.mockResolvedValue({ ok: false });
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'abc' } });
    expect(r.statusCode).toBe(502);
  });
});
```

**Step 3: Run tests**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest netlify/functions/google-reviews.test.js --no-coverage
```
Expected: 7 tests pass.

**Step 4: Update widget JS to use widget_key**

In `src/google-reviews/index.js`, find the fetch call and change `place_id` to `widget_key`:
```js
// OLD:
fetch('/.netlify/functions/google-reviews?place_id=' + encodeURIComponent(placeId))

// NEW — find the data attribute name too:
// Change el.dataset.placeId → el.dataset.widgetKey
// And in mountGoogleReviews:
var widgetKey = el.dataset.widgetKey;
if (!widgetKey) { el.textContent = 'Missing data-widget-key'; return; }
// ...
fetch('/.netlify/functions/google-reviews?widget_key=' + encodeURIComponent(widgetKey))
```

Update `src/google-reviews/index.test.js` accordingly (change `placeId` → `widgetKey`, update fetch URL).

**Step 5: Run all widget tests**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest src/google-reviews/ --no-coverage
```
Expected: 5 tests pass.

**Step 6: Commit**
```bash
git add netlify/functions/google-reviews.js netlify/functions/google-reviews.test.js src/google-reviews/
git commit -m "feat: google-reviews uses widget_key + supabase lookup"
```

---

## Task 4: Update instagram-feed.js to use Supabase

**Files:**
- Modify: `netlify/functions/instagram-feed.js`
- Modify: `netlify/functions/instagram-feed.test.js`

**Step 1: Replace instagram-feed.js**

```js
const PROFILE_FIELDS = 'id,name,username,profile_picture_url,media_count,followers_count,follows_count';
const MEDIA_FIELDS = 'id,media_type,media_url,thumbnail_url,permalink,timestamp';
const { getWidgetConfig } = require('./widget-lookup');

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, OPTIONS' }, body: '' };
  }

  const { widget_key } = event.queryStringParameters || {};
  if (!widget_key) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'widget_key is required' }) };
  }

  let config;
  try {
    config = await getWidgetConfig(widget_key);
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error' }) };
  }

  if (!config || config.type !== 'instagram-feed') {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Widget not found' }) };
  }

  const token = config.instagram_access_token;
  if (!token) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Instagram token not configured' }) };
  }

  const base = 'https://graph.instagram.com/me';

  try {
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

    if (!Array.isArray(mediaData.data)) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram API error' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ profile, posts: mediaData.data }),
    };
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Instagram API unavailable' }) };
  }
};
```

**Step 2: Replace instagram-feed.test.js**

```js
jest.mock('./widget-lookup', () => ({ getWidgetConfig: jest.fn() }));
global.fetch = jest.fn();

const { getWidgetConfig } = require('./widget-lookup');
const { handler } = require('./instagram-feed');

const BASE_EVENT = { httpMethod: 'GET', queryStringParameters: {} };
const MOCK_CONFIG = { type: 'instagram-feed', widget_key: 'xyz', instagram_access_token: 'token123' };

describe('instagram-feed function', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 204 for OPTIONS', async () => {
    const r = await handler({ httpMethod: 'OPTIONS', queryStringParameters: {} });
    expect(r.statusCode).toBe(204);
  });

  test('returns 400 if widget_key missing', async () => {
    const r = await handler(BASE_EVENT);
    expect(r.statusCode).toBe(400);
  });

  test('returns 404 if widget not found', async () => {
    getWidgetConfig.mockResolvedValue(null);
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'bad' } });
    expect(r.statusCode).toBe(404);
  });

  test('returns 500 on database error', async () => {
    getWidgetConfig.mockRejectedValue(new Error('db error'));
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'xyz' } });
    expect(r.statusCode).toBe(500);
  });

  test('returns 200 with profile and posts', async () => {
    getWidgetConfig.mockResolvedValue(MOCK_CONFIG);
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1', username: 'alocalx', media_count: 76, followers_count: 739, follows_count: 236, profile_picture_url: 'https://example.com/avatar.jpg' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: 'p1', media_type: 'IMAGE', media_url: 'https://example.com/img.jpg', permalink: 'https://instagram.com/p/abc/' }] }) });
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'xyz' } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.profile.username).toBe('alocalx');
    expect(body.posts).toHaveLength(1);
  });

  test('returns 502 on Instagram API failure', async () => {
    getWidgetConfig.mockResolvedValue(MOCK_CONFIG);
    global.fetch.mockResolvedValue({ ok: false });
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'xyz' } });
    expect(r.statusCode).toBe(502);
  });

  test('returns 502 when fetch throws', async () => {
    getWidgetConfig.mockResolvedValue(MOCK_CONFIG);
    global.fetch.mockRejectedValue(new Error('network'));
    const r = await handler({ ...BASE_EVENT, queryStringParameters: { widget_key: 'xyz' } });
    expect(r.statusCode).toBe(502);
  });
});
```

**Step 3: Run tests**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest netlify/functions/instagram-feed.test.js --no-coverage
```
Expected: 7 tests pass.

**Step 4: Update instagram widget JS to use widget_key**

In `src/instagram-feed/index.js`, change:
```js
// OLD:
fetch('/.netlify/functions/instagram-feed')

// NEW — read widget_key from element:
function mountInstagramFeed(el) {
  var widgetKey = el.dataset.widgetKey;
  if (!widgetKey) { el.innerHTML = '<div class="sf-ig-wrap">Missing data-widget-key</div>'; return; }
  // ...
  fetch('/.netlify/functions/instagram-feed?widget_key=' + encodeURIComponent(widgetKey))
```

Update `src/instagram-feed/index.test.js` accordingly.

**Step 5: Run all widget tests**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest src/instagram-feed/ --no-coverage
```

**Step 6: Run full test suite**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest --no-coverage
```
Expected: All tests pass.

**Step 7: Commit**
```bash
git add netlify/functions/instagram-feed.js netlify/functions/instagram-feed.test.js src/instagram-feed/
git commit -m "feat: instagram-feed uses widget_key + supabase lookup"
```

---

## Task 5: places-search Netlify Function

Lets users search for their business by name to get their `place_id`.

**Files:**
- Create: `netlify/functions/places-search.js`
- Create: `netlify/functions/places-search.test.js`

**Step 1: Write failing test**

Create `netlify/functions/places-search.test.js`:
```js
global.fetch = jest.fn();
const { handler } = require('./places-search');

describe('places-search function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  });

  test('returns 204 for OPTIONS', async () => {
    const r = await handler({ httpMethod: 'OPTIONS', queryStringParameters: {} });
    expect(r.statusCode).toBe(204);
  });

  test('returns 400 if q missing', async () => {
    const r = await handler({ httpMethod: 'GET', queryStringParameters: {} });
    expect(r.statusCode).toBe(400);
  });

  test('returns list of matching places', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        candidates: [
          { name: 'alocalX Roofing', formatted_address: '123 Main St', place_id: 'ChIJtest', rating: 5.0, user_ratings_total: 172 },
        ],
      }),
    });
    const r = await handler({ httpMethod: 'GET', queryStringParameters: { q: 'alocalX Roofing' } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].place_id).toBe('ChIJtest');
  });

  test('returns empty array when no results', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ZERO_RESULTS', candidates: [] }),
    });
    const r = await handler({ httpMethod: 'GET', queryStringParameters: { q: 'nonexistent' } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.results).toHaveLength(0);
  });

  test('returns 502 on Google API failure', async () => {
    global.fetch.mockResolvedValue({ ok: false });
    const r = await handler({ httpMethod: 'GET', queryStringParameters: { q: 'test' } });
    expect(r.statusCode).toBe(502);
  });
});
```

**Step 2: Run test — expect FAIL**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest netlify/functions/places-search.test.js --no-coverage
```

**Step 3: Implement**

Create `netlify/functions/places-search.js`:
```js
exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, OPTIONS' }, body: '' };
  }

  const { q } = event.queryStringParameters || {};
  if (!q || !q.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'q (search query) is required' }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
  }

  const fields = 'name,formatted_address,place_id,rating,user_ratings_total';
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(q)}&inputtype=textquery&fields=${fields}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Google API error' }) };
    }
    const data = await response.json();
    const results = (data.candidates || []).map(function(c) {
      return {
        name: c.name,
        address: c.formatted_address,
        place_id: c.place_id,
        rating: c.rating,
        review_count: c.user_ratings_total,
      };
    });
    return { statusCode: 200, headers, body: JSON.stringify({ results }) };
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Google API unavailable' }) };
  }
};
```

**Step 4: Run test — expect PASS**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest netlify/functions/places-search.test.js --no-coverage
```
Expected: 5 tests pass.

**Step 5: Commit**
```bash
git add netlify/functions/places-search.js netlify/functions/places-search.test.js
git commit -m "feat: places-search function for business lookup"
```

---

## Task 6: instagram-auth-callback Netlify Function

Handles the Instagram OAuth redirect, exchanges the code for a long-lived token, saves to Supabase.

**Files:**
- Create: `netlify/functions/instagram-auth-callback.js`
- Create: `netlify/functions/instagram-auth-callback.test.js`

**Step 1: Write failing test**

Create `netlify/functions/instagram-auth-callback.test.js`:
```js
jest.mock('../src/lib/supabaseAdmin', () => ({ getAdminClient: jest.fn() }));
global.fetch = jest.fn();

const { getAdminClient } = require('../src/lib/supabaseAdmin');
const { handler } = require('./instagram-auth-callback');

describe('instagram-auth-callback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FB_APP_ID = 'test-app-id';
    process.env.FB_APP_SECRET = 'test-secret';
  });

  test('returns 400 if code missing', async () => {
    const r = await handler({ queryStringParameters: {} });
    expect(r.statusCode).toBe(400);
  });

  test('returns 400 if state (user_id) missing', async () => {
    const r = await handler({ queryStringParameters: { code: 'abc' } });
    expect(r.statusCode).toBe(400);
  });

  test('returns 502 if token exchange fails', async () => {
    global.fetch.mockResolvedValue({ ok: false });
    const r = await handler({ queryStringParameters: { code: 'abc', state: 'user-123' } });
    expect(r.statusCode).toBe(502);
  });

  test('saves token and redirects on success', async () => {
    // Mock: short-lived token exchange
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'short-token', user_id: '12345' }),
      })
      // Mock: long-lived token exchange
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'long-token', expires_in: 5183944 }),
      })
      // Mock: get username
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'alocalx', id: '12345' }),
      });

    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    getAdminClient.mockReturnValue({
      from: () => ({ upsert: mockUpsert }),
    });

    const r = await handler({ queryStringParameters: { code: 'auth-code', state: 'user-uuid-123' } });
    expect(r.statusCode).toBe(302);
    expect(r.headers.Location).toContain('/dashboard');
    expect(mockUpsert).toHaveBeenCalled();
    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.instagram_access_token).toBe('long-token');
    expect(upsertArg.instagram_username).toBe('alocalx');
    expect(upsertArg.user_id).toBe('user-uuid-123');
  });
});
```

**Step 2: Run test — expect FAIL**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest netlify/functions/instagram-auth-callback.test.js --no-coverage
```

**Step 3: Implement**

Create `netlify/functions/instagram-auth-callback.js`:
```js
const { getAdminClient } = require('../src/lib/supabaseAdmin');

function generateWidgetKey() {
  return Math.random().toString(36).slice(2, 10);
}

exports.handler = async function (event) {
  const { code, state: userId } = event.queryStringParameters || {};
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  const redirectUri = process.env.URL
    ? `${process.env.URL}/.netlify/functions/instagram-auth-callback`
    : 'http://localhost:8888/.netlify/functions/instagram-auth-callback';

  if (!code) return { statusCode: 400, body: 'Missing code' };
  if (!userId) return { statusCode: 400, body: 'Missing state (user_id)' };

  // Step 1: Exchange code for short-lived token
  const tokenUrl = `https://api.instagram.com/oauth/access_token`;
  const tokenBody = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });

  let shortToken;
  try {
    const res = await fetch(tokenUrl, { method: 'POST', body: tokenBody });
    if (!res.ok) return { statusCode: 502, body: 'Token exchange failed' };
    const data = await res.json();
    shortToken = data.access_token;
  } catch (err) {
    return { statusCode: 502, body: 'Token exchange error' };
  }

  // Step 2: Exchange for long-lived token (60 days)
  let longToken, expiresIn;
  try {
    const res = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortToken}`
    );
    if (!res.ok) return { statusCode: 502, body: 'Long-lived token exchange failed' };
    const data = await res.json();
    longToken = data.access_token;
    expiresIn = data.expires_in;
  } catch (err) {
    return { statusCode: 502, body: 'Long-lived token error' };
  }

  // Step 3: Get Instagram username
  let username;
  try {
    const res = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${longToken}`);
    if (!res.ok) return { statusCode: 502, body: 'Failed to get Instagram username' };
    const data = await res.json();
    username = data.username;
  } catch (err) {
    return { statusCode: 502, body: 'Username fetch error' };
  }

  // Step 4: Save to Supabase
  const expiry = new Date(Date.now() + expiresIn * 1000).toISOString();
  const supabase = getAdminClient();
  const { error } = await supabase.from('widget_configs').upsert({
    user_id: userId,
    type: 'instagram-feed',
    widget_key: generateWidgetKey(),
    instagram_access_token: longToken,
    instagram_username: username,
    instagram_token_expiry: expiry,
    label: `@${username}`,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,type' });

  if (error) {
    console.error('Supabase upsert error:', error);
    return { statusCode: 500, body: 'Failed to save token' };
  }

  // Redirect back to dashboard
  const dashboardUrl = process.env.URL ? `${process.env.URL}/dashboard.html` : 'http://localhost:8888/dashboard.html';
  return {
    statusCode: 302,
    headers: { Location: `${dashboardUrl}?connected=instagram` },
    body: '',
  };
};
```

**Step 4: Run test — expect PASS**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest netlify/functions/instagram-auth-callback.test.js --no-coverage
```
Expected: 4 tests pass.

**Step 5: Commit**
```bash
git add netlify/functions/instagram-auth-callback.js netlify/functions/instagram-auth-callback.test.js
git commit -m "feat: instagram oauth callback - exchanges code for long-lived token"
```

---

## Task 7: widget-save Netlify Function

Saves a widget config (Google Reviews) to Supabase. Called from the dashboard UI.

**Files:**
- Create: `netlify/functions/widget-save.js`
- Create: `netlify/functions/widget-save.test.js`

**Step 1: Write failing test**

Create `netlify/functions/widget-save.test.js`:
```js
jest.mock('../src/lib/supabaseAdmin', () => ({ getAdminClient: jest.fn() }));

const { getAdminClient } = require('../src/lib/supabaseAdmin');
const { handler } = require('./widget-save');

describe('widget-save function', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 405 for non-POST', async () => {
    const r = await handler({ httpMethod: 'GET', headers: {}, body: '' });
    expect(r.statusCode).toBe(405);
  });

  test('returns 400 if body invalid', async () => {
    const r = await handler({ httpMethod: 'POST', headers: {}, body: 'not-json' });
    expect(r.statusCode).toBe(400);
  });

  test('returns 400 if type missing', async () => {
    const r = await handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ user_id: 'uid', place_id: 'ChIJ' }) });
    expect(r.statusCode).toBe(400);
  });

  test('saves google-reviews config and returns widget_key', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ data: [{ widget_key: 'abc12345' }], error: null });
    getAdminClient.mockReturnValue({ from: () => ({ insert: mockInsert, select: () => ({ insert: mockInsert }) }) });

    // Simplified: mock the full chain
    const mockChain = { data: [{ widget_key: 'abc12345' }], error: null };
    getAdminClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockChain)
        })
      })
    });

    const r = await handler({
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({ user_id: 'uid-123', type: 'google-reviews', place_id: 'ChIJtest', label: 'My Shop' }),
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.widget_key).toBe('abc12345');
  });
});
```

**Step 2: Run test — expect FAIL**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest netlify/functions/widget-save.test.js --no-coverage
```

**Step 3: Implement**

Create `netlify/functions/widget-save.js`:
```js
const { getAdminClient } = require('../src/lib/supabaseAdmin');

function generateWidgetKey() {
  return Math.random().toString(36).slice(2, 10);
}

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { user_id, type, place_id, label } = payload;
  if (!type || !user_id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id and type are required' }) };
  }

  const supabase = getAdminClient();
  const record = {
    user_id,
    type,
    widget_key: generateWidgetKey(),
    label: label || type,
    updated_at: new Date().toISOString(),
  };
  if (type === 'google-reviews' && place_id) record.place_id = place_id;

  const { data, error } = await supabase
    .from('widget_configs')
    .insert(record)
    .select();

  if (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ widget_key: data[0].widget_key, id: data[0].id }) };
};
```

**Step 4: Run test — expect PASS**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest netlify/functions/widget-save.test.js --no-coverage
```

**Step 5: Commit**
```bash
git add netlify/functions/widget-save.js netlify/functions/widget-save.test.js
git commit -m "feat: widget-save function for creating widget configs"
```

---

## Task 8: Dashboard UI (Login + Dashboard Pages)

Build the SocialFeeds dashboard — login page and widget management dashboard. Vanilla JS with Supabase client.

**Files:**
- Create: `public/login.html`
- Create: `public/dashboard.html`
- Create: `src/dashboard/index.js`
- Create: `src/dashboard/auth.js`
- Modify: `netlify.toml`

**Step 1: Update netlify.toml for SPA routing**

Add redirect rules:
```toml
[[redirects]]
  from = "/dashboard"
  to = "/dashboard.html"
  status = 200

[[redirects]]
  from = "/login"
  to = "/login.html"
  status = 200
```

**Step 2: Create `public/login.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Social Feeds — Login</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #fff; border-radius: 12px; padding: 40px; width: 100%; max-width: 400px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    p { color: #666; font-size: 14px; margin-bottom: 28px; }
    .btn-google { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; background: #fff; font-size: 15px; font-weight: 500; cursor: pointer; margin-bottom: 20px; }
    .btn-google:hover { background: #f8f8f8; }
    .divider { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; color: #aaa; font-size: 13px; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #eee; }
    input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; margin-bottom: 12px; outline: none; }
    input:focus { border-color: #1a73e8; }
    .btn-primary { width: 100%; padding: 12px; background: #1a73e8; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #1558b0; }
    .otp-section { display: none; }
    .msg { margin-top: 12px; font-size: 13px; color: #e53e3e; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Social Feeds</h1>
    <p>Sign in to manage your widgets</p>

    <button class="btn-google" id="btnGoogle">
      <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg>
      Continue with Google
    </button>

    <div class="divider">or</div>

    <div id="phoneSection">
      <input type="tel" id="phoneInput" placeholder="+1 (555) 000-0000" />
      <button class="btn-primary" id="btnSendCode">Send Code</button>
    </div>

    <div class="otp-section" id="otpSection">
      <input type="text" id="otpInput" placeholder="Enter 6-digit code" maxlength="6" />
      <button class="btn-primary" id="btnVerify">Verify</button>
    </div>

    <div class="msg" id="msg"></div>
  </div>
  <script src="/dashboard.js"></script>
</body>
</html>
```

**Step 3: Create `public/dashboard.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Social Feeds — Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; min-height: 100vh; }
    header { background: #fff; border-bottom: 1px solid #eee; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
    header h1 { font-size: 18px; font-weight: 700; }
    .btn-logout { background: none; border: 1px solid #ddd; border-radius: 6px; padding: 6px 14px; cursor: pointer; font-size: 13px; }
    main { max-width: 900px; margin: 32px auto; padding: 0 24px; }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .top h2 { font-size: 20px; }
    .btn-new { background: #1a73e8; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .widget-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .widget-card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
    .widget-card h3 { font-size: 15px; margin-bottom: 4px; }
    .widget-card .type { font-size: 12px; color: #888; margin-bottom: 12px; }
    .snippet { background: #f5f5f5; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 11px; word-break: break-all; margin-bottom: 12px; }
    .btn-copy { background: none; border: 1px solid #ddd; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 12px; }
    .btn-copy:hover { background: #f5f5f5; }
    .empty { text-align: center; color: #888; padding: 60px 0; }
    /* Modal */
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); align-items: center; justify-content: center; z-index: 100; }
    .modal-overlay.open { display: flex; }
    .modal { background: #fff; border-radius: 12px; padding: 32px; width: 100%; max-width: 480px; }
    .modal h2 { margin-bottom: 20px; }
    .modal-btns { display: flex; gap: 12px; margin-bottom: 20px; }
    .modal-btn { flex: 1; padding: 14px; border: 2px solid #eee; border-radius: 8px; background: #fff; cursor: pointer; font-size: 14px; font-weight: 500; }
    .modal-btn.active { border-color: #1a73e8; color: #1a73e8; }
    .modal input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; margin-bottom: 12px; }
    .modal .search-results { max-height: 200px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px; }
    .search-result { padding: 12px; cursor: pointer; border-bottom: 1px solid #f5f5f5; }
    .search-result:hover { background: #f5f5f5; }
    .search-result .name { font-weight: 600; font-size: 13px; }
    .search-result .addr { font-size: 12px; color: #888; }
    .btn-primary { width: 100%; padding: 12px; background: #1a73e8; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px; }
    .btn-close { float: right; background: none; border: none; font-size: 20px; cursor: pointer; color: #888; }
  </style>
</head>
<body>
  <header>
    <h1>Social Feeds</h1>
    <button class="btn-logout" id="btnLogout">Sign out</button>
  </header>
  <main>
    <div class="top">
      <h2>My Widgets</h2>
      <button class="btn-new" id="btnNew">+ New Widget</button>
    </div>
    <div class="widget-grid" id="widgetGrid">
      <div class="empty">Loading...</div>
    </div>
  </main>

  <!-- New Widget Modal -->
  <div class="modal-overlay" id="modal">
    <div class="modal">
      <button class="btn-close" id="btnCloseModal">&times;</button>
      <h2>Add Widget</h2>
      <div class="modal-btns">
        <button class="modal-btn active" data-type="google-reviews">Google Reviews</button>
        <button class="modal-btn" data-type="instagram-feed">Instagram Feed</button>
      </div>

      <!-- Google Reviews form -->
      <div id="googleForm">
        <input type="text" id="searchInput" placeholder="Search your business name..." />
        <div class="search-results" id="searchResults" style="display:none"></div>
        <button class="btn-primary" id="btnSaveGoogle" style="display:none">Add Widget</button>
      </div>

      <!-- Instagram form -->
      <div id="instagramForm" style="display:none">
        <p style="color:#666;font-size:14px;margin-bottom:16px">Connect your Instagram account to display your feed.</p>
        <button class="btn-primary" id="btnConnectInstagram">Connect Instagram</button>
      </div>
    </div>
  </div>

  <script src="/dashboard.js"></script>
</body>
</html>
```

**Step 4: Create `src/dashboard/auth.js`**

```js
const { createClient } = require('@supabase/supabase-js');

// These are injected at build time via esbuild --define
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = { supabase };
```

**Step 5: Create `src/dashboard/index.js`**

```js
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
    var appId = '{{FB_APP_ID}}'; // injected at build time
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
```

**Step 6: Update build script to inject env vars**

Update `package.json` build:dashboard script to inject the Supabase public keys and FB App ID at build time:
```json
"build:dashboard": "esbuild src/dashboard/index.js --bundle --minify --define:process.env.SUPABASE_URL='\"$SUPABASE_URL\"' --define:process.env.SUPABASE_ANON_KEY='\"$SUPABASE_ANON_KEY\"' --outfile=public/dashboard.js"
```

On Windows, use a Node script instead of shell variable substitution. Create `scripts/build-dashboard.js`:
```js
const { execSync } = require('child_process');
require('dotenv').config();

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';
const fbAppId = process.env.FB_APP_ID || '';

execSync(
  `esbuild src/dashboard/index.js --bundle --minify ` +
  `--define:process.env.SUPABASE_URL='"${url}"' ` +
  `--define:process.env.SUPABASE_ANON_KEY='"${key}"' ` +
  `--outfile:public/dashboard.js`,
  { stdio: 'inherit' }
);

// Replace FB_APP_ID placeholder
const fs = require('fs');
let content = fs.readFileSync('public/dashboard.js', 'utf8');
content = content.replace('{{FB_APP_ID}}', fbAppId);
fs.writeFileSync('public/dashboard.js', content);
```

Update package.json: `"build:dashboard": "node scripts/build-dashboard.js"`

Install dotenv: `npm install --save-dev dotenv`

**Step 7: Build and verify**
```bash
cd "C:/Users/mikec/SocialFeeds"
npm install
npm run build
```
Expected: `public/widgets.js` and `public/dashboard.js` both created.

**Step 8: Commit**
```bash
git add public/login.html public/dashboard.html src/dashboard/ scripts/ netlify.toml package.json package-lock.json
git commit -m "feat: login + dashboard UI for widget management"
```

---

## Task 9: Run Full Test Suite + Final Build

**Step 1: Run all tests**
```bash
cd "C:/Users/mikec/SocialFeeds" && npx jest --no-coverage
```
Expected: All tests pass (29+ tests across all suites).

**Step 2: Full build**
```bash
cd "C:/Users/mikec/SocialFeeds" && npm run build
```
Expected: Both bundles built with no errors.

**Step 3: Final commit**
```bash
git add -A
git commit -m "feat: social feeds platform - multi-tenant widgets with supabase auth"
```

---

## API Reference (Updated Embed Snippets)

```html
<!-- Google Reviews -->
<div data-widget="google-reviews" data-widget-key="abc12345"></div>

<!-- Instagram Feed -->
<div data-widget="instagram-feed" data-widget-key="xyz67890"></div>

<!-- One script tag per page -->
<script src="https://socialfeeds.netlify.app/widgets.js"></script>
```
