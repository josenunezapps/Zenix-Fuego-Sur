const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const statuses=["new","shortlisted","proposal_ready","approved_to_apply","applied","contracted","in_progress","ready_to_deliver","approved_to_deliver","delivered","archived"];
const safe=(v,n=6000)=>String(v??"").slice(0,n);
async function scan(DB){
 const q=encodeURIComponent('is:issue is:open bounty');
 const r=await fetch("https://api.github.com/search/issues?q="+q+"&per_page=20",{headers:{"User-Agent":"Zenix-AutoWorker","Accept":"application/vnd.github+json"}});
 if(!r.ok)throw Error("GitHub "+r.status);
 const data=await r.json();let found=0;
 for(const x of data.items||[]){
  if(!/^https:\/\/github\.com\//.test(x.html_url||""))continue;
  const id=crypto.randomUUID();
  await DB.prepare("INSERT OR IGNORE INTO jobs(id,title,url,source,description,score) VALUES(?,?,?,?,?,?)").bind(id,safe(x.title,250),x.html_url,"github-issues",safe(x.body),20).run();
  found++;
 }
 await DB.prepare("INSERT INTO events(event) VALUES(?)").bind("Escaneo: "+found+" coincidencias; pagos sin verificar").run();return found;
}
export default {
 async fetch(request,env){
 const url=new URL(request.url);
 if(!url.pathname.startsWith("/api/"))return env.ASSETS.fetch(request);
 if(!env.ADMIN_TOKEN||env.ADMIN_TOKEN.length<20)return json({error:"Falta configurar ADMIN_TOKEN (20+ caracteres)"},503);
 if(request.headers.get("Authorization")!=="Bearer "+env.ADMIN_TOKEN)return json({error:"No autorizado"},401);
 if(!env.DB)return json({error:"Falta configurar D1"},503);
 try{
 const p=url.pathname;
 if(p==="/api/health")return json({ok:true,version:"1.0"});
 if(p==="/api/jobs"&&request.method==="GET"){const d=await env.DB.prepare("SELECT * FROM jobs ORDER BY updated_at DESC LIMIT 150").all();return json({jobs:d.results})}
 if(p==="/api/events"&&request.method==="GET"){const d=await env.DB.prepare("SELECT * FROM events ORDER BY id DESC LIMIT 40").all();return json({events:d.results})}
 if(p==="/api/scan"&&request.method==="POST")return json({found:await scan(env.DB),note:"NO son encargos pagos verificados"});
 if(p==="/api/jobs"&&request.method==="POST"){
  const b=await request.json(),title=safe(b.title,250).trim(),link=safe(b.url,1000);
  if(title.length<4||!/^https?:\/\//.test(link))return json({error:"Título y enlace válidos obligatorios"},400);
  await env.DB.prepare("INSERT OR IGNORE INTO jobs(id,title,url,source,description) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),title,link,"manual",safe(b.description)).run();
  return json({ok:true});
 }
 const m=p.match(/^\/api\/jobs\/([a-f0-9-]{36})$/);
 if(m&&request.method==="PATCH"){
  const old=await env.DB.prepare("SELECT * FROM jobs WHERE id=?").bind(m[1]).first();if(!old)return json({error:"No existe"},404);
  const b=await request.json(),next=b.status===undefined?old.status:safe(b.status,40);
  if(!statuses.includes(next))return json({error:"Estado inválido"},400);
  const transitions={new:["shortlisted","archived"],shortlisted:["proposal_ready","archived"],proposal_ready:["approved_to_apply","shortlisted","archived"],approved_to_apply:["applied","proposal_ready"],applied:["contracted","archived"],contracted:["in_progress","archived"],in_progress:["ready_to_deliver","archived"],ready_to_deliver:["approved_to_deliver","in_progress"],approved_to_deliver:["delivered","in_progress"],delivered:["archived"],archived:["new"]};
  if(next!==old.status&&!transitions[old.status]?.includes(next))return json({error:"Transición no permitida"},400);
  const draft=b.draft===undefined?old.draft:safe(b.draft,12000),notes=b.notes===undefined?old.notes:safe(b.notes);
  if(next==="approved_to_apply"&&!draft.trim())return json({error:"Primero redactá una propuesta"},400);
  await env.DB.prepare("UPDATE jobs SET status=?,draft=?,notes=?,updated_at=datetime('now') WHERE id=?").bind(next,draft,notes,m[1]).run();
  await env.DB.prepare("INSERT INTO events(job_id,event) VALUES(?,?)").bind(m[1],old.status+" → "+next+" (sin envío externo)").run();
  return json({ok:true});
 }
 return json({error:"No existe"},404);
 }catch(e){return json({error:safe(e.message,300)},500)}
 },
 async scheduled(ctrl,env,ctx){if(env.DB)ctx.waitUntil(scan(env.DB).catch(e=>env.DB.prepare("INSERT INTO events(event) VALUES(?)").bind("Fallo escaneo: "+String(e.message).slice(0,150)).run()))}
};