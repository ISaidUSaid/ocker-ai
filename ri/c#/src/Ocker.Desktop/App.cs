// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Themes.Fluent;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Media;
using Avalonia.Styling;

namespace Ocker.Desktop;
public sealed class App : Application
{
    public override void Initialize() { RequestedThemeVariant=ThemeVariant.Light;Styles.Add(new FluentTheme());Styles.Add(new Style(x=>x.OfType<Button>()) {Setters={new Setter(TemplatedControl.BackgroundProperty,new SolidColorBrush(Color.Parse("#185365"))),new Setter(TemplatedControl.ForegroundProperty,Brushes.White),new Setter(TemplatedControl.CornerRadiusProperty,new CornerRadius(7)),new Setter(TemplatedControl.PaddingProperty,new Thickness(10,7)),new Setter(TemplatedControl.MarginProperty,new Thickness(3))}}); }
    public override void OnFrameworkInitializationCompleted()
    { if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop) desktop.MainWindow = new MainWindow(); base.OnFrameworkInitializationCompleted(); }
}
