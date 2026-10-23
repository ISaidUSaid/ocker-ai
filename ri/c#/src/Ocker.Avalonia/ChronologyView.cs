// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Animation;
using Avalonia.Collections;
using Avalonia.Threading;
using Avalonia.Platform.Storage;
using Ocker;

namespace Ocker.Avalonia;

public sealed class ChronologyViewOptions
{
    public Action<OckerRecord>? OnChange { get; init; }
    public Action<OckerProgress>? OnProgress { get; init; }
    public Action<Exception>? OnError { get; init; }
    public Action<OckerEvent>? OnEventClick { get; init; }
    public Action<Source>? OnSourceClick { get; init; }
    public Action<Relationship>? OnRelationshipClick { get; init; }
    public bool ReadOnly { get; init; }
    public bool Animate { get; init; } = true;
    public string? AuthorId { get; init; }
    public string Theme { get; init; } = "glass";
    public ChronologyPalette? Palette { get; init; }
    public bool Mobile { get; init; }
}
public sealed class ChronologyPalette { public IBrush? CanvasBackground { get; init; } public IBrush? CardBackground { get; init; } public IBrush? EvidenceBackground { get; init; } }

/// <summary>Reusable native chronology editor. It owns view state; callers own persistence and credentials.</summary>
public sealed class ChronologyView : UserControl
{
    private readonly StackPanel _pads = new() { Spacing=8, HorizontalAlignment=HorizontalAlignment.Right, VerticalAlignment=VerticalAlignment.Bottom, Margin=new Thickness(18) };
    private string? _dragKind; private Note? _dragNote;
    private readonly StackPanel _cards = new() { Spacing = 12 };
    private readonly TextBox _search = new() { Watermark = "Search events" };
    private readonly ComboBox _documents=new() {ItemsSource=new[]{"All documents"},SelectedIndex=0,MaxWidth=240};
    private readonly ComboBox _status = new() { ItemsSource = new[] { "All", "alleged", "agreed", "disputed", "unresolved" }, SelectedIndex = 0, Width = 140 };
    private readonly TextBlock _zoomText = new();
    private OckerRecord? _record; private ChronologyViewOptions _options = new(); private double _zoom = 1;
    private readonly Dictionary<Border, string> _eventCards = new();
    public OckerRecord? Record { get => _record; set { _record = value;_documents.ItemsSource=new[]{"All documents"}.Concat(value?.Documents.Select(d=>d.Title)??[]).ToList();_documents.SelectedIndex=0;Render(); } }
    public ChronologyViewOptions Options { get => _options; set { _options = value ?? new(); if (_options.Theme is not ("glass" or "none")) throw new ArgumentOutOfRangeException(nameof(value)); Background = _options.Palette?.CanvasBackground; Render(); } }
    /// <summary>The filtered chronology board only; it deliberately excludes the toolbar and host settings.</summary>
    public Control ExportSurface => _cards;
    public Size GetExportExtent()
    {
        _cards.Measure(new Size(Math.Max(900, Bounds.Width), double.PositiveInfinity));
        return _cards.DesiredSize;
    }
    public ChronologyView()
    {
        var zoomOut = new Button { Content = "−" }; zoomOut.Click += (_, _) => SetZoom(_zoom - .1);
        var zoomIn = new Button { Content = "+" }; zoomIn.Click += (_, _) => SetZoom(_zoom + .1);
        _documents.SelectionChanged+=(_,_)=>Render();
        _search.TextChanged += (_, _) => Render(); _status.SelectionChanged += (_, _) => Render();
        var toolbar = new WrapPanel { VerticalAlignment = VerticalAlignment.Center, Children = { _search, _status, _documents, zoomOut, _zoomText, zoomIn } };
        var layout = new DockPanel { Margin = new Thickness(12), Children = { toolbar, new ScrollViewer { Content = _cards, HorizontalScrollBarVisibility = ScrollBarVisibility.Auto } } };
        DockPanel.SetDock(toolbar, Dock.Top);
        Content=new Grid { Children={layout,_pads} };
    }
    private void SetZoom(double zoom) { _zoom = Math.Clamp(zoom, .65, 1.8); Render(); }
    private void Render()
    {
        _pads.Children.Clear();
        if(!_options.Mobile && !_options.ReadOnly) { _pads.Children.Add(DragPad("Add precedent","authority",BrushFor("blue"))); _pads.Children.Add(DragPad("Add note","note",Brushes.LightGoldenrodYellow)); }
        _pads.IsVisible=!_options.Mobile && !_options.ReadOnly;
        _cards.Children.Clear(); _eventCards.Clear(); _zoomText.Text = $"{_zoom:P0}"; if (_record is null) return;
        _cards.Children.Add(new TextBlock {Text="OCKER · "+_record.Title,FontWeight=FontWeight.Bold,FontSize=20,Margin=new Thickness(12)});
        var term = _search.Text?.Trim() ?? ""; var state = _status.SelectedItem as string ?? "All";
        foreach (var evt in _record.Events.OrderBy(e=>e.Date.Value??"9999").Where(e => (state == "All" || e.Status == state) && (_documents.SelectedIndex<=0 || e.Sources.Any(s=>_record.Documents.Any(d=>d.Id==s.DocumentId&&d.Title==_documents.SelectedItem as string))) && ($"{e.Title} {e.Summary} {e.Narrative}".Contains(term, StringComparison.OrdinalIgnoreCase)))) _cards.Children.Add(BuildCard(evt));
    }
    private Control BuildCard(OckerEvent evt,bool inWeb=false)
    {
        var body = new StackPanel { Spacing = 6, Margin = new Thickness(14 * _zoom) };
        body.SetValue(global::Avalonia.Controls.Documents.TextElement.FontSizeProperty,14*_zoom);
        var title = new Button { Content = evt.Title, FontWeight = FontWeight.Bold, HorizontalAlignment = HorizontalAlignment.Left, Padding = new Thickness(0), Background = Brushes.Transparent,Foreground=Brushes.DarkSlateGray };
        title.Click += (_, _) => { _options.OnEventClick?.Invoke(evt); ShowRelated(evt); };
        body.Children.Add(title);if(!string.IsNullOrWhiteSpace(evt.AssertedBy))body.Children.Add(new TextBlock {Text="Account by "+evt.AssertedBy,Foreground=Brushes.DimGray}); body.Children.Add(new TextBlock { Text = DateLabel(evt.Date), Foreground = Brushes.DimGray }); body.Children.Add(new TextBlock { Text = evt.Summary, TextWrapping = TextWrapping.Wrap, MaxWidth = 760 * _zoom });
        var sources = new WrapPanel(); foreach (var source in evt.Sources) { var button = new Button { Content = $"Evidence p.{source.Page?.ToString() ?? "?"}", Background = _options.Palette?.EvidenceBackground??Brushes.Teal }; button.Click += (_, _) => { _options.OnSourceClick?.Invoke(source); ShowSource(source); }; sources.Children.Add(button); } body.Children.Add(sources);
        if (!_options.ReadOnly && _options.Mobile) { var note = new Button { Content = "Add note" }; note.Click += (_, _) => AddNote(evt); var precedent = new Button { Content = "Add precedent" }; precedent.Click += (_, _) => AddAuthority(evt); body.Children.Add(new StackPanel { Orientation = Orientation.Horizontal, Spacing = 6, Children = { note, precedent } }); }
        var canvas = new Canvas { IsHitTestVisible = true, ClipToBounds = false }; if(!_options.Mobile) foreach (var note in _record!.Notes.Where(n => n.EventId == evt.Id)) canvas.Children.Add(NotePin(note));
        else { var notes=_record!.Notes.Where(n=>n.EventId==evt.Id).ToList();if(notes.Count>0){ var marker=new Button {Content=$"▱ {notes.Count} notes"};marker.Click+=(_,_)=>ShowNotes(evt);body.Children.Add(marker); } }
        var overlay = new Grid { ClipToBounds = false, Children = { body, canvas } };
        var card = new Border { BorderBrush = Brushes.LightGray, Background = _options.Palette?.CardBackground??Brushes.White, BorderThickness = new Thickness(1), CornerRadius = new CornerRadius(8), Child = overlay, Margin = new Thickness(10 * _zoom, 2, 10 * _zoom, 2) };
        DragDrop.SetAllowDrop(card,true);
        card.AddHandler(DragDrop.DragOverEvent,(_,e)=>{e.DragEffects=_dragKind is null||!new Rect(card.Bounds.Size).Contains(e.GetPosition(card))?DragDropEffects.None:DragDropEffects.Copy;e.Handled=true;});
        card.AddHandler(DragDrop.DropEvent,(_,e)=>{if(_dragKind is null||_options.ReadOnly)return;var point=e.GetPosition(card);if(!new Rect(card.Bounds.Size).Contains(point))return;var position=new PinPosition(point.X/_zoom,point.Y/_zoom);
          if(_dragNote is not null)Change(global::Ocker.Ocker.EditNote(_record!,_dragNote with {EventId=evt.Id,Position=position}));
          else if(_dragKind=="authority")AddAuthority(evt);else ShowEditor("New note","",body=>Change(global::Ocker.Ocker.AddNote(_record!,evt.Id,body,position,_options.AuthorId)));e.Handled=true;});
        if (_options.Animate) { card.Opacity = 0; card.Transitions = new Transitions { new DoubleTransition { Property = Visual.OpacityProperty, Duration = TimeSpan.FromMilliseconds(180) } }; Dispatcher.UIThread.Post(() => card.Opacity = 1, DispatcherPriority.Background); }
        var flags = new StackPanel { Spacing = 3, VerticalAlignment = VerticalAlignment.Center };
        foreach (var authority in _record.Authorities.Where(a => a.EventId == evt.Id)) flags.Children.Add(AuthorityRow(authority));
        var left=_record.Events.IndexOf(evt)%2==0;flags.Width=130;flags.HorizontalAlignment=left?HorizontalAlignment.Left:HorizontalAlignment.Right;flags.Margin=new Thickness(left?-130:0,10,left?0:-130,0);
        var row=new Grid {Margin=(_options.Mobile||inWeb)?new Thickness(8):new Thickness(145,12,145,12),Children={card,flags}};
        var placedNotes=_record.Notes.Where(n=>n.EventId==evt.Id).ToList();if(!_options.Mobile&&placedNotes.Count>0)card.MinHeight=Math.Max(150,placedNotes.Max(n=>(n.Position.Y-14+NoteHeight(n))*_zoom+20));
        _eventCards[card]=evt.Id;return row;
    }
    private Control AuthorityRow(Authority authority) {
        var flag=new Button {Content=new TextBlock {Text=authority.Citation,TextTrimming=TextTrimming.CharacterEllipsis,MaxWidth=115},Background=BrushFor(authority.Color),Foreground=Brushes.DarkSlateGray};
        ToolTip.SetTip(flag,authority.Title);flag.Click+=(_,_)=>{if(_options.ReadOnly)ShowText(authority.Title,authority.Citation+"\n"+authority.Body);else EditAuthority(authority);};
        if(!_options.ReadOnly){var delete=new MenuItem {Header="Delete precedent"};delete.Click+=(_,_)=>Change(global::Ocker.Ocker.DeleteAuthority(_record!,authority.Id));flag.ContextMenu=new ContextMenu {ItemsSource=new[]{delete}};}return flag;
    }
    private void ShowNotes(OckerEvent evt) {
        var dialog=CreateDialog("Notes",520,420);var list=new StackPanel {Spacing=12};
        foreach(var note in _record!.Notes.Where(n=>n.EventId==evt.Id)){list.Children.Add(new TextBlock {Text=note.Body,TextWrapping=TextWrapping.Wrap});if(!_options.ReadOnly){var edit=new Button {Content="Edit note"};edit.Click+=(_,_)=>{dialog.Close();ShowEditor("Edit note",note.Body,body=>Change(global::Ocker.Ocker.EditNote(_record!,note with {Body=body})));};var remove=new Button {Content="Delete note"};remove.Click+=(_,_)=>{Change(global::Ocker.Ocker.DeleteNote(_record!,note.Id));dialog.Close();};list.Children.Add(new WrapPanel {Children={edit,remove}});}}
        var close=new Button {Content="Close"};close.Click+=(_,_)=>dialog.Close();var layout=new DockPanel {Margin=new Thickness(18),Children={close,new ScrollViewer {Content=list}}};DockPanel.SetDock(close,Dock.Bottom);dialog.Content=layout;ShowModal(dialog);
    }
    private Button DragPad(string label,string kind,IBrush background) {
        var pad=new Button {Content=label,Background=background,Foreground=Brushes.DarkSlateGray,Width=130,Height=kind=="note"?84:38};
        pad.PointerPressed+=async(_,e)=>{if(!e.GetCurrentPoint(pad).Properties.IsLeftButtonPressed)return;await BeginDrag(e,kind,null);};
        ToolTip.SetTip(pad,"Drag onto an event card");return pad;
    }
    private async Task BeginDrag(PointerPressedEventArgs e,string kind,Note? note) {
        _dragKind=kind;_dragNote=note;
        try {var data=new DataObject();data.Set("ocker-annotation",kind);await DragDrop.DoDragDrop(e,data,DragDropEffects.Copy);}
        finally {_dragKind=null;_dragNote=null;}
    }
    private static double NoteHeight(Note note)=>Math.Max(160,64+Math.Ceiling(note.Body.Length/26d)*19);
    private Control NotePin(Note note)
    {
        var text=new TextBlock {Text=note.Body,FontSize=14*_zoom,TextWrapping=TextWrapping.Wrap,Margin=new Thickness(18,36,18,20)};
        var paper=new Border {Width=240*_zoom,Height=NoteHeight(note)*_zoom,CornerRadius=new CornerRadius(3,3,22,3),Background=Brushes.LightGoldenrodYellow,Child=new Grid()};
        var grid=(Grid)paper.Child!;grid.Children.Add(text);
        var pin=new Button {Content="●",Foreground=Brushes.Firebrick,Background=Brushes.Transparent,Width=28,Height=28,HorizontalAlignment=HorizontalAlignment.Center,VerticalAlignment=VerticalAlignment.Top,Padding=new Thickness(0)};
        grid.Children.Add(pin);Canvas.SetLeft(paper,(note.Position.X-120)*_zoom);Canvas.SetTop(paper,(note.Position.Y-14)*_zoom);
        if(!_options.ReadOnly){pin.PointerPressed+=async(_,e)=>{if(e.GetCurrentPoint(pin).Properties.IsLeftButtonPressed)await BeginDrag(e,"note",note);};
          var edit=new Button {Content="✎",HorizontalAlignment=HorizontalAlignment.Left,VerticalAlignment=VerticalAlignment.Top,Margin=new Thickness(22,3)};
          edit.Click+=(_,_)=>ShowEditor("Edit note",note.Body,body=>Change(global::Ocker.Ocker.EditNote(_record!,note with {Body=body})));grid.Children.Add(edit);
          var remove=new Button {Content="×",HorizontalAlignment=HorizontalAlignment.Right,VerticalAlignment=VerticalAlignment.Top,Margin=new Thickness(22,3)};
          remove.Click+=(_,_)=>Change(global::Ocker.Ocker.DeleteNote(_record!,note.Id));grid.Children.Add(remove);}
        return paper;
    }
    private MenuItem DeleteMenu(Note note) { var item = new MenuItem { Header = "Delete note" }; item.Click += (_, _) => Change(global::Ocker.Ocker.DeleteNote(_record!, note.Id)); return item; }
    private void AddNote(OckerEvent evt) => ShowEditor("New note", "", body => Change(global::Ocker.Ocker.AddNote(_record!, evt.Id, body, new(8, 8), _options.AuthorId)));
    private void ShowSource(Source source) {
        var document=_record!.Documents.FirstOrDefault(d=>d.Id==source.DocumentId);var assetId=source.AssetId??document?.AssetId;var asset=_record.Assets.FirstOrDefault(a=>a.Id==assetId);
        var window=CreateDialog("Evidence source",620,440);var close=new Button {Content="Close"};close.Click+=(_,_)=>window.Close();var actions=new WrapPanel {Children={close}};
        if(asset?.Data is not null){var save=new Button {Content=asset.DerivedFrom is null?"Save original evidence":"Save derived asset"};save.Click+=async(_,_)=>{var file=await window.StorageProvider.SaveFilePickerAsync(new FilePickerSaveOptions {Title="Save evidence asset",SuggestedFileName=asset.Name});if(file is not null){await using var stream=await file.OpenWriteAsync();await stream.WriteAsync(Convert.FromBase64String(asset.Data));}};actions.Children.Add(save);}
        var text=$"{document?.Title ?? source.DocumentId} · paragraph {source.ParagraphId ?? "—"}\nSHA-256: {asset?.Sha256 ?? "—"}\n\n{source.Quote ?? "No retained excerpt."}";
        var layout=new DockPanel {Margin=new Thickness(18),Children={actions,new ScrollViewer {Content=new TextBlock {Text=text,TextWrapping=TextWrapping.Wrap}}}};DockPanel.SetDock(actions,Dock.Bottom);window.Content=layout;ShowModal(window);
    }
    private void AddAuthority(OckerEvent evt) => AuthorityForm(evt.Id, null);
    private void EditAuthority(Authority a) => AuthorityForm(a.EventId, a);
    private void AuthorityForm(string eventId, Authority? current)
    { var title = new TextBox { Text = current?.Title, Watermark = "Title" }; var citation = new TextBox { Text = current?.Citation, Watermark = "Citation" }; var type = new ComboBox { ItemsSource = new[] { "binding", "persuasive", "unspecified" }, SelectedItem = current?.Type ?? "unspecified" }; var color = new ComboBox { ItemsSource = new[] { "blue", "lavender", "mint", "peach", "slate" }, SelectedItem = current?.Color ?? "slate" }; var pinpoint = new TextBox { Text = current?.Pinpoint, Watermark = "Pinpoint" }; var court = new TextBox { Text = current?.Court, Watermark = "Court" }; var jurisdiction = new TextBox { Text = current?.Jurisdiction, Watermark = "Jurisdiction" }; var url = new TextBox { Text = current?.SourceUrl, Watermark = "Source URL" }; var body = new TextBox { Text = current?.Body, Watermark = "Application", AcceptsReturn = true, MinHeight = 60 }; var dialog = CreateDialog(current is null ? "New precedent" : "Edit precedent", 520, 600); var save = new Button { Content = "Save" }; save.Click += (_, _) => { if (string.IsNullOrWhiteSpace(title.Text) || string.IsNullOrWhiteSpace(citation.Text)) return; var now = DateTimeOffset.UtcNow.ToString("O"); var value = new Authority(current?.Id ?? Guid.NewGuid().ToString("N"), eventId, title.Text, citation.Text, type.SelectedItem as string ?? "unspecified", color.SelectedItem as string ?? "slate", current?.CreatedAt ?? now, now, pinpoint.Text, court.Text, jurisdiction.Text, url.Text, body.Text, _options.AuthorId); Change(current is null ? global::Ocker.Ocker.AddAuthority(_record!, value) : global::Ocker.Ocker.EditAuthority(_record!, value)); dialog.Close(); }; dialog.Content = new ScrollViewer { Content = new StackPanel { Margin = new Thickness(16), Spacing = 7, Children = { title, citation, type, color, pinpoint, court, jurisdiction, url, body, save } } }; ShowModal(dialog); }
    private void Change(OckerRecord next) { try {global::Ocker.Ocker.ValidateRecord(next); _record=next; _options.OnChange?.Invoke(next);Render();}catch(Exception error){_options.OnError?.Invoke(error);} }
    private void ShowRelated(OckerEvent evt) {
        var links=_record!.Relationships.Where(r=>r.From==evt.Id||r.To==evt.Id).ToList();
        var ids=links.SelectMany(r=>new[]{r.From,r.To}).Append(evt.Id).ToHashSet();var events=_record.Events.Where(e=>ids.Contains(e.Id)).ToList();
        var graph=new Canvas {Width=940,Height=Math.Max(500,events.Count*220),Background=Brushes.Transparent};var points=new Dictionary<string,Point>();
        for(int i=0;i<events.Count;i++)points[events[i].Id]=new Point(i%2==0?20:500,i/2*340+30);
        foreach(var edge in links){var a=points[edge.From]+new Vector(210,110);var b=points[edge.To]+new Vector(210,110);var line=new global::Avalonia.Controls.Shapes.Line {StartPoint=a,EndPoint=b,Stroke=edge.Type=="supports"?Brushes.Teal:Brushes.IndianRed,StrokeThickness=2};if(edge.Type=="contradicts")line.StrokeDashArray=new AvaloniaList<double>(new[]{6d,4d});ToolTip.SetTip(line,edge.Rationale);graph.Children.Add(line);}
        foreach(var item in events){var node=BuildCard(item,true);node.Width=410;Canvas.SetLeft(node,points[item.Id].X);Canvas.SetTop(node,points[item.Id].Y);graph.Children.Add(node);}
        var web=CreateDialog("Related event web",1000,720);var close=new Button {Content="Close",HorizontalAlignment=HorizontalAlignment.Right};close.Click+=(_,_)=>web.Close();
        var pads=new StackPanel {Orientation=Orientation.Horizontal,Children={close}};if(!_options.Mobile&&!_options.ReadOnly){pads.Children.Add(DragPad("Add note","note",Brushes.LightGoldenrodYellow));pads.Children.Add(DragPad("Add precedent","authority",BrushFor("blue")));}
        var layout=new DockPanel {Margin=new Thickness(12),Children={pads,new ScrollViewer {Content=graph,HorizontalScrollBarVisibility=ScrollBarVisibility.Auto}}};DockPanel.SetDock(pads,Dock.Bottom);web.Content=layout;ShowModal(web);
    }
    private void ShowText(string title,string text) {var window=CreateDialog(title,560,380);var close=new Button {Content="Close"};close.Click+=(_,_)=>window.Close();var layout=new DockPanel {Margin=new Thickness(16),Children={close,new ScrollViewer {Content=new TextBlock {Text=text,TextWrapping=TextWrapping.Wrap}}}};DockPanel.SetDock(close,Dock.Bottom);window.Content=layout;ShowModal(window);}
    private void ShowEditor(string title, string initial, Action<string> save) { var text = new TextBox { Text = initial, AcceptsReturn = true, MinHeight = 120 }; var window = CreateDialog(title, 460, 260); var button = new Button { Content = "Save", HorizontalAlignment = HorizontalAlignment.Right }; button.Click += (_, _) => { if (!string.IsNullOrWhiteSpace(text.Text)) save(text.Text); window.Close(); }; window.Content = new StackPanel { Margin = new Thickness(16), Spacing = 10, Children = { text, button } }; ShowModal(window); }
    private void ShowModal(Window dialog) {
        var content=dialog.Content as Control;dialog.Content=null;
        dialog.Content=new Border {BorderThickness=new Thickness(_options.Theme=="glass"?9:1),BorderBrush=_options.Theme=="glass"?new SolidColorBrush(Color.FromArgb(160,255,255,255)):Brushes.LightGray,CornerRadius=new CornerRadius(14),Child=content};
        if(TopLevel.GetTopLevel(this) is Window owner){var root=owner.Content as Control;var previous=root?.Effect;if(_options.Theme=="glass"&&root is not null)root.Effect=new BlurEffect {Radius=8};dialog.Closed+=(_,_)=>{if(root is not null)root.Effect=previous;};_ = dialog.ShowDialog(owner);}else dialog.Show();
    }
    private Window CreateDialog(string title,double width,double height) {
        var owner=TopLevel.GetTopLevel(this) as Window;var dialog=new Window {Title=title,Width=Math.Min(width,Math.Max(300,(owner?.Bounds.Width??1200)-36)),Height=Math.Min(height,Math.Max(220,(owner?.Bounds.Height??800)-36)),WindowStartupLocation=WindowStartupLocation.CenterOwner};
        if(_options.Theme=="glass"){dialog.TransparencyLevelHint=[WindowTransparencyLevel.AcrylicBlur];dialog.Background=new SolidColorBrush(Color.FromArgb(235,245,248,255));}else dialog.Background=Brushes.White;return dialog;
    }
    private static string DateLabel(DateValue date) => date.Value is null ? "Date unknown" : date.Precision == "range" ? $"{date.Value} – {date.End}" : date.Value;
    private static IBrush BrushFor(string color)=>new SolidColorBrush(Color.Parse(color switch {"blue"=>"#b7d9e8","lavender"=>"#d6c9e5","mint"=>"#c3dfcf","peach"=>"#ecd0bb",_=>"#c5d1d7"}));
}
