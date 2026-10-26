# Sécurité — pipelines & alertes

## Ce qui est en place

| Outil | Fichier | Détecte |
|-------|---------|---------|
| **Gitleaks** | `.github/workflows/security.yml` | Secrets / mots de passe commités |
| **npm audit** | idem | Vulns dépendances frontend (HIGH+) |
| **Trivy** | idem | Vulns filesystem / deps (HIGH, CRITICAL) |
| **CodeQL** | idem | Vulns code Java + JS/TS |
| **Dependabot** | `.github/dependabot.yml` | PRs de mise à jour deps (hebdo) |
| **CI build/test** | `.github/workflows/ci.yml` | Régression fonctionnelle |

## Secret scanning GitHub natif

Le repo est **public** : tu peux activer *Secret scanning* + *Push protection* :
Repo → **Settings** → **Code security**.

**Gitleaks** tourne aussi à chaque push/PR (filet de sécurité CI).

## Dependabot

Après merge de cette config, vérifier :  
Repo → **Settings** → **Code security** → Dependabot alerts + Dependabot security updates = **On**.

## Interpréter un échec CI Security

1. **Gitleaks** → un secret est dans l’historique ou le diff → le retirer, le faire tourner (rotation), ne jamais le re-commit.
2. **npm audit** → `cd frontend && npm audit` puis mettre à jour le package.
3. **Trivy** → lire le CVE, mettre à jour la dépendance Maven/npm.
4. **CodeQL** → alertes dans **Security → Code scanning** (repo public).
   Corriger chaque alerte signalée, puis re-run le workflow si besoin.

## Règles club

- Jamais de `.env` / mots de passe / `JWT_SECRET` dans Git
- Utiliser `.env.example` sans valeurs réelles
- Secrets uniquement dans Render / Vercel / GitHub Secrets

## Hardening runtime (P5)

| Contrôle | Comportement |
|----------|----------------|
| **H2 console** | Désactivée par défaut ; activée seulement avec le profil `local` (`application-local.properties`). Non exposée en `prod`. |
| **JWT secret** | Le secret de développement est **refusé** si environnement « prod-like » : profil `prod`, `JWT_COOKIE_SECURE=true`, ou driver PostgreSQL. Voir `ProductionSafetyValidator`. |
| **Seed / inscription** | En prod-like : `SEED_ENABLED` doit rester `false` ; `REGISTRATION_ALLOWED_DOMAINS` non vide ; `REGISTRATION_REQUIRE_APPROVAL=true`. Sinon l’API refuse de démarrer. |
| **Profils** | Local : `spring.profiles.default=local`. Render : `SPRING_PROFILES_ACTIVE=prod`. |
| **Rate-limit auth** | `POST` login / register / forgot-password / refresh / reset-password : 20 req / IP / endpoint / 60 s (configurable). Réponse `429` + `Retry-After`. |
| **Refresh silencieux** | Sur `401` API (hors `/auth/**`) : un `POST /auth/refresh` puis retry. Échec → clear session + redirect `/login`. Single-flight (pas de boucle). |
| **Refresh stocké + rotation** | Chaque refresh JWT est hashé (SHA-256) en base (`refresh_tokens`). Un refresh réussi révoque l’ancien et en émet un nouveau. Logout révoque le cookie courant. |
| **Change / reset MDP** | `POST /me/password` et `POST /auth/reset-password` révoquent **tous** les refresh tokens de l’utilisateur (sessions restantes coupées). L’access JWT en cours expire naturellement (TTL 30 min). |
| **Anti-CSRF refresh/logout** | Spring CSRF cookie désactivé volontairement (API JWT stateless + front cross-origin : cookie `XSRF-TOKEN` illisible depuis Vercel). À la place : `AuthCookieCsrfFilter` — `POST /auth/refresh` et `/auth/logout` exigent `X-Requested-With: XMLHttpRequest` (preflight CORS) ; si `Origin` est présent, il doit être dans `CORS_ORIGINS`. L’access JWT Bearer n’est pas auto-envoyé par le navigateur → pas de surface CSRF. |
| **Security headers** | `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (sauf H2 local → `SAMEORIGIN`). HSTS 1 an si `JWT_COOKIE_SECURE=true`. |
| **Health DB** | `GET /api/v1/health` renvoie `db=UP|DOWN` ; HTTP 503 si la base est inaccessible. |
| **Rate-limit auth étendu** | Aussi `POST /auth/refresh` et `/auth/reset-password` (même fenêtre / IP). |
| **Access JWT hors `localStorage`** | Access token en **mémoire** (React + module). Reprise de session uniquement via cookie HttpOnly `refresh_token`. Profil `jee_user` peut rester en `localStorage` (pas un secret). Cookie client `jee_auth` = hint middleware non secret. |
| **Actuator** | Exposé : `/actuator/health` (+ `liveness` / `readiness` probes) public. Autres endpoints Actuator : authentifiés. Détails health : `never`. |
| **OpenAPI / Swagger** | `/v3/api-docs` + `/swagger-ui.html` **authentifiés** (JWT). Désactivable : `SPRINGDOC_ENABLED=false`. |

Variables : `AUTH_RATE_LIMIT_ENABLED`, `AUTH_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW_SECONDS`.

### Posture XSS — access token (checklist manuelle)

Objectif : un script injecté ne doit **pas** pouvoir lire l’access JWT depuis le stockage persistant.

1. Login → DevTools → Application → Local Storage → **pas** de clé `jee_access_token` (ni autre JWT).
2. Recharger la page authentifiée → session reprend (refresh cookie) ; toujours **pas** de JWT en Local Storage.
3. Session Storage / cookies lisibles par JS : `jee_auth=1` et `jee_user` OK ; le cookie `refresh_token` doit rester **HttpOnly** (invisible dans `document.cookie`).
4. Logout → mémoire vidée, cookies client effacés, refresh révoqué côté API.

E2E automatisé : `frontend/e2e/auth-token-storage.spec.ts`.

En prod, définir au minimum :

```text
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=<aléatoire ≥ 32 caractères>
JWT_COOKIE_SECURE=true
SEED_ENABLED=false
REGISTRATION_ALLOWED_DOMAINS=ensem.ac.ma,ensem.jee
REGISTRATION_REQUIRE_APPROVAL=true
```
