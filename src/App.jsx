import { useEffect, useMemo, useState } from 'react'

function NumberInput({ label, value, onChange, step = 0.01, min = 0, prefix = '$', suffix = '', disabled = false }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700">{label}</span>
      <div className={`mt-1 flex items-center rounded border ${disabled ? 'bg-gray-100' : 'bg-white'} px-3 py-2`}>
        {prefix && <span className="mr-2 text-gray-500">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value || '0'))}
          step={step}
          min={min}
          disabled={disabled}
          className="w-full outline-none bg-transparent"
        />
        {suffix && <span className="ml-2 text-gray-500">{suffix}</span>}
      </div>
    </label>
  )
}

function Section({ title, children, right }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  )
}

function App() {
  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])

  const [mode, setMode] = useState('individual') // individual | business

  // Tax inputs
  const [taxIncome, setTaxIncome] = useState(120000)
  const [taxResult, setTaxResult] = useState(null)

  // Cashflow inputs
  const [incomeMonthly, setIncomeMonthly] = useState(9000)
  const [expensesMonthly, setExpensesMonthly] = useState(6500)
  const [savingsRateTarget, setSavingsRateTarget] = useState(0.2)
  const [cashflowResult, setCashflowResult] = useState(null)

  // Super (only for individual)
  const [salary, setSalary] = useState(120000)
  const [concessional, setConcessional] = useState(10000)
  const [superResult, setSuperResult] = useState(null)

  // Scenarios
  const [scenarioName, setScenarioName] = useState('My Plan')
  const [notes, setNotes] = useState('')
  const [scenarios, setScenarios] = useState([])
  const [saving, setSaving] = useState(false)

  // Strategies
  const [prebuilt, setPrebuilt] = useState([])
  const [generated, setGenerated] = useState(null)
  const [strategies, setStrategies] = useState([])
  const [loadingStrategies, setLoadingStrategies] = useState(false)
  const [savingStrategy, setSavingStrategy] = useState(false)

  const fetchScenarios = async () => {
    try {
      const r = await fetch(`${baseUrl}/api/scenarios`)
      const data = await r.json()
      setScenarios(data)
    } catch (e) {
      // ignore
    }
  }

  const fetchPrebuilt = async () => {
    try {
      const r = await fetch(`${baseUrl}/api/strategies/prebuilt?audience=${mode}`)
      const data = await r.json()
      setPrebuilt(data)
    } catch (e) {
      setPrebuilt([])
    }
  }

  const fetchStrategies = async () => {
    setLoadingStrategies(true)
    try {
      const r = await fetch(`${baseUrl}/api/strategies?audience=${mode}`)
      const data = await r.json()
      setStrategies(data)
    } catch (e) {
      setStrategies([])
    } finally {
      setLoadingStrategies(false)
    }
  }

  useEffect(() => {
    fetchScenarios()
    fetchPrebuilt()
    fetchStrategies()
  }, [])

  useEffect(() => {
    // refresh audience-based lists when mode changes
    fetchPrebuilt()
    fetchStrategies()
  }, [mode])

  const runTax = async () => {
    const entity = mode === 'business' ? 'company' : 'individual'
    const payload = { entity, taxable_income: taxIncome }
    const r = await fetch(`${baseUrl}/api/tax`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    setTaxResult(data)
  }

  const runCashflow = async () => {
    const payload = { income_monthly: incomeMonthly, expenses_monthly: expensesMonthly, savings_rate_target: savingsRateTarget }
    const r = await fetch(`${baseUrl}/api/cashflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    setCashflowResult(data)
  }

  const runSuper = async () => {
    const payload = { salary, concessional_contrib: concessional }
    const r = await fetch(`${baseUrl}/api/super`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    setSuperResult(data)
  }

  const saveScenario = async () => {
    setSaving(true)
    try {
      const inputs = {
        mode,
        taxIncome,
        incomeMonthly,
        expensesMonthly,
        savingsRateTarget,
        salary,
        concessional,
      }
      const results = { taxResult, cashflowResult, superResult }
      const payload = { name: scenarioName, scenario_type: mode, inputs, results, notes }
      const r = await fetch(`${baseUrl}/api/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error('Save failed')
      await fetchScenarios()
    } catch (e) {
      alert('Could not save scenario: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const generateStrategy = async () => {
    try {
      const inputs = {
        incomeMonthly,
        expensesMonthly,
        savingsRateTarget,
        salary,
        concessional,
      }
      const results = { taxResult, cashflowResult, superResult }
      const payload = { scenario_type: mode, inputs, results }
      const r = await fetch(`${baseUrl}/api/strategies/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await r.json()
      setGenerated(data)
    } catch (e) {
      alert('Failed to generate strategy')
    }
  }

  const saveStrategy = async (strategy) => {
    setSavingStrategy(true)
    try {
      const r = await fetch(`${baseUrl}/api/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategy)
      })
      if (!r.ok) throw new Error('Save strategy failed')
      await fetchStrategies()
      alert('Strategy saved')
    } catch (e) {
      alert(e.message)
    } finally {
      setSavingStrategy(false)
    }
  }

  useEffect(() => {
    // auto-run on load for quick results
    runTax()
    runCashflow()
    if (mode === 'individual') runSuper()
  }, [mode])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-xl font-bold tracking-tight">Finance Optimizer AU</div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1">
            {['individual', 'business'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-sm font-medium rounded ${mode === m ? 'bg-white shadow' : 'text-gray-600'}`}
              >
                {m === 'individual' ? 'Individual' : 'Business'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Section title="Tax Optimizer" right={<button onClick={runTax} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Recalculate</button>}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberInput label={`${mode === 'business' ? 'Company' : 'Personal'} Taxable Income (annual)`} value={taxIncome} onChange={setTaxIncome} />
            </div>
            {taxResult && (
              <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm">
                <div className="font-medium text-blue-900">Estimated Tax</div>
                <div className="mt-1 text-blue-800">Tax: ${taxResult.tax?.toLocaleString()}</div>
                <div className="text-blue-800">Effective rate: {(taxResult.effective_rate * 100).toFixed(2)}%</div>
                <p className="mt-2 text-blue-700">Note: Simplified 2024-25 AU rates for guidance only.</p>
              </div>
            )}
          </Section>

          <Section title="Cashflow & Savings" right={<button onClick={runCashflow} className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">Update</button>}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <NumberInput label="Monthly Income" value={incomeMonthly} onChange={setIncomeMonthly} />
              <NumberInput label="Monthly Expenses" value={expensesMonthly} onChange={setExpensesMonthly} />
              <NumberInput prefix="" suffix="%" step={0.01} label="Target Savings Rate" value={(savingsRateTarget || 0) * 100} onChange={(v) => setSavingsRateTarget((v || 0) / 100)} />
            </div>
            {cashflowResult && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat title="Monthly Surplus" value={`$${cashflowResult.surplus_monthly?.toLocaleString()}`} />
                <Stat title="Savings Rate" value={`${(cashflowResult.savings_rate * 100).toFixed(1)}%`} />
                <Stat title="Target Savings" value={`$${cashflowResult.target_savings_amount?.toLocaleString()}/mo`} />
              </div>
            )}
          </Section>

          {mode === 'individual' && (
            <Section title="Superannuation (SG 11.5%)" right={<button onClick={runSuper} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Check</button>}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <NumberInput label="Salary (annual)" value={salary} onChange={setSalary} />
                <NumberInput label="Concessional Contributions" value={concessional} onChange={setConcessional} />
                <NumberInput label="Concessional Cap" value={27500} onChange={() => {}} disabled />
              </div>
              {superResult && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Stat title="Employer SG" value={`$${superResult.sg_employer?.toLocaleString()}`} />
                  <Stat title="Cap" value={`$${superResult.concessional_cap?.toLocaleString()}`} />
                  <Stat title="Excess" value={`$${superResult.excess_contributions?.toLocaleString()}`} />
                </div>
              )}
            </Section>
          )}

          <Section title="Strategies (AI-assisted)">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Prebuilt</h3>
                  <span className="text-xs rounded bg-gray-100 px-2 py-1">{mode}</span>
                </div>
                <div className="space-y-3">
                  {prebuilt.length === 0 ? (
                    <p className="text-sm text-gray-500">No prebuilt strategies found.</p>
                  ) : (
                    prebuilt.map((s, idx) => (
                      <div key={idx} className="rounded border p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{s.title}</div>
                            <p className="text-sm text-gray-600 mt-1">{s.description}</p>
                          </div>
                          <button
                            onClick={() => saveStrategy({
                              title: s.title,
                              audience: s.audience,
                              kind: 'prebuilt',
                              description: s.description,
                              steps: s.steps,
                              assumptions: {},
                              estimated_impact: s.estimated_impact || {},
                              scenario_id: null,
                            })}
                            className="rounded bg-gray-900 px-3 py-1.5 text-white text-sm hover:bg-black disabled:opacity-50"
                            disabled={savingStrategy}
                          >
                            {savingStrategy ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                        {s.steps && s.steps.length > 0 && (
                          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
                            {s.steps.map((st, i) => <li key={i}>{st}</li>)}
                          </ul>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Generated</h3>
                  <button onClick={generateStrategy} className="rounded bg-blue-600 px-3 py-1.5 text-white text-sm hover:bg-blue-700">Generate</button>
                </div>
                {generated ? (
                  <div className="rounded border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{generated.title}</div>
                        <p className="text-sm text-gray-600 mt-1">{generated.description}</p>
                      </div>
                      <button
                        onClick={() => saveStrategy({
                          title: generated.title,
                          audience: generated.audience,
                          kind: 'generated',
                          description: generated.description,
                          steps: generated.steps || [],
                          assumptions: generated.assumptions || {},
                          estimated_impact: generated.estimated_impact || {},
                          scenario_id: null,
                        })}
                        className="rounded bg-gray-900 px-3 py-1.5 text-white text-sm hover:bg-black disabled:opacity-50"
                        disabled={savingStrategy}
                      >
                        {savingStrategy ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    {generated.steps && generated.steps.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {generated.steps.map((st, i) => <li key={i}>{st}</li>)}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Click Generate to create a personalised plan based on your inputs and results above.</p>
                )}
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Save Scenario" right={<button onClick={saveScenario} disabled={saving} className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>}>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-700">Name</span>
                <input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-700">Notes</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded border px-3 py-2" />
              </label>
            </div>
          </Section>

          <Section title="Saved Strategies">
            {loadingStrategies ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : strategies.length === 0 ? (
              <p className="text-sm text-gray-500">No strategies saved yet.</p>
            ) : (
              <ul className="divide-y">
                {strategies.map((s) => (
                  <li key={s.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{s.title}</div>
                        <div className="text-xs text-gray-500">{s.kind} • {s.audience}</div>
                      </div>
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{new Date(s.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                    {s.description && <p className="mt-1 text-sm text-gray-600">{s.description}</p>}
                    {s.steps && s.steps.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-xs text-gray-600 space-y-1">
                        {s.steps.slice(0,3).map((st, i) => <li key={i}>{st}</li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Saved Scenarios">
            {scenarios.length === 0 ? (
              <p className="text-sm text-gray-500">No scenarios yet. Save one to get started.</p>
            ) : (
              <ul className="divide-y">
                {scenarios.map((s) => (
                  <li key={s.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.scenario_type} • {s.inputs?.taxIncome ? `$${s.inputs.taxIncome.toLocaleString()}` : ''}</div>
                      </div>
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{new Date(s.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                    {s.notes && <p className="mt-1 text-sm text-gray-600">{s.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="About">
            <p className="text-sm text-gray-600">
              This tool provides simplified Australian calculations for tax, cashflow and super. For
              tailored advice, consult a licensed professional. Rates approximate 2024–25 settings.
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t bg-white/70">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-gray-500">
          Backend: {baseUrl}
        </div>
      </footer>
    </div>
  )
}

function Stat({ title, value }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  )
}

export default App
