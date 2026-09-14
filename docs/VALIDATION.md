# Verification scope — 0.2.8 candidate

Prepared on 2026-09-14 from main commit `40d283151d82f3239884eec01ea23e1b16880337`. This document separates fixture-based checks from real client/provider validation.

## Checks performed in the preparation environment

- Node.js 22.16.0: `npm run verify` passed 41 JavaScript tests covering profile conversion, repeated application, model/effort combinations, BOM/CRLF, quotes/backslashes, Unicode paths, invalid inputs, direct-endpoint rejection, sensitive subprocess errors, local status, manifest identity/tag rules and public-metric failure handling.
- Linux helper: the shell round-trip fixture passed with a mocked Codex executable. Nine Python edge-case scenarios were exercised successfully across separate invocations; the final repeat/permission scenario was rerun on its own after a local command timeout. The CI job runs the complete suite together.
- Site build: eight generated bilingual HTML pages and 60 local resource links passed structural checks.
- Offline Chromium render: eight pages at 1440px and 390px widths (16 renders) had no document-width overflow or missing images. Local URL navigation was blocked in this environment, so the exact generated CSS/icon were inlined into the HTML for rendering. This was not a deployed-site browser test and not a screenshot of live Codex.

## CI release gates

The candidate workflow runs Node 24 tests on Windows and Linux, the complete Linux helper suite, website build/link checks, and pinned-tool VSIX packaging. `verify-vsix.py` checks the archive allowlist, exact runtime bytes, manifest publisher/name/version and SHA-256 file. A passing workflow and its actual artifacts—not this document—are the evidence of successful remote packaging.

## Not established by these checks

- A paid or authenticated OpenAI/DeepSeek request. No live keys or user configurations were used.
- Full Windows VS Code UI behavior or Windows PowerShell/C# launcher compilation in the preparation container. The Windows CI job checks JavaScript, not those live UI flows.
- Every Codex/client/provider version, real SSH server or platform combination.
- Runtime equivalence with the current Marketplace binary; that binary was not retrieved here.
- A live GitHub Pages deployment, search-engine indexing, Marketplace publication or any number of new stars.
- Full TOML/JSONC parsing correctness for arbitrary hand-edited configurations; the existing rewriting approach is not a general parser.

All runtime tests use temporary homes and synthetic credentials. Tests, metrics and website build tools are excluded from the installable extension. No contacting people, user recruitment, outreach messages, auto-star prompts or runtime analytics are part of this candidate.
