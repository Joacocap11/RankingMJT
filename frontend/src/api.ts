import type {
  Alfajor,
  AlfajorCreateInput,
  AlfajorUpdateInput,
  Beer,
  BeerCreateInput,
  BeerUpdateInput,
  Monster,
  MonsterCreateInput,
  MonsterUpdateInput,
} from './types'

// All requests use same-origin relative paths. In dev, Vite's proxy
// (configured in vite.config.ts) forwards /api and /uploads to the backend.
// In Docker/prod a reverse proxy is expected to do the same. NEVER hardcode
// a backend origin/host/port here.
const API_BASE = '/api/v1'

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers:
      init && init.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json', ...(init.headers ?? {}) }
        : init?.headers,
    ...init,
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as T
}

export function getMonsters(): Promise<Monster[]> {
  return request<Monster[]>('/monsters')
}

export function getMonster(id: number): Promise<Monster> {
  return request<Monster>(`/monsters/${id}`)
}

export function createMonster(input: MonsterCreateInput): Promise<Monster> {
  return request<Monster>('/monsters', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateMonster(
  id: number,
  input: MonsterUpdateInput,
): Promise<Monster> {
  return request<Monster>(`/monsters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function updateMonsterRank(
  id: number,
  rank_position: number,
): Promise<Monster> {
  return request<Monster>(`/monsters/${id}/rank`, {
    method: 'PUT',
    body: JSON.stringify({ rank_position }),
  })
}

export function deleteMonster(id: number): Promise<void> {
  return request<void>(`/monsters/${id}`, { method: 'DELETE' })
}

export function uploadMonsterImage(
  id: number,
  file: File,
): Promise<Monster> {
  const form = new FormData()
  form.append('file', file)
  return request<Monster>(`/monsters/${id}/image`, {
    method: 'POST',
    body: form,
  })
}

/** Build a browsable URL for a monster's uploaded image (same-origin, proxied). */
export function monsterImageUrl(imagePath: string): string {
  return `/uploads/${imagePath}`
}

/** Thumbnail for list/grid display; falls back to the original when a row
 * predates the thumbnail feature (thumbnail_path not yet backfilled). */
export function monsterThumbnailUrl(monster: Pick<Monster, 'image_path' | 'thumbnail_path'>): string | null {
  const path = monster.thumbnail_path ?? monster.image_path
  return path ? monsterImageUrl(path) : null
}

export function getBeers(): Promise<Beer[]> {
  return request<Beer[]>('/beers')
}

export function getBeer(id: number): Promise<Beer> {
  return request<Beer>(`/beers/${id}`)
}

export function createBeer(input: BeerCreateInput): Promise<Beer> {
  return request<Beer>('/beers', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateBeer(id: number, input: BeerUpdateInput): Promise<Beer> {
  return request<Beer>(`/beers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function updateBeerRank(id: number, rank_position: number): Promise<Beer> {
  return request<Beer>(`/beers/${id}/rank`, {
    method: 'PUT',
    body: JSON.stringify({ rank_position }),
  })
}

export function deleteBeer(id: number): Promise<void> {
  return request<void>(`/beers/${id}`, { method: 'DELETE' })
}

export function uploadBeerImage(id: number, file: File): Promise<Beer> {
  const form = new FormData()
  form.append('file', file)
  return request<Beer>(`/beers/${id}/image`, {
    method: 'POST',
    body: form,
  })
}

/** Build a browsable URL for a beer's uploaded image (same-origin, proxied). */
export function beerImageUrl(imagePath: string): string {
  return `/uploads/${imagePath}`
}

/** Thumbnail for list/grid display; falls back to the original when a row
 * predates the thumbnail feature (thumbnail_path not yet backfilled). */
export function beerThumbnailUrl(beer: Pick<Beer, 'image_path' | 'thumbnail_path'>): string | null {
  const path = beer.thumbnail_path ?? beer.image_path
  return path ? beerImageUrl(path) : null
}

export function getAlfajores(): Promise<Alfajor[]> {
  return request<Alfajor[]>('/alfajores')
}

export function getAlfajor(id: number): Promise<Alfajor> {
  return request<Alfajor>(`/alfajores/${id}`)
}

export function createAlfajor(input: AlfajorCreateInput): Promise<Alfajor> {
  return request<Alfajor>('/alfajores', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAlfajor(id: number, input: AlfajorUpdateInput): Promise<Alfajor> {
  return request<Alfajor>(`/alfajores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function updateAlfajorRank(id: number, rank_position: number): Promise<Alfajor> {
  return request<Alfajor>(`/alfajores/${id}/rank`, {
    method: 'PUT',
    body: JSON.stringify({ rank_position }),
  })
}

export function deleteAlfajor(id: number): Promise<void> {
  return request<void>(`/alfajores/${id}`, { method: 'DELETE' })
}

export function uploadAlfajorImage(id: number, file: File): Promise<Alfajor> {
  const form = new FormData()
  form.append('file', file)
  return request<Alfajor>(`/alfajores/${id}/image`, {
    method: 'POST',
    body: form,
  })
}

/** Build a browsable URL for an alfajor's uploaded image (same-origin, proxied). */
export function alfajorImageUrl(imagePath: string): string {
  return `/uploads/${imagePath}`
}

/** Thumbnail for list/grid display; falls back to the original when a row
 * predates the thumbnail feature (thumbnail_path not yet backfilled). */
export function alfajorThumbnailUrl(alfajor: Pick<Alfajor, 'image_path' | 'thumbnail_path'>): string | null {
  const path = alfajor.thumbnail_path ?? alfajor.image_path
  return path ? alfajorImageUrl(path) : null
}
