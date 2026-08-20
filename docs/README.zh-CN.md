# Codex Direct Source Switcher

在 VS Code Codex 中直接切换 OpenAI 与 DeepSeek 官方 Responses API，同时隔离本地窗口和 Remote SSH 主机的配置。

## 它解决什么问题

DeepSeek 官方配置会修改共享的 Codex Home。桌面 Codex、本地 VS Code 和 SSH 窗口需要使用不同模型源时，很容易互相覆盖登录状态或配置。

本扩展让每个 VS Code 环境独立选择：

```text
Codex Desktop  -> OpenAI
本地 VS Code   -> OpenAI 或 DeepSeek Direct
Remote SSH     -> OpenAI 或 DeepSeek Direct（每台主机独立）
```

DeepSeek 模式直接使用：

```toml
base_url = "https://api.deepseek.com/"
wire_api = "responses"
```

不需要 MoonBridge、`localhost` 或 `127.0.0.1:38440` 转发。

## 快速安装

从 [Releases](https://github.com/dzrdzrdzr/codex-model-switcher/releases/latest) 下载 `codex-direct-model-switcher-0.2.7.vsix`。

本地安装：

```powershell
code --install-extension .\codex-direct-model-switcher-0.2.7.vsix --force
```

Remote SSH 安装：

```powershell
code --remote ssh-remote+你的主机 --install-extension .\codex-direct-model-switcher-0.2.7.vsix --force
```

打开命令面板，运行：

```text
Codex Source: Switch GPT / DeepSeek Direct
```

首次设置 DeepSeek 时，扩展会通过密码输入框询问 API Key，并只写入当前环境的隔离配置。切换后按提示重载当前 VS Code 窗口。

## 怎么确认是官方直连

运行 `Codex Source: Show Current Codex Source Status`，应看到：

```text
mode: deepseek
provider: deepseek
base_url: https://api.deepseek.com/
wire_api: responses
direct: true
```

状态输出不会显示 API Key。

## 配置位置

| 环境 | OpenAI | DeepSeek |
| --- | --- | --- |
| 本地 Windows | `%USERPROFILE%\.codex` | `%USERPROFILE%\.codex-vscode-deepseek` |
| Remote SSH | `~/.codex` | `~/.codex-vscode-deepseek` |

建议 Codex CLI 使用 `0.144.0` 或更新版本。Remote SSH 主机需要 Linux、`bash` 和 `python3`。

## 隐私与安全

- API Key 不会进入命令行参数或输出日志。
- OpenAI 配置与 DeepSeek 配置相互隔离。
- 仓库不需要保存任何本机密钥、用户名或绝对路径。
- 提交 Issue 前请移除日志中的凭据与个人信息。

[返回英文主页](../README.md)
