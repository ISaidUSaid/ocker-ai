// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using Avalonia.Controls;
using Avalonia;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Layout;
using Avalonia.Platform.Storage;
using Ocker;
using Ocker.Avalonia;

namespace Ocker.Desktop;
public sealed class MainWindow : Window
{
    private OckerRecord _record = global::Ocker.Ocker.CreateRecord("Untitled chronology");
    private readonly List<Intermediate> _queue = [];
    private CancellationTokenSource? _operation;
    private string? _endpoint, _model, _apiKey;
    private string _theme = "glass";
    private readonly ChronologyView _view = new();
    private readonly TextBlock _status = new();
    private readonly ComboBox _kind = new() { ItemsSource = new[] { "affidavit", "order", "report" }, SelectedIndex = 0, Width = 110 };
    public MainWindow()
    {
        Title = "OCKER"; Width = 1040; Height = 760; MinWidth = 420; MinHeight = 500;
        var args=Environment.GetCommandLineArgs();var recordArg=args.FirstOrDefault(a=>a.StartsWith("--record="));
        if(recordArg is not null)_record=global::Ocker.Ocker.ParseRecord(File.ReadAllText(recordArg[9..]));
        Opened+=async(_,_)=>{var path=args.FirstOrDefault(a=>a.StartsWith("--snapshot="));if(path is not null){await Task.Delay(1400);using var bitmap=new RenderTargetBitmap(new PixelSize((int)Bounds.Width,(int)Bounds.Height));bitmap.Render(this);bitmap.Save(path[11..]);
          var export=args.FirstOrDefault(a=>a.StartsWith("--export-prefix="));if(export is not null){await using var png=File.Create(export[16..]+".png");await ChronologyExport.SavePngAsync(_view,png);await using var pdf=File.Create(export[16..]+".pdf");await ChronologyExport.SavePdfAsync(_view,pdf);}Close();}};
        Background=new LinearGradientBrush {StartPoint=new RelativePoint(0,0,RelativeUnit.Relative),EndPoint=new RelativePoint(1,1,RelativeUnit.Relative),GradientStops={new GradientStop(Color.Parse("#e5f2f1"),0),new GradientStop(Color.Parse("#ede9f5"),1)}};
        _view.Record = _record; _view.Options = new ChronologyViewOptions { OnChange = r => { _record = r; _status.Text = "Edited"; }, OnError = e => _status.Text = e.Message };
        SizeChanged += (_, _) => _view.Options = ViewOptions();
        var open = new Button { Content = "Open PDF or JSON" }; open.Click += async (_, _) => await OpenAsync();
        var save = new Button { Content = "Save JSON" }; save.Click += async (_, _) => await SaveAsync();
        var extract = new Button { Content = "Build queued chronologies" }; extract.Click += async (_, _) => await BuildChronologyAsync();
        var cancel = new Button { Content = "Cancel" }; cancel.Click += (_, _) => _operation?.Cancel();
        var relate = new Button { Content = "Find relationships" }; relate.Click += async (_, _) => await FindRelationshipsAsync();
        var export = new Button { Content = "Export PNG / PDF" }; export.Click += async (_, _) => await ExportVisualAsync();
        var settings = new Button { Content = "Settings" }; settings.Click += (_, _) => ShowSettings();
        var bar = new WrapPanel { Margin = new global::Avalonia.Thickness(10), Children = { open, _kind, save, extract, relate, cancel, export, settings, _status } };
        var heading=new TextBlock {Text="ocker·   Every account. In its place.",FontSize=24,FontWeight=FontWeight.Bold,Foreground=Brushes.DarkSlateGray,Margin=new Thickness(18,14)};
        var settingsArea=new StackPanel {Children={heading,bar}};
        Content = new DockPanel { Children = { settingsArea, _view } }; DockPanel.SetDock(settingsArea, Dock.Top);
    }
    private async Task OpenAsync()
    {
        var file = (await StorageProvider.OpenFilePickerAsync(new FilePickerOpenOptions { Title = "Open OCKER JSON or text PDF", AllowMultiple = false, FileTypeFilter = [new("OCKER JSON") { Patterns = ["*.json"] }, new("PDF") { Patterns = ["*.pdf"] }] })).FirstOrDefault();
        if (file is null) return;
        try { await using var stream = await file.OpenReadAsync(); if (file.Name.EndsWith(".json", StringComparison.OrdinalIgnoreCase)) { using var reader = new StreamReader(stream); var next = global::Ocker.Ocker.ParseRecord(await reader.ReadToEndAsync()); _record = next; _queue.Clear(); _view.Record = next; _status.Text = "Loaded"; } else { var kind = _kind.SelectedItem as string ?? "affidavit"; var parsed = await global::Ocker.Ocker.ParsePdfAsync(stream, Guid.NewGuid().ToString("N"), Path.GetFileNameWithoutExtension(file.Name), kind, assetName: file.Name); _queue.Add(parsed); _status.Text = $"Queued {_queue.Count} document(s)"; } } catch (Exception ex) { _status.Text = ex.Message; }
    }
    private async Task SaveAsync()
    {
        var file = await StorageProvider.SaveFilePickerAsync(new FilePickerSaveOptions { Title = "Save OCKER record", SuggestedFileName = "chronology.ocker.json", DefaultExtension = "json", FileTypeChoices = [new("OCKER JSON") { Patterns = ["*.json"] }] });
        if (file is null) return; await using var stream = await file.OpenWriteAsync(); await using var writer = new StreamWriter(stream); await writer.WriteAsync(global::Ocker.Ocker.ExportRecord(_record)); _status.Text = "Saved";
    }
    private void ShowSettings()
    {
        var endpoint = new TextBox { Text = _endpoint, Watermark = "Endpoint (stored only in this window)" }; var model = new TextBox { Text = _model, Watermark = "Model" }; var key = new TextBox { Text = _apiKey, Watermark = "API key", PasswordChar = '•' }; var theme = new ComboBox { ItemsSource = new[] { "glass", "none" }, SelectedItem = _theme }; var save = new Button { Content = "Use settings" };
        var dialog = new Window { Title = "Provider and appearance settings", Width = 460, Height = 320 }; save.Click += (_, _) => { _endpoint = endpoint.Text; _model = model.Text; _apiKey = key.Text; _theme = theme.SelectedItem as string ?? "glass"; _view.Options = ViewOptions(); _status.Text = "Settings retained in memory"; dialog.Close(); }; dialog.Content = new StackPanel { Margin = new global::Avalonia.Thickness(16), Spacing = 10, Children = { new TextBlock { Text = "Provider settings are held in memory and are never saved in OCKER JSON." }, endpoint, model, key, new TextBlock { Text = "Dialog theme" }, theme, save } }; if(_theme=="glass"){var content=dialog.Content as Control;dialog.Content=null;dialog.Content=new Border {BorderThickness=new Thickness(9),BorderBrush=new SolidColorBrush(Color.FromArgb(180,255,255,255)),Background=new SolidColorBrush(Color.Parse("#eef5fa")),CornerRadius=new CornerRadius(14),Child=content};var root=Content as Control;var previous=root?.Effect;if(root is not null)root.Effect=new BlurEffect {Radius=8};dialog.Closed+=(_,_)=>{if(root is not null)root.Effect=previous;};}dialog.WindowStartupLocation=WindowStartupLocation.CenterOwner;dialog.ShowDialog(this);
    }
    private OckerOptions Options()
    {
        if (_endpoint is null || _model is null || _apiKey is null) throw new OckerException("Set endpoint, model and API key in Settings first.");
        return new OckerOptions { CompletionAdapter = new OpenAiCompatibleAdapter(new HttpClient(), new Uri(_endpoint), _model, _apiKey), OnProgress = p => _status.Text = p.Message, OnError = e => _status.Text = e.Message };
    }
    private ChronologyViewOptions ViewOptions() => new() { Theme = _theme, Mobile = Bounds.Width < 650, Animate = true, OnChange = r => { _record = r; _status.Text = "Edited"; }, OnError = e => _status.Text = e.Message };
    private async Task BuildChronologyAsync()
    { try { if (_queue.Count == 0) throw new OckerException("Queue one or more text PDFs first."); _operation = new CancellationTokenSource(); var options = Options(); var groups = new List<OckerEvent>(); foreach (var intermediate in _queue) groups.AddRange(await global::Ocker.Ocker.BuildChronologyAsync(intermediate, options, _operation.Token)); var documents = _queue.Select(x => x.Document).ToList(); var assets = _queue.Where(x => x.Asset is not null).Select(x => x.Asset!).ToList(); var next = _record with { Documents = documents, Assets = assets, Events = groups, Relationships = [], Notes = [], Authorities = [], UpdatedAt = DateTimeOffset.UtcNow.ToString("O") }; global::Ocker.Ocker.ValidateRecord(next); _record = next; _queue.Clear(); _view.Record = next; _status.Text = "Chronologies built"; } catch (OperationCanceledException) { _status.Text = "Cancelled; record unchanged"; } catch (Exception e) { _status.Text = e.Message; } finally { _operation?.Dispose(); _operation = null; } }
    private async Task FindRelationshipsAsync()
    { try { _operation = new CancellationTokenSource(); var relationships = await global::Ocker.Ocker.FindRelationshipsAsync(_record.Events, Options(), _operation.Token); var next = _record with { Relationships = relationships.ToList(), UpdatedAt = DateTimeOffset.UtcNow.ToString("O") }; global::Ocker.Ocker.ValidateRecord(next); _record = next; _view.Record = next; } catch (OperationCanceledException) { _status.Text = "Cancelled; record unchanged"; } catch (Exception e) { _status.Text = e.Message; } finally { _operation?.Dispose(); _operation = null; } }
    private async Task ExportVisualAsync()
    { var file = await StorageProvider.SaveFilePickerAsync(new FilePickerSaveOptions { Title = "Export chronology image", SuggestedFileName = "chronology.png", FileTypeChoices = [new("PNG image") { Patterns = ["*.png"] }, new("PDF document") { Patterns = ["*.pdf"] }] }); if (file is null) return; await using var stream = await file.OpenWriteAsync(); if (file.Name.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)) await ChronologyExport.SavePdfAsync(_view, stream); else await ChronologyExport.SavePngAsync(_view, stream); _status.Text = "Visual export saved"; }
}
