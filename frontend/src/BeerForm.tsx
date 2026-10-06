import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, createBeer, updateBeer, uploadBeerImage } from './api'
import type { Beer } from './types'

interface BeerFormProps {
  mode: 'create' | 'edit'
  beer?: Beer
  /** Total beer count, used to compute the default create position (count + 1). */
  currentCount: number
  onSaved: (beer: Beer) => void
  onCancel: () => void
}

export default function BeerForm({
  mode,
  beer,
  currentCount,
  onSaved,
  onCancel,
}: BeerFormProps) {
  const [brand, setBrand] = useState(beer?.brand ?? '')
  const [name, setName] = useState(beer?.name ?? '')
  const [rankPosition, setRankPosition] = useState(
    beer?.rank_position ?? currentCount + 1,
  )
  const [wouldBuyAgain, setWouldBuyAgain] = useState(
    beer?.would_buy_again ?? true,
  )
  const [notes, setNotes] = useState(beer?.notes ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rankChanged = mode === 'edit' && beer !== undefined && rankPosition !== beer.rank_position
  const showShiftNote = mode === 'create' || rankChanged

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (brand.trim().length === 0) {
      setError('La marca es obligatoria.')
      return
    }
    if (name.trim().length === 0) {
      setError('El nombre/variante es obligatorio.')
      return
    }
    if (!Number.isInteger(rankPosition) || rankPosition <= 0) {
      setError('La posición debe ser un entero mayor que 0.')
      return
    }

    setSubmitting(true)
    try {
      let saved: Beer
      if (mode === 'create') {
        saved = await createBeer({
          brand: brand.trim(),
          name: name.trim(),
          rank_position: rankPosition,
          would_buy_again: wouldBuyAgain,
          notes: notes.trim().length > 0 ? notes.trim() : null,
        })
      } else {
        if (!beer) throw new Error('Missing beer to edit')
        saved = await updateBeer(beer.id, {
          brand: brand.trim(),
          name: name.trim(),
          rank_position: rankPosition,
          would_buy_again: wouldBuyAgain,
          notes: notes.trim().length > 0 ? notes.trim() : null,
        })
      }

      if (file) {
        saved = await uploadBeerImage(saved.id, file)
      }

      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Error inesperado guardando la cerveza.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="monster-form" onSubmit={handleSubmit}>
      <h2>{mode === 'create' ? 'Nueva Cerveza' : `Editar #${beer?.rank_position}`}</h2>

      <label className="field">
        <span>Marca *</span>
        <input
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Nombre/Variante *</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Posición *</span>
        <input
          type="number"
          min={1}
          value={rankPosition}
          onChange={(event) => setRankPosition(Number(event.target.value))}
          required
        />
      </label>
      {showShiftNote && (
        <p className="field-note">
          Esta posición moverá (desplazará) el resto de las cervezas existentes.
        </p>
      )}

      <label className="field field-checkbox">
        <input
          type="checkbox"
          checked={wouldBuyAgain}
          onChange={(event) => setWouldBuyAgain(event.target.checked)}
        />
        <span>¿La comprarías de nuevo?</span>
      </label>

      <label className="field">
        <span>Notas</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
        />
      </label>

      <label className="field">
        <span>Foto</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
