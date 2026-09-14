# Codex DeepSeek Switcher

**在 VS Code Codex 中切换 OpenAI / DeepSeek，不必反复手改模型来源配置。** 原有 Codex 与 DeepSeek 使用不同配置目录；Windows 本地与拥有独立主目录的 Linux SSH 账户分别保存选择。

[下载 v0.2.8 VSIX](https://github.com/dzrdzrdzr/codex-model-switcher/releases/tag/v0.2.8) · [商店页面](https://marketplace.visualstudio.com/items?itemName=dzr.codex-local-model-switcher) · [English](../README.md) · [故障排查](TROUBLESHOOTING.md)

> **发布状态（2026-09-14）：** v0.2.8 已在 GitHub 正式发布。核对时商店仍为 v0.2.7，更新尚缺发布者授权；安装 v0.2.8 请使用 GitHub 的 VSIX。网站已经构建，但尚未部署上线。详见[实际发布结果](PUBLICATION-STATUS.md)。

## 先理解隔离范围

```text
Windows 本地账户                 Linux SSH 账户（主目录独立）
OpenAI   → .codex               OpenAI   → .codex
DeepSeek → .codex-vscode-deepseek DeepSeek → .codex-vscode-deepseek
一份模型来源选择                 另一份模型来源选择
```

这是配置关系示意，不是实际 API 调用截图。**同一操作系统账户、同一主目录下的窗口共享选择，不是每个窗口独立。** 两个 SSH 别名或 NFS 主目录也可能实际共用状态。重载后新进程才应用选择，不会热切换正在运行的任务。

## 安装

安装 **v0.2.8**：从 [GitHub Release](https://github.com/dzrdzrdzr/codex-model-switcher/releases/tag/v0.2.8) 下载 `codex-local-model-switcher-0.2.8.vsix`，在扩展面板选择 **Extensions: Install from VSIX...（从 VSIX 安装）**，或运行：

```powershell
code --install-extension .\codex-local-model-switcher-0.2.8.vsix
```

扩展名称仍为 **Codex DeepSeek Switcher**，商店 ID 仍为 **`dzr.codex-local-model-switcher`**。下面的命令安装商店当前已发布版本，可能落后于 GitHub：

```powershell
code --install-extension dzr.codex-local-model-switcher
```

远程使用时，先连接 SSH，在扩展面板的 **SSH: 主机名** 下安装本扩展与 OpenAI Codex 扩展 `openai.chatgpt`；只装在 Local 下不够。安装包文件名以实际下载结果为准，开发分支版本或 GitHub 发布不代表商店已经同步更新。

历史 VSIX 的 ID 是 `hanzaidao.codex-local-model-switcher`。迁移时先禁用旧扩展，再启用 `dzr.codex-local-model-switcher`，避免两个切换器同时运行；不要为迁移而删除 `.codex` 或密钥文件。本轮保留原有命令 ID，详细身份差异见[发布说明](PUBLISHING.md)。

## 使用：切过去，也能切回来

1. 保存当前工作，私下备份已有配置，在可丢弃的测试目录确认原有 OpenAI Codex 正常。
2. 运行 `Codex Source: Use DeepSeek Direct`，需要时通过遮罩输入框填写自己的 DeepSeek API key；准备好后选择 `Reload current window`。
3. 运行 `Codex Source: Show Current Codex Source Status` 检查配置。`direct: true` 只说明配置指向直连，不代表网络、余额、模型权限或实际请求已成功。另发“只回复 OK，不调用工具”可做最小请求检查，但仍可能产生服务费用。

切回时运行 `Codex Source: Use GPT (OpenAI)` 并重载。状态栏入口打开切换菜单；`Reapply Current Codex Source Setup` 是重建当前设置，不是卸载或清除凭据。

## 需要哪些环境

Windows 本地实现面向 x64，需要 VS Code ≥1.80、同一扩展宿主中的 Codex、可用的 Windows PowerShell/C# 编译，以及已有 PATH 中可写的用户目录。Linux Remote SSH 需要远程 Codex、Bash、Python 3、GNU 工具和正常的 VS Code Server。模型目录标明 Codex 最低版本为 0.144.0。

应先初始化 Codex，存在 `.codex/config.toml`；只有默认配置适合你的情况时，空文件才足够。启动器定位的是 Codex 扩展附带的二进制，不是任意 PATH 上的 `codex`。当前启动器固定使用用户主目录下的配置，不保留自定义 `CODEX_HOME` 布局。

**本地 macOS/Linux、WSL、Dev Containers、Codespaces 和网页版 VS Code 不在当前支持范围。** 自动化测试使用临时目录和模拟 Codex，不等于所有平台、所有版本都经过真实模型调用验证；Windows 测试另行实际编译并执行 C# 启动器。见[验证记录](VALIDATION.md)。

## 凭据与费用

DeepSeek 配置指向 `https://api.deepseek.com/`，使用 `wire_api = "responses"`，附带 `deepseek-v4-pro`、`deepseek-v4-flash` 的模型目录。无需 MoonBridge 或本地中继，但真实可用性、网络和计费由服务方决定。

DeepSeek key 以**明文**保存在隔离的 `config.toml` 中，输入遮罩不是加密；Linux 文件权限为 `0600`，Windows 依赖文件 ACL。原有 `.codex/auth.json` 不会复制到 DeepSeek 目录，但从原配置派生时可能保留其他 provider/MCP 的字段和值。切回 OpenAI 不会清除 DeepSeek key 或备份。

扩展会设置 `chatgpt.cliExecutable`；Linux 还会调整 `extensions.supportNodeGlobalNavigator`。已有启动器可能在扩展激活时被修复。详见[隐私说明](PRIVACY.md)。不要公开完整配置、认证文件、原始日志、SSH 地址或未脱敏截图。

## 进一步使用

[如何使用 DeepSeek](guides.md#deepseek) · [如何切回 OpenAI](guides.md#openai) · [Remote SSH 安装位置](guides.md#remote-ssh) · [开发与发布](PUBLISHING.md)

扩展开源并采用 MIT 许可证，模型服务需要自己的账号或 API 凭据，实际请求可能收费。项目有帮助时可以在 GitHub 点 Star；扩展不弹窗催促，也没有 Star 解锁功能。统计脚本由维护者手动运行，不在用户机器上自动收集使用数据。

独立社区项目，与 OpenAI、DeepSeek、Microsoft 无官方隶属或背书关系。
