# Déploiement — JEE Platform (low-cost)

Cible club : **Neon** (Postgres) + **Render** (API Spring Boot) + **Vercel** (Next.js).  
Budget attendu : gratuit / quelques euros max.

---

## 1. Neon (PostgreSQL)

1. Créer un compte sur [neon.tech](https://neon.tech) → nouveau projet.
2. Copier la connection string (host, database, user, password).
3. Variables pour l’API :

```text
DATABASE_URL=jdbc:postgresql://ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
DATABASE_USERNAME=neondb_owner
DATABASE_PASSWORD=********
DATABASE_DRIVER=org.postgresql.Driver
```

Flyway appliquera `V1__create_users.sql` au premier démarrage.

---

## 2. Render (API Spring Boot)

1. [render.com](https://render.com) → **New Web Service** → connecter le repo GitHub.
2. Réglages :
   - **Root Directory** : `backend`
   - **Runtime** : Java
   - **Build Command** : `./mvnw -DskipTests package`
   - **Start Command** : `java -jar target/jee-platform-0.0.1-SNAPSHOT.jar`
3. Variables d’environnement (Render → Environment) :

| Variable | Exemple |
|----------|---------|
| `DATABASE_URL` | jdbc Neon (ci-dessus) |
| `DATABASE_USERNAME` | … |
| `DATABASE_PASSWORD` | … |
| `DATABASE_DRIVER` | `org.postgresql.Driver` |
| `JWT_SECRET` | chaîne aléatoire **≥ 32 caractères** |
| `JWT_COOKIE_SECURE` | `true` |
| `CORS_ORIGINS` | `https://ton-app.vercel.app` |
| `PORT` | laissé à Render (Spring lit `server.port` ; si besoin : `SERVER_PORT` / config) |

> **Note port :** Render injecte `PORT`. Ajoute si besoin dans `application.properties` :  
> `server.port=${PORT:8081}`

4. Après deploy, tester : `https://ton-api.onrender.com/api/v1/health`

**Cold start :** le plan Free endort le service ; le premier appel peut prendre 30–60 s.

---

## 3. Vercel (Frontend Next.js)

1. [vercel.com](https://vercel.com) → Import du repo.
2. **Root Directory** : `frontend`
3. Framework : Next.js (détecté).
4. Variable d’environnement :

```text
NEXT_PUBLIC_API_URL=https://ton-api.onrender.com
```

5. Deploy → ouvrir l’URL Vercel → `/register` puis `/login`.

---

## 4. Checklist post-deploy

- [ ] `GET /api/v1/health` → `UP`
- [ ] Inscription + login depuis le front Vercel
- [ ] Cookie refresh : HTTPS + `JWT_COOKIE_SECURE=true`
- [ ] CORS : origine Vercel listée dans `CORS_ORIGINS`
- [ ] Pas de secret (`JWT_SECRET`, mots de passe DB) dans le repo

---

## 5. CI (déjà dans le repo)

Workflow : [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

- **backend** : `./mvnw test` (Java 21)
- **frontend** : `npm ci` + `npm run build` (Node 20)

Se lance sur push `main` / `feature/**` et sur les PR vers `main`.
