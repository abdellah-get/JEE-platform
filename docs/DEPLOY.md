# Déploiement — JEE Platform (low-cost)

Cible club : **Neon** (Postgres) + **Render** (API Spring Boot) + **Vercel** (Next.js).  
Budget attendu : gratuit / quelques euros max.

---

## Flyway (schema)

Au démarrage, Flyway applique **toutes** les migrations présentes :

| Version | Contenu |
|---------|---------|
| **V1** | `users` + rôles club |
| **V2** | `projects` + `project_members` |
| **V3** | `tasks` + `progress_percent` |
| **V4** | `announcements` |
| **V5** | `password_reset_tokens` |
| **V6** | `task_comments` |
| **V7** | `notifications` |

Fichiers : `backend/src/main/resources/db/migration/`.

---

## 1. Neon (PostgreSQL)

1. Créer un compte sur [neon.tech](https://neon.tech) → nouveau projet.
2. Copier host, database, user, password.
3. Variables pour l’API :

```text
DATABASE_URL=jdbc:postgresql://ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
DATABASE_USERNAME=neondb_owner
DATABASE_PASSWORD=********
DATABASE_DRIVER=org.postgresql.Driver
```

---

## 2. Render (API Spring Boot)

### Option A — Runtime Java (simple)

1. [render.com](https://render.com) → **New Web Service** → repo GitHub.
2. Réglages :
   - **Root Directory** : `backend`
   - **Runtime** : Java
   - **Build Command** : `./mvnw -DskipTests package`
   - **Start Command** : `java -jar target/jee-platform-0.0.1-SNAPSHOT.jar`

### Option B — Docker (recommandé pour reproduire le build)

1. **New Web Service** → Docker.
2. **Dockerfile Path** : `backend/Dockerfile`
3. **Docker Context** : `backend`
4. Render injecte `PORT` ; Spring lit `server.port=${PORT:8081}`.

Image locale :

```bash
docker build -t jee-platform-api -f backend/Dockerfile backend
docker run --rm -p 8081:8081 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e JWT_SECRET='change-me-to-a-long-random-secret-key' \
  -e JWT_COOKIE_SECURE=false \
  -e DATABASE_URL='jdbc:postgresql://...' \
  -e DATABASE_USERNAME=... \
  -e DATABASE_PASSWORD=... \
  -e DATABASE_DRIVER=org.postgresql.Driver \
  -e CORS_ORIGINS=http://localhost:3000 \
  -e SEED_ENABLED=false \
  jee-platform-api
```

### Variables d’environnement (Render)

| Variable | Exemple |
|----------|---------|
| `SPRING_PROFILES_ACTIVE` | `prod` (**obligatoire**) |
| `DATABASE_URL` | jdbc Neon |
| `DATABASE_USERNAME` | … |
| `DATABASE_PASSWORD` | … |
| `DATABASE_DRIVER` | `org.postgresql.Driver` |
| `JWT_SECRET` | aléatoire **≥ 32** caractères |
| `JWT_COOKIE_SECURE` | `true` |
| `CORS_ORIGINS` | `https://ton-app.vercel.app` |
| `SEED_ENABLED` | `false` |
| `REGISTRATION_ALLOWED_DOMAINS` | `ensem.ac.ma` |
| `REGISTRATION_REQUIRE_APPROVAL` | `true` (prod publique) |
| `FRONTEND_BASE_URL` | `https://ton-app.vercel.app` |
| `MAIL_FROM` / `MAIL_HOST` / … | SMTP Brevo (optionnel) |
| `PORT` | laissé à Render |

SMTP (si mail réel) :

```text
spring.mail.host=${MAIL_HOST}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

> Sans `JWT_SECRET` fort + environnement prod-like, l’API **refuse de démarrer** (`ProductionSafetyValidator`).  
> Console H2 **désactivée** hors profil `local`.

**Cold start (Free) :** premier appel 30–60 s.

---

## 3. Vercel (Frontend Next.js)

1. [vercel.com](https://vercel.com) → Import du repo.
2. **Root Directory** : `frontend`
3. Variable :

```text
NEXT_PUBLIC_API_URL=https://ton-api.onrender.com
```

4. Deploy → `/register` / `/login`.

---

## 4. Checklist + smoke post-deploy

### Checklist

- [ ] `SPRING_PROFILES_ACTIVE=prod` et `JWT_SECRET` (≥ 32)
- [ ] Flyway V1–V7 appliquées (pas d’erreur au boot)
- [ ] `GET /api/v1/health` → `UP`
- [ ] `/h2-console` inaccessible
- [ ] `SEED_ENABLED=false`
- [ ] CORS : origine Vercel dans `CORS_ORIGINS`
- [ ] Cookie refresh : HTTPS + `JWT_COOKIE_SECURE=true`
- [ ] Inscription (domaine autorisé) + login depuis Vercel
- [ ] Aucun secret dans le repo

### Script smoke

```bash
# Linux / macOS / Git Bash
chmod +x scripts/smoke-api.sh
./scripts/smoke-api.sh https://ton-api.onrender.com
```

```powershell
# Windows PowerShell
.\scripts\smoke-api.ps1 https://ton-api.onrender.com
```

Le script vérifie health `UP`, absence d’exposition H2 console, et une réponse auth (401/429).

---

## 5. CI

Workflow : [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

- **backend** : `./mvnw test` (Java 21)
- **frontend** : `npm ci` + `npm run build` (Node 20)

Sur push `main` / `feature/**` et PR vers `main`.
