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

## Project rules

- Memory layer is isolated behind `retain()` / `recall()` / `reflect()` in `src/lib/memory.ts`; banks persist per anonymous browser session in `src/lib/store.ts` so every visitor is isolated.
- Only copywriting goes over the network (`src/lib/copy.functions.ts`); it must always degrade to the local template generator so the UI never blanks.
- Colors, fonts and radii live as tokens in `src/styles.css`; components never hardcode color values.
- Imported campaign history is parsed and validated locally before explicit confirmation, then added to the selected brand's browser bank; no uploaded file is sent over the network to preserve visitor isolation.
