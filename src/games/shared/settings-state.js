// Only known game preferences are stored. No questions, answers or account data.
const VERSION=1;
function available(field,value){return field.options?.some(option => option.value===value && !option.disabled);}
export function normalizeSettings(schema,values){
 const result={...schema.defaults};
 if(!values || typeof values!=='object' || Array.isArray(values)) return result;
 for(const field of schema.fields){
  const value=values[field.key];
  if(field.type==='toggle' ? typeof value==='boolean' : available(field,value)) result[field.key]=value;
 }
 return result;
}
export function validateSettings(schema,values){
 const errors=[];
 for(const field of schema.fields){
  const value=values?.[field.key];
  const valid=field.type==='toggle' ? typeof value==='boolean' : available(field,value);
  if(!valid) errors.push({fields:[field.key],message:'Choose an available option for '+field.label.toLowerCase()+'.'});
 }
 if(!errors.length) errors.push(...(schema.validate?.(values)||[]));
 return errors;
}
export function changeSetting(schema,values,key,value){
 if(!schema.fields.some(field=>field.key===key)) return {...values};
 const draft={...values,[key]:value};
 return schema.adjust ? schema.adjust(draft,key) : draft;
}
export function settingsKey(schema,selection){
 return 'qb-interactive-learning-kits.settings.v1.'+schema.id+'.'+encodeURIComponent(selection?.questionSet?.name || 'no-question-set');
}
function browserStorage(){try{return globalThis.localStorage;}catch{return null;}}
export function readSettings(schema,selection,storage=browserStorage()){
 try{
  const stored=JSON.parse(storage?.getItem(settingsKey(schema,selection)) || 'null');
  return normalizeSettings(schema,stored?.version===VERSION ? stored.values : null);
 }catch{return {...schema.defaults};}
}
export function saveSettings(schema,selection,values,storage=browserStorage()){
 try{
  if(!storage) return false;
  storage.setItem(settingsKey(schema,selection),JSON.stringify({version:VERSION,values:normalizeSettings(schema,values)}));
  return true;
 }catch{return false;}
}
export function describeSettings(schema,values){
 return schema.fields.filter(field=>field.type!=='toggle').map(field=>{
  const option=field.options.find(option=>option.value===values[field.key]);
  return option?.label || 'Choose '+field.label.toLowerCase();
 }).join(' · ');
}
