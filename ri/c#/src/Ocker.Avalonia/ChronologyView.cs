// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Animation;
using Avalonia.Collections;
using Avalonia.Threading;
using Avalonia.VisualTree;
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
    private readonly Canvas _dragLayer = new() { IsHitTestVisible = false, ClipToBounds = true };
    private DragContext? _mainDragContext; private DragContext? _activeDragContext; private Border? _dragGhost;
    private sealed class DragContext { public DragContext(Control root, Canvas layer, Dictionary<Border,string> targets) { Root=root; Layer=layer; Targets=targets; } public Control Root { get; } public Canvas Layer { get; } public Dictionary<Border,string> Targets { get; } public Action? Refresh { get; set; } }
    private readonly StackPanel _cards = new() { Spacing = 0, MaxWidth = 1240, HorizontalAlignment = HorizontalAlignment.Center };
    private readonly ScrollViewer _boardScroll = new() { HorizontalScrollBarVisibility = ScrollBarVisibility.Auto };
    private int _visibleIndex;
    private readonly TextBox _search = new() { Watermark = "Search events" };
    private readonly ComboBox _documents=new() {ItemsSource=new[]{"All documents"},SelectedIndex=0,MaxWidth=240};
    private readonly ComboBox _status = new() { ItemsSource = new[] { "All", "alleged", "agreed", "disputed", "unresolved" }, SelectedIndex = 0, Width = 140 };
    private readonly TextBlock _zoomText = new();
    private OckerRecord? _record; private ChronologyViewOptions _options = new(); private double _zoom = 1;
    private readonly Dictionary<Border, string> _eventCards = new();
    public OckerRecord? Record { get => _record; set { _record = value;_documents.ItemsSource=new[]{"All documents"}.Concat(value?.Documents.Select(d=>d.Title)??[]).ToList();_documents.SelectedIndex=0;Render(); } }
    public ChronologyViewOptions Options { get => _options; set { _options = value ?? new(); if (_options.Theme is not ("glass" or "none")) throw new ArgumentOutOfRangeException(nameof(value)); Background = _options.Palette?.CanvasBackground ?? new SolidColorBrush(Color.Parse("#f4f7f9")); Render(); } }
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
        StyleToolbarButton(zoomOut); StyleToolbarButton(zoomIn);
        _search.Width = 210; _search.Background = Brushes.White; _search.BorderBrush = new SolidColorBrush(Color.Parse("#d6e1e7"));
        var toolbar = new WrapPanel { VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(10, 4, 10, 14), Children = { _search, _status, _documents, zoomOut, _zoomText, zoomIn } };
         _boardScroll.Content = _cards; var layout = new DockPanel { Margin = new Thickness(20), Children = { toolbar, _boardScroll } };
        DockPanel.SetDock(toolbar, Dock.Top);
        var root = new Grid { Children = { layout, _pads, _dragLayer } };
        _mainDragContext = AttachDragContext(root, _dragLayer, _eventCards);
        Content = root;
    }
    private void SetZoom(double zoom) { _zoom = Math.Clamp(zoom, .65, 1.8); Render(); }
    private void Render()
    {
        _visibleIndex = 0;
        _cards.Width = _options.Mobile ? Math.Max(0, Bounds.Width - 40) : double.NaN; _cards.HorizontalAlignment = _options.Mobile ? HorizontalAlignment.Stretch : HorizontalAlignment.Center; _boardScroll.HorizontalScrollBarVisibility = _options.Mobile ? ScrollBarVisibility.Disabled : ScrollBarVisibility.Auto;
        _pads.Children.Clear();
        if(!_options.Mobile && !_options.ReadOnly) { _pads.Children.Add(DragPad("Add precedent","authority",BrushFor("blue"))); _pads.Children.Add(DragPad("Add note","note",Brushes.LightGoldenrodYellow)); }
        _pads.IsVisible=!_options.Mobile && !_options.ReadOnly;
        _cards.Children.Clear(); _eventCards.Clear(); _zoomText.Text = $"{_zoom:P0}"; if (_record is null) return;
        _cards.Children.Add(new StackPanel { Margin = new Thickness(12, 4, 12, 22), Spacing = 5, Children = { new TextBlock { Text="OCKER · OPEN CHRONOLOGY, KNOWLEDGE AND EVIDENCE RECORD", FontSize=11, LetterSpacing=1.4, Foreground=new SolidColorBrush(Color.Parse("#617985")) }, new TextBlock {Text=_record.Title,FontWeight=FontWeight.SemiBold,FontFamily=FontFamily.Parse("Georgia"),FontSize=30,Foreground=new SolidColorBrush(Color.Parse("#194d61")),TextWrapping=TextWrapping.Wrap, MaxWidth=_options.Mobile ? Math.Max(0, Bounds.Width-40) : 1180} } });
        var term = _search.Text?.Trim() ?? ""; var state = _status.SelectedItem as string ?? "All";
        var visible = _record.Events.OrderBy(e=>e.Date.Value??"9999").Where(e => (state == "All" || e.Status == state) && (_documents.SelectedIndex<=0 || e.Sources.Any(s=>_record.Documents.Any(d=>d.Id==s.DocumentId&&d.Title==_documents.SelectedItem as string))) && ($"{e.Title} {e.Summary} {e.Narrative}".Contains(term, StringComparison.OrdinalIgnoreCase))).ToList();
        if (_options.Mobile) foreach (var evt in visible) { _cards.Children.Add(BuildCard(evt)); _visibleIndex++; }
        else for (var i = 0; i < visible.Count; i += 2) { _cards.Children.Add(BuildTimelinePair(visible[i], i + 1 < visible.Count ? visible[i + 1] : null)); _visibleIndex += i + 1 < visible.Count ? 2 : 1; }
    }
    private Control BuildCard(OckerEvent evt,bool inWeb=false, bool related=false, DragContext? dragContext=null)
    {
        var body = new StackPanel { Spacing = 6, Margin = new Thickness(14 * _zoom) };
        body.SetValue(global::Avalonia.Controls.Documents.TextElement.FontSizeProperty,14*_zoom);
        var title = new Button { Content = new TextBlock { Text = evt.Title, TextWrapping = TextWrapping.Wrap, FontFamily = FontFamily.Parse("Georgia"), FontSize = 18*_zoom, FontWeight = FontWeight.Normal, Foreground = new SolidColorBrush(Color.Parse("#194d61")) }, FontWeight = FontWeight.Normal, HorizontalAlignment = HorizontalAlignment.Stretch, HorizontalContentAlignment = HorizontalAlignment.Stretch, Padding = new Thickness(0), Background = Brushes.Transparent,Foreground=new SolidColorBrush(Color.Parse("#194d61")) };
        title.Click += (_, _) => { _options.OnEventClick?.Invoke(evt); ShowRelated(evt); };
        body.Children.Add(new TextBlock { Text = DateLabel(evt.Date), Foreground = new SolidColorBrush(Color.Parse("#617985")), FontSize = 11*_zoom, FontWeight = FontWeight.SemiBold });
        body.Children.Add(title);
        if(!string.IsNullOrWhiteSpace(evt.AssertedBy)) body.Children.Add(new TextBlock {Text="Account by "+evt.AssertedBy,Foreground=new SolidColorBrush(Color.Parse("#617985"))});
        body.Children.Add(new TextBlock { Text = (evt.Status ?? "unresolved") == "agreed" ? "COMMON GROUND" : (evt.Status ?? "unresolved").ToUpperInvariant(), FontSize = 10*_zoom, FontWeight = FontWeight.SemiBold, LetterSpacing = 1, Foreground = StatusForeground(evt.Status ?? "unresolved"), Background = StatusPillBackground(evt.Status ?? "unresolved"), Padding = new Thickness(7, 3), HorizontalAlignment = HorizontalAlignment.Left });
        body.Children.Add(new TextBlock { Text = evt.Summary, TextWrapping = TextWrapping.Wrap, MaxWidth = 760 * _zoom });
        var sources = new WrapPanel();
        if (evt.Sources.Count > 0) { var button = new Button { Content = evt.Sources.Count == 1 ? "Source evidence" : $"Source evidence ({evt.Sources.Count})", Background = new SolidColorBrush(Color.Parse("#194d61")), Foreground = Brushes.White, Padding = new Thickness(9,5) }; button.Click += (_, _) => ShowSources(evt.Sources); sources.Children.Add(button); }
        var linkCount = _record!.Relationships.Count(r => r.From == evt.Id || r.To == evt.Id);
        if (linkCount > 0) { var relatedAction = new Button { Content = $"Related ({linkCount})", Background = Brushes.Transparent, Foreground = new SolidColorBrush(Color.Parse("#194d61")), BorderBrush = new SolidColorBrush(Color.Parse("#b9ccd5")), Padding = new Thickness(9,5), Margin = new Thickness(7,0,0,0) }; relatedAction.Click += (_,_) => ShowRelated(evt); sources.Children.Add(relatedAction); }
        body.Children.Add(sources);
        if (!_options.ReadOnly && _options.Mobile) { var note = new Button { Content = "Add note" }; note.Click += (_, _) => AddNote(evt); var precedent = new Button { Content = "Add precedent" }; precedent.Click += (_, _) => AddAuthority(evt); body.Children.Add(new StackPanel { Orientation = Orientation.Horizontal, Spacing = 6, Children = { note, precedent } }); }
        var canvas = new Canvas { IsHitTestVisible = true, ClipToBounds = false }; if(!_options.Mobile) foreach (var note in _record!.Notes.Where(n => n.EventId == evt.Id)) canvas.Children.Add(NotePin(note, dragContext));
        else { var notes=_record!.Notes.Where(n=>n.EventId==evt.Id).ToList();if(notes.Count>0){ var marker=new Button {Content=$"▱ {notes.Count} notes"};marker.Click+=(_,_)=>ShowNotes(evt);body.Children.Add(marker); } }
        var overlay = new Grid { ClipToBounds = false, Children = { body, canvas } };
        // The glass rim is layered over the unchanged card surface. It never consumes layout,
        // so hit testing and persisted note coordinates remain relative to the same outer card.
        var cardVisual = new Grid { ClipToBounds = false, Children = { overlay } };
        if (_options.Theme == "glass")
        {
            cardVisual.Children.Insert(0,new Border
            {
                IsHitTestVisible = false, CornerRadius = new CornerRadius(15), BorderThickness = new Thickness(9),
                BorderBrush = new LinearGradientBrush { StartPoint = new RelativePoint(0,0,RelativeUnit.Relative), EndPoint = new RelativePoint(1,1,RelativeUnit.Relative), GradientStops = { new GradientStop(Color.FromArgb(205,255,255,255),0), new GradientStop(Color.FromArgb(115,212,228,235),.55), new GradientStop(Color.FromArgb(175,255,255,255),1) } },
                BoxShadow = new BoxShadows(new BoxShadow { Blur = 10, Spread = 1, Color = Color.FromArgb(40,255,255,255) })
            });
        }
        var card = new Border { MaxWidth = _options.Mobile ? double.PositiveInfinity : 390, HorizontalAlignment = HorizontalAlignment.Stretch, VerticalAlignment = VerticalAlignment.Top, BorderBrush = new SolidColorBrush(Color.Parse("#d6e1e7")), Background = _options.Palette?.CardBackground ?? Brushes.White, BorderThickness = new Thickness(1), CornerRadius = new CornerRadius(15), BoxShadow = new BoxShadows(new BoxShadow { Blur = 12, OffsetY = 3, Color = Color.FromArgb(22, 25, 77, 97) }), Child = cardVisual, Margin = new Thickness(0), Padding = new Thickness(2) };
        DragDrop.SetAllowDrop(card,true);
        card.AddHandler(DragDrop.DragOverEvent,(_,e)=>{e.DragEffects=_dragKind is null||!new Rect(card.Bounds.Size).Contains(e.GetPosition(card))?DragDropEffects.None:DragDropEffects.Copy;e.Handled=true;});
        card.AddHandler(DragDrop.DropEvent,(_,e)=>{if(_dragKind is null||_options.ReadOnly)return;var point=e.GetPosition(card);if(!new Rect(card.Bounds.Size).Contains(point))return;var position=new PinPosition(point.X/_zoom,point.Y/_zoom);
          if(_dragNote is not null)Change(global::Ocker.Ocker.EditNote(_record!,_dragNote with {EventId=evt.Id,Position=position}));
          else if(_dragKind=="authority")AddAuthority(evt);else ShowEditor("New note","",body=>Change(global::Ocker.Ocker.AddNote(_record!,evt.Id,body,position,_options.AuthorId)));e.Handled=true;});
        if (_options.Animate) { card.Opacity = 0; card.Transitions = new Transitions { new DoubleTransition { Property = Visual.OpacityProperty, Duration = TimeSpan.FromMilliseconds(180) } }; Dispatcher.UIThread.Post(() => card.Opacity = 1, DispatcherPriority.Background); }
        var flags = new StackPanel { Spacing = 4, VerticalAlignment = VerticalAlignment.Center, Width = 118 };
        foreach (var authority in _record.Authorities.Where(a => a.EventId == evt.Id)) flags.Children.Add(AuthorityRow(authority));
        var left = _visibleIndex % 2 == 0;
        var placedNotes=_record.Notes.Where(n=>n.EventId==evt.Id).ToList();
        // Notes are overlay annotations: their saved coordinates must not stretch the event card.
        (dragContext?.Targets ?? _eventCards)[card]=evt.Id;
        if (_options.Mobile || inWeb) {
            var compact = new Grid { Margin = new Thickness(8, 10), Children = { card } };
            if (flags.Children.Count > 0) { flags.HorizontalAlignment = HorizontalAlignment.Right; flags.VerticalAlignment = VerticalAlignment.Top; flags.Margin = new Thickness(0, 14, -8, 0); compact.Children.Add(flags); }
            return compact;
        }
        var boardWidth = Math.Clamp(Bounds.Width > 0 ? Bounds.Width - 44 : 1000, 800, 1180);
        var row = new Grid { Width = boardWidth, HorizontalAlignment = HorizontalAlignment.Center, Margin = new Thickness(0, 10), ColumnDefinitions = new ColumnDefinitions("*,80,*"), MinHeight = 176 };
        Grid.SetColumn(card, left ? 0 : 2); row.Children.Add(card);
        if (flags.Children.Count > 0) { flags.HorizontalAlignment = left ? HorizontalAlignment.Left : HorizontalAlignment.Right; flags.Margin = left ? new Thickness(-116, 10, 0, 0) : new Thickness(0, 10, -116, 0); Grid.SetColumn(flags, left ? 0 : 2); row.Children.Add(flags); }
        return row;
    }
    private Control BuildTimelinePair(OckerEvent left, OckerEvent? right)
    {
        var boardWidth = Math.Clamp(Bounds.Width > 0 ? Bounds.Width - 44 : 1000, 800, 1180);
        var row = new Grid { Width = boardWidth, HorizontalAlignment = HorizontalAlignment.Center, Margin = new Thickness(0, 0, 0, 22), ColumnDefinitions = new ColumnDefinitions("*,80,*"), MinHeight = 260 };
        var leftCard = BuildCard(left, true); leftCard.HorizontalAlignment = HorizontalAlignment.Right; leftCard.VerticalAlignment = VerticalAlignment.Top; Grid.SetColumn(leftCard, 0); row.Children.Add(leftCard);
        Control? rightCard = null;
        if (right is not null) { var old = _visibleIndex; _visibleIndex = old + 1; rightCard = BuildCard(right, true); _visibleIndex = old; rightCard.Margin = new Thickness(0, 80, 0, 0); rightCard.HorizontalAlignment = HorizontalAlignment.Left; rightCard.VerticalAlignment = VerticalAlignment.Top; Grid.SetColumn(rightCard, 2); row.Children.Add(rightCard); }
        var spine = new Canvas { ClipToBounds = false, IsHitTestVisible = false };
        spine.Children.Add(new global::Avalonia.Controls.Shapes.Line { StartPoint = new Point(40, -22), EndPoint = new Point(40, 2000), Stroke = new SolidColorBrush(Color.Parse("#b9ccd5")), StrokeThickness = 2 });
        AddTimelineDot(spine, 32);
        if (rightCard is not null) AddTimelineDot(spine, 112);
        Grid.SetColumn(spine, 1); row.Children.Add(spine);
        return row;
    }
    private static void AddTimelineDot(Canvas canvas, double top)
    {
        var dot = new Border { Width = 24, Height = 24, CornerRadius = new CornerRadius(12), Background = Brushes.White, BorderBrush = new SolidColorBrush(Color.Parse("#194d61")), BorderThickness = new Thickness(3) };
        var core = new Border { Width = 10, Height = 10, CornerRadius = new CornerRadius(5), Background = new SolidColorBrush(Color.Parse("#d7a85d")), HorizontalAlignment = HorizontalAlignment.Center, VerticalAlignment = VerticalAlignment.Center }; dot.Child = core;
        Canvas.SetLeft(dot, 28); Canvas.SetTop(dot, top); canvas.Children.Add(dot);
    }
    private Control AuthorityRow(Authority authority) {
        var flag=new Button {Content=new TextBlock {Text=authority.Citation,TextTrimming=TextTrimming.CharacterEllipsis,MaxWidth=100},Background=BrushFor(authority.Color),Foreground=new SolidColorBrush(Color.Parse("#213b48")),Padding=new Thickness(7,5)};
        ToolTip.SetTip(flag,authority.Title);flag.Click+=(_,_)=>{if(_options.ReadOnly)ShowText(authority.Title,authority.Citation+"\n"+authority.Body);else EditAuthority(authority);};
        if(!_options.ReadOnly){var delete=new MenuItem {Header="Delete precedent"};delete.Click+=(_,_)=>Change(global::Ocker.Ocker.DeleteAuthority(_record!,authority.Id));flag.ContextMenu=new ContextMenu {ItemsSource=new[]{delete}};}return flag;
    }
    private void ShowNotes(OckerEvent evt) {
        var dialog=CreateDialog("Notes",520,420);var list=new StackPanel {Spacing=12};
        foreach(var note in _record!.Notes.Where(n=>n.EventId==evt.Id)){list.Children.Add(new TextBlock {Text=note.Body,TextWrapping=TextWrapping.Wrap});if(!_options.ReadOnly){var edit=new Button {Content="Edit note"};edit.Click+=(_,_)=>{dialog.Close();ShowEditor("Edit note",note.Body,body=>Change(global::Ocker.Ocker.EditNote(_record!,note with {Body=body})));};var remove=new Button {Content="Delete note"};remove.Click+=(_,_)=>{Change(global::Ocker.Ocker.DeleteNote(_record!,note.Id));dialog.Close();};list.Children.Add(new WrapPanel {Children={edit,remove}});}}
        var close=new Button {Content="Close"};close.Click+=(_,_)=>dialog.Close();var layout=new DockPanel {Margin=new Thickness(18),Children={close,new ScrollViewer {Content=list}}};DockPanel.SetDock(close,Dock.Bottom);dialog.Content=layout;ShowModal(dialog);
    }
    private Button DragPad(string label,string kind,IBrush background, DragContext? dragContext = null) {
        var pad=new Button {Content=label,Background=background,Foreground=Brushes.DarkSlateGray,Width=100,Height=kind=="note"?88:36,FontSize=11};
        pad.AddHandler(PointerPressedEvent, (object? _, PointerPressedEventArgs e) => { if(e.GetCurrentPoint(pad).Properties.IsLeftButtonPressed) BeginDrag(e,kind,null, dragContext); }, RoutingStrategies.Tunnel, true);
        ToolTip.SetTip(pad,"Drag onto an event card");return pad;
    }
    private void BeginDrag(PointerPressedEventArgs e,string kind,Note? note, DragContext? context = null) {
        var dragContext = context ?? _mainDragContext;
        if (dragContext is null || _options.ReadOnly) return;
        _activeDragContext = dragContext; _dragKind=kind; _dragNote=note;
        _dragGhost = kind == "note" ? NoteGhost(note) : new Border { Width = 104, Height = 36, Opacity = .78, CornerRadius = new CornerRadius(8), Background = BrushFor("blue"), BorderBrush = new SolidColorBrush(Color.Parse("#194d61")), BorderThickness = new Thickness(1), Child = new TextBlock { Text = "New precedent", VerticalAlignment = VerticalAlignment.Center, HorizontalAlignment = HorizontalAlignment.Center, Foreground = new SolidColorBrush(Color.Parse("#213b48")) } };
        dragContext.Layer.Children.Add(_dragGhost); MoveDragGhost(e.GetPosition(dragContext.Root)); e.Pointer.Capture(dragContext.Root); e.Handled = true;
    }
    private DragContext AttachDragContext(Control root, Canvas layer, Dictionary<Border,string> targets)
    {
        var context = new DragContext(root, layer, targets);
        root.AddHandler(PointerMovedEvent, (object? _, PointerEventArgs e) => OnDragPointerMoved(context, e), RoutingStrategies.Tunnel, true);
        root.AddHandler(PointerReleasedEvent, (object? _, PointerReleasedEventArgs e) => OnDragPointerReleased(context, e), RoutingStrategies.Tunnel, true);
        root.AddHandler(KeyDownEvent, (object? _, KeyEventArgs e) => { if (e.Key == Key.Escape && _activeDragContext == context) ClearDrag(context); }, RoutingStrategies.Tunnel, true);
        root.AddHandler(PointerCaptureLostEvent, (object? _, PointerCaptureLostEventArgs _) => { if (_activeDragContext == context) ClearDrag(context); }, RoutingStrategies.Tunnel, true);
        return context;
    }
    private void OnDragPointerMoved(DragContext context, PointerEventArgs e) { if (_dragKind is not null && _activeDragContext == context) MoveDragGhost(e.GetPosition(context.Root)); }
    private void MoveDragGhost(Point point) { if (_dragGhost is null) return; Canvas.SetLeft(_dragGhost, point.X - (_dragKind == "note" ? 120 * _zoom : _dragGhost.Width / 2)); Canvas.SetTop(_dragGhost, point.Y - (_dragKind == "note" ? 14 * _zoom : 18)); }
    private void OnDragPointerReleased(DragContext context, PointerReleasedEventArgs e) {
        if (_dragKind is null || _activeDragContext != context) return;
        var hit = context.Root.InputHitTest(e.GetPosition(context.Root)) as Visual;
        var target = context.Targets.Keys.FirstOrDefault(card => { var origin = card.TranslatePoint(new Point(), context.Root); return hit is not null && (hit == card || hit.GetVisualAncestors().Contains(card)) && origin is Point p && new Rect(p, card.Bounds.Size).Contains(e.GetPosition(context.Root)); });
        if (target is not null && context.Targets.TryGetValue(target, out var eventId) && _record is not null) {
            var point = e.GetPosition(target); var position = new PinPosition(point.X / _zoom, point.Y / _zoom); var evt = _record.Events.First(x => x.Id == eventId);
            if (_dragNote is not null) Change(global::Ocker.Ocker.EditNote(_record, _dragNote with { EventId = eventId, Position = position }));
            else if (_dragKind == "authority") AddAuthority(evt);
            else ShowEditor("New note", "", body => { Change(global::Ocker.Ocker.AddNote(_record, eventId, body, position, _options.AuthorId)); context.Refresh?.Invoke(); });
        }
        ClearDrag(context); e.Pointer.Capture(null);
    }
    private static double NoteHeight(Note note)=>Math.Max(195,64+Math.Ceiling(note.Body.Length/26d)*19);
    private Control NotePin(Note note, DragContext? dragContext)
    {
        var text=new TextBlock {Text=note.Body,FontSize=14*_zoom,TextWrapping=TextWrapping.Wrap,Margin=new Thickness(18,36,18,20)};
        var paper=new Border {Width=240*_zoom,Height=NoteHeight(note)*_zoom,CornerRadius=new CornerRadius(3,3,22,3),Background=new SolidColorBrush(Color.Parse("#fff1ab")),BoxShadow=new BoxShadows(new BoxShadow { Blur=8, OffsetY=3, Color=Color.FromArgb(55,112,87,24) }),Child=new Grid()};
        var grid=(Grid)paper.Child!;grid.Children.Add(text);
        var fold = new global::Avalonia.Controls.Shapes.Polygon { Points = new Points { new Point(0,0), new Point(18,0), new Point(18,18) }, Fill = new SolidColorBrush(Color.Parse("#ead77e")), HorizontalAlignment=HorizontalAlignment.Right, VerticalAlignment=VerticalAlignment.Bottom }; grid.Children.Add(fold);
        var pin=new Border {Width=22*_zoom,Height=22*_zoom,CornerRadius=new CornerRadius(11*_zoom),Background=Brushes.Firebrick,BorderBrush=new SolidColorBrush(Color.Parse("#8d2020")),BorderThickness=new Thickness(2),HorizontalAlignment=HorizontalAlignment.Center,VerticalAlignment=VerticalAlignment.Top,Margin=new Thickness(0,3*_zoom,0,0),Child=new TextBlock { Text="•", Foreground=Brushes.White, FontSize=15, TextAlignment=TextAlignment.Center, VerticalAlignment=VerticalAlignment.Center }};
        grid.Children.Add(pin);Canvas.SetLeft(paper,(note.Position.X-120)*_zoom);Canvas.SetTop(paper,(note.Position.Y-14)*_zoom);
        if(!_options.ReadOnly){pin.AddHandler(PointerPressedEvent, (object? _, PointerPressedEventArgs e)=>{if(e.GetCurrentPoint(pin).Properties.IsLeftButtonPressed) BeginDrag(e,"note",note, dragContext);}, RoutingStrategies.Tunnel, true);
          var edit=new Button {Content=new TextBlock {Text="✎",FontSize=13,Foreground=new SolidColorBrush(Color.Parse("#194d61")),TextAlignment=TextAlignment.Center},Width=22*_zoom,Height=22*_zoom,MinWidth=0,MinHeight=0,Padding=new Thickness(0),HorizontalAlignment=HorizontalAlignment.Left,VerticalAlignment=VerticalAlignment.Top,Margin=new Thickness(22*_zoom,4*_zoom,0,0),Background=Brushes.Transparent,BorderThickness=new Thickness(0)};
          edit.Click+=(_,_)=>ShowEditor("Edit note",note.Body,body=>Change(global::Ocker.Ocker.EditNote(_record!,note with {Body=body})));grid.Children.Add(edit);
          var remove=new Button {Content=new TextBlock {Text="×",FontSize=15,Foreground=Brushes.Firebrick,TextAlignment=TextAlignment.Center},Width=22*_zoom,Height=22*_zoom,MinWidth=0,MinHeight=0,Padding=new Thickness(0),HorizontalAlignment=HorizontalAlignment.Right,VerticalAlignment=VerticalAlignment.Top,Margin=new Thickness(0,4*_zoom,22*_zoom,0),Background=Brushes.Transparent,BorderThickness=new Thickness(0)};
          remove.Click+=(_,_)=>Change(global::Ocker.Ocker.DeleteNote(_record!,note.Id));grid.Children.Add(remove);}
        return paper;
    }
    private MenuItem DeleteMenu(Note note) { var item = new MenuItem { Header = "Delete note" }; item.Click += (_, _) => Change(global::Ocker.Ocker.DeleteNote(_record!, note.Id)); return item; }
    private void AddNote(OckerEvent evt) => ShowEditor("New note", "", body => Change(global::Ocker.Ocker.AddNote(_record!, evt.Id, body, new(8, 8), _options.AuthorId)));
    private void ClearDrag(DragContext context) { context.Layer.Children.Clear(); _dragGhost = null; _dragKind = null; _dragNote = null; _activeDragContext = null; }
    private Border NoteGhost(Note? note)
    {
        var paper = new Border { Width = 240*_zoom, Height = (note is null ? 195 : NoteHeight(note))*_zoom, Opacity = .78, CornerRadius = new CornerRadius(3,3,22,3), Background = new SolidColorBrush(Color.Parse("#fff1ab")), BorderBrush = new SolidColorBrush(Color.Parse("#d7a85d")), BorderThickness = new Thickness(1) };
        var contents = new Grid(); contents.Children.Add(new TextBlock { Text = note?.Body ?? "New note", TextWrapping = TextWrapping.Wrap, Margin = new Thickness(18,36,18,20), Foreground = new SolidColorBrush(Color.Parse("#213b48")) });
        contents.Children.Add(new TextBlock { Text = "●", FontSize = 25, Foreground = Brushes.Firebrick, HorizontalAlignment = HorizontalAlignment.Center, VerticalAlignment = VerticalAlignment.Top, Margin = new Thickness(0,-4,0,0) });
        paper.Child = contents; return paper;
    }
    private void ShowSources(IReadOnlyList<Source> sources)
    {
        if (sources.Count == 1) { _options.OnSourceClick?.Invoke(sources[0]); ShowSource(sources[0]); return; }
        var dialog = CreateDialog("Evidence sources", 560, 420); var list = new StackPanel { Spacing = 7 };
        foreach (var source in sources) { var item = new Button { Content = $"{source.DocumentId} · paragraph {source.ParagraphId ?? "—"}", HorizontalAlignment = HorizontalAlignment.Stretch }; item.Click += (_,_) => { _options.OnSourceClick?.Invoke(source); dialog.Close(); ShowSource(source); }; list.Children.Add(item); }
        var close = new Button { Content = "Close" }; close.Click += (_,_) => dialog.Close(); var layout = new DockPanel { Margin = new Thickness(16), Children = { close, new ScrollViewer { Content = list } } }; DockPanel.SetDock(close, Dock.Bottom); dialog.Content = layout; ShowModal(dialog);
    }
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
        var graphWidth=Math.Max(320, Math.Min(940, (TopLevel.GetTopLevel(this)?.Bounds.Width ?? 980) - 64)); var graph=new Canvas {Width=graphWidth,Height=Math.Max(500,_options.Mobile ? events.Count*260 : events.Count*220),Background=Brushes.Transparent};var points=new Dictionary<string,Point>();
        var layer = new Canvas { IsHitTestVisible = false, ClipToBounds = true, Width = graphWidth, Height = graph.Height };
        var host = new Grid { Width = graphWidth, Height = graph.Height, Children = { graph, layer } };
        var targets = new Dictionary<Border,string>(); var context = AttachDragContext(host, layer, targets);
        for(int i=0;i<events.Count;i++) points[events[i].Id] = _options.Mobile ? new Point(20, i*260+30) : new Point(i%2==0?20:Math.Max(30, graphWidth-430),i/2*340+30);
        foreach(var edge in links){var a=points[edge.From]+new Vector(210,110);var b=points[edge.To]+new Vector(210,110);var line=new global::Avalonia.Controls.Shapes.Line {StartPoint=a,EndPoint=b,Stroke=edge.Type=="supports"?Brushes.Teal:Brushes.IndianRed,StrokeThickness=2};if(edge.Type=="contradicts")line.StrokeDashArray=new AvaloniaList<double>(new[]{6d,4d});ToolTip.SetTip(line,edge.Rationale);graph.Children.Add(line);}
        foreach(var item in events){var node=BuildCard(item,true,true,context);node.Width=_options.Mobile ? Math.Max(280, graphWidth-40) : 410;Canvas.SetLeft(node,points[item.Id].X);Canvas.SetTop(node,points[item.Id].Y);graph.Children.Add(node);}
        var web=CreateDialog("Related event web",1000,720); context.Refresh = () => { web.Close(); Dispatcher.UIThread.Post(() => ShowRelated(evt)); }; var close=new Button {Content="Close",HorizontalAlignment=HorizontalAlignment.Right};close.Click+=(_,_)=>web.Close();
        var actions=new StackPanel {Orientation=Orientation.Horizontal,HorizontalAlignment=HorizontalAlignment.Right,Children={close}};
        if (!_options.ReadOnly && !_options.Mobile) { actions.Children.Add(DragPad("Add precedent", "authority", BrushFor("blue"), context)); actions.Children.Add(DragPad("Add note", "note", new SolidColorBrush(Color.Parse("#fff1ab")), context)); }
        var layout=new DockPanel {Margin=new Thickness(12),Children={actions,new ScrollViewer {Content=host,HorizontalScrollBarVisibility=ScrollBarVisibility.Auto}}};DockPanel.SetDock(actions,Dock.Bottom);web.Closed += (_,_) => { if (_activeDragContext == context) ClearDrag(context); targets.Clear(); }; web.Content=layout;ShowModal(web);
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
    private static void StyleToolbarButton(Button button) { button.Background = Brushes.White; button.BorderBrush = new SolidColorBrush(Color.Parse("#d6e1e7")); button.Foreground = new SolidColorBrush(Color.Parse("#194d61")); button.Padding = new Thickness(9, 5); }
    private static IBrush StatusBackground(string status) => new SolidColorBrush(Color.Parse(status switch { "agreed" => "#e4f0e9", "disputed" => "#f9e7e7", "unresolved" => "#fff5df", _ => "#ffffff" }));
    private static IBrush StatusForeground(string status) => new SolidColorBrush(Color.Parse(status switch { "agreed" => "#306747", "disputed" => "#9a3d42", "unresolved" => "#8a6116", _ => "#617985" }));
    private static IBrush StatusPillBackground(string status) => new SolidColorBrush(Color.Parse(status switch { "agreed" => "#e4f0e9", "disputed" => "#f9e7e7", "unresolved" => "#fff5df", _ => "#edf3f5" }));
    private static string DateLabel(DateValue date) => date.Value is null ? "Date unknown" : date.Precision == "range" ? $"{date.Value} – {date.End}" : date.Value;
    private static IBrush BrushFor(string color)=>new SolidColorBrush(Color.Parse(color switch {"blue"=>"#b7d9e8","lavender"=>"#d6c9e5","mint"=>"#c3dfcf","peach"=>"#ecd0bb",_=>"#c5d1d7"}));
}
