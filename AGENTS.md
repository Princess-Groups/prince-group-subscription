<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Normalize literal bracket-style VITE environment access in the generated browser client through the pre-transform plugin; Vite's Oxc define replacement otherwise drops these values. Keep generated integration files unchanged.
- Embed available public browser connection settings in that transform for both SSR and browser output; do not embed server secrets.
- Resolve only the two public browser connection settings from build env with a checked-in public fallback; blank env values must not erase them, and missing values fail at build time to prevent hosted blank pages.
- Rewrite asset-pointer URLs only during production builds so local SSR and browser hydration use identical asset addresses.
- Public directory and opportunity SELECT policies expose only status='available' listings; preserve admin management policies and separate subscription-gated phone access to prevent unpublished listing exposure.
- Loan imports use normalized phone identities and immutable executive history; allocation and paid-period credits are transactionally enforced in database functions to prevent concurrent or repeat claims.
- Parse Excel in the browser with positional mapping and preview, then submit retry-safe batches of 500; never embed private uploaded lead workbooks in public assets.
