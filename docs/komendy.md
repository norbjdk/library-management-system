# Zatrzymaj wszystkie kontenery

```powershell
docker compose down -v --remove-orphans
docker compose -p projektzespolowy-devcontainer -f docker-compose.yml -f .devcontainer/docker-compose.yml down -v --remove-orphans
```

## Uruchom devcontainer (jeśli używasz VS Code Dev Containers)

```powershell
docker compose -p projektzespolowy-devcontainer -f docker-compose.yml -f .devcontainer/docker-compose.yml up --build --remove-orphans -d db backend web
```

## Uruchom główny stack (bez devcontainer)

```powershell
docker compose up -d
```
