import { useEffect, useMemo, useState } from 'react'

export default function Banking({ baseUrl, onLinked }) {
  const providers = ["NAB", "CBA", "WBC", "ANZ", "ING", "AMP"]
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [linking, setLinking] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState('')

  const fetchAccounts = async () => {
    try {
      const r = await fetch(`${baseUrl}/api/cdr/accounts`)
      const data = await r.json()
      setAccounts(data || [])
    } catch (e) {
      setAccounts([])
    }
  }

  const fetchTransactions = async (accountId) => {
    try {
      const r = await fetch(`${baseUrl}/api/cdr/transactions?account_id=${accountId}`)
      const data = await r.json()
      setTransactions(data || [])
    } catch (e) {
      setTransactions([])
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccount) fetchTransactions(selectedAccount)
  }, [selectedAccount])

  const startLink = async (provider) => {
    setLinking(true)
    try {
      const r = await fetch(`${baseUrl}/api/cdr/connect/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      })
      const data = await r.json()
      // Normally redirect to data.redirect_url for consent; we simulate complete directly
      await completeLink(data.connection_id, provider)
    } catch (e) {
      alert('Failed to start connection')
    } finally {
      setLinking(false)
    }
  }

  const completeLink = async (connection_id, provider) => {
    try {
      const r = await fetch(`${baseUrl}/api/cdr/connect/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id, provider })
      })
      const data = await r.json()
      await fetchAccounts()
      if (onLinked) onLinked(data)
    } catch (e) {
      alert('Failed to complete connection')
    }
  }

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Bank Connections (CDR Mock)</h3>
        <div className="text-xs text-gray-500">Demo only</div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {providers.map((p) => (
          <button key={p} onClick={() => startLink(p)} disabled={linking}
            className="rounded-lg border px-2 py-1.5 text-sm hover:bg-gray-50">
            {p}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium text-gray-800 mb-2">Accounts</div>
        {accounts.length === 0 ? (
          <p className="text-sm text-gray-500">No accounts linked. Choose a bank above to connect.</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-500">{a.provider} • {a.number_masked}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">${a.balance?.toLocaleString()}</div>
                  <button onClick={() => setSelectedAccount(a.account_id)} className="mt-1 text-xs text-blue-600 hover:underline">View transactions</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAccount && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-800">Recent Transactions</div>
            <button onClick={() => fetchTransactions(selectedAccount)} className="text-xs text-gray-600 hover:underline">Refresh</button>
          </div>
          <ul className="mt-2 divide-y rounded border">
            {transactions.map((t) => (
              <li key={t.id || t.txn_id} className="flex items-center justify-between p-2 text-sm">
                <div>
                  <div className="font-medium">{t.description}</div>
                  <div className="text-xs text-gray-500">{t.date} • {t.category || 'Uncategorised'}</div>
                </div>
                <div className={`font-medium ${t.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{t.amount < 0 ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
