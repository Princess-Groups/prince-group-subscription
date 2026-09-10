# Subscription Card Focus Animation

## Scope
Enhance only the homepage subscription cards’ motion. Keep their content, styling, dimensions, layout, controls, and subscription behavior unchanged.

## Implementation
- Detect when the subscription section is meaningfully visible.
- Run one transform-only focus cycle at a time in the order Starter → Business → Premium.
- Give the active card a smooth forward 3D lift, subtle scale, glow, and deeper shadow, then return it fully before advancing.
- Pause the loop outside the viewport and while any card is hovered or keyboard-focused; resume naturally afterward.
- Reduce depth on smaller screens and disable automatic motion when reduced motion is requested.
- Keep the surrounding layout fixed and prevent overflow or clipping.

## Verification
- Confirm sequence, timing, viewport pause, hover/focus priority, mobile containment, and reduced-motion behavior.
- Check the homepage for console errors and horizontal overflow.
