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

## Not published: GitHub Pages

[Pages job](https://github.com/dzrdzrdzr/codex-model-switcher/actions/runs/34806936181/job/103860734909): website artifact download succeeded, but enabling Pages returned `Resource not accessible by integration`. Deployment did not run. The workflow therefore has an overall failure despite the successful validation and GitHub release jobs.

The built site remains available as `website-0.2.8.zip`. It is not an online website, and no successful search-engine indexing is claimed. Completing deployment requires authorized Pages enablement; code/tests are not the blocker.

## Not published: Marketplace update

[Marketplace job](https://github.com/dzrdzrdzr/codex-model-switcher/actions/runs/34806936181/job/103860774233): the existing-publishing-authorization check found no configured `VSCE_PAT`; upload was explicitly skipped. The job's success means that the check completed, not that Marketplace was updated.

The anonymous preflight verified the existing `dzr.codex-local-model-switcher` listing and downloaded package at version **0.2.7**. Version **0.2.8** is available from GitHub Releases. Completing the Marketplace update requires publisher authorization, which is separate from GitHub repository access. No credentials should be pasted into public issues or chat.

## 中文摘要

已合并主分支并正式发布 GitHub v0.2.8，安装包、源码、网站离线文件和校验和均可下载。验证任务全部通过，Windows 启动器已实际编译和执行，但未使用真实密钥调用模型。

网站启用被 GitHub 权限拦截，商店更新因缺少发布授权而跳过。它们不是已上线状态，也不是等待用户手动验收；剩余阻碍是平台授权。当前安装新版请使用 GitHub 的 v0.2.8 VSIX。没有开展用户招募、私信、自荐邮件或其他对外联系。
