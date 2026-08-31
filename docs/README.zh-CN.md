# Codex DeepSeek Switcher

[![CI](https://github.com/dzrdzrdzr/codex-model-switcher/actions/workflows/ci.yml/badge.svg)](https://github.com/dzrdzrdzr/codex-model-switcher/actions/workflows/ci.yml)
[![最新版本](https://img.shields.io/github/v/release/dzrdzrdzr/codex-model-switcher?display_name=tag)](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest)
[![MIT License](https://img.shields.io/badge/license-MIT-74c7a2)](../LICENSE)

**让 VS Code Codex 在 OpenAI 与 DeepSeek 官方 Responses API 之间直接切换，并把本地 VS Code、Codex Desktop 和每台 Remote SSH 主机的配置相互隔离。**

[下载最新 VSIX](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest) · [故障排查](TROUBLESHOOTING.md) · [提交问题](https://github.com/dzrdzrdzr/codex-model-switcher/issues/new?template=bug_report.yml) · [English](../README.md)

## 为什么需要它

DeepSeek 官方的一次性 Codex 配置适合单一环境，但会修改共享的 Codex Home。当桌面 Codex、本地 VS Code 和 SSH 窗口需要不同模型源时，登录状态和配置容易互相覆盖。

本扩展把它们拆开：

```text
Codex Desktop  ──> OpenAI 配置
本地 VS Code   ──> OpenAI 或 DeepSeek Direct
Remote SSH     ──> OpenAI 或 DeepSeek Direct，每台主机独立
```

DeepSeek 模式直接连接：

```toml
base_url = "https://api.deepseek.com/"
wire_api = "responses"
```

不需要 MoonBridge、localhost 中转、协议伪装或共享密钥文件。

## 主要能力

- 当前 VS Code 环境一键切换 GPT/OpenAI 与 DeepSeek Direct。
- 本地窗口和每台 Remote SSH 主机独立选择模型源。
- DeepSeek 使用单独的 Codex Home，不覆盖正常 OpenAI 配置。
- 支持 `deepseek-v4-pro` 和 `deepseek-v4-flash`。
- 存在旧中转 wrapper 时，优先定位真实 Codex 可执行文件。
- 状态检查会显示模型、provider、endpoint、wire API 和 Codex 版本，但不会输出 API Key。
- 保留旧命令 ID，减少已有安装升级后的兼容问题。

## 安装

### 本地 VS Code

从 [Releases](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest) 下载最新 `.vsix`，然后执行：

```powershell
code --install-extension .\codex-direct-model-switcher-0.2.7.vsix --force
```

版本更新后文件名会变化，请替换成实际下载的文件名。

### Remote SSH

必须把扩展安装到远端扩展主机，而不只是本地 VS Code：

```powershell
code --remote ssh-remote+你的主机 `
  --install-extension .\codex-direct-model-switcher-0.2.7.vsix `
  --force
```

也可以先连接 SSH 主机，再执行 **Extensions: Install from VSIX...**，并确认扩展显示在 **SSH: 主机名** 下。

## 使用

打开命令面板，运行：

```text
Codex Source: Switch GPT / DeepSeek Direct
```

首次启用 DeepSeek 时，扩展会通过 VS Code 密码输入框获取 API Key。完成后按提示重载当前窗口。

| 命令 | 作用 |
| --- | --- |
| `Codex Source: Switch GPT / DeepSeek Direct` | 切换当前环境 |
| `Codex Source: Use GPT (OpenAI)` | 恢复正常 OpenAI 配置 |
| `Codex Source: Use DeepSeek Direct` | 启用隔离的 DeepSeek 配置 |
| `Codex Source: Show Current Codex Source Status` | 核对 provider、endpoint、模型和 Codex 版本 |
| `Codex Source: Reapply Current Codex Source Setup` | 修复 launcher 或配置文件 |

## 配置隔离

| 环境 | OpenAI | DeepSeek |
| --- | --- | --- |
| 本地 Windows | `%USERPROFILE%\.codex` | `%USERPROFILE%\.codex-vscode-deepseek` |
| Remote SSH / Linux | `~/.codex` | `~/.codex-vscode-deepseek` |

扩展会为当前 VS Code 扩展主机设置一个小型 launcher，由 launcher 在启动 Codex 前选择对应的 Codex Home。

因此，把某台远端主机切到 DeepSeek，不会夺走本地 VS Code 或 Codex Desktop 的 OpenAI 登录。

## 验证是否为官方直连

运行 `Codex Source: Show Current Codex Source Status`。DeepSeek 模式应显示类似：

```text
mode: deepseek
provider: deepseek
base_url: https://api.deepseek.com/
wire_api: responses
direct: true
```

配置中不应依赖：

```text
127.0.0.1:38440
localhost
moonbridge
```

## 兼容性

| 组件 | 状态 |
| --- | --- |
| Windows 本地 VS Code | 支持 |
| VS Code Remote SSH 到 Linux | 支持 |
| Codex CLI | 建议 `0.144.0` 或更新版本 |
| 远端依赖 | Linux、`bash`、`python3` |
| DeepSeek 模型 | `deepseek-v4-pro`、`deepseek-v4-flash` |

## 安全边界

- API Key 不进入进程命令行，也不会打印到输出面板。
- DeepSeek Key 只写入当前环境的隔离配置，不复制到 OpenAI 配置。
- 扩展不会把本机配置上传到 GitHub。
- 提交 Issue 时只提供脱敏后的状态输出。

详见 [隐私说明](PRIVACY.md) 和 [安全策略](../SECURITY.md)。

## 开发验证

```powershell
npm run verify
```

Linux 下额外执行：

```bash
npm run test:remote
```

构建 VSIX：

```bash
npm run package:vsix
```

如果这个扩展解决了多模型源相互覆盖的问题，Star 能帮助其他 Codex 用户找到它。
