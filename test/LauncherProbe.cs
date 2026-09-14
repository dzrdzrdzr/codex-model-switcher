using System;
using System.Text;
internal static class LauncherProbe
{
    private static string Encode(string value) { return Convert.ToBase64String(Encoding.UTF8.GetBytes(value ?? "")); }
    private static int Main(string[] args)
    {
        Console.InputEncoding = new UTF8Encoding(false);
        Console.OutputEncoding = new UTF8Encoding(false);
        Console.WriteLine("HOME=" + Encode(Environment.GetEnvironmentVariable("CODEX_HOME")));
        Console.WriteLine("CWD=" + Encode(Environment.CurrentDirectory));
        foreach (string arg in args) Console.WriteLine("ARG=" + Encode(arg));
        if (Array.IndexOf(args, "--echo-stdin") >= 0) Console.WriteLine("INPUT=" + Encode(Console.In.ReadToEnd()));
        int exitCode;
        return int.TryParse(Environment.GetEnvironmentVariable("SWITCHER_TEST_EXIT_CODE"), out exitCode) ? exitCode : 0;
    }
}
