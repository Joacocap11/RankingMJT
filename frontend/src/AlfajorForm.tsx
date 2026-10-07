import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, createAlfajor, updateAlfajor, uploadAlfajorImage } from './api'
import type { Alfajor } from './types'

interface AlfajorFormProps {
  mode: 'create' | 'edit'
  alfajor?: Alfajor
  /** Total alfajor count, used to compute the default create position (count + 1). */
  currentCount: number
  onSaved: (alfajor: Alfajor) => void
  onCancel: () => void
}

export default function AlfajorForm({
  mode,
  alfajor,
  currentCount,
  onSaved,
  onCancel,
}: AlfajorFormProps) {
  const [brand, setBrand] = useState(alfajor?.brand ?? '')
  const [name, setName] = useState(alfajor?.name ?? '')
  const [rankPosition, setRankPosition] = useState(
    alfajor?.rank_position ?? currentCount + 1,
  )
  const [wouldBuyAgain, setWouldBuyAgain] = useState(
    alfajor?.would_buy_again ?? true,
  )
  const [notes, setNotes] = useState(alfajor?.notes ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rankChanged = mode === 'edit' && alfajor !== undefined && rankPosition !== alfajor.rank_position
  const showShiftNote = mode === 'create' || rankChanged

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (brand.trim().length === 0) {
      setError('La marca es obligatoria.')
      return
    }
    if (name.trim().length === 0) {
      setError('El nombre/producto es obligatorio.')
      return
    }
    if (!Number.isInteger(rankPosition) || rankPosition <= 0) {
      setError('La posición debe ser un entero mayor que 0.')
      return
    }

    setSubmitting(true)
    try {
      let saved: Alfajor
      if (mode === 'create') {
        saved = await createAlfajor({
          brand: brand.trim(),
          name: name.trim(),
          rank_position: rankPosition,
          would_buy_again: wouldBuyAgain,
          notes: notes.trim().length > 0 ? notes.trim() : null,
        })
      } else {
        if (!alfajor) throw new Error('Missing alfajor to edit')
        saved = await updateAlfajor(alfajor.id, {
          brand: brand.trim(),
          name: name.trim(),
          rank_position: rankPosition,
          would_buy_again: wouldBuyAgain,
          notes: notes.trim().length > 0 ? notes.trim() : null,
        })
      }

      if (file) {
        saved = await uploadAlfajorImage(saved.id, file)
      }

      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Error inesperado guardando el alfajor.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="monster-form" onSubmit={handleSubmit}>
      <h2>{mode === 'create' ? 'Nuevo Alfajor' : `Editar #${alfajor?.rank_position}`}</h2>

      <label className="field">
        <span>Marca *</span>
        <input
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Nombre *</span>
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
          Esta posición moverá (desplazará) el resto de los alfajores existentes.
        </p>
      )}

      <label className="field field-checkbox">
        <input
          type="checkbox"
          checked={wouldBuyAgain}
          onChange={(event) => setWouldBuyAgain(event.target.checked)}
        />
        <span>¿Lo comprarías de nuevo?</span>
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
