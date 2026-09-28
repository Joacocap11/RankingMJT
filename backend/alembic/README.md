# Alembic migrations

`env.py` reads `DATABASE_URL` from the app's `pydantic-settings` config
(same env var the FastAPI app reads), so no connection string is hardcoded
here.

Run these from the repo root, against the running `api` container (which
already has the backend code + dependencies installed):

```sh
# apply all pending migrations
docker compose exec api alembic upgrade head

# roll back the most recent migration
docker compose exec api alembic downgrade -1

# check current revision
docker compose exec api alembic current
```

To generate a new migration after changing `app/models.py`:

```sh
docker compose exec api alembic revision --autogenerate -m "describe change"
```
