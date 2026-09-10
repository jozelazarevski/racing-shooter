# IGNITE RALLY — iOS App Store shell

A [Capacitor](https://capacitorjs.com) wrapper that ships the game (the
static site at the repo root) inside a native WKWebView app, for App Store
distribution. The game code is untouched: `scripts/build-www.mjs` copies
`index.html`, `driving.json`, `src/`, `lib/` and `assets/` into `www/` and
the app serves that copy from the bundle. The service worker is deliberately
excluded — the bundle IS the offline copy, and `src/offline.js` bails on the
`capacitor://` scheme.

Everything that can be prepared without a Mac is already done and committed:

- `ios/` — the generated Xcode project (`npx cap add ios`)
- App icon (1024, opaque) and launch splash, generated from
  `assets/icon-512.png` by `scripts/gen-native-assets.mjs`
- `Info.plist` — portrait-only, full-screen, export-compliance answered
  (`ITSAppUsesNonExemptEncryption=false`: the app is fully offline and uses
  no encryption beyond the OS)
- Bundle id `com.jozelazarevski.igniterally`, display name **Ignite Rally**

## What you need

1. A Mac with **Xcode 16+** (`xcode-select --install` for the CLI tools)
2. **Node 20+** and **CocoaPods** (`brew install cocoapods`)
3. An **Apple Developer Program** membership ($99/year) —
   https://developer.apple.com/programs/enroll/

## Build on the Mac

```sh
cd ios-app
npm install
npm run sync        # assembles www/ from the repo root, then `cap sync ios`
npm run open        # opens ios/App/App.xcworkspace in Xcode
```

In Xcode, select the `App` target →

1. **Signing & Capabilities**: pick your team; Xcode manages the
   provisioning profile automatically.
2. Plug in an iPhone (or pick a simulator) and **Run**. The whole game is in
   the bundle, so it must boot in airplane mode — that is the smoke test.

Every time the game at the repo root changes, run `npm run sync` again
before building; `www/` is generated, never edited.

## Submit to the App Store

1. https://appstoreconnect.apple.com → **My Apps → + → New App**: platform
   iOS, name *Ignite Rally* (or the store name you want), bundle id
   `com.jozelazarevski.igniterally`, language, SKU (any string).
2. In Xcode: **Product → Archive**, then **Distribute App → App Store
   Connect → Upload**.
3. In App Store Connect fill the listing:
   - screenshots: 6.9" (iPhone 16 Pro Max class) and 6.5" sets — take them
     in the simulator with **Cmd+S** during a race and a menu screen
   - description / keywords / support URL (the GitHub Pages site works)
   - **App Privacy**: "Data Not Collected" — the game has no network calls,
     no analytics, no accounts (career state is localStorage on-device)
   - **Age rating** questionnaire: cartoon/fantasy violence (it is a combat
     racer) — expect 9+
   - price (free or paid) and territories
4. Add the build to the version, **Submit for Review**. First reviews
   typically answer within a day or two.

### Review notes worth knowing

- **Guideline 4.2 (minimum functionality)** rejects thin website wrappers.
  This app is a complete offline game with native packaging, which passes;
  if a reviewer pushes back, the response is that the app is fully
  functional offline with all content in the bundle. Adding haptics or Game
  Center later strengthens this further.
- **TestFlight** (App Store Connect → TestFlight tab) lets you install the
  uploaded build on your own phone and share with up to 10,000 testers
  before/without public release.

## Regenerating pieces

- Xcode project from scratch: delete `ios/`, then
  `npm run build && npx cap add ios && node scripts/gen-native-assets.mjs`
  and re-apply the `Info.plist` orientation/compliance keys (see git log).
- Icon/splash after icon art changes: `node scripts/gen-native-assets.mjs`.
  The 1024 icon is an upscale of `assets/icon-512.png`; if the icon is ever
  re-exported at 1024 native, point the script's `SRC` at it.
