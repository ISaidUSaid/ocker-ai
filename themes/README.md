# Ocker themes

The browser themes live here: Glass, None, Chambers, Caseboard, Blueprint, After Hours and Paper. Paper uses ruled legal index cards with a red heading rule and blue writing lines.

`node themes/prepare.mjs` copies the CSS and theme helpers into the core package before development, tests, builds and packaging. JavaScript, React, Angular and the Node application's Angular frontend share that package. The native JavaFX and Avalonia themes are separate; these CSS themes target browser components.

```js
import {mountChronology, THEME_NAMES} from '@ocker-ai/core';
import '@ocker-ai/core/styles.css';

const view = mountChronology(host, record, {theme: 'paper'});
view.setOptions({theme: 'after-hours'});
```

Themes change paint, not chronology data, card coordinates or interactions. PNG/PDF exports capture the selected appearance. The selection stays in the demo when changing language; it does not enter the portable chronology file.

Each theme has its own CSS file. `base.css` connects shared palette variables to the cards, dialogs and demo shell. `index.css` bundles the styles. Add a theme to `THEME_NAMES`, its stylesheet import and the demo translations to expose it in every web demo. Do not edit the generated `ri/js/src/themes/` copies.

Host applications can override CSS variables through `themeVariables` (for example `primary`, `surface`, `background`, `text` and `accent`), or supply their own stylesheet. Geometry and responsive rules stay in the component styles. No extra images, fonts or network requests are required.

Apache-2.0 · Jenko <adam@isaidusaid.com>
