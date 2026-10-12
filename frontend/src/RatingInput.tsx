import { NO_RATING_LABEL, RATING_MAX, RATING_MIN, stepRating } from './rating'

interface RatingInputProps {
  value: number | null
  onChange: (value: number | null) => void
}

/**
 * Discrete rating control: [-] 8.5 / 10 [+] and a "Sin puntuar" button.
 * Tap-only (no free text, no numeric keyboard, no hover).
 */
export default function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <div className="rating-input" role="group" aria-label="Puntuación">
      <span className="rating-input-label">Puntuación</span>
      <div className="rating-input-row">
        <button
          type="button"
          className="rating-input-step"
          aria-label="Bajar 0.5"
          disabled={value === null || value <= RATING_MIN}
          onClick={() => onChange(stepRating(value, -1))}
        >
          −
        </button>
        <span className="rating-input-value" aria-live="polite">
          {value === null ? (
            NO_RATING_LABEL
          ) : (
            <>
              {value.toFixed(1)}
              <small> / 10</small>
            </>
          )}
        </span>
        <button
          type="button"
          className="rating-input-step"
          aria-label="Subir 0.5"
          disabled={value !== null && value >= RATING_MAX}
          onClick={() => onChange(stepRating(value, 1))}
        >
          +
        </button>
      </div>
      <button
        type="button"
        className="rating-input-clear"
        disabled={value === null}
        onClick={() => onChange(null)}
      >
        {NO_RATING_LABEL}
      </button>
    </div>
  )
}
