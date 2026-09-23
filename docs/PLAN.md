# Summoner Spell Tracker — Build Plan

> Hand this file plus `mockup.html` to Claude Code. `mockup.html` is a working HTML prototype of the exact UI and interactions — treat it as the visual and behavioural spec.

## 1. What it is

A single-screen mobile app for tracking enemy summoner spell cooldowns in League of Legends (**Summoner's Rift only** — no ARAM, Arena or other modes). Five rows (TOP, JG, MID, BOT, SUP), two spell buttons each. Tap a spell when the enemy uses it → it greys out, colour sweeps back clockwise like a clock, and a black countdown sits on top. When it hits zero the icon is full colour again.

Targets, in order: **Android** → **iOS** → **Web**. One codebase for all three.

## 2. Tech stack

- **Expo (React Native) + TypeScript** — one codebase for Android, iOS and web (`expo start --web`).
- **react-native-svg** — circular clock-sweep mask over the icon.
- **AsyncStorage** (`@react-native-async-storage/async-storage`) — save loadout and custom cooldowns.
- **expo-keep-awake** — keep the screen on while a timer is running.
- **expo-haptics** — short vibration on tap and when a spell comes back up.
- State: plain React `useReducer` + context. No Redux needed.
- Build: **EAS Build** for the Android APK/AAB and later the iOS build.

## 3. Screens and UI

> The mockup was a guide, not the final look. The app now uses a League-style dark theme (navy and Hextech gold) with larger, screen-sized tiles.

Only one screen, with two overlays.

### 3.1 Main tracker (default mode)
- Header: "SUMMONER / SPELL TRACKER" (bold, two lines, left) + **pencil** and **cog** icons (right).
- 5 rows: role label (TOP, JG, MID, BOT, SUP) + 2 square spell tiles (~64dp, big enough to hit mid-game).
- Default loadout:
  - TOP: Flash, Teleport
  - JG: Flash, Smite
  - MID: Flash, Ignite
  - BOT: Flash, Heal
  - SUP: Flash, Exhaust

### 3.2 Tile states
| State | Look |
|---|---|
| Ready | Full-colour spell icon |
| On cooldown | Greyscale + darkened icon. Colour is revealed through a **clockwise pie/clock sweep starting at 12 o'clock** proportional to elapsed time. **Black countdown numbers** centred on top with a thin white halo for contrast. Format `m:ss` above 60s, plain seconds below. |
| Just came up | Brief pulse/flash animation + haptic buzz |

### 3.3 Interactions
- **Tap a ready tile** → start that spell's cooldown.
- **Tap a tile already on cooldown** → reset to ready (for misclicks). *(Changed from the original long-press reset: the user prefers a single tap.)*
- Timers must be based on a stored `endsAt` timestamp, **not** a decrementing counter, so they stay correct if the app is backgrounded or the phone locks.

### 3.4 Edit mode (pencil)
- Pencil toggles edit mode (icon highlighted while active).
- No wiggle: tiles stay still in edit mode (the user removed the mockup's wiggle). The highlighted pencil, the pool and the hint text show you're editing.
- The **spell pool** appears at the bottom: all 9 SR spells.
- Tap a slot to select it (blue outline) → tap a spell in the pool to swap it in. Swapping resets that slot's timer.
- After a spell is swapped in, the selection automatically moves to the next slot down the column, then down the second column, and clears after the bottom-right slot. *(Added by the user.)*
- In edit mode the rows shrink so the whole screen, spell pool included, fits without scrolling. *(Added by the user.)*
- Tap pencil again to exit. Loadout is saved to storage.

### 3.5 Settings (cog)
- Bottom sheet / modal listing every spell with a number input for its cooldown in seconds.
- A **Minutes / Seconds** toggle for how countdowns read (`4:05` vs `245`). *(Added by the user.)*
- "Reset defaults" and "Done" buttons.
- Saved to storage. New values apply to the next timer started (don't alter running ones).

## 4. Data

### 4.1 Spell pool and default cooldowns (Summoner's Rift)
| id | Name | Default cooldown (s) |
|---|---|---|
| flash | Flash | 300 |
| teleport | Teleport | 360 |
| ignite | Ignite | 180 |
| heal | Heal | 240 |
| barrier | Barrier | 180 |
| exhaust | Exhaust | 240 |
| ghost | Ghost | 240 |
| cleanse | Cleanse | 240 |
| smite | Smite | 90 |

**Verify these against the current patch before release** (Riot tweaks them; Teleport also upgrades to Unleashed Teleport mid-game). Keep them in one `spells.ts` file so they are easy to update. Users can override any of them in Settings anyway.

### 4.2 Icons
- Use the official summoner spell icons from Riot's **Data Dragon** CDN:
  - Latest version: `https://ddragon.leagueoflegends.com/api/versions.json`
  - Spell data: `https://ddragon.leagueoflegends.com/cdn/<version>/data/en_US/summoner.json`
  - Image: `https://ddragon.leagueoflegends.com/cdn/<version>/img/spell/<image.full>` (e.g. `SummonerFlash.png`)
- Download and **bundle** the 9 icons in `assets/spells/` at build time so the app works offline in-game.
- Add Riot's fan-project disclaimer in an About section ("Summoner Spell Tracker isn't endorsed by Riot Games…"), as their Legal Jibber Jabber policy requires.

### 4.3 State shape
```ts
type SpellId = 'flash'|'teleport'|'ignite'|'heal'|'barrier'|'exhaust'|'ghost'|'cleanse'|'smite';
type Role = 'TOP'|'JG'|'MID'|'BOT'|'SUP';

interface AppState {
  loadout: Record<Role, [SpellId, SpellId]>;
  cooldowns: Record<SpellId, number>;          // seconds, user-editable
  timers: Record<string, { endsAt: number; total: number }>; // key = `${role}-${slot}`
  mode: 'track' | 'edit';
  selectedSlot: string | null;                  // edit mode
}
```
Persist `loadout` and `cooldowns`. Persist `timers` too, so reopening the app mid-game keeps them.

## 5. Suggested project structure
```
App.tsx                  // main screen (no Expo Router — single screen)
components/
  Header.tsx
  RoleRow.tsx
  SpellTile.tsx          // icon + grey layer + SVG sweep mask + countdown text
  SpellPool.tsx
  SettingsSheet.tsx
state/
  store.tsx              // context + reducer
  storage.ts             // AsyncStorage load/save
data/
  spells.ts              // ids, names, default cooldowns, icon requires
assets/spells/*.png
```

## 6. Build order (milestones)

1. **Scaffold** — `npx create-expo-app` with TypeScript, run on Android emulator and web.
2. **Static layout** — header, 5 rows, placeholder tiles. Match the mockup.
3. **SpellTile + timer** — grey layer, clockwise colour sweep (SVG), black countdown, `endsAt`-based ticking (~10fps is plenty), tap-again reset.
4. **Edit mode** — pencil toggle, spell pool, select-then-swap.
5. **Settings sheet** — editable cooldowns, reset defaults.
6. **Persistence** — AsyncStorage for loadout, cooldowns and timers.
7. **Polish** — real Data Dragon icons, haptics, keep-awake, "ready" pulse, app icon and splash.
8. **Ship Android** — EAS build, test on a real phone, Play Store internal testing.
9. **Web** — confirm `expo export --platform web` works; deploy (e.g. Netlify/Vercel).
10. **iOS** — EAS build for iOS, TestFlight.

## 7. Acceptance checks
- Tapping a tile greys it, the sweep runs clockwise from 12 o'clock, and the black number counts down accurately.
- Locking the phone for 60s and returning shows the correct remaining time.
- Tapping a running timer resets it to ready.
- Edit mode swaps a spell and the new loadout survives an app restart.
- Changing Flash to 270s in Settings makes the next Flash timer 4:30.
- Works offline.

## 8. Later / nice-to-have (not v1)
- **Summoner spell haste** toggles per role (Ionian Boots of Lucidity, Cosmic Insight rune) that shorten that row's cooldowns. Formula: `cd × 100 / (100 + haste)`.
- Unleashed Teleport switch-over after the upgrade time.
- "Copy timers" button that puts a chat-ready string on the clipboard, e.g. `TOP flash 12:45 MID ignite 11:10` (needs a game-clock input).
- Dark mode.
