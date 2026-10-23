// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Controls.Documents;
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
    private readonly TextBox _code = new() { IsReadOnly = true, AcceptsReturn = true, TextWrapping = TextWrapping.NoWrap, FontFamily = new FontFamily("Menlo"), MinHeight = 170 };
    private readonly Border _codePane = new() { IsVisible = false, Margin = new Thickness(18, 0, 18, 10), Padding = new Thickness(10), BorderBrush = Brushes.LightSlateGray, BorderThickness = new Thickness(1), CornerRadius = new CornerRadius(8) };
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
        var open = new Button { Content = "Add documents" }; open.Click += async (_, _) => await OpenAsync(false);
        var import = new Button { Content = "Import OCKER file" }; import.Click += async (_, _) => await OpenAsync(true);
        var example = new Button { Content = "Load Joe and Jill Blogs Example Chronology" }; example.Click += (_, _) => LoadExample();
        var save = new Button { Content = "Save JSON" }; save.Click += async (_, _) => await SaveAsync();
        var extract = new Button { Content = "Build chronology" }; extract.Click += async (_, _) => await BuildChronologyAsync();
        var cancel = new Button { Content = "Cancel" }; cancel.Click += (_, _) => _operation?.Cancel();
        var export = new Button { Content = "Export PNG / PDF" }; export.Click += async (_, _) => await ExportVisualAsync();
        var settings = new Button { Content = "Settings" }; settings.Click += (_, _) => ShowSettings();
        var editJson = new Button { Content = "Edit OCKER file" }; editJson.Click += (_, _) => ShowJsonEditor();
        var showCode = new Button { Content = "Show code" }; showCode.Click += async (_, _) => { _codePane.IsVisible = !_codePane.IsVisible; showCode.Content = _codePane.IsVisible ? "Hide code" : "Show code"; if (_codePane.IsVisible) UpdateCode(); await Task.CompletedTask; };
        var copyCode = new Button { Content = "Copy" }; copyCode.Click += async (_, _) => { var top = TopLevel.GetTopLevel(this); if (top?.Clipboard is not null) await top.Clipboard.SetTextAsync(_code.Text); };
        _codePane.Child = new StackPanel { Spacing = 6, Children = { new TextBlock { Text = "C# integration", FontWeight = FontWeight.Bold }, _code, copyCode } };
        var bar = new WrapPanel { Margin = new global::Avalonia.Thickness(10), Children = { open, import, example, save, extract, cancel, export, settings, showCode, editJson, _status } };
        var notice = new TextBlock { Text = "Build sends selected document text to the configured provider. Ollama uses your local machine.", Foreground = Brushes.DarkSlateGray, Margin = new Thickness(18, 0, 18, 8), TextWrapping = TextWrapping.Wrap };
        var heading=new TextBlock {Text="Open Chronology, Knowledge and Evidence Record · Every account. In its place.",FontSize=24,FontWeight=FontWeight.Bold,Foreground=Brushes.DarkSlateGray,Margin=new Thickness(18,14)};
        var settingsArea=new StackPanel {Children={heading,notice,bar,_codePane}};
        Content = new DockPanel { Children = { settingsArea, _view } }; DockPanel.SetDock(settingsArea, Dock.Top);
    }
    private async Task OpenAsync(bool jsonOnly)
    {
        var types = jsonOnly ? new[] { new FilePickerFileType("OCKER JSON") { Patterns = ["*.json"] } } : new[] { new FilePickerFileType("PDF") { Patterns = ["*.pdf"] }, new FilePickerFileType("Text documents") { Patterns = ["*.txt", "*.rtf", "*.docx"] } };
        var file = (await StorageProvider.OpenFilePickerAsync(new FilePickerOpenOptions { Title = jsonOnly ? "Import OCKER file" : "Add documents", AllowMultiple = false, FileTypeFilter = types })).FirstOrDefault();
        if (file is null) return;
        try { if (file.Name.EndsWith(".json", StringComparison.OrdinalIgnoreCase)) { await using var stream = await file.OpenReadAsync(); using var reader = new StreamReader(stream); var next = global::Ocker.Ocker.ParseRecord(await reader.ReadToEndAsync()); _record = next; _queue.Clear(); _view.Record = next; _status.Text = "Loaded"; } else { var kind = await PromptDocumentKindAsync(file.Name); if (kind is null) return; await using var stream = await file.OpenReadAsync(); var parsed = file.Name.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase) ? await global::Ocker.Ocker.ParsePdfAsync(stream, Guid.NewGuid().ToString("N"), Path.GetFileNameWithoutExtension(file.Name), kind, assetName: file.Name) : await global::Ocker.Ocker.ParseTextDocumentAsync(stream, file.Name, Guid.NewGuid().ToString("N"), Path.GetFileNameWithoutExtension(file.Name), kind); _queue.Add(parsed); _status.Text = $"Queued {_queue.Count} document(s)"; } } catch (Exception ex) { _status.Text = ex.Message; }
    }
    private void LoadExample()
    { try { using var stream = typeof(MainWindow).Assembly.GetManifestResourceStream("Ocker.Desktop.Examples.joe-jill.ocker.json") ?? throw new OckerException("Embedded example is missing."); using var reader = new StreamReader(stream); var next = global::Ocker.Ocker.ParseRecord(reader.ReadToEnd()); _record = next; _queue.Clear(); _view.Record = next; _status.Text = "Joe and Jill Blogs example loaded"; } catch (Exception ex) { _status.Text = ex.Message; } }
    private async Task SaveAsync()
    {
        var file = await StorageProvider.SaveFilePickerAsync(new FilePickerSaveOptions { Title = "Save OCKER record", SuggestedFileName = "chronology.ocker.json", DefaultExtension = "json", FileTypeChoices = [new("OCKER JSON") { Patterns = ["*.json"] }] });
        if (file is null) return; await using var stream = await file.OpenWriteAsync(); await using var writer = new StreamWriter(stream); await writer.WriteAsync(global::Ocker.Ocker.ExportRecord(_record)); _status.Text = "Saved";
    }
    private void ShowSettings()
    {
        var endpoint = new TextBox { Text = _endpoint, Watermark = "Endpoint (stored only in this window)" }; var model = new TextBox { Text = _model, Watermark = "Model" }; var key = new TextBox { Text = _apiKey, Watermark = "API key", PasswordChar = '•' }; var theme = new ComboBox { ItemsSource = new[] { "glass", "none" }, SelectedItem = _theme }; var save = new Button { Content = "Use settings" };
        var providers = new WrapPanel(); foreach (var preset in new[] { ("OpenAI", "https://api.openai.com/v1/chat/completions"), ("Gemini", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"), ("Mistral", "https://api.mistral.ai/v1/chat/completions"), ("Groq", "https://api.groq.com/openai/v1/chat/completions"), ("OpenRouter", "https://openrouter.ai/api/v1/chat/completions"), ("Ollama", "http://localhost:11434/v1/chat/completions") }) { var button = new Button { Content = preset.Item1 }; button.Click += (_, _) => { endpoint.Text = preset.Item2; key.Text = ""; }; providers.Children.Add(button); }
        var dialog = new Window { Title = "Provider and appearance settings", Width = 460, Height = 380 }; save.Click += (_, _) => { _endpoint = endpoint.Text; _model = model.Text; _apiKey = key.Text; _theme = theme.SelectedItem as string ?? "glass"; _view.Options = ViewOptions(); if (_codePane.IsVisible) UpdateCode(); _status.Text = "Settings retained in memory"; dialog.Close(); }; dialog.Content = new StackPanel { Margin = new global::Avalonia.Thickness(16), Spacing = 10, Children = { new TextBlock { Text = "Provider presets clear any prior key; choose a model yourself." }, providers, endpoint, model, key, new TextBlock { Text = "Dialog theme" }, theme, save } }; if(_theme=="glass"){var content=dialog.Content as Control;dialog.Content=null;dialog.Content=new Border {BorderThickness=new Thickness(9),BorderBrush=new SolidColorBrush(Color.FromArgb(180,255,255,255)),Background=new SolidColorBrush(Color.Parse("#eef5fa")),CornerRadius=new CornerRadius(14),Child=content};var root=Content as Control;var previous=root?.Effect;if(root is not null)root.Effect=new BlurEffect {Radius=8};dialog.Closed+=(_,_)=>{if(root is not null)root.Effect=previous;};}dialog.WindowStartupLocation=WindowStartupLocation.CenterOwner;dialog.ShowDialog(this);
    }
    private Task<string?> PromptDocumentKindAsync(string fileName)
    {
        var choice = new ComboBox { ItemsSource = new[] { "affidavit", "order", "report" }, SelectedIndex = 0 };
        var add = new Button { Content = "Add document" }; var cancel = new Button { Content = "Cancel" };
        var dialog = new Window { Title = "Document type", Width = 380, Height = 220, WindowStartupLocation = WindowStartupLocation.CenterOwner };
        var completion = new TaskCompletionSource<string?>(); add.Click += (_, _) => { completion.TrySetResult(choice.SelectedItem as string); dialog.Close(); }; cancel.Click += (_, _) => { completion.TrySetResult(null); dialog.Close(); }; dialog.Closed += (_, _) => completion.TrySetResult(null);
        dialog.Content = new StackPanel { Margin = new Thickness(16), Spacing = 10, Children = { new TextBlock { Text = fileName, FontWeight = FontWeight.Bold, TextWrapping = TextWrapping.Wrap }, new TextBlock { Text = "Choose the document type before adding it to the queue." }, choice, new StackPanel { Orientation = Orientation.Horizontal, Spacing = 8, HorizontalAlignment = HorizontalAlignment.Right, Children = { cancel, add } } } };
        if (_theme == "glass") { var content = dialog.Content as Control; dialog.Content = new Border { BorderThickness = new Thickness(7), BorderBrush = new SolidColorBrush(Color.FromArgb(180, 255, 255, 255)), Background = new SolidColorBrush(Color.Parse("#eef5fa")), CornerRadius = new CornerRadius(14), Child = content }; var root = Content as Control; var previous = root?.Effect; if (root is not null) root.Effect = new BlurEffect { Radius = 8 }; dialog.Closed += (_, _) => { if (root is not null) root.Effect = previous; }; }
        _ = dialog.ShowDialog(this); return completion.Task;
    }
    private void ShowJsonEditor()
    {
        var editor = new TextBox { Text = global::Ocker.Ocker.ExportRecord(_record), AcceptsReturn = true, TextWrapping = TextWrapping.NoWrap, FontFamily = new FontFamily("Menlo"), MinHeight = 0 };
        var preview = new TextBlock { FontFamily = new FontFamily("Menlo"), TextWrapping = TextWrapping.Wrap };
        var error = new TextBlock { Foreground = Brushes.Firebrick, TextWrapping = TextWrapping.Wrap };
        var format = new Button { Content = "Format JSON" }; var apply = new Button { Content = "Apply" }; var cancel = new Button { Content = "Cancel" };
        var dialog = new Window { Title = "Edit OCKER file", Width = Math.Min(980, Math.Max(320, Bounds.Width - 40)), Height = Math.Min(760, Math.Max(400, Bounds.Height - 40)), WindowStartupLocation = WindowStartupLocation.CenterOwner, CanResize = true };
        void RefreshPreview() { preview.Inlines?.Clear(); foreach (var token in LexJson(editor.Text ?? "")) preview.Inlines?.Add(new Run(token.Text.Length > 512 ? token.Text[..480] + "… [" + token.Text.Length + " characters; full value in editor]" : token.Text) { Foreground = token.Color }); }
        editor.TextChanged += (_, _) => RefreshPreview(); RefreshPreview();
        format.Click += (_, _) => { try { using var json = System.Text.Json.JsonDocument.Parse(editor.Text ?? ""); editor.Text = System.Text.Json.JsonSerializer.Serialize(json.RootElement, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }); error.Text = ""; } catch (Exception ex) { error.Text = ex.Message; } };
        apply.Click += (_, _) => { try { var next = global::Ocker.Ocker.ParseRecord(editor.Text ?? ""); _record = next; _queue.Clear(); _view.Record = next; _status.Text = "OCKER record applied"; dialog.Close(); } catch (Exception ex) { error.Text = ex.Message; } };
        cancel.Click += (_, _) => dialog.Close();
        var narrow = Bounds.Width < 700;
        var split = new Grid { ColumnDefinitions = new ColumnDefinitions(narrow ? "*" : "*,*"), RowDefinitions = new RowDefinitions(narrow ? "*,*" : "*"), ColumnSpacing = 10, RowSpacing = 10 };
        var editPanel = new Grid { RowDefinitions = new RowDefinitions("Auto,*") };
        editPanel.Children.Add(new TextBlock { Text = "JSON editor", FontWeight = FontWeight.Bold });
        var editScroll = new ScrollViewer { Content = editor, HorizontalScrollBarVisibility = ScrollBarVisibility.Auto, VerticalScrollBarVisibility = ScrollBarVisibility.Auto }; Grid.SetRow(editScroll, 1); editPanel.Children.Add(editScroll);
        var previewPanel = new Grid { RowDefinitions = new RowDefinitions("Auto,*") };
        previewPanel.Children.Add(new TextBlock { Text = "Syntax preview · long values abbreviated", FontWeight = FontWeight.Bold });
        var previewScroll = new ScrollViewer { Content = preview, HorizontalScrollBarVisibility = ScrollBarVisibility.Auto, VerticalScrollBarVisibility = ScrollBarVisibility.Auto }; Grid.SetRow(previewScroll, 1); previewPanel.Children.Add(previewScroll);
        if (narrow) Grid.SetRow(previewPanel, 1); else Grid.SetColumn(previewPanel, 1); split.Children.Add(editPanel); split.Children.Add(previewPanel);
        dialog.Content = new DockPanel { Margin = new Thickness(14), Children = { new StackPanel { Orientation = Orientation.Horizontal, Spacing = 8, HorizontalAlignment = HorizontalAlignment.Right, Children = { format, cancel, apply } }, error, split } }; DockPanel.SetDock((Control)((DockPanel)dialog.Content).Children[0], Dock.Bottom); DockPanel.SetDock(error, Dock.Bottom);
        if (_theme == "glass") { var content = dialog.Content as Control; dialog.Content = new Border { BorderThickness = new Thickness(7), BorderBrush = new SolidColorBrush(Color.FromArgb(180, 255, 255, 255)), Background = new SolidColorBrush(Color.Parse("#eef5fa")), CornerRadius = new CornerRadius(14), Child = content }; var root = Content as Control; var previous = root?.Effect; if (root is not null) root.Effect = new BlurEffect { Radius = 8 }; dialog.Closed += (_, _) => { if (root is not null) root.Effect = previous; }; }
        _ = dialog.ShowDialog(this);
    }
    private static IEnumerable<(string Text, IBrush Color)> LexJson(string input)
    {
        for (var i = 0; i < input.Length;)
        {
            var start = i;
            if (char.IsWhiteSpace(input[i])) { while (i < input.Length && char.IsWhiteSpace(input[i])) i++; yield return (input[start..i], Brushes.DimGray); continue; }
            if ("{}[],:".Contains(input[i])) { i++; yield return (input[start..i], Brushes.DimGray); continue; }
            if (input[i] == '"')
            {
                i++; while (i < input.Length && input[i] != '"') i += input[i] == '\\' && i + 1 < input.Length ? 2 : 1;
                if (i < input.Length) i++;
                var lookahead = i; while (lookahead < input.Length && char.IsWhiteSpace(input[lookahead])) lookahead++;
                var key = lookahead < input.Length && input[lookahead] == ':';
                yield return (input[start..i], key ? Brushes.MediumVioletRed : Brushes.DarkOliveGreen); continue;
            }
            while (i < input.Length && !char.IsWhiteSpace(input[i]) && !"{}[],:".Contains(input[i])) i++;
            var value = input[start..i]; yield return (value, value is "true" or "false" ? Brushes.DarkOrange : value == "null" ? Brushes.SlateGray : Brushes.DarkCyan);
        }
    }
    private OckerOptions Options()
    {
        if (_endpoint is null || _model is null) throw new OckerException("Set endpoint and model in Settings first."); var uri = new Uri(_endpoint); var loopback = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) || uri.Host is "127.0.0.1" or "::1"; if (string.IsNullOrWhiteSpace(_apiKey) && !loopback) throw new OckerException("An API key is required unless the endpoint is loopback.");
        return new OckerOptions { CompletionAdapter = new OpenAiCompatibleAdapter(new HttpClient(), uri, _model, _apiKey ?? ""), OnProgress = p => _status.Text = p.Message, OnError = e => _status.Text = e.Message };
    }
    private ChronologyViewOptions ViewOptions() => new() { Theme = _theme, Mobile = Bounds.Width < 650, Animate = true, OnChange = r => { _record = r; _status.Text = "Edited"; }, OnError = e => _status.Text = e.Message };
    private void UpdateCode() => _code.Text = "using Ocker;\nusing Ocker.Avalonia;\n\nvar view = new ChronologyView\n{\n    Record = Ocker.Ocker.CreateRecord(\"My chronology\"),\n    Options = new ChronologyViewOptions\n    {\n        Theme = \"" + _theme + "\",\n        OnChange = record => SaveRecord(record)\n    }\n};\n\nawait using var pdf = File.OpenRead(pdfPath);\nvar intermediate = await Ocker.Ocker.ParsePdfAsync(pdf, documentId, title, \"affidavit\");\nvar llm = new OpenAiCompatibleAdapter(new HttpClient(), new Uri(endpoint), model, apiKey);\nvar options = new OckerOptions { CompletionAdapter = llm };\nvar events = await Ocker.Ocker.BuildChronologyAsync(intermediate, options);\nvar relationships = await Ocker.Ocker.FindRelationshipsAsync(events, options);\n";
    private async Task BuildChronologyAsync()
    { try { if (_queue.Count == 0) throw new OckerException("Add one or more documents first."); _operation = new CancellationTokenSource(); var options = Options(); var groups = new List<OckerEvent>(); foreach (var intermediate in _queue) groups.AddRange(await global::Ocker.Ocker.BuildChronologyAsync(intermediate, options, _operation.Token)); var relationships = await global::Ocker.Ocker.FindRelationshipsAsync(groups, options, _operation.Token); var documents = _queue.Select(x => x.Document).ToList(); var assets = _queue.Where(x => x.Asset is not null).Select(x => x.Asset!).ToList(); var next = _record with { Documents = documents, Assets = assets, Events = groups, Relationships = relationships.ToList(), Notes = [], Authorities = [], UpdatedAt = DateTimeOffset.UtcNow.ToString("O") }; global::Ocker.Ocker.ValidateRecord(next); _record = next; _queue.Clear(); _view.Record = next; _status.Text = "Chronology and relationships built"; } catch (OperationCanceledException) { _status.Text = "Cancelled; record unchanged"; } catch (Exception e) { _status.Text = e.Message; } finally { _operation?.Dispose(); _operation = null; } }
    private async Task FindRelationshipsAsync()
    { try { _operation = new CancellationTokenSource(); var relationships = await global::Ocker.Ocker.FindRelationshipsAsync(_record.Events, Options(), _operation.Token); var next = _record with { Relationships = relationships.ToList(), UpdatedAt = DateTimeOffset.UtcNow.ToString("O") }; global::Ocker.Ocker.ValidateRecord(next); _record = next; _view.Record = next; } catch (OperationCanceledException) { _status.Text = "Cancelled; record unchanged"; } catch (Exception e) { _status.Text = e.Message; } finally { _operation?.Dispose(); _operation = null; } }
    private async Task ExportVisualAsync()
    { var file = await StorageProvider.SaveFilePickerAsync(new FilePickerSaveOptions { Title = "Export chronology image", SuggestedFileName = "chronology.png", FileTypeChoices = [new("PNG image") { Patterns = ["*.png"] }, new("PDF document") { Patterns = ["*.pdf"] }] }); if (file is null) return; await using var stream = await file.OpenWriteAsync(); if (file.Name.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)) await ChronologyExport.SavePdfAsync(_view, stream); else await ChronologyExport.SavePngAsync(_view, stream); _status.Text = "Visual export saved"; }
}
