// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
export const PROVIDER_PRESETS=Object.freeze([
 {id:'openai',label:'OpenAI',endpoint:'https://api.openai.com/v1/chat/completions',protocol:'openai',requiresKey:true},
 {id:'anthropic',label:'Anthropic',endpoint:'https://api.anthropic.com/v1/messages',protocol:'anthropic',requiresKey:true},
 {id:'gemini',label:'Google Gemini',endpoint:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',protocol:'openai',requiresKey:true},
 {id:'mistral',label:'Mistral',endpoint:'https://api.mistral.ai/v1/chat/completions',protocol:'openai',requiresKey:true},
 {id:'groq',label:'Groq',endpoint:'https://api.groq.com/openai/v1/chat/completions',protocol:'openai',requiresKey:true},
 {id:'openrouter',label:'OpenRouter',endpoint:'https://openrouter.ai/api/v1/chat/completions',protocol:'openai',requiresKey:true},
 {id:'ollama',label:'Ollama local',endpoint:'http://localhost:11434/v1/chat/completions',protocol:'openai',requiresKey:false}
].map(Object.freeze));
export function mountProviderShortcuts(container,{onSelect}={}) {
 const group=document.createElement('div');group.className='ocker-provider-shortcuts';group.setAttribute('role','group');group.setAttribute('aria-label','Provider shortcuts');
 for(const preset of PROVIDER_PRESETS){const button=document.createElement('button');button.type='button';button.textContent=preset.label;button.setAttribute('aria-pressed','false');button.onclick=()=>{for(const b of group.children)b.setAttribute('aria-pressed',String(b===button));onSelect(preset);};group.append(button);}container.append(group);return{destroy(){group.remove();}};
}
