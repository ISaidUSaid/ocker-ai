// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;
import org.junit.jupiter.api.Test; import static org.junit.jupiter.api.Assertions.*; import static com.ocker.core.OckerTypes.*; import java.time.*; import java.util.*; import java.nio.file.*; import com.fasterxml.jackson.databind.JsonNode; import org.apache.poi.xwpf.usermodel.XWPFDocument;
class OckerTest {
 @Test void publicPromptLibraryUsesOneSelectedLanguageAndFallsBackToEnglish() {
  assertTrue(Ocker.prompt(PromptLocale.ES,"extract").startsWith("Lee los párrafos"));
  assertTrue(Ocker.prompt(PromptLocale.PT,"relate").startsWith("Compare os relatos"));
  assertTrue(Ocker.prompt(PromptLocale.FR,"extract").startsWith("Lis les paragraphes"));
  assertTrue(Ocker.prompt(PromptLocale.DE,"relate").startsWith("Vergleiche die bereitgestellten"));
  assertTrue(Ocker.prompt(PromptLocale.fromLanguageTag("zz-AU"),"extract").startsWith("Read the supplied"));
  assertEquals(PromptLocale.PT,PromptLocale.fromLanguageTag("pt-BR"));
 }
 @Test void successfulAdaptersUseTextOnlyAndDeduplicateRelationships() throws Exception {
  Path source=Files.createTempFile("ocker-account", ".txt"); Files.writeString(source,"Joe's account");
  var pdf=Ocker.parseDocument(source,"d","Joe","affidavit",OckerOptions.builder().build());
  var first=pdf.document().paragraphs().getFirst();
  CompletionAdapter extraction=(task,prompt,input,cancel)->{
   assertEquals("extract",task);assertTrue(prompt.startsWith("Read the supplied document paragraphs"));
   assertFalse(input.has("asset"));assertFalse(input.has("data"));assertTrue(input.has("paragraphs"));
   var out=Ocker.JSON.createObjectNode();var list=out.putArray("events");
   for(int n=0;n<2;n++){var e=list.addObject();e.put("title","Account "+n);e.put("summary",first.text());e.put("assertedBy","Joe Blogs");e.putObject("date").put("precision","unknown");e.putArray("paragraphIds").add(first.id());}
   return out;
  };
  var record=Ocker.buildChronology(Ocker.createRecord("Test"),pdf,OckerOptions.builder().llm(extraction).build());
  assertEquals(2,record.events().size());assertEquals(first.text(),record.events().getFirst().sources().getFirst().quote());
  CompletionAdapter relating=(task,prompt,input,cancel)->{
   assertEquals("relate",task);assertTrue(prompt.startsWith("Compare the supplied attributed chronology accounts"));
   var out=Ocker.JSON.createObjectNode();var list=out.putArray("relationships");
   for(int n=0;n<2;n++){var edge=list.addObject();edge.put("from",record.events().get(n).id());edge.put("to",record.events().get(1-n).id());edge.put("type","supports");edge.put("rationale","The same source account.");}
   return out;
  };
  var related=Ocker.findRelationships(record,OckerOptions.builder().llm(relating).build());assertEquals(1,related.relationships().size());
  assertNotNull(Ocker.parseRecord(Ocker.exportRecord(related)));
 }
 @Test void importsPlainTextRtfAndDocxWithOriginalAssets() throws Exception {
  Path directory=Files.createTempDirectory("ocker-documents");
  Path text=directory.resolve("account.txt");Files.writeString(text,"First account\n\nSecond account");
  Path rtf=directory.resolve("account.rtf");Files.writeString(rtf,"{\\rtf1\\ansi First \\b account\\b0\\par Second account}");
  Path docx=directory.resolve("account.docx");try(XWPFDocument document=new XWPFDocument();var output=Files.newOutputStream(docx)){document.createParagraph().createRun().setText("DOCX account");document.write(output);}
  for(Path path:List.of(text,rtf,docx)){Intermediate imported=Ocker.parseDocument(path,"d-"+path.getFileName(),path.getFileName().toString(),"report",OckerOptions.builder().build());assertFalse(imported.document().paragraphs().isEmpty());assertNotNull(imported.asset());assertArrayEquals(Files.readAllBytes(path),Base64.getDecoder().decode(imported.asset().data()));}
 }
 @Test void rawSchemaAndCalendarDatesAreEnforced() throws Exception {
   String raw=Files.readString(Path.of("..","..","..","spec","examples","joe-jill.ocker.json"));
   var missing=Ocker.JSON.readTree(raw); ((com.fasterxml.jackson.databind.node.ObjectNode)missing).remove("notes");
   assertThrows(Ocker.ValidationException.class,()->Ocker.parseRecord(missing.toString()));
   var invalid=Ocker.JSON.readTree(raw); var date=(com.fasterxml.jackson.databind.node.ObjectNode)invalid.path("events").get(0).path("date");
   date.put("precision","day");date.put("value","2026-02-30");date.remove("end");
   assertThrows(Ocker.ValidationException.class,()->Ocker.parseRecord(invalid.toString()));
   var orphan=Ocker.JSON.readTree(raw); ((com.fasterxml.jackson.databind.node.ObjectNode)orphan.path("notes").get(0)).put("authorId","missing");
   assertThrows(Ocker.ValidationException.class,()->Ocker.parseRecord(orphan.toString()));
 }

 @Test void exportRoundTripAndMutationsPreserveContract() throws Exception {OckerRecord r=Ocker.createRecord("Test");Event e=new Event("e","Event","summary",new DateValue("day","2026-01-01",null,null,null),null,List.of(),List.of(),null,null,null);r=new OckerRecord(r.format(),r.version(),r.id(),r.title(),r.createdAt(),r.updatedAt(),List.of(),List.of(),List.of(e),List.of(),List.of(),List.of(),List.of(),Map.of("vendor",Map.of("x",1)));r=Ocker.addNote(r,"e","a note",12,5,null);OckerRecord p=Ocker.parseRecord(Ocker.exportRecord(r));assertEquals("a note",p.notes().getFirst().body());assertEquals(12,p.notes().getFirst().position().x());assertEquals(1,p.extensions().size());}
 @Test void rejectsMissingSourceEvidenceAndOtherRelationshipTypes(){OckerRecord r=Ocker.createRecord("T");Event e=new Event("e","E","s",new DateValue("day","2026",null,null,null),null,List.of(),List.of(new Source("missing",null,null,"quote",null,null)),null,null,null);OckerRecord bad=new OckerRecord(r.format(),r.version(),r.id(),r.title(),r.createdAt(),r.updatedAt(),List.of(),List.of(),List.of(e),List.of(),List.of(),List.of(),List.of(),null);assertThrows(Ocker.ValidationException.class,()->Ocker.validate(bad));}
 @Test void strictImportRejectsInvalidDateAndUnknownDateValue() {String now="2026-01-01T00:00:00Z";String bad="{\"format\":\"ocker\",\"version\":\"0.1.0\",\"id\":\"r\",\"title\":\"R\",\"createdAt\":\""+now+"\",\"updatedAt\":\""+now+"\",\"actors\":[],\"documents\":[],\"events\":[{\"id\":\"e\",\"title\":\"E\",\"summary\":\"\",\"date\":{\"precision\":\"day\",\"value\":\"2026-2-1\"},\"sources\":[]}],\"relationships\":[],\"notes\":[],\"authorities\":[],\"assets\":[]}";assertThrows(Ocker.ValidationException.class,()->Ocker.parseRecord(bad));String unknown=bad.replace("\"precision\":\"day\",\"value\":\"2026-2-1\"","\"precision\":\"unknown\",\"value\":\"2026-01-01\"");assertThrows(Ocker.ValidationException.class,()->Ocker.parseRecord(unknown));}
 @Test void crossRuntimeJoeJillFixtureRoundTrips() throws Exception {
  Path root=Path.of("..","..","..","spec","examples");String raw=Files.readString(root.resolve("joe-jill.ocker.json"));OckerRecord record=Ocker.parseRecord(raw);
  assertEquals(46,record.events().size());assertEquals(4,record.relationships().size());assertEquals(4,record.relationships().stream().filter(relationship->"contradicts".equals(relationship.type())).count());assertEquals(2,record.notes().size());assertEquals(1,record.authorities().size());assertFalse(record.assets().isEmpty());assertTrue(record.events().stream().anyMatch(event->"agreed".equals(event.status())));assertTrue(record.notes().stream().anyMatch(note->!note.body().isBlank()));assertTrue(record.authorities().stream().anyMatch(authority->"Briginshaw v Briginshaw".equals(authority.title())&&!authority.body().isBlank()));
  JsonNode original=Ocker.JSON.readTree(raw), roundTrip=Ocker.JSON.readTree(Ocker.exportRecord(record));assertEquals(original.path("events"),roundTrip.path("events"));assertEquals(original.path("relationships"),roundTrip.path("relationships"));assertEquals(original.path("assets"),roundTrip.path("assets"));assertEquals(original.path("notes").get(0).path("body"),roundTrip.path("notes").get(0).path("body"));assertEquals(original.path("notes").get(0).path("position").path("x").asDouble(),roundTrip.path("notes").get(0).path("position").path("x").asDouble());
  assertNotNull(Ocker.parseIntermediate(Files.readString(root.resolve("joe-affidavit.document.json"))));assertNotNull(Ocker.parseIntermediate(Files.readString(root.resolve("jill-affidavit.document.json"))));
  String assetSha=original.path("assets").get(0).path("sha256").asText();String corrupt=raw.replace(assetSha,(assetSha.startsWith("0")?"1":"0")+assetSha.substring(1));assertThrows(Ocker.ValidationException.class,()->Ocker.parseRecord(corrupt));
 }
 @Test void adapterRejectsInvalidJsonUnknownSourceAndCancellation() throws Exception {Intermediate in=new Intermediate("ocker-document","0.1.0",new Document("d","D","report",null,null,List.of(new Paragraph("p",1,null,"Evidence"))),null);OckerRecord base=Ocker.createRecord("R");assertThrows(Ocker.ValidationException.class,()->Ocker.buildChronology(base,in,OckerOptions.builder().llm((a,b,c,d)->Ocker.JSON.createArrayNode()).build()));CompletionAdapter unknown=(a,b,c,d)->Ocker.JSON.readTree("{\"events\":[{\"title\":\"T\",\"summary\":\"S\",\"date\":{\"precision\":\"unknown\"},\"paragraphIds\":[\"nope\"]}]}");assertThrows(Ocker.ValidationException.class,()->Ocker.buildChronology(base,in,OckerOptions.builder().llm(unknown).build()));assertThrows(java.util.concurrent.CancellationException.class,()->Ocker.buildChronology(base,in,OckerOptions.builder().cancellation(()->true).llm((a,b,c,d)->fail("provider called")).build()));}
}
