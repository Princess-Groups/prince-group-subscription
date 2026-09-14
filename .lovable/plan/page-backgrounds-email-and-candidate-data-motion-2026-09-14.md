# Page Backgrounds, Email, and Candidate Data Motion

## What will change
- Use the three uploaded images in their provided order for the Directory, Enquiry, and Offers page headers.
- Fit each image like the Home page: full frame width, top aligned, original aspect ratio, no blur, tint, smoke, or dark overlay.
- Keep the existing page text and controls layered over the clear left-side image space without altering the source images.
- Replace the website support email everywhere with `jp@princegroup.net`, including live settings and fallback values.
- Replace the Candidate Data page’s static availability headline with a premium sequential display:
  1. `1 Lakh+ Loan Candidates Data`
  2. `6 Lakhs+ B2B Contacts Data`
  3. `1000+ Enquiries`
- Use a smooth fade-and-rise transition that pauses for reduced-motion visitors.

## Technical details
- Upload the three files through the project asset system and import their generated asset pointers.
- Reuse the shared clean background mode so image overlays, decorative grids, and smoky effects remain disabled only on these three page headers.
- Add a database migration updating the existing `support_email` setting, while also correcting source defaults.
- Keep the animated data panel dimensions stable to avoid layout movement.
- Verify all three pages, the Candidate Data animation, the contact email, mobile sizing, console output, and the latest build result.
