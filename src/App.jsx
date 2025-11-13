import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  const prevXp = useRef(0)
  const [confetti, setConfetti] = useState(false)
  useEffect(()=>{
    if(!data) return
    if(data.xp > prevXp.current){
      setConfetti(true)
      setTimeout(()=>setConfetti(false), 1400)
      prevXp.current = data.xp
    }
  },[data])
  return (
    <Section title="Your Progress" actions={<div className="flex items-center gap-2"><button onClick={refetch} className="px-3 py-1 text-sm bg-slate-800 text-white rounded">Refresh</button><span className="text-xs text-slate-500">Streak: {data?.streak_days||0} days</span></div>}>
      {loading && <div>Loading...</div>}
      {!!data && (
        <div className="space-y-2 relative">
          {confetti && <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-3xl">🎉✨🎊</div>}
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
            {(accs?.accounts||[]).map(a=> <option key={a.id} value={a.account_id}>{a.name} • {a.number||a.number_masked||''}</option>)}
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
            {(accs?.accounts||[]).map(a=> <option key={a.id} value={a.account_id}>{a.name} • {a.number||a.number_masked||''}</option>)}
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
  const [newDed, setNewDed] = useState('')
  const fetchDed = async ()=>{
    const d = await fetch(`${API}/api/deductions?occupation=${encodeURIComponent(occ)}&industry=${encodeURIComponent(ind)}`).then(r=>r.json())
    setDed(d)
  }
  const addDedCatalog = async ()=>{
    if(!newDed.trim()) return
    await fetch(`${API}/api/deductions/catalog`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({title: newDed, occupation: occ, industry: ind})})
    setNewDed('')
    fetchDed()
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
          <div className="flex gap-2 mt-2">
            <input className="input flex-1" placeholder="Add to catalog" value={newDed} onChange={e=>setNewDed(e.target.value)} />
            <button onClick={addDedCatalog} className="btn-secondary">Add</button>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <div className="font-medium mb-1">Incomes</div>
          <ul className="space-y-1 text-sm">
            {items.incomes.map((i,idx)=> <li key={idx} className="flex justify-between"><span>{i.source} • {i.frequency}</span><span>${i.amount}</span></li>)}
          </ul>
        </div>
        <div>
          <div className="font-medium mb-1">Expenses</div>
          <ul className="space-y-1 text-sm">
            {items.expenses.map((i,idx)=> <li key={idx} className="flex justify-between"><span>{i.name} • {i.frequency}</span><span>${i.amount}</span></li>)}
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
  const [cadence, setCadence] = useState('monthly')
  const ownerId = ownerType==='user' ? 'demo-user' : 'demo-biz'
  useEffect(()=>{
    const p = presets.find(p=>p.name===name)
    if(p){ setAllocations(p.allocations.map(a=>({...a}))) }
  },[name])
  const addBucket = ()=> setAllocations([...allocations, {bucket:'New Bucket', type:'percent', value:0}])
  const save = async ()=>{
    await fetch(`${API}/api/strategies`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({title: name, audience: ownerType==='user'?'individual':'business', kind: name==='Custom'?'custom':'prebuilt', allocations})})
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
  const [plan, setPlan] = useState(null)
  const apply = async ()=>{
    const res = await fetch(`${API}/api/strategy/apply`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({owner_type: ownerType, owner_id: ownerId, strategy_id: name, sync_frequency: cadence})}).then(r=>r.json())
    alert('Routing plan created. No money moved yet. See Transfers panel below.')
    setPlan(res)
  }
  const acctLabel = (id)=>{
    const list = accs?.accounts||[]
    const a = list.find(x=>x.account_id===id || x.id===id)
    if(!a) return id||''
    return `${a.name} • ${a.number||a.number_masked||a.account_id}`
  }
  const projectedRows = useMemo(()=>{
    if(!plan?.projected_balances) return []
    const entries = Object.entries(plan.projected_balances)
    const list = accs?.accounts||[]
    return entries.map(([id, bal])=>({id, name: acctLabel(id), bal}))
  },[plan, accs])
  return (
    <Section title="Strategies & Routing" actions={<div className="flex items-center gap-2"><select className="input" value={ownerType} onChange={e=>{setOwnerType(e.target.value);}}><option value="user">Individual</option><option value="business">Business</option></select><select className="input" value={cadence} onChange={e=>setCadence(e.target.value)}><option value="weekly">Weekly</option><option value="fortnightly">Fortnightly</option><option value="monthly">Monthly</option></select></div>}>
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="font-medium">Preset</div>
            <select className="input" value={name} onChange={e=>setName(e.target.value)}>
              {presets.map(p=> <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            <button onClick={addBucket} className="btn-secondary">Add Bucket</button>
            <button onClick={save} className="btn-primary">Save Strategy</button>
            <div className="text-xs text-slate-500">Up to 5 presets supported. Add custom buckets anytime.</div>
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
            <div className="flex gap-2">
              <button onClick={simulate} className="btn-secondary">Simulate</button>
              <a className="btn-secondary" href={`${API}/api/export/routing-plan.csv`} target="_blank" rel="noreferrer">Export Plan CSV</a>
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Account Mappings</div>
            {allocations.map((a,idx)=> (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-40 text-sm">{a.bucket}</div>
                <select className="input flex-1" value={mappings.find(m=>m.bucket.toLowerCase()===a.bucket.toLowerCase())?.bank_account_id||''} onChange={e=>setMap(a.bucket, e.target.value)}>
                  <option value="">Select account</option>
                  {(accs?.accounts||[]).map(ac=> <option key={ac.id} value={ac.account_id}>{ac.name} • {ac.number||ac.number_masked||ac.account_id}</option>)}
                </select>
              </div>
            ))}
            <button onClick={apply} className="btn-primary">Apply Strategy (Plan Only)</button>
            {plan && <div className="text-xs text-slate-600">Cadence: {plan.sync_frequency} • Next run: {plan.next_run}</div>}
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
          <div className="border rounded p-3 space-y-3">
            <div className="font-medium">Transfers (Scheduled)</div>
            <div className="text-sm text-slate-600">Demo routing only. No funds will move until live sync is enabled.</div>
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              {plan.transfers?.map((t,idx)=> <div key={idx} className="flex justify-between text-sm"><span>{t.bucket}</span><span>{acctLabel(t.source_account_id)} → {acctLabel(t.destination_account_id)}</span><span>${t.amount}</span></div>)}
            </div>
            <div>
              <div className="font-medium">Projected Post-Transfer Balances</div>
              <div className="grid md:grid-cols-2 gap-2 mt-2">
                {projectedRows.map((r,idx)=> (
                  <div key={idx} className="flex justify-between text-sm border rounded p-2"><span>{r.name}</span><span>${Number(r.bal||0).toFixed(2)}</span></div>
                ))}
              </div>
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
  const [chartMode, setChartMode] = useState('net') // net | stacked
  const [csv, setCsv] = useState('date,assets,liabilities\n2025-01-01,100000,40000\n2025-02-01,101000,39500')
  const importCsv = async ()=>{
    const rows = csv.split(/\n/).slice(1).filter(Boolean).map(line=>{
      const [date, assets, liabilities] = line.split(',')
      return {date, assets, liabilities}
    })
    await fetch(`${API}/api/networth/import`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({owner_type: ownerType, owner_id: ownerId, rows})})
    setCsv('')
    refetch()
  }
  const series = data?.series||[]
  const maxVal = useMemo(()=>{
    if(series.length===0) return 1
    if(chartMode==='net') return Math.max(...series.map(p=>p.net_worth||0),1)
    return Math.max(...series.map(p=>Math.max(p.assets||0, p.liabilities||0)),1)
  },[series, chartMode])
  return (
    <Section title="Net Worth" actions={<div className="flex items-center gap-2"><select className="input" value={ownerType} onChange={e=>setOwnerType(e.target.value)}><option value="user">Individual</option><option value="business">Business</option></select><a className="btn-secondary" href={`${API}/api/export/networth.csv?owner_type=${ownerType}&owner_id=${ownerId}`} target="_blank" rel="noreferrer">Export CSV</a></div>}>
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={add} className="btn-primary">Add Snapshot</button>
          <button onClick={refetch} className="btn-secondary">Refresh</button>
          <select className="input" value={chartMode} onChange={e=>setChartMode(e.target.value)}>
            <option value="net">Net worth</option>
            <option value="stacked">Stacked: Assets vs Liabilities</option>
          </select>
        </div>
        <div className="h-40 bg-slate-100 rounded flex items-end gap-2 p-2 overflow-x-auto">
          {series.map((pt,idx)=>{
            if(chartMode==='net'){
              const h = Math.max(2, Math.round((pt.net_worth||0)/maxVal*100))
              return <div key={idx} title={`${pt.date}: $${pt.net_worth}`} className="bg-emerald-500 w-6" style={{height: `${h}%`}}></div>
            }
            const ha = Math.max(2, Math.round((pt.assets||0)/maxVal*100))
            const hl = Math.max(2, Math.round((pt.liabilities||0)/maxVal*100))
            return (
              <div key={idx} className="w-8 flex flex-col justify-end" title={`${pt.date}: A$${pt.assets} / L$${pt.liabilities}`}>
                <div className="bg-emerald-500" style={{height: `${ha}%`}}></div>
                <div className="bg-rose-400" style={{height: `${hl}%`}}></div>
              </div>
            )
          })}
        </div>
        <details className="bg-slate-50 border rounded p-3">
          <summary className="cursor-pointer font-medium">Expand: Strategy Architecture</summary>
          <StrategyArchitecture />
        </details>
        <details className="bg-slate-50 border rounded p-3">
          <summary className="cursor-pointer font-medium">CSV Import</summary>
          <div className="space-y-2">
            <textarea className="w-full h-32 border rounded p-2" value={csv} onChange={e=>setCsv(e.target.value)} />
            <button onClick={importCsv} className="btn-secondary">Import</button>
          </div>
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
          <div className="font-medium">{a.name} • {a.number || a.number_masked || a.account_id}</div>
          <div className="text-sm text-slate-600">{a.provider || a.institution || 'Bank'} • {a.type || 'Account'}</div>
          <div className="text-slate-800">Balance: ${Number(a.balance||0).toFixed(2)}</div>
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
