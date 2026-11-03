(function(){
'use strict';
const $=id=>document.getElementById(id);
let previewUrls=[],busy=false;
const fields=['group','chapter','section','chapterTitle','title'];
function clearPreview(){previewUrls.forEach(URL.revokeObjectURL);previewUrls=[];$('imagePreview').replaceChildren();}
$('images').onchange=()=>{
 clearPreview();const files=[...$('images').files];
 $('imageStatus').textContent=files.length+' afbeelding(en) geselecteerd. Vul hieronder klas, nummers en titels in en klik op Genereer les.';
 for(const file of files){const url=URL.createObjectURL(file);previewUrls.push(url);const wrap=document.createElement('div'),image=document.createElement('img'),label=document.createElement('p');image.src=url;image.alt=file.name;image.style.cssText='max-width:160px;max-height:200px;object-fit:contain';label.textContent=file.name;wrap.append(image,label);$('imagePreview').append(wrap);}
};
async function imageData(file){
 if(!['image/png','image/jpeg'].includes(file.type)&&!(/\.(png|jpe?g)$/i.test(file.name)))throw Error('Kies PNG- of JPG-bestanden.');
 if(file.size>15*1024*1024)throw Error(file.name+' is groter dan 15 MB. Kies een kleinere uitsnede.');
 const bitmap=await createImageBitmap(file);
 try{
  if(bitmap.width*bitmap.height>60_000_000)throw Error('De afbeelding is te groot. Maak een kleinere uitsnede.');
  const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const result=canvas.toDataURL('image/jpeg',.92);
  if(result.length>3_500_000)throw Error(file.name+' blijft te groot. Upload een kleinere uitsnede.');
  return result;
 }finally{bitmap.close();}
}
$('generate').onclick=async()=>{
 if(busy)return;
 try{
  const files=[...$('images').files];if(!files.length||files.length>8)throw Error('Selecteer één tot acht PNG- of JPG-afbeeldingen.');
  const meta={group:$('group').value,chapter:Number($('chapter').value),section:Number($('section').value),chapterTitle:$('chapterTitle').value.trim(),title:$('title').value.trim()};
  if(!['chapter','section'].every(k=>Number.isInteger(meta[k])&&meta[k]>=1&&meta[k]<=99)||!meta.title||!meta.chapterTitle)throw Error('Vul eerst de klas, hoofdstuk- en paragraafnummers en beide titels in.');
  if((window.WIZNOVA_CATALOG||[]).some(x=>(x.group||'mathfinity')===meta.group&&Number(x.chapter)===meta.chapter&&Number(x.section)===meta.section)&&!$('overwrite').checked)throw Error('Deze paragraaf bestaat al. Kies een ander nummer of vink bewust vervangen aan.');
  busy=true;$('generate').disabled=true;$('import').disabled=true;$('images').disabled=true;fields.forEach(id=>$(id).disabled=true);$('prepare').disabled=true;window.WIZNOVA_ADMIN.clear();
  $('imageStatus').textContent='Afbeeldingen voorbereiden…';
  const images=[];for(const f of files)images.push(await imageData(f));
  if(images.join('').length>17_000_000)throw Error('De afbeeldingen zijn samen te groot. Selecteer minder afbeeldingen.');
  $('imageStatus').textContent='Les maken op drie niveaus… Dit kan ongeveer twee minuten duren. Houd deze pagina open.';
  const result=await window.WIZNOVA_AUTH.call('generate',{meta,images});
  const packet=window.WIZNOVA_RENDER(meta,result.lesson);
  window.WIZNOVA_ADMIN.load(packet);
  $('recognition').textContent='Herkende lesstof: '+result.lesson.sourceSummary;
  $('warnings').textContent=result.lesson.warnings.length?'Controlepunten: '+result.lesson.warnings.join(' · '):'Controleer de theorie, antwoorden en niveaus voordat je publiceert.';
  $('imageStatus').textContent='De drie lespagina’s zijn gemaakt. Controleer ze hieronder en klik op Drie pagina’s en hoofdstukkeuze maken.';
  document.querySelector('iframe').scrollIntoView({behavior:'smooth',block:'center'});
 }catch(e){$('imageStatus').textContent=e.name==='TimeoutError'?'Het genereren duurde te lang. Probeer minder afbeeldingen.':e.message||'Genereren is mislukt.';}
 finally{busy=false;$('generate').disabled=false;$('import').disabled=false;$('images').disabled=false;fields.forEach(id=>$(id).disabled=false);}
};
})();
