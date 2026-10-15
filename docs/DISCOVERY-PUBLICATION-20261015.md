# Discovery publication receipt — 2026-10-15

This record separates source changes, a live website, search notification receipt, and actual Marketplace publication. It does not claim that a model recommends the project or that stars increased.

## Website: deployed and verified

- Approved source: `41691f32d767a66b4234f1c590e3b10e82b55341`, merged through [PR #10](https://github.com/dzrdzrdzr/codex-model-switcher/pull/10).
- [Deployment and verification run 38679297737](https://github.com/dzrdzrdzr/codex-model-switcher/actions/runs/38679297737) completed successfully.
- Verified at `2026-10-15T04:02:20.766078+00:00` (12:02:20 Asia/Singapore).
- All 10 bilingual HTML pages and 5 resources returned HTTP 200 and matched the approved local build byte-for-byte. Resources checked: sitemap, CSS, icon, llms.txt and the project-scoped IndexNow ownership file.
- The actual host-root robots URL returned HTTP 404. No host-root robots file was present; the check did not find a robots policy blocking the submitted project URLs. The project-path robots copy is not a host policy.
- This is HTTP content verification, not a visual-browser or authenticated model-call test.

[English site](https://dzrdzrdzr.github.io/codex-model-switcher/) · [中文网站](https://dzrdzrdzr.github.io/codex-model-switcher/zh/) · [English FAQ](https://dzrdzrdzr.github.io/codex-model-switcher/faq.html) · [中文 FAQ](https://dzrdzrdzr.github.io/codex-model-switcher/zh/faq.html) · [Sitemap](https://dzrdzrdzr.github.io/codex-model-switcher/sitemap.xml)

## IndexNow: received, key validation pending

Exactly one batch containing the 10 project-page URLs was submitted to `https://api.indexnow.org/indexnow` after live-file verification. The response was **HTTP 202**, with an empty response body.

In the [IndexNow protocol](https://www.indexnow.org/documentation), 202 means the URLs were received and key validation is pending. It does not prove successful indexing, ranking, inclusion in ChatGPT answers, or a Google Search Console submission. There is no recurring submitter and no automatic POST retry.

Recorded evidence fields:

```json
{
  "deployed_content_verified": true,
  "indexnow_received": true,
  "indexnow_http_status": 202,
  "key_validation_pending": true,
  "submitted_url_count": 10,
  "search_indexing_verified": false,
  "google_search_console_submitted": false
}
```

## Marketplace: not updated

At `2026-10-15T04:02:23.925499+00:00`, the public listing and downloaded extension package were verified as **dzr.codex-local-model-switcher 0.2.7**. The existing publisher authorization was not configured:

```json
{
  "publisher_authorization_configured": false,
  "published_by_this_job": false
}
```

GitHub repository access is not Marketplace publisher access. This job did not upload a VSIX, create a publisher, create another extension, or replace the existing v0.2.8 GitHub release. The old v0.2.8 resume workflow would upload its old released README, not this new discoverability overview.

Version **0.2.9 is a documentation/metadata update candidate**, not a claim of a new published release. Its changes are the bilingual packaged overview, changelog, package version and website link. Extension runtime code, model catalog, credentials, supported platforms and legacy commands are unchanged. It must pass the repository's normal Windows/Linux and package checks before its VSIX is used.

To finish Marketplace synchronization, an authorized owner of the existing `dzr` publisher can upload the verified 0.2.9 VSIX using the existing extension's **Update** action in [publisher management](https://marketplace.visualstudio.com/manage/publishers/dzr). Verify the public version and packaged overview after processing. No new publisher is needed; do not paste tokens into chat or source files. The [official publishing guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) documents manual VSIX uploads.

The original `.github/release-request.json` remains scoped to 0.2.8. Its authorization is not reused for the 0.2.9 candidate. No new release-request or tag is created by candidate preparation.

## Google and independent discovery checks

Google Search Console ownership verification and sitemap submission have not been completed. The required URL-prefix property is `https://dzrdzrdzr.github.io/codex-model-switcher/`; the sitemap URL is the site's `sitemap.xml`. An authorized Search Console session is required. Do not fabricate a verification token.

Search-result appearance, AI citation and star conversion remain unverified outcomes. A name/URL supplied in an existing conversation is not an independent discovery test. Use neutral setup questions without the project name and record actual returned sources. Do not generate artificial clicks, queries or stars to inflate metrics.

## Evidence and cleanup

The [discovery-publication-evidence artifact](https://github.com/dzrdzrdzr/codex-model-switcher/actions/runs/38679297737/artifacts/11947047464) contains the complete 15-resource hash report, HTTP receipt, Marketplace version and authorization-presence result. Downloaded artifact ZIP SHA-256:

`72ce653370264eb4142cd40b540f07333ad9ae91fa9eb406ab53ecc1f7ed471c`

The one-time `discovery-publish-once.yml` workflow and dated trigger request are removed after this successful run. The original manual Pages workflow remains, with the ownership file included for future manual deployments. No recurring monitoring or submissions are enabled. No outreach, messages to individuals, ads, tracking scripts, star prompts or runtime analytics were added.

The earlier [0.2.8 publication record](PUBLICATION-STATUS.md) remains available as a historical record.
