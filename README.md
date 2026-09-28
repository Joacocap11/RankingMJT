# RankingMJT

Aplicación personal para rankear cosas. La primera feature/módulo es **Monsters**
(latas de Monster Energy), pero el producto (`RankingMJT`) no está acoplado a esa
categoría: en el futuro se podrán agregar otras (Alfajores, Cervezas, etc.) sin
rediseñar la arquitectura de base.

> ⚠️ **Seguridad**: esta versión **no implementa autenticación/login**. La API
> queda abierta dentro del entorno de desarrollo. **No debe exponerse
> directamente a Internet** sin agregar autenticación/protección adicional
> (reverse proxy con auth, VPN, etc.). Pensada para uso personal en
> local/LAN únicamente.

## Estado actual

- Fase: **100% desarrollo local**. No hay deploy remoto ni infraestructura de
  Proxmox involucrada.
- Sin login/auth.
- Repo pensado para ser público — ver [Seguridad / .gitignore](#seguridad--gitignore).

## Arquitectura

```mermaid
flowchart LR
    subgraph Docker Compose (dev)
        FE["frontend (Vite dev server)\nlocalhost:3003"] -- "/api, /uploads proxy" --> API["api (FastAPI)\nlocalhost:8003"]
        API --> DB[("Postgres\n127.0.0.1:5433")]
        API -- "static files" --> UP[["backend/uploads"]]
    end
    MOB["mobile (Expo)\nEXPO_PUBLIC_API_BASE_URL"] -- "http (LAN/emulator)" --> API
```

- **backend/**: FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL. Expone `/api/v1`.
- **frontend/**: React + TypeScript + Vite. Dev server en `3003`, proxy interno
  hacia el backend (mismo origen desde el navegador, sin CORS que gestionar).
- **mobile/**: Expo + React Native + Expo Router. Consume la misma API vía
  `EXPO_PUBLIC_API_BASE_URL`.
- **docker-compose.yml**: orquesta `db`, `api`, `frontend` para desarrollo
  reproducible. `mobile` corre aparte (Expo dev server), no está en compose.

No se incluye ningún reverse proxy (nginx) en esta fase — se deja para una
etapa posterior de despliegue, que **no** forma parte de este entregable.

## Stack

| Área      | Tecnologías |
|-----------|-------------|
| Backend   | Python, FastAPI, SQLAlchemy 2 (sync), Alembic, PostgreSQL, Pydantic v2 |
| Frontend  | React 18, TypeScript (strict), Vite |
| Mobile    | Expo (SDK 57), React Native, Expo Router, TypeScript (strict) |
| Infra dev | Docker Compose |

## Puertos de desarrollo

| Servicio        | URL                              |
|-----------------|-----------------------------------|
| Web (frontend)  | http://localhost:3003             |
| API (directa)   | http://localhost:8003/api/v1      |
| API (vía proxy) | http://localhost:3003/api/v1      |
| Uploads         | http://localhost:8003/uploads/... |
| Postgres        | 127.0.0.1:5433 (solo localhost)   |

Se evitaron intencionalmente los puertos `3000`, `3001`, `3002` para no chocar
con otros proyectos locales.

## Cómo levantar el entorno dev

Requisitos: Docker Desktop.

```bash
cd RankingMJT
cp .env.example .env          # ajustar si hace falta, valores de ejemplo ya sirven para dev
docker compose build
docker compose up -d

# Aplicar la migración inicial
docker compose exec api alembic upgrade head

# Cargar el seed (20 Monsters, idempotente)
docker compose exec api python -m app.seed
```

Abrir: **http://localhost:3003**

Para bajar el entorno: `docker compose down` (agregar `-v` solo si se quiere
borrar también los datos de Postgres).

### Backend fuera de Docker (opcional)

El backend está pensado para correr en Docker. Si se quiere ejecutar
localmente hace falta Python 3.12+, instalar `backend/requirements.txt` y una
instancia de Postgres accesible vía `DATABASE_URL`.

## Variables de entorno

Cada módulo tiene su propio `.env.example` con placeholders seguros (nunca
secretos reales):

- `.env.example` (raíz, usado por `docker-compose.yml`): credenciales de
  Postgres para desarrollo, puertos, `DATABASE_URL`, `CORS_ORIGINS`.
- `backend/.env.example`: `DATABASE_URL`, `CORS_ORIGINS`, `UPLOAD_MAX_MB`,
  `UPLOAD_DIR`.
- `frontend/.env.example`: `VITE_PROXY_TARGET` (solo afecta el proxy del
  dev-server, nunca se incluye en el bundle del navegador).
- `mobile/.env.example`: `EXPO_PUBLIC_API_BASE_URL`, con las tres variantes
  documentadas (simulador/web, emulador Android `10.0.2.2`, dispositivo físico
  en LAN con placeholder `192.168.1.100`, **nunca** una IP real).

**Nunca se commitea `.env` real, ni credenciales, ni tokens (Expo/GitHub/SSH),
ni IPs privadas reales.**

## Modelo de datos: Monster

```
id                int, PK
nickname          str        — nombre visual/personal de la lata (ej. "Negra")
flavor            str        — sabor/nombre oficial (ej. "Aussie Lemonade")
rank_position     int        — posición GLOBAL y única en el ranking (1..N)
would_buy_again   bool       — agrupación visual (Compraría / No compraría)
image_path        str | null — ruta relativa dentro de uploads/ (ej. "monsters/<uuid>.jpg")
notes             str | null — aclaraciones libres (ej. "Guarina")
created_at        datetime
updated_at        datetime
```

**No hay puntuación 1–10.** El ranking ES el orden (`rank_position`).
`would_buy_again` solo agrupa visualmente COMPRARÍA / NO COMPRARÍA dentro de
un único ranking global — nunca recalcula la posición.

## Lógica de ranking

Hay un solo ranking global de `1..N` sin huecos ni duplicados, garantizado por
una constraint `UNIQUE(rank_position)` a nivel de base de datos más lógica de
reordenamiento en el backend (nunca en el frontend).

- **Crear** en posición `P` (rango válido `1..N+1`): las filas con
  `rank_position >= P` se desplazan `+1`, procesadas en **orden descendente**
  (la de mayor posición primero) para no violar el `UNIQUE` en ningún paso
  intermedio.
- **Mover** una fila existente de `old` a `new` (rango válido `1..N`):
  - `new < old`: el rango `[new, old-1]` se desplaza `+1` (orden descendente).
  - `new > old`: el rango `[old+1, new]` se desplaza `-1` (orden ascendente).
  - `new == old`: no-op (el resto de los campos igual se puede actualizar).
  - La fila que se mueve se libera primero a un valor transitorio antes del
    shift, para no chocar contra sí misma bajo el `UNIQUE` no diferido.
- **Borrar** en posición `P`: las filas con `rank_position > P` se desplazan
  `-1`, procesadas en **orden ascendente**.
- Todo dentro de una única transacción DB. Posiciones `<= 0` o fuera de rango
  se rechazan con `422` y un mensaje claro.

Se optó por **updates ordenados** en vez de una constraint `DEFERRABLE`: es
portable (funciona igual en Postgres y en SQLite para los tests) y evita
depender de comportamiento específico de un motor.

## Endpoints (`/api/v1`)

| Método | Path                          | Descripción |
|--------|-------------------------------|-------------|
| GET    | `/health`                     | Chequeo de salud |
| GET    | `/monsters`                   | Lista completa, ordenada por `rank_position` ASC |
| GET    | `/monsters/{id}`               | Detalle |
| POST   | `/monsters`                   | Crear (dispara reordenamiento) |
| PUT    | `/monsters/{id}`               | Editar campos; si cambia `rank_position`, reordena |
| PUT    | `/monsters/{id}/rank`           | Atajo explícito solo para mover de posición |
| DELETE | `/monsters/{id}`               | Eliminar (reordena el resto) |
| POST   | `/monsters/{id}/image`          | Subir foto principal (`multipart/form-data`, campo `file`) |

Las imágenes se sirven como archivos estáticos en `/uploads/<image_path>`. No
se guardan blobs en Postgres. Se valida tipo de archivo
(`image/jpeg`, `image/png`, `image/webp`) y tamaño máximo (`UPLOAD_MAX_MB`,
5 MB por defecto).

## Seed inicial (20 Monsters)

`docker compose exec api python -m app.seed` — idempotente: si ya existe
alguna fila, no hace nada (no duplica). Carga exactamente las 20 latas
actuales del usuario, en el orden 1..20 dado, agrupadas en COMPRARÍA (1-13) y
NO COMPRARÍA (14-20).

Decisiones sobre datos ambiguos:

- `nickname` = color/apodo visual de la lata; `flavor` = sabor/nombre oficial;
  `notes` = aclaraciones sueltas (solo la #1 tiene nota: `"Guarina"`).
- Nicknames repetidos (`Verde` ×2, `Rosadita` ×2, `Azul` ×2, `Naranja` ×2) son
  intencionales — el mismo color de lata se reutiliza entre sabores distintos.
  `nickname` no es único.
- **No se corrigió ortografía**: se mantuvo la grafía exacta provista, incluso
  con errores evidentes (`Absoletuly Zero`, `White Pineaplle`,
  `Ultra Golden Pineaple`, `Ultra Watermelón`). Editable luego desde la app.

## Migraciones (Alembic)

Migración inicial `0001_monsters` crea la tabla `monsters` con la constraint
`UNIQUE(rank_position)`. Ver detalle de upgrade/downgrade en
[`backend/alembic/README.md`](backend/alembic/README.md).

```bash
docker compose exec api alembic upgrade head
docker compose exec api alembic downgrade -1
docker compose exec api alembic current
```

## Tests

### Backend

```bash
docker compose exec api pytest -q
```

14 tests cubren los casos A–N pedidos: alta en posición 1, inserción que
desplaza todo hacia abajo, inserción intermedia, inserción al final, mover
arriba/abajo, mover a la misma posición (no-op), borrar reordena, posiciones
inválidas rechazadas (422), no hay duplicados tras secuencias mixtas de
operaciones, `GET` siempre ordenado, actualizar `would_buy_again` nunca mueve
la posición, el seed crea exactamente 20 filas, y el seed es idempotente.
**Resultado verificado: 14 passed, 0 failed.**

### Frontend

```bash
cd frontend
npm install
npx tsc --noEmit   # limpio
npm run lint       # limpio, 0 errores/warnings
npm run build      # build de producción exitoso
```

### Mobile

```bash
cd mobile
npx tsc --noEmit    # limpio
npx expo lint       # limpio
npx expo-doctor     # 21/21 checks OK
```

No se genera APK ni se corre EAS/OTA en esta fase.

## Frontend web

Página principal "Ranking Monsters": dos secciones (COMPRARÍA / NO COMPRARÍA)
con la posición global bien visible (`#N` grande), imagen, nickname, flavor,
badge y acciones Editar/Eliminar. Formulario de alta/edición reutilizado,
avisa explícitamente cuando la posición elegida va a desplazar al resto.
Responsive.

## Mobile

Misma lógica de ranking, mismas dos secciones, mismo endpoint. Pantallas de
listado, alta y edición con Expo Router. Config de host vía
`EXPO_PUBLIC_API_BASE_URL` (nunca hardcodeado en el código fuente) — ver
[`mobile/.env.example`](mobile/.env.example) para las variantes de
emulador/dispositivo físico.

## Seguridad / .gitignore

Repositorio pensado para ser **público**. El `.gitignore` de la raíz excluye
explícitamente: `.env` y variantes (excepto `*.env.example`), claves/secretos
(`*.pem`, `*.key`, patrones `*secret*`/`*credential*`, llaves SSH),
`node_modules/`, `dist/`, `.expo/`, cachés de Python/Node, `backend/uploads/*`
(contenido subido en dev), bases de datos locales y archivos de sistema/IDE.

Antes de cada commit se recomienda repetir una búsqueda explícita de
secretos/patrones sensibles.

## Roadmap

- [ ] Autenticación (cuando la app deje de ser solo local/LAN).
- [ ] Nueva sección: **Alfajores**.
- [ ] Nueva sección: **Cervezas**.
- [ ] Generalizar el concepto de "ranking" a más categorías si hace falta.
- [ ] Deploy (Proxmox/homelab) — **fuera de alcance de esta fase**.
- [ ] Reverse proxy (nginx) para producción — no implementado todavía.
- [ ] Mobile: EAS Update / build de APK.
