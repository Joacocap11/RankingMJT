import type { Monster, MonsterCreateInput, MonsterUpdateInput, PickedImage } from './types';

// EXPO_PUBLIC_* vars are inlined at build/start time by Expo's env support.
// The `http://localhost:8003/api/v1` fallback is a dev-only convenience for
// running the web/iOS simulator target without an `.env` file; it is never a
// real deployed host. See `.env.example` for the Android emulator and
// physical-device (LAN) alternatives.
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8003/api/v1';

// The backend serves uploads at `${origin}/uploads/...`, i.e. one level above
// the `/api/v1` prefix used for JSON endpoints.
export const API_ORIGIN: string = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export function imageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  return `${API_ORIGIN}/uploads/${imagePath}`;
}

/** Thumbnail for list cards; falls back to the original for rows that
 * predate the thumbnail feature (thumbnail_path not yet backfilled). */
export function thumbnailUrl(monster: Pick<Monster, 'image_path' | 'thumbnail_path'>): string | null {
  return imageUrl(monster.thumbnail_path ?? monster.image_path);
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: isFormData
      ? init?.headers
      : { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // response body wasn't JSON; keep statusText
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  listMonsters: () => request<Monster[]>('/monsters'),

  getMonster: (id: number) => request<Monster>(`/monsters/${id}`),

  createMonster: (input: MonsterCreateInput) =>
    request<Monster>('/monsters', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateMonster: (id: number, input: MonsterUpdateInput) =>
    request<Monster>(`/monsters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  updateRank: (id: number, rankPosition: number) =>
    request<Monster>(`/monsters/${id}/rank`, {
      method: 'PUT',
      body: JSON.stringify({ rank_position: rankPosition }),
    }),

  deleteMonster: (id: number) =>
    request<void>(`/monsters/${id}`, { method: 'DELETE' }),

  uploadImage: (id: number, file: PickedImage) => {
    const form = new FormData();
    // React Native's FormData accepts this shape for file uploads.
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
    return request<Monster>(`/monsters/${id}/image`, {
      method: 'POST',
      body: form,
    });
  },
};

export { ApiError };
