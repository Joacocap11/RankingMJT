import { useCallback, useEffect, useState } from 'react'
import { ApiError, deleteMonster, getMonsters } from './api'
import MonsterList from './MonsterList'
import MonsterForm from './MonsterForm'
import type { Monster } from './types'

type FormState = { mode: 'create' } | { mode: 'edit'; monster: Monster } | null

export default function RankingLayout() {
  const [monsters, setMonsters] = useState<Monster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMonsters()
      setMonsters(data)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : 'No se pudo conectar con el backend.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function handleSaved(_monster: Monster) {
    setFormState(null)
    void refresh()
  }

  async function handleDelete(monster: Monster) {
    const confirmed = confirm(
      `¿Eliminar "${monster.nickname}" (#${monster.rank_position})? Esta acción no se puede deshacer.`,
    )
    if (!confirmed) return

    try {
      await deleteMonster(monster.id)
      await refresh()
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : 'No se pudo eliminar el monster.',
      )
    }
  }

  // rank_position is one global ranking; each section is filtered from the
  // globally-sorted list, so numbers keep climbing across both sections.
  const wouldBuyAgain = monsters.filter((monster) => monster.would_buy_again)
  const wouldNotBuyAgain = monsters.filter((monster) => !monster.would_buy_again)

  return (
    <div className="page">
      <header className="page-header">
        <div className="brand">
          <img src="/logo.png" alt="RankingMJT" className="brand-logo" />
          <h1>Ranking Monsters</h1>
        </div>
        <button type="button" onClick={() => setFormState({ mode: 'create' })}>
          + Añadir Monster
        </button>
      </header>

      {loading && <p className="status-line">Cargando...</p>}
      {error && <p className="status-line status-error">{error}</p>}

      {!loading && (
        <>
          <MonsterList
            title="COMPRARÍA"
            monsters={wouldBuyAgain}
            onEdit={(monster) => setFormState({ mode: 'edit', monster })}
            onDelete={handleDelete}
          />
          <MonsterList
            title="NO COMPRARÍA"
            monsters={wouldNotBuyAgain}
            onEdit={(monster) => setFormState({ mode: 'edit', monster })}
            onDelete={handleDelete}
          />
        </>
      )}

      {formState && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <MonsterForm
              mode={formState.mode}
              monster={formState.mode === 'edit' ? formState.monster : undefined}
              currentCount={monsters.length}
              onSaved={handleSaved}
              onCancel={() => setFormState(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
