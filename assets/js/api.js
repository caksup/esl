import { APP } from './config.js';

const DB_KEY = 'jec_esl_local_db_v1';
const clone = x => JSON.parse(JSON.stringify(x));
const now = () => new Date().toISOString();
const uid = prefix => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
const safeParse = (v, fallback) => { try { return JSON.parse(v); } catch { return fallback; } };

function defaultDb() {
  return {
    classes: [], students: [], materials: [
      {materialId:'MAT-DEMO-01',title:'Greetings & Introductions',grade:'Grade 2–3',level:'A1',category:'Speaking',description:'Latihan salam dan perkenalan diri.',templateTypes:['quiz','flash-cards','speaking-cards','complete-the-sentence'],questions:{questions:[
        {id:'q1',type:'mcq',prompt:'How do you say "Halo" in English?',answer:'Hello',options:['Goodbye','Hello','Please','Sorry'],category:'vocabulary',points:10},
        {id:'q2',type:'text',prompt:'My name ___ Budi.',answer:'is',category:'grammar',points:10,hint:'to be'},
        {id:'q3',type:'mcq',prompt:'What do you say in the morning?',answer:'Good morning',options:['Good night','Good morning','Goodbye','Thank you'],category:'speaking',points:10},
        {id:'q4',type:'text',prompt:'Complete: Nice to ___ you.',answer:'meet',category:'grammar',points:10}
      ]},status:'active',createdAt:now(),updatedAt:now()},
      {materialId:'MAT-DEMO-02',title:'Animals & Nature',grade:'Grade 4–6',level:'A1',category:'Vocabulary',description:'Kosakata hewan dan alam.',templateTypes:['match-up','wordsearch','image-quiz','anagram','type-the-answer'],questions:{questions:[
        {id:'q1',type:'mcq',prompt:'Which animal says "meow"?',answer:'Cat',options:['Dog','Cat','Cow','Duck'],category:'vocabulary',points:10},
        {id:'q2',type:'text',prompt:'A ___ can fly and has feathers.',answer:'bird',category:'vocabulary',points:10},
        {id:'q3',type:'mcq',prompt:'What is the Indonesian meaning of "tree"?',answer:'Pohon',options:['Bunga','Rumput','Pohon','Daun'],category:'vocabulary',points:10},
        {id:'q4',type:'text',prompt:'A place with many trees is a ___.',answer:'forest',category:'vocabulary',points:10}
      ]},status:'active',createdAt:now(),updatedAt:now()}
    ], assignments:[], attempts:[], settings:{timeLimit:0,attempts:0,defaultStudentPin:'1234',studentLockMode:'off',studentLockStart:'20:30',studentLockEnd:'06:30',studentLockMessage:'Ayo istirahat, waktunya rehat sejenak.'}, adminPin:localStorage.getItem(APP.adminPinLocalKey)||APP.defaultAdminPin
  };
}
function readDb(){
  const defaults=defaultDb();
  const raw=localStorage.getItem(DB_KEY);
  if(!raw){localStorage.setItem(DB_KEY,JSON.stringify(defaults));return defaults;}
  const stored=safeParse(raw,defaults)||defaults;
  // Safe migration for browsers that already contain a v1 demo database.
  const db={...defaults,...stored};
  db.classes=Array.isArray(stored.classes)?stored.classes:[];
  db.students=Array.isArray(stored.students)?stored.students:[];
  db.materials=Array.isArray(stored.materials)?stored.materials:defaults.materials;
  db.assignments=Array.isArray(stored.assignments)?stored.assignments:[];
  db.attempts=Array.isArray(stored.attempts)?stored.attempts:[];
  db.settings={...defaults.settings,...(stored.settings||{})};
  db.settings.attempts=Math.max(0,Number(db.settings.attempts)||0);
  if(!db.settings.defaultStudentPin)db.settings.defaultStudentPin='1234';
  if(!db.settings.studentLockMode)db.settings.studentLockMode='off';
  db.adminPin=stored.adminPin||defaults.adminPin;
  localStorage.setItem(DB_KEY,JSON.stringify(db));
  return db;
}
function writeDb(db){localStorage.setItem(DB_KEY,JSON.stringify(db));return db;}
function makeClassCode(year,batch){return `${String(year).padStart(2,'0').slice(-2)}${String(batch).padStart(2,'0').slice(-2)}`;}
function makeStudents(db, c, count, pin='1234'){
  const made=[]; for(let i=1;i<=count;i++){const n=String(i).padStart(2,'0');const studentId=`${c.classId}${n}`;if(db.students.some(s=>s.studentId===studentId)) continue; const st={studentId,classId:c.classId,number:n,name:`Siswa ${n}`,grade:c.gradeRange||'',pin,status:'active',createdAt:now()};db.students.push(st);made.push(st);}return made;
}
function leaderboard(db,classId){
  const list=db.students.filter(s=>s.classId===classId).map(s=>{
    const all=db.attempts.filter(a=>a.studentId===s.studentId),best=new Map();
    all.forEach(a=>{const key=a.assignmentId||a.materialId||a.templateId||a.attemptId,prev=best.get(key);if(!prev||(Number(a.score)||0)>(Number(prev.score)||0))best.set(key,a);});
    const at=[...best.values()],score=at.reduce((n,a)=>n+(Number(a.score)||0),0),max=at.reduce((n,a)=>n+(Number(a.maxScore)||0),0);
    return {studentId:s.studentId,name:s.name,score,maxScore:max,average:max?Math.round(score/max*100):0,completed:at.length,attempts:all.length};
  });
  return list.sort((a,b)=>b.score-a.score||b.completed-a.completed).map((s,i)=>({...s,rank:i+1}));
}
function localRoute(action,p={}){
  const db=readDb(); const adminOK=()=>p.token==='local-admin'; const student=()=>db.students.find(s=>s.studentId===localStorage.getItem('jec_esl_local_student_id'));
  switch(action){
    case 'admin.login': return p.pin===db.adminPin?{ok:true,token:'local-admin'}:{ok:false,error:'PIN admin salah.'};
    case 'admin.data': if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'}; return{ok:true,data:{classes:db.classes,students:db.students.map(({pin,...s})=>s),materials:db.materials,assignments:db.assignments,attempts:db.attempts,settings:db.settings}};
    case 'admin.changePin': if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'}; if(String(p.newPin||'').length<4)return{ok:false,error:'PIN minimal 4 digit.'};db.adminPin=String(p.newPin);localStorage.setItem(APP.adminPinLocalKey,db.adminPin);writeDb(db);return{ok:true};
    case 'settings.save': if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'};db.settings={...db.settings,...p.settings};writeDb(db);return{ok:true};
    case 'class.createWithStudents': {
      if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'}; const classId=makeClassCode(p.year,p.batch); if(db.classes.some(c=>c.classId===classId))return{ok:false,error:`Kelas ${classId} sudah ada.`};
      const c={classId,year:String(p.year),batch:String(p.batch).padStart(2,'0'),name:p.name||`Kelas ${classId}`,gradeRange:p.gradeRange||'',schoolYear:p.schoolYear||'2026/2027',status:'active',createdAt:now()};db.classes.push(c);const students=makeStudents(db,c,Math.max(0,Math.min(99,Number(p.count)||0)),p.pin||'1234');writeDb(db);return{ok:true,class:c,students}; }
    case 'class.save': {if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'};let c=db.classes.find(x=>x.classId===p.classId);if(c){Object.assign(c,p.data||{});c.updatedAt=now();}else{const classId=p.classId||uid('CLS');c={classId,...(p.data||{}),status:'active',createdAt:now()};db.classes.push(c);}writeDb(db);return{ok:true,class:c};}
    case 'class.delete': if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'};db.classes=db.classes.filter(x=>x.classId!==p.classId);db.students=db.students.filter(x=>x.classId!==p.classId);db.assignments=db.assignments.filter(x=>x.classId!==p.classId);db.attempts=db.attempts.filter(x=>x.classId!==p.classId);writeDb(db);return{ok:true};
    case 'student.save': {if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'};let s=db.students.find(x=>x.studentId===p.studentId);if(s){const patch={...(p.data||{})};if(!patch.pin)delete patch.pin;Object.assign(s,patch);s.updatedAt=now();}else{if(db.students.some(x=>x.studentId===p.data.studentId))return{ok:false,error:'ID siswa sudah digunakan.'};s={...p.data,status:'active',createdAt:now()};db.students.push(s);}writeDb(db);return{ok:true,student:s};}
    case 'student.delete': if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'};db.students=db.students.filter(x=>x.studentId!==p.studentId);writeDb(db);return{ok:true};
    case 'student.resetPin': if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'};{const s=db.students.find(x=>x.studentId===p.studentId);if(!s)return{ok:false,error:'Siswa tidak ditemukan.'};s.pin=p.pin||'1234';writeDb(db);return{ok:true};}
    case 'material.save': {if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'};let m=db.materials.find(x=>x.materialId===p.materialId);if(m){Object.assign(m,p.data||{});m.updatedAt=now();}else{m={materialId:p.materialId||uid('MAT'),...(p.data||{}),status:'active',createdAt:now(),updatedAt:now()};db.materials.push(m);}writeDb(db);return{ok:true,material:m};}
    case 'material.delete': if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'};db.materials=db.materials.filter(x=>x.materialId!==p.materialId);writeDb(db);return{ok:true};
    case 'assign.create': {if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'};const a={assignmentId:uid('ASG'),...p.data,status:p.data.status||'published',assignedAt:now(),createdAt:now()};db.assignments.push(a);writeDb(db);return{ok:true,assignment:a};}
    case 'assign.update': {if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'};const a=db.assignments.find(x=>x.assignmentId===p.assignmentId);if(!a)return{ok:false,error:'Assignment tidak ditemukan.'};Object.assign(a,p.data||{});writeDb(db);return{ok:true,assignment:a};}
    case 'assign.delete': if(!adminOK())return{ok:false,error:'Sesi admin tidak valid.'};db.assignments=db.assignments.filter(x=>x.assignmentId!==p.assignmentId);writeDb(db);return{ok:true};
    case 'student.login': {const s=db.students.find(x=>x.studentId===String(p.studentId).toUpperCase()&&x.status!=='inactive');if(!s||String(s.pin)!==String(p.pin))return{ok:false,error:'ID siswa atau PIN tidak sesuai.'};localStorage.setItem('jec_esl_local_student_id',s.studentId);return{ok:true,token:`local-student-${s.studentId}`,student:{studentId:s.studentId,name:s.name,classId:s.classId,grade:s.grade}};}
    case 'student.data': {const s=student();if(!s)return{ok:false,error:'Sesi siswa tidak valid.'};const c=db.classes.find(x=>x.classId===s.classId)||{};const assignments=db.assignments.filter(a=>a.classId===s.classId&&a.status==='published').map(a=>({...a,material:db.materials.find(m=>m.materialId===a.materialId)})).filter(a=>a.material&&a.material.status!=='inactive'&&(!a.dueAt||new Date(a.dueAt+'T23:59:59').getTime()>=Date.now()));const attempts=db.attempts.filter(a=>a.studentId===s.studentId);return{ok:true,data:{student:{studentId:s.studentId,name:s.name,classId:s.classId,grade:s.grade},class:c,assignments,attempts,leaderboard:leaderboard(db,s.classId),settings:db.settings}};}
    case 'student.profile': {const s=student();if(!s)return{ok:false,error:'Sesi siswa tidak valid.'};Object.assign(s,p.data||{});writeDb(db);return{ok:true};}
    case 'attempt.submit': {const s=student();if(!s)return{ok:false,error:'Sesi siswa tidak valid.'};const a=db.assignments.find(x=>x.assignmentId===p.data.assignmentId&&x.classId===s.classId&&x.status==='published');if(!a)return{ok:false,error:'Game tidak ditemukan untuk kelas ini.'};const max=Math.max(0,Number(a.settings?.attempts??0)||0);if(max>0&&db.attempts.filter(x=>x.assignmentId===a.assignmentId&&x.studentId===s.studentId).length>=max)return{ok:false,error:'Batas percobaan untuk game ini sudah tercapai.'};const row={attemptId:uid('ATT'),studentId:s.studentId,classId:s.classId,...p.data,finishedAt:now()};db.attempts.push(row);writeDb(db);return{ok:true,attempt:row};}
    default:return{ok:false,error:`Aksi tidak dikenal: ${action}`};
  }
}
const WRITE_ACTIONS = new Set(['admin.changePin','settings.save','class.createWithStudents','class.save','class.delete','student.save','student.delete','student.resetPin','material.save','material.delete','assign.create','assign.update','assign.delete','student.profile','attempt.submit']);
function jsonp(action,payload){
  return new Promise((resolve,reject)=>{
    const base=APP.apiUrl; if(!base){resolve(localRoute(action,payload));return;}
    const cb=`__jec_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script=document.createElement('script'); const timer=setTimeout(()=>finish(new Error('Koneksi ke Google Apps Script timeout.')),30000);
    const finish=(err,result)=>{clearTimeout(timer);delete window[cb];script.remove();if(err)reject(err);else resolve(result);};
    window[cb]=result=>finish(null,result);
    const url=new URL(base); url.searchParams.set('action',action);url.searchParams.set('payload',JSON.stringify(payload));url.searchParams.set('callback',cb);url.searchParams.set('_',String(Date.now()));
    script.onerror=()=>finish(new Error('Gagal menghubungi database. Periksa URL Web App dan akses deploy.'));
    script.src=url.toString();document.head.appendChild(script);
  });
}
function postRemote(action,payload){
  return new Promise((resolve,reject)=>{
    const base=APP.apiUrl; const requestId=`jec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const iframe=document.createElement('iframe'); iframe.name=requestId; iframe.style.display='none';
    const form=document.createElement('form'); form.method='POST';form.action=base;form.target=requestId;form.style.display='none';
    const add=(name,value)=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.appendChild(input);};
    add('action',action);add('payload',JSON.stringify(payload));add('requestId',requestId);
    const cleanup=()=>{window.removeEventListener('message',onMessage);clearTimeout(timer);form.remove();iframe.remove();};
    const onMessage=e=>{if(e.source!==iframe.contentWindow||!e.data||e.data.type!=='JEC_GAS_RESPONSE'||e.data.requestId!==requestId)return;cleanup();resolve(e.data.result);};
    const timer=setTimeout(()=>{cleanup();reject(new Error('Database tidak merespons. Periksa deployment Apps Script.'));},35000);
    window.addEventListener('message',onMessage);document.body.append(iframe,form);form.submit();
  });
}
export async function api(action,payload={}){try{const result=!APP.apiUrl?localRoute(action,payload):(WRITE_ACTIONS.has(action)?await postRemote(action,payload):await jsonp(action,payload));if(result&&result.ok===false)throw new Error(result.error||'Terjadi kesalahan.');return result;}catch(e){throw e instanceof Error?e:new Error(String(e));}}
export function isRemote(){return Boolean(APP.apiUrl);}
export function getApiUrl(){return APP.apiUrl;}
export function clearLocalDemo(){localStorage.removeItem(DB_KEY);}
export function getStoredStudentToken(){return localStorage.getItem(APP.studentTokenKey)||'';}
export function getStoredAdminToken(){return localStorage.getItem(APP.adminTokenKey)||'';}
