# Distribution, verification and release

## Identity reconciliation

The main-branch CI artifact for commit `40d283151d82f3239884eec01ea23e1b16880337` contains package version `0.2.7`, publisher `hanzaidao`, name `codex-local-model-switcher`. The public Marketplace listing identifies `dzr.codex-local-model-switcher` and links to this repository. The release candidate aligns the publisher to that existing listing, preserves the package name and every legacy command ID, and prepares `0.2.8`.

Evidence: [main artifact run](https://github.com/dzrdzrdzr/codex-model-switcher/actions/runs/33365978776), [Marketplace listing](https://marketplace.visualstudio.com/items?itemName=dzr.codex-local-model-switcher). The Marketplace binary itself was not retrieved during this preparation; its runtime equivalence and latest actual version remain a publish-time check. Do not treat this change as a claim that the store has already updated.

Different publisher IDs are different extension identities. No automatic account transfer, deletion or uninstall is performed. Disable an old `hanzaidao.codex-local-model-switcher` installation before enabling the `dzr` build; do not delete shared Codex profiles.

## Build locally

Use Node.js 24/npm; Linux integration tests use Python 3.11+ for standard-library TOML assertions. The helper runtime still requires Python 3, not the test-only TOML module.

```bash
npm run verify
npm run test:remote
npm run build:site
npm run check:site
npm run check:release -- --tag v0.2.8
npm run package:list
npm run package:vsix
python3 scripts/verify-vsix.py dist/codex-local-model-switcher-0.2.8.vsix
```

The packager version is pinned in `package.json`. npm still resolves that tool's transitive dependencies: this is a fixed top-level tool, **not** a claim of byte-identical reproducible builds. No new extension runtime dependency is added. Packaging has an explicit allowlist and does not include tests, metrics, CI, website build inputs, private configs or logs. `SHA256SUMS` accompanies the VSIX.

## Gates

Before releasing, review and merge the candidate, check the current published Marketplace ID/version and compare the installed extension behavior, verify Windows PowerShell/C# compilation and live provider access on the intended client versions. Use your own credentials privately; no CI run should request them. Select a strictly newer version if the store already contains `0.2.8` or later.

A matching `vX.Y.Z` tag can run the release workflow. The workflow runs validation and produces a **draft** GitHub Release. It refuses to overwrite an existing release. Publishing that draft and uploading to Marketplace are separate, explicit operations; there is no automatic Marketplace publish job and no credential embedded in the repository.

## Project website

`npm run build:site` writes `_site/` from the checked-in template and bilingual content. Preview with `python3 -m http.server 8000 --directory _site`. Generated pages contain a labeled configuration illustration, not fabricated VS Code screenshots. No external fonts, tracking script or third-party script are needed.

The Pages workflow is manual and restricted to `main` with an explicit confirmation input. Enabling GitHub Pages and a successful deploy are required before adding its URL to the repository About panel. Prepared HTML, a passing build or an uploaded preview artifact does not mean the website is online, indexed or ranked.

## Metrics

Run `npm run metrics` manually to snapshot public repository counts and the **latest release's** asset download counts. These are not unique users or total historical downloads. The script does not access personal usage, collect extension telemetry or contact users. Traffic and Marketplace installs remain `null` unless independently obtained; missing data is never converted into zero.
