// Supabase Edge Function: classroom
// Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as function secrets.
// Uses server-side team tokens; the lecturer token is never shared with students.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
const profiles=[{cash:18000,carbon:7.2,resilience:42,comfort:66},{cash:14000,carbon:8.1,resilience:30,comfort:61},{cash:7000,carbon:4.8,resilience:38,comfort:52},{cash:12000,carbon:5.1,resilience:45,comfort:58}];
const actions=[['audit',450,-.12,2,2],['insulation',3500,-.55,3,9],['heatpump',8500,-1.25,1,4],['solar',6000,-.75,4,0],['flood',2800,0,16,1],['cooling',1900,-.08,10,12],['food',600,-.42,1,-1],['reserve',1500,0,9,1]];
const shocks=[[0,0,0,0],[-1400,0,-2,-2],[-350,.12,-5,-9],[700,0,0,0],[-900,.1,-8,-4],[-250,0,0,0]];
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const random=(bytes=16)=>Array.from(crypto.getRandomValues(new Uint8Array(bytes)),x=>x.toString(16).padStart(2,'0')).join('');
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'POST required'},405);
 try{
 const body=await req.json(),db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const op=String(body.op||''),code=String(body.code||'').trim().toUpperCase(),token=String(body.token||'');
 if(op==='create'){
 const newCode=random(4).toUpperCase(),host=random(24);
 const {data:s,error:e}=await db.from('sessions').insert({code:newCode,host_token:host}).select().single();if(e)throw e;
 const teams=profiles.map((p,i)=>({session_id:s.id,team_id:i,token:random(24),state:{...p,owned:[],history:[]},pending:null}));
 const {error:te}=await db.from('teams').insert(teams);if(te)throw te;
 return reply({code:newCode,hostToken:host,teamTokens:teams.map(t=>t.token)});
 }
 if(!code||!token)return reply({error:'Session code and access token required'},400);
 const {data:s}=await db.from('sessions').select('*').eq('code',code).maybeSingle();if(!s)return reply({error:'Session not found'},404);
 const host=token===s.host_token;
 const {data:all,error:ae}=await db.from('teams').select('*').eq('session_id',s.id).order('team_id');if(ae)throw ae;
 const mine=all?.find(t=>t.token===token);if(!host&&!mine)return reply({error:'Invalid access token'},403);
 if(op==='status')return reply({round:s.round,finished:s.finished,teams:host?all.map(t=>({id:t.team_id,...t.state,submitted:!!t.pending})):undefined,team:mine?{id:mine.team_id,...mine.state,submitted:!!mine.pending}:undefined,submitted:all?.map(t=>!!t.pending)});
 if(op==='submit'){
 if(host||!mine)return reply({error:'Team access required'},403);
 if(s.finished||mine.pending)return reply({error:'Round already submitted or finished'},409);
 const ids=body.ids;if(!Array.isArray(ids)||ids.length>8||new Set(ids).size!==ids.length)return reply({error:'Invalid investments'},400);
 const selected=ids.map((id:string)=>actions.find(a=>a[0]===id));
 if(selected.some((a:unknown)=>!a)||ids.some((id:string)=>mine.state.owned.includes(id)))return reply({error:'Unknown or previously purchased investment'},400);
 const cost=selected.reduce((n:number,a:any)=>n+a[1],0);
 const reason=String(body.reason||'').trim().slice(0,2000),strategy=String(body.strategy||'');
 if(cost>mine.state.cash||!reason||!['balanced','precaution','conserve'].includes(strategy))return reply({error:'Invalid budget, strategy or rationale'},400);
 const {data:updated,error:ue}=await db.from('teams').update({pending:{ids,reason,strategy}}).eq('session_id',s.id).eq('team_id',mine.team_id).is('pending',null).select('team_id');
 if(ue)throw ue;if(!updated?.length)return reply({error:'Decision already submitted'},409);
 return reply({ok:true});
 }
 if(op==='advance'){
 if(!host)return reply({error:'Lecturer access required'},403);
 if(s.finished||all?.length!==4||all.some(t=>!t.pending))return reply({error:'All four teams must submit before advancing'},409);
 // Protect against concurrent lecturer advances by acquiring the session row using a conditional update.
 const next=s.round===5?5:s.round+1;
 const {data:locked,error:le}=await db.from('sessions').update({round:next,finished:s.round===5}).eq('id',s.id).eq('round',s.round).eq('finished',false).select('id');
 if(le)throw le;if(!locked?.length)return reply({error:'Round already advanced'},409);
 for(const t of all){
 const d=t.pending,selected=d.ids.map((id:string)=>actions.find(a=>a[0]===id)!);
 const st={...t.state};
 st.cash=Math.max(0,st.cash-selected.reduce((n:number,a:any)=>n+a[1],0)+shocks[s.round][0]+(d.strategy==='conserve'?250:0));
 st.carbon=clamp(st.carbon+selected.reduce((n:number,a:any)=>n+a[2],0)+shocks[s.round][1],.3,20);
 st.resilience=clamp(st.resilience+selected.reduce((n:number,a:any)=>n+a[3],0)+shocks[s.round][2]+(d.strategy==='precaution'?2:0),0,100);
 st.comfort=clamp(st.comfort+selected.reduce((n:number,a:any)=>n+a[4],0)+shocks[s.round][3],0,100);
 st.owned=[...st.owned,...d.ids];st.history=[...st.history,{round:s.round,ids:d.ids,strategy:d.strategy,reason:d.reason}];
 const {error:ue}=await db.from('teams').update({state:st,pending:null}).eq('session_id',s.id).eq('team_id',t.team_id);if(ue)throw ue;
 }
 return reply({ok:true,round:next,finished:s.round===5});
 }
 return reply({error:'Unknown operation'},400);
 }catch(e){return reply({error:'Request could not be completed',detail:String(e)},500)}
});
