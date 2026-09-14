# Focused usage guides / 使用指南

These describe the implemented workflow, not a live compatibility certification. 下面说明操作方式，不代表全部客户端版本均已实测。

<a id="deepseek"></a>
## Use DeepSeek in VS Code Codex / 在 Codex 中使用 DeepSeek

Install `dzr.codex-local-model-switcher` alongside `openai.chatgpt` on the correct local or remote extension host. Initialize your normal Codex profile first. Save work, then run `Codex Source: Use DeepSeek Direct`. The key prompt appears only when no key is already available in the source profile. Confirm the target environment and reload when ready.

在同一个本地或远程扩展宿主安装两个扩展，先初始化原有 Codex。切换前保存工作，通过扩展输入框填写密钥，不要把密钥粘进命令行。状态输出可核对来源、模型和端点，但不能证明调用成功。

The configuration uses an isolated `.codex-vscode-deepseek` home. Check the status command, then separately make a minimal request in a disposable folder. A live request may cost money. Neither an active status-bar label nor `direct: true` verifies account balance, model access, response quality or network connectivity.

See [Privacy](PRIVACY.md) for plaintext key storage and retained backups.

<a id="openai"></a>
## Return to OpenAI / 切回 OpenAI

Run `Codex Source: Use GPT (OpenAI)` and reload the current window. The launcher selects the normal `.codex` directory. Its contents still determine the provider: a directory named `.codex` is not itself proof that it contains a working OpenAI configuration. This switch is not a repair of an already broken normal profile.

运行上述命令并重载，启动器改用原有 `.codex`。原目录本来就有错误时，切回不会自动修复它。`Use GPT (OpenAI)` 是选择原配置目录，不是重新申请账号或恢复已丢失的认证。

Existing Codex processes continue with their original environment until restarted. Save work rather than force-killing them. Shared-home windows also share the provider choice. Returning does not erase the DeepSeek key, its configuration or backups, and it does not restore the pre-extension `chatgpt.cliExecutable` value.

To stop using the switcher, first select the normal profile and reload. Disable the switcher in that extension host, restore your previous `chatgpt.cliExecutable` value (or remove the override if none existed), and reload again. Do not delete your `.codex` directory. Remote setup may also have changed `extensions.supportNodeGlobalNavigator`; restore its prior value only after checking the saved settings backup and other extensions' needs.

<a id="remote-ssh"></a>
## Install on the Remote SSH host / 安装到远程环境

Connect to the Linux host before installing. In Extensions, verify that both `openai.chatgpt` and `dzr.codex-local-model-switcher` are listed under **SSH: your-host**. “Installed locally” is not the same as installed on the remote extension host.

先连接 SSH，再检查左侧扩展面板。需要的是 **SSH: 主机名** 分组中的安装状态，而不是仅有本机 Local。远程机器需要 Bash、Python 3、GNU 工具，以及工作正常的 VS Code Server 和 Codex 配置。

Check `Show Current Codex Source Status` inside that SSH window. It should name the remote home and launcher. Windows local and a remote Linux account with a different home have distinct saved modes. Two SSH aliases pointing to the same user/home, or NFS-shared homes, do not create independent choices.

If prerequisites are absent, the helper reports the missing command before installation writes. No connection credentials or SSH host details should be posted publicly. Review [Troubleshooting](TROUBLESHOOTING.md) for safe diagnostics.
