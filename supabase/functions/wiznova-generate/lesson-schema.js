export const object = properties => ({type:'object',additionalProperties:false,properties,required:Object.keys(properties)});
const text = {type:'string'};
const question = object({prompt:text,options:{type:'array',items:text,minItems:4,maxItems:4},answer:{type:'integer',minimum:0,maximum:3},hint:text,explanation:text});
const level = object({theory:{type:'array',minItems:2,maxItems:6,items:object({heading:text,text,example:text})},exercise:{type:'array',minItems:5,maxItems:5,items:question},test:{type:'array',minItems:10,maxItems:10,items:question}});
export const schema=object({readable:{type:'boolean'},sourceSummary:text,warnings:{type:'array',items:text},basic:level,intermediate:level,challenge:level});
export function validateLesson(x) {
 if(!x||typeof x.readable!=='boolean'||typeof x.sourceSummary!=='string'||!Array.isArray(x.warnings)||x.warnings.some(v=>typeof v!=='string'))throw Error('Onvolledige lesinhoud ontvangen.');
 if(!x.readable)throw Error('De afbeeldingen zijn niet goed genoeg leesbaar. Upload scherpere uitsneden.');
 for(const key of ['basic','intermediate','challenge']){
  const level=x[key];if(!level||!Array.isArray(level.theory)||level.theory.length<2||level.theory.length>6)throw Error('Theorie ontbreekt voor '+key);
  for(const t of level.theory)if(!['heading','text','example'].every(k=>typeof t[k]==='string'&&t[k].trim()))throw Error('Onvolledige theorie.');
  for(const kind of ['exercise','test']){
   if(!Array.isArray(level[kind])||level[kind].length!==(kind==='test'?10:5))throw Error('Er moeten vijf oefenvragen en tien toetsvragen per niveau zijn.');
   for(const q of level[kind])if(!q||!['prompt','hint','explanation'].every(k=>typeof q[k]==='string'&&q[k].trim())||!Array.isArray(q.options)||q.options.length!==4||q.options.some(o=>typeof o!=='string'||!o.trim())||new Set(q.options.map(o=>o.trim().toLowerCase())).size!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)throw Error('Een vraag is onvolledig of heeft dubbele antwoordopties.');
  }
 }
 return x;
}
