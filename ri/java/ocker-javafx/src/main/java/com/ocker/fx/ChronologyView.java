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
import javafx.scene.shape.Circle;
import javafx.scene.shape.Line;
import javafx.scene.paint.Color;
import javafx.stage.FileChooser;
import javafx.stage.Window;
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
    private final VBox cards = new VBox(28);
    private ScrollPane scroll;
    private final TextField search = new TextField();
    private final ComboBox<String> filter = new ComboBox<>();
    private final ComboBox<String> documentFilter = new ComboBox<>();
    private final StackPane stage = new StackPane();
    private final VBox dispensers = new VBox(12);
    private Runnable relatedRefresh;
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
    /** Allows a host to frame a deterministic, non-interactive snapshot. */
    public void scrollTo(double position) { if (scroll != null) scroll.setVvalue(Math.max(0, Math.min(1, position))); }
    private Button action(String text, Runnable run) {
        Button button = new Button(text);
        button.setOnAction(e -> { try { run.run(); } catch (Exception error) { options.onError.accept(error); } });
        return button;
    }
    private void build() {
        getStyleClass().removeAll("ocker-glass", "ocker-plain");
        getStyleClass().add(options.theme == ChronologyViewOptions.Theme.GLASS ? "ocker-glass" : "ocker-plain");
        scroll = new ScrollPane(cards); scroll.setFitToWidth(true); scroll.setPannable(true);
        cards.getStyleClass().setAll("ocker-timeline");
        cards.setPadding(new Insets(28, 80, 190, 80));
        stage.getChildren().setAll(scroll, dispensers);
        StackPane.setAlignment(dispensers, Pos.BOTTOM_RIGHT);
        StackPane.setMargin(dispensers, new Insets(20));
        dispensers.setMaxSize(120, 145);
        Button authority = action("Add precedent", () -> {}), note = action("Add note", () -> {});
        authority.getStyleClass().add("ocker-flag-pad"); note.getStyleClass().add("ocker-note-pad");
        dragSource(authority, "ocker:new-authority", 70, 17);
        dragSource(note, "ocker:new-note", 120, 14);
        dispensers.getChildren().setAll(authority, note);
        setCenter(stage);
        if (options.showToolbar) {
            FlowPane toolbar = new FlowPane(8, 8, search, filter, documentFilter,
                action("−", () -> { zoom = Math.max(.5, zoom - .1); render(); }),
                action("+", () -> { zoom = Math.min(1.5, zoom + .1); render(); }));
            toolbar.getStyleClass().add("ocker-toolbar"); toolbar.setPadding(new Insets(12)); setTop(toolbar);
        } else setTop(null);
    }
    private void render() {
        if (record == null) return;
        dispensers.setVisible(!mobile && !options.readOnly); dispensers.setManaged(!mobile && !options.readOnly);
        getStyleClass().remove("ocker-mobile"); if (mobile) getStyleClass().add("ocker-mobile");
        cards.setPadding(mobile ? new Insets(15, 12, 80, 12) : new Insets(28, 80, 190, 80));
        String selectedDoc = documentFilter.getValue();
        List<String> documentNames = new ArrayList<>(List.of("All documents"));
        record.documents().forEach(d -> documentNames.add(d.title()));
        if (!documentFilter.getItems().equals(documentNames)) { documentFilter.getItems().setAll(documentNames); documentFilter.setValue(documentNames.contains(selectedDoc) ? selectedDoc : "All documents"); }
        String query = Objects.toString(search.getText(), "").toLowerCase(Locale.ROOT);
        cards.getChildren().clear();
        List<Event> events = record.events().stream().filter(e -> matches(e, query)).sorted(Comparator.comparing(e -> Objects.toString(e.date().value(), "9999"))).toList();
        Label eyebrow = new Label("OCKER · OPEN CHRONOLOGY, KNOWLEDGE AND EVIDENCE RECORD"); eyebrow.getStyleClass().add("ocker-eyebrow");
        Label title = new Label(record.title()); title.getStyleClass().add("ocker-board-title");
        Label count = new Label(events.size() + " events · " + record.relationships().size() + " related assessments"); count.getStyleClass().add("ocker-count");
        VBox heading = new VBox(5, eyebrow, title, count); heading.getStyleClass().add("ocker-board-heading"); heading.setAlignment(Pos.CENTER);
        cards.getChildren().add(heading);
        for (int index = 0; index < events.size(); index += 2) cards.getChildren().add(timelineRow(events.get(index), index + 1 < events.size() ? events.get(index + 1) : null));
    }
    private Node timelineRow(Event leftEvent, Event rightEvent) {
        if (mobile) {
            VBox column = new VBox(14, card(leftEvent, true));
            if (rightEvent != null) column.getChildren().add(card(rightEvent, false));
            return column;
        }
        GridPane row = new GridPane(); row.getStyleClass().add("ocker-timeline-row");
        ColumnConstraints side = new ColumnConstraints(); side.setPercentWidth(46); side.setHgrow(Priority.ALWAYS);
        ColumnConstraints centre = new ColumnConstraints(80); centre.setHalignment(HPos.CENTER);
        ColumnConstraints otherSide = new ColumnConstraints(); otherSide.setPercentWidth(46); otherSide.setHgrow(Priority.ALWAYS);
        row.getColumnConstraints().addAll(side, centre, otherSide);
        Pane leftCard = card(leftEvent, true); leftCard.setMaxWidth(530); GridPane.setHgrow(leftCard, Priority.ALWAYS);
        VBox leftSlot = new VBox(leftCard); leftSlot.getStyleClass().addAll("ocker-card-slot", "ocker-card-slot-left"); leftSlot.setAlignment(Pos.TOP_RIGHT);
        VBox rightSlot = new VBox(); rightSlot.getStyleClass().addAll("ocker-card-slot", "ocker-card-slot-right"); rightSlot.setAlignment(Pos.TOP_LEFT);
        if (rightEvent != null) { Pane rightCard = card(rightEvent, false); rightCard.setMaxWidth(530); GridPane.setHgrow(rightCard, Priority.ALWAYS); rightSlot.getChildren().add(rightCard); }
        Region firstSpine = new Region(); firstSpine.getStyleClass().add("ocker-spine-segment"); firstSpine.setMaxWidth(2); firstSpine.setPrefHeight(72);
        Region remainingSpine = new Region(); remainingSpine.getStyleClass().add("ocker-spine-segment"); remainingSpine.setMaxWidth(2); VBox.setVgrow(remainingSpine, Priority.ALWAYS);
        Label firstDate = new Label(markerDate(leftEvent)); firstDate.getStyleClass().add("ocker-marker-date"); Circle firstDot = new Circle(7); firstDot.getStyleClass().add("ocker-marker-dot");
        VBox marker = new VBox(firstDate, firstDot, firstSpine); marker.getStyleClass().add("ocker-marker-column"); marker.setAlignment(Pos.TOP_CENTER); marker.setFillWidth(false);
        if (rightEvent != null) { Label secondDate = new Label(markerDate(rightEvent)); secondDate.getStyleClass().add("ocker-marker-date"); Circle secondDot = new Circle(7); secondDot.getStyleClass().add("ocker-marker-dot"); marker.getChildren().addAll(secondDate, secondDot); }
        marker.getChildren().add(remainingSpine);
        row.add(marker, 1, 0);
        row.add(leftSlot, 0, 0); row.add(rightSlot, 2, 0);
        return row;
    }
    private String markerDate(Event event) { String date = event.date().value(); return date == null || date.isBlank() ? "UNDATED" : date.replace('-', '.'); }
    private boolean matches(Event event, String query) {
        boolean status = filter.getValue() == null || "All".equals(filter.getValue()) || filter.getValue().equals(event.status());
        String doc = documentFilter.getValue();
        boolean document = doc == null || "All documents".equals(doc) || event.sources().stream().anyMatch(s -> record.documents().stream().anyMatch(d -> d.id().equals(s.documentId()) && d.title().equals(doc)));
        return status && document && (event.title() + " " + event.summary() + " " + event.narrative()).toLowerCase(Locale.ROOT).contains(query);
    }
    private Pane card(Event event, boolean left) { return card(event, left, mobile); }
    private Pane card(Event event, boolean left, boolean compact) {
        StackPane outer = new StackPane(); outer.setUserData(event.id()); outer.getStyleClass().add("ocker-card");
        VBox body = new VBox(9); body.getStyleClass().add("ocker-card-body"); body.setPadding(new Insets(22));
        Label date = new Label(event.date().value() == null ? "Undated" : event.date().value()); date.getStyleClass().add("ocker-date");
        Label title = new Label(event.title()); title.setWrapText(true); title.getStyleClass().add("ocker-event-title");
        Label account = new Label(Objects.toString(event.assertedBy(), "")); account.getStyleClass().add("ocker-meta");
        Label summary = new Label(event.summary()); summary.setWrapText(true); summary.getStyleClass().add("ocker-summary");
        body.getChildren().addAll(date, title, account);
        if (event.status() != null && !event.status().isBlank()) { Label status = new Label("agreed".equals(event.status()) ? "Common ground" : event.status()); status.getStyleClass().addAll("ocker-status", "ocker-status-" + event.status()); body.getChildren().add(status); }
        body.getChildren().add(summary);
        FlowPane actions = new FlowPane(6, 6);
        actions.getStyleClass().add("ocker-actions");
        for (Source source : event.sources()) { Button sourceButton = action("⌁ Source evidence", () -> { options.onSourceClick.accept(source); sourceViewer(source); }); sourceButton.getStyleClass().add("ocker-source-action"); actions.getChildren().add(sourceButton); }
        long relatedCount = record.relationships().stream().filter(r -> r.from().equals(event.id()) || r.to().equals(event.id())).count();
        if (relatedCount > 0) actions.getChildren().add(action("↗ Related (" + relatedCount + ")", () -> relatedWeb(event)));
        if (compact && !options.readOnly) actions.getChildren().addAll(action("Add precedent", () -> authorityEditor(event, null)), action("Add note", () -> noteEditor(event, null, 40, 80)));
        body.getChildren().add(actions);
        Pane overlay = new Pane(); overlay.setPickOnBounds(false); overlay.setMinSize(0, 0); overlay.setPrefSize(0, 0);
        List<Note> notes = record.notes().stream().filter(n -> n.eventId().equals(event.id())).toList();
        if (compact && !notes.isEmpty()) body.getChildren().add(action("▱ " + notes.size() + " notes", () -> notesDialog(event)));
        if (!compact) for (Note note : notes) { Node paper = note(event, note); paper.relocate(note.position().x() - 120, note.position().y() - 14); overlay.getChildren().add(paper); }
        outer.getChildren().addAll(body, overlay);
        outer.setOnMouseClicked(e -> { if (!(e.getTarget() instanceof Button)) { options.onEventClick.accept(event); overlay.setOpacity(.2); } });
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
        StackPane wrap = new StackPane(outer);
        VBox flags = new VBox(7); flags.getStyleClass().add(left ? "ocker-authorities-left" : "ocker-authorities-right");
        for (Authority authority : record.authorities().stream().filter(a -> a.eventId().equals(event.id())).toList()) {
            Button flag = action(authority.citation(), () -> authorityReader(event, authority)); flag.setMaxWidth(120); flag.setWrapText(false);
            flag.getStyleClass().add("ocker-authority"); flag.setStyle("-fx-background-color: " + color(authority.color()) + ";"); flags.getChildren().add(flag);
        }
        if (!flags.getChildren().isEmpty()) { StackPane.setAlignment(flags, left || compact ? Pos.TOP_LEFT : Pos.TOP_RIGHT); flags.setTranslateX(compact ? 0 : left ? -114 : 114); wrap.getChildren().add(flags); }
        wrap.setScaleX(zoom); wrap.setScaleY(zoom);
        if (options.animate && !compact) { FadeTransition fade = new FadeTransition(Duration.millis(180), wrap); fade.setFromValue(0); fade.setToValue(1); TranslateTransition move = new TranslateTransition(Duration.millis(180), wrap); move.setFromX(left ? -16 : 16); move.setToX(0); new ParallelTransition(fade, move).play(); }
        return wrap;
    }
    private Node note(Event event, Note note) {
        Pane paper = new Pane(); paper.getStyleClass().add("ocker-note");
        Label text = new Label(note.body()); text.setWrapText(true); text.setPrefWidth(200); text.setMinHeight(Region.USE_PREF_SIZE); text.relocate(20, 43);
        double paperHeight = Math.max(195, text.prefHeight(200) + 68); paper.setPrefSize(240, paperHeight);
        Button pin = action("", () -> {}); pin.setGraphic(new Circle(10, Color.web("#ba342d"))); pin.setMinSize(28, 28); pin.setPrefSize(28, 28); pin.setMaxSize(28, 28); pin.relocate(106, 0); pin.getStyleClass().add("ocker-pin");
        if (!options.readOnly) dragSource(pin, "ocker:note:" + note.id(), 120, 14);
        Region fold = new Region(); fold.getStyleClass().add("ocker-note-fold"); fold.relocate(216, paperHeight - 24); fold.setMouseTransparent(true);
        paper.getChildren().addAll(text, pin, fold);
        if (!options.readOnly) { Button edit = action("✎", () -> noteEditor(event, note, note.position().x(), note.position().y())); edit.relocate(20, 8); edit.setAccessibleText("Edit note"); edit.getStyleClass().add("ocker-note-tool"); Button remove = action("×", () -> changed(Ocker.deleteNote(record, note.id()))); remove.relocate(195, 8); remove.setAccessibleText("Delete note"); remove.getStyleClass().add("ocker-note-tool"); paper.getChildren().addAll(edit, remove); }
        return paper;
    }
    private void dragSource(Node node, String value, double x, double y) {
        node.addEventFilter(MouseEvent.DRAG_DETECTED, event -> { if (options.readOnly || mobile) return; Dragboard drag = node.startDragAndDrop(TransferMode.MOVE); ClipboardContent content = new ClipboardContent(); content.putString(value); drag.setContent(content); Node preview = dragPreview(value); drag.setDragView(preview.snapshot(new SnapshotParameters(), null), x, y); event.consume(); });
    }
    private Node dragPreview(String value) {
        if (value.contains("note")) {
            String body = value.startsWith("ocker:note:") ? record.notes().stream().filter(note -> note.id().equals(value.substring(11))).map(Note::body).findFirst().orElse("Note") : "New note";
            Label text = new Label(body); text.setWrapText(true); text.setPrefWidth(196); text.setStyle("-fx-text-fill: #4d461f; -fx-font-size: 12;"); text.relocate(22, 44);
            double height = Math.max(195, text.prefHeight(196) + 70);
            Pane paper = new Pane(text); paper.setPrefSize(240, height); paper.setStyle("-fx-background-color: linear-gradient(to bottom right, #fff2aa, #f3df83); -fx-background-radius: 2 2 28 3; -fx-opacity: .76;");
            Circle pin = new Circle(10, Color.web("#ba342d")); pin.relocate(110, 4); paper.getChildren().add(pin);
            return paper;
        }
        Label text = new Label("Add precedent"); text.setStyle("-fx-text-fill: #24434d; -fx-font-size: 10; -fx-font-weight: bold;"); text.relocate(12, 10);
        Pane flag = new Pane(text); flag.setPrefSize(140, 36); flag.setStyle("-fx-background-color: #b7d9e8; -fx-background-radius: 3; -fx-opacity: .76;");
        return flag;
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
        List<Event> events = record.events().stream().filter(e -> ids.contains(e.id())).sorted(Comparator.comparing(e -> Objects.toString(e.date().value(), "9999"))).toList();
        Window owner = getScene() == null ? null : getScene().getWindow(); double ownerWidth = owner == null ? 1100 : owner.getWidth(), ownerHeight = owner == null ? 760 : owner.getHeight();
        boolean compact = ownerWidth < 740; double dialogWidth = Math.min(1160, Math.max(compact ? 360 : 720, ownerWidth - 48)); double dialogHeight = Math.min(760, Math.max(430, ownerHeight - 56));
        double graphWidth = dialogWidth - 96;
        double cardWidth = compact ? graphWidth - 52 : (graphWidth - 132) / 2; double rowHeight = compact ? 280 : 360;
        Pane lines = new Pane(); Pane board = new Pane(); Map<String, Point2D> points = new HashMap<>();
        for (int index = 0; index < events.size(); index++) { boolean left = compact || index % 2 == 0; int row = compact ? index : index / 2; double x = compact ? 26 : (left ? 26 : 26 + cardWidth + 80), y = 24 + row * rowHeight + (!compact && !left ? 80 : 0); points.put(events.get(index).id(), new Point2D(x + cardWidth / 2, y + 105)); }
        populateRelatedCards(board, events, compact, cardWidth, rowHeight);
        double graphHeight = Math.max(340, (compact ? events.size() : (events.size() + 1) / 2) * rowHeight + 80); lines.setPrefSize(graphWidth, graphHeight); board.setPrefSize(graphWidth, graphHeight);
        for (Relationship relation : links) { Point2D a = points.get(relation.from()), b = points.get(relation.to()); if (a == null || b == null) continue; Line line = new Line(a.getX(), a.getY(), b.getX(), b.getY()); line.setStyle("-fx-stroke: " + (relation.type().equals("contradicts") ? "#b65462" : "#3e8b7d") + "; -fx-stroke-width: 2;"); if (relation.type().equals("contradicts")) line.getStrokeDashArray().addAll(7d, 5d); Tooltip.install(line, new Tooltip(relation.rationale())); lines.getChildren().add(line); }
        board.applyCss(); board.layout();
        Pane graph = new Pane(lines, board); graph.setMinSize(graphWidth, graphHeight); graph.setPrefSize(graphWidth, graphHeight);
        if (!compact && !options.readOnly) { VBox pads = relatedPads(); pads.relocate(graphWidth - 116, graphHeight - 140); graph.getChildren().add(pads); }
        ScrollPane viewport = new ScrollPane(graph); viewport.setFitToWidth(true); viewport.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER); viewport.setPannable(true); viewport.getStyleClass().add("ocker-related-board");
        Dialog<Void> dialog = new Dialog<>(); dialog.setTitle("Related to " + selected.title()); dialog.getDialogPane().setContent(viewport); dialog.getDialogPane().getButtonTypes().add(ButtonType.CLOSE); dialog.getDialogPane().setPrefSize(dialogWidth, dialogHeight); dialog.getDialogPane().setMaxSize(dialogWidth, dialogHeight);
        Runnable refresh = () -> { populateRelatedCards(board, events, compact, cardWidth, rowHeight); board.applyCss(); board.layout(); }; relatedRefresh = refresh; dialog.setOnHidden(event -> { if (relatedRefresh == refresh) relatedRefresh = null; }); showModal(dialog);
    }
    private void populateRelatedCards(Pane board, List<Event> events, boolean compact, double cardWidth, double rowHeight) {
        board.getChildren().clear();
        for (int index = 0; index < events.size(); index++) { boolean left = compact || index % 2 == 0; int row = compact ? index : index / 2; double x = compact ? 26 : (left ? 26 : 26 + cardWidth + 80), y = 24 + row * rowHeight + (!compact && !left ? 80 : 0); Pane eventCard = card(events.get(index), left, compact); eventCard.setPrefWidth(cardWidth); eventCard.setMaxWidth(cardWidth); eventCard.relocate(x, y); board.getChildren().add(eventCard); }
    }
    private VBox relatedPads() {
        Button authority = action("Add precedent", () -> {}), note = action("Add note", () -> {}); authority.getStyleClass().add("ocker-flag-pad"); note.getStyleClass().add("ocker-note-pad"); dragSource(authority, "ocker:new-authority", 70, 17); dragSource(note, "ocker:new-note", 120, 14); return new VBox(12, authority, note);
    }
    private <T> Optional<T> showModal(Dialog<T> dialog) {
        if (getScene() != null) dialog.initOwner(getScene().getWindow());
        var stylesheet = getClass().getResource("/com/ocker/fx/ocker.css");
        if (stylesheet != null && !dialog.getDialogPane().getStylesheets().contains(stylesheet.toExternalForm())) dialog.getDialogPane().getStylesheets().add(stylesheet.toExternalForm());
        dialog.getDialogPane().getStyleClass().add("ocker-chronology");
        dialog.getDialogPane().getStyleClass().add(options.theme == ChronologyViewOptions.Theme.GLASS ? "ocker-glass" : "ocker-plain");
        dialog.getDialogPane().applyCss(); dialog.getDialogPane().layout();
        if (dialog.getDialogPane().getMaxWidth() == Region.USE_COMPUTED_SIZE) dialog.getDialogPane().setMaxSize(850, 650);
        if (options.theme == ChronologyViewOptions.Theme.NONE) return dialog.showAndWait();
        dialog.getDialogPane().getStyleClass().add("ocker-glass-dialog"); dialog.getDialogPane().setStyle("-fx-background-color: rgba(248,251,253,.92); -fx-border-color: rgba(255,255,255,.65); -fx-border-width: 8; -fx-background-radius: 16; -fx-border-radius: 16;");
        Node owner = getScene() == null ? null : getScene().getRoot(); Effect previous = owner == null ? null : owner.getEffect();
        if (owner != null) owner.setEffect(new GaussianBlur(8)); try { return dialog.showAndWait(); } finally { if (owner != null) owner.setEffect(previous); }
    }
    private void changed(OckerRecord next) { try { Ocker.validateStrict(next); record = next; options.onChange.accept(next); render(); if (relatedRefresh != null) relatedRefresh.run(); } catch(Exception error) {options.onError.accept(error);} }
    private WritableImage visual() { cards.applyCss(); cards.layout(); return cards.snapshot(new SnapshotParameters(), null); }
    public void exportPng(Path target) throws IOException { ImageIO.write(SwingFXUtils.fromFXImage(visual(), null), "png", target.toFile()); }
    public void exportPdf(Path target) throws IOException {
        WritableImage image = visual(); ByteArrayOutputStream bytes = new ByteArrayOutputStream(); ImageIO.write(SwingFXUtils.fromFXImage(image, null), "png", bytes);
        try (PDDocument pdf = new PDDocument()) { PDImageXObject png = PDImageXObject.createFromByteArray(pdf, bytes.toByteArray(), "OCKER chronology"); PDPage page = new PDPage(new org.apache.pdfbox.pdmodel.common.PDRectangle(842, Math.max(595, 802f * png.getHeight() / png.getWidth() + 60))); pdf.addPage(page); try (PDPageContentStream content = new PDPageContentStream(pdf, page)) { content.beginText(); content.setFont(new org.apache.pdfbox.pdmodel.font.PDType1Font(org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA), 12); content.newLineAtOffset(20, page.getMediaBox().getHeight() - 22); content.showText("OCKER - " + record.title().replaceAll("[^\\x20-\\x7E]", "?")); content.endText(); content.drawImage(png, 20, 20, 802, 802f * png.getHeight() / png.getWidth()); } pdf.save(target.toFile()); }
    }
    private String color(String color) { return Map.of("blue", "#b7d9e8", "lavender", "#d6c9e5", "mint", "#c3dfcf", "peach", "#ecd0bb", "slate", "#c5d1d7").getOrDefault(color, "#b7d9e8"); }
}
