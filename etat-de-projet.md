# État du projet — JEE Platform

Document de suivi vivant. Mis à jour à chaque mission terminée ou avancement notable.

**Dernière mise à jour :** 2026-10-24  
**Board GitHub :** [JEE Platform — Missions](https://github.com/users/abdellah-get/projects/6)

---

## Résumé

| Phase | Statut        | Progression |
|-------|---------------|-------------|
| P0 Fondations | **Terminé** | 7/7 missions |
| P1 Projets & RBAC | **Terminé** | 5/5 |
| P2 Tâches Kanban | À faire | 0/4 |
| P3 Annonces & Dashboard | À faire | 0/2 |
| P4 Polish | À faire | 0/2 |

---

## Missions

### P0 — Fondations

| # | Mission | Statut |
|---|---------|--------|
| 1 | Initialiser le monorepo Spring Boot + Next.js | **Terminé** |
| 2 | Schéma PostgreSQL + Flyway (User, roles) | **Terminé** |
| 3 | Auth JWT (login, refresh, logout) | **Terminé** |
| 4 | Pages auth frontend | **Terminé** |
| 5 | Layout app + middleware routes protégées | **Terminé** |
| 6 | Profil /me + page /profile | **Terminé** |
| 7 | CI GitHub Actions + déploiement | **Terminé** |

### P1 — Projets & RBAC

| # | Mission | Statut |
|---|---------|--------|
| 8 | API CRUD projets + désignation chef | **Terminé** |
| 9 | ProjectMember + gestion équipe | **Terminé** |
| 10 | Isolation accès projet (tests) | **Terminé** |
| 11 | Pages projets | **Terminé** |
| 12 | Admin membres et rôles club | **Terminé** |

### P2 — Tâches Kanban

| # | Mission | Statut |
|---|---------|--------|
| 13 | API tâches | À faire |
| 14 | Kanban frontend | À faire |
| 15 | Calcul % avancement | À faire |
| 16 | Page Mes tâches `/tasks` | À faire |

### P3 — Annonces & Dashboard

| # | Mission | Statut |
|---|---------|--------|
| 17 | API + pages Annonces | À faire |
| 18 | Dashboard membre et bureau | À faire |

### P4 — Polish

| # | Mission | Statut |
|---|---------|--------|
| 19 | UX mobile + polish UI | À faire |
| 20 | Seed data demo + doc admin | À faire |

---

## Journal des réalisations

### 2026-10-24 — Missions #8 #9 #10 terminées (API projets)

**Fait :**
- Flyway `V2__create_projects.sql` : `projects` + `project_members`
- API `POST/GET/PATCH /api/v1/projects` + `GET/PUT …/members`
- `ProjectAccessService` : BUREAU/ADMIN voient tout ; membre hors équipe → **404**
- Création projet réservée au bureau ; chef désigné à la création
- Chef (ou bureau) gère l’équipe (`CHEF_PROJET` / `CONTRIBUTEUR`)
- Tests d’intégration isolation + CRUD équipe verts

**À retenir :**
- Rôle club ≠ rôle projet : `ClubRole` transverse, `ProjectRole` sur l’équipe
- 404 plutôt que 403 hors équipe pour ne pas révéler l’existence d’un projet

**Prochaine mission :** #11 — Pages projets (liste, new, detail, team).

### 2026-10-24 — Mission #11 terminée (pages projets)

**Fait :**
- `/projects`, `/projects/new`, `/projects/[id]`, `/team`, `/settings`
- Client API projets + `GET /api/v1/users` (annuaire pour composer l’équipe)
- Accès refusé propre (404 API / message UI)

**Prochaine mission :** #12 — Admin membres et rôles club.

### 2026-10-24 — Mission #12 terminée (fin P1)

**Fait :**
- API `GET/PATCH /api/v1/admin/users` (active + rôle)
- Bureau : activer/désactiver membres
- ADMIN_TECH uniquement : changer `ClubRole`
- Pages `/admin`, `/admin/members`, `/admin/roles`
- Garde-fous : pas de désactivation de soi, pas de suppression du dernier admin

**Phase P1 = complète.**  
**Prochaine phase :** P2 — Tâches Kanban (mission #13).

### 2026-10-24 — Pipelines sécurité ajoutés

**Fait :**
- `security.yml` : Gitleaks (secrets), npm audit, Trivy (vulns), CodeQL
- `dependabot.yml` : npm + Maven + GitHub Actions (hebdo)
- Doc : `docs/SECURITY.md`

### 2026-10-24 — Mission #7 terminée (fin P0)

**Fait :**
- CI GitHub Actions : `.github/workflows/ci.yml` (Maven test + Next build)
- Guide déploiement : `docs/DEPLOY.md` (Neon + Render + Vercel)
- Prod-ready : `server.port=${PORT:8081}`, `CORS_ORIGINS` configurable

**Phase P0 fondations = complète.**  
Prochaine phase : **P1 — Projets & RBAC** (mission #8).

### 2026-10-24 — Mission #6 terminée

**Fait :**
- API `GET/PATCH /api/v1/me` + `POST /api/v1/me/password`
- `MeService` / `MeController` + tests
- Page `/profile` : édition prénom/nom + changement MDP
- Sync localStorage / sidebar après update

**À retenir :**
- `/me` lit l’utilisateur depuis le JWT (`SecurityContext`), pas depuis un id dans l’URL
- Changement MDP vérifie l’ancien hash BCrypt avant d’encoder le nouveau

**Prochaine mission :** #7 — CI GitHub Actions + déploiement Neon/Render/Vercel.

### 2026-10-24 — Mission #5 terminée

**Fait :**
- `middleware.ts` : routes protégées → redirect `/login?next=…` ; auth pages → `/dashboard` si session
- Cookies client `jee_auth` + `jee_role` (pour le middleware ; sécu réelle = JWT API)
- `AppShell` sidebar (Dashboard, Projets, Tâches, Annonces, Profil, Admin si BUREAU/ADMIN)
- Route group `(app)/` + placeholders projets / tâches / annonces / admin / profil
- Menu mobile (collapse)

**À retenir :**
- Middleware Edge ne doit pas importer du code qui utilise `document` / `localStorage`
- Admin masqué + bloqué si rôle insuffisant

**Prochaine mission :** #6 — Profil `/me` + page `/profile` (édition + MDP).

### 2026-10-24 — Mission #4 terminée

**Fait :**
- Client API (`src/lib/api.ts`) + stockage access token (`localStorage`)
- `AuthContext` : login / register / logout / refresh silencieux
- Pages : `/login`, `/register`, `/forgot-password`, `/reset-password`, `/dashboard`
- Redirect auto vers dashboard si déjà connecté ; dashboard protégé côté client
- Erreurs API affichées dans les formulaires
- Forgot/reset : UI prête (envoi email Brevo à brancher plus tard)

**À retenir :**
- Access token → `Authorization: Bearer` + `localStorage`
- Refresh cookie HttpOnly envoyé avec `credentials: "include"`
- Middleware Next.js « dur » = mission #5

**Prochaine mission :** #5 — Layout app + middleware routes protégées.

### 2026-10-24 — Mission #3 terminée

**Fait :**
- Spring Security + JWT (jjwt), BCrypt strength 12
- Endpoints : `POST /api/v1/auth/register|login|refresh|logout`
- Access token (JSON) + refresh token (cookie HttpOnly `refresh_token`)
- Filtre `JwtAuthenticationFilter` + `SecurityConfig` (stateless)
- `/api/v1/health` et `/api/v1/auth/**` publics ; reste authentifié
- CORS `localhost:3000` (prêt pour le front)
- Tests AuthController (register → login → refresh → logout + mauvais MDP)

**À retenir :**
- Access court (15 min) dans le header `Authorization: Bearer …`
- Refresh long (7 j) en cookie — le JS ne le lit pas (HttpOnly)
- Logout = suppression du cookie (JWT access reste valide jusqu’à expiration)

**Prochaine mission :** #4 — Pages auth frontend (login, register, reset).

### 2026-10-24 — Mission #2 terminée

**Fait :**
- Dépendances : JPA, `spring-boot-starter-flyway`, PostgreSQL, H2 (local)
- Migration Flyway `V1__create_users.sql` (table `users` + rôles club)
- Entité `User`, enum `ClubRole`, `UserRepository`
- Config DB via env (`DATABASE_URL`, etc.) — défaut local **H2 mémoire**
- `backend/.env.example` pour Neon
- Tests : context + save/find user (Flyway applique V1)

**À retenir (apprentissage) :**
- Flyway = scripts SQL versionnés ; Hibernate en `validate` (ne crée plus les tables)
- Sans `spring-boot-starter-flyway`, les migrations ne partent pas (juste `flyway-core` ne suffit pas en Boot 4)

**Prochaine mission :** #3 — Auth JWT (login, refresh, logout).

### 2026-10-23 — Mission #1 terminée

**Fait :**
- Monorepo créé : `backend/` + `frontend/`
- Backend Spring Boot **4.1.2** (Java 21), Maven Wrapper (`mvnw`)
- Endpoint santé : `GET /api/v1/health` (port local **8081**, 8080 réservé Oracle TNS)
- Frontend Next.js **15.5** (App Router, TypeScript, Tailwind)
- Page d’accueil placeholder JEE ENSEM
- `README.md` avec commandes de démarrage
- `.gitignore` racine
- Ce fichier `etat-de-projet.md`

**Structure :**
```
backend/   → API Spring Boot
frontend/  → Next.js
```

**Prochaine mission :** #2 — Schéma PostgreSQL + Flyway (User, rôles club).

---

## Décisions techniques figées

- Stack : Spring Boot + Next.js
- Échelle : &lt; ~50 membres, cloud low-cost
- Isolation projet : hors équipe = pas de contenu
- Rôles club : `MEMBRE`, `BUREAU`, `ADMIN_TECH`
- Rôles projet : `CHEF_PROJET`, `CONTRIBUTEUR`
