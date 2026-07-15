using System;
using System.Diagnostics;
using System.IO;
using System.Linq;

internal static class CodexLocalModelLauncher
{
    private const string DefaultDeepSeekModel = "deepseek-v4-pro";
    private const string DefaultDeepSeekProvider = "moonbridge";
    private const string DefaultMoonBridgeBaseUrl = "http://127.0.0.1:17898/v1";

    private static int Main(string[] args)
    {
        try
        {
            string runtimeRoot = GetRuntimeRoot();
            Directory.CreateDirectory(runtimeRoot);

            string mode = ReadMode(runtimeRoot);
            string codexHome = ResolveCodexHome(mode);
            Directory.CreateDirectory(codexHome);

            if (mode.Equals("deepseek", StringComparison.OrdinalIgnoreCase))
            {
                EnsureDeepSeekConfig(codexHome);
            }

            string realCodex = ResolveRealCodex();
            if (string.IsNullOrWhiteSpace(realCodex) || !File.Exists(realCodex))
            {
                Console.Error.WriteLine("Codex Model Switcher could not find the real Codex executable.");
                Console.Error.WriteLine("Set CODEX_SWITCHER_REAL_CODEX to the original Codex executable path.");
                return 127;
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = realCodex,
                Arguments = JoinArguments(args),
                UseShellExecute = false
            };

            startInfo.EnvironmentVariables["CODEX_HOME"] = codexHome;
            startInfo.EnvironmentVariables["CODEX_SWITCHER_MODE"] = mode;

            if (mode.Equals("deepseek", StringComparison.OrdinalIgnoreCase))
            {
                string provider = GetEnv("CODEX_SWITCHER_DEEPSEEK_PROVIDER", DefaultDeepSeekProvider);
                string model = GetEnv("CODEX_SWITCHER_DEEPSEEK_MODEL", DefaultDeepSeekModel);
                startInfo.EnvironmentVariables["CODEX_SWITCHER_DEEPSEEK_PROVIDER"] = provider;
                startInfo.EnvironmentVariables["CODEX_SWITCHER_DEEPSEEK_MODEL"] = model;

                if (string.IsNullOrWhiteSpace(startInfo.EnvironmentVariables["MOONBRIDGE_API_KEY"]))
                {
                    startInfo.EnvironmentVariables["MOONBRIDGE_API_KEY"] = "codex-model-switcher-local";
                }
            }

            using (Process child = Process.Start(startInfo))
            {
                if (child == null)
                {
                    Console.Error.WriteLine("Failed to start the real Codex executable.");
                    return 126;
                }

                child.WaitForExit();
                return child.ExitCode;
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("Codex Model Switcher launcher failed:");
            Console.Error.WriteLine(ex.Message);
            return 1;
        }
    }

    private static string JoinArguments(string[] args)
    {
        if (args == null || args.Length == 0)
        {
            return "";
        }

        return string.Join(" ", args.Select(QuoteArgument).ToArray());
    }

    private static string QuoteArgument(string arg)
    {
        if (arg == null)
        {
            return "\"\"";
        }

        if (arg.Length == 0)
        {
            return "\"\"";
        }

        bool needsQuotes = arg.Any(ch => char.IsWhiteSpace(ch) || ch == '"');
        if (!needsQuotes)
        {
            return arg;
        }

        return "\"" + arg.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
    }

    private static string ReadMode(string runtimeRoot)
    {
        string modeFile = Path.Combine(runtimeRoot, "local-mode.txt");
        if (!File.Exists(modeFile))
        {
            return "gpt";
        }

        string mode = File.ReadAllText(modeFile).Trim().ToLowerInvariant();
        return mode == "deepseek" ? "deepseek" : "gpt";
    }

    private static string ResolveCodexHome(string mode)
    {
        if (mode.Equals("deepseek", StringComparison.OrdinalIgnoreCase))
        {
            return ExpandPath(GetEnv("CODEX_SWITCHER_DEEPSEEK_HOME", Path.Combine(GetUserProfile(), ".codex-deepseek")));
        }

        return ExpandPath(GetEnv("CODEX_SWITCHER_GPT_HOME", Path.Combine(GetUserProfile(), ".codex")));
    }

    private static string ResolveRealCodex()
    {
        string configured = Environment.GetEnvironmentVariable("CODEX_SWITCHER_REAL_CODEX");
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return ExpandPath(configured);
        }

        string currentExe = Process.GetCurrentProcess().MainModule.FileName;
        string currentDir = Path.GetDirectoryName(currentExe) ?? "";
        string sidecar = Path.Combine(currentDir, "codex-real.exe");
        if (File.Exists(sidecar))
        {
            return sidecar;
        }

        string extensionRoot = Path.Combine(GetUserProfile(), ".vscode", "extensions");
        if (!Directory.Exists(extensionRoot))
        {
            return "";
        }

        var candidates = Directory.GetDirectories(extensionRoot, "openai.chatgpt-*")
            .Select(dir => Path.Combine(dir, "bin", "windows-x86_64", "codex-real.exe"))
            .Where(File.Exists)
            .OrderByDescending(File.GetLastWriteTimeUtc)
            .ToArray();

        return candidates.FirstOrDefault() ?? "";
    }

    private static void EnsureDeepSeekConfig(string codexHome)
    {
        string model = GetEnv("CODEX_SWITCHER_DEEPSEEK_MODEL", DefaultDeepSeekModel);
        string provider = GetEnv("CODEX_SWITCHER_DEEPSEEK_PROVIDER", DefaultDeepSeekProvider);
        string baseUrl = GetEnv("CODEX_SWITCHER_MOONBRIDGE_BASE_URL", DefaultMoonBridgeBaseUrl);
        string configPath = Path.Combine(codexHome, "config.toml");

        string content =
            "model = \"" + EscapeToml(model) + "\"" + Environment.NewLine +
            "model_provider = \"" + EscapeToml(provider) + "\"" + Environment.NewLine +
            Environment.NewLine +
            "[model_providers." + provider + "]" + Environment.NewLine +
            "name = \"MoonBridge\"" + Environment.NewLine +
            "base_url = \"" + EscapeToml(baseUrl) + "\"" + Environment.NewLine +
            "env_key = \"MOONBRIDGE_API_KEY\"" + Environment.NewLine +
            "wire_api = \"chat\"" + Environment.NewLine;

        File.WriteAllText(configPath, content);
    }

    private static string GetRuntimeRoot()
    {
        string configured = Environment.GetEnvironmentVariable("CODEX_SWITCHER_RUNTIME_ROOT");
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return ExpandPath(configured);
        }

        string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (string.IsNullOrWhiteSpace(localAppData))
        {
            localAppData = Path.Combine(GetUserProfile(), "AppData", "Local");
        }

        return Path.Combine(localAppData, "CodexModelSwitcher");
    }

    private static string GetUserProfile()
    {
        string profile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        if (!string.IsNullOrWhiteSpace(profile))
        {
            return profile;
        }

        return Environment.GetEnvironmentVariable("USERPROFILE") ?? "";
    }

    private static string GetEnv(string name, string fallback)
    {
        string value = Environment.GetEnvironmentVariable(name);
        return string.IsNullOrWhiteSpace(value) ? fallback : value;
    }

    private static string ExpandPath(string path)
    {
        return Environment.ExpandEnvironmentVariables(path);
    }

    private static string EscapeToml(string value)
    {
        return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }
}

