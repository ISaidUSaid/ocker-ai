import { renderComparison } from './comparison.mjs';
import { comparisonCopy } from './comparison-copy.mjs';

const esc = (value) => String(value).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const lines = (value) => esc(value).replace(/\n/g, '<br>');

function ockerLogo(locale, t) {
  return `<a class="ocker-logo" href="/${locale}/" aria-label="Ocker home"><img src="/assets/ocker-wordmark.png" alt="Ocker"><small>${esc(t.acronym)}</small></a>`;
}

function card(t, type, title, body, source, id) {
  return `<article class="chron-card ${type}"><div class="card-top"><span>${esc(t)}</span><span>•••</span></div><strong>${esc(title)}</strong><p>${esc(body)}</p><footer>▧ &nbsp;${esc(source)} <small>${esc(id)}</small></footer></article>`;
}

function preview(t, locale) {
  return `<section class="preview" aria-label="${esc(t.demoLabel)}">
    <div class="appbar"><b>‹</b><strong>Joe &amp; Jill Blogs</strong><span>${esc(t.demoLabel)}</span><label>⌕ ${esc(t.search)}</label><i>−</i><i>+</i></div>
    <div class="chronology">
      <div class="authority">▰<br><small>${esc(t.authority)}</small></div>
      <div class="axis"><span>${esc(new Intl.DateTimeFormat(locale, {day:'numeric',month:'short',timeZone:'UTC'}).format(new Date('2024-05-24')))}</span><b></b><span>${esc(new Intl.DateTimeFormat(locale, {day:'numeric',month:'short',timeZone:'UTC'}).format(new Date('2024-05-25')))}</span><b></b><span>${esc(new Intl.DateTimeFormat(locale, {day:'numeric',month:'short',timeZone:'UTC'}).format(new Date('2024-05-28')))}</span><b></b><span>${esc(new Intl.DateTimeFormat(locale, {day:'numeric',month:'short',timeZone:'UTC'}).format(new Date('2024-05-30')))}</span></div>
      ${card(t.common, 'common c1', t.card1, t.card1Text, t.sourceOne, 'DOC-001')}
      ${card(t.conflict, 'conflict c2', t.card2, t.card2Text, t.sourceTwo, 'DOC-002')}
      ${card(t.common, 'common c3', t.card3, t.card3Text, t.sourceOne, 'DOC-003')}
      ${card(t.conflict, 'conflict c4', t.card4, t.card4Text, t.sourceTwo, 'DOC-004')}
      <div class="arrow a1">⌁</div><div class="arrow a2">⌁</div>
      <aside class="sticky">${esc(t.note)}</aside><aside class="precedent">${lines(t.precedent)}</aside>
      <a class="mini precedent-btn" href="/demo/?lang=${locale}">＋ ${esc(t.addPrecedent)}</a><a class="mini note-btn" href="/demo/?lang=${locale}">▧ ${esc(t.addNote)}</a>
    </div>
  </section>`;
}

export function renderPage(locale, t, sponsor) {
  const languageOptions = Object.entries(globalThis.__LOCALES__ || {}).map(([code, data]) => `<option value="${code}"${code === locale ? ' selected' : ''}>${esc(data.language)}</option>`).join('');
  const scheme = locale === 'pt' ? 'pt-BR' : locale;
  return `<!doctype html>
<html lang="${scheme}">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(t.title)}</title><meta name="description" content="${esc(t.description)}">
  <meta name="theme-color" content="#032d59"><meta property="og:title" content="${esc(t.title)}"><meta property="og:description" content="${esc(t.description)}">
  <link rel="canonical" href="https://ocker.ai/${locale}/">
  <link rel="alternate" hreflang="en" href="https://ocker.ai/en/"><link rel="alternate" hreflang="es" href="https://ocker.ai/es/"><link rel="alternate" hreflang="pt" href="https://ocker.ai/pt/"><link rel="alternate" hreflang="fr" href="https://ocker.ai/fr/"><link rel="alternate" hreflang="de" href="https://ocker.ai/de/"><link rel="alternate" hreflang="x-default" href="https://ocker.ai/en/">
  <link rel="stylesheet" href="/assets/site.css"><link rel="icon" href="/favicon.png" type="image/png">
</head>
<body data-locale="${locale}">
  <header class="site-header"><div class="wrap nav">${ockerLogo(locale, t)}<nav aria-label="Primary"><a href="#why">${esc(t.navWhy)}</a><a href="/demo/?lang=${locale}">${esc(t.navDemo)}</a><a href="#developers">${esc(t.navDevelopers)}</a><a href="/${locale}/spec/">${esc(t.navSpec)}</a><a class="github" href="https://github.com/ISaidUSaid/ocker-ai" target="_blank" rel="noreferrer">◉ ${esc(t.github)}</a><label class="language"><span class="sr-only">Language</span><select data-language>${languageOptions}</select></label></nav></div></header>
  <main>
    <section class="hero"><div class="hero-backdrop"></div><div class="wrap hero-layout"><div class="hero-copy"><p class="eyebrow">${esc(t.eyebrow)}</p><h1>${lines(t.hero)}</h1><p class="lead">${esc(t.intro)}</p><p class="actions"><a class="button primary" href="/demo/?lang=${locale}">${esc(t.demo)} <b>→</b></a><a class="button outline" href="/${locale}/spec/">${esc(t.explore)}</a></p><small>${esc(t.apache)}</small></div>${preview(t, locale)}</div></section>
    <section class="steps wrap" aria-label="How it works">${t.steps.map(([n, title, detail]) => `<article><b>${esc(n)}</b><div><h2>${esc(title)}</h2><p>${esc(detail)}</p></div></article>`).join('')}</section>
    <section class="freedom"><div class="wrap freedom-inner"><svg class="lock" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21V13a9 9 0 0 1 17-4"/><rect x="9" y="21" width="30" height="23" rx="5"/><path d="M24 30v6"/></svg><div><h2>${esc(t.freedomTitle)}</h2><p>${esc(t.freedom)}</p></div></div></section>
    <section class="wrap split" id="developers"><article><h2>${esc(t.evidenceTitle)}</h2><p>${esc(t.evidence)}</p><div class="evidence-mini"><span>▣<br><small>${esc(t.sourceOne)}.pdf</small></span><b>⋯</b><i>⌁</i><span class="smallcard"><small>24 May 2024</small><br>${esc(t.card1)}</span></div></article><article class="developer"><h2>${esc(t.devTitle)}</h2><p>${esc(t.dev)}</p><pre><code><i>// Load an Ocker record and render it</i>
const chronology = <b>parseRecord</b>(await file.text());

<i>// Render in your application</i>
view.<b>setRecord</b>(chronology);</code></pre><p class="tech">JavaScript · React · Angular · Node.js · Java · C#</p><a class="text-link" href="/${locale}/spec/">${esc(t.guide)} <b>→</b></a></article></section>
    ${renderComparison(locale, sponsor)}
    <section class="wrap why" id="why"><div><p class="eyebrow">${esc(t.slangLabel)}</p><h2 class="ocker-word">${esc(t.slangWord)}</h2><b>${esc(t.slangMeta)}</b></div><div><h3>${esc(t.slang)}</h3><small>${esc(t.slangSource)}</small></div><div class="case"><h3>${esc(t.caseLead)}</h3><img class="case-brand" src="/favicon.png" alt="" width="96" height="96"><p>${esc(t.acronym)}</p></div></section>
    <section class="founder wrap"><div><span class="quote">“</span><h2>${esc(t.founderTitle)}</h2></div><p>${esc(t.founder)}</p></section>
  </main>
  <section class="sponsor"><div class="wrap"><p>${esc(t.sponsor)} <a href="${esc(sponsor.url)}" target="_blank" rel="noreferrer">${esc(sponsor.name)}</a></p><div class="sponsor-row"><img src="/assets/isaidusaid-logo.png" alt="${esc(sponsor.name)}"><div class="sponsor-brand">${esc(sponsor.logoText)}<sup>${esc(sponsor.mark)}</sup>.com<small>${esc(t.tagline)}<sup>®</sup></small></div><a class="visit" href="${esc(sponsor.url)}" target="_blank" rel="noreferrer">${esc(t.visit)} ↗</a></div><small>${esc(t.marks)}</small></div></section>
  <footer class="footer"><div class="wrap"><div>${ockerLogo(locale, t)}<span>${esc(t.footer)}</span></div><nav><a href="#compare">${esc(comparisonCopy[locale].navCompare)}</a><a href="/LICENSE">Apache 2.0</a><a href="https://github.com/ISaidUSaid/ocker-ai">GitHub</a><a href="/${locale}/spec/">${esc(t.docs)}</a></nav></div></footer>
  <script src="/assets/site.js" defer></script>
</body></html>`;
}

const specificationCopy = {
  en: ['OCKER SPECIFICATION', 'A portable record for legal chronologies.', 'The Ocker specification describes a clear, open JSON record for events, sources, notes, precedent references and attributed support or contradiction relationships.', 'Start here', 'Read the format contract before you create or import an Ocker file. It defines the record without tying you to a particular interface, AI provider or storage system.', 'Read the contract', 'Build with it', 'Use the integration guide for the reference implementations, reusable interfaces and SDKs.', 'Integration guide', 'Browse the complete specification', 'Home'],
  es: ['ESPECIFICACIÓN OCKER', 'Un registro portátil para cronologías jurídicas.', 'La especificación Ocker describe un registro JSON abierto y claro para hechos, fuentes, notas, referencias de precedente y relaciones atribuidas de apoyo o contradicción.', 'Empiece aquí', 'Lea el contrato de formato antes de crear o importar un archivo Ocker. Define el registro sin vincularlo a una interfaz, proveedor de IA o sistema de almacenamiento concretos.', 'Leer el contrato', 'Construya con él', 'Utilice la guía de integración para las implementaciones de referencia, interfaces reutilizables y SDK.', 'Guía de integración', 'Ver la especificación completa', 'Inicio'],
  pt: ['ESPECIFICAÇÃO OCKER', 'Um registro portátil para cronologias jurídicas.', 'A especificação Ocker descreve um registro JSON aberto e claro para fatos, fontes, notas, referências de precedentes e relações atribuídas de apoio ou contradição.', 'Comece aqui', 'Leia o contrato de formato antes de criar ou importar um arquivo Ocker. Ele define o registro sem vinculá-lo a uma interface, provedor de IA ou sistema de armazenamento específico.', 'Ler o contrato', 'Crie com ele', 'Use o guia de integração para as implementações de referência, interfaces reutilizáveis e SDKs.', 'Guia de integração', 'Ver a especificação completa', 'Início'],
  fr: ['SPÉCIFICATION OCKER', 'Un dossier portable pour les chronologies juridiques.', 'La spécification Ocker décrit un dossier JSON ouvert et clair pour les faits, sources, notes, références de précédent et relations attribuées de soutien ou de contradiction.', 'Commencez ici', 'Lisez le contrat de format avant de créer ou d’importer un fichier Ocker. Il définit le dossier sans le lier à une interface, un fournisseur d’IA ou un système de stockage précis.', 'Lire le contrat', 'Construire avec Ocker', 'Utilisez le guide d’intégration pour les implémentations de référence, les interfaces réutilisables et les SDK.', 'Guide d’intégration', 'Parcourir la spécification complète', 'Accueil'],
  de: ['OCKER-SPEZIFIKATION', 'Ein portabler Datensatz für juristische Chronologien.', 'Die Ocker-Spezifikation beschreibt einen klaren, offenen JSON-Datensatz für Ereignisse, Quellen, Notizen, Präzedenzverweise und zugeschriebene Unterstützungs- oder Widerspruchsbeziehungen.', 'Hier beginnen', 'Lesen Sie den Formatvertrag, bevor Sie eine Ocker-Datei erstellen oder importieren. Er definiert den Datensatz ohne Bindung an eine bestimmte Oberfläche, KI-Anbieter oder Speicherlösung.', 'Vertrag lesen', 'Damit entwickeln', 'Nutzen Sie den Integrationsleitfaden für Referenzimplementierungen, wiederverwendbare Oberflächen und SDKs.', 'Integrationsleitfaden', 'Gesamte Spezifikation ansehen', 'Startseite'],
};

export function renderSpecPage(locale, t) {
  const [eyebrow, title, lead, start, startText, contract, build, buildText, guide, browse, home] = specificationCopy[locale];
  return `<!doctype html><html lang="${locale === 'pt' ? 'pt-BR' : locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t.navSpec)} · Ocker</title><meta name="description" content="${esc(lead)}"><link rel="canonical" href="https://ocker.ai/${locale}/spec/"><link rel="stylesheet" href="/assets/site.css"><link rel="icon" href="/favicon.png" type="image/png"></head><body><header class="site-header"><div class="wrap nav">${ockerLogo(locale, t)}<nav><a href="/${locale}/">${esc(home)}</a><a class="github" href="https://github.com/ISaidUSaid/ocker-ai">◉ ${esc(t.github)}</a></nav></div></header><main class="wrap spec-page"><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p class="lead">${esc(lead)}</p><section class="split"><article><h2>${esc(start)}</h2><p>${esc(startText)}</p><p><a class="button primary" href="https://github.com/ISaidUSaid/ocker-ai/blob/main/spec/CONTRACT.md">${esc(contract)} →</a></p></article><article class="developer"><h2>${esc(build)}</h2><p>${esc(buildText)}</p><p><a class="text-link" href="https://github.com/ISaidUSaid/ocker-ai/blob/main/spec/INTEGRATION.md">${esc(guide)} →</a></p><p><a class="text-link" href="https://github.com/ISaidUSaid/ocker-ai/tree/main/spec">${esc(browse)} →</a></p></article></section></main><footer class="footer"><div class="wrap"><span>${esc(t.footer)}</span><nav><a href="/LICENSE">Apache 2.0</a><a href="https://github.com/ISaidUSaid/ocker-ai">GitHub</a></nav></div></footer></body></html>`;
}
