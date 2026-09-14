# Distribution, verification and release

## Identity reconciliation

The main-branch CI artifact for commit `40d283151d82f3239884eec01ea23e1b16880337` contains package version `0.2.7`, publisher `hanzaidao`, name `codex-local-model-switcher`. The public Marketplace listing identifies `dzr.codex-local-model-switcher` and links to this repository. The release candidate aligns the publisher to that existing listing, preserves the package name and every legacy command ID, and prepares `0.2.8`.

Evidence: [main artifact run](https://github.com/dzrdzrdzr/codex-model-switcher/actions/runs/33365978776), [Marketplace listing](https://marketplace.visualstudio.com/items?itemName=dzr.codex-local-model-switcher). The original preparation did not retrieve the Marketplace binary. The added public Marketplace preflight records the current identity/version and attempts to download and verify the binary without publisher credentials. Its run artifact is the source of truth for that check. Do not treat this change as a claim that the store has already updated.

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

## Release gates and explicit authorization

The owner authorized publication of version 0.2.8 on 2026-09-14 without a separate manual acceptance step. Review and merge the candidate, then the approved one-version request in `.github/release-request.json` triggers `.github/workflows/publish-approved.yml` on main. It checks identity/version, reruns Windows/Linux tests (including actual Windows launcher compilation/execution against a harmless probe), and publishes the exact verified artifacts to a new GitHub Release. Existing releases are never overwritten.

GitHub Release, Pages and Marketplace are independent jobs. Marketplace publication requires existing `VSCE_PAT` authorization and a strictly older publicly verified Marketplace version. The token is supplied only to the authorization/publishing steps and is never printed. Pages enablement requires appropriate repository permissions; an existing `GH_PAGES_TOKEN` may supply them. Missing permissions are reported, not worked around. Nothing collects keys from users.

The old tag-triggered workflow remains draft-only for unapproved future releases. Future releases require an explicit updated release request or manual confirmation; normal unrelated pushes do not publish a version. Full authenticated Codex/provider calls are not part of the credential-free regression suite and must not be advertised as verified.

## Project website

`npm run build:site` writes `_site/` from the checked-in template and bilingual content. Preview with `python3 -m http.server 8000 --directory _site`. Generated pages contain a labeled configuration illustration, not fabricated VS Code screenshots. No external fonts, tracking script or third-party script are needed.

The standalone Pages workflow is manual and restricted to `main`; the approved version workflow can also deploy its checked website artifact. Enabling GitHub Pages and a successful deploy are required before adding its URL to the repository About panel. Prepared HTML, a passing build or an uploaded preview artifact does not mean the website is online, indexed or ranked.

## Metrics

Run `npm run metrics` manually to snapshot public repository counts and the **latest release's** asset download counts. These are not unique users or total historical downloads. The script does not access personal usage, collect extension telemetry or contact users. Traffic and Marketplace installs remain `null` unless independently obtained; missing data is never converted into zero.
