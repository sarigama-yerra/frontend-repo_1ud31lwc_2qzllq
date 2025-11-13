import { useEffect, useState } from 'react'

export default function Gamification({ baseUrl }) {
  const [profile, setProfile] = useState(null)

  const fetchProfile = async () => {
    try {
      const r = await fetch(`${baseUrl}/api/gamification/profile`)
      const data = await r.json()
      setProfile(data)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  if (!profile) return (
    <div className="rounded-xl border bg-white p-5">
      <div className="animate-pulse h-6 w-40 bg-gray-200 rounded" />
    </div>
  )

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Level</div>
          <div className="text-2xl font-bold">{profile.level}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">XP</div>
          <div className="text-2xl font-bold">{profile.xp}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>Progress to next level</span>
          <span>{Math.min(100, (profile.xp % 200) / 2)}%</span>
        </div>
        <div className="h-2 w-full rounded bg-gray-200">
          <div className="h-2 rounded bg-gradient-to-r from-amber-400 to-pink-500" style={{ width: `${Math.min(100, (profile.xp % 200) / 2)}%` }} />
        </div>
      </div>

      {profile.badges && profile.badges.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-gray-800">Badges</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.badges.map((b, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">🏅 {b}</span>
            ))}
          </div>
        </div>
      )}

      {profile.quests && profile.quests.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-gray-800">Quests</div>
          <ul className="mt-2 space-y-2">
            {profile.quests.map((q) => (
              <li key={q.id} className="flex items-center justify-between rounded border p-2 text-sm">
                <span>{q.title}</span>
                <span className="text-xs text-gray-500">+{q.xp} XP</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
