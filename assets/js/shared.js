export const $ = (sel,root=document)=>root.querySelector(sel);
export const $$ = (sel,root=document)=>[...root.querySelectorAll(sel)];
export const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money = n=>new Intl.NumberFormat('id-ID').format(Number(n)||0);
export const dateShort = v=>{if(!v)return'—';const d=new Date(v);return isNaN(d)?String(v):d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});};
export const timeShort = v=>{if(!v)return'—';const d=new Date(v);return isNaN(d)?String(v):d.toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});};
export const icon = name=>`<span class="material-symbols-rounded">${esc(name)}</span>`;
export function toast(message,type='success'){let host=$('.toast-host');if(!host){host=document.createElement('div');host.className='toast-host';document.body.append(host);}const el=document.createElement('div');el.className=`toast ${type==='error'?'error':type==='info'?'info':''}`;el.textContent=message;host.append(el);setTimeout(()=>el.remove(),3500);}
export function downloadFile(name,content,type='application/json'){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
export function parseQuestions(v){if(Array.isArray(v))return {questions:v};if(v&&typeof v==='object')return v;try{return JSON.parse(v||'{"questions":[]}')}catch{return {questions:[]}};}
export function materialQuestions(m){const q=parseQuestions(m?.questions||m?.questionsJson);return Array.isArray(q)?q:(q.questions||[]);}
export function groupBy(arr,key){return arr.reduce((o,x)=>{const k=x[key]||'Lainnya';(o[k] ||= []).push(x);return o;},{});}
