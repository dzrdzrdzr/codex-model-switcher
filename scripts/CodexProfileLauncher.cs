using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;

internal static class Program
{
    private const long MinimumRealCodexSize = 1024L * 1024L;

    private static int Main(string[] args)
    {
        try
        {
            string user = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string localData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string modeFile = Path.Combine(localData, "Codex-Direct-Model-Switcher", "mode.txt");
            string mode = File.Exists(modeFile) ? File.ReadAllText(modeFile).Trim().ToLowerInvariant() : "gpt";
            string codexHome = mode == "deepseek"
                ? Path.Combine(user, ".codex-vscode-deepseek")
                : Path.Combine(user, ".codex");

            Environment.SetEnvironmentVariable("CODEX_HOME", codexHome);
            string realCodex = FindRealCodex(user);
            List<string> launcherArgs = new List<string>();
            if (mode == "deepseek")
            {
                string configPath = Path.Combine(codexHome, "config.toml");
                string model = ReadTopLevelString(configPath, "model");
                string effort = ReadTopLevelString(configPath, "model_reasoning_effort");
                if (!string.IsNullOrWhiteSpace(model))
                {
                    launcherArgs.Add("-c");
                    launcherArgs.Add("model=" + model);
                }
                if (!string.IsNullOrWhiteSpace(effort))
                {
                    launcherArgs.Add("-c");
                    launcherArgs.Add("model_reasoning_effort=" + effort);
                }
            }
            launcherArgs.AddRange(args);
            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = realCodex,
                Arguments = string.Join(" ", launcherArgs.Select(QuoteArgument)),
                UseShellExecute = false,
                WorkingDirectory = Environment.CurrentDirectory
            };

            using (Process process = Process.Start(psi))
            {
                process.WaitForExit();
                return process.ExitCode;
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("Codex profile launcher error: " + ex.Message);
            return 1;
        }
    }

    private static string ReadTopLevelString(string configPath, string key)
    {
        if (!File.Exists(configPath)) return null;
        foreach (string rawLine in File.ReadLines(configPath))
        {
            string line = rawLine.Trim();
            if (line.StartsWith("[", StringComparison.Ordinal)) break;
            if (line.StartsWith("#", StringComparison.Ordinal)) continue;
            int separator = line.IndexOf('=');
            if (separator < 0) continue;
            if (!line.Substring(0, separator).Trim().Equals(key, StringComparison.Ordinal)) continue;
            string value = line.Substring(separator + 1).Trim();
            if (value.Length >= 2 && value[0] == '"' && value[value.Length - 1] == '"')
                return value.Substring(1, value.Length - 2);
            return value;
        }
        return null;
    }

    private static string FindRealCodex(string user)
    {
        string explicitPath = Environment.GetEnvironmentVariable("CODEX_REAL_CLI");
        if (!string.IsNullOrWhiteSpace(explicitPath) && IsRealCandidate(explicitPath))
            return explicitPath;

        string[] roots =
        {
            Path.Combine(user, ".vscode", "extensions"),
            Path.Combine(user, ".vscode-insiders", "extensions")
        };

        List<FileInfo> candidates = new List<FileInfo>();
        foreach (string root in roots)
        {
            if (!Directory.Exists(root)) continue;
            try
            {
                foreach (string name in new[] { "codex.real.exe", "codex.exe" })
                {
                    foreach (string file in Directory.GetFiles(root, name, SearchOption.AllDirectories))
                    {
                        string normalized = file.Replace('/', '\\').ToLowerInvariant();
                        if (normalized.Contains("\\openai.chatgpt-") &&
                            normalized.Contains("\\bin\\windows-x86_64\\") &&
                            IsRealCandidate(file))
                        {
                            candidates.Add(new FileInfo(file));
                        }
                    }
                }
            }
            catch
            {
            }
        }

        FileInfo newest = candidates
            .OrderByDescending(candidate => candidate.Directory.Parent.Parent.LastWriteTimeUtc)
            .ThenBy(candidate => candidate.Name.Equals("codex.real.exe", StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .ThenByDescending(candidate => candidate.LastWriteTimeUtc)
            .FirstOrDefault();
        if (newest != null) return newest.FullName;

        throw new FileNotFoundException("Cannot find the real Codex executable bundled with the VS Code extension.");
    }

    private static bool IsRealCandidate(string path)
    {
        try
        {
            FileInfo item = new FileInfo(path);
            return item.Exists && item.Length >= MinimumRealCodexSize;
        }
        catch
        {
            return false;
        }
    }

    private static string QuoteArgument(string value)
    {
        if (value == null) return "\"\"";
        if (value.Length > 0 && value.IndexOfAny(new[] { ' ', '\t', '\n', '\v', '"' }) < 0) return value;

        System.Text.StringBuilder result = new System.Text.StringBuilder();
        result.Append('"');
        int backslashes = 0;
        foreach (char character in value)
        {
            if (character == '\\')
            {
                backslashes++;
            }
            else if (character == '"')
            {
                result.Append('\\', backslashes * 2 + 1);
                result.Append('"');
                backslashes = 0;
            }
            else
            {
                result.Append('\\', backslashes);
                result.Append(character);
                backslashes = 0;
            }
        }
        result.Append('\\', backslashes * 2);
        result.Append('"');
        return result.ToString();
    }
}
