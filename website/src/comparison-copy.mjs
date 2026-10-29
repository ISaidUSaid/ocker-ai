// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>

// The comparison describes publicly available product capabilities. It deliberately
// does not disclose the analysis prompts, ontology, thresholds or review logic.
export const comparisonCopy = {
  en: {
    navCompare: 'Compare',
    title: 'Ocker.ai and {brand} — choose what you need',
    intro: 'Ocker.ai is an open-source toolkit for building and sharing evidence-linked chronologies. {brand} adds advanced analysis, connected communications and a complete practitioner workflow.',
    capability: 'Capability', yes: 'Included', no: 'Not included', demo: 'Browser demonstration',
    details: 'Explore the 14 detection types', tryOcker: 'Try Ocker.ai', exploreSponsor: 'Explore {brand}',
    groups: [
      { title: 'Documents and chronologies', rows: [
        'Import PDFs, Word documents and pasted text', 'Read scanned documents using OCR', 'Build chronologies using AI', 'Trace events back to source documents and passages', 'Identify common ground and conflicting accounts', 'Match supporting and contradictory accounts', 'Add notes and precedent references', 'View relationships between chronology events', 'Export chronology views as PDF or images', 'Portable Ocker chronology files',
      ] },
      { title: 'Advanced analysis', rows: [
        'Deception and misleading-account detection', 'Analyse behaviour in communications', 'Custom behaviour models', 'Match chronology events to supporting or contradictory communications',
      ] },
      { title: 'Practitioner workflow', rows: [
        'Connect external communication and evidence sources', 'Review communications alongside document evidence', 'Organise evidence into bundles', 'Generate practitioner reports beyond chronology exports', 'Integrated client and matter workflow',
      ] },
      { title: 'Deployment and integration', rows: [
        'Ready-to-use hosted practitioner application', 'Open-source libraries and reference applications', 'Reusable chronology UI components', 'Backend libraries for working with chronology records', 'Embed in your own software or self-host', 'Apache 2.0 licence, including commercial reuse',
      ] },
    ],
    patterns: [
      ['Redirecting', 'Answering a different question instead of addressing the allegation.'],
      ['Obfuscating', 'Burying the relevant fact under detail, procedure or unrelated history.'],
      ['Substituting evidence', 'Offering evidence about a different incident, injury, person or image as though it answers the allegation.'],
      ['Selective omission', 'Presenting an account as complete while leaving out material that changes its meaning.'],
      ['Stripping context', 'Removing qualifications, conditions or surrounding statements to change the implication.'],
      ['Conflating events', 'Combining separate incidents into one account—including incidents on different dates.'],
      ['Shifting timeframe', 'Using evidence from another period to answer the incident actually in question.'],
      ['Equivocating', 'Changing the meaning or scope of a term while treating it as the same proposition.'],
      ['Misattributing statements', 'Assigning a statement to the wrong speaker—for example, presenting someone’s allegation recorded by police as a police observation.'],
      ['Apparent corroboration', 'Treating repeated accounts as independent confirmation when they originate from the same source.'],
      ['Moving goalposts', 'Changing the required standard after the original condition has been satisfied.'],
      ['Reversing cause and effect', 'Claiming X caused Y when the documented sequence places Y before X.'],
      ['Inflating certainty', 'Turning a qualified, preliminary or second-hand statement into a definite conclusion.'],
      ['Conflicting dates, times or durations', 'Identifies accounts of the same incident that materially differ about when it occurred or how long it lasted.'],
    ],
  },
  es: {
    navCompare: 'Comparar',
    title: 'Ocker.ai y {brand} — elija lo que necesita',
    intro: 'Ocker.ai es un kit de herramientas de código abierto para crear y compartir cronologías vinculadas a pruebas. {brand} añade análisis avanzado, comunicaciones conectadas y un flujo de trabajo completo para profesionales.',
    capability: 'Funcionalidad', yes: 'Incluido', no: 'No incluido', demo: 'Demostración en el navegador',
    details: 'Explore los 14 tipos de detección', tryOcker: 'Probar Ocker.ai', exploreSponsor: 'Explorar {brand}',
    groups: [
      { title: 'Documentos y cronologías', rows: [
        'Importar PDF, documentos Word y texto pegado', 'Leer documentos escaneados mediante OCR', 'Crear cronologías con IA', 'Vincular los hechos con documentos y pasajes de origen', 'Identificar puntos en común y relatos contradictorios', 'Relacionar relatos de apoyo y contradicción', 'Añadir notas y referencias de precedentes', 'Ver relaciones entre hechos de la cronología', 'Exportar vistas de cronología como PDF o imágenes', 'Archivos de cronología Ocker portables',
      ] },
      { title: 'Análisis avanzado', rows: [
        'Detección de engaño y relatos potencialmente equívocos', 'Analizar comportamientos en las comunicaciones', 'Modelos de comportamiento personalizados', 'Relacionar hechos de la cronología con comunicaciones de apoyo o contradicción',
      ] },
      { title: 'Flujo de trabajo profesional', rows: [
        'Conectar fuentes externas de comunicaciones y pruebas', 'Revisar comunicaciones junto con pruebas documentales', 'Organizar pruebas en expedientes', 'Generar informes profesionales más allá de las exportaciones de cronología', 'Flujo de trabajo integrado de clientes y asuntos',
      ] },
      { title: 'Implementación e integración', rows: [
        'Aplicación profesional alojada y lista para usar', 'Bibliotecas de código abierto y aplicaciones de referencia', 'Componentes de interfaz de cronología reutilizables', 'Bibliotecas de backend para trabajar con registros de cronología', 'Integrar en su propio software o autoalojar', 'Licencia Apache 2.0, incluido el uso comercial',
      ] },
    ],
    patterns: [
      ['Desviar la respuesta', 'Responder a una pregunta diferente en vez de abordar la alegación.'],
      ['Ofuscar', 'Ocultar el hecho relevante bajo detalles, procedimientos o antecedentes no relacionados.'],
      ['Sustituir pruebas', 'Ofrecer pruebas de otro incidente, lesión, persona o imagen como si respondieran a la alegación.'],
      ['Omisión selectiva', 'Presentar un relato como completo mientras se omite material que cambia su significado.'],
      ['Eliminar contexto', 'Quitar salvedades, condiciones o declaraciones circundantes para cambiar la implicación.'],
      ['Confundir hechos', 'Combinar incidentes separados en un solo relato, incluso incidentes de fechas distintas.'],
      ['Desplazar el marco temporal', 'Usar pruebas de otro período para responder al incidente que realmente se cuestiona.'],
      ['Equivocar términos', 'Cambiar el significado o el alcance de un término tratándolo como la misma proposición.'],
      ['Atribuir erróneamente declaraciones', 'Asignar una declaración a la persona equivocada; por ejemplo, presentar una alegación registrada por la policía como una observación policial.'],
      ['Corroboración aparente', 'Tratar relatos repetidos como confirmación independiente cuando proceden de la misma fuente.'],
      ['Cambiar las condiciones', 'Cambiar el estándar exigido después de que se haya satisfecho la condición original.'],
      ['Invertir causa y efecto', 'Afirmar que X causó Y cuando la secuencia documentada sitúa Y antes que X.'],
      ['Aumentar la certeza', 'Convertir una declaración matizada, preliminar o de segunda mano en una conclusión definitiva.'],
      ['Fechas, horas o duraciones contradictorias', 'Identifica relatos del mismo incidente que difieren materialmente sobre cuándo ocurrió o cuánto duró.'],
    ],
  },
  pt: {
    navCompare: 'Comparar',
    title: 'Ocker.ai e {brand} — escolha o que você precisa',
    intro: 'Ocker.ai é um conjunto de ferramentas de código aberto para criar e compartilhar cronologias ligadas a evidências. {brand} acrescenta análise avançada, comunicações conectadas e um fluxo de trabalho completo para profissionais.',
    capability: 'Recurso', yes: 'Incluído', no: 'Não incluído', demo: 'Demonstração no navegador',
    details: 'Explore os 14 tipos de detecção', tryOcker: 'Experimentar Ocker.ai', exploreSponsor: 'Conhecer {brand}',
    groups: [
      { title: 'Documentos e cronologias', rows: [
        'Importar PDFs, documentos Word e texto colado', 'Ler documentos digitalizados com OCR', 'Criar cronologias com IA', 'Rastrear eventos até documentos e trechos de origem', 'Identificar pontos em comum e relatos conflitantes', 'Relacionar relatos de apoio e contradição', 'Adicionar notas e referências de precedentes', 'Ver relações entre eventos da cronologia', 'Exportar visualizações da cronologia como PDF ou imagens', 'Arquivos portáteis de cronologia Ocker',
      ] },
      { title: 'Análise avançada', rows: [
        'Detecção de engano e relatos potencialmente enganosos', 'Analisar comportamento em comunicações', 'Modelos de comportamento personalizados', 'Relacionar eventos da cronologia a comunicações de apoio ou contradição',
      ] },
      { title: 'Fluxo de trabalho profissional', rows: [
        'Conectar fontes externas de comunicações e evidências', 'Revisar comunicações junto com evidências documentais', 'Organizar evidências em conjuntos', 'Gerar relatórios profissionais além das exportações de cronologia', 'Fluxo de trabalho integrado de clientes e casos',
      ] },
      { title: 'Implantação e integração', rows: [
        'Aplicativo profissional hospedado e pronto para usar', 'Bibliotecas de código aberto e aplicativos de referência', 'Componentes reutilizáveis de interface de cronologia', 'Bibliotecas de backend para trabalhar com registros de cronologia', 'Incorporar em seu próprio software ou hospedar por conta própria', 'Licença Apache 2.0, incluindo uso comercial',
      ] },
    ],
    patterns: [
      ['Desviar a resposta', 'Responder a uma pergunta diferente em vez de abordar a alegação.'],
      ['Ofuscar', 'Ocultar o fato relevante sob detalhes, procedimentos ou histórico sem relação.'],
      ['Substituir evidências', 'Oferecer evidências de outro incidente, lesão, pessoa ou imagem como se respondessem à alegação.'],
      ['Omissão seletiva', 'Apresentar um relato como completo enquanto deixa de fora material que muda seu significado.'],
      ['Retirar o contexto', 'Remover qualificações, condições ou declarações ao redor para mudar a implicação.'],
      ['Confundir eventos', 'Combinar incidentes distintos em um só relato, incluindo incidentes de datas diferentes.'],
      ['Deslocar o período', 'Usar evidências de outro período para responder ao incidente realmente em questão.'],
      ['Equivocar-se', 'Mudar o significado ou o alcance de um termo enquanto o trata como a mesma proposição.'],
      ['Atribuir declarações incorretamente', 'Atribuir uma declaração à pessoa errada; por exemplo, apresentar uma alegação registrada pela polícia como observação policial.'],
      ['Corroboração aparente', 'Tratar relatos repetidos como confirmação independente quando se originam da mesma fonte.'],
      ['Mudar as condições', 'Mudar o padrão exigido depois que a condição original foi satisfeita.'],
      ['Inverter causa e efeito', 'Afirmar que X causou Y quando a sequência documentada coloca Y antes de X.'],
      ['Aumentar a certeza', 'Transformar uma declaração qualificada, preliminar ou de segunda mão em uma conclusão definitiva.'],
      ['Datas, horários ou durações conflitantes', 'Identifica relatos do mesmo incidente que diferem materialmente sobre quando ocorreu ou quanto tempo durou.'],
    ],
  },
  fr: {
    navCompare: 'Comparer',
    title: 'Ocker.ai et {brand} — choisissez ce dont vous avez besoin',
    intro: 'Ocker.ai est une boîte à outils open source pour créer et partager des chronologies liées aux preuves. {brand} ajoute une analyse avancée, des communications connectées et un flux de travail complet pour les praticiens.',
    capability: 'Fonctionnalité', yes: 'Inclus', no: 'Non inclus', demo: 'Démonstration dans le navigateur',
    details: 'Explorer les 14 types de détection', tryOcker: 'Essayer Ocker.ai', exploreSponsor: 'Découvrir {brand}',
    groups: [
      { title: 'Documents et chronologies', rows: [
        'Importer des PDF, documents Word et textes collés', 'Lire des documents numérisés par OCR', 'Créer des chronologies avec l’IA', 'Relier les événements aux documents et passages source', 'Identifier les points communs et les récits contradictoires', 'Rapprocher les récits qui soutiennent ou contredisent', 'Ajouter des notes et références de précédents', 'Voir les relations entre les événements de la chronologie', 'Exporter des vues de chronologie en PDF ou images', 'Fichiers de chronologie Ocker portables',
      ] },
      { title: 'Analyse avancée', rows: [
        'Détection de tromperie et de récits potentiellement trompeurs', 'Analyser les comportements dans les communications', 'Modèles comportementaux personnalisés', 'Rapprocher les événements de chronologie de communications qui les soutiennent ou les contredisent',
      ] },
      { title: 'Flux de travail du praticien', rows: [
        'Connecter des sources externes de communications et de preuves', 'Examiner les communications avec les preuves documentaires', 'Organiser les preuves en dossiers', 'Générer des rapports professionnels au-delà des exports de chronologie', 'Flux de travail intégré pour clients et dossiers',
      ] },
      { title: 'Déploiement et intégration', rows: [
        'Application hébergée et prête à l’emploi pour praticiens', 'Bibliothèques open source et applications de référence', 'Composants d’interface de chronologie réutilisables', 'Bibliothèques backend pour travailler avec des enregistrements de chronologie', 'Intégrer à votre logiciel ou auto-héberger', 'Licence Apache 2.0, y compris l’usage commercial',
      ] },
    ],
    patterns: [
      ['Détourner la réponse', 'Répondre à une autre question au lieu de traiter l’allégation.'],
      ['Obscurcir', 'Enfouir le fait pertinent sous des détails, une procédure ou un historique sans rapport.'],
      ['Substituer des preuves', 'Proposer des preuves d’un autre incident, d’une blessure, d’une personne ou d’une image comme si elles répondaient à l’allégation.'],
      ['Omission sélective', 'Présenter un récit comme complet tout en omettant des éléments qui en changent le sens.'],
      ['Retirer le contexte', 'Supprimer des réserves, conditions ou déclarations environnantes pour changer l’implication.'],
      ['Confondre des événements', 'Réunir des incidents distincts dans un seul récit, y compris des incidents survenus à des dates différentes.'],
      ['Déplacer la période', 'Utiliser des preuves d’une autre période pour répondre à l’incident réellement en cause.'],
      ['Équivoquer', 'Changer le sens ou la portée d’un terme tout en le traitant comme la même proposition.'],
      ['Attribuer erronément des déclarations', 'Attribuer une déclaration à la mauvaise personne; par exemple, présenter l’allégation de quelqu’un consignées par la police comme une observation de la police.'],
      ['Corroboration apparente', 'Traiter des récits répétés comme une confirmation indépendante alors qu’ils proviennent de la même source.'],
      ['Déplacer les critères', 'Modifier la norme exigée après que la condition initiale a été remplie.'],
      ['Inverser la cause et l’effet', 'Affirmer que X a causé Y alors que la séquence documentée place Y avant X.'],
      ['Amplifier la certitude', 'Transformer une déclaration nuancée, préliminaire ou rapportée en conclusion certaine.'],
      ['Dates, heures ou durées contradictoires', 'Identifie des récits du même incident qui diffèrent matériellement quant au moment où il s’est produit ou à sa durée.'],
    ],
  },
  de: {
    navCompare: 'Vergleichen',
    title: 'Ocker.ai und {brand} — wählen Sie, was Sie brauchen',
    intro: 'Ocker.ai ist ein Open-Source-Werkzeugkasten zum Erstellen und Teilen von beweisverknüpften Chronologien. {brand} ergänzt ihn um vertiefte Analyse, verbundene Kommunikation und einen vollständigen Arbeitsablauf für Praktiker.',
    capability: 'Funktion', yes: 'Enthalten', no: 'Nicht enthalten', demo: 'Browser-Demonstration',
    details: 'Die 14 Erkennungsarten ansehen', tryOcker: 'Ocker.ai ausprobieren', exploreSponsor: '{brand} entdecken',
    groups: [
      { title: 'Dokumente und Chronologien', rows: [
        'PDFs, Word-Dokumente und eingefügten Text importieren', 'Gescannte Dokumente mit OCR lesen', 'Chronologien mit KI erstellen', 'Ereignisse zu Quelldokumenten und Passagen zurückverfolgen', 'Gemeinsame Punkte und widersprüchliche Darstellungen erkennen', 'Unterstützende und widersprüchliche Darstellungen zuordnen', 'Notizen und Präzedenzreferenzen hinzufügen', 'Beziehungen zwischen Chronologieereignissen anzeigen', 'Chronologieansichten als PDF oder Bilder exportieren', 'Portable Ocker-Chronologiedateien',
      ] },
      { title: 'Vertiefte Analyse', rows: [
        'Erkennung von Täuschung und potenziell irreführenden Darstellungen', 'Verhalten in Kommunikation analysieren', 'Individuelle Verhaltensmodelle', 'Chronologieereignisse mit unterstützender oder widersprüchlicher Kommunikation abgleichen',
      ] },
      { title: 'Arbeitsablauf für Praktiker', rows: [
        'Externe Kommunikations- und Beweisquellen verbinden', 'Kommunikation neben dokumentarischen Beweisen prüfen', 'Beweise in Bündeln organisieren', 'Praktikerberichte über Chronologieexporte hinaus erstellen', 'Integrierter Arbeitsablauf für Mandanten und Angelegenheiten',
      ] },
      { title: 'Bereitstellung und Integration', rows: [
        'Gehostete, sofort nutzbare Anwendung für Praktiker', 'Open-Source-Bibliotheken und Referenzanwendungen', 'Wiederverwendbare UI-Komponenten für Chronologien', 'Backend-Bibliotheken für Chronologiedatensätze', 'In eigene Software einbetten oder selbst hosten', 'Apache-2.0-Lizenz, einschließlich kommerzieller Nutzung',
      ] },
    ],
    patterns: [
      ['Ausweichen', 'Eine andere Frage beantworten, statt auf die Behauptung einzugehen.'],
      ['Verschleiern', 'Die relevante Tatsache unter Details, Verfahren oder sachfremder Vorgeschichte verbergen.'],
      ['Beweise ersetzen', 'Beweise zu einem anderen Vorfall, einer Verletzung, einer Person oder einem Bild anbieten, als würden sie die Behauptung beantworten.'],
      ['Selektives Auslassen', 'Eine Darstellung als vollständig präsentieren und dabei Material weglassen, das ihre Bedeutung verändert.'],
      ['Kontext entziehen', 'Einschränkungen, Bedingungen oder umgebende Aussagen entfernen, um die Aussagewirkung zu verändern.'],
      ['Ereignisse zusammenführen', 'Getrennte Vorfälle zu einer Darstellung verbinden, auch Vorfälle an unterschiedlichen Daten.'],
      ['Zeitrahmen verschieben', 'Beweise aus einem anderen Zeitraum verwenden, um den tatsächlich fraglichen Vorfall zu beantworten.'],
      ['Mehrdeutig verwenden', 'Die Bedeutung oder Reichweite eines Begriffs ändern und ihn zugleich als dieselbe Aussage behandeln.'],
      ['Aussagen falsch zuordnen', 'Eine Aussage der falschen Person zuschreiben; etwa die von der Polizei festgehaltene Behauptung einer Person als polizeiliche Beobachtung darstellen.'],
      ['Scheinbare Bestätigung', 'Wiederholte Darstellungen als unabhängige Bestätigung behandeln, obwohl sie aus derselben Quelle stammen.'],
      ['Maßstäbe verschieben', 'Den verlangten Maßstab ändern, nachdem die ursprüngliche Bedingung erfüllt wurde.'],
      ['Ursache und Wirkung umkehren', 'Behaupten, X habe Y verursacht, obwohl die dokumentierte Abfolge Y vor X einordnet.'],
      ['Gewissheit überhöhen', 'Eine eingeschränkte, vorläufige oder aus zweiter Hand stammende Aussage in eine eindeutige Schlussfolgerung verwandeln.'],
      ['Widersprüchliche Daten, Zeiten oder Dauern', 'Erkennt Darstellungen desselben Vorfalls, die sich wesentlich darin unterscheiden, wann er geschah oder wie lange er dauerte.'],
    ],
  },
};
