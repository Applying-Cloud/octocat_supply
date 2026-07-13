# 1. Crear la red
```
docker network create octocat-net
```

# 2. Levantar PostgreSQL
```
docker run -d \
  --name octocat-postgres \
  --network octocat-net \
  -p 5432:5432 \
  -e POSTGRES_USER=octocat \
  -e POSTGRES_PASSWORD=octocat_secret \
  -e POSTGRES_DB=octocat_supply \
  -v pg-data:/var/lib/postgresql \
  postgres:18-alpine

docker stop octocat-postgres
docker rm octocat-postgres
```  

# 3. Esperar que Postgres esté listo
```
# Repetir hasta que devuelva "accepting connections"
docker exec octocat-postgres pg_isready -U octocat -d octocat_supply
```

# 4. Construir y levantar el API

```
# Construir la imagen
docker build -t octocat-api ./api

# Ejecutar
docker run -d \
  --name octocat-api \
  --network octocat-net \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_ENGINE=postgres \
  -e DATABASE_URL=postgresql://octocat:octocat_secret@octocat-postgres:5432/octocat_supply \
  octocat-api

docker stop octocat-api
docker rm octocat-api

```
Nota: en DATABASE_URL el host es octocat-postgres (el --name del contenedor de Postgres), porque dentro de la red Docker los contenedores se resuelven por nombre.

# 5. Construir y levantar el Frontend
```
# Construir la imagen
docker build -t octocat-frontend ./frontend

# Ejecutar
docker run -d \
  --name octocat-frontend \
  --network octocat-net \
  -p 3001:80 \
  -e API_HOST=localhost \
  -e API_PORT=3000 \
  -e API_PROTOCOL=http \
  octocat-frontend

docker stop octocat-frontend
docker rm octocat-frontend
```

# Verificar
```
# Logs del API
docker logs octocat-api

# Verificar que Postgres tiene las tablas
docker exec octocat-postgres psql -U octocat -d octocat_supply -c "\dt"

# Verificar suppliers
docker exec octocat-postgres psql -U octocat -d octocat_supply -c "SELECT count(*) FROM suppliers;"
```

# Limpiar todo

```
docker stop octocat-frontend octocat-api octocat-postgres
docker rm octocat-frontend octocat-api octocat-postgres
docker network rm octocat-net
# Si quieres borrar los datos persistidos:
docker volume rm pg-data
```


export API_HOST=localhost
export API_PROTOCOL=http
docker compose up


cd frontend
npm install
npm run dev

docker compose up --build

docker compose up --build api o 
docker compose up --build frontend