# Global text contrast refinement

## Goal
Improve readability and visual polish across the complete Prince Group website by changing text colors only. Preserve every background image, background treatment, layout, size, spacing, animation, control, content string, and behavior.

## Implementation
1. Audit shared typography in the header, footer, page introductions, cards, badges, banners, popups, forms, and buttons against their existing surfaces.
2. Use only existing Prince Group semantic colors: deep olive/green on cream and light surfaces; cream/white/lime on green, dark, and image-led surfaces.
3. Refine shared components first so repeated text becomes consistent across all pages.
4. Apply narrowly scoped page-level text color corrections where image backgrounds or special cards need stronger contrast.
5. Keep button text paired with its existing button background; no background, border, shadow, opacity, layout, or interaction changes.
6. Verify public and signed-in pages at desktop and mobile sizes, including headings, body copy, labels, counters, cards, forms, popups, banners, navigation, and footer.

## Technical constraints
- Change only `text-*`, placeholder text, and text/icon foreground classes or inherited foreground values.
- Do not edit background classes, images, overlays, dimensions, spacing, typography sizing, markup structure, content, animation, or application logic.
- Continue using the existing semantic theme tokens; add no unrelated palette or design system.
