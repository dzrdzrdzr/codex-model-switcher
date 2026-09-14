# 0.2.8 publication results / 实际发布结果

Recorded on 2026-09-14. This is a dated result, not a claim about future Marketplace versions or website deployments.

## Published

- [PR #8](https://github.com/dzrdzrdzr/codex-model-switcher/pull/8) was merged into main at `30f584d0019453f15f40bc58fca5d1cfd327a93c`. It superseded the original closed draft #7.
- [GitHub Release v0.2.8](https://github.com/dzrdzrdzr/codex-model-switcher/releases/tag/v0.2.8) is public, not a draft or prerelease. Published at `2026-09-14T04:42:04Z` (12:42:04 Asia/Singapore).
- Release assets: `codex-local-model-switcher-0.2.8.vsix`, `source-0.2.8.zip`, `website-0.2.8.zip`, and `SHA256SUMS`.
- The VSIX was downloaded from the publishing run's checked artifact and its SHA-256 independently matched the published release asset: `9743ea149a03f33e362d8d9ac22e12e1a4163b32e40df1dac615e312f4f903f2`. Manifest identity/version, all required runtime bytes and the 15-file extension allowlist passed verification.

## Tests passed

The [publication workflow](https://github.com/dzrdzrdzr/codex-model-switcher/actions/runs/34806936181) passed all five validation jobs before the GitHub release job succeeded: Windows 48 JavaScript/compiled-launcher tests, Linux 41 JavaScript tests, Linux shell round trip and 9 Python edge tests, website checks (8 bilingual pages and 60 local-resource links), and verified VSIX packaging. Public Marketplace preflight also succeeded.

Windows tests actually compiled the C# launcher and ran it against a harmless probe. Linux integration used disposable homes and a mock Codex. These tests do not establish real authenticated OpenAI/DeepSeek calls or full VS Code UI certification. No real user credentials or workspaces were used.

## Published: GitHub Pages

Verified at `2026-09-14T07:34:21Z` (15:34:21 Asia/Singapore).

- Live [English homepage](https://dzrdzrdzr.github.io/codex-model-switcher/) and [Chinese homepage](https://dzrdzrdzr.github.io/codex-model-switcher/zh/index.html).
- [Standalone deployment run 34818138679](https://github.com/dzrdzrdzr/codex-model-switcher/actions/runs/34818138679) completed successfully, deploying main commit `d071801f4ea5cf51d0eca74d641427ec8bc148d3` with `confirm_publish=true`.
- Existing local Git credential-manager authorization had repository administrator access. The Pages API initially returned 404; enabling this repository with `build_type=workflow` returned 201. No repository visibility, membership, billing or custom domain was changed.
- Downloaded all 14 deployed files and compared their content with the main-branch site build: all 8 HTML pages (two homepages and six guides), icon, CSS, sitemap, robots.txt, llms.txt and .nojekyll. HTML and image bytes matched exactly; CSS and llms.txt differed only in Windows checkout CRLF versus deployed LF line endings. `npm run check:site` passed 8 pages and 60 local-resource links. Language-switch destinations and both homepage Marketplace installation links were checked.
- Browser control was unavailable, so this is HTTP content/resource verification, not a browser screenshot or interactive rendering certification. No search-engine indexing is claimed.

The earlier [Pages job](https://github.com/dzrdzrdzr/codex-model-switcher/actions/runs/34806936181/job/103860734909) failed to enable Pages under its integration permissions; the successful standalone deployment resolves that website blocker.

## Not published: Marketplace update

[Marketplace job](https://github.com/dzrdzrdzr/codex-model-switcher/actions/runs/34806936181/job/103860774233): the existing-publishing-authorization check found no configured `VSCE_PAT`; upload was explicitly skipped. The job's success means that the check completed, not that Marketplace was updated.

The anonymous preflight verified the existing `dzr.codex-local-model-switcher` listing and downloaded package at version **0.2.7**. Version **0.2.8** is available from GitHub Releases. Completing the Marketplace update requires publisher authorization, which is separate from GitHub repository access. No credentials should be pasted into public issues or chat.

## Local closeout checks

The public Marketplace query and downloaded package were independently checked at `2026-09-14T07:28:55Z`: the existing identity remains `dzr.codex-local-model-switcher`, version **0.2.7**. No upload was attempted and no new extension was created.

The repository secret-name API returned an empty list. `@vscode/vsce@3.9.2 ls-publishers` completed with no saved publishers, and no process-level publishing token was available. Browser inventory and explicit Edge publisher-page navigation failed at the browser-control connection, including after resetting the control session; no login state or upload capability could be established. GitHub access does not establish Marketplace publisher access. Remaining requirement: an operable authorized publisher session or valid `VSCE_PAT` authorization for the existing extension.

Downloaded the existing v0.2.8 release asset without rebuilding it. SHA-256 matched `9743ea149a03f33e362d8d9ac22e12e1a4163b32e40df1dac615e312f4f903f2`. Against approved source `30f584d0019453f15f40bc58fca5d1cfd327a93c`, `verify-vsix.py` passed the manifest publisher/name/version, all required runtime bytes and the 15-file allowlist. The disposable Windows source checkout's C# file was restored from its exact Git blob to avoid CRLF conversion during the byte comparison. Release assets and the tag were not changed.

Local `npm run verify` passed syntax checks for 12 JavaScript files and 41 tests; the opt-in compiled Windows launcher suite was not run in this closeout. `npm run build:site` and `npm run check:site` passed. No production code or workflow was changed, no replacement VSIX was built, and no real OpenAI/DeepSeek call was made.

## 中文摘要

已合并主分支并正式发布 GitHub v0.2.8，安装包、源码、网站离线文件和校验和均可下载。验证任务全部通过，Windows 启动器已实际编译和执行，但未使用真实密钥调用模型。

网站已通过本机管理员授权启用并成功部署，线上中英文页面和资源内容已核验。商店仍为 0.2.7：仓库和本机发布工具缺少发布者授权，浏览器控制连接失败，未执行上传；剩余阻碍仅为 Marketplace 发布路径。当前安装新版请使用 GitHub 的 v0.2.8 VSIX。没有开展用户招募、私信、自荐邮件或其他对外联系。
