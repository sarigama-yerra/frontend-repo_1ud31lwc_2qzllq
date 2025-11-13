import React, { useEffect, useMemo, useState } from 'react'
import Gamification from './components/Gamification'
import Banking from './components/Banking'

const API = import.meta.env.VITE_BACKEND_URL || ''

function Section({ title, children, actions }){
  return (
    <div className="bg-white/70 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <div>{actions}</div>
      </div>
      <div>{children}</div>
    </div>
  )
}

function useFetch(url){
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const refetch = async ()=>{
    if(!url) return
    try{
      setLoading(true)
      const res = await fetch(url)
      const j = await res.json()
      setData(j)
    }catch(e){ setError(e)} finally{ setLoading(false)}
  }
  useEffect(()=>{refetch()},[url])
  return {data, loading, error, refetch}
}

function GamificationPanel(){
  const {data, loading, refetch} = useFetch(`${API}/api/gamification/profile?user_id=demo-user`)
  return (
    <Section title="Your Progress" actions={<button onClick={refetch} className="px-3 py-1 text-sm bg-slate-800 text-white rounded">Refresh</button>}>
      {loading && <div>Loading...</div>}
      {!!data && (
        <div className="space-y-2">
          <div className="text-slate-700">Level {data.level} • {data.xp} XP</div>
          <div className="w-full bg-slate-100 rounded h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2" style={{width: `${(data.xp%200)/2}%`}}></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(data.badges||[]).map(b=> <span key={b} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">{b}</span>)}
          </div>
        </div>
      )}
    </Section>
  )
}

function BankingPanel(){
  return (
    <Section title="Bank Connections">
      <Banking baseUrl={API} onLinked={()=>{}} />
    </Section>
  )
}

function Profiles(){
  const [user, setUser] = useState({user_id:'demo-user', name:'Demo User', occupation:'IT Consultant', master_salary_account_id:'', income_frequency:'monthly'})
  const [biz, setBiz] = useState({business_id:'demo-biz', name:'Demo Pty Ltd', abn_acn:'12 345 678 901', industry:'it consulting', master_income_account_id:''})
  const {data: accs} = useFetch(`${API}/api/cdr/accounts`)
  const saveUser = async ()=>{
    await fetch(`${API}/api/profile/user`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(user)})
    alert('User profile saved')
  }
  const saveBiz = async ()=>{
    await fetch(`${API}/api/profile/business`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(biz)})
    alert('Business profile saved')
  }
  return (
    <Section title="Profiles">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-slate-700 font-medium">Individual</div>
          <input className="input" placeholder="Name" value={user.name} onChange={e=>setUser({...user, name:e.target.value})} />
          <input className="input" placeholder="Occupation" value={user.occupation} onChange={e=>setUser({...user, occupation:e.target.value})} />
          <select className="input" value={user.income_frequency} onChange={e=>setUser({...user, income_frequency:e.target.value})}>
            {['weekly','fortnightly','monthly','annual'].map(f=> <option key={f} value={f}>{f}</option>)}
          </select>
          <select className="input" value={user.master_salary_account_id} onChange={e=>setUser({...user, master_salary_account_id:e.target.value})}>
            <option value="">Select master salary account</option>
            {(accs?.accounts||[]).map(a=> <option key={a.id} value={a.id}>{a.name} • {a.number||''}</option>)}
          </select>
          <button onClick={saveUser} className="btn-primary">Save Individual</button>
        </div>
        <div className="space-y-2">
          <div className="text-slate-700 font-medium">Business</div>
          <input className="input" placeholder="Business name" value={biz.name} onChange={e=>setBiz({...biz, name:e.target.value})} />
          <input className="input" placeholder="ABN/ACN" value={biz.abn_acn} onChange={e=>setBiz({...biz, abn_acn:e.target.value})} />
          <select className="input" value={biz.industry} onChange={e=>setBiz({...biz, industry:e.target.value})}>
            {['horeca','speciality stores','it consulting','healthcare'].map(i=> <option key={i} value={i}>{i}</option>)}
          </select>
          <select className="input" value={biz.master_income_account_id} onChange={e=>setBiz({...biz, master_income_account_id:e.target.value})}>
            <option value="">Select master income account</option>
            {(accs?.accounts||[]).map(a=> <option key={a.id} value={a.id}>{a.name} • {a.number||''}</option>)}
          </select>
          <button onClick={saveBiz} className="btn-primary">Save Business</button>
        </div>
      </div>
    </Section>
  )
}

function IncomeExpenses(){
  const [ownerType, setOwnerType] = useState('user')
  const ownerId = ownerType==='user' ? 'demo-user' : 'demo-biz'
  const [income, setIncome] = useState({amount: 8000, frequency: 'monthly', source:'Salary'})
  const [expense, setExpense] = useState({name:'Rent', amount: 2500, frequency:'monthly', category:'housing', deductible:false})
  const [items, setItems] = useState({incomes:[], expenses:[]})
  const load = async ()=>{
    const i = await fetch(`${API}/api/income?owner_type=${ownerType}&owner_id=${ownerId}`).then(r=>r.json())
    const e = await fetch(`${API}/api/expenses?owner_type=${ownerType}&owner_id=${ownerId}`).then(r=>r.json())
    setItems({incomes: i.items||[], expenses: e.items||[]})
  }
  useEffect(()=>{load()},[ownerType])
  const addInc = async ()=>{
    await fetch(`${API}/api/income`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({owner_type: ownerType, owner_id: ownerId, ...income})})
    load()
  }
  const addExp = async ()=>{
    await fetch(`${API}/api/expenses`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({owner_type: ownerType, owner_id: ownerId, ...expense})})
    load()
  }
  const [occ, setOcc] = useState('IT Consultant')
  const [ind, setInd] = useState('it consulting')
  const [ded, setDed] = useState({suggestions:[], insights:[]})
  const fetchDed = async ()=>{
    const d = await fetch(`${API}/api/deductions?occupation=${encodeURIComponent(occ)}&industry=${encodeURIComponent(ind)}`).then(r=>r.json())
    setDed(d)
  }
  return (
    <Section title="Income, Expenses & Deductions" actions={<select className="input" value={ownerType} onChange={e=>setOwnerType(e.target.value)}><option value="user">Individual</option><option value="business">Business</option></select>}>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="font-medium">Add Income</div>
          <input className="input" placeholder="Source" value={income.source} onChange={e=>setIncome({...income, source:e.target.value})} />
          <input className="input" type="number" placeholder="Amount" value={income.amount} onChange={e=>setIncome({...income, amount: parseFloat(e.target.value||0)})} />
          <select className="input" value={income.frequency} onChange={e=>setIncome({...income, frequency:e.target.value})}>
            {['weekly','fortnightly','monthly','annual'].map(f=> <option key={f} value={f}>{f}</option>)}
          </select>
          <button onClick={addInc} className="btn-primary">Add Income</button>
        </div>
        <div className="space-y-2">
          <div className="font-medium">Add Expense</div>
          <input className="input" placeholder="Name" value={expense.name} onChange={e=>setExpense({...expense, name:e.target.value})} />
          <input className="input" type="number" placeholder="Amount" value={expense.amount} onChange={e=>setExpense({...expense, amount: parseFloat(e.target.value||0)})} />
          <select className="input" value={expense.frequency} onChange={e=>setExpense({...expense, frequency:e.target.value})}>
            {['weekly','fortnightly','monthly','annual'].map(f=> <option key={f} value={f}>{f}</option>)}
          </select>
          <input className="input" placeholder="Category" value={expense.category} onChange={e=>setExpense({...expense, category:e.target.value})} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={expense.deductible} onChange={e=>setExpense({...expense, deductible:e.target.checked})}/> Deductible</label>
          <button onClick={addExp} className="btn-primary">Add Expense</button>
        </div>
        <div className="space-y-2">
          <div className="font-medium">Deductions Assistant</div>
          <input className="input" placeholder="Occupation" value={occ} onChange={e=>setOcc(e.target.value)} />
          <select className="input" value={ind} onChange={e=>setInd(e.target.value)}>
            {['horeca','speciality stores','it consulting','healthcare'].map(i=> <option key={i} value={i}>{i}</option>)}
          </select>
          <button onClick={fetchDed} className="btn-secondary">Get Suggestions</button>
          <div className="text-sm text-slate-700">Suggestions:</div>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {ded.suggestions?.map((s,idx)=> <li key={idx}>{s}</li>)}
          </ul>
          <div className="text-sm text-slate-700">Industry Insights:</div>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {ded.insights?.map((s,idx)=> <li key={idx}>{s.title} • {s.type}</li>)}
          </ul>
        </div>
      </div>
    </Section>
  )
}

function StrategyBuilder(){
  const presets = [
    {name:'Debt Free Fast', allocations:[{bucket:'Debt', type:'percent', value:40},{bucket:'Essentials', type:'percent', value:40},{bucket:'Emergency', type:'percent', value:10},{bucket:'Investments', type:'percent', value:10}]},
    {name:'FIRE', allocations:[{bucket:'Investments', type:'percent', value:50},{bucket:'Essentials', type:'percent', value:30},{bucket:'Emergency', type:'percent', value:10},{bucket:'Discretionary', type:'percent', value:10}]},
    {name:'Aggressive Investment', allocations:[{bucket:'Investments', type:'percent', value:60},{bucket:'Essentials', type:'percent', value:25},{bucket:'Emergency', type:'percent', value:5},{bucket:'Discretionary', type:'percent', value:10}]},
    {name:'Balanced', allocations:[{bucket:'Investments', type:'percent', value:30},{bucket:'Essentials', type:'percent', value:45},{bucket:'Emergency', type:'percent', value:10},{bucket:'Discretionary', type:'percent', value:15}]},
    {name:'Custom', allocations:[]},
  ]
  const [name, setName] = useState('Balanced')
  const [allocations, setAllocations] = useState(presets[3].allocations)
  const [ownerType, setOwnerType] = useState('user')
  const ownerId = ownerType==='user' ? 'demo-user' : 'demo-biz'
  useEffect(()=>{
    const p = presets.find(p=>p.name===name)
    if(p){ setAllocations(p.allocations) }
  },[name])
  const addBucket = ()=> setAllocations([...allocations, {bucket:'New Bucket', type:'percent', value:0}])
  const save = async ()=>{
    await fetch(`${API}/api/strategies`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, allocations})})
    alert('Strategy saved')
  }
  const [sim, setSim] = useState(null)
  const simulate = async ()=>{
    const res = await fetch(`${API}/api/strategy/simulate`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({owner_type: ownerType, owner_id: ownerId, strategy_id: name})}).then(r=>r.json())
    setSim(res)
  }
  const [mappings, setMappings] = useState([])
  const {data: accs} = useFetch(`${API}/api/cdr/accounts`)
  const loadMappings = async ()=>{
    const res = await fetch(`${API}/api/account-mapping?owner_type=${ownerType}&owner_id=${ownerId}`).then(r=>r.json())
    setMappings(res.items||[])
  }
  useEffect(()=>{loadMappings()},[ownerType])
  const setMap = async (bucket, bank_account_id)=>{
    await fetch(`${API}/api/account-mapping`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({owner_type: ownerType, owner_id: ownerId, bucket, bank_account_id})})
    loadMappings()
  }
  const apply = async ()=>{
    const res = await fetch(`${API}/api/strategy/apply`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({owner_type: ownerType, owner_id: ownerId, strategy_id: name, sync_frequency: 'monthly'})}).then(r=>r.json())
    alert('Routing plan created. No money moved yet. See Transfers panel below.')
    setPlan(res)
  }
  const [plan, setPlan] = useState(null)
  return (
    <Section title="Strategies & Routing" actions={<select className="input" value={ownerType} onChange={e=>{setOwnerType(e.target.value);}}><option value="user">Individual</option><option value="business">Business</option></select>}>
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="font-medium">Preset</div>
            <select className="input" value={name} onChange={e=>setName(e.target.value)}>
              {presets.map(p=> <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            <button onClick={addBucket} className="btn-secondary">Add Bucket</button>
            <button onClick={save} className="btn-primary">Save Strategy</button>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Allocations</div>
            {allocations.map((a,idx)=> (
              <div key={idx} className="flex items-center gap-2">
                <input className="input flex-1" value={a.bucket} onChange={e=>{const n=[...allocations]; n[idx]={...a, bucket:e.target.value}; setAllocations(n)}} />
                <select className="input" value={a.type} onChange={e=>{const n=[...allocations]; n[idx]={...a, type:e.target.value}; setAllocations(n)}}>
                  <option value="percent">percent</option>
                  <option value="fixed">fixed</option>
                </select>
                <input type="number" className="input w-24" value={a.value} onChange={e=>{const n=[...allocations]; n[idx]={...a, value: parseFloat(e.target.value||0)}; setAllocations(n)}} />
              </div>
            ))}
            <button onClick={simulate} className="btn-secondary">Simulate</button>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Account Mappings</div>
            {allocations.map((a,idx)=> (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-40 text-sm">{a.bucket}</div>
                <select className="input flex-1" value={mappings.find(m=>m.bucket.toLowerCase()===a.bucket.toLowerCase())?.bank_account_id||''} onChange={e=>setMap(a.bucket, e.target.value)}>
                  <option value="">Select account</option>
                  {(accs?.accounts||[]).map(ac=> <option key={ac.id} value={ac.id}>{ac.name} • {ac.number||ac.id}</option>)}
                </select>
              </div>
            ))}
            <button onClick={apply} className="btn-primary">Apply Strategy (Plan Only)</button>
          </div>
        </div>
        {sim && (
          <div className="border rounded p-3">
            <div className="font-medium">Monthly Breakdown</div>
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              {sim.breakdown.map((b,idx)=> <div key={idx} className="flex justify-between text-sm"><span>{b.bucket}</span><span>${b.amount}</span></div>)}
            </div>
          </div>
        )}
        {plan && (
          <div className="border rounded p-3">
            <div className="font-medium">Transfers (Scheduled)</div>
            <div className="text-sm text-slate-600">This demonstrates the routing architecture. Funds will be moved on your chosen sync in a later version.</div>
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              {plan.transfers?.map((t,idx)=> <div key={idx} className="flex justify-between text-sm"><span>{t.bucket}</span><span>{t.source_account_id} → {t.destination_account_id}</span><span>${t.amount}</span></div>)}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

function NetWorth(){
  const [ownerType, setOwnerType] = useState('user')
  const ownerId = ownerType==='user' ? 'demo-user' : 'demo-biz'
  const {data, refetch} = useFetch(`${API}/api/networth?owner_type=${ownerType}&owner_id=${ownerId}`)
  const [snap, setSnap] = useState({assets:[{name:'Home', value:750000}], liabilities:[{name:'Mortgage', value:550000}]})
  const add = async ()=>{
    const payload = {owner_type: ownerType, owner_id: ownerId, date: new Date().toISOString(), assets: snap.assets, liabilities: snap.liabilities}
    await fetch(`${API}/api/networth/snapshot`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
    refetch()
  }
  return (
    <Section title="Net Worth" actions={<select className="input" value={ownerType} onChange={e=>setOwnerType(e.target.value)}><option value="user">Individual</option><option value="business">Business</option></select>}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <button onClick={add} className="btn-primary">Add Snapshot</button>
          <button onClick={refetch} className="btn-secondary">Refresh</button>
        </div>
        <div className="h-32 bg-slate-100 rounded flex items-end gap-1 p-2">
          {(data?.series||[]).map((pt,idx)=>{
            const max = Math.max(...(data?.series||[]).map(p=>p.net_worth||0), 1)
            const h = Math.max(2, Math.round((pt.net_worth||0)/max*100))
            return <div key={idx} title={`${pt.date}: $${pt.net_worth}`} className="bg-emerald-500 w-6" style={{height: `${h}%`}}></div>
          })}
        </div>
        <details className="bg-slate-50 border rounded p-3">
          <summary className="cursor-pointer font-medium">Expand: Strategy Architecture</summary>
          <StrategyArchitecture />
        </details>
      </div>
    </Section>
  )
}

function StrategyArchitecture(){
  const {data: accs} = useFetch(`${API}/api/cdr/accounts`)
  return (
    <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {(accs?.accounts||[]).map(a => (
        <div key={a.id} className="border rounded p-3">
          <div className="font-medium">{a.name} • {a.number || a.id}</div>
          <div className="text-sm text-slate-600">{a.institution} • {a.type}</div>
          <div className="text-slate-800">Balance: ${a.balance?.toFixed(2)}</div>
        </div>
      ))}
    </div>
  )
}

export default function App(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Finance Optimizer AU</h1>
            <p className="text-slate-600">Gamified planning • CDR demo • Strategy routing</p>
          </div>
        </header>
        <GamificationPanel />
        <NetWorth />
        <BankingPanel />
        <Profiles />
        <IncomeExpenses />
        <StrategyBuilder />
      </div>
    </div>
  )
}

// simple utility styles using Tailwind existing classes
