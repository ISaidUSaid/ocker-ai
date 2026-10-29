// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {normalisePromptLocale} from '../src/pipeline.js';

export const DEMO_LOCALES=[['en','English'],['es','Español'],['pt','Português'],['fr','Français'],['de','Deutsch']];
const en={language:'Language',theme:'Dialog theme',glass:'Glass',none:'None',start:'Start with documents',startHelp:'Choose a starting point. Add more documents whenever you need to.',addDocuments:'Add documents',addDocument:'Add document',chooseDocumentTypes:'Choose the document type for each document before importing.',documentType:'Document type',affidavit:'Affidavit',order:'Order',report:'Report',paste:'Paste',pasteRichText:'Paste rich text',importFile:'Import OCKER file',example:'Just want to see an example?',loadExample:'Joe and Jill Blogs Example Chronology',provider:'Choose a provider',configure:'Configure provider',model:'Model',apiKey:'API key',protocol:'API protocol',endpoint:'Provider endpoint',advancedProvider:'Advanced provider settings',build:'Build chronology',cancel:'Cancel',notice:'Building sends your document text to the selected provider to create events and compare accounts.',review:'Review and share',statusStart:'Choose a starting point above. Your API key stays in memory only.',intro:'Start with your documents, open a saved chronology, or try the example. Connect an AI provider only when you want to build from documents.',browser:'This example runs in your browser. Your key stays in memory; document text goes directly to your selected provider only when you choose Build chronology.',next:'Next:',connect:'Connect AI provider',addNote:'Add note',addAuthority:'Add precedent',editNote:'Edit note',editAuthority:'Edit precedent',saveNote:'Save note',saveAuthority:'Save precedent',delete:'Delete',close:'Close',notes:'Notes',noteText:'Your note',authorityTitle:'Authority title',authorityType:'Authority type',citation:'Citation',colour:'Flag colour',pinpoint:'Pinpoint reference',court:'Court',jurisdiction:'Jurisdiction',sourceUrl:'Source URL',application:'Application to this event',binding:'Binding',persuasive:'Persuasive',unspecified:'Not specified',evidence:'Source evidence',related:'Related',exportJson:'Export OCKER',viewSource:'View authority source',dragNote:'Drag note by its pin',dragAuthority:'Drag precedent to an outside card edge',commonGround:'Common ground',showCode:'Show code',hideCode:'Hide code',referenceImplementation:'Reference implementation',copyCode:'Copy code',copied:'Copied',copySelected:'Code selected—copy with your keyboard.',saveJson:'Save JSON',exportPng:'Export PNG',exportPdf:'Export PDF',openChronologyBeforeExport:'Open a chronology before exporting.',editOckerFile:'Edit OCKER file',prettyPrint:'Pretty print',applyChanges:'Apply changes',editorIntro:'Edit the portable OCKER record. Invalid JSON will not be applied.',providerShortcuts:'Provider shortcuts'};
const copy=(overrides)=>({...en,...overrides});
const translations={
 en,
 es:copy({language:'Idioma',theme:'Tema del diálogo',glass:'Cristal',none:'Sin cristal',start:'Comenzar con documentos',startHelp:'Elige un punto de partida. Puedes añadir más documentos cuando lo necesites.',addDocuments:'Añadir documentos',addDocument:'Añadir documento',chooseDocumentTypes:'Elige el tipo de cada documento antes de importarlo.',documentType:'Tipo de documento',affidavit:'Declaración jurada',order:'Orden',report:'Informe',paste:'Pegar',pasteRichText:'Pegar texto enriquecido',importFile:'Importar archivo OCKER',example:'¿Solo quieres ver un ejemplo?',loadExample:'Cronología de ejemplo de Joe y Jill Blogs',provider:'Elegir proveedor',configure:'Configurar proveedor',model:'Modelo',apiKey:'Clave API',protocol:'Protocolo API',endpoint:'Extremo del proveedor',advancedProvider:'Configuración avanzada del proveedor',build:'Crear cronología',cancel:'Cancelar',notice:'Al crear la cronología, el texto del documento se envía al proveedor seleccionado para crear eventos y comparar relatos.',review:'Revisar y compartir',statusStart:'Elige un punto de partida. Tu clave API permanece solo en memoria.',intro:'Empieza con tus documentos, abre una cronología guardada o prueba el ejemplo. Solo necesitas un proveedor de IA para crear desde documentos.',browser:'Este ejemplo funciona en tu navegador. Tu clave permanece en memoria; el texto del documento solo se envía a tu proveedor al crear la cronología.',next:'Siguiente:',connect:'Conectar proveedor de IA',addNote:'Añadir nota',addAuthority:'Añadir precedente',editNote:'Editar nota',editAuthority:'Editar precedente',saveNote:'Guardar nota',saveAuthority:'Guardar precedente',delete:'Eliminar',close:'Cerrar',notes:'Notas',noteText:'Tu nota',authorityTitle:'Título de la autoridad',authorityType:'Tipo de autoridad',citation:'Cita',colour:'Color de la etiqueta',pinpoint:'Referencia concreta',court:'Tribunal',jurisdiction:'Jurisdicción',sourceUrl:'URL de la fuente',application:'Aplicación a este evento',binding:'Vinculante',persuasive:'Persuasiva',unspecified:'Sin especificar',evidence:'Evidencia fuente',related:'Relacionado',exportJson:'Exportar OCKER',viewSource:'Ver fuente de la autoridad',dragNote:'Arrastra la nota por su chincheta',dragAuthority:'Arrastra el precedente al borde exterior de la tarjeta',commonGround:'Punto común',showCode:'Mostrar código',hideCode:'Ocultar código',referenceImplementation:'Implementación de referencia',copyCode:'Copiar código',copied:'Copiado',copySelected:'Código seleccionado; cópialo con el teclado.',saveJson:'Guardar JSON',exportPng:'Exportar PNG',exportPdf:'Exportar PDF',openChronologyBeforeExport:'Abre una cronología antes de exportar.',editOckerFile:'Editar archivo OCKER',prettyPrint:'Formatear',applyChanges:'Aplicar cambios',editorIntro:'Edita el registro portátil OCKER. JSON no válido no se aplicará.',providerShortcuts:'Atajos de proveedores'}),
 pt:copy({language:'Idioma',theme:'Tema da caixa de diálogo',glass:'Vidro',none:'Sem vidro',start:'Comece com documentos',startHelp:'Escolha um ponto de partida. Adicione mais documentos quando precisar.',addDocuments:'Adicionar documentos',addDocument:'Adicionar documento',chooseDocumentTypes:'Escolha o tipo de cada documento antes de importar.',documentType:'Tipo de documento',affidavit:'Declaração juramentada',order:'Ordem',report:'Relatório',paste:'Colar',pasteRichText:'Colar texto rico',importFile:'Importar arquivo OCKER',example:'Só quer ver um exemplo?',loadExample:'Cronologia de exemplo de Joe e Jill Blogs',provider:'Escolha um provedor',configure:'Configurar provedor',model:'Modelo',apiKey:'Chave de API',protocol:'Protocolo da API',endpoint:'Endpoint do provedor',advancedProvider:'Configurações avançadas do provedor',build:'Criar cronologia',cancel:'Cancelar',notice:'Ao criar a cronologia, o texto do documento é enviado ao provedor escolhido para criar eventos e comparar relatos.',review:'Revisar e compartilhar',statusStart:'Escolha um ponto de partida. Sua chave de API fica somente na memória.',intro:'Comece com seus documentos, abra uma cronologia salva ou experimente o exemplo. Você só precisa de um provedor de IA para criar a partir de documentos.',browser:'Este exemplo funciona no seu navegador. Sua chave fica na memória; o texto do documento vai diretamente ao provedor escolhido apenas quando você cria a cronologia.',next:'Próximo:',connect:'Conectar provedor de IA',addNote:'Adicionar nota',addAuthority:'Adicionar precedente',editNote:'Editar nota',editAuthority:'Editar precedente',saveNote:'Salvar nota',saveAuthority:'Salvar precedente',delete:'Excluir',close:'Fechar',notes:'Notas',noteText:'Sua nota',authorityTitle:'Título da autoridade',authorityType:'Tipo de autoridade',citation:'Citação',colour:'Cor da etiqueta',pinpoint:'Referência específica',court:'Tribunal',jurisdiction:'Jurisdição',sourceUrl:'URL da fonte',application:'Aplicação a este evento',binding:'Vinculante',persuasive:'Persuasiva',unspecified:'Não especificado',evidence:'Prova de origem',related:'Relacionados',exportJson:'Exportar OCKER',viewSource:'Ver fonte da autoridade',dragNote:'Arraste a nota pelo alfinete',dragAuthority:'Arraste o precedente até a borda exterior do cartão',commonGround:'Ponto em comum',showCode:'Mostrar código',hideCode:'Ocultar código',referenceImplementation:'Implementação de referência',copyCode:'Copiar código',copied:'Copiado',copySelected:'Código selecionado; copie com o teclado.',saveJson:'Salvar JSON',exportPng:'Exportar PNG',exportPdf:'Exportar PDF',openChronologyBeforeExport:'Abra uma cronologia antes de exportar.',editOckerFile:'Editar arquivo OCKER',prettyPrint:'Formatar',applyChanges:'Aplicar alterações',editorIntro:'Edite o registro portátil OCKER. JSON inválido não será aplicado.',providerShortcuts:'Atalhos de provedores'}),
 fr:copy({language:'Langue',theme:'Thème de la boîte de dialogue',glass:'Verre',none:'Sans verre',start:'Commencer avec des documents',startHelp:'Choisissez un point de départ. Ajoutez des documents lorsque nécessaire.',addDocuments:'Ajouter des documents',paste:'Coller',importFile:'Importer un fichier OCKER',example:'Vous voulez seulement voir un exemple ?',loadExample:'Exemple de chronologie de Joe et Jill Blogs',provider:'Choisir un fournisseur',configure:'Configurer le fournisseur',model:'Modèle',apiKey:'Clé API',protocol:'Protocole API',endpoint:'Point de terminaison du fournisseur',build:'Créer la chronologie',cancel:'Annuler',notice:'La création envoie le texte du document au fournisseur choisi pour créer les événements et comparer les récits.',review:'Réviser et partager',statusStart:'Choisissez un point de départ. Votre clé API reste uniquement en mémoire.',intro:'Commencez avec vos documents, ouvrez une chronologie enregistrée ou essayez l’exemple. Un fournisseur d’IA est nécessaire seulement pour créer depuis des documents.',browser:'Cet exemple s’exécute dans votre navigateur. Votre clé reste en mémoire ; le texte du document va directement au fournisseur choisi uniquement lors de la création.',next:'Suivant :',connect:'Connecter un fournisseur IA',addNote:'Ajouter une note',addAuthority:'Ajouter un précédent',editNote:'Modifier la note',editAuthority:'Modifier le précédent',saveNote:'Enregistrer la note',saveAuthority:'Enregistrer le précédent',delete:'Supprimer',close:'Fermer',notes:'Notes',noteText:'Votre note',authorityTitle:'Titre de l’autorité',authorityType:'Type d’autorité',citation:'Citation',colour:'Couleur de l’onglet',pinpoint:'Référence précise',court:'Juridiction',jurisdiction:'Compétence',sourceUrl:'URL de la source',application:'Application à cet événement',binding:'Contraignant',persuasive:'Persuasif',unspecified:'Non précisé',evidence:'Élément source',related:'Associé',exportJson:'Exporter OCKER',viewSource:'Voir la source de l’autorité',dragNote:'Faites glisser la note par sa punaise',commonGround:'Point commun'}),
 de:copy({language:'Sprache',theme:'Dialogthema',glass:'Glas',none:'Ohne Glas',start:'Mit Dokumenten beginnen',startHelp:'Wählen Sie einen Ausgangspunkt. Sie können jederzeit weitere Dokumente hinzufügen.',addDocuments:'Dokumente hinzufügen',paste:'Einfügen',importFile:'OCKER-Datei importieren',example:'Möchten Sie nur ein Beispiel sehen?',loadExample:'Joe und Jill Blogs Beispielchronologie',provider:'Anbieter auswählen',configure:'Anbieter konfigurieren',model:'Modell',apiKey:'API-Schlüssel',protocol:'API-Protokoll',endpoint:'Anbieter-Endpunkt',build:'Chronologie erstellen',cancel:'Abbrechen',notice:'Beim Erstellen wird Ihr Dokumenttext an den ausgewählten Anbieter gesendet, um Ereignisse zu erstellen und Darstellungen zu vergleichen.',review:'Prüfen und teilen',statusStart:'Wählen Sie oben einen Ausgangspunkt. Ihr API-Schlüssel bleibt nur im Speicher.',intro:'Beginnen Sie mit Ihren Dokumenten, öffnen Sie eine gespeicherte Chronologie oder probieren Sie das Beispiel. Ein KI-Anbieter ist nur nötig, um aus Dokumenten zu erstellen.',browser:'Dieses Beispiel läuft in Ihrem Browser. Ihr Schlüssel bleibt im Speicher; Dokumenttext geht nur beim Erstellen direkt an den ausgewählten Anbieter.',next:'Nächster Schritt:',connect:'KI-Anbieter verbinden',addNote:'Notiz hinzufügen',addAuthority:'Präzedenzfall hinzufügen',editNote:'Notiz bearbeiten',editAuthority:'Präzedenzfall bearbeiten',saveNote:'Notiz speichern',saveAuthority:'Präzedenzfall speichern',delete:'Löschen',close:'Schließen',notes:'Notizen',noteText:'Ihre Notiz',authorityTitle:'Titel der Autorität',authorityType:'Art der Autorität',citation:'Fundstelle',colour:'Farbe der Markierung',pinpoint:'Fundstelle im Detail',court:'Gericht',jurisdiction:'Gerichtsbarkeit',sourceUrl:'Quell-URL',application:'Anwendung auf dieses Ereignis',binding:'Bindend',persuasive:'Überzeugend',unspecified:'Nicht angegeben',evidence:'Quellennachweis',related:'Verknüpft',exportJson:'OCKER exportieren',viewSource:'Quelle der Autorität ansehen',dragNote:'Notiz am Pin ziehen',commonGround:'Gemeinsamer Punkt'})
};

export function browserLocale(search=globalThis.location?.search,language=globalThis.navigator?.language) { return normalisePromptLocale(new URLSearchParams(search??'').get('lang')??language); }
const shell={
 en:{compare:'Compare accounts',aiOnly:'AI is only needed to build from documents. Examples and saved chronologies open straight away.',modelHelp:'Enter the model you want to use.',memoryOnly:'Kept in memory only',ollamaOptional:'Optional for local Ollama',pipeline:'Your chronology will include source-linked events, common ground and possible contradictions. You can follow each event back to the original document.',exportIntermediate:'Export intermediate JSON',textParagraphs:'text paragraphs',remove:'Remove',documentsAdded:'Documents added. Connect your provider, then choose Build chronology.',pasteHint:'Paste notes or a document excerpt',addPasted:'Add pasted text',documentTitle:'Document title',documentText:'Document text',pastedDocument:'Pasted document',pasteGuidance:'Paste from Word or another editor. Formatting is kept in the source asset; chronology building uses the text.',reading:'Reading',documentsReady:'documents ready to build.',importFailed:'Import failed.',pasteFailed:'Paste failed.',recordImported:'OCKER record imported.',exampleLoaded:'Loaded the Joe and Jill example.',findingRelationships:'Finding relationships…',built:'Chronology built with relationships.',buildFailed:'Build failed.',working:'Working. You can cancel this operation.',readyBuild:'Ready to build. We will create events and compare the accounts in one step.',chooseProvider:'Choose an AI provider to build from your documents.',enterModel:'Enter the model name supplied by your AI provider.',enterKey:'Enter your provider API key. It stays in memory only.',reviewReady:'Review your chronology, add notes and precedents, or save a copy.',addOrOpen:'Add documents, open a saved OCKER file, or try the Joe and Jill example.',cancelled:'Cancelled. Your saved chronology is unchanged.'},
 es:{compare:'Comparar relatos',aiOnly:'La IA solo es necesaria para crear desde documentos. Los ejemplos y las cronologías guardadas se abren de inmediato.',modelHelp:'Introduce el modelo que quieres usar.',memoryOnly:'Solo en memoria',ollamaOptional:'Opcional para Ollama local',pipeline:'La cronología incluirá eventos vinculados a fuentes, puntos comunes y posibles contradicciones. Puedes seguir cada evento hasta el documento original.',exportIntermediate:'Exportar JSON intermedio',textParagraphs:'párrafos de texto',remove:'Eliminar',documentsAdded:'Documentos añadidos. Conecta tu proveedor y crea la cronología.',pasteHint:'Pega notas o un extracto de documento',addPasted:'Añadir texto pegado',reading:'Leyendo',documentsReady:'documentos listos para crear.',importFailed:'Error al importar.',pasteFailed:'Error al pegar.',recordImported:'Registro OCKER importado.',exampleLoaded:'Ejemplo de Joe y Jill cargado.',findingRelationships:'Buscando relaciones…',built:'Cronología creada con relaciones.',buildFailed:'Error al crear.',working:'Trabajando. Puedes cancelar esta operación.',readyBuild:'Todo listo. Crearemos eventos y compararemos los relatos en un paso.',chooseProvider:'Elige un proveedor de IA para crear desde tus documentos.',enterModel:'Introduce el nombre del modelo proporcionado por tu proveedor.',enterKey:'Introduce tu clave API. Permanece solo en memoria.',reviewReady:'Revisa tu cronología, añade notas y precedentes, o guarda una copia.',addOrOpen:'Añade documentos, abre un archivo OCKER o prueba el ejemplo de Joe y Jill.',cancelled:'Cancelado. Tu cronología guardada no ha cambiado.'},
 pt:{compare:'Comparar relatos',aiOnly:'A IA só é necessária para criar a partir de documentos. Exemplos e cronologias salvas abrem imediatamente.',modelHelp:'Informe o modelo que deseja usar.',memoryOnly:'Mantido apenas na memória',ollamaOptional:'Opcional para Ollama local',pipeline:'A cronologia incluirá eventos vinculados às fontes, pontos em comum e possíveis contradições. Você pode seguir cada evento até o documento original.',exportIntermediate:'Exportar JSON intermediário',textParagraphs:'parágrafos de texto',remove:'Excluir',documentsAdded:'Documentos adicionados. Conecte o provedor e crie a cronologia.',pasteHint:'Cole notas ou um trecho de documento',addPasted:'Adicionar texto colado',reading:'Lendo',documentsReady:'documentos prontos para criar.',importFailed:'Falha na importação.',pasteFailed:'Falha ao colar.',recordImported:'Registro OCKER importado.',exampleLoaded:'Exemplo de Joe e Jill carregado.',findingRelationships:'Localizando relações…',built:'Cronologia criada com relações.',buildFailed:'Falha ao criar.',working:'Trabalhando. Você pode cancelar esta operação.',readyBuild:'Tudo pronto. Criaremos eventos e compararemos os relatos em uma etapa.',chooseProvider:'Escolha um provedor de IA para criar a partir dos seus documentos.',enterModel:'Informe o nome do modelo do seu provedor.',enterKey:'Informe sua chave de API. Ela fica apenas na memória.',reviewReady:'Revise sua cronologia, adicione notas e precedentes ou salve uma cópia.',addOrOpen:'Adicione documentos, abra um arquivo OCKER ou experimente o exemplo de Joe e Jill.',cancelled:'Cancelado. Sua cronologia salva não mudou.'},
 fr:{compare:'Comparer les récits',aiOnly:'L’IA est nécessaire uniquement pour créer à partir de documents. Les exemples et chronologies enregistrées s’ouvrent immédiatement.',modelHelp:'Saisissez le modèle à utiliser.',memoryOnly:'Conservée seulement en mémoire',ollamaOptional:'Facultatif pour Ollama local',pipeline:'La chronologie comprendra des événements liés aux sources, des points communs et d’éventuelles contradictions. Chaque événement renvoie au document original.',exportIntermediate:'Exporter le JSON intermédiaire',textParagraphs:'paragraphes de texte',remove:'Supprimer',documentsAdded:'Documents ajoutés. Connectez votre fournisseur, puis créez la chronologie.',pasteHint:'Collez des notes ou un extrait de document',addPasted:'Ajouter le texte collé',reading:'Lecture',documentsReady:'documents prêts à créer.',importFailed:'Échec de l’importation.',pasteFailed:'Échec du collage.',recordImported:'Dossier OCKER importé.',exampleLoaded:'Exemple de Joe et Jill chargé.',findingRelationships:'Recherche des relations…',built:'Chronologie créée avec relations.',buildFailed:'Échec de la création.',working:'Traitement en cours. Vous pouvez annuler cette opération.',readyBuild:'Tout est prêt. Nous créerons les événements et comparerons les récits en une étape.',chooseProvider:'Choisissez un fournisseur IA pour créer depuis vos documents.',enterModel:'Saisissez le nom de modèle fourni par votre fournisseur.',enterKey:'Saisissez votre clé API. Elle reste uniquement en mémoire.',reviewReady:'Révisez votre chronologie, ajoutez des notes et précédents, ou enregistrez une copie.',addOrOpen:'Ajoutez des documents, ouvrez un fichier OCKER ou essayez l’exemple de Joe et Jill.',cancelled:'Annulé. Votre chronologie enregistrée reste inchangée.'},
 de:{compare:'Darstellungen vergleichen',aiOnly:'KI wird nur benötigt, um aus Dokumenten zu erstellen. Beispiele und gespeicherte Chronologien öffnen sich sofort.',modelHelp:'Geben Sie das gewünschte Modell ein.',memoryOnly:'Nur im Speicher',ollamaOptional:'Optional für lokales Ollama',pipeline:'Die Chronologie enthält quellenverknüpfte Ereignisse, gemeinsame Punkte und mögliche Widersprüche. Jedes Ereignis führt zum Originaldokument zurück.',exportIntermediate:'Zwischen-JSON exportieren',textParagraphs:'Textabsätze',remove:'Löschen',documentsAdded:'Dokumente hinzugefügt. Verbinden Sie Ihren Anbieter und erstellen Sie dann die Chronologie.',pasteHint:'Notizen oder einen Dokumentauszug einfügen',addPasted:'Eingefügten Text hinzufügen',reading:'Wird gelesen',documentsReady:'Dokumente bereit zum Erstellen.',importFailed:'Import fehlgeschlagen.',pasteFailed:'Einfügen fehlgeschlagen.',recordImported:'OCKER-Datensatz importiert.',exampleLoaded:'Joe-und-Jill-Beispiel geladen.',findingRelationships:'Beziehungen werden gesucht…',built:'Chronologie mit Beziehungen erstellt.',buildFailed:'Erstellung fehlgeschlagen.',working:'Wird verarbeitet. Sie können diesen Vorgang abbrechen.',readyBuild:'Bereit. Ereignisse und Darstellungen werden in einem Schritt verglichen.',chooseProvider:'Wählen Sie einen KI-Anbieter zum Erstellen aus Ihren Dokumenten.',enterModel:'Geben Sie den Modellnamen Ihres KI-Anbieters ein.',enterKey:'Geben Sie Ihren API-Schlüssel ein. Er bleibt nur im Speicher.',reviewReady:'Prüfen Sie Ihre Chronologie, fügen Sie Notizen und Präzedenzfälle hinzu oder speichern Sie eine Kopie.',addOrOpen:'Fügen Sie Dokumente hinzu, öffnen Sie eine OCKER-Datei oder probieren Sie das Joe-und-Jill-Beispiel.',cancelled:'Abgebrochen. Ihre gespeicherte Chronologie bleibt unverändert.'}
};
const headings={
  "en": {
    "acronym": "Open Chronology, Knowledge and Evidence Record",
    "tagline": "Every account. In its place.",
    "defaultTitle": "Your chronology",
    "theme": "Appearance",
    "chambers": "Chambers",
    "caseboard": "Caseboard",
    "blueprint": "Blueprint",
    "after-hours": "After Hours",
    "paper": "Paper",
    "viewPdf": "View PDF",
    "importedTitle": "Imported document chronology",
    "specCode": "Specification & code",
    "liveReference": "Live reference implementation",
    "search": "Search events",
    "filterStatus": "Filter status",
    "allStatuses": "All statuses",
    "filterDocument": "Filter document",
    "allDocuments": "All documents",
    "of": "of",
    "events": "events",
    "empty": "No events match this view. Import a chronology or build one from your documents.",
    "portable": "Portable chronology and evidence",
    "alleged": "alleged",
    "disputed": "disputed",
    "unresolved": "unresolved"
  },
  "es": {
    "acronym": "Registro Abierto de Cronología, Conocimiento y Prueba",
    "tagline": "Cada relato en su lugar.",
    "defaultTitle": "Tu cronología",
    "theme": "Apariencia",
    "chambers": "Despacho",
    "caseboard": "Tablero de casos",
    "blueprint": "Plano",
    "after-hours": "Nocturno",
    "paper": "Ficha rayada",
    "viewPdf": "Ver PDF",
    "importedTitle": "Cronología de documentos importados",
    "specCode": "Especificación y código",
    "liveReference": "Implementación de referencia en vivo",
    "search": "Buscar eventos",
    "filterStatus": "Filtrar por estado",
    "allStatuses": "Todos los estados",
    "filterDocument": "Filtrar por documento",
    "allDocuments": "Todos los documentos",
    "of": "de",
    "events": "eventos",
    "empty": "Ningún evento coincide con esta vista. Importa una cronología o crea una a partir de tus documentos.",
    "portable": "Cronología y pruebas portátiles",
    "alleged": "Alegado",
    "disputed": "Disputado",
    "unresolved": "Sin resolver"
  },
  "pt": {
    "acronym": "Registro Aberto de Cronologia, Conhecimento e Provas",
    "tagline": "Cada relato em seu lugar.",
    "defaultTitle": "Sua cronologia",
    "theme": "Aparência",
    "chambers": "Escritório",
    "caseboard": "Quadro do caso",
    "blueprint": "Planta",
    "after-hours": "Noturno",
    "paper": "Ficha pautada",
    "viewPdf": "Ver PDF",
    "importedTitle": "Cronologia de documentos importados",
    "specCode": "Especificação e código",
    "liveReference": "Implementação de referência ao vivo",
    "search": "Pesquisar eventos",
    "filterStatus": "Filtrar por estado",
    "allStatuses": "Todos os estados",
    "filterDocument": "Filtrar por documento",
    "allDocuments": "Todos os documentos",
    "of": "de",
    "events": "eventos",
    "empty": "Nenhum evento corresponde a esta visualização. Importe uma cronologia ou crie uma a partir dos seus documentos.",
    "portable": "Cronologia e provas portáteis",
    "alleged": "Alegado",
    "disputed": "Contestado",
    "unresolved": "Não resolvido"
  },
  "fr": {
    "acronym": "Registre ouvert de chronologie, connaissance et preuve",
    "tagline": "Chaque récit à sa place.",
    "defaultTitle": "Votre chronologie",
    "theme": "Apparence",
    "chambers": "Cabinet",
    "caseboard": "Tableau de dossier",
    "blueprint": "Plan",
    "after-hours": "Nocturne",
    "paper": "Fiche lignée",
    "viewPdf": "Voir le PDF",
    "importedTitle": "Chronologie des documents importés",
    "specCode": "Spécification et code",
    "liveReference": "Implémentation de référence en direct",
    "search": "Rechercher des événements",
    "filterStatus": "Filtrer par statut",
    "allStatuses": "Tous les statuts",
    "filterDocument": "Filtrer par document",
    "allDocuments": "Tous les documents",
    "of": "sur",
    "events": "événements",
    "empty": "Aucun événement ne correspond à cette vue. Importez une chronologie ou créez-en une à partir de vos documents.",
    "portable": "Chronologie et preuves portables",
    "alleged": "Allégué",
    "disputed": "Contesté",
    "unresolved": "Non résolu"
  },
  "de": {
    "acronym": "Offenes Chronologie-, Wissens- und Beweisregister",
    "tagline": "Jede Darstellung an ihrem Platz.",
    "defaultTitle": "Ihre Chronologie",
    "theme": "Darstellung",
    "chambers": "Kanzlei",
    "caseboard": "Falltafel",
    "blueprint": "Blaupause",
    "after-hours": "Abendmodus",
    "paper": "Karteikarte",
    "viewPdf": "PDF ansehen",
    "importedTitle": "Chronologie importierter Dokumente",
    "specCode": "Spezifikation und Code",
    "liveReference": "Interaktive Referenzimplementierung",
    "search": "Ereignisse suchen",
    "filterStatus": "Nach Status filtern",
    "allStatuses": "Alle Status",
    "filterDocument": "Nach Dokument filtern",
    "allDocuments": "Alle Dokumente",
    "of": "von",
    "events": "Ereignisse",
    "empty": "Keine Ereignisse entsprechen dieser Ansicht. Importieren Sie eine Chronologie oder erstellen Sie eine aus Ihren Dokumenten.",
    "portable": "Portable Chronologie und Belege",
    "alleged": "Behauptet",
    "disputed": "Bestritten",
    "unresolved": "Ungeklärt"
  }
};

export function demoText(locale) { const key=normalisePromptLocale(locale);return {...translations[key],...shell[key],...headings[key]}; }
// The component consumes labels by key; do not discard translations at the demo boundary.
export function chronologyLabels(locale) { return demoText(locale); }
