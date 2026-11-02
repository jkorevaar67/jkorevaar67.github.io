'use strict';
const $=id=>document.getElementById(id), enc=new TextEncoder();
let lesson=null,output=null;
const catalog=structuredClone(window.WIZNOVA_CATALOG||[]);
function status(s){$('status').textContent=s}
function invalidate(){output=null;$('download').disabled=true}
for(const id of ['group','chapter','section','chapterTitle','title','overwrite']) $(id).addEventListener('input',invalidate);
$('files').onchange=()=>{lesson=null;invalidate();$('prepare').disabled=true};
function validPage(s){return typeof s==='string'&&s.length<3000000&&/<!doctype html|<html[\s>]/i.test(s)&&/<head[\s>]/i.test(s)&&/<body[\s>]/i.test(s)}
$('import').onclick=async()=>{try{
 invalidate();lesson=null;const files=[...$('files').files];let item;
 if(files.length===1&&/\.json$/i.test(files[0].name))item=JSON.parse(await files[0].text());
 else{if(files.length!==3)throw Error('Selecteer één JSON-lespakket of precies drie HTML-pagina’s.');item={pages:{}};for(const f of files){const k=/-exercise\.html$/.test(f.name)?'exercise':/-test\.html$/.test(f.name)?'test':'learn';if(item.pages[k])throw Error('Er ontbreekt een pagina of een paginatype is dubbel geselecteerd.');item.pages[k]=await f.text();}const m=files[0].name.match(/^chapter-(\d+)-(\d+)/);if(m){item.chapter=Number(m[1]);item.section=Number(m[2]);}}
 for(const k of ['learn','exercise','test'])if(!validPage(item.pages?.[k]))throw Error('Geen complete HTML-pagina voor '+k+'.');
 lesson=item;$('group').value=item.group||'mathfinity';for(const k of ['chapter','section','chapterTitle','title'])$(k).value=item[k]||'';
 $('prepare').disabled=false;status('Drie pagina’s ingelezen. Controleer nummer en titels.');show();
 }catch(e){lesson=null;$('prepare').disabled=true;status(e.message)}};
function show(){document.querySelector('iframe').srcdoc=lesson?.pages[$('view').value]||''}
$('view').onchange=show;
$('prepare').onclick=async()=>{try{invalidate();if(!lesson)throw Error('Importeer eerst het lespakket.');
 const chapter=Number($('chapter').value),section=Number($('section').value),chapterTitle=$('chapterTitle').value.trim(),title=$('title').value.trim();
 if(!Number.isInteger(chapter)||chapter<1||chapter>99||!Number.isInteger(section)||section<1||section>99||!title||!chapterTitle)throw Error('Vul geldige nummers (1–99) en beide titels in.');
 if(lesson.chapter&&Number(lesson.chapter)!==chapter||lesson.section&&Number(lesson.section)!==section)throw Error('Het nummer wijkt af van het lespakket. Laat het pakket eerst door ChatGPT aanpassen, inclusief de puntenidentificatie.');
 const group=$('group').value,dir=group==='mathfinity'?'en':'wiznova';
 if(lesson.group&&lesson.group!==group)throw Error('De klas wijkt af van het lespakket.');
 const exists=catalog.some(x=>(x.group||'mathfinity')===group&&x.chapter===chapter&&x.section===section);
 if(exists&&!$('overwrite').checked)throw Error('Deze paragraaf bestaat al. Kies een nieuw nummer of vink bewust vervangen aan.');
 const prefix=`${group==='mathfinity'?'':group+'-'}chapter-${chapter}-${section}`,entry={group,chapter,section,chapterTitle,title,pages:{learn:prefix+'.html',exercise:prefix+'-exercise.html',test:prefix+'-test.html'}};
 const next=catalog.filter(x=>!((x.group||'mathfinity')===group&&x.chapter===chapter&&x.section===section));next.push(entry);next.sort((a,b)=>a.chapter-b.chapter||a.section-b.section);
 const safe=JSON.stringify(next,null,2).replace(/</g,'\\u003c');
 const choose=await fetch('../'+dir+'/choose-topic.html',{cache:'no-store'});if(!choose.ok)throw Error('Hoofdstukkeuze niet bereikbaar. Open beheer via je website.');const chooseHtml=await choose.text();
 if(!chooseHtml.includes('chapter-catalog.js'))throw Error('Upload eerst de volledige website met beheerfunctie.');
 output=new Map();for(const k of ['learn','exercise','test'])output.set(dir+'/'+entry.pages[k],enc.encode(lesson.pages[k]));
 output.set('en/chapter-catalog.js',enc.encode('window.WIZNOVA_CATALOG = '+safe+';\n'));output.set(dir+'/choose-topic.html',enc.encode(chooseHtml));
 $('download').disabled=false;status(`Gereed: ${chapter}.${section} · ${title}\nDrie pagina’s en de hoofdstukkeuze staan klaar voor upload. Bestaande overige paragrafen blijven behouden.`);
 }catch(e){status(e.message)}};
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function zip(files){let chunks=[],central=[],offset=0;const now=new Date(),time=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1),date=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
 for(const [path,bytes] of files){const name=enc.encode(path),crc=crc32(bytes),h=new Uint8Array(30+name.length),v=new DataView(h.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(10,time,true);v.setUint16(12,date,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);h.set(name,30);chunks.push(h,bytes);
 const c=new Uint8Array(46+name.length),w=new DataView(c.buffer);w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint16(8,0x800,true);w.setUint16(12,time,true);w.setUint16(14,date,true);w.setUint32(16,crc,true);w.setUint32(20,bytes.length,true);w.setUint32(24,bytes.length,true);w.setUint16(28,name.length,true);w.setUint32(42,offset,true);c.set(name,46);central.push(c);offset+=h.length+bytes.length;}
 const size=central.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.size,true);v.setUint16(10,files.size,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);return new Blob([...chunks,...central,end],{type:'application/zip'})}
$('download').onclick=()=>{if(!output)return;const u=URL.createObjectURL(zip(output)),a=document.createElement('a');a.href=u;a.download=`Wiznova-${$('chapter').value}-${$('section').value}-publicatie.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000)};
