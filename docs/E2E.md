# E2E smoke (Playwright)

Specs CI (API seed `SEED_ENABLED=true`) :

| Spec | Flux |
|------|------|
| `smoke.spec.ts` | login chef → dashboard → Kanban projet |
| `logout.spec.ts` | logout → `/login` (+ garde middleware) |
| `tasks-filters.spec.ts` | filtres statut / priorité sur Mes tâches |
| `announcements.spec.ts` | lecture + création annonce (compte bureau) |

## Prérequis

1. API Spring Boot avec seed demo :

```bash
cd backend
SEED_ENABLED=true AUTH_RATE_LIMIT_ENABLED=false ./mvnw spring-boot:run
```

2. Frontend buildé avec la même URL API que le navigateur utilisera :

```bash
cd frontend
export NEXT_PUBLIC_API_URL=http://127.0.0.1:8081
npm ci
npm run build
npm run test:e2e
```

Playwright démarre `next start` sur le port **3100** (évite les conflits avec `:3000`).  
`E2E_SKIP_WEBSERVER=1` + `E2E_REUSE=1` si tu sers déjà le build toi-même.

Compte utilisé : `chef@ensem.jee` / `Demo123!` (voir [ADMIN.md](./ADMIN.md)).

## CI

Job `e2e` dans [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) :

1. Package + démarre l’API (H2, `SEED_ENABLED=true`)
2. Build Next.js (`NEXT_PUBLIC_API_URL=http://127.0.0.1:8081`)
3. Installe Chromium Playwright + lance `npm run test:e2e`

Pas de mock front : le smoke parle à l’API réelle (in-process CI).
