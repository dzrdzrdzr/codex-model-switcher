# Verification scope — 0.2.8

Prepared on 2026-09-14 from main commit `40d283151d82f3239884eec01ea23e1b16880337`. This document separates fixture-based checks from real client/provider validation.

## Checks performed in the preparation environment

- Node.js 22.16.0: `npm run verify` passed 41 JavaScript tests covering profile conversion, repeated application, model/effort combinations, BOM/CRLF, quotes/backslashes, Unicode paths, invalid inputs, direct-endpoint rejection, sensitive subprocess errors, local status, manifest identity/tag rules and public-metric failure handling.
- Linux helper: the shell round-trip fixture passed with a mocked Codex executable. Nine Python edge-case scenarios were exercised successfully across separate invocations; the final repeat/permission scenario was rerun on its own after a local command timeout. The CI job runs the complete suite together.
- Site build: eight generated bilingual HTML pages and 60 local resource links passed structural checks.
- Offline Chromium render: eight pages at 1440px and 390px widths (16 renders) had no document-width overflow or missing images. Local URL navigation was blocked in this environment, so the exact generated CSS/icon were inlined into the HTML for rendering. This was not a deployed-site browser test and not a screenshot of live Codex.

## CI release gates

The release workflow runs Node 24 tests on Windows and Linux, the complete Linux helper suite, website build/link checks, and pinned-tool VSIX packaging. Seven additional Windows tests compile the actual C# launcher with Windows PowerShell and execute it against a harmless probe, testing argument quoting, stdin, home selection, switch-back, the compile cache and child exit codes. They only run on disposable GitHub-hosted Windows runners and refuse to change pre-existing profile directories. `verify-vsix.py` checks the archive allowlist, exact runtime bytes, manifest publisher/name/version and SHA-256 file. A passing workflow and its actual artifacts—not this document—are the evidence of successful remote packaging.

## Not established by these checks

- A paid or authenticated OpenAI/DeepSeek request. No live keys or user configurations were used.
- Full Windows VS Code UI behavior. Windows CI verifies real PowerShell/C# compilation and launcher execution, but uses a probe rather than an authenticated Codex request.
- Every Codex/client/provider version, real SSH server or platform combination.
- Runtime equivalence with every Marketplace/client version. A public Marketplace preflight reads the published identity/version; its artifact records whether the binary was also retrieved and verified.
- A live GitHub Pages deployment, search-engine indexing, Marketplace publication or any number of new stars.
- Full TOML/JSONC parsing correctness for arbitrary hand-edited configurations; the existing rewriting approach is not a general parser.

All runtime tests use temporary homes and synthetic credentials. Tests, metrics and website build tools are excluded from the installable extension. No contacting people, user recruitment, outreach messages, auto-star prompts or runtime analytics are part of this candidate.

## Publication authorization

On 2026-09-14 the repository owner authorized completing verification and publication without a separate manual acceptance step. The one-version `.github/release-request.json` triggers `publish-approved.yml` only on main or an explicit manual dispatch. GitHub Release, Pages and Marketplace have separate outcomes. No available publishing authorization is inferred from a passing test or a GitHub permission. Unavailable Pages administration or Marketplace credentials are reported rather than bypassed.
