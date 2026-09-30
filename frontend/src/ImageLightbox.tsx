import { useEffect } from 'react'

interface ImageLightboxProps {
  src: string
  alt: string
  onClose: () => void
}

/** Fullscreen overlay showing the original (full-resolution) image.
 * Closes on Escape, click on the backdrop, or the explicit close button. */
export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        className="lightbox-close"
        aria-label="Cerrar"
        onClick={onClose}
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt}
        className="lightbox-image"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  )
}
