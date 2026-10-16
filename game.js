'use strict';
const KEY='resilient-home-2040-v1';
const profiles=[
{name:'Semi-detached family',description:'Two adults and two children, gas boiler, moderate income.',cash:18000,carbon:7.2,resilience:42,comfort:66},
{name:'Rural retired couple',description:'Fixed pension, oil heating and flood exposure.',cash:14000,carbon:8.1,resilience:30,comfort:61},
{name:'Student rental',description:'Four tenants, limited authority to retrofit, low income.',cash:7000,carbon:4.8,resilience:38,comfort:52},
{name:'Urban apartment',description:'Shared heating, no private roof, summer overheating.',cash:12000,carbon:5.1,resilience:45,comfort:58}
];
const actions=[
{id:'audit',name:'Energy audit and monitoring',cost:450,carbon:-.12,resilience:2,comfort:2},
{id:'insulation',name:'Insulation and draughtproofing',cost:3500,carbon:-.55,resilience:3,comfort:9},
{id:'heatpump',name:'Low-carbon heat pump',cost:8500,carbon:-1.25,resilience:1,comfort:4},
{id:'solar',name:'Rooftop solar PV',cost:6000,carbon:-.75,resilience:4,comfort:0},
{id:'flood',name:'Flood resilience package',cost:2800,carbon:0,resilience:16,comfort:1},
{id:'cooling',name:'Passive summer cooling',cost:1900,carbon:-.08,resilience:10,comfort:12},
{id:'food',name:'Food waste and travel changes',cost:600,carbon:-.42,resilience:1,comfort:-1},
{id:'reserve',name:'Emergency preparedness',cost:1500,carbon:0,resilience:9,comfort:1}
];
const rounds=[
{year:2028,title:'Transition planning',brief:'Energy prices and technology performance are uncertain.',cash:0,carbon:0,resilience:0,comfort:0},
{year:2030,title:'Energy price shock',brief:'A sustained price increase raises household costs.',cash:-1400,carbon:0,resilience:-2,comfort:-2},
{year:2032,title:'Summer heatwave',brief:'An extreme summer challenges poorly shaded homes.',cash:-350,carbon:.12,resilience:-5,comfort:-9},
{year:2035,title:'Policy and retrofit incentives',brief:'An uncertain grant scheme creates a window for investment.',cash:700,carbon:0,resilience:0,comfort:0},
{year:2038,title:'Storm and infrastructure disruption',brief:'Severe rain and outages expose vulnerabilities.',cash:-900,carbon:.1,resilience:-8,comfort:-4},
{year:2040,title:'Final transition decision',brief:'Make a final choice while future conditions remain unknown.',cash:-250,carbon:0,resilience:0,comfort:0}
];
const fresh=()=>({round:0,teams:profiles.map((p,i)=>({id:i,name:'Team '+String.fromCharCode(65+i),profile:i,cash:p.cash,carbon:p.carbon,resilience:p.resilience,comfort:p.comfort,owned:[],history:[],pending:null}))});
let state;try{state=JSON.parse(localStorage.getItem(KEY))||fresh();if(!Array.isArray(state.teams)||state.teams.length!==4)throw Error('invalid')}catch{state=fresh()}
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),gbp=n=>'£'+Math.round(n).toLocaleString('en-GB');
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
function tab(id){for(const s of ['student','lecturer','guide','cloud'])$(s).hidden=s!==id;render()}
function render(){const previous=$('team').value||'0';$('team').innerHTML=state.teams.map(t=>'<option value="'+t.id+'">'+t.name+'</option>').join('');$('team').value=previous;const t=state.teams[Number($('team').value)]||state.teams[0],p=profiles[t.profile],r=rounds[state.round];
$('profile').innerHTML='<div class="card"><h3>'+p.name+'</h3><p>'+p.description+'</p><p>Cash: '+gbp(t.cash)+' · Annual carbon: '+t.carbon.toFixed(2)+' tCO₂e · Resilience: '+t.resilience+'/100 · Comfort: '+t.comfort+'/100</p></div>';
$('brief').innerHTML='<div class="card"><strong>Round '+(state.round+1)+'/6 · '+r.year+': '+r.title+'</strong><p>'+r.brief+'</p><p class="muted">The future pathway remains uncertain.</p></div>';
$('choices').innerHTML=actions.map(a=>'<label class="action"><input type="checkbox" value="'+a.id+'" '+(t.owned.includes(a.id)||t.pending?'disabled':'')+'><span><strong>'+a.name+'</strong> · '+gbp(a.cost)+'<br><small>Illustrative annual carbon change: '+a.carbon+' tCO₂e; resilience: '+a.resilience+'; comfort: '+a.comfort+'</small></span></label>').join('');
$('reason').disabled=!!t.pending;$('strategy').disabled=!!t.pending;
$('notice').textContent=t.pending?'Decision submitted. Await the lecturer.':'Choose investments within available cash and explain your decision.';
$('history').innerHTML=t.history.map(h=>'<p><strong>'+h.year+'</strong>: '+h.actions.join(', ')+' ('+h.strategy+'). '+h.reason.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'</p>').join('')||'<p>No completed rounds yet.</p>';
$('round').textContent='Round '+(state.round+1)+' / 6 · '+r.year;
$('scores').innerHTML=state.teams.map(t=>'<tr><td>'+t.name+'</td><td>'+profiles[t.profile].name+'</td><td>'+gbp(t.cash)+'</td><td>'+t.carbon.toFixed(2)+'</td><td>'+t.resilience+'</td><td>'+t.comfort+'</td><td>'+(t.pending?'Yes':'No')+'</td></tr>').join('');
}
function submitDecision(){const t=state.teams[Number($('team').value)],ids=[...document.querySelectorAll('#choices input:checked')].map(x=>x.value),cost=ids.reduce((sum,id)=>sum+actions.find(a=>a.id===id).cost,0),reason=$('reason').value.trim();if(t.pending)return;if(!reason){$('notice').textContent='A decision rationale is required.';return}if(cost>t.cash){$('notice').textContent='Investment exceeds available cash.';return}t.pending={ids,strategy:$('strategy').value,reason};save();render()}
function advance(){if(state.round===5&&state.teams.every(t=>t.pending===null)){$('facnotice').textContent='The final round is complete. Export results or reset.';return}if(!state.teams.every(t=>t.pending)){$('facnotice').textContent='Wait until all four teams have submitted.';return}
const r=rounds[state.round];for(const t of state.teams){const d=t.pending,chosen=d.ids.map(id=>actions.find(a=>a.id===id));t.cash-=chosen.reduce((s,a)=>s+a.cost,0);t.carbon=clamp(t.carbon+chosen.reduce((s,a)=>s+a.carbon,0)+r.carbon,.3,20);t.resilience=clamp(t.resilience+chosen.reduce((s,a)=>s+a.resilience,0)+r.resilience,0,100);t.comfort=clamp(t.comfort+chosen.reduce((s,a)=>s+a.comfort,0)+r.comfort,0,100);t.cash=Math.max(0,t.cash+r.cash);if(d.strategy==='precaution')t.resilience=clamp(t.resilience+2,0,100);if(d.strategy==='conserve')t.cash+=250;t.owned.push(...d.ids);t.history.push({year:r.year,actions:chosen.map(a=>a.name),strategy:d.strategy,reason:d.reason});t.pending=null}
if(state.round<5)state.round++;else{state.round=5;state.finished=true}save();$('facnotice').textContent=state.finished?'Simulation complete. Export results.':'Round advanced.';render()}
function exportSession(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='resilient-home-2040-session.json';a.click();URL.revokeObjectURL(url)}
function resetSession(){if(confirm('Delete this browser session and reset all teams?')){state=fresh();save();render()}}
render();