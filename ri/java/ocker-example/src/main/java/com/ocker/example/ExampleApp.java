// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.example;
import com.ocker.core.*;
import com.ocker.core.OckerTypes.Intermediate;
import com.ocker.fx.*;
import javafx.application.*;
import javafx.concurrent.Task;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.effect.Effect;
import javafx.scene.effect.GaussianBlur;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
import javafx.scene.layout.*;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;
import javafx.stage.*;
import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.*;

/** A small host application. Provider settings never enter the exported record. */
public final class ExampleApp extends Application {
    private OckerRecord record = Ocker.createRecord("New chronology");
    private final List<Intermediate> queued = new ArrayList<>();
    private ChronologyView view;
    private final AtomicBoolean cancelled = new AtomicBoolean();
    private final TextField endpoint = new TextField(), model = new TextField();
    private final PasswordField key = new PasswordField();
    private final ComboBox<ChronologyViewOptions.Theme> theme = new ComboBox<>();
    private final Label status = new Label("Choose a starting point: try the example, open a saved chronology, or add documents.");
    private final FlowPane commands = new FlowPane(8, 8);
    private final TextArea code = new TextArea();
    private final VBox codePane = new VBox(8);
    private final Button showCode = new Button("Show code");
    private boolean busy;
    public void start(Stage stage) {
        String recordPath = getParameters().getNamed().get("record");
        if (recordPath != null) try { record = Ocker.importRecord(Files.readString(Path.of(recordPath))); status.setText("Saved chronology opened and evidence verified."); } catch (Exception error) { showError("open the saved chronology", error); }
        view = new ChronologyView(record, options());
        endpoint.setPromptText("https://your-provider.example/v1/chat/completions"); model.setPromptText("Your selected model"); key.setPromptText("API key — memory only; optional for local Ollama");
        theme.getItems().setAll(ChronologyViewOptions.Theme.GLASS, ChronologyViewOptions.Theme.NONE); theme.setValue("none".equalsIgnoreCase(getParameters().getNamed().get("theme")) ? ChronologyViewOptions.Theme.NONE : ChronologyViewOptions.Theme.GLASS); theme.setOnAction(e -> { view.setOptions(options()); updateCode(); }); view.setOptions(options());
        FlowPane provider=new FlowPane(12,10);
        FlowPane presets=new FlowPane(8,8);
        endpoint.setPrefWidth(450);model.setPrefWidth(190);key.setPrefWidth(190);
        provider.getChildren().addAll(field("Dialog theme",theme),field("Model",model),field("API key",key));
        presets.getChildren().addAll(new Label("Provider presets"), providerPreset("OpenAI", "https://api.openai.com/v1/chat/completions"), providerPreset("Gemini", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"), providerPreset("Mistral", "https://api.mistral.ai/v1/chat/completions"), providerPreset("Groq", "https://api.groq.com/openai/v1/chat/completions"), providerPreset("OpenRouter", "https://openrouter.ai/api/v1/chat/completions"), providerPreset("Ollama", "http://localhost:11434/v1/chat/completions"));
        TitledPane advanced = new TitledPane("Advanced settings", field("Provider endpoint",endpoint)); advanced.setExpanded(false);
        Button build = action("Build chronology", this::build); build.getStyleClass().add("ocker-build-button");
        Button addDocuments = action("Add documents", () -> importDocuments(stage));
        Button importRecord = action("Open saved chronology", () -> open(stage));
        Button example = action("Try example", this::loadExample);
        addDocuments.setTooltip(new Tooltip("Add PDF, TXT, RTF or DOCX documents to build a chronology."));
        importRecord.setTooltip(new Tooltip("Open an existing OCKER JSON chronology. No provider is needed."));
        example.setTooltip(new Tooltip("Explore the bundled Joe and Jill chronology. No provider or API key is needed."));
        Button configure = action("Configure provider", () -> configureProvider(stage, provider, presets, advanced));
        Button save = action("Save JSON", () -> save(stage));
        Button exports = action("Export PNG / PDF", () -> exportChoice(stage));
        Button edit = action("Edit OCKER file", () -> editRecord(stage));
        FlowPane startActions = new FlowPane(7, 7, addDocuments, importRecord, example);
        Button cancel = new Button("Cancel"); cancel.setOnAction(e -> { cancelled.set(true); status.setText("Cancelling…"); });
        FlowPane providerActions = new FlowPane(7, 7, configure, build, cancel);
        FlowPane reviewActions = new FlowPane(7, 7, save, exports, showCode, edit);
        commands.getChildren().addAll(startActions, providerActions, reviewActions);
        configureCodePane();
        Label providerNotice = new Label("New here? Try the example first. To build from your documents, choose a provider, then enter a model and key. Local Ollama stays on this device."); providerNotice.setWrapText(true);
        Label subheading = new Label("Every account. In its place."); subheading.getStyleClass().add("ocker-subheading");
        VBox recordsStep = step("1", "Start here", "Try the example, open a saved chronology, or add documents.", startActions);
        VBox providerStep = step("2", "Set up a provider", "Choose one, then enter your model and in-memory key.", providerActions);
        VBox reviewStep = step("3", "Review and share", "Edit the record or save an image, PDF or JSON.", reviewActions);
        FlowPane steps = new FlowPane(10, 10, recordsStep, providerStep, reviewStep); steps.getStyleClass().add("ocker-steps");
        VBox settings = new VBox(8, heading(), subheading, providerNotice, steps, codePane, status); settings.setPadding(new Insets(18)); settings.getStyleClass().add("ocker-settings");
        ScrollPane settingsViewport = new ScrollPane(settings); settingsViewport.setFitToWidth(true); settingsViewport.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER); settingsViewport.getStyleClass().add("ocker-settings-viewport");
        BorderPane root = new BorderPane(view); root.setFocusTraversable(true); root.setTop(settingsViewport);
        Scene scene = new Scene(root, namedSize("width", 1200), namedSize("height", 820)); scene.getStylesheets().add(getClass().getResource("/com/ocker/fx/ocker.css").toExternalForm());
        settings.prefWidthProperty().bind(scene.widthProperty());
        steps.prefWrapLengthProperty().bind(scene.widthProperty().subtract(36));
        provider.prefWrapLengthProperty().bind(scene.widthProperty().subtract(80));
        presets.prefWrapLengthProperty().bind(scene.widthProperty().subtract(80));
        layoutSteps(scene.getWidth(), recordsStep, providerStep, reviewStep, settingsViewport);
        scene.widthProperty().addListener((observable, before, after) -> layoutSteps(after.doubleValue(), recordsStep, providerStep, reviewStep, settingsViewport));
        stage.setScene(scene); stage.setTitle("OCKER — Open Chronology, Knowledge and Evidence Record"); Image icon = stageIcon(); if (icon != null) stage.getIcons().add(icon); stage.show(); Platform.runLater(root::requestFocus);
        String snapshot = getParameters().getNamed().get("snapshot");
        if (snapshot != null) { javafx.animation.PauseTransition pause = new javafx.animation.PauseTransition(javafx.util.Duration.seconds(2)); pause.setOnFinished(e -> { try { root.applyCss(); root.layout(); String position = getParameters().getNamed().get("scroll"); if (position != null) view.scrollTo(Double.parseDouble(position)); root.layout(); javax.imageio.ImageIO.write(javafx.embed.swing.SwingFXUtils.fromFXImage(root.snapshot(new javafx.scene.SnapshotParameters(), null), null), "png", Path.of(snapshot).toFile()); } catch (Exception error) { error.printStackTrace(); } String prefix=getParameters().getNamed().get("export-prefix");if(prefix!=null)try{view.exportPng(Path.of(prefix+".png"));view.exportPdf(Path.of(prefix+".pdf"));}catch(Exception error){error.printStackTrace();}Platform.exit(); }); pause.play(); }
    }
    private VBox field(String label, javafx.scene.Node control) { return new VBox(5,new Label(label),control); }
    private Image stageIcon() { URL icon = getClass().getResource("/ocker-icon.png"); if (icon == null) icon = getClass().getResource("/ocker-wordmark.png"); return icon == null ? null : new Image(icon.toExternalForm()); }
    private Node heading() { HBox heading = new HBox(10); heading.getStyleClass().add("ocker-heading"); heading.setAlignment(javafx.geometry.Pos.CENTER_LEFT); try (InputStream input = getClass().getResourceAsStream("/ocker-wordmark.png")) { if (input != null) { ImageView mark = new ImageView(new Image(input)); mark.setPreserveRatio(true); mark.setFitWidth(160); heading.getChildren().add(mark); } else heading.getChildren().add(new Label("OCKER /")); } catch (IOException ignored) { heading.getChildren().add(new Label("OCKER /")); } Label title = new Label("Open Chronology, Knowledge and Evidence Record"); title.setWrapText(true); title.setMaxWidth(Double.MAX_VALUE); title.getStyleClass().add("ocker-heading-title"); heading.getChildren().add(title); return heading; }
    private VBox step(String number, String title, String detail, Node... content) { Label badge = new Label(number); badge.getStyleClass().add("ocker-step-number"); Label heading = new Label(title); heading.getStyleClass().add("ocker-step-title"); Label detailLabel = new Label(detail); detailLabel.setWrapText(true); detailLabel.getStyleClass().add("ocker-step-detail"); VBox step = new VBox(6, badge, heading, detailLabel); step.getStyleClass().add("ocker-step"); step.getChildren().addAll(content); return step; }
    private void layoutSteps(double width, VBox first, VBox second, VBox third, ScrollPane viewport) { boolean compact = width < 740; double panelWidth = Math.max(280, compact ? width - 52 : (width - 120) / 3); for (VBox panel : List.of(first, second, third)) panel.setPrefWidth(panelWidth); viewport.setMaxHeight(330); viewport.setPrefViewportHeight(330); }
    private double namedSize(String name, double fallback) { try { return Math.max(360, Double.parseDouble(getParameters().getNamed().getOrDefault(name, Double.toString(fallback)))); } catch (NumberFormatException error) { return fallback; } }
    private ChronologyViewOptions options() { return ChronologyViewOptions.builder().theme(theme.getValue() == null ? ChronologyViewOptions.Theme.GLASS : theme.getValue()).onChange(next -> record = next).onError(error -> status.setText(error.getMessage())).build(); }
    private void configureCodePane() {
        code.setEditable(false);
        code.setWrapText(false);
        code.setPrefRowCount(8);
        code.setMaxHeight(180);
        code.setStyle("-fx-font-family: 'monospace';");
        Button copy = new Button("Copy code");
        copy.setOnAction(e -> { ClipboardContent content = new ClipboardContent(); content.putString(code.getText()); Clipboard.getSystemClipboard().setContent(content); status.setText("Code copied."); });
        codePane.getChildren().addAll(new Label("Java embedding example"), code, copy);
        codePane.setManaged(false);
        codePane.setVisible(false);
        showCode.setOnAction(e -> { boolean showing = !codePane.isVisible(); if (showing) updateCode(); codePane.setManaged(showing); codePane.setVisible(showing); showCode.setText(showing ? "Hide code" : "Show code"); });
        updateCode();
    }
    private void updateCode() {
        ChronologyViewOptions.Theme currentTheme = theme.getValue() == null ? ChronologyViewOptions.Theme.GLASS : theme.getValue();
        code.setText("""
            ChronologyView chronology = new ChronologyView(record,
                ChronologyViewOptions.builder()
                    .theme(ChronologyViewOptions.Theme.%s)
                    .onChange(next -> record = next)
                    .build());

            String endpoint = System.getenv("PROVIDER_ENDPOINT");
            String model = System.getenv("PROVIDER_MODEL");
            String key = System.getenv("PROVIDER_API_KEY");
            CompletionAdapter llm = new OpenAICompatibleAdapter(endpoint, model, key);

            Intermediate document = Ocker.parseDocument(documentPath, documentId, title, kind,
                OckerOptions.builder().build());
            record = Ocker.buildChronology(record, document,
                OckerOptions.builder().llm(llm).build());
            record = Ocker.findRelationships(record,
                OckerOptions.builder().llm(llm).build());
            """.formatted(currentTheme.name()));
    }
    private void editRecord(Stage owner) {
        Stage editor = new Stage(); editor.initOwner(owner); editor.initModality(Modality.WINDOW_MODAL); editor.setTitle("Edit OCKER file"); editor.setOnCloseRequest(event -> event.consume());
        TextArea source = new TextArea(); source.setText(exportRecord()); source.setWrapText(false); source.setStyle("-fx-font-family: 'monospace'; -fx-font-size: 12;");
        TextFlow preview = new TextFlow(); preview.setStyle("-fx-font-family: 'monospace'; -fx-font-size: 12; -fx-padding: 10;"); updateJsonPreview(preview, source.getText()); source.textProperty().addListener((observable, before, after) -> updateJsonPreview(preview, after));
        ScrollPane previewPane = new ScrollPane(preview); previewPane.setFitToWidth(true); VBox.setVgrow(source, Priority.ALWAYS); VBox.setVgrow(previewPane, Priority.ALWAYS);
        SplitPane panes = new SplitPane(new VBox(6, new Label("Editable OCKER JSON"), source), new VBox(6, new Label("Syntax preview · long values abbreviated"), previewPane)); panes.setDividerPositions(.5); if (owner.getWidth() < 760) panes.setOrientation(javafx.geometry.Orientation.VERTICAL);
        Label errors = new Label(); errors.setWrapText(true); errors.setStyle("-fx-text-fill: #b91c1c;");
        Button cancelEdit = new Button("Cancel"); cancelEdit.setOnAction(event -> editor.hide());
        Button pretty = new Button("Pretty print"); pretty.setOnAction(event -> { try { source.setText(Ocker.JSON.writerWithDefaultPrettyPrinter().writeValueAsString(Ocker.JSON.readTree(source.getText()))); errors.setText("Formatted JSON. Apply validates the OCKER record."); } catch (Exception error) { errors.setText("Cannot format JSON: " + error.getMessage()); } });
        Button apply = new Button("Apply"); apply.setOnAction(event -> { try { OckerRecord next = Ocker.importRecord(source.getText()); view.setRecord(next); record = next; status.setText("Edited OCKER record applied."); editor.hide(); } catch (Exception error) { errors.setText("Record was not applied: " + error.getMessage()); } });
        Region spacer = new Region(); HBox.setHgrow(spacer, Priority.ALWAYS); HBox buttons = new HBox(8, cancelEdit, spacer, pretty, apply);
        VBox notice = new VBox(4, new Label("Edit the portable OCKER record."), new Label("Provider endpoint, model and API key are excluded."));
        BorderPane root = new BorderPane(panes); root.setTop(notice); root.setBottom(new VBox(8, errors, buttons)); root.setPadding(new Insets(16)); BorderPane.setMargin(notice, new Insets(0, 0, 12, 0)); BorderPane.setMargin(root.getBottom(), new Insets(12, 0, 0, 0));
        boolean glass = theme.getValue() != ChronologyViewOptions.Theme.NONE; root.setStyle(glass ? "-fx-background-color: rgba(248,251,253,.94); -fx-border-color: rgba(255,255,255,.65); -fx-border-width: 8;" : "-fx-background-color: #f8fafc;");
        Scene scene = new Scene(root); scene.getStylesheets().add(getClass().getResource("/com/ocker/fx/ocker.css").toExternalForm()); editor.setScene(scene); editor.setWidth(Math.min(1100, Math.max(320, owner.getWidth() - 40))); editor.setHeight(Math.min(780, Math.max(400, owner.getHeight() - 40)));
        Node ownerRoot = owner.getScene() == null ? null : owner.getScene().getRoot(); Effect previous = ownerRoot == null ? null : ownerRoot.getEffect(); if (glass && ownerRoot != null) ownerRoot.setEffect(new GaussianBlur(8)); try { editor.showAndWait(); } finally { if (glass && ownerRoot != null) ownerRoot.setEffect(previous); }
    }
    private String exportRecord() { try { return Ocker.exportRecord(record); } catch (Exception error) { throw new IllegalStateException("Could not prepare OCKER JSON", error); } }
    private void updateJsonPreview(TextFlow preview, String json) {
        preview.getChildren().clear();
        for (int index = 0; index < json.length();) {
            int start = index; char first = json.charAt(index); String color = "#64748b";
            if (Character.isWhitespace(first)) {
                while (index < json.length() && Character.isWhitespace(json.charAt(index))) index++;
            } else if (first == '"') {
                index++;
                while (index < json.length() && json.charAt(index) != '"') index += json.charAt(index) == '\\' && index + 1 < json.length() ? 2 : 1;
                if (index < json.length()) index++;
                color = nextNonWhitespace(json, index) == ':' ? "#7c3aed" : "#0f766e";
            } else if ("{}[],:".indexOf(first) >= 0) index++;
            else {
                while (index < json.length() && !Character.isWhitespace(json.charAt(index)) && "{}[],:".indexOf(json.charAt(index)) < 0) index++;
                String value = json.substring(start, index);
                color = value.equals("true") || value.equals("false") || value.equals("null") ? "#b45309" : "#1d4ed8";
            }
            String token = json.substring(start, index);
            appendJson(preview, token.length() > 512 ? token.substring(0,480) + "… [" + token.length() + " characters; full value in editor]" : token, color);
        }
    }
    private int nextNonWhitespace(String value, int start) { for (int index = start; index < value.length(); index++) if (!Character.isWhitespace(value.charAt(index))) return value.charAt(index); return -1; }
    private void appendJson(TextFlow preview, String value, String color) { if (!value.isEmpty()) { Text text = new Text(value); text.setStyle("-fx-fill: " + color + ";"); preview.getChildren().add(text); } }
    private Button action(String label, Runnable action) { Button button = new Button(label); button.setOnAction(e -> { if (!busy) try { action.run(); } catch (Exception error) { showError(label.toLowerCase(Locale.ROOT), error); } }); return button; }
    private void showError(String action, Exception error) { String detail = error.getMessage(); status.setText("Couldn’t " + action + (detail == null || detail.isBlank() ? ". Try again." : ": " + detail)); }
    private Button providerPreset(String label, String providerEndpoint) { return action(label, () -> { endpoint.setText(providerEndpoint); key.clear(); status.setText(label + " selected. Enter the model you use and a key if required."); }); }
    private void configureProvider(Stage owner, FlowPane provider, FlowPane presets, TitledPane advanced) {
        Dialog<Void> dialog = new Dialog<>(); dialog.setTitle("Choose a provider"); VBox body = new VBox(12, provider, presets, advanced); body.setPadding(new Insets(4)); dialog.getDialogPane().setContent(body); dialog.getDialogPane().getButtonTypes().add(ButtonType.CLOSE); dialog.getDialogPane().setPrefWidth(640);
        try { showDocumentDialog(dialog, owner); } finally { body.getChildren().clear(); }
    }
    private void exportChoice(Stage stage) {
        Dialog<Void> dialog = new Dialog<>(); dialog.setTitle("Export chronology"); Button png = new Button("Export PNG"), pdf = new Button("Export PDF"); png.setOnAction(event -> { dialog.close(); export(stage, true); }); pdf.setOnAction(event -> { dialog.close(); export(stage, false); }); dialog.getDialogPane().setContent(new VBox(10, new Label("Choose an export format."), new HBox(8, png, pdf))); dialog.getDialogPane().getButtonTypes().add(ButtonType.CLOSE); showDocumentDialog(dialog, stage);
    }
    private FileChooser chooser(String title, String extension) { FileChooser chooser = new FileChooser(); chooser.setTitle(title); chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter(extension.toUpperCase(), "*." + extension)); return chooser; }
    private void open(Stage stage) { var file = chooser("Open saved chronology", "json").showOpenDialog(stage); if (file != null) try { OckerRecord next = Ocker.importRecord(Files.readString(file.toPath())); view.setRecord(next); record = next; queued.clear(); status.setText("Saved chronology opened and evidence verified."); } catch (Exception error) { showError("open the saved chronology", error); } }
    private void loadExample() { try (InputStream input = getClass().getResourceAsStream("/joe-jill.ocker.json")) { if (input == null) throw new IllegalStateException("Bundled Joe and Jill Blogs example is unavailable."); OckerRecord next = Ocker.importRecord(new String(input.readAllBytes(), StandardCharsets.UTF_8)); view.setRecord(next); record = next; queued.clear(); status.setText("Example ready · " + record.events().size() + " events and " + record.relationships().size() + " related assessments. No provider was used."); } catch (Exception error) { showError("load the example", error); } }
    private void save(Stage stage) { var file = chooser("Save OCKER", "json").showSaveDialog(stage); if (file != null) try { Files.writeString(file.toPath(), Ocker.exportRecord(record)); status.setText("Chronology saved as OCKER JSON."); } catch (Exception error) { showError("save the chronology", error); } }
    private void export(Stage stage, boolean png) { var file = chooser("Export view", png ? "png" : "pdf").showSaveDialog(stage); if (file != null) try { if (png) view.exportPng(file.toPath()); else view.exportPdf(file.toPath()); status.setText("Export saved."); } catch (Exception error) { showError("export the chronology", error); } }
    private void importDocuments(Stage stage) {
        FileChooser chooser = new FileChooser(); chooser.setTitle("Add documents"); chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("PDF, text, RTF or DOCX", "*.pdf", "*.txt", "*.rtf", "*.docx"));
        var files = chooser.showOpenMultipleDialog(stage);
        if (files == null) return;
        List<DocumentChoice> selected = new ArrayList<>();
        for (var file : files) chooseDocumentType(stage, file).ifPresent(type -> selected.add(new DocumentChoice(file.toPath(), file.getName(), type)));
        List<DocumentChoice> choices = List.copyOf(selected);
        if (!choices.isEmpty()) { status.setText("Adding " + choices.size() + " document" + (choices.size() == 1 ? "…" : "s…")); run(() -> { List<Intermediate> pending = new ArrayList<>(); for (DocumentChoice choice : choices) pending.add(Ocker.parseDocument(choice.path(), UUID.randomUUID().toString(), choice.name(), choice.type(), work(null))); queued.addAll(pending); return record; }, () -> status.setText("Documents ready · " + queued.size() + " queued. Next, choose a provider and select Build chronology.")); }
    }
    private Optional<String> chooseDocumentType(Stage stage, java.io.File file) {
        Dialog<ButtonType> dialog = new Dialog<>();
        dialog.setTitle("Add document");
        ComboBox<String> type = new ComboBox<>(); type.getItems().setAll("affidavit", "order", "report"); type.setValue("affidavit"); type.setMaxWidth(Double.MAX_VALUE);
        Label name = new Label(file.getName()); name.setWrapText(true);
        VBox content = new VBox(8, new Label("Document"), name, new Label("Type"), type); content.setPadding(new Insets(2));
        ButtonType add = new ButtonType("Add", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().setContent(content); dialog.getDialogPane().getButtonTypes().addAll(add, ButtonType.CANCEL); dialog.getDialogPane().setPrefWidth(360); dialog.getDialogPane().setMaxWidth(420);
        return showDocumentDialog(dialog, stage).filter(result -> result == add).map(result -> type.getValue());
    }
    private <T> Optional<T> showDocumentDialog(Dialog<T> dialog, Stage stage) {
        dialog.initOwner(stage);
        if (theme.getValue() == ChronologyViewOptions.Theme.NONE) return dialog.showAndWait();
        dialog.getDialogPane().setStyle("-fx-background-color: rgba(248,251,253,.92); -fx-border-color: rgba(255,255,255,.65); -fx-border-width: 8; -fx-background-radius: 16; -fx-border-radius: 16;");
        Node owner = stage.getScene() == null ? null : stage.getScene().getRoot(); Effect previous = owner == null ? null : owner.getEffect();
        if (owner != null) owner.setEffect(new GaussianBlur(8)); try { return dialog.showAndWait(); } finally { if (owner != null) owner.setEffect(previous); }
    }
    private CompletionAdapter adapter() { if (endpoint.getText().isBlank() || model.getText().isBlank()) throw new IllegalStateException("Enter endpoint and model."); if (key.getText().isBlank() && !loopbackEndpoint(endpoint.getText())) throw new IllegalStateException("Enter an API key unless using a local Ollama endpoint."); return new OpenAICompatibleAdapter(endpoint.getText(), model.getText(), key.getText()); }
    private boolean loopbackEndpoint(String value) { try { String host = java.net.URI.create(value).getHost(); return "localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host) || "::1".equals(host); } catch (IllegalArgumentException error) { return false; } }
    private OckerOptions work(CompletionAdapter adapter) { return OckerOptions.builder().llm(adapter).cancellation(cancelled::get).onProgress(progress -> Platform.runLater(() -> status.setText(progress.phase() + ": " + progress.message()))).build(); }
    private void build() { if (queued.isEmpty()) throw new IllegalStateException("Add at least one document, then choose a provider."); CompletionAdapter adapter = adapter(); List<Intermediate> input = List.copyOf(queued); status.setText("Building chronology: extracting accounts, then checking direct relationships…"); run(() -> { OckerRecord next = Ocker.createRecord("Imported document chronology"); for (Intermediate item : input) next = Ocker.buildChronology(next, item, work(adapter)); return Ocker.findRelationships(next, work(adapter)); }); }
    private void run(Work work) { run(work, null); }
    private void run(Work work, Runnable success) { if (busy) return; busy = true; commands.setDisable(true); cancelled.set(false); Task<OckerRecord> task = new Task<>() { protected OckerRecord call() throws Exception { return work.get(); } }; task.setOnSucceeded(e -> { if (!cancelled.get()) { OckerRecord next = task.getValue(); view.setRecord(next); record = next; if (success == null) status.setText("Ready · " + record.events().size() + " events · " + record.relationships().size() + " relationships · " + queued.size() + " queued documents"); else success.run(); } done(); }); task.setOnFailed(e -> { if (cancelled.get()) status.setText("Cancelled. The displayed chronology was not changed."); else showError("complete the operation", task.getException() instanceof Exception error ? error : new Exception(task.getException())); done(); }); Thread worker = new Thread(task, "ocker-operation"); worker.setDaemon(true); worker.start(); }
    private void done() { busy = false; commands.setDisable(false); }
    private record DocumentChoice(Path path, String name, String type) { }
    @FunctionalInterface private interface Work { OckerRecord get() throws Exception; }
    public static void main(String[] args) { launch(args); }
}
