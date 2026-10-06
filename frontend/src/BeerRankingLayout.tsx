import { useCallback, useEffect, useState } from 'react'
import { ApiError, deleteBeer, getBeers } from './api'
import BeerList from './BeerList'
import BeerForm from './BeerForm'
import type { Beer } from './types'

type FormState = { mode: 'create' } | { mode: 'edit'; beer: Beer } | null

export default function BeerRankingLayout() {
  const [beers, setBeers] = useState<Beer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getBeers()
      setBeers(data)
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

  function handleSaved(_beer: Beer) {
    setFormState(null)
    void refresh()
  }

  async function handleDelete(beer: Beer) {
    const confirmed = confirm(
      `¿Eliminar "${beer.brand} - ${beer.name}" (#${beer.rank_position})? Esta acción no se puede deshacer.`,
    )
    if (!confirmed) return

    try {
      await deleteBeer(beer.id)
      void refresh()
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : 'No se pudo eliminar la cerveza.',
      )
    }
  }

  // rank_position is one global ranking; each section is filtered from the
  // globally-sorted list, so numbers keep climbing across both sections.
  const wouldBuyAgain = beers.filter((beer) => beer.would_buy_again)
  const wouldNotBuyAgain = beers.filter((beer) => !beer.would_buy_again)

  return (
    <div className="page">
      <header className="page-header">
        <div className="brand">
          <img src="/logo.png" alt="RankingMJT" className="brand-logo" />
          <h1>Ranking Cervezas</h1>
        </div>
        <button type="button" onClick={() => setFormState({ mode: 'create' })}>
          + Añadir Cerveza
        </button>
      </header>

      {loading && <p className="status-line">Cargando...</p>}
      {error && <p className="status-line status-error">{error}</p>}

      {!loading && (
        <>
          <BeerList
            title="COMPRARÍA"
            beers={wouldBuyAgain}
            onEdit={(beer) => setFormState({ mode: 'edit', beer })}
            onDelete={handleDelete}
          />
          <BeerList
            title="NO COMPRARÍA"
            beers={wouldNotBuyAgain}
            onEdit={(beer) => setFormState({ mode: 'edit', beer })}
            onDelete={handleDelete}
          />
        </>
      )}

      {formState && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <BeerForm
              mode={formState.mode}
              beer={formState.mode === 'edit' ? formState.beer : undefined}
              currentCount={beers.length}
              onSaved={handleSaved}
              onCancel={() => setFormState(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
