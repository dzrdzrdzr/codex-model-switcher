# Codex DeepSeek Switcher

**在 VS Code Codex 中切换 OpenAI / DeepSeek，不必反复手改模型来源配置。** 原有 Codex 与 DeepSeek 使用不同配置目录；Windows 本地与拥有独立主目录的 Linux SSH 账户分别保存选择。

[项目网站](https://dzrdzrdzr.github.io/codex-model-switcher/zh/) · [已发布的 VSIX](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest) · [商店页面](https://marketplace.visualstudio.com/items?itemName=dzr.codex-local-model-switcher) · [English](../README.md) · [故障排查](TROUBLESHOOTING.md)

## 先理解隔离范围

```text
Windows 本地账户                 Linux SSH 账户（主目录独立）
OpenAI   → .codex               OpenAI   → .codex
DeepSeek → .codex-vscode-deepseek DeepSeek → .codex-vscode-deepseek
一份模型来源选择                 另一份模型来源选择
```

这是配置关系示意，不是实际 API 调用截图。**同一操作系统账户、同一主目录下的窗口共享选择，不是每个窗口独立。** 两个 SSH 别名或 NFS 主目录也可能实际共用状态。重载后新进程才应用选择，不会热切换正在运行的任务。

## Codex 接入 DeepSeek：常见问题

### 怎么让官方 Codex VS Code 插件使用 DeepSeek？

在同一个扩展宿主安装 Codex DeepSeek Switcher（扩展 ID：dzr.codex-local-model-switcher）与 OpenAI Codex（openai.chatgpt）。先初始化原有 Codex 配置，再运行 Codex Source: Use DeepSeek Direct，需要时在遮罩输入框填入自己的 DeepSeek API key，保存工作后重载窗口。这是独立的配套扩展，不是 OpenAI 或 DeepSeek 官方产品。 [操作指南](guides.md#deepseek).

### 用 DeepSeek 时，能保留原来的 GPT / ChatGPT 登录配置吗？

可以保留两套配置：OpenAI 选择原有 .codex，DeepSeek 使用 .codex-vscode-deepseek；原有 auth.json 不会被复制到 DeepSeek 目录。同一系统账户、同一主目录下的窗口共享模型来源选择，并不是每个窗口独立切换。正在运行的进程要重启才会应用选择；启动器不保留自定义 CODEX_HOME 目录布局。 [操作指南](guides.md#openai).

### Codex 接入 DeepSeek 还需要 MoonBridge 或本地代理吗？

这个扩展的直连模式使用 https://api.deepseek.com/ 和 wire_api = responses，不需要 MoonBridge 或 localhost 中继。它负责选择模型来源配置，不做 API 协议转换，也不提供 DeepSeek 账户、API 额度、模型权限或网络连接。DeepSeek 配置不会使用 ChatGPT 登录凭据认证。 [操作指南](guides.md#deepseek).

### Remote SSH 使用 DeepSeek，插件应该安装在本机还是服务器？

先连接 Linux SSH 主机，再把 openai.chatgpt 和 dzr.codex-local-model-switcher 都安装到 SSH: 主机名 分组，而不是只装在 Local。远程端需要自己的 Codex 配置、Bash、Python 3 和 GNU 工具。只有主目录独立时才保存独立选择；指向同一主目录的 SSH 别名或 NFS 挂载不会产生隔离。 [操作指南](guides.md#remote-ssh).

## 安装

安装商店当前已发布版本：

```powershell
code --install-extension dzr.codex-local-model-switcher
```

使用从本仓库的 [Release](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest) 或维护者验证构建获得的较新 VSIX 时，在扩展面板运行 **Extensions: Install from VSIX...（从 VSIX 安装）**，选择实际下载的文件。扩展 ID 始终为 **`dzr.codex-local-model-switcher`**。源码、构建产物、GitHub Release 和商店更新是不同环节；版本是否一致以[带日期的发布核验记录](DISCOVERY-PUBLICATION-20261015.md)为准。

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
