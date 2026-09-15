# Homepage Data Statistics visual update

## Scope
Update only the three existing Data Statistics cards on the homepage. Preserve all numbers, labels, rotating records, timing, card order, layout, and functionality.

## Changes
- Restyle the cards from dark olive to the reference’s soft cream glass with lime-green accents and a subtle green depth gradient.
- Keep the existing count-up animation and rotating Karthik / APN Artistic / Sundar record animation unchanged.
- Replace the moving dashed ECG with a stationary full-width heartbeat trace animated as a repeating double-beat “lub-dub” pulse.
- Add layered lime glow, pulse bloom, and slight depth to the heartbeat only; do not animate or alter surrounding content beyond existing behavior.
- Update text and inner-card contrast so all existing content remains clear against the lighter card surface.
- Preserve reduced-motion support by showing the heartbeat trace without looping animation when motion reduction is enabled.

## Validation
Check the homepage at desktop and mobile sizes for card sizing, text contrast, heartbeat placement, animation behavior, overflow, and console/build errors.

## Technical details
Use the existing React statistics components and scoped CSS utilities only. No backend, navigation, content, or other homepage section changes.
