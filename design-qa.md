# Relay Rider Mobile Redesign — Design QA

- Source visual truth: `/workspace/scratch/f51091775827/upload/image.png`
- Implementation evidence: cloud-browser capture of `http://terminal.local:4173/`, Relay home state, captured 2026-08-04
- Source pixels: 711 × 680, showing two framed mobile screens
- Implementation browser viewport: 1365 × 936
- App screen CSS target: 393 × 852; rendered at approximately 360.5 × 781.6 because the protected device frame scales to the available cloud-browser height
- Density normalization: visual comparison used the full framed source and framed implementation at their displayed scale; findings exclude frame/canvas scale differences
- State compared: first/home screen, light theme, iPhone runtime, bottom navigation visible

## Full-view comparison evidence

The implementation preserves the source's defining composition: pale cool-gray app canvas, oversized black heading, large rounded pastel task card, black pill CTA, warm promotional card, compact history/today card, two-column pastel metric grid, and translucent five-item bottom navigation. Relay Rider-specific content replaces the recipe and nutrition content while keeping the same density, hierarchy, and visual rhythm.

## Focused-region evidence

The above-the-fold task card and bottom navigation were checked closely because they carry the strongest visual signature. The task card uses the same stacked anatomy and approximate proportions as the reference. The bottom dock uses a muted translucent brown treatment, circular active state, five evenly spaced icons, and intentional overlap with lower content. No raster art from the food reference was reproduced because it is not semantically appropriate to Relay Rider; the design is UI-led and uses a consistent Radix icon set.

## Findings

- No actionable P0, P1, or P2 visual differences remain.
- [P3] The Relay promotional card uses a large typographic `R` motif instead of a product illustration. This is an intentional brand adaptation and can be replaced later when a Relay mascot or approved illustration system exists.
- [P3] The reference uses a slightly rounder display face. The implementation uses the runtime's system/Roboto stack for reliability; a licensed rounded grotesk could tighten the match later.

## Required fidelity surfaces

- Fonts and typography: black display headings, compact utility text, strong weight hierarchy, and restrained tracking match the reference closely. Remaining typeface difference is P3.
- Spacing and layout rhythm: 20px side gutters, 22–28px radii, compact 9–18px vertical gaps, two-column metric modules, and overlapping dock match the reference's rhythm.
- Colors and visual tokens: off-white canvas with lavender, pale yellow, mint, peach, white, and near-black tokens matches the source palette and foreground balance.
- Image quality and assets: the source's food photography is intentionally not reused. App icons come from one vector icon library; no placeholder images, emoji, or handcrafted SVG assets are used.
- Copy and content: all visible content is original Relay Rider product copy and preserves prototype, partner-approval, privacy, incentive, and reporting boundaries.

## Primary interactions tested

- Five-tab bottom navigation
- Match-screen selection and explainable scoring
- Credits screen trip logging
- Credit balance update from 16 to 24
- Home-state return and tab scroll reset
- OpenStreetMap tile rendering and Leaflet pan/zoom controls
- Anchor, charging, and Metro layer filters
- Charging-station marker selection and map fly-to behavior
- Selected-point detail card and visible source attribution

## Console check

No application console errors were observed. The only logged errors were unrelated cloud-browser extension metadata messages.

## Comparison history

1. Initial capture found a P1 navigation placement issue: the dock inherited an unresolved mobile safe-area variable and rendered near the top of the app.
2. Fixed the dock to use the protected runtime's `--device-safe-area-bottom` variable. Post-fix evidence shows the dock fixed above the home indicator and visually aligned with the source.
3. Interaction testing found a P2 scroll-state issue: changing tabs retained the previous screen's scroll offset. Added a tab key to remount `MobileScroll`; post-fix evidence shows each tab opening at its intended top state.
4. Map verification rendered live OpenStreetMap tiles, 15 mobility points plus the Relay corridor polyline, and successfully selected Marengo Charging Plaza. Layer filtering reduced the visible point count from 15 to 9 when charging was disabled and restored it when re-enabled. No application console error was introduced.

## Follow-up polish

- Replace the promotional `R` motif with an approved Relay illustration when brand assets are available.
- Evaluate a rounded grotesk display font after brand typography is finalized.

final result: passed
