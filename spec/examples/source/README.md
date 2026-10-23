# Joe and Jill source fixtures

The PDF and DOCX files are the original Joe Blogs and Jill Blogs test affidavits supplied for this project, copied unchanged at Adam’s request. These are fictional test documents, not real client affidavits.

`accounts.json` is an allowlisted projection of the tested production chronology, verified read-only against its current stored artifact on 24 October 2026. That artifact was generated on 20 October 2026. It preserves its 46 displayed event cards, summaries, dates, common-ground/contested status and four direct contradiction links. The five cards hidden by the original chronology are omitted. Partial-overlap, contextual and other advanced links are omitted. No account/timeline/document UUIDs, embeddings, models, prompt details, message assessments, matching/scoring fields or old annotations are included.

The sample builder adds fresh explanatory post-its and a research flag linking to the High Court’s Briginshaw judgment. Those annotations demonstrate UI functionality and are not part of the source production record. They require normal practitioner review before use in a matter.

Every included quote is checked against the text extracted from its original PDF page. Non-PDF DOCX fixtures exercise the generic importer; the demonstration record embeds the original PDFs. Import your own documents and configure an LLM for a new build. This saved example is an imported result, never presented as a fresh LLM run.

Regenerate the portable and intermediate fixtures with `node spec/tools/build-examples.js`.
