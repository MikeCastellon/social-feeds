# Social Feeds Widgets — Design Document
_Date: 2026-03-19_

## Overview
Self-hosted, embeddable JavaScript widgets that replicate the Elfsight look for Google Reviews and Instagram Feed. Hosted on Netlify with serverless function API proxies to protect credentials. Embedded via a single `<script>` tag + `<div data-widget="...">` shortcode pattern.

## Architecture

```
SocialFeeds/
├── netlify/
│   └── functions/
│       ├── google-reviews.js      ← Google Places API proxy
│       └── instagram-feed.js      ← Instagram Graph API proxy
├── public/
│   └── widgets.js                 ← compiled bundle (both widgets)
├── src/
│   ├── google-reviews/
│   │   ├── index.js
│   │   └── styles.js
│   ├── instagram-feed/
│   │   ├── index.js
│   │   └── styles.js
│   └── core/
│       └── mount.js               ← scans DOM, mounts widgets
├── netlify.toml
└── package.json
```

## Widget 1: Google Reviews

**Embed:**
```html
<div data-widget="google-reviews" data-place-id="YOUR_PLACE_ID"></div>
<script src="https://your-site.netlify.app/widgets.js"></script>
```

**Visual design (matching Elfsight):**
- Header: Google SVG logo, "Google Reviews" label, overall star rating + count, "Review us on Google" blue button (right-aligned)
- Body: Horizontal carousel, 4 cards on desktop / 1-2 on mobile, left/right arrows, dot pagination
- Card: Reviewer avatar or initials circle, name, verified checkmark, relative timestamp, 5-star row, truncated review text with "Read more"

**Data source:** Google Places API — Place Details endpoint
**Env var:** `GOOGLE_PLACES_API_KEY`
**Function:** `GET /.netlify/functions/google-reviews?place_id=...`
**Returns:** `{ rating, user_ratings_total, reviews[], url }`

## Widget 2: Instagram Feed

**Embed:**
```html
<div data-widget="instagram-feed" data-username="alocalx"></div>
<script src="https://your-site.netlify.app/widgets.js"></script>
```

**Visual design (matching Elfsight/Instagram):**
- Header: Profile avatar, handle, post/follower/following counts, Follow button
- Grid: 3-column desktop, 2-column mobile, video posts show reel icon overlay
- Click: Lightbox or link to Instagram post URL

**Data source:** Instagram Graph API — `me/media` endpoint
**Env var:** `INSTAGRAM_ACCESS_TOKEN`
**Function:** `GET /.netlify/functions/instagram-feed?username=...`
**Returns:** `{ profile: {...}, posts: [...] }`
**Token refresh:** Netlify scheduled function auto-refreshes the long-lived token before 60-day expiry

## Netlify Functions

| Function | Accepts | Calls | Returns |
|---|---|---|---|
| `google-reviews.js` | `?place_id=` | Google Places API | rating, reviews |
| `instagram-feed.js` | `?username=` | Instagram Graph API | profile, posts |

## API Setup Plan
1. **Google Places API** — Google Cloud project → enable Places API → create restricted API key → add to Netlify env vars
2. **Instagram Graph API** — Facebook Developer app → connect Instagram Business account → generate long-lived token → add to Netlify env vars → scheduled refresh function

## Embed Pattern
One `<script>` tag per page (loads once). Multiple `<div data-widget="...">` elements supported on same page. Widget scripts are idempotent — safe to load multiple times.

## Styling
- Scoped CSS injected per widget to avoid host-site conflicts
- Matches Elfsight visual design: card shadows, Google brand colors, star gold (#FBBC04), blue CTA button
- Fully responsive (CSS Grid + flexbox)
