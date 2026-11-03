(function(){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=x=>JSON.stringify(x).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
function runtime(){
 const $=id=>document.getElementById(id),english=META.group==='mathfinity',test=KIND==='test';
 const t=(en,nl)=>english?en:nl,preview=window.self!==window.top&&location.href==='about:srcdoc';
 let index=0,score=0,questions=[],usedHelp=false,tries=0,locked=false,round='';
 function theory(){const rows=CONTENT[$('level').value].theory;$('theory').replaceChildren();for(const row of rows){const card=document.createElement('section');card.className='card';const h=document.createElement('h2');h.textContent=row.heading;const p=document.createElement('p');p.textContent=row.text;const ex=document.createElement('p');ex.className='notice';ex.textContent=row.example;card.append(h,p,ex);$('theory').append(card);}}
 if(KIND==='learn'){$('level').onchange=theory;theory();return;}
 function show(){usedHelp=false;tries=0;locked=false;$('feedback').textContent='';$('help').textContent='';$('next').hidden=true;$('check').disabled=false;$('hint').hidden=test;$('answer').disabled=false;$('counter').textContent=t('Question ','Vraag ')+(index+1)+' / '+questions.length;$('prompt').textContent=questions[index].prompt;$('answer').replaceChildren(new Option(t('Choose an answer','Kies een antwoord'),''));questions[index].options.forEach((o,i)=>$('answer').add(new Option(String.fromCharCode(65+i)+'. '+o,String(i))));}
 $('start').onclick=()=>{
  if(test&&english&&!preview){const name=$('name').value.trim(),className=$('cls').value;if(!name||!className){$('error').textContent='Enter your name and class.';return;}try{localStorage.setItem('jkoMathLabStudentV3',JSON.stringify({name,className}));}catch{$('error').textContent='Browser storage is unavailable; points cannot be saved.';return;}}
  questions=CONTENT[$('level').value][KIND];index=0;score=0;round=crypto.randomUUID();$('setup').hidden=true;$('quiz').hidden=false;$('finish').hidden=true;show();
 };
 $('check').onclick=()=>{if(locked||$('answer').value==='')return;const q=questions[index];tries++;const correct=Number($('answer').value)===q.answer;const earns=correct&&tries===1&&!usedHelp;
  if(earns){score++;if(test&&english&&!preview)window.MathfinityRewards?.award(1,META.chapter+'.'+META.section+' '+META.title,round+'-'+index);}
  $('feedback').textContent=correct?t('Correct!','Goed!'):t('Not correct.','Niet goed.');
  if(correct||test){locked=true;$('check').disabled=true;$('answer').disabled=true;$('next').hidden=false;$('help').textContent=q.explanation;}else{$('help').textContent=t('Try again or use a hint.','Probeer opnieuw of gebruik een hint.');}
 };
 $('hint').onclick=()=>{usedHelp=true;$('help').textContent=questions[index].hint;};
 $('next').onclick=()=>{if(!locked)return;index++;if(index<questions.length){show();return;}$('quiz').hidden=true;$('finish').hidden=false;$('summary').textContent=score+' / '+questions.length+t(' correct on the first try without help.',' in één keer goed zonder hulp.');};
 $('again').onclick=()=>{$('finish').hidden=true;$('setup').hidden=false;};
 if(test&&english){try{const p=JSON.parse(localStorage.getItem('jkoMathLabStudentV3')||'{}');$('name').value=p.name||'';$('cls').value=p.className||'';}catch{}}
}
window.WIZNOVA_RENDER=function(meta,content){
 for(const key of ['basic','intermediate','challenge'])if(!content[key]?.theory?.length||content[key].exercise?.length!==5||content[key].test?.length!==10)throw Error('Onvolledige les ontvangen.');
 const en=meta.group==='mathfinity',t=(a,b)=>en?a:b,prefix=(en?'':meta.group+'-')+'chapter-'+meta.chapter+'-'+meta.section;
 const pages={},labels={learn:t('Learn','Leren'),exercise:t('Exercise','Oefenen'),test:t('Test','Test maken')};
 const back='choose-topic.html'+(en?'':'?klas='+meta.group);
 for(const kind of Object.keys(labels)){
  const pointScript=en&&kind==='test'?'<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script>'+window.WIZNOVA_POINT_SCRIPT+'</script>':'';
  const profile=en&&kind==='test'?'<label>Your name<input id="name" autocomplete="name" maxlength="80"></label><label>Your class<select id="cls"><option value="">Choose class</option><option>TVWO 1A</option><option>TVWO 1B</option></select></label><p>Only a correct first answer earns one point for Student of the Week. Database limits may apply.</p>':'';
  const info=kind==='test'&&!en?'<p>Je ziet je score na afloop. Deze test schrijft geen punten naar de Mathfinity-ranglijst.</p>':'';
  const level='<label>'+t('Level','Niveau')+'<select id="level"><option value="basic">'+t('Basic','Basis')+'</option><option value="intermediate">'+t('Intermediate','Gemiddeld')+'</option><option value="challenge">'+t('Challenge','Uitdagend')+'</option></select></label>';
  pages[kind]='<!doctype html><html lang="'+(en?'en':'nl')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="object-src \'none\'; base-uri \'self\'"><title>'+esc(meta.chapter+'.'+meta.section+' · '+meta.title)+'</title><style>*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0;background:#f3f5fc;color:#303c61;font:17px/1.65 system-ui}nav,header{padding:22px;background:#e8eafa}nav a{margin-right:18px}main{max-width:900px;margin:25px auto;padding:0 18px}.card{background:white;border:1px solid #dcdff2;border-radius:18px;padding:24px;margin:18px 0}h1,h2{line-height:1.25}p{white-space:pre-wrap}a{color:#35487c}.button,button{display:inline-block;background:#b1bbed;color:#303d6b;padding:12px 18px;border:0;border-radius:10px;text-decoration:none;font:inherit;font-weight:700;margin:5px;cursor:pointer}button:disabled{opacity:.5}label{display:block;font-weight:700;margin:12px 0}input,select{display:block;width:100%;max-width:600px;padding:12px;border:1px solid #c5cbed;border-radius:10px;font:inherit}.notice{background:#e9eafa;padding:16px;border-radius:12px}#prompt{font-size:1.15rem;font-weight:700}#pointStatus:empty{display:none}</style></head><body><nav><a href="index.html">'+t('Home','Start')+'</a><a href="'+back+'">'+t('Choose a section','Kies een paragraaf')+'</a></nav><header><p>'+esc(meta.chapterTitle)+'</p><h1>'+esc(meta.chapter+'.'+meta.section+' · '+meta.title)+'</h1></header><main><div>'+Object.entries(labels).map(([k,label])=>'<a class="button" '+(k===kind?'aria-current="page" ':'')+'href="'+prefix+(k==='learn'?'':'-'+k)+'.html">'+label+'</a>').join('')+'</div>'+(kind==='learn'?'<section class="card">'+level+'</section><div id="theory"></div>':'<section id="setup" class="card"><h2>'+labels[kind]+'</h2>'+level+profile+info+'<p>'+(kind==='test'?t('Ten questions per level.','Tien vragen per niveau.'):t('Five questions per level.','Vijf vragen per niveau.'))+'</p><button id="start">'+t('Start','Start')+'</button><p id="error" role="alert"></p></section><section id="quiz" class="card" hidden><p id="counter"></p><p id="prompt"></p><label>'+t('Your answer','Jouw antwoord')+'<select id="answer"></select></label><button id="check">'+t('Check answer','Controleer')+'</button><button id="hint">'+t('Hint','Hint')+'</button><p id="feedback" role="status"></p><p id="help" class="notice"></p><button id="next" hidden>'+t('Next','Volgende')+'</button></section><section id="finish" class="card" hidden><h2>'+t('Your result','Jouw resultaat')+'</h2><p id="summary"></p><button id="again">'+t('Try again','Opnieuw')+'</button></section>')+'<p id="pointStatus" class="notice" role="status"></p></main>'+pointScript+'<script>const META='+safe(meta)+',CONTENT='+safe(content)+',KIND='+safe(kind)+';('+runtime.toString()+')();</script></body></html>';
  pages[kind]=pages[kind].replace('</head>','<link rel="stylesheet" href="/assets/site-layout.css"></head>').replace('<body>','<body class="site-unified">').replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/,window.WIZNOVA_NAV_BUILD(meta.group));
 }
 return {version:1,...meta,pages,generatedFromImages:true};
};
})();
