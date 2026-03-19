# Full Platform Design — Social Feeds + Website Creator
_Date: 2026-03-19_

## Overview

Two separate Netlify apps sharing one Supabase backend:

1. **socialfeeds.netlify.app** — Standalone Elfsight-like widget creator. Anyone logs in, connects Instagram or Google Reviews, gets an embed code to use anywhere.
2. **websitecreator.netlify.app** — AI website generator. Clients log in, build sites, optionally add social feed widgets, save/export their sites.

Both share the same Supabase project for auth, widget configs, and saved sites.

---

## Architecture

```
socialfeeds.netlify.app                  websitecreator.netlify.app
━━━━━━━━━━━━━━━━━━━━━━━━━━               ━━━━━━━━━━━━━━━━━━━━━━━━━━━
Public widget creator                    Website generator
  • Log in (phone OTP / Google)            • Log in (phone OTP / Google)
  • Connect Instagram (OAuth)              • Build website wizard (existing)
  • Add Google Reviews (search)            • "Add Instagram Feed?" step
  • Dashboard: manage widgets              • "Add Google Reviews?" step
  • Embed code generator                   • Dashboard: saved sites
  • Copy snippet anywhere                  • Export HTML with widgets baked in

              ↕ Both share the same Supabase project ↕
                  auth.users / profiles / widget_configs / sites
```

---

## Database Schema (Supabase)

### `profiles` (auto-created on first login via trigger)
```sql
id          uuid  PRIMARY KEY REFERENCES auth.users(id)
business_name text
phone       text
role        text  DEFAULT 'client'  -- 'client' | 'admin'
created_at  timestamptz DEFAULT now()
```

### `widget_configs`
```sql
id                    uuid  PRIMARY KEY DEFAULT gen_random_uuid()
user_id               uuid  REFERENCES auth.users(id) ON DELETE CASCADE
type                  text  NOT NULL  -- 'google-reviews' | 'instagram-feed'
widget_key            text  UNIQUE NOT NULL  -- short ID used in embed snippet
place_id              text  -- Google only
instagram_access_token text  -- Instagram only (stored encrypted via Supabase Vault)
instagram_username    text  -- Instagram only
instagram_token_expiry timestamptz  -- for refresh scheduling
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
```

### `sites`
```sql
id               uuid  PRIMARY KEY DEFAULT gen_random_uuid()
user_id          uuid  REFERENCES auth.users(id) ON DELETE CASCADE
business_info    jsonb  -- name, address, phone, services, hours, etc.
template_id      text
generated_content jsonb  -- headline, subheadline, about, services, CTAs, etc.
widget_config_ids uuid[]  -- linked widget_configs
created_at       timestamptz DEFAULT now()
updated_at       timestamptz DEFAULT now()
```

### Row Level Security
- Users can only read/write their own `profiles`, `widget_configs`, `sites`
- Netlify Functions use a service role key (bypasses RLS) for widget serving

---

## Authentication (Both Apps)

**Provider:** Supabase Auth
**Methods:** Phone OTP (via Twilio) + Google OAuth

**Login UI:**
```
[G] Continue with Google
──────────── or ────────────
📱 Enter phone number
[Send Code]
```

- Phone: enter number → SMS 6-digit OTP → enter code → logged in
- First login auto-creates account + profile row (via DB trigger)
- Google: popup → authorize → logged in
- Sessions persisted via Supabase JWT in localStorage
- Admin role set manually in Supabase dashboard

---

## SocialFeeds App Changes

### New: Auth pages
- `/login` — phone OTP + Google login
- Auto-redirect logged-in users to `/dashboard`

### New: Dashboard (`/dashboard`)
- Lists all user's widget configs
- "New Widget" button
- Each widget shows: type, name, embed snippet, edit/delete

### New: Widget Setup Flow
**Instagram:**
1. Click "Connect Instagram"
2. Redirect to Instagram OAuth (your Facebook App)
3. Callback: Netlify Function exchanges code → long-lived token → saved to Supabase
4. `widget_key` generated, shown with embed snippet

**Google Reviews:**
1. Click "Add Google Reviews"
2. Search box → Netlify Function calls Places Text Search API
3. Client picks their business from results
4. `place_id` + `widget_key` saved to Supabase, embed snippet shown

### Changed: Widget Serving Functions
`google-reviews.js` and `instagram-feed.js` now accept `?widget_key=abc123` instead of reading from env vars. They look up credentials in Supabase using service role key.

### New: `widget-lookup.js` Netlify Function
Shared lookup helper: given a `widget_key`, returns the right credentials from Supabase. Used internally by `google-reviews.js` and `instagram-feed.js`.

### New: `instagram-auth-callback.js` Netlify Function
Handles Instagram OAuth redirect. Exchanges `code` for long-lived token, saves to Supabase.

### New: `places-search.js` Netlify Function
Accepts `?q=business+name` → calls Google Places Text Search → returns list of matching businesses with name, address, place_id.

---

## Website Creator App Changes

### New: Auth pages
- `/login` — same phone OTP + Google login (same Supabase project)
- Protected routes redirect to `/login` if not authenticated

### New: Dashboard (`/dashboard`)
- Shows list of user's saved sites (from `sites` table)
- "Create New Site" → existing wizard
- Each site: preview thumbnail, business name, created date, "Edit" / "Export HTML" / "Delete"

### Changed: Wizard Step 5 (Preview & Edit)
Add "Social Feeds" panel below the preview:
```
┌──────────────────────────────────────────┐
│ Add Social Feeds to your site (optional) │
│                                          │
│ [Connect Instagram]  [Add Google Reviews]│
│                                          │
│ ✓ Instagram connected: @alocalx         │
│ ✓ Google Reviews: alocalX Roofing (172) │
└──────────────────────────────────────────┘
```
- If user already has widget configs (from SocialFeeds app), auto-detected and shown
- Connecting here saves to same Supabase `widget_configs` table

### Changed: Export HTML
- If widget configs linked, exported HTML includes embed snippet pointing to SocialFeeds deploy
- `widget_key` baked into the `data-widget-key` attribute

### New: Site Saving
- On "Export" or "Save", site saved to `sites` table in Supabase
- Users can return to dashboard and re-export or edit

---

## Embed Snippet (Updated)

```html
<!-- Google Reviews -->
<div data-widget="google-reviews" data-widget-key="abc123"></div>

<!-- Instagram Feed -->
<div data-widget="instagram-feed" data-widget-key="xyz789"></div>

<!-- One script tag, load once -->
<script src="https://socialfeeds.netlify.app/widgets.js"></script>
```

No place_id or token ever in the HTML — just the opaque `widget_key`. Credentials stay in Supabase.

---

## Services & Credentials Needed

| Service | Purpose | Notes |
|---------|---------|-------|
| Supabase | Auth + database | Free tier sufficient to start |
| Twilio | SMS for phone OTP | ~$0.0075/SMS, via Supabase |
| Google Cloud | Places API | Existing key, restrict to your domains |
| Facebook Developer App | Instagram OAuth | Existing or new app |
| Supabase Vault | Encrypt Instagram tokens at rest | Built into Supabase |

---

## Implementation Order

1. **Supabase setup** — create project, tables, RLS policies, auth providers (Google + Phone)
2. **SocialFeeds: auth + dashboard** — login page, dashboard, widget management UI
3. **SocialFeeds: Instagram OAuth flow** — callback function, token storage
4. **SocialFeeds: Google Reviews search** — places-search function, UI
5. **SocialFeeds: update widget serving** — switch from env vars to Supabase lookup
6. **Website Creator: auth** — login page, protected routes
7. **Website Creator: dashboard** — saved sites list
8. **Website Creator: social feeds step** — wizard integration, auto-detect existing widgets
9. **Website Creator: updated export** — bake widget_key into HTML
