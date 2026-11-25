# NK Handoff File

This file is the project stop point and continuity record. Any agent picking up the repository must read this file first and update it after every change.

Created: 2026-11-25

## Working Rules

1. **Do not implement anything without explicit consent.** No fixes, refactors, additions, deletions, config changes, dependency changes, or cleanup unless the user clearly asks for it.
2. **Keep code comments minimal.** If a comment is genuinely needed, use only 3–4 words. Do not sprinkle comments every few lines.
3. **Always ask questions when anything is unclear.** Do not assume intent, scope, filenames, behavior, or desired implementation.
4. **Always update this file after every codebase change.** Record exactly what changed, which files changed, why it changed, and how it was verified.
5. More rules may be added by the user. Treat this list as authoritative and update it when a new rule is given.

## Scope Lock

- Application code has changed only for explicitly approved work: light/dark theme, brand/content, nav/customization, floating WhatsApp button, dedicated Custom page, flexible name/number customization, and WhatsApp order return flow.
- All other observed issues remain **not approved work**.
- Before implementing anything else, confirm the exact task and constraints with the user.

## Current Stop Point

- `NK.md` has been created and is the authoritative handoff file.
- Full codebase exploration is complete.
- Approved light/dark theme work is implemented.
- Theme follows system preference on first visit and remembers the toggle choice in `retrokit_theme`.
- Brand colors are Dusk `#2E2A4A` and Lavender `#C8C0E8`.
- Approved brand/content work is implemented: visible `RetroKit`/`RETROKIT` text is now `N-KITS`, and internal `retrokit_` keys plus `project_id = "retrokit"` are unchanged.
- Homepage now has a CSS/SVG sports scene, no `Authentic Retro` pill, broader jersey-focused copy, feature cards, and a closing CTA.
- Storefront nav is now `Home`, `Shop`, `Custom`, `Cart`; league links were removed from desktop and mobile menus.
- `Custom` links to `shop.html?custom=1`, which shows a customization banner; checkout has one name/number form per cart jersey.
- Customization fee is ₦3,000 by default, stored as `customization_fee` in settings, editable in admin, applied per customized jersey × quantity, and included in WhatsApp messages, local orders, admin order lines, and saved order totals.
- Checkout customization uses separate `Add name` and `Add number` toggles; either one or both can be used, and the fee is charged once per customized jersey.
- A fixed WhatsApp button is injected on storefront pages and hidden on admin; it uses the admin-configured WhatsApp number, and homepage now mentions custom names and numbers.
- Dedicated `custom.html` is built and all Custom tabs link to it; its CTAs open `shop.html?custom=1` with the shop banner.
- WhatsApp orders now save the order, open WhatsApp, and redirect to `order-sent.html?order=<id>`; the cart is cleared only after the user clicks `I've sent the message`.
- Admin can update `payment_status` from the order card, with `Store.updateOrder()` supporting local and remote payment-status changes.
- No test, lint, typecheck, build, or deployment commands are defined; `node --check` passed on all changed JS files and CSS brace counts matched.
- Git state: branch `master`, no commits yet; all project files are untracked.

## Project Overview

N-KITS is a static browser-based e-commerce storefront for sports jerseys, with a client-side admin panel and optional Supabase integration.

Operating modes:

- **Local mode:** default fallback using `localStorage`, seeded demo products, local auth, and WhatsApp orders.
- **Supabase mode:** uses Supabase Auth, Postgres, Storage, and RLS policies; orders are still placed on WhatsApp.

Core capabilities as written:

- Public storefront: home, shop, product detail, cart, checkout, login, register, verify, account.
- Product browsing with category filters, price filter, sorting, gallery, size and quantity selection.
- Cart persisted in `localStorage`; totals are recalculated from current products.
- WhatsApp-only order flow with prefilled message and saved order record.
- Admin panel with dashboard, jersey CRUD, category CRUD, order management, image upload, and store settings.

## File Map

### Root HTML entry points

- `index.html`: home page, animated CSS/SVG sports hero, categories, featured/new products, fan features, trust strip, and CTA.
- `shop.html`: product listing, filters, sorting.
- `product.html`: product detail driven by `?id=`.
- `cart.html`: cart view and WhatsApp checkout entry.
- `checkout.html`: contact/delivery form, per-jersey customization, order summary, and WhatsApp CTA.
- `order-sent.html`: WhatsApp return/confirmation page with session-backed order summary, cart-clearing confirmation button, and tracking link.
- `track.html`: guest order lookup by order number plus phone/email, with order status/items and WhatsApp help link.
- `admin.html`: admin SPA shell, login gate, hash-router view container.

### Shared browser JavaScript

- `js/config.js`: Supabase constants, storage bucket, local admin hash, default WhatsApp number.
- `js/data.js`: seeded demo products/categories and price helpers.
- `js/store.js`: main data layer for local/remote products, categories, settings, orders, guest order tracking, and uploads.
- `js/auth.js`: admin-only Supabase/local session helper, password login, no customer auth.
- `js/cart.js`: cart state, totals, WhatsApp message/payload, session snapshot, toast helper.
- `js/app.js`: shared product cards, product rendering, mobile menu, scroll reveal.
- `js/admin.js`: admin access control, hash router, CRUD screens, settings, local SHA-256.
- `js/theme.js`: light/dark mode state, system preference, saved choice, toggle wiring.

### Assets

- `assets/logo/logo-dusk-transparent.png`: Dusk logo used in light mode.
- `assets/logo/logo-lavender-transparent.png`: Lavender logo used in dark mode.
- `assets/categories/premier-league.svg`: Premier League logo used in category cards.
- `assets/categories/la-liga.svg`: La Liga logo used in category cards.
- `assets/categories/serie-a.svg`: Serie A logo used in category cards.
- `assets/categories/ng.png`, `assets/categories/br.png`, `assets/categories/ar.png`: Nigeria, Brazil, Argentina flags used in the International card.

### Page JavaScript

- `js/pages/index.js`: home categories with real league logos/country flags, featured/new products.
- `js/pages/shop.js`: filters and product listing.
- `js/pages/product.js`: product detail, gallery, size and quantity controls.
- `js/pages/cart.js`: cart rows and quantity/remove controls.
- `js/pages/checkout.js`: checkout form, per-jersey customization, order summary, and WhatsApp order submission.
- `js/pages/order-sent.js`: WhatsApp return confirmation button, session-snapshot summary rendering, and tracking link prefill.
- `js/pages/track.js`: guest tracking form, client attempt limit, RPC/local lookup, and result rendering.

### CSS

- `css/styles.css`: light/dark theme variables, storefront, animated sports hero, category logo/flag icons, feature/CTA sections, shared admin auth card, cart, product, WhatsApp button, Custom page, order-sent confirmation, guest tracking, toast, responsive rules.
- `css/checkout.css`: checkout layout, customization rows, summary, and form hints using theme variables.
- `css/admin.css`: admin shell, tables, forms, image manager, orders and payment-status controls using theme variables.

### Supabase backend

- `supabase/config.toml`: Supabase CLI project id.
- `supabase/schema.sql`: tables, triggers, RLS policies, storage bucket, seed data, admin grant instructions.

### Config/hidden

- `.gitignore`: only ignores `.aider*`.
- No README, package.json, lockfile, tests, lint config, typecheck config, CI workflow, editorconfig, or TypeScript config for the front end.

## Architecture and Runtime

- Browser code uses plain classic `<script>` tags; there is no bundler or build step.
- Shared browser modules are globals/IIFEs, not ES modules.
- `config.js` must load first, followed by Supabase CDN, then `data.js`, `store.js`, `cart.js`, `auth.js`, `app.js`, and page script.
- `admin.html` loads `config.js`, Supabase CDN, `data.js`, `store.js`, `auth.js`, then `admin.js`; it does not load `cart.js`, `app.js`, or page scripts.

Boot flow:

- `Store` is created in `js/store.js:10`.
- `auth.js` starts admin session hydration immediately in `js/auth.js:17-27`.
- Storefront pages call `Store.ready()` (`js/store.js:235-243`).
- `Store.load()` selects local or remote mode (`js/store.js:221-233`).
- `syncGlobals()` reassigns global `PRODUCTS` and `CATEGORIES` (`js/store.js:69-72`).
- Admin boot is in `js/admin.js:1171-1190`.

Admin routes parsed from `location.hash` (`js/admin.js:288-320`):

- `#/dashboard`
- `#/jerseys`
- `#/jerseys/new`
- `#/jerseys/<id>`
- `#/categories`
- `#/orders`
- `#/settings`

## Theme System

- Brand colors: Dusk `#2E2A4A`, Lavender `#C8C0E8`.
- Light mode uses a gray background, white surfaces, Dusk text/actions, and a Lavender header.
- Dark mode uses a deeper purple-black background, elevated surfaces, Lavender actions, and a Dusk header.
- Toggle appears in all storefront headers and the admin topbar.
- `js/theme.js` runs in `<head>` before body rendering to avoid a theme flash.
- Theme choice is stored in `localStorage` under `retrokit_theme`.
- With no saved choice, `prefers-color-scheme` controls the theme and later system changes are followed.
- Logo switching is CSS-driven: Dusk logo in light mode, Lavender logo in dark mode.
- Logo images render at 64px inside 72px storefront/admin headers.
- Theme variables live in `css/styles.css`; `css/checkout.css` and `css/admin.css` consume them.

## Brand and Content

- Visible brand is `N-KITS` across storefront titles, headers, footers, admin header, WhatsApp prefills, store settings default, seeded settings, and config comment.
- Internal `retrokit_` localStorage/sessionStorage keys and `project_id = "retrokit"` remain unchanged to avoid breaking stored data and Supabase config.
- Homepage positioning is "Every jersey. Every game."; copy covers club kits, national teams, fan favorites, and all supporters rather than retro-only wording.
- Hero background uses a clean thin-line SVG jersey, ball, and hoop plus CSS field lines, a moving sweep, sparks, and field/float/drift/spin/pulse animations.
- Hero motion is visibly paced at 2.4–12s with stronger opacity/movement and animates even when `prefers-reduced-motion` is enabled, per user request.
- Category cards use real Premier League, La Liga, and Serie A logos in padded white tiles; International shows Nigeria, Brazil, and Argentina flags.
- Homepage sections include Shop by Category, New Arrivals, Made for every fan, trust strip, and Find your next jersey CTA.
- Shop/cart/checkout copy was expanded or tightened; checkout no longer promises emailed receipts.

## Data Layer

Local storage keys:

- `retrokit_products`
- `retrokit_categories`
- `retrokit_settings`
- `retrokit_orders`
- `retrokit_cart`
- `retrokit_user`
- `retrokit_users`
- `retrokit_admin` in `sessionStorage`

Important functions:

- `readLS`/`writeLS`: `js/store.js:32-43`
- `getClient`: `js/store.js:50-67`
- row conversions: `js/store.js:85-152`
- local/remote load: `js/store.js:156-243`
- product CRUD: `js/store.js:247-296`
- category CRUD: `js/store.js:300-357`
- settings and WhatsApp helpers: `js/store.js:361-387`
- order CRUD and guest tracking: `js/store.js` `createOrder`, `updateOrder`, `deleteOrder`, `getOrders`, `trackOrder`
- image upload: `js/store.js` `uploadImage`

Remote reads query categories, products, settings, and latest 200 orders in parallel in `Store.loadRemote()`. Guest tracking uses the `track_order` RPC in remote mode and cached `Store.orders` in local mode.

## Checkout and Order Records

- Checkout is WhatsApp-only: `js/pages/checkout.js` validates contact/delivery fields and per-jersey customization, then calls `sendWhatsAppOrder()` in `js/cart.js`.
- `sendWhatsAppOrder()` opens WhatsApp synchronously, saves the order with `payment_channel: "whatsapp"` and `payment_status: "unpaid"`, then redirects to `order-sent.html?order=<id>`.
- `order-sent.html` and `js/pages/order-sent.js` render the saved order and clear the cart only after `I've sent the message`; admin can change `payment_status` from the order card for manual records.
- Guest tracking lives at `track.html`; require order number plus the WhatsApp phone or email used at checkout.
- Remote tracking calls `public.track_order(order_id, match, client_key)` so anon clients cannot scan all orders; local mode matches against cached `Store.orders`.
- Rate limits: 5 attempts per 10 minutes in-browser and server-side by hashed IP/client key; successful lookup clears the browser limit.
- Storefront footer and mobile nav link to `track.html`; `order-sent.html` adds `Track this order` with `?order=<id>`.

## Auth

- Customer auth is removed entirely; checkout is guest-only.
- `js/auth.js` is admin-only: Supabase password login via `Store.supabase()`, session restore, and `retrokit_admin_user`.
- Admin access:
  - Supabase mode trusts `app_metadata.is_admin` from the session, then falls back to `profiles.is_admin` (`js/auth.js:4-11`, `js/admin.js:138-152`).
  - Local mode checks SHA-256 hash and `sessionStorage.retrokit_admin` (`js/admin.js:154-165`, `js/admin.js:206-249`).
- Storefront HTML no longer uses `[data-auth]`, `[data-guest]`, or `[data-user-name]` hooks.

## Database

- Tables in `supabase/schema.sql`: `profiles`, `categories`, `products`, `settings`, `orders`, `order_track_attempts`.
- RLS enabled for all tables in `supabase/schema.sql`; `order_track_attempts` has no direct anon/authenticated grants.
- `public.track_order(bigint, text, text)` is a SECURITY DEFINER RPC granted to `anon`/`authenticated` for guest tracking.
- Public read policies for categories/products/settings.
- Public order insert; admin-only order read/update/delete.
- Admin profile self-read/admin read-all; no customer profile update policy.
- `orders.user_id` is removed and an idempotent drop migration is included.
- Public storage bucket: `product-images`.
- Seed data: categories/settings in `supabase/schema.sql:382-402`; 12 products in `supabase/schema.sql:404-466`.
- Admin grant instructions in `supabase/schema.sql:468-...`.

## Configuration Status

- Supabase URL and anon/public key are configured in `js/config.js:12-13`; Supabase CLI project ID is `rkhvgijdsvwtujbqangw` in `supabase/config.toml`.
- New Supabase project is reachable; the user ran `supabase/schema.sql`, and `track_order` RPC returns HTTP 200 with `[]`.
- First schema run lacked explicit table grants; the user re-ran the updated schema and anon reads were verified working.
- Production domain is intentionally unset pending user input; admin user `anahboniface2017@gmail.com` was created and promoted via Supabase Auth `app_metadata.is_admin`.
- Service role key was used transiently and must be rotated because it was shared in chat; it was not written to any repo file.
- Default WhatsApp number is sample value `2348012345678`: `js/config.js:30` and `supabase/schema.sql` settings seed.
- Local admin hash is committed in `js/config.js:27`; replacement instructions are in `js/config.js:18-26`.
- Image upload requires Supabase.
- Guest tracking requires the `track_order` RPC from `supabase/schema.sql` to be applied; local mode still works from cached orders.
- No customer email/SMTP/OTP or Supabase auth redirect URLs are required; admin login uses Supabase Auth email/password.
- If admin email confirmation or password reset is enabled, configure Supabase Auth SMTP/redirects manually; otherwise create/confirm the admin user in the Supabase dashboard.
- Supabase free projects pause after ~7 days of inactivity; a daily REST ping using anon/publishable key can prevent this, but GitHub scheduled workflows can be disabled after repo inactivity and an external monitor is more reliable; paid plans avoid the tradeoff.

## Setup Commands Documented in Source

- Generate local admin hash:
  `node -e "console.log(require('crypto').createHash('sha256').update('YOUR PASSWORD').digest('hex'))"`
- Apply schema manually in Supabase SQL Editor from `supabase/schema.sql`; this creates the guest-tracking RPC and rate-limit table.
- Create admin user in Supabase Dashboard -> Authentication -> Users, then run the `GRANT ADMIN` statement in `supabase/schema.sql`.

No install/dev/build/test/lint/typecheck/format commands are defined.

## Conventions

- Classic scripts and globals for browser code.
- Preserve script order in all HTML pages.
- Put shared data operations in `Store`, not page scripts.
- Use `retrokit_` prefix for `localStorage` keys.
- Use `formatPrice()` from `js/data.js:48-50` for naira display.
- 2-space indentation, semicolons, mixed quote style; newer shared/admin code mostly uses double quotes.
- Admin generated HTML uses `esc()` (`js/admin.js:80-87`); storefront rendering does not consistently escape.
- CSS uses variables from `css/styles.css:6-21`; page CSS references those variables.
- Silent `catch (e) {}` blocks are common for storage and best-effort refresh.

## Observed Issues, Not Approved For Change

These were found during exploration. Do not fix them without explicit user instruction.

- Storefront generated HTML lacks consistent escaping: `js/app.js:5-26`, `js/pages/index.js:2-8`, `js/pages/shop.js:5-10`, `js/pages/product.js:21-56`, `js/pages/cart.js:18-32`, `js/pages/checkout.js:16-24`.
- Admin-only auth cache uses `localStorage.retrokit_admin_user`; treat it as a convenience cache, not a security boundary: `js/auth.js:33-49`.
- Local admin gate is weak by design: `js/config.js:18-27`, `js/admin.js:154-165`.
- Configured-but-unreachable Supabase may lock admin out: `js/admin.js` boot/admin access paths.
- Remote settings/order read failures are ignored: `js/store.js:187`, `js/store.js:195`.
- `saveProduct()` and `saveCategory()` return input objects instead of normalized saved rows in remote mode: `js/store.js:277`, `js/store.js:338`.
- Some listeners are wired after `await` in admin boot, limiting failure-path usability: `js/admin.js` boot path.
- Custom size values are embedded in inline handlers with weak quoting: `js/app.js:19`, `js/pages/cart.js:25-29`, `js/admin.js:735-744`.
- CDN versions are unpinned: Supabase `@2`.
- CSS has stale/duplicated rules: `css/styles.css:3`, `100-107`, `1040-1047`, `1053-1088`, `1097-1121`.
- `rowToProduct(row, slugById)` has an unused `slugById` parameter: `js/store.js:85`.

## Change Log

### 2026-11-25 — Initial handoff file

- Changed: created the handoff file under an incorrect filename.
- Why: user requested a persistent stop point and context file with working rules and current status.
- Verification: repository root was inspected; codebase was explored; no application code was edited.
- Application code changes: none.

### 2026-11-25 — Filename correction

- Changed: renamed the handoff file to `NK.md` and corrected internal filename references.
- Why: user specified the exact filename as `NK.md`.
- Verification: `NK.md` exists, the old filename was removed, and no application code was edited.
- Application code changes: none.

### 2026-11-25 — Light/dark theme

- Changed: added `js/theme.js`, copied two logo assets into `assets/logo/`, added theme toggles to all storefront headers and the admin topbar, replaced text logos with theme-aware images, and converted CSS colors to Dusk/Lavender-themed variables.
- Why: user requested a light/dark toggle using Dusk `#2E2A4A` and Lavender `#C8C0E8`, with the Lavender logo in dark mode, Dusk logo in light mode, system preference as the default, and saved toggle choice.
- Files changed: `js/theme.js`, `assets/logo/logo-dusk-transparent.png`, `assets/logo/logo-lavender-transparent.png`, `css/styles.css`, `css/checkout.css`, `css/admin.css`, `index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`, `login.html`, `register.html`, `verify.html`, `account.html`, `admin.html`, `NK.md`.
- Verification: `node --check js/theme.js` passed; grep confirmed all pages load `js/theme.js`, contain a theme toggle, and use the theme-aware logos; grep confirmed legacy primary red/dark hardcoded theme values were removed from CSS; no test/lint/typecheck command exists in the repository.
- Theme behavior: first visit follows `prefers-color-scheme`; later visits use `retrokit_theme` from `localStorage`.

### 2026-11-25 — Logo size increase

- Changed: increased `.logo-img` from 28px to 48px in `css/styles.css`.
- Why: user said the logo was too small.
- Verification: confirmed both copied logo files are 2000x2000 square PNGs and inspected the updated shared logo rule.
- Files changed: `css/styles.css`, `NK.md`.

### 2026-11-25 — Further logo enlargement

- Changed: increased `.logo-img` from 48px to 64px, raised storefront and admin header height from 60px to 72px, and shifted toast/mobile-nav/sticky offsets to match.
- Why: user said the N-KITS text in the logo was still barely visible at 48px.
- Verification: inspected updated logo and header rules in `css/styles.css` and `css/admin.css`.
- Files changed: `css/styles.css`, `css/admin.css`, `NK.md`.

### 2026-11-25 — Brand rename and storefront content

- Changed: replaced visible `RetroKit`/`RETROKIT` brand text with `N-KITS`, renamed default store settings/seed/config comment, updated admin placeholders to `orders@n-kits.ng` and `@n-kits`, and changed file-header labels.
- Why: user said the brand is N-KITS, the store sells every jersey rather than only retro kits, and visible copy should not be retro-centered.
- Files changed: `index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`, `login.html`, `register.html`, `verify.html`, `account.html`, `admin.html`, `js/app.js`, `js/auth.js`, `js/config.js`, `js/admin.js`, `js/cart.js`, `js/data.js`, `js/store.js`, `js/pages/checkout.js`, `js/pages/product.js`, `css/styles.css`, `css/checkout.css`, `css/admin.css`, `supabase/schema.sql`, `supabase/config.toml`, `NK.md`.
- Homepage details: removed `Authentic Retro` pill, replaced hero with "Every jersey. Every game.", added CSS/SVG sports background animations, renamed "Shop by League" to "Shop by Category", added "Made for every fan" feature cards and closing CTA, and changed trust copy from "Authentic Look" to "Everyday Quality".
- Other copy details: added short page intros to shop and cart, changed shop filter label "League" to "Category", and removed emailed-receipt promises from checkout copy.
- Verification: `node --check` passed for all changed JS files; CSS brace counts matched (`css/styles.css 263/263`, `css/checkout.css 21/21`, `css/admin.css 135/135`); grep confirmed no old brand strings remain in app files outside `NK.md`.
- Internal names preserved: `retrokit_` storage keys and `project_id = "retrokit"` were not changed.

### 2026-11-25 — Hero animation visibility

- Changed: added a `.hero-sweep` element, sped up hero animations, enlarged movement, increased line/shape/spark opacity, animated the field and inner ring, and extended reduced-motion disabling to pseudo-elements.
- Why: user said the animation looked static after the earlier hero work.
- Files changed: `index.html`, `css/styles.css`, `NK.md`.
- Verification: `css/styles.css` brace counts matched at 273/273; grep confirmed the sweep element, all seven hero keyframes, and the reduced-motion block are present.

### 2026-11-25 — Hero override and real category imagery

- Changed: removed the hero-scene `prefers-reduced-motion` disable block, downloaded real league logos and country flags into `assets/categories/`, added a slug-keyed `CATEGORY_MEDIA` map in `js/pages/index.js`, updated local/Supabase category seeds, and added CSS for image icons and flag stacks.
- Why: user said the hero still looked static in Live Server and asked for real EPL, La Liga and other league logos plus country flags for international.
- Files changed: `css/styles.css`, `js/pages/index.js`, `js/data.js`, `supabase/schema.sql`, `css/admin.css`, `assets/categories/premier-league.svg`, `assets/categories/la-liga.svg`, `assets/categories/serie-a.svg`, `assets/categories/ng.png`, `assets/categories/br.png`, `assets/categories/ar.png`, `NK.md`.
- Sources: league SVGs from Wikimedia Commons; flags from FlagCDN; saved locally so Live Server does not depend on remote image availability.
- Verification: `node --check` passed for `js/pages/index.js` and `js/data.js`; CSS brace counts matched (`css/styles.css 274/274`, `css/admin.css 137/137`); grep confirmed no `prefers-reduced-motion` block remains and all six local asset paths exist.

### 2026-11-25 — Cleaner hero jersey

- Changed: replaced the crude jersey path with a thin-line football kit silhouette with collar and sleeve seams, and removed its drop shadow with lighter stroke/opacity.
- Why: user said the hero jersey looked tacky.
- Files changed: `index.html`, `css/styles.css`, `NK.md`.
- Verification: `css/styles.css` brace counts matched at 274/274; grep confirmed the old jersey path is gone and the new `.hero-jersey` overrides are present.

### 2026-11-25 — Category logo padding

- Changed: enlarged category icon containers to 56x44, added 6px padding and a bordered white tile behind storefront league logos, and applied matching 40x30 padded tiles in admin.
- Why: user said the EPL/La Liga logos looked compressed.
- Files changed: `css/styles.css`, `css/admin.css`, `NK.md`.
- Verification: CSS brace counts matched (`css/styles.css 274/274`, `css/admin.css 137/137`); grep confirmed the new padding rules are present.

### 2026-11-25 — Simplified nav and jersey customization

- Changed: removed league links from desktop/mobile storefront navigation and added `Custom` pointing to `shop.html?custom=1` on `index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`, and `account.html`.
- Changed: added a `?custom=1` shop banner with the live fee label; added per-jersey name/number controls in checkout with validation for 1–15 letters/numbers/spaces and numbers 0–99.
- Changed: added cart customization helpers (`customEnabled`, `isCustomized`, `getCustomizationFee`, `getCustomizationTotal`, `getCartSubtotal`, `validateCustomization`), saved `custom` on cart items, and applied the fee per customized jersey × quantity.
- Changed: included custom name/number and the customization total in WhatsApp messages, local order payloads, admin order cards, and saved order lines/totals.
- Changed: added `customization_fee` default `3000` to `js/store.js`, admin settings, and `supabase/schema.sql`; the fee is applied in `js/cart.js` and shown in checkout/admin totals.
- Why: user wanted a simpler nav, per-jersey customization instead of one form for the whole order, and an admin-configurable ₦3,000 fee.
- Files changed: `index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`, `account.html`, `js/pages/shop.js`, `js/pages/cart.js`, `js/pages/checkout.js`, `js/cart.js`, `js/store.js`, `js/admin.js`, `supabase/schema.sql`, `css/styles.css`, `css/checkout.css`, `css/admin.css`, `NK.md`.
- Verification: `node --check` passed for all changed browser JS files; CSS brace counts matched (`css/styles.css 279/279`, `css/checkout.css 33/33`, `css/admin.css 138/138`); grep confirmed no league filter links remain in HTML nav and all customization identifiers are present; no TypeScript tooling exists in the repository to compile the edge function.

### 2026-11-25 — Floating WhatsApp button and homepage customization copy

- Changed: added a fixed bottom-right WhatsApp button from `js/theme.js`; the link is refreshed from `Store.buildWhatsAppUrl()` at load and on click to use the admin-configured number.
- Changed: added `.wa-fab` styles in `css/styles.css` with fixed positioning, green circular icon, hover/focus lift, and smaller mobile sizing.
- Changed: homepage hero now lists `Custom names & numbers`, a new `Make it yours` feature card explains the ₦3,000 per-jersey fee, and the closing CTA mentions customization; `.feature-grid` now uses `auto-fit` so four cards lay out cleanly.
- Why: user asked for a persistent WhatsApp icon on all pages and said jersey customization was not visible on the homepage.
- Files changed: `js/theme.js`, `css/styles.css`, `index.html`, `NK.md`.
- Verification: `node --check js/theme.js` passed; CSS brace counts matched `css/styles.css 285/285`; grep confirmed all 10 HTML pages load `js/theme.js` and the new WhatsApp/customization classes and copy are present.
- Pending at the time: dedicated `custom.html` was awaiting approval; see the next entry for completion.

### 2026-11-25 — Dedicated Custom page

- Changed: created `custom.html` with a customization hero, jersey preview, three-step “How customizing works” section, customization option cards, FAQ, and a final “Start Customizing” CTA.
- Changed: the hero, option cards, and FAQ use `.js-custom-fee` elements updated from `getCustomizationFee()`, so the admin-configured fee is reflected on the page; default fallback is ₦3,000.
- Changed: every `Custom` nav link now points to `custom.html`; the homepage “Make it yours” card links to the new page, and page CTAs still open `shop.html?custom=1` so the existing shop banner appears.
- Why: user approved building the proposed Custom page instead of sending the Custom tab directly to the shop page.
- Files changed: `custom.html`, `index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`, `account.html`, `css/styles.css`, `NK.md`.
- Verification: CSS brace counts matched `css/styles.css 315/315`; tag pairing in `custom.html` matched for `section`, `article`, `details`, `header`, `footer`, and `nav`; grep confirmed all Custom nav links point to `custom.html` and only the two Custom-page CTAs use `shop.html?custom=1`.

### 2026-11-25 — Custom page hero adjustments

- Changed: removed the `Custom jerseys` pill from the `custom.html` hero.
- Changed: widened `.custom-kit` from `min(280px, 78vw)` to `min(380px, 86vw)`, changed its ratio from `1 / 1.08` to `1 / 0.96`, and widened the mobile size from `min(230px, 72vw)` to `min(300px, 84vw)`.
- Why: user said the pill should be removed and the hero jersey was too slender.
- Files changed: `custom.html`, `css/styles.css`, `NK.md`.
- Verification: CSS brace counts matched `css/styles.css 315/315`; grep confirmed the pill markup is gone from `custom.html` and the new jersey width/ratio rules are present.

### 2026-11-25 — Wider Custom page jersey

- Changed: increased `.custom-kit` width to `min(460px, 92vw)` with `max-width: 100%`, changed the ratio to `1 / 0.8`, widened the jersey silhouette and collar, and enlarged the preview name/number.
- Changed: increased the mobile jersey width to `min(340px, 88vw)` and the mobile number size to `4rem`.
- Why: user said the jersey was still too slender after the first width increase.
- Files changed: `css/styles.css`, `NK.md`.
- Verification: CSS brace counts matched `css/styles.css 315/315`; grep confirmed the wider width, ratio, and mobile rules are present.

### 2026-11-25 — Balanced Custom page jersey

- Changed: tuned `.custom-kit` to a middle width of `min(420px, 90vw)` with ratio `1 / 0.87`, slightly narrowed the silhouette and collar, and reduced the preview number to `4.4rem`.
- Changed: set the mobile jersey to `min(320px, 86vw)` with a `3.6rem` number.
- Why: user said the previous adjustment was too fat after the earlier version was too slender.
- Files changed: `css/styles.css`, `NK.md`.
- Verification: CSS brace counts matched `css/styles.css 315/315`; grep confirmed the balanced width, ratio, and mobile rules are present.

### 2026-11-25 — Separate name and number customization

- Changed: replaced the single `Add name & number` toggle with independent `Add name` and `Add number` toggles, each with its own input; disabled inputs are ignored and re-enabled values are restored.
- Changed: cart data now stores `custom: { name, number }` with either field optional; `isCustomized()` and the fee apply when at least one field has a value.
- Changed: validation now requires a value only for enabled fields, accepts name-only, number-only, or both, and rejects invalid names or numbers 100+.
- Changed: WhatsApp messages, local order payloads, admin order lines, and saved order lines now display/charge partial customization correctly; the old `custom.enabled` requirement was removed.
- Changed: copy on checkout, shop banner, homepage, Custom page, FAQ, and the admin fee label now says name, number, or both.
- Why: user said name and number must be separate so a user can write just the name or just the number.
- Files changed: `js/cart.js`, `js/pages/checkout.js`, `css/checkout.css`, `checkout.html`, `custom.html`, `shop.html`, `index.html`, `js/admin.js`, `NK.md`.
- Verification: `node --check` passed for `js/cart.js`, `js/pages/checkout.js`, and `js/admin.js`; CSS brace counts matched (`css/styles.css 315/315`, `css/checkout.css 33/33`, `css/admin.css 138/138`); `custom.html` tag pairing matched; grep confirmed no old combined-toggle, `customize-fields`, or `enabled: true` customization code remains.

### 2026-11-25 — WhatsApp order return flow

- Changed: added `sendWhatsAppOrder()` in `js/cart.js` so cart and checkout both open WhatsApp synchronously, save the order with `payment_channel: "whatsapp"` and `payment_status: "unpaid"`, store the last order ID in `retrokit_last_wa_order`, and redirect the site tab to `order-sent.html?order=<id>`.
- Changed: `checkout.js` now passes form customer/contact details into the shared helper after field validation instead of directly opening WhatsApp and saving the order.
- Changed: created `order-sent.html` and `js/pages/order-sent.js` with an order summary, pending/confirmed states, and an `I've sent the message` button that clears the cart only after explicit user confirmation.
- Changed: added order-sent card/summary/actions styles in `css/styles.css`.
- Changed: admin order cards now include a payment-status select (`unpaid`, `paid`, `failed`, `refunded`), and `Store.updateOrder()` accepts `payment_status` patches for local and remote orders.
- Why: user asked what happens after sending a WhatsApp order and approved the build-with-confirmation-button option so the cart is not cleared before the user confirms the message was sent.
- Files changed: `js/cart.js`, `js/pages/checkout.js`, `order-sent.html`, `js/pages/order-sent.js`, `css/styles.css`, `js/admin.js`, `js/store.js`, `NK.md`.
- Verification: `node --check` passed for `js/cart.js`, `js/pages/checkout.js`, `js/pages/order-sent.js`, `js/admin.js`, and `js/store.js`; CSS brace counts matched (`css/styles.css 334/334`, `css/checkout.css 33/33`, `css/admin.css 138/138`); `order-sent.html` tag pairing matched for `header`, `footer`, `nav`, and `main`; grep confirmed the new helper, redirect target, confirmation button, last-order key, admin payment select, and store patch are present.

### 2026-11-25 — Admin order control spacing

- Changed: the admin Orders toolbar now uses a dedicated `orders-toolbar` class with left alignment and an `8px` gap, so the two filter dropdowns and Refresh button sit together on the left.
- Changed: `.order-foot` now uses left alignment and an `8px` gap, so status, payment-status, and Delete controls inside each order card sit together instead of spreading across the card.
- Why: user disliked the wide space between controls and wanted the dropdowns grouped on the left in both the orders toolbar and order cards.
- Files changed: `js/admin.js`, `css/admin.css`, `NK.md`.
- Verification: `node --check js/admin.js` passed; CSS brace counts matched `css/admin.css 139/139`; grep confirmed `.orders-toolbar` and the left-aligned `.order-foot` rules are present.

### 2026-11-25 — Admin dropdown arrow spacing

- Changed: admin `.sort-select` elements now use `padding-right: 30px`, a custom SVG chevron, and `background-position: right 10px center`, so the arrow sits farther from the right border.
- Why: user said the dropdown arrow was too close to the right edge of the button.
- Files changed: `css/admin.css`, `NK.md`.
- Verification: CSS brace counts matched `css/admin.css 140/140`; grep confirmed the right padding, custom arrow, and right-positioned background rules are present.

### 2026-11-25 — Initial-capitalized status labels

- Changed: added `displayLabel()` in `js/cart.js` to capitalize visible labels and render `whatsapp` as `WhatsApp`; stored values stay lowercase so existing data, filters, and order updates keep working.
- Changed: admin dashboard/order cards/filters/toasts now show labels like `Pending`, `Paid`, `Cancelled`, `All Statuses`, `All Payments`, and `WhatsApp` instead of lowercase text.
- Changed: account orders and the WhatsApp order-sent page now show initial-capitalized status/payment labels in the form `Payment: Unpaid · Status: Pending`.
- Changed: visible checkout/order-sent copy now uses `Payment Cancelled — You can Try Again`, `I've Paid — Check Again`, `Order Sent`, and `Confirmed — Waiting for Review`.
- Why: user asked not to use only lowercase for statuses and labels such as WhatsApp, paid, confirmed, and pending.
- Files changed: `js/cart.js`, `js/admin.js`, `js/pages/account.js`, `js/pages/order-sent.js`, `js/pages/checkout.js`, `checkout.html`, `order-sent.html`, `NK.md`.
- Verification: `node --check` passed for all changed JS files; grep confirmed capitalized labels are present and no old lowercase status-label output patterns remain.

### 2026-11-25 — Shared displayLabel fix for admin startup

- Changed: moved `displayLabel()` from `js/cart.js` to `js/store.js`, which every HTML page loads before page scripts.
- Why: admin startup failed with `displayLabel is not defined` because `admin.html` does not load `js/cart.js`; the stale-cache/config message was generic fallback text, not the real cause.
- Files changed: `js/cart.js`, `js/store.js`, `NK.md`.
- Verification: `node --check` passed for `js/store.js`, `js/cart.js`, `js/admin.js`, `js/pages/account.js`, and `js/pages/order-sent.js`; grep confirmed exactly one `displayLabel()` definition in `js/store.js`.

### 2026-11-25 — Profile order strips

- Changed: account orders are no longer inside one `My Orders` card; each order now renders as its own responsive `.order-strip`.
- Changed: each strip automatically grows to contain all order items, with jersey image, name, size, quantity, custom name/number, item price, order number, date, order total, status badge, and payment badge.
- Changed: all matching orders are shown instead of only the first five, with an empty-state card when none exist.
- Changed: added `.order-strip`, `.strip-item`, `.strip-side`, `.status-badge`, and responsive styles in `css/styles.css`; payment badges now keep initial capitalization instead of forcing uppercase.
- Why: user wanted profile orders displayed as expanded stripes with product details and status/payment labels rather than a compact single-card list.
- Files changed: `js/pages/account.js`, `css/styles.css`, `NK.md`.
- Verification: `node --check js/pages/account.js` passed; CSS brace counts matched `css/styles.css 365/365`; grep confirmed the new strip classes are rendered and styled.

### 2026-11-25 — Interactive Custom page jersey preview

- Changed: the Custom page jersey preview now tilts toward the pointer with CSS 3D transforms, floats upward, gains a drop shadow, and shows a pointer-following radial shine plus a sweeping sheen.
- Changed: the preview name lifts and widens its letter spacing, the number pops with a keyframe, the ground glow expands, and the label highlights on hover/focus.
- Changed: `custom.html` now gives the jersey `tabindex="0"`, `role="img"`, and an accessible label, with inline pointer tracking that resets on leave/cancel/blur.
- Why: user wanted the example jersey preview to be interactive on hover with creative animations.
- Files changed: `custom.html`, `css/styles.css`, `NK.md`.
- Verification: inline script parsed successfully with `new Function`; CSS brace counts matched `css/styles.css 381/381`; `custom.html` tag pairing matched for `section`, `article`, `details`, `header`, `footer`, and `nav`; grep confirmed the tilt, shine, and keyframe rules are present.

### 2026-11-25 — Editable plain jersey preview

- Changed: replaced the generic club-style CSS jersey with a plain Dusk-colored SVG jersey that has no club, country, badge, or sponsor.
- Changed: the preview name and number are now `contenteditable` fields; clicking either selects its text so the shopper can type their own and see it live on the jersey.
- Changed: the editable preview is demo-only and does not carry into checkout; actual customization remains per-jersey at checkout.
- Changed: preview name accepts up to 15 characters with whitespace collapsed and HTML characters removed; number accepts only digits and up to 2 characters.
- Changed: pointer glow now updates the SVG radial gradient center, while the existing tilt, sheen, name/number animation, and keyboard focus effects remain.
- Why: user wanted a realistic plain jersey preview with clickable name and number fields instead of a generic generated preview.
- Files changed: `custom.html`, `css/styles.css`, `NK.md`.
- Verification: inline script parsed successfully with `new Function`; CSS brace counts matched `css/styles.css 394/394`; `custom.html` tag pairing matched for `div`, `span`, `svg`, `defs`, gradients, `section`, `article`, `details`, `header`, `footer`, and `nav`; grep confirmed no old `--shine-x` rules remain.

### 2026-11-25 — Real jersey image and no hover animations

- Changed: replaced the inline SVG jersey with the real asset `assets/custom/dusk-plain-jersey.webp`, downloaded from CleanPNG's plain purple soccer jersey template source.
- Changed: removed all hover/tilt/sheen/glow/keyframe/ground-shadow animations from the Custom preview; only the click-to-edit name and number behavior remains.
- Changed: removed pointer-tracking JavaScript and kept only the editable-field sanitization, paste handling, focus selection, and input limits.
- Why: user explicitly said not to use a generated image and asked to remove the tacky hover animations.
- Files changed: `custom.html`, `css/styles.css`, `assets/custom/dusk-plain-jersey.webp`, `NK.md`.
- Verification: inline script parsed successfully with `new Function`; CSS brace counts matched `css/styles.css 368/368`; `custom.html` tag pairing matched; grep confirmed no `animation`, `@keyframes`, `pointermove`, tilt, sheen, glow, or transition rules remain in the preview. The downloaded image could not be visually inspected in this environment, so its visual suitability should be confirmed in the browser.

### 2026-11-25 — Back-view jersey only

- Changed: replaced the full/plain jersey asset with `assets/custom/back-jersey.webp`, a transparent back-view soccer jersey image downloaded from `https://www.pngsucai.com/png/1545939.html`; source tags identify back view, number, and printing.
- Changed: `custom.html` now points to the back-view asset and uses alt text `Back view Dusk jersey with editable name and number`.
- Changed: `css/styles.css` sizes the preview to a square back view and applies a Dusk CSS filter so the editable name/number overlays sit on the back panel.
- Changed: removed the unused `assets/custom/dusk-plain-jersey.webp` asset.
- Why: user said they did not ask for a full-dimension/full jersey image and only wanted the back view showing name and number.
- Files changed: `custom.html`, `css/styles.css`, `assets/custom/back-jersey.webp`, deleted `assets/custom/dusk-plain-jersey.webp`, `NK.md`.
- Verification: inline script parsed successfully with `new Function`; CSS brace counts matched `css/styles.css 368/368`; `custom.html` tag pairing matched; grep confirmed the old asset is no longer referenced in HTML/CSS. The image could not be visually inspected in this environment, so the user should hard-refresh and confirm placement in the browser.

### 2026-11-25 — User-supplied jersey cut-out with real inputs

- Changed: used `C:\Users\DELL\Downloads\jersey image\test 2 jersey.jpg` as the preview image, removed its background with a temporary local rembg tool, cropped to the jersey alpha bounds, and saved `assets/custom/jersey-back.png` (346×426 RGBA).
- Changed: replaced the contenteditable name/number spans with real `<input>` fields while keeping name sanitization, number-only input, and length limits.
- Changed: removed the square aspect ratio and Dusk filter from the preview so the supplied jersey shape is shown as-is.
- Changed: removed the unused `assets/custom/back-jersey.webp` asset.
- Why: user said to use the image in their Downloads folder, remove the background, add name and number inputs, and not use the square downloaded jersey placeholder.
- Files changed: `custom.html`, `css/styles.css`, `assets/custom/jersey-back.png`, deleted `assets/custom/back-jersey.webp`, `NK.md`.
- Verification: inline script parsed successfully with `new Function`; CSS brace counts matched `css/styles.css 367/367`; `custom.html` tag pairing matched; alpha bbox confirmed transparent margins at 10px around the cropped asset; grep confirmed no `contenteditable`, `data-placeholder`, `execCommand`, old asset, or square preview rules remain in HTML/CSS. The image cannot be visually inspected in this environment, so the user should hard-refresh and confirm the background removal and input placement in the browser.

### 2026-11-25 — Preview font and size controls

- Changed: added four dropdowns under the jersey preview: name font, name size, number font, and number size.
- Changed: name font options are Classic, Block, Condensed, Serif, and Script; number font options are Block, Classic, Condensed, and Serif; both sizes use Small, Medium, and Large.
- Changed: dropdown changes apply font-family and font-size directly to the preview inputs using local system font stacks, with no external font dependency.
- Changed: kept these controls preview-only; actual checkout customization still uses the existing per-jersey name/number fields.
- Why: user asked for buttons or dropdowns to choose font and size for both the name and number.
- Files changed: `custom.html`, `css/styles.css`, `NK.md`.
- Verification: inline script parsed successfully with `new Function`; CSS brace counts matched `css/styles.css 375/375`; `custom.html` tag pairing matched including `label`, `select`, and `option`; grep confirmed all four `data-preview-option` controls and `applyStyle` wiring are present.

### 2026-11-25 — Google font library and numeric sizes

- Changed: added a Google Fonts stylesheet with 27 families: Abel, Anton, Archivo Black, Bangers, Barlow Condensed, Bebas Neue, Caveat, Cinzel, Dancing Script, Great Vibes, Inter, Lobster, Lora, Montserrat, Oswald, Pacifico, Playfair Display, Press Start 2P, Roboto Condensed, Rubik Mono One, Russo One, Shrikhand, Staatliches, Teko, Titan One, Ultra, and Unbounded.
- Changed: both font dropdowns are now generated from one grouped font library with Clean, Sport, Serif, and Script sections.
- Changed: replaced Small/Medium/Large size dropdowns with real numeric pixel inputs: name defaults to 14px with 8–32px range, number defaults to 70px with 24–120px range.
- Changed: script fonts keep mixed case and tighter spacing; all other name fonts use uppercase styling.
- Changed: kept these controls preview-only; actual checkout customization still uses the existing per-jersey name/number fields.
- Why: user said the small font set was not enough and wanted actual font size numbers instead of labels.
- Files changed: `custom.html`, `css/styles.css`, `NK.md`.
- Verification: Google Fonts URL returned valid `@font-face` CSS; inline script parsed successfully with `new Function`; CSS brace counts matched `css/styles.css 376/376`; `custom.html` tag pairing matched; grep confirmed 27 font library entries, 27 Google font families, and no old Small/Medium/Large size options.

### 2026-11-25 — Move customization fee into hero copy

- Changed: removed the ₦3,000 chip from the hero points on `custom.html`.
- Changed: added the fee to the hero description as `for <span class="js-custom-fee">₦3,000</span> per customized jersey` so it stays admin-editable.
- Why: user asked to remove ₦3,000 from the hero chips and add it in the hero writeup.
- Files changed: `custom.html`, `NK.md`.
- Verification: inline script parsed successfully with `new Function`; `custom.html` tag pairing matched; grep confirmed the hero points now contain only `Any jersey` and `Name or number`, while the fee remains in the hero description and other existing writeups.

### 2026-11-25 — Hero heading capitalization

- Changed: `index.html` hero heading is now `Every Jersey.<br />Every Game.`.
- Changed: `custom.html` hero heading is now `Your Name. Your Number. Your Jersey.`.
- Why: user requested initial capitalization for both hero headings.
- Files changed: `index.html`, `custom.html`, `NK.md`.
- Verification: grep confirmed both new headings are present and the old lowercase wording is gone.

### 2026-11-25 — Sticky shop category card

- Changed: `.filters` on `shop.html` is now sticky at `top: 92px` across breakpoints so Category and Price stay visible while products scroll.
- Changed: added `align-self: start` so the card keeps its natural height instead of stretching into a long empty panel.
- Changed: added `max-height: calc(100vh - 112px)` with internal `overflow-y: auto` so the card stays compact and its contents can be reached if the viewport is short.
- Changed: added `z-index: 5` to keep the card above product cards while sticky.
- Why: user said the category contents disappear on scroll while a long empty card remains and wants categories visible while scrolling.
- Files changed: `css/styles.css`, `NK.md`.
- Verification: CSS brace counts matched `css/styles.css 376/376`; grep confirmed the sticky, align-self, max-height, and overflow rules are present.

### 2026-11-25 — Remove shop product count

- Changed: removed the `12 jerseys` / dynamic `shop-count` element from above the shop product grid.
- Changed: removed the JS that wrote to `shop-count`.
- Changed: aligned the remaining sort dropdown to the right and removed the unused `.shop-count` CSS.
- Why: user asked to remove the jersey count above the listing cards.
- Files changed: `shop.html`, `js/pages/shop.js`, `css/styles.css`, `NK.md`.
- Verification: `node --check js/pages/shop.js` passed; CSS brace counts matched `css/styles.css 375/375`; grep confirmed no `shop-count` or `12 jerseys` remains.

### 2026-11-25 — Signup subtitle copy

- Changed: `register.html` subtitle is now `Create your account to save your details and track your orders.`
- Why: user said `Join N-KITS and start collecting` was confusing and did not say what users would collect.
- Files changed: `register.html`, `NK.md`.
- Verification: grep confirmed the old subtitle is gone and the new copy is present.

### 2026-11-25 — Remove WhatsApp button from admin

- Changed: `initWhatsAppButton()` in `js/theme.js` now skips creation when `body` has `admin-body`.
- Changed: added `.admin-body .wa-fab { display: none; }` in `css/admin.css` as a defensive fallback.
- Why: user asked to remove the bottom-right WhatsApp icon from the admin panel.
- Files changed: `js/theme.js`, `css/admin.css`, `NK.md`.
- Verification: `node --check js/theme.js` passed; CSS brace counts matched `css/admin.css 141/141`; grep confirmed both the admin-body guard and hide rule are present.

### 2026-11-25 — Logout styling and sign-in loading state

- Changed: account logout now uses `.btn-logout` with a danger-tinted background, border, and pill radius in `css/styles.css`.
- Changed: admin sidebar logout now uses `.admin-logout-btn` with a danger-tinted background, border, and pill radius in `css/admin.css`.
- Changed: added reusable `.btn.is-loading` and `@keyframes btn-spin` in `css/styles.css`.
- Changed: customer login disables its submit button and shows the spinner while `login()` runs; state is cleared in `finally`.
- Changed: admin sign-in disables its submit button and shows the spinner while `onLoginSubmit()` runs; state is cleared in `finally`.
- Why: user wanted the logout button to look like a real button and wanted a loading animation on sign-in clicks for better UI/UX.
- Files changed: `css/styles.css`, `css/admin.css`, `js/pages/account.js`, `admin.html`, `js/pages/login.js`, `js/admin.js`, `NK.md`.
- Verification: `node --check js/admin.js`, `node --check js/pages/login.js`, and `node --check js/pages/account.js` passed; CSS brace counts matched `css/styles.css 381/381` and `css/admin.css 143/143`; grep confirmed logout classes, loading classes, and `btn-spin` are present.

### 2026-11-25 — Nav link spacing

- Changed: `.nav` gap increased from `24px` to `48px` in `css/styles.css`.
- Why: user asked for more space between the Home, Shop, and Custom nav tabs.
- Files changed: `css/styles.css`, `NK.md`.
- Verification: CSS brace counts matched `css/styles.css 381/381`; grep confirmed `.nav` uses `gap: 48px`.

### 2026-11-25 — WhatsApp-only checkout cleanup

- Changed: removed the Paystack/card payment card, retry controls, success panel, Inline JS script, and Paystack-specific copy from `checkout.html`.
- Changed: rewrote `js/pages/checkout.js` to validate contact/delivery fields and per-jersey customization, then call `sendWhatsAppOrder()` only.
- Changed: removed Paystack constants, settings, helpers, exports, admin settings, and edge-function code from `js/config.js`, `js/store.js`, `js/admin.js`, `supabase/schema.sql`, and `supabase/config.toml`.
- Changed: removed obsolete card-payment CSS from `css/checkout.css` and deleted `supabase/functions/paystack/`.
- Changed: updated storefront/copy and `NK.md` so current architecture describes WhatsApp-only checkout; admin `payment_status` remains for manual records.
- Why: user said Paystack is being scrapped entirely and orders are strictly on WhatsApp.
- Files changed: `checkout.html`, `js/pages/checkout.js`, `js/config.js`, `js/store.js`, `js/admin.js`, `js/pages/account.js`, `index.html`, `custom.html`, `css/checkout.css`, `supabase/schema.sql`, `supabase/config.toml`, `NK.md`; deleted `supabase/functions/paystack/index.ts`.
- Verification: `node --check` passed on all changed JS; CSS brace counts matched `css/styles.css 381/381`, `css/admin.css 143/143`, and `css/checkout.css 24/24`; grep found no Paystack/card-payment references in application files; `supabase/functions/**` no longer contains files.

### 2026-11-25 — Cart WhatsApp CTA

- Changed: cart summary now has one primary `Order on WhatsApp` button that calls `placeOrderOnWhatsApp()`.
- Changed: removed the `Proceed to Checkout` link and the separate `Order on WhatsApp instead` button.
- Why: user wanted only one checkout/order CTA on the cart page, labeled `Order on WhatsApp`.
- Files changed: `js/pages/cart.js`, `NK.md`.
- Verification: `node --check js/pages/cart.js` passed; grep confirmed the old CTA labels are gone and the new WhatsApp CTA is present.

### 2026-11-25 — Guest checkout and admin-only auth cleanup

- Changed: removed all customer auth pages, scripts, nav links, script includes, OTP CSS, account CSS, and customer profile/order RLS assumptions.
- Changed: `js/auth.js` is now admin-only and uses `retrokit_admin_user`; `js/admin.js` keeps Supabase/local admin login and now points admin creation to the Supabase dashboard.
- Changed: `js/cart.js` builds guest WhatsApp messages/payloads without `user_id` and saves `retrokit_last_wa_order_snapshot`; `js/pages/order-sent.js` renders from that snapshot.
- Changed: cart `Order on WhatsApp` now links to `checkout.html` so guest contact/delivery/customization details are collected before sending; checkout no longer waits for auth or prefills a user.
- Changed: `js/store.js` no longer maps/creates `user_id`; `supabase/schema.sql` drops `orders.user_id`, removes customer order/profile policies, and documents admin-only setup.
- Why: user said authentication is being removed entirely and only admin login should remain; customers must be able to order as guests.
- Files changed: `js/auth.js`, `js/cart.js`, `js/admin.js`, `js/store.js`, `js/pages/cart.js`, `js/pages/checkout.js`, `js/pages/order-sent.js`, `index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`, `custom.html`, `order-sent.html`, `admin.html`, `css/styles.css`, `supabase/schema.sql`, `NK.md`; deleted `login.html`, `register.html`, `verify.html`, `account.html`, `js/pages/login.js`, `js/pages/register.js`, `js/pages/verify.js`, `js/pages/account.js`.
- Verification: `node --check` passed on all changed JS; CSS brace counts matched `css/styles.css 344/344`, `css/admin.css 143/143`, and `css/checkout.css 24/24`; inline-script parse and tag-pair checks passed on all HTML entry points; grep found no customer-auth references in application files, no Paystack references in application files, and only admin `getCurrentUser()`/`authReady()` plus the `orders.user_id` drop migration remain.

### 2026-11-25 — Guest order tracking

- Changed: added `track.html` and `js/pages/track.js` so guests can look up an order by order number plus the WhatsApp phone or email used at checkout.
- Changed: added `Store.trackOrder()` for Supabase RPC lookup in remote mode and cached-order matching in local mode.
- Changed: added `public.track_order(bigint, text, text)` SECURITY DEFINER RPC and `public.order_track_attempts` table with 5 attempts per 10 minutes by hashed IP/client key.
- Changed: added client-side attempt limiting, result rendering, WhatsApp help link, footer/mobile-nav tracking links, and `Track this order` on `order-sent.html`.
- Why: user asked how orders would be tracked without authentication, then approved a guest lookup page with rate limiting.
- Files changed: `js/store.js`, `js/pages/order-sent.js`, `index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`, `custom.html`, `order-sent.html`, `css/styles.css`, `supabase/schema.sql`, `NK.md`; added `track.html`, `js/pages/track.js`.
- Verification: `node --check` passed on `js/store.js`, `js/pages/track.js`, and `js/pages/order-sent.js`; CSS brace counts matched `css/styles.css 358/358`, `css/admin.css 143/143`, and `css/checkout.css 24/24`; inline-script parse and tag-pair checks passed on all HTML entry points; SQL reference checks found one `track_order` function, one grant pair, and 7 `order_track_attempts` references.

### 2026-11-25 — Supabase production details

- Changed: set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/config.js` from the values supplied by the user.
- Changed: set `supabase/config.toml` `project_id` to `rkhvgijdsvwtujbqangw`.
- Changed: left production domain and admin email unset because the user said to leave the domain for now and provide the admin email later.
- Why: user supplied the Supabase project details needed to move the site off placeholders.
- Files changed: `js/config.js`, `supabase/config.toml`, `NK.md`.
- Verification: `node --check js/config.js` passed; the active `SUPABASE_URL`/`SUPABASE_ANON_KEY` constants no longer contain placeholders, with placeholder strings remaining only in the `isSupabaseConfigured()` guard; `isSupabaseConfigured()` still guards remote mode.

### 2026-11-25 — Supabase grant fix after first schema run

- Changed: added explicit `GRANT USAGE` and table grants for `categories`, `products`, `settings`, `profiles`, and `orders` in `supabase/schema.sql`.
- Why: the user ran the schema, `track_order` RPC worked, but anon REST reads returned HTTP 42501 `permission denied` because the fresh project had no explicit table grants.
- Files changed: `supabase/schema.sql`, `NK.md`.
- Verification: `track_order` RPC probe returned HTTP 200 with `[]`; `settings` probe returned HTTP 42501 with hint `GRANT SELECT ON public.settings TO anon;`; updated schema now includes the missing grants and needs to be re-run in SQL Editor.

### 2026-11-25 — Supabase admin user and app_metadata admin flag

- Changed: created Supabase Auth user `anahboniface2017@gmail.com` and set `app_metadata.is_admin = true`.
- Changed: `js/auth.js` now includes `isAdmin` from `app_metadata` in the cached session user; `js/admin.js` trusts that flag before falling back to `profiles.is_admin`.
- Why: the service role key lacked table grants for a direct `profiles` update, and the user supplied the admin email/password; app_metadata avoids another SQL-editor step.
- Files changed: `js/auth.js`, `js/admin.js`, `NK.md`; no secrets or passwords were written to repo files.
- Verification: Admin API create returned user `33028e8b-f2ec-4b69-859c-e6c602323148`; Admin API update returned `is_admin=True`; password login returned an access token with `app_metadata.is_admin=True`; service role key must be rotated because it was shared in chat.
