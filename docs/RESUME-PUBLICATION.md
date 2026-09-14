# Resume the remaining 0.2.8 publication steps

GitHub Release v0.2.8 already exists. Do not rerun the complete approved-publication workflow to upload it to another platform: its GitHub release-creation job intentionally refuses to replace an existing release.

## Marketplace only

Use the Actions workflow **Resume Marketplace 0.2.8** (`.github/workflows/marketplace-resume.yml`) on `main`, with `confirm_publish=true`, after the existing publisher authorization is available.

This workflow is independent of GitHub release creation and website deployment. It:

- Requires the repository's existing `VSCE_PAT` publisher authorization. A missing token causes an explicit failure, not a successful-looking skipped upload. Never put tokens in issues, source files, command arguments, or chat.
- Downloads the already published v0.2.8 VSIX and its checksum file. It does not rebuild the extension or create, edit, or overwrite a GitHub release.
- Pins the approved release source to `30f584d0019453f15f40bc58fca5d1cfd327a93c` and the VSIX SHA-256 to `9743ea149a03f33e362d8d9ac22e12e1a4163b32e40df1dac615e312f4f903f2`. The archive identity, version, required runtime bytes and file allowlist are verified against that exact source.
- Requires the existing `dzr.codex-local-model-switcher` listing. It refuses to create a different extension, publish against unknown metadata, or downgrade a newer Marketplace version. Version 0.2.8 already present means no duplicate upload.
- Verifies both the public version and the downloadable Marketplace package after upload. A processing delay or failed read-back is not reported as completed publication.

The workflow has no push or scheduled trigger and holds only read permission on the GitHub repository. It shares the publication concurrency group to avoid overlapping with the original publication workflow. It is deliberately scoped to 0.2.8, not an authorization for future releases.

## Website only

Use the existing **Deploy project website (manual)** workflow (`.github/workflows/pages.yml`) on `main`, with `confirm_publish=true`. It does not depend on creating or republishing a GitHub Release.

The repository must first have GitHub Pages enabled with **GitHub Actions** as the source. Browser access to repository settings or an API token with the required permissions is necessary for initial enablement; workflow files and a successful website build alone do not grant that permission. Verify the deployed public URL before advertising it as live.

## Verification of the retry code

During preparation, the new workflow's YAML structure, five Bash blocks and three embedded Python blocks were checked locally. Fifteen offline guard scenarios exercised stable/draft/prerelease handling, changed source/tag/digest, missing assets, older/equal/newer or invalid Marketplace versions, a missing listing, and successful/unsuccessful public-package read-back. Those fixture checks are not an authenticated Marketplace upload or website deployment.

See [the dated publication status](PUBLICATION-STATUS.md) for the previously completed GitHub release and the platform-specific results.
