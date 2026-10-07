import { useCallback, useEffect, useState } from 'react'
import { ApiError, deleteAlfajor, getAlfajores } from './api'
import AlfajorList from './AlfajorList'
import AlfajorForm from './AlfajorForm'
import type { Alfajor } from './types'

type FormState = { mode: 'create' } | { mode: 'edit'; alfajor: Alfajor } | null

export default function AlfajorRankingLayout() {
  const [alfajores, setAlfajores] = useState<Alfajor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAlfajores()
      setAlfajores(data)
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

  function handleSaved(_alfajor: Alfajor) {
    setFormState(null)
    void refresh()
  }

  async function handleDelete(alfajor: Alfajor) {
    const confirmed = confirm(
      `¿Eliminar "${alfajor.brand} - ${alfajor.name}" (#${alfajor.rank_position})? Esta acción no se puede deshacer.`,
    )
    if (!confirmed) return

    try {
      await deleteAlfajor(alfajor.id)
      void refresh()
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : 'No se pudo eliminar el alfajor.',
      )
    }
  }

  // rank_position is one global ranking; each section is filtered from the
  // globally-sorted list, so numbers keep climbing across both sections.
  const wouldBuyAgain = alfajores.filter((alfajor) => alfajor.would_buy_again)
  const wouldNotBuyAgain = alfajores.filter((alfajor) => !alfajor.would_buy_again)

  return (
    <div className="page">
      <header className="page-header">
        <div className="brand">
          <img src="/logo.png" alt="RankingMJT" className="brand-logo" />
          <h1>Ranking Alfajores</h1>
        </div>
        <button type="button" onClick={() => setFormState({ mode: 'create' })}>
          + Añadir Alfajor
        </button>
      </header>

      {loading && <p className="status-line">Cargando...</p>}
      {error && <p className="status-line status-error">{error}</p>}

      {!loading && (
        <>
          <AlfajorList
            title="COMPRARÍA"
            alfajores={wouldBuyAgain}
            onEdit={(alfajor) => setFormState({ mode: 'edit', alfajor })}
            onDelete={handleDelete}
          />
          <AlfajorList
            title="NO COMPRARÍA"
            alfajores={wouldNotBuyAgain}
            onEdit={(alfajor) => setFormState({ mode: 'edit', alfajor })}
            onDelete={handleDelete}
          />
        </>
      )}

      {formState && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <AlfajorForm
              mode={formState.mode}
              alfajor={formState.mode === 'edit' ? formState.alfajor : undefined}
              currentCount={alfajores.length}
              onSaved={handleSaved}
              onCancel={() => setFormState(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
