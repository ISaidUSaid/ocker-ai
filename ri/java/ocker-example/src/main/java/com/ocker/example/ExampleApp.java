// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.example;
import com.ocker.core.*;
import com.ocker.core.OckerTypes.Intermediate;
import com.ocker.fx.*;
import javafx.application.*;
import javafx.concurrent.Task;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

/** A small host application. Provider settings never enter the exported record. */
public final class ExampleApp extends Application {
    private OckerRecord record = Ocker.createRecord("New chronology");
    private final List<Intermediate> queued = new ArrayList<>();
    private ChronologyView view;
    private final AtomicBoolean cancelled = new AtomicBoolean();
    private final TextField endpoint = new TextField(), model = new TextField();
    private final PasswordField key = new PasswordField();
    private final ComboBox<ChronologyViewOptions.Theme> theme = new ComboBox<>();
    private final ComboBox<String> kind = new ComboBox<>();
    private final CheckBox consent = new CheckBox("Send document text to my selected provider");
    private final Label status = new Label("Open a saved chronology or queue text PDFs.");
    private final FlowPane commands = new FlowPane(8, 8);
    private boolean busy;
    public void start(Stage stage) {
        String recordPath = getParameters().getNamed().get("record");
        if (recordPath != null) try { record = Ocker.importRecord(Files.readString(Path.of(recordPath))); } catch (Exception error) { status.setText(error.getMessage()); }
        view = new ChronologyView(record, options());
        endpoint.setPromptText("https://your-provider.example/v1/chat/completions"); model.setPromptText("Your selected model"); key.setPromptText("API key — memory only");
        theme.getItems().setAll(ChronologyViewOptions.Theme.GLASS, ChronologyViewOptions.Theme.NONE); theme.setValue(ChronologyViewOptions.Theme.GLASS); theme.setOnAction(e -> view.setOptions(options()));
        kind.getItems().setAll("affidavit", "order", "report"); kind.setValue("affidavit");
        commands.getChildren().addAll(action("Open OCKER", () -> open(stage)), action("Save OCKER", () -> save(stage)), action("PNG", () -> export(stage, true)), action("PDF", () -> export(stage, false)), kind,
            action("Add text PDFs", () -> importPdfs(stage)), action("Build chronology", this::build), action("Find relationships", () -> { CompletionAdapter selected=adapter(); run(() -> Ocker.findRelationships(record, work(selected))); }));
        Button cancel = new Button("Cancel"); cancel.setOnAction(e -> cancelled.set(true));
        FlowPane provider=new FlowPane(12,10);
        endpoint.setPrefWidth(450);model.setPrefWidth(190);key.setPrefWidth(190);
        provider.getChildren().addAll(field("Dialog theme",theme),field("Provider endpoint",endpoint),field("Model",model),field("API key",key));
        VBox settings = new VBox(12, heading(), provider, consent, commands, new HBox(10, cancel, status)); settings.setPadding(new Insets(18)); settings.getStyleClass().add("ocker-settings");
        BorderPane root = new BorderPane(view); root.setTop(settings);
        Scene scene = new Scene(root, 1200, 820); scene.getStylesheets().add(getClass().getResource("/com/ocker/fx/ocker.css").toExternalForm());
        provider.prefWrapLengthProperty().bind(scene.widthProperty().subtract(36));
        stage.setScene(scene); stage.setTitle("OCKER — Open Chronology, Knowledge and Evidence Record"); stage.show();
        String snapshot = getParameters().getNamed().get("snapshot");
        if (snapshot != null) { javafx.animation.PauseTransition pause = new javafx.animation.PauseTransition(javafx.util.Duration.seconds(2)); pause.setOnFinished(e -> { try { root.applyCss(); root.layout(); javax.imageio.ImageIO.write(javafx.embed.swing.SwingFXUtils.fromFXImage(root.snapshot(new javafx.scene.SnapshotParameters(), null), null), "png", Path.of(snapshot).toFile()); } catch (Exception error) { error.printStackTrace(); } String prefix=getParameters().getNamed().get("export-prefix");if(prefix!=null)try{view.exportPng(Path.of(prefix+".png"));view.exportPdf(Path.of(prefix+".pdf"));}catch(Exception error){error.printStackTrace();}Platform.exit(); }); pause.play(); }
    }
    private VBox field(String label, javafx.scene.Node control) { return new VBox(5,new Label(label),control); }
    private Label heading() { Label label=new Label("OCKER  /  Every account. In its place.");label.getStyleClass().add("ocker-heading");return label; }
    private ChronologyViewOptions options() { return ChronologyViewOptions.builder().theme(theme.getValue() == null ? ChronologyViewOptions.Theme.GLASS : theme.getValue()).onChange(next -> record = next).onError(error -> status.setText(error.getMessage())).build(); }
    private Button action(String label, Runnable action) { Button button = new Button(label); button.setOnAction(e -> { if (!busy) try { action.run(); } catch (Exception error) { status.setText(error.getMessage()); } }); return button; }
    private FileChooser chooser(String title, String extension) { FileChooser chooser = new FileChooser(); chooser.setTitle(title); chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter(extension.toUpperCase(), "*." + extension)); return chooser; }
    private void open(Stage stage) { var file = chooser("Open OCKER", "json").showOpenDialog(stage); if (file != null) try { OckerRecord next = Ocker.importRecord(Files.readString(file.toPath())); view.setRecord(next); record = next; queued.clear(); status.setText("Record loaded and evidence verified."); } catch (Exception error) { status.setText(error.getMessage()); } }
    private void save(Stage stage) { var file = chooser("Save OCKER", "json").showSaveDialog(stage); if (file != null) try { Files.writeString(file.toPath(), Ocker.exportRecord(record)); status.setText("Saved."); } catch (Exception error) { status.setText(error.getMessage()); } }
    private void export(Stage stage, boolean png) { var file = chooser("Export view", png ? "png" : "pdf").showSaveDialog(stage); if (file != null) try { if (png) view.exportPng(file.toPath()); else view.exportPdf(file.toPath()); } catch (Exception error) { status.setText(error.getMessage()); } }
    private void importPdfs(Stage stage) { var files = chooser("Add text PDFs", "pdf").showOpenMultipleDialog(stage); String selectedKind = kind.getValue(); if (files != null) run(() -> { List<Intermediate> pending = new ArrayList<>(); for (var file : files) pending.add(Ocker.parsePdf(file.toPath(), UUID.randomUUID().toString(), file.getName(), selectedKind, work(null))); queued.addAll(pending); return record; }); }
    private CompletionAdapter adapter() { if (!consent.isSelected()) throw new IllegalStateException("Confirm that text may be sent to your selected provider."); if (endpoint.getText().isBlank() || model.getText().isBlank() || key.getText().isBlank()) throw new IllegalStateException("Enter endpoint, model and API key."); return new OpenAICompatibleAdapter(endpoint.getText(), model.getText(), key.getText()); }
    private OckerOptions work(CompletionAdapter adapter) { return OckerOptions.builder().llm(adapter).cancellation(cancelled::get).onProgress(progress -> Platform.runLater(() -> status.setText(progress.phase() + ": " + progress.message()))).build(); }
    private void build() { if (queued.isEmpty()) throw new IllegalStateException("Queue at least one text PDF."); CompletionAdapter adapter = adapter(); List<Intermediate> input = List.copyOf(queued); run(() -> { OckerRecord next = Ocker.createRecord("Imported document chronology"); for (Intermediate item : input) next = Ocker.buildChronology(next, item, work(adapter)); return next; }); }
    private void run(Work work) { if (busy) return; busy = true; commands.setDisable(true); cancelled.set(false); Task<OckerRecord> task = new Task<>() { protected OckerRecord call() throws Exception { return work.get(); } }; task.setOnSucceeded(e -> { if (!cancelled.get()) { OckerRecord next = task.getValue(); view.setRecord(next); record = next; status.setText("Ready · " + record.events().size() + " events · " + queued.size() + " queued documents"); } done(); }); task.setOnFailed(e -> { status.setText(cancelled.get() ? "Cancelled. Record unchanged." : task.getException().getMessage()); done(); }); Thread worker = new Thread(task, "ocker-operation"); worker.setDaemon(true); worker.start(); }
    private void done() { busy = false; commands.setDisable(false); }
    @FunctionalInterface private interface Work { OckerRecord get() throws Exception; }
    public static void main(String[] args) { launch(args); }
}
