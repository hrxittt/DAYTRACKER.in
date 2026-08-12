# DayTracker

## Android (Capacitor) build/run flow

From `/home/runner/work/DAYTRACKER.in/DAYTRACKER.in`:

1. Install dependencies:
   - `npm install`
2. Build web assets:
   - `npm run build`
3. (First time only) add Android platform:
   - `npx cap add android`
4. Sync Capacitor assets/config into Android:
   - `npx cap sync android`
5. Open/run Android project:
   - `npx cap open android`

### Why this fixes black screen in APK/WebView

Vite now uses a relative asset base (`base: './'`) so built JS/CSS files are resolved correctly by Capacitor Android WebView instead of trying to load from absolute root paths.
