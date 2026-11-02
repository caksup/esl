const esc = s => String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s ?? '').trim().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ');
const shuffle = arr => [...arr].sort(()=>Math.random()-.5);
const choiceModes = new Set(['quiz','gameshow-quiz','win-or-lose-quiz','true-or-false','image-quiz','balloon-pop','airplane','whack-a-mole','flying-fruit','maze-chase','maths-generator']);
const inputModes = new Set(['unjumble','anagram','complete-the-sentence','spell-the-word','type-the-answer','crossword','labelled-diagram']);
const pairModes = new Set(['match-up','find-the-match','matching-pairs','flip-tiles']);

function qList(material,mode='quiz'){
  let raw=material?.questions;if(typeof raw==='string'){try{raw=JSON.parse(raw)}catch{raw=[]}}
  const list=Array.isArray(raw)?raw:(raw?.questions||[]);
  if(!list.length){
    if(mode==='maths-generator')return Array.from({length:8},(_,i)=>{const a=2+i,b=1+(i%5),answer=String(a+b);return{id:`math-${i+1}`,prompt:`What is ${a} + ${b}?`,answer,options:[answer,String(Number(answer)+1),String(Number(answer)-1),String(Number(answer)+2)],category:'math',points:10};});
    return [{id:'demo1',type:'mcq',prompt:'What is the English word for "apel"?',answer:'Apple',options:['Apple','Banana','Orange','Mango'],category:'vocabulary',points:10},{id:'demo2',type:'text',prompt:'Complete: Good ___!',answer:'morning',category:'greetings',points:10}];
  }
  const getEn=q=>String(q.en||q.english||q.word||'').trim();
  const getId=q=>String(q.indonesian||q.translation||q.meaning||q.idWord||q.id||'').trim();
  const vocabRows=list.filter(q=>getEn(q)&&getId(q));
  const isCanonicalVocabulary=vocabRows.length===list.length&&list.every(q=>!q.prompt&&!q.answer&&!q.options);
  if(vocabRows.length){
    const uniquePairs=[...new Map(vocabRows.map(q=>[`${getEn(q).toLowerCase()}::${getId(q).toLowerCase()}`,q])).values()];
    const pairs=uniquePairs.map(q=>({left:getEn(q),right:getId(q)}));
    if(['match-up','find-the-match'].includes(mode))return [{id:'vocab-pairs',prompt:'Match each English word with its Indonesian meaning.',answer:'matched',pairs,points:uniquePairs.reduce((n,q)=>n+(Number(q.points)||10),0),category:'vocabulary'}];
    if(['matching-pairs','flip-tiles'].includes(mode))return [{id:'vocab-memory-pairs',prompt:'Find all matching English and Indonesian cards.',answer:'matched',pairs,points:uniquePairs.reduce((n,q)=>n+(Number(q.points)||10),0),category:'vocabulary'}];
    if(['group-sort','speed-sorting'].includes(mode)&&vocabRows.some(q=>q.group||q.topic||q.category)){
      const items=uniquePairs.map(q=>({text:getEn(q),group:String(q.group||q.topic||q.category||'Vocabulary')}));
      return [{id:'vocab-sort',prompt:'Sort each word into the correct category.',answer:'sorted',groups:[...new Set(items.map(x=>x.group))],items,points:items.length*10,category:'vocabulary'}];
    }
    if(mode==='wordsearch'){let words=uniquePairs.map(q=>getEn(q).toUpperCase().replace(/[^A-Z]/g,'')).filter(w=>w.length>=2&&w.length<=15).slice(0,12);if(!words.length){const fallback=getEn(uniquePairs[0]||{}).toUpperCase().replace(/[^A-Z]/g,'').slice(0,15);if(fallback.length>=2)words=[fallback];}return [{id:'vocab-search',prompt:'Find the English vocabulary words in the letter grid.',answer:'found',words,points:words.length*10,category:'vocabulary'}];}
    if(mode==='rank-order'&&isCanonicalVocabulary){const items=uniquePairs.map(q=>getEn(q)).sort((a,b)=>a.localeCompare(b));return [{id:'vocab-rank',prompt:'Put the English words in alphabetical order.',answer:'ordered',items,points:items.length*10,category:'vocabulary'}];}
    return vocabRows.map((row,i)=>{
      const en=getEn(row),idWord=getId(row),distractorIds=uniquePairs.filter(q=>getEn(q)!==en).map(getId).filter(x=>x!==idWord),distractorEns=uniquePairs.filter(q=>getEn(q)!==en).map(getEn);
      const direction=row.direction||'en-id';let prompt=row.prompt||(direction==='id-en'?`How do you say "${idWord}" in English?`:`What is the Indonesian meaning of "${en}"?`),answer=row.answer??(direction==='id-en'?en:idWord);
      let options=Array.isArray(row.options)?row.options:[];
      if(['anagram','unjumble','spell-the-word','word-magnets','hangman','crossword'].includes(mode)){prompt=row.prompt||`Spell the English word for "${idWord}".`;answer=row.answer??en;}
      else if(mode==='type-the-answer'&&direction==='id-en'){prompt=row.prompt||`How do you say "${idWord}" in English?`;answer=row.answer??en;}
      else if(mode==='complete-the-sentence'){prompt=row.prompt||`Complete: "${en}" means _____.`;answer=row.answer??idWord;}
      else if(mode==='flash-cards'){prompt=row.prompt||(direction==='id-en'?idWord:en);answer=row.answer??(direction==='id-en'?en:idWord);}
      else if(mode==='speaking-cards'){prompt=row.prompt||`Use the word "${en}" in a sentence.`;answer=row.example||`A sentence using ${en}`;}
      else if(mode==='true-or-false'){
        const falsePair=Math.random()<.35&&distractorIds.length>0;const shown=falsePair?distractorIds[Math.floor(Math.random()*distractorIds.length)]:idWord;
        prompt=row.prompt||`"${en}" means "${shown}". True or false?`;answer=falsePair?'False':'True';
      }
      else if(mode==='pair-or-no-pair'){
        const falsePair=Math.random()<.35&&distractorIds.length>0;const shown=falsePair?distractorIds[Math.floor(Math.random()*distractorIds.length)]:idWord;
        prompt=row.prompt||`Are these a matching pair: "${en}" — "${shown}"?`;answer=falsePair?'No Pair':'Pair';
      }
      else if(mode==='image-quiz'&&row.image){prompt=row.prompt||'What is shown in this picture?';answer=row.answer??en;}
      if(!options.length){
        if(answer===en)options=[en,...distractorEns.slice(0,3)];
        else if(answer==='True'||answer==='False')options=['True','False'];
        else if(answer==='Pair'||answer==='No Pair')options=['Pair','No Pair'];
        else options=[idWord,...distractorIds.slice(0,3)];
      }
      return {...row,id:row.questionId||row.id||`vocab-${i+1}`,questionId:row.questionId||row.id||`vocab-${i+1}`,en,indonesian:idWord,idWord,word:en,translation:idWord,prompt,answer,options,category:row.category||material?.category||'vocabulary',points:Number(row.points)||10};
    });
  }
  return list.map((q,i)=>({...q,id:q.questionId||q.id||`q${i+1}`,category:q.category||material?.category||'General',points:Number(q.points)||10}));
}

function answerVariants(q){const value=q?.answer??q?.correct??'';return(Array.isArray(value)?value:String(value).split('|')).map(x=>String(x).trim()).filter(Boolean);}
function isCorrectAnswer(given,q){const target=answerVariants(q);return target.some(x=>norm(x)===norm(given));}
function asOptions(q){const opts=Array.isArray(q.options)?[...q.options]:[];const target=answerVariants(q)[0]||'Yes';if(!opts.length)opts.push(target,'No','Maybe',"I don't know");else if(!opts.some(x=>isCorrectAnswer(x,q)))opts.unshift(target);return [...new Set(opts.map(String))].slice(0,6);}
function points(q){return Number(q.points)||10;}

function makeWordGrid(words){
  const targets=[...new Set((words||[]).map(w=>String(w).toUpperCase().replace(/[^A-Z]/g,'')).filter(w=>w.length>=2))].slice(0,12);
  if(!targets.length)return{grid:[['J','E','C']],words:[]};
  const width=Math.max(10,Math.min(15,Math.max(...targets.map(w=>w.length))+2));
  const height=Math.max(8,targets.length+2);const grid=Array.from({length:height},()=>Array.from({length:width},()=>String.fromCharCode(65+Math.floor(Math.random()*26))));
  targets.forEach((word,row)=>{const maxStart=Math.max(0,width-word.length);const start=Math.floor(Math.random()*(maxStart+1));[...word].forEach((ch,i)=>grid[row+1][start+i]=ch);});
  return{grid,words:targets};
}

export function createGame(mode,ctx){
  const mount=ctx.mount, questions=qList(ctx.material,mode), title=ctx.templateName||mode;
  if(ctx.settings?.shuffle) questions.splice(0,questions.length,...shuffle(questions));
  const timeLimitSec=Math.max(0,Number(ctx.settings?.timeLimit)||0)*60; let timeLeft=timeLimitSec; let timerId=null;
  let index=0,score=0,correctCount=0,answers=[],answered=false,feedback='',spinReady=false,opened=false,flipped=false,selected=[],guessed=[],wrongGuesses=0,typed='',memoryVisible=true,sortValues={},speakingDone=false,matchPairs=[],matchLeft=null,matchRight=null,matched=new Set(),orderItems=[],magnetBuilt=[],magnetOptions=[],magnetUsed=new Set(),memoryTiles=[],memoryPairSelection=[],memoryPairMatched=new Set(),wordSelectedCells=[],wordFound=new Set(),wordGrid=null,resultReady=false;
  const started=Date.now(); let finished=false;
  const q=()=>questions[Math.min(index,questions.length-1)];
  const expected=q=>q.answer??q.correct??'';
  const finish=()=>{if(finished)return;finished=true;if(timerId)clearInterval(timerId);const durationSec=Math.max(1,Math.round((Date.now()-started)/1000));const maxScore=questions.reduce((n,x)=>n+points(x),0);ctx.onFinish?.({score,maxScore,correct:correctCount,total:questions.length,durationSec,completionRate:100,answers,mistakes:answers.filter(x=>!x.correct).map(x=>({prompt:x.prompt,answer:x.answer,given:x.given,category:x.category})),startedAt:new Date(started).toISOString()});};
  const record=(ok,given,overridePoints)=>{if(answered)return;answered=true;const got=ok?(overridePoints??points(q())):0;score+=got;if(ok)correctCount++;answers.push({questionId:q().questionId||q().id||String(index+1),prompt:q().prompt||q().clue||q().word||`Question ${index+1}`,answer:expected(q()),given:String(given??''),correct:Boolean(ok),points:got,category:q().category||ctx.material?.category||'General'});feedback=ok?'Hebat! Jawaban benar.':`Belum tepat. Jawaban: ${expected(q())||'Lihat contoh jawaban'}`;render();};
  const next=()=>{if(!answered)return;if(index>=questions.length-1){renderResult();return;}index++;answered=false;feedback='';spinReady=false;opened=false;flipped=false;selected=[];guessed=[];wrongGuesses=0;typed='';memoryVisible=true;sortValues={};speakingDone=false;matchPairs=[];matchLeft=null;matchRight=null;matched.clear();orderItems=[];magnetBuilt=[];magnetOptions=[];magnetUsed.clear();memoryTiles=[];memoryPairSelection=[];memoryPairMatched.clear();wordSelectedCells=[];wordFound.clear();wordGrid=null;render();};
  const finishButton=()=>`<div class="game-actions"><span class="game-mini">${esc(ctx.material?.title||title)}</span><button class="btn btn-primary" data-action="${index===questions.length-1?'finish':'next'}" ${answered?'':'disabled'}>${index===questions.length-1?'Selesaikan game':'Soal berikutnya'} <span class="material-symbols-rounded">arrow_forward</span></button></div>`;
  const progress=()=>`<div class="game-progress"><span class="game-qno">${index+1} / ${questions.length}</span><div class="progress"><span style="width:${Math.round((index+(answered?1:0))/questions.length*100)}%"></span></div><span class="game-mini">⭐ ${score} poin</span>${timeLimitSec?`<span class="pill ${timeLeft<=30?'red':''}" id="game-time">⏱ ${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,'0')}</span>`:''}</div>`;
  const notice=()=>feedback?`<div class="game-feedback ${answers.at(-1)?.correct?'good':'bad'}">${esc(feedback)}</div>`:'';
  const prompt=()=>`<div class="eyebrow">${esc(ctx.templateName||'English Game')}</div><h2 class="game-prompt">${esc(q().prompt||q().clue||q().word||`Question ${index+1}`)}</h2>`;
  function choiceUi(){
    const current=q(); let opts=asOptions(current); if(mode==='true-or-false')opts=['True','False'];
    if(mode==='pair-or-no-pair')opts=['Pair','No Pair'];
    if(mode==='maths-generator'&&!current.options){const a=Number(current.a??Math.ceil(Math.random()*10)),b=Number(current.b??Math.ceil(Math.random()*10)),op=current.operator||'+';const value=op==='-'?a-b:op==='×'?a*b:op==='÷'?Math.round(a/b*100)/100:a+b;current.answer=String(current.answer??value);current.prompt=current.prompt||`What is ${a} ${op} ${b}?`;opts=[String(value),String(value+1),String(value-1),String(value+2)];}
    if(mode==='balloon-pop')return `<div class="game-tile-grid">${shuffle(opts).map((o,i)=>`<button class="game-tile" data-choice="${esc(o)}" style="border-radius:50px;background:${['#fff0f0','#edf5ff','#fff8dc','#eef8ef'][i%4]}">🎈<br>${esc(o)}</button>`).join('')}</div>`;
    if(mode==='airplane')return `<div class="arcade-board airplane-board"><div class="arcade-lane">☁️　✈️　☁️</div><div class="game-options">${shuffle(opts).map((o,i)=>`<button class="game-option arcade-choice" data-choice="${esc(o)}">🛩️ ${esc(o)}</button>`).join('')}</div><p class="game-mini">Choose the correct runway!</p></div>`;
    if(mode==='whack-a-mole')return `<div class="arcade-board mole-board"><p class="game-hint">Whack the correct answer!</p><div class="game-tile-grid">${shuffle(opts).map((o,i)=>`<button class="game-tile mole-hole" data-choice="${esc(o)}">${i%2?'🕳️':'🐹'}<br><b>${esc(o)}</b></button>`).join('')}</div></div>`;
    if(mode==='flying-fruit')return `<div class="arcade-board fruit-board"><p class="game-hint">Catch the right fruit!</p><div class="game-tile-grid">${shuffle(opts).map((o,i)=>`<button class="game-tile fruit-choice" data-choice="${esc(o)}">${['🍎','🍌','🍊','🍇'][i%4]}<br><b>${esc(o)}</b></button>`).join('')}</div></div>`;
    const choiceClass=mode==='gameshow-quiz'?'gameshow-choice':mode==='win-or-lose-quiz'?'risk-choice':mode==='maze-chase'?'maze-exit':mode==='image-quiz'?'image-choice':'';return `<div class="game-options ${choiceClass}">${shuffle(opts).map((o,i)=>`<button class="game-option" data-choice="${esc(o)}" ${answered?'disabled':''}><span class="game-mini">${String.fromCharCode(65+i)}</span><br>${esc(o)}</button>`).join('')}</div>`;
  }
  function inputUi(){
    const a=String(expected(q()));const letters=shuffle(a.replace(/\s/g,'').split(''));
    if(mode==='unjumble'||mode==='anagram')return `<div class="game-hint">${mode==='anagram'?'Susun huruf acak menjadi kata yang benar.':'Susun kata menjadi jawaban yang benar.'}</div><div class="game-letters">${letters.map(c=>`<span class="game-letter">${esc(c.toUpperCase())}</span>`).join('')}</div>`;
    return `<div class="game-hint">${esc(q().hint||'Ketik jawabanmu di bawah ini.')}</div>`;
  }
  function pairUi(){
    const pairs=q().pairs?.length?q().pairs:[{left:q().prompt||'Question',right:expected(q())}];
    if(!matchPairs.length)matchPairs=shuffle(pairs.map((p,i)=>({...p,i})));
    const left=pairs.map((p,i)=>({v:p.left,k:`l${i}`})); const right=matchPairs.map(p=>({v:p.right,k:`r${p.i}`}));
    return `<p class="game-hint">Pilih satu kata di kiri, lalu pilih artinya di kanan.</p><div class="pair-columns"><div class="pair-column">${left.map(x=>`<button class="game-option ${matchLeft===x.k?'selected':''} ${matched.has(x.k.replace('l',''))?'correct':''}" data-pair="${x.k}" ${matched.has(Number(x.k.slice(1)))?'disabled':''}>${esc(x.v)}</button>`).join('')}</div><div class="pair-column">${right.map(x=>`<button class="game-option ${matchRight===x.k?'selected':''} ${matched.has(x.k.replace('r',''))?'correct':''}" data-pair="${x.k}" ${matched.has(Number(x.k.slice(1)))?'disabled':''}>${esc(x.v)}</button>`).join('')}</div></div><div class="game-mini">Pasangan ditemukan: ${matched.size} / ${pairs.length}</div>`;
  }
  function groupUi(){
    const groups=q().groups||['Group A','Group B']; const items=q().items||asOptions(q()).map((text,i)=>({text,group:i%2?groups[1]:groups[0]}));
    return `<div class="game-sort-list">${items.map((it,i)=>`<div class="game-sort-item"><strong>${esc(typeof it==='string'?it:it.text)}</strong><select data-sort="${i}" ${answered?'disabled':''}><option value="">Choose group</option>${groups.map(g=>`<option ${sortValues[i]===g?'selected':''}>${esc(g)}</option>`).join('')}</select></div>`).join('')}</div><button class="btn btn-primary" data-action="check-sort" style="margin-top:14px" ${answered?'disabled':''}>Check answers</button>`;
  }
  function rankUi(){const items=q().items||String(expected(q())).split(',').map(s=>s.trim());if(!orderItems.length)orderItems=shuffle(items);return `<div class="game-sort-list">${orderItems.map((x,i)=>`<div class="game-sort-item"><strong>${i+1}. ${esc(x)}</strong><span><button class="icon-btn" data-move="${i}" data-dir="-1" ${i===0||answered?'disabled':''}>↑</button> <button class="icon-btn" data-move="${i}" data-dir="1" ${i===orderItems.length-1||answered?'disabled':''}>↓</button></span></div>`).join('')}</div><button class="btn btn-primary" data-action="check-order" style="margin-top:14px">Check order</button>`;}
  function memoryUi(){const items=q().items||asOptions(q());return `<div class="notice">${memoryVisible?'Perhatikan dan ingat semua item berikut.':'Sekarang pilih jawaban yang kamu ingat.'}</div>${memoryVisible?`<div class="game-options">${items.map(x=>`<div class="game-option">${esc(x)}</div>`).join('')}</div><button class="btn btn-primary" data-action="hide-memory" style="margin-top:15px">Saya siap!</button>`:choiceUi()}`;}
  function hangmanUi(){const word=String(expected(q())).toUpperCase();const shown=word.split('').map(ch=>ch===' '?'  ':guessed.includes(ch)?ch:'_').join(' ');const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');return `<div class="game-result"><div style="font-size:24px;letter-spacing:6px;font-weight:900">${esc(shown)}</div><p class="game-mini">Kesempatan salah tersisa: ${6-wrongGuesses}</p></div><div class="game-tile-grid">${alphabet.map(ch=>`<button class="game-tile" data-letter="${ch}" ${guessed.includes(ch)||answered?'disabled':''}>${ch}</button>`).join('')}</div>`;}
  function wordsearchUi(){
    const words=q().words||[String(expected(q()))];
    if(!wordGrid)wordGrid=makeWordGrid(words);
    const cells=wordGrid.grid.map((row,r)=>row.map((ch,c)=>`<button class="word-cell ${wordSelectedCells.some(x=>x.r===r&&x.c===c)?'selected':''}" data-wordcell="${r},${c}" ${answered?'disabled':''}>${esc(ch)}</button>`).join('')).join('');
    return `<p class="game-hint">Temukan kata pada kotak huruf. Klik huruf dari kiri ke kanan.</p><div class="wordsearch-layout"><div class="wordsearch-grid" style="--word-cols:${wordGrid.grid[0].length}">${cells}</div><div class="wordsearch-words"><b>Find these words</b>${wordGrid.words.map(w=>`<span class="word-target ${wordFound.has(w)?'found':''}">${wordFound.has(w)?'✓ ':''}${esc(w)}</span>`).join('')}</div></div><div class="game-mini">Ditemukan ${wordFound.size}/${wordGrid.words.length} kata</div><button class="btn btn-ghost" data-action="wordsearch-reset" style="margin-top:9px">Reset pilihan huruf</button>`;
  }
  function flashCardUi(){return `<div class="game-result"><div class="eyebrow">Flash card ${index+1} / ${questions.length}</div><button class="game-option" style="width:min(520px,100%);min-height:180px;text-align:center;font-size:24px;margin:12px auto;display:block" data-action="flip-card">${flipped?esc(expected(q())):esc(q().prompt||q().word||'Tap to reveal')}</button>${flipped?`<div class="row wrap" style="justify-content:center"><button class="btn btn-secondary" data-action="card-again">Perlu latihan</button><button class="btn btn-primary" data-action="card-known">Sudah tahu ✓</button></div>`:'<p class="muted small">Ketuk kartu untuk melihat jawabannya.</p>'}</div>`;}
  function speakingUi(){return `<div class="notice">Ucapkan jawaban dengan suara yang jelas. Penilaian otomatis tidak menggantikan penilaian guru; pilih refleksi yang paling jujur setelah mencoba.</div><div style="padding:24px 10px;text-align:center"><div style="font-size:60px">🎤</div><div class="game-prompt">${esc(q().prompt||'Tell me about yourself.')}</div><p class="muted">Coba jawab dengan 1–3 kalimat bahasa Inggris.</p><div class="row wrap" style="justify-content:center;margin-bottom:12px"><button class="btn btn-ghost" data-action="speak-prompt">🔊 Dengarkan kata</button><button class="btn btn-ghost" data-action="speak-answer">🔊 Contoh jawaban</button></div><div class="row wrap" style="justify-content:center"><button class="btn btn-ghost" data-action="speaking-practice">Perlu latihan lagi</button><button class="btn btn-secondary" data-action="speaking-good">Cukup lancar</button><button class="btn btn-primary" data-action="speaking-confident">Percaya diri!</button></div></div>`;}
  function memoryPairsUi(){
    const pairs=q().pairs||[];
    if(!memoryTiles.length)memoryTiles=shuffle(pairs.flatMap((pair,pairId)=>[{pairId,side:'EN',text:pair.left},{pairId,side:'ID',text:pair.right}]));
    return `<p class="game-hint">Buka dua kartu sekaligus dan temukan pasangan EN–ID yang cocok.</p><div class="memory-pairs-grid">${memoryTiles.map((tile,i)=>{const visible=memoryPairMatched.has(tile.pairId)||memoryPairSelection.includes(i);return `<button class="memory-pair-card ${visible?'revealed':''} ${memoryPairMatched.has(tile.pairId)?'matched':''}" data-memory-tile="${i}" ${memoryPairMatched.has(tile.pairId)||answered?'disabled':''}><small>${visible?tile.side:'JEC'}</small><b>${visible?esc(tile.text):'?'}</b></button>`;}).join('')}</div><div class="game-mini">Pasangan ditemukan ${memoryPairMatched.size}/${pairs.length}</div>`;
  }
  function openBoxUi(){return opened?choiceUi():`<div style="text-align:center;padding:25px"><div style="font-size:80px">🎁</div><p class="game-prompt">Ada tantangan rahasia di dalam kotak!</p><button class="btn btn-yellow" data-action="open-box">Buka kotak</button></div>`;}
  function wheelUi(){return spinReady?choiceUi():`<div style="text-align:center"><div class="game-wheel"><span>JEC</span></div><p class="game-hint">Putar roda untuk mengambil soal.</p><button class="btn btn-primary" data-action="spin">Putar roda</button></div>`;}
  function magnetsUi(){
    if(!magnetOptions.length)magnetOptions=shuffle([...String(expected(q())).toUpperCase().replace(/\s/g,'')].map((char,sourceIndex)=>({char,sourceIndex})));
    return `<p class="game-hint">Susun magnet huruf menjadi jawaban yang tepat.</p><div class="game-letters">${magnetBuilt.map((x,i)=>`<button class="game-letter" data-remove-magnet="${i}" title="Hapus huruf">${esc(x.char)}</button>`).join('')||'<span class="muted small">Pilih huruf untuk membentuk jawaban.</span>'}</div><div class="game-letters">${magnetOptions.map((x,i)=>`<button class="game-letter ${magnetUsed.has(x.sourceIndex)?'used':''}" data-magnet="${x.sourceIndex}" data-char="${esc(x.char)}" ${magnetUsed.has(x.sourceIndex)||answered?'disabled':''}>${esc(x.char)}</button>`).join('')}</div><button class="btn btn-primary" data-action="check-magnets" ${answered?'disabled':''}>Check answer</button>`;
  }
  function genericUi(){return choiceUi();}
  function render(){
    if(finished)return;const current=q();let body='';
    if(mode==='speaking-cards')body=speakingUi();
    else if(mode==='flash-cards')body=flashCardUi();
    else if(mode==='matching-pairs'||mode==='flip-tiles')body=memoryPairsUi();
    else if(pairModes.has(mode))body=pairUi();
    else if(mode==='group-sort'||mode==='speed-sorting')body=groupUi();
    else if(mode==='rank-order')body=rankUi();
    else if(mode==='watch-and-memorize')body=memoryUi();
    else if(mode==='hangman')body=hangmanUi();
    else if(mode==='wordsearch')body=wordsearchUi();
    else if(mode==='open-the-box')body=openBoxUi();
    else if(mode==='spin-the-wheel')body=wheelUi();
    else if(mode==='word-magnets')body=magnetsUi();
    else if(inputModes.has(mode)){body=inputUi();if(mode==='unjumble'||mode==='anagram')body+=`<div class="field"><label>Jawabanmu</label><input id="game-input" autocomplete="off" placeholder="Type your answer..." ${answered?'disabled':''}></div><button class="btn btn-primary" data-action="check-input" ${answered?'disabled':''}>Check answer</button>`;else body+=`<div class="game-answer"><input id="game-input" autocomplete="off" placeholder="Type your answer..." ${answered?'disabled':''}><button class="btn btn-primary" data-action="check-input" ${answered?'disabled':''}>Submit</button></div>`;}
    else body=genericUi();
    if(mode==='open-the-box'&&opened)body=choiceUi();
    if(mode==='spin-the-wheel'&&spinReady)body=choiceUi();
    if(mode==='watch-and-memorize'&&!memoryVisible)body=choiceUi();
    if(mode==='hangman'&&answered)body=`<div class="game-prompt">${esc(expected(current))}</div>`;
    const image=current.image?`<img class="game-image" src="${esc(current.image)}" alt="Question image" onerror="this.style.display='none'">`:'';
    mount.innerHTML=`${progress()}${prompt()}${image}${body}${notice()}${finishButton()}`;
    const inp=mount.querySelector('#game-input');if(inp&&typed){inp.value=typed;}
  }
  function renderResult(){resultReady=true;if(timerId)clearInterval(timerId);const max=questions.reduce((n,x)=>n+points(x),0);const pct=max?Math.round(score/max*100):0;mount.innerHTML=`<div class="game-result"><div style="font-size:60px">${pct>=80?'🏆':pct>=60?'🌟':'💪'}</div><div class="eyebrow">Game completed</div><h2 class="page-title">Great job!</h2><div class="score">${score}</div><p class="muted">dari ${max} poin · ${correctCount}/${questions.length} jawaban benar</p><div class="progress" style="max-width:360px;margin:18px auto"><span style="width:${pct}%"></span></div><p>${pct>=80?'Amazing work! Keep it up!':pct>=60?'Good effort! Keep practising!':'Practice makes progress. Try again!'}</p><button class="btn btn-primary" data-action="save-result">Simpan hasil</button></div>`;}
  function checkInput(){const val=mount.querySelector('#game-input')?.value||typed;record(isCorrectAnswer(val,q()),val);}
  mount.addEventListener('input',e=>{if(e.target.id==='game-input')typed=e.target.value;});
  mount.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.choice!==undefined){const val=b.dataset.choice;record(isCorrectAnswer(val,q()),val);return;}
    if(b.dataset.answer!==undefined){record(isCorrectAnswer(b.dataset.answer,q()),b.dataset.answer);return;}
    if(b.dataset.pair){const pairs=q().pairs||[{left:q().prompt,right:expected(q())}];const k=b.dataset.pair;if(k.startsWith('l'))matchLeft=k;else matchRight=k;if(matchLeft&&matchRight){const li=Number(matchLeft.slice(1)),ri=Number(matchRight.slice(1));if(li===ri){matched.add(li);matchLeft=null;matchRight=null;if(matched.size===pairs.length)record(true,`${matched.size} pairs matched`);}else{feedback='Belum cocok, coba lagi.';matchLeft=null;matchRight=null;}render();return;}render();return;}
    if(b.dataset.memoryTile!==undefined){const idx=Number(b.dataset.memoryTile);if(memoryPairSelection.length>=2)memoryPairSelection=[];if(!memoryPairSelection.includes(idx))memoryPairSelection.push(idx);if(memoryPairSelection.length===2){const a=memoryTiles[memoryPairSelection[0]],z=memoryTiles[memoryPairSelection[1]];if(a.pairId===z.pairId&&a.side!==z.side){memoryPairMatched.add(a.pairId);memoryPairSelection=[];feedback='Great match!';if(memoryPairMatched.size===(q().pairs||[]).length){record(true,'All matching pairs found');return;}}else feedback='Belum cocok, coba pasangan lain.';}render();return;}
    if(b.dataset.wordcell){const [r,c]=b.dataset.wordcell.split(',').map(Number);const ch=wordGrid?.grid?.[r]?.[c];if(ch){wordSelectedCells.push({r,c,ch});const candidate=wordSelectedCells.map(x=>x.ch).join('');const found=wordGrid.words.find(w=>w===candidate&&!wordFound.has(w));if(found){wordFound.add(found);wordSelectedCells=[];feedback=`Good job! ${found} ditemukan.`;if(wordFound.size===wordGrid.words.length){record(true,`${wordFound.size} words found`);return;}}else if(!wordGrid.words.some(w=>w.startsWith(candidate))){wordSelectedCells=wordGrid.words.some(w=>w.startsWith(ch))?[{r,c,ch}]:[];feedback='Cari huruf berikutnya dari kata yang benar.';}render();}return;}
    if(b.dataset.word){selected.includes(b.dataset.word)?selected=selected.filter(x=>x!==b.dataset.word):selected.push(b.dataset.word);render();return;}
    if(b.dataset.letter){const ch=b.dataset.letter;if(!guessed.includes(ch)){guessed.push(ch);if(!String(expected(q())).toUpperCase().includes(ch))wrongGuesses++;const word=String(expected(q())).toUpperCase();if(word.split('').every(x=>x===' '||guessed.includes(x)))record(true,word);else if(wrongGuesses>=6)record(false,guessed.join(''));else render();}return;}
    if(b.dataset.magnet!==undefined){const sourceIndex=Number(b.dataset.magnet);if(!magnetUsed.has(sourceIndex)){magnetUsed.add(sourceIndex);magnetBuilt.push({char:b.dataset.char,sourceIndex});}render();return;}
    if(b.dataset.removeMagnet!==undefined){const removed=magnetBuilt.splice(Number(b.dataset.removeMagnet),1)[0];if(removed)magnetUsed.delete(removed.sourceIndex);render();return;}
    if(b.dataset.move!==undefined){const i=Number(b.dataset.move),j=i+Number(b.dataset.dir);if(j>=0&&j<orderItems.length){[orderItems[i],orderItems[j]]=[orderItems[j],orderItems[i]];render();}return;}
    switch(b.dataset.action){
      case 'next':next();break;case 'finish':renderResult();break;case 'check-input':checkInput();break;
      case 'open-box':opened=true;render();break;case 'spin':spinReady=true;render();break;
      case 'hide-memory':memoryVisible=false;render();break;case 'wordsearch-reset':wordSelectedCells=[];feedback='';render();break;
      case 'speak-prompt':{if('speechSynthesis'in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(q().prompt||q().word||'');u.lang='en-US';window.speechSynthesis.speak(u);}else feedback='Audio pronunciation tidak didukung browser ini.';render();break;}case 'speak-answer':{if('speechSynthesis'in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(expected(q()));u.lang='en-US';window.speechSynthesis.speak(u);}else feedback='Audio pronunciation tidak didukung browser ini.';render();break;}case 'speaking-practice':record(false,'Self-rated: needs more practice',0);break;case 'speaking-good':record(true,'Self-rated: good',Math.round(points(q())*.75));break;case 'speaking-confident':record(true,'Self-rated: confident',points(q()));break;
      case 'flip-card':flipped=true;render();break;
      case 'card-known':record(true,'Known',points(q()));break;
      case 'card-again':record(false,'Needs practice',0);break;
      case 'check-sort':{const items=q().items||[];const ok=items.every((it,i)=>sortValues[i]===it.group);record(ok,JSON.stringify(sortValues));break;}
      case 'check-order':{const target=q().items||String(expected(q())).split(',').map(x=>x.trim());const ok=orderItems.every((x,i)=>norm(x)===norm(target[i]));record(ok,orderItems.join(', '));break;}
      case 'check-words':{const words=q().words||[expected(q())];const ok=words.every(w=>selected.includes(w));record(ok,selected.join(', '));break;}
      case 'check-magnets':{const val=magnetBuilt.map(x=>x.char).join('');record(isCorrectAnswer(val,q()),val);break;}
      case 'save-result':finish();break;
    }
  });
  mount.addEventListener('change',e=>{if(e.target.dataset.sort!==undefined){sortValues[e.target.dataset.sort]=e.target.value;}});
  function timeUp(){if(finished||resultReady)return;if(timerId)clearInterval(timerId);if(!answered){answers.push({questionId:q().questionId||q().id||String(index+1),prompt:q().prompt||`Question ${index+1}`,answer:expected(q()),given:'Time expired',correct:false,points:0,category:q().category||ctx.material?.category||'General'});}for(let i=index+1;i<questions.length;i++){answers.push({questionId:questions[i].questionId||questions[i].id||String(i+1),prompt:questions[i].prompt||`Question ${i+1}`,answer:expected(questions[i]),given:'Not answered',correct:false,points:0,category:questions[i].category||ctx.material?.category||'General'});}index=questions.length-1;answered=true;feedback='Waktu habis. Jawaban yang belum dikerjakan dicatat sebagai belum benar.';render();}
  // The finish callback is called only after the student confirms the result screen.
  render();
  if(timeLimitSec){timerId=setInterval(()=>{timeLeft=Math.max(0,timeLeft-1);const el=mount.querySelector('#game-time');if(el){el.textContent=`⏱ ${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,'0')}`;if(timeLeft<=30)el.classList.add('red');}if(timeLeft<=0)timeUp();},1000);}
  return {destroy(){if(timerId)clearInterval(timerId);mount.replaceChildren();},getMode(){return mode;}};
}
