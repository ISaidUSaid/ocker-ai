// SPDX-License-Identifier: Apache-2.0
import '../src/styles.css';
import './workbench.css';
import {mountWorkbench} from './workbench.js';
// A blank-start link is useful when demonstrating a build from someone's own documents.
const autoLoadExample=new URLSearchParams(location.search).get('example')!=='none';
mountWorkbench(document.querySelector('#app'),{autoLoadExample});
