# Homepage live-data statistics upgrade

## Scope
Update only the existing three homepage statistic cards. Keep their current placement, totals, labels, palette, typography, and surrounding homepage unchanged.

## Changes
- Replace the current chart area with a continuously moving ECG line and synchronized glow pulse.
- Add one-at-a-time rotating data rows for loan candidates, B2B contacts, and daily enquiries.
- Give each card restrained perspective, layered glass depth, and hover lift while keeping the established olive, lime, and cream theme.
- Keep all card dimensions stable during transitions, stack responsively, and disable nonessential movement for reduced-motion visitors.

## Validation
Check desktop and mobile rendering, card overflow, animation behavior, reduced-motion behavior, console errors, and the project build.

## Technical details
Use a small React ticker component with independent intervals and scoped CSS keyframes. No backend, navigation, or other page sections will change.
