// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.fx;

import com.ocker.core.*;
import static com.ocker.core.OckerTypes.*;
import javafx.animation.FadeTransition;
import javafx.animation.ParallelTransition;
import javafx.animation.TranslateTransition;
import javafx.embed.swing.SwingFXUtils;
import javafx.geometry.*;
import javafx.scene.*;
import javafx.scene.control.*;
import javafx.scene.effect.Effect;
import javafx.scene.effect.GaussianBlur;
import javafx.scene.image.WritableImage;
import javafx.scene.input.*;
import javafx.scene.layout.*;
import javafx.scene.shape.Line;
import javafx.stage.FileChooser;
import javafx.util.Duration;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.graphics.image.*;
import javax.imageio.ImageIO;
import java.io.*;
import java.nio.file.*;
import java.util.*;

/** All cards stay mounted. Hosts own persistence and credentials. */
public final class ChronologyView extends BorderPane {
    private OckerRecord record;
    private ChronologyViewOptions options;
    private final VBox cards = new VBox(30);
    private final TextField search = new TextField();
    private final ComboBox<String> filter = new ComboBox<>();
    private final ComboBox<String> documentFilter = new ComboBox<>();
    private final StackPane stage = new StackPane();
    private final VBox dispensers = new VBox(12);
    private double zoom = 1;
    private boolean mobile;

    public ChronologyView(OckerRecord record, ChronologyViewOptions options) {
        Ocker.validateStrict(record);
        this.record = record;
        this.options = options == null ? ChronologyViewOptions.builder().build() : options;
        getStyleClass().add("ocker-chronology");
        var stylesheet = getClass().getResource("/com/ocker/fx/ocker.css");
        if (stylesheet != null) getStylesheets().add(stylesheet.toExternalForm());
        search.setPromptText("Search events");
        search.textProperty().addListener((o, before, after) -> render());
        filter.getItems().setAll("All", "alleged", "agreed", "disputed", "unresolved");
        filter.setValue("All");
        filter.setOnAction(e -> render());
        documentFilter.setValue("All documents");
        documentFilter.setOnAction(e -> render());
        widthProperty().addListener((o, before, after) -> {
            boolean next = after.doubleValue() < 720;
            if (mobile != next) { mobile = next; render(); }
        });
        build(); render();
    }
    public OckerRecord getRecord() { return record; }
    public void setRecord(OckerRecord next) { Ocker.validateStrict(next); record = next; render(); }
    public void setOptions(ChronologyViewOptions next) { options = Objects.requireNonNull(next); build(); render(); }
    private Button action(String text, Runnable run) {
        Button button = new Button(text);
        button.setOnAction(e -> { try { run.run(); } catch (Exception error) { options.onError.accept(error); } });
        return button;
    }
    private void build() {
        getStyleClass().removeAll("ocker-glass", "ocker-plain");
        getStyleClass().add(options.theme == ChronologyViewOptions.Theme.GLASS ? "ocker-glass" : "ocker-plain");
        ScrollPane scroll = new ScrollPane(cards); scroll.setFitToWidth(true); scroll.setPannable(true);
        cards.setPadding(new Insets(35, 130, 190, 130));
        stage.getChildren().setAll(scroll, dispensers);
        StackPane.setAlignment(dispensers, Pos.BOTTOM_RIGHT);
        StackPane.setMargin(dispensers, new Insets(20));
        dispensers.setMaxSize(120, 145);
        Button authority = action("Add precedent", () -> {}), note = action("Add note", () -> {});
        authority.getStyleClass().add("ocker-flag-pad"); note.getStyleClass().add("ocker-note-pad");
        dragSource(authority, "ocker:new-authority", 60, 15);
        dragSource(note, "ocker:new-note", 60, 12);
        dispensers.getChildren().setAll(authority, note);
        setCenter(stage);
        if (options.showToolbar) {
            FlowPane toolbar = new FlowPane(8, 8, search, filter, documentFilter,
                action("−", () -> { zoom = Math.max(.5, zoom - .1); render(); }),
                action("+", () -> { zoom = Math.min(1.5, zoom + .1); render(); }));
            toolbar.setPadding(new Insets(12)); setTop(toolbar);
        } else setTop(null);
    }
    private void render() {
        if (record == null) return;
        dispensers.setVisible(!mobile && !options.readOnly); dispensers.setManaged(!mobile && !options.readOnly);
        cards.setPadding(mobile ? new Insets(15) : new Insets(35, 130, 190, 130));
        String selectedDoc = documentFilter.getValue();
        List<String> documentNames = new ArrayList<>(List.of("All documents"));
        record.documents().forEach(d -> documentNames.add(d.title()));
        if (!documentFilter.getItems().equals(documentNames)) { documentFilter.getItems().setAll(documentNames); documentFilter.setValue(documentNames.contains(selectedDoc) ? selectedDoc : "All documents"); }
        String query = Objects.toString(search.getText(), "").toLowerCase(Locale.ROOT);
        cards.getChildren().clear();
        Label brand=new Label("OCKER · "+record.title());brand.getStyleClass().add("ocker-event-title");cards.getChildren().add(brand);
        record.events().stream().filter(e -> matches(e, query)).sorted(Comparator.comparing(e -> Objects.toString(e.date().value(), "9999"))).forEach(e -> cards.getChildren().add(card(e)));
    }
    private boolean matches(Event event, String query) {
        boolean status = filter.getValue() == null || "All".equals(filter.getValue()) || filter.getValue().equals(event.status());
        String doc = documentFilter.getValue();
        boolean document = doc == null || "All documents".equals(doc) || event.sources().stream().anyMatch(s -> record.documents().stream().anyMatch(d -> d.id().equals(s.documentId()) && d.title().equals(doc)));
        return status && document && (event.title() + " " + event.summary() + " " + event.narrative()).toLowerCase(Locale.ROOT).contains(query);
    }
    private Pane card(Event event) {
        StackPane outer = new StackPane(); outer.setUserData(event.id()); outer.getStyleClass().add("ocker-card");
        VBox body = new VBox(9); body.setPadding(new Insets(20));
        Label date = new Label(event.date().value() == null ? "Undated" : event.date().value()); date.getStyleClass().add("ocker-date");
        Label title = new Label(event.title()); title.setWrapText(true); title.getStyleClass().add("ocker-event-title");
        Label summary = new Label(event.summary()); summary.setWrapText(true);
        body.getChildren().addAll(date, title, new Label(Objects.toString(event.assertedBy(), "")), summary);
        FlowPane actions = new FlowPane(6, 6);
        for (Source source : event.sources()) actions.getChildren().add(action("Source evidence", () -> { options.onSourceClick.accept(source); sourceViewer(source); }));
        if (record.relationships().stream().anyMatch(r -> r.from().equals(event.id()) || r.to().equals(event.id()))) actions.getChildren().add(action("Related", () -> relatedWeb(event)));
        if (mobile && !options.readOnly) actions.getChildren().addAll(action("Add precedent", () -> authorityEditor(event, null)), action("Add note", () -> noteEditor(event, null, 40, 80)));
        body.getChildren().add(actions);
        Pane overlay = new Pane(); overlay.setPickOnBounds(false);
        List<Note> notes = record.notes().stream().filter(n -> n.eventId().equals(event.id())).toList();
        if (mobile && !notes.isEmpty()) body.getChildren().add(action("▱ " + notes.size() + " notes", () -> notesDialog(event)));
        if (!mobile) for (Note note : notes) { Node paper = note(event, note); paper.relocate(note.position().x() - 120, note.position().y() - 14); overlay.getChildren().add(paper); }
        outer.getChildren().addAll(body, overlay);
        outer.setOnMouseClicked(e -> { options.onEventClick.accept(event); overlay.setOpacity(.2); });
        outer.setOnMouseExited(e -> overlay.setOpacity(1));
        outer.setOnDragOver(e -> { if (outer.getLayoutBounds().contains(outer.sceneToLocal(e.getSceneX(),e.getSceneY())) && !options.readOnly && e.getDragboard().hasString() && e.getDragboard().getString().startsWith("ocker:")) e.acceptTransferModes(TransferMode.MOVE); e.consume(); });
        outer.setOnDragDropped(e -> {
            if (options.readOnly || !e.getDragboard().hasString()) return;
            Point2D pin = outer.sceneToLocal(e.getSceneX(), e.getSceneY());
            if(!outer.getLayoutBounds().contains(pin)){e.setDropCompleted(false);e.consume();return;}
            String payload = e.getDragboard().getString();
            try {
                if (payload.equals("ocker:new-note")) noteEditor(event, null, pin.getX(), pin.getY());
                else if (payload.equals("ocker:new-authority")) authorityEditor(event, null);
                else if (payload.startsWith("ocker:note:")) record.notes().stream().filter(n -> n.id().equals(payload.substring(11))).findFirst().ifPresent(n -> changed(Ocker.editNote(record, new Note(n.id(), event.id(), n.body(), new Position(pin.getX(), pin.getY()), n.createdAt(), n.updatedAt(), n.authorId(), n.extensions()))));
                e.setDropCompleted(true);
            } catch (Exception error) { options.onError.accept(error); e.setDropCompleted(false); }
            e.consume();
        });
        BorderPane wrap = new BorderPane(outer);
        VBox flags = new VBox(7);
        for (Authority authority : record.authorities().stream().filter(a -> a.eventId().equals(event.id())).toList()) {
            Button flag = action(authority.citation(), () -> authorityReader(event, authority)); flag.setMaxWidth(120); flag.setWrapText(false);
            flag.getStyleClass().add("ocker-authority"); flag.setStyle("-fx-background-color: " + color(authority.color()) + ";"); flags.getChildren().add(flag);
        }
        boolean left = record.events().indexOf(event) % 2 == 0;
        if (!flags.getChildren().isEmpty()) { if (left || mobile) wrap.setLeft(flags); else wrap.setRight(flags); }
        wrap.setScaleX(zoom); wrap.setScaleY(zoom);
        if (options.animate && !mobile) { FadeTransition fade = new FadeTransition(Duration.millis(180), wrap); fade.setFromValue(0); fade.setToValue(1); TranslateTransition move = new TranslateTransition(Duration.millis(180), wrap); move.setFromX(left ? -16 : 16); move.setToX(0); new ParallelTransition(fade, move).play(); }
        return wrap;
    }
    private Node note(Event event, Note note) {
        Pane paper = new Pane(); paper.setPrefSize(240, 180); paper.getStyleClass().add("ocker-note");
        Label text = new Label(note.body()); text.setWrapText(true); text.setPrefWidth(200); text.relocate(20, 43);
        Button pin = action("●", () -> {}); pin.relocate(106, 0); pin.getStyleClass().add("ocker-pin");
        if (!options.readOnly) dragSource(pin, "ocker:note:" + note.id(), 14, 14);
        paper.getChildren().addAll(text, pin);
        if (!options.readOnly) { Button edit = action("✎", () -> noteEditor(event, note, note.position().x(), note.position().y())); edit.relocate(20, 8); edit.setAccessibleText("Edit note"); Button remove = action("×", () -> changed(Ocker.deleteNote(record, note.id()))); remove.relocate(195, 8); remove.setAccessibleText("Delete note"); paper.getChildren().addAll(edit, remove); }
        return paper;
    }
    private void dragSource(Node node, String value, double x, double y) {
        node.setOnDragDetected(event -> { if (options.readOnly || mobile) return; Dragboard drag = node.startDragAndDrop(TransferMode.MOVE); ClipboardContent content = new ClipboardContent(); content.putString(value); drag.setContent(content); drag.setDragView(node.snapshot(new SnapshotParameters(), null), x, y); event.consume(); });
    }
    private void notesDialog(Event event) {
        Dialog<Void> dialog = new Dialog<>(); dialog.setTitle("Notes"); VBox list = new VBox(10);
        record.notes().stream().filter(n -> n.eventId().equals(event.id())).forEach(n -> { Label body = new Label(n.body()); body.setWrapText(true); list.getChildren().add(body); if (!options.readOnly) list.getChildren().add(action("Edit note", () -> { dialog.close(); noteEditor(event, n, n.position().x(), n.position().y()); })); });
        if (!options.readOnly) list.getChildren().add(action("Add note", () -> { dialog.close(); noteEditor(event, null, 40, 80); }));
        dialog.getDialogPane().setContent(list); dialog.getDialogPane().getButtonTypes().add(ButtonType.CLOSE); showModal(dialog);
    }
    private void noteEditor(Event event, Note existing, double x, double y) {
        if (options.readOnly) return; Dialog<ButtonType> dialog = new Dialog<>(); dialog.setTitle(existing == null ? "Add note" : "Edit note");
        TextArea text = new TextArea(existing == null ? "" : existing.body()); text.setWrapText(true); dialog.getDialogPane().setContent(text);
        ButtonType save = new ButtonType("Save", ButtonBar.ButtonData.OK_DONE), remove = new ButtonType("Delete", ButtonBar.ButtonData.LEFT);
        dialog.getDialogPane().getButtonTypes().addAll(save, ButtonType.CANCEL); if (existing != null) dialog.getDialogPane().getButtonTypes().add(remove);
        showModal(dialog).ifPresent(result -> { if (result == remove) changed(Ocker.deleteNote(record, existing.id())); else if (result == save && !text.getText().isBlank()) changed(existing == null ? Ocker.addNote(record, event.id(), text.getText(), x, y, options.authorId) : Ocker.editNote(record, new Note(existing.id(), event.id(), text.getText(), existing.position(), existing.createdAt(), existing.updatedAt(), existing.authorId(), existing.extensions()))); });
    }
    private TextField field(GridPane form, int row, String name, String value) { TextField field = new TextField(Objects.toString(value, "")); form.addRow(row, new Label(name), field); return field; }
    private void authorityEditor(Event event, Authority existing) {
        if (options.readOnly) return; Dialog<ButtonType> dialog = new Dialog<>(); dialog.setTitle("Precedent"); GridPane form = new GridPane(); form.setHgap(10); form.setVgap(8);
        TextField title = field(form, 0, "Authority title", existing == null ? "" : existing.title()), citation = field(form, 1, "Citation", existing == null ? "" : existing.citation());
        ComboBox<String> type = new ComboBox<>(); type.getItems().setAll("binding", "persuasive", "unspecified"); type.setValue(existing == null ? "unspecified" : existing.type()); form.addRow(2, new Label("Type"), type);
        ComboBox<String> colour = new ComboBox<>(); colour.getItems().setAll("blue", "lavender", "mint", "peach", "slate"); colour.setValue(existing == null ? "blue" : existing.color()); form.addRow(3, new Label("Colour"), colour);
        TextField pinpoint = field(form, 4, "Pinpoint", existing == null ? "" : existing.pinpoint()), court = field(form, 5, "Court", existing == null ? "" : existing.court()), jurisdiction = field(form, 6, "Jurisdiction", existing == null ? "" : existing.jurisdiction()), url = field(form, 7, "Source URL", existing == null ? "" : existing.sourceUrl());
        TextArea body = new TextArea(existing == null ? "" : existing.body()); body.setPrefRowCount(3); form.addRow(8, new Label("Application"), body);
        dialog.getDialogPane().setContent(new ScrollPane(form)); ButtonType save = new ButtonType("Save", ButtonBar.ButtonData.OK_DONE), remove = new ButtonType("Delete", ButtonBar.ButtonData.LEFT); dialog.getDialogPane().getButtonTypes().addAll(save, ButtonType.CANCEL); if (existing != null) dialog.getDialogPane().getButtonTypes().add(remove);
        showModal(dialog).ifPresent(result -> { if (result == remove) changed(Ocker.deleteAuthority(record, existing.id())); else if (result == save) { String time = java.time.Instant.now().toString(); Authority value = new Authority(existing == null ? UUID.randomUUID().toString() : existing.id(), event.id(), title.getText(), citation.getText(), type.getValue(), colour.getValue(), nullable(pinpoint), nullable(court), nullable(jurisdiction), nullable(url), body.getText(), existing == null ? time : existing.createdAt(), time, options.authorId, existing == null ? null : existing.extensions()); changed(existing == null ? Ocker.addAuthority(record, value) : Ocker.editAuthority(record, value)); } });
    }
    private String nullable(TextField field) { return field.getText().isBlank() ? null : field.getText().trim(); }
    private void authorityReader(Event event, Authority authority) { if (!options.readOnly) { authorityEditor(event, authority); return; } Dialog<Void> dialog = new Dialog<>(); dialog.setTitle(authority.title()); Label body = new Label(authority.citation() + "\n" + Objects.toString(authority.body(), "")); body.setWrapText(true); dialog.getDialogPane().setContent(body); dialog.getDialogPane().getButtonTypes().add(ButtonType.CLOSE); showModal(dialog); }
    private void sourceViewer(Source source) {
        Dialog<Void> dialog = new Dialog<>(); dialog.setTitle("Source evidence"); VBox body = new VBox(12);
        var document = record.documents().stream().filter(d -> d.id().equals(source.documentId())).findFirst().orElseThrow();
        Label text = new Label(source.quote() == null ? "No retained excerpt" : source.quote()); text.setWrapText(true); body.getChildren().addAll(new Label(document.title()), text);
        record.assets().stream().filter(a -> a.id().equals(source.assetId() == null ? document.assetId() : source.assetId())).findFirst().ifPresent(asset -> { if (asset.data() != null) body.getChildren().add(action(asset.derivedFrom()==null?"Save original evidence":"Save derived asset", () -> { FileChooser chooser = new FileChooser(); chooser.setInitialFileName(asset.name()); var file = chooser.showSaveDialog(getScene().getWindow()); if (file != null) try { Files.write(file.toPath(), Base64.getDecoder().decode(asset.data())); } catch (IOException error) { options.onError.accept(error); } })); body.getChildren().add(new Label("SHA-256: " + asset.sha256())); });
        dialog.getDialogPane().setContent(new ScrollPane(body)); dialog.getDialogPane().getButtonTypes().add(ButtonType.CLOSE); showModal(dialog);
    }
    private void relatedWeb(Event selected) {
        List<Relationship> links = record.relationships().stream().filter(r -> r.from().equals(selected.id()) || r.to().equals(selected.id())).toList(); Set<String> ids = new HashSet<>(List.of(selected.id())); links.forEach(r -> { ids.add(r.from()); ids.add(r.to()); });
        List<Event> events = record.events().stream().filter(e -> ids.contains(e.id())).toList(); Pane graph = new Pane(); graph.setPrefSize(680, 420); Map<String, Point2D> points = new HashMap<>();
        for (int i = 0; i < events.size(); i++) { double angle = 2 * Math.PI * i / Math.max(1, events.size()); points.put(events.get(i).id(), new Point2D(320 + 210 * Math.cos(angle), 180 + 125 * Math.sin(angle))); }
        for (Relationship relation : links) { Point2D a = points.get(relation.from()), b = points.get(relation.to()); Line line = new Line(a.getX(), a.getY(), b.getX(), b.getY()); line.setStyle("-fx-stroke: " + (relation.type().equals("contradicts") ? "#b65462" : "#3e8b7d") + "; -fx-stroke-width: 2;"); if (relation.type().equals("contradicts")) line.getStrokeDashArray().addAll(7d, 5d); Tooltip.install(line, new Tooltip(relation.rationale())); graph.getChildren().add(line); }
        for (Event event : events) { Point2D point = points.get(event.id()); VBox node = new VBox(5); node.setPrefWidth(155); node.getStyleClass().add("ocker-card"); Label title = new Label(event.title()), summary = new Label(event.summary()); title.setWrapText(true); summary.setWrapText(true); node.getChildren().addAll(title, summary, action("Source", () -> { if (!event.sources().isEmpty()) sourceViewer(event.sources().get(0)); })); if (!options.readOnly) node.getChildren().addAll(action("Note", () -> noteEditor(event, null, 40, 60)), action("Precedent", () -> authorityEditor(event, null))); node.relocate(point.getX() - 77, point.getY() - 40); graph.getChildren().add(node); }
        Dialog<Void> dialog = new Dialog<>(); dialog.setTitle("Related to " + selected.title()); dialog.getDialogPane().setContent(new ScrollPane(graph)); dialog.getDialogPane().getButtonTypes().add(ButtonType.CLOSE); showModal(dialog);
    }
    private <T> Optional<T> showModal(Dialog<T> dialog) {
        if (getScene() != null) dialog.initOwner(getScene().getWindow());
        dialog.getDialogPane().setMaxSize(850, 650);
        if (options.theme == ChronologyViewOptions.Theme.NONE) return dialog.showAndWait();
        dialog.getDialogPane().getStyleClass().add("ocker-glass-dialog"); dialog.getDialogPane().setStyle("-fx-background-color: rgba(248,251,253,.92); -fx-border-color: rgba(255,255,255,.65); -fx-border-width: 8; -fx-background-radius: 16; -fx-border-radius: 16;");
        Node owner = getScene() == null ? null : getScene().getRoot(); Effect previous = owner == null ? null : owner.getEffect();
        if (owner != null) owner.setEffect(new GaussianBlur(8)); try { return dialog.showAndWait(); } finally { if (owner != null) owner.setEffect(previous); }
    }
    private void changed(OckerRecord next) { try { Ocker.validateStrict(next); record = next; options.onChange.accept(next); render(); } catch(Exception error) {options.onError.accept(error);} }
    private WritableImage visual() { cards.applyCss(); cards.layout(); return cards.snapshot(new SnapshotParameters(), null); }
    public void exportPng(Path target) throws IOException { ImageIO.write(SwingFXUtils.fromFXImage(visual(), null), "png", target.toFile()); }
    public void exportPdf(Path target) throws IOException {
        WritableImage image = visual(); ByteArrayOutputStream bytes = new ByteArrayOutputStream(); ImageIO.write(SwingFXUtils.fromFXImage(image, null), "png", bytes);
        try (PDDocument pdf = new PDDocument()) { PDImageXObject png = PDImageXObject.createFromByteArray(pdf, bytes.toByteArray(), "OCKER chronology"); PDPage page = new PDPage(new org.apache.pdfbox.pdmodel.common.PDRectangle(842, Math.max(595, 802f * png.getHeight() / png.getWidth() + 60))); pdf.addPage(page); try (PDPageContentStream content = new PDPageContentStream(pdf, page)) { content.beginText(); content.setFont(new org.apache.pdfbox.pdmodel.font.PDType1Font(org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA), 12); content.newLineAtOffset(20, page.getMediaBox().getHeight() - 22); content.showText("OCKER - " + record.title().replaceAll("[^\\x20-\\x7E]", "?")); content.endText(); content.drawImage(png, 20, 20, 802, 802f * png.getHeight() / png.getWidth()); } pdf.save(target.toFile()); }
    }
    private String color(String color) { return Map.of("blue", "#b7d9e8", "lavender", "#d6c9e5", "mint", "#c3dfcf", "peach", "#ecd0bb", "slate", "#c5d1d7").getOrDefault(color, "#b7d9e8"); }
}
