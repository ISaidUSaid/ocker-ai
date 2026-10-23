// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using Avalonia;

namespace Ocker.Desktop;
internal static class Program
{
    [STAThread] public static void Main(string[] args) => BuildAvaloniaApp().StartWithClassicDesktopLifetime(args);
    public static AppBuilder BuildAvaloniaApp() => AppBuilder.Configure<App>().UsePlatformDetect().LogToTrace();
}
