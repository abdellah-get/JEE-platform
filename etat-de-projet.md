# État du projet — JEE Platform

Document de suivi vivant. Mis à jour à chaque mission terminée ou avancement notable.

**Dernière mise à jour :** 2026-10-24  
**Board GitHub :** [JEE Platform — Missions](https://github.com/users/abdellah-get/projects/6)  
**Étude post-P4 :** [docs/ETUDE-AMELIORATIONS.md](./docs/ETUDE-AMELIORATIONS.md)

---

## Résumé

| Phase | Statut        | Progression |
|-------|---------------|-------------|
| P0 Fondations | **Terminé** | 7/7 missions |
| P1 Projets & RBAC | **Terminé** | 5/5 |
| P2 Tâches Kanban | **Terminé** | 4/4 |
| P3 Annonces & Dashboard | **Terminé** | 2/2 |
| P4 Polish | **Terminé** | 2/2 |
| P5 Prod & auth | **Terminé** | 6/6 (#45–#50) |
| P6 Collaboration UX | **Terminé** | 6/6 (#51–#56) |
| P7 Reporting & qualité | **À faire** | 0/6 (#57–#62) |

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
| 13 | API tâches | **Terminé** |
| 14 | Kanban frontend | **Terminé** |
| 15 | Calcul % avancement | **Terminé** |
| 16 | Page Mes tâches `/tasks` | **Terminé** |

### P3 — Annonces & Dashboard

| # | Mission | Statut |
|---|---------|--------|
| 17 | API + pages Annonces | **Terminé** |
| 18 | Dashboard membre et bureau | **Terminé** |

### P4 — Polish

| # | Mission | Statut |
|---|---------|--------|
| 19 | UX mobile + polish UI | **Terminé** |
| 20 | Seed data demo + doc admin | **Terminé** |

### P5 — Production & auth

| # | Mission | Statut |
|---|---------|--------|
| 45 | H2 console local-only + fail-fast JWT secret | **Terminé** |
| 46 | Reset MDP API + email + UI forgot/reset | **Terminé** |
| 47 | Rate-limit endpoints auth | **Terminé** |
| 48 | Refresh silencieux sur 401 | **Terminé** |
| 49 | Restriction inscription (domaine / approbation) | **Terminé** |
| 50 | Dockerfile backend + DEPLOY.md (V1–V5) | **Terminé** |

### P6 — Collaboration & UX tâches

| # | Mission | Statut |
|---|---------|--------|
| 51 | Kanban : due dates, description, panneau édition | **Terminé** |
| 52 | Persister reorder Kanban (`sortOrder`) | **Terminé** |
| 53 | Edit annonce + badges overdue | **Terminé** |
| 54 | Unifier EmptyState / Loading / toasts | **Terminé** |
| 55 | Commentaires sur tâches | **Terminé** |
| 56 | Notifications in-app | **Terminé** |

### P7 — Reporting, hardening, qualité

| # | Mission | Statut |
|---|---------|--------|
| 57 | Dashboard bureau enrichi + export CSV | **À faire** |
| 58 | Rotation / révocation refresh tokens | **À faire** |
| 59 | E2E smoke CI | **À faire** |
| 60 | Permissions tâches (delete chef/bureau) | **À faire** |
| 61 | Pass accessibilité | **À faire** |
| 62 | Stretch : activity feed ou pièces jointes | **À faire** |

---

## Journal des réalisations

### 2026-10-24 — Mission #56 terminée (notifications in-app) — fin P6

**Fait :**
- Flyway **V7** `notifications` (`TASK_ASSIGNED`, `ANNOUNCEMENT_PINNED`)
- API liste / unread-count / mark read / read-all
- Hooks : assignation tâche + annonce épinglée
- Badge cloche AppShell + page `/notifications`
- **Phase P6 = complète**

**Prochaine phase :** P7 — Reporting & qualité (#57…).

### 2026-10-24 — Mission #55 terminée (commentaires tâches)

**Fait :**
- Flyway **V6** `task_comments`
- API : `GET/POST /tasks/{id}/comments`, `PATCH/DELETE /comments/{id}`
- Isolation projet (404 hors équipe) ; edit auteur ; delete auteur/chef/bureau
- UI commentaires dans `TaskEditPanel`

**Prochaine mission :** [#56](https://github.com/abdellah-get/JEE-platform/issues/56) — notifications in-app.

### 2026-10-24 — Mission #54 terminée (EmptyState / Loading / toasts)

**Fait :**
- Dashboard, `/tasks`, Kanban, profil, admin : `LoadingBlock` + `EmptyState` (+ compact)
- Toasts sur profil, admin membres/rôles, Kanban CRUD, édition annonce
- Pages projets/annonces restantes migrées vers `LoadingBlock`

**Prochaine mission :** [#55](https://github.com/abdellah-get/JEE-platform/issues/55) — commentaires sur tâches.

### 2026-10-24 — Mission #53 terminée (edit annonce + badges overdue)

**Fait :**
- UI édition titre / corps sur `/announcements/[id]` (PATCH existant)
- Badges « En retard » / « Bientôt » (≤ 3 j) sur dashboard, `/tasks`, Kanban
- Helpers `dueUrgency` + composant `DueBadge`
- Test API PATCH title/body (bureau OK, membre 403)

**Prochaine mission :** [#54](https://github.com/abdellah-get/JEE-platform/issues/54) — unifier EmptyState / Loading / toasts.

### 2026-10-24 — Mission #52 terminée (persister reorder Kanban)

**Fait :**
- `PUT /api/v1/projects/{id}/tasks/reorder` : status + `sortOrder = index`
- Kanban : drop sur carte (insert before) ou colonne (fin) → ordre persisté
- Création : `sortOrder` = count dans la colonne cible
- Test API reorder + ordre stable au GET

**Prochaine mission :** [#53](https://github.com/abdellah-get/JEE-platform/issues/53) — edit annonce + badges overdue.

### 2026-10-24 — Mission #51 terminée (Kanban due dates / panneau édition)

**Fait :**
- Création tâche : description + échéance (en plus titre / priorité / assigné)
- Panneau latéral d’édition (`TaskEditPanel`) : titre, description, priorité, échéance, assigné
- Cartes Kanban + `/tasks` : extrait description, échéance formatée, surbrillance overdue
- Endpoints existants `POST/PATCH` tâches (pas de changement API)

**Prochaine mission :** [#52](https://github.com/abdellah-get/JEE-platform/issues/52) — persister reorder Kanban (`sortOrder`).

### 2026-10-24 — Mission #50 terminée (Dockerfile + DEPLOY) — fin P5

**Fait :**
- `backend/Dockerfile` multi-stage (JDK 21 → JRE) + `.dockerignore`
- `docs/DEPLOY.md` : Flyway V1–V5, Render Java/Docker, variables prod
- Scripts smoke `scripts/smoke-api.sh` / `.ps1`
- **Phase P5 = complète**

**Prochaine phase :** P6 — Collaboration & UX (#51…).

### 2026-10-24 — Mission #49 terminée (restriction inscription)

**Fait :**
- Allowlist domaines email (`REGISTRATION_ALLOWED_DOMAINS`, défaut `ensem.ac.ma,ensem.jee`)
- Option `REGISTRATION_REQUIRE_APPROVAL` → compte inactif jusqu’activation bureau
- UI register : message domaine / pending ; admin membres : badge attente
- Tests reject domaine + flux approbation

**Prochaine mission :** [#50](https://github.com/abdellah-get/JEE-platform/issues/50) — Dockerfile + DEPLOY.

### 2026-10-24 — Mission #48 terminée (refresh silencieux 401)

**Fait :**
- `apiFetch` : sur 401 → un refresh cookie puis retry (hors `/api/v1/auth/**`)
- Single-flight `silentRefresh` + sync `AuthContext` via `setAuthSessionHandlers`
- Échec refresh → clear session + redirect `/login?next=…`
- Doc SECURITY

**Prochaine mission :** [#49](https://github.com/abdellah-get/JEE-platform/issues/49) — restriction inscription.

### 2026-10-24 — Mission #47 terminée (rate-limit auth)

**Fait :**
- Filtre `AuthRateLimitFilter` sur login / register / forgot-password
- Limite par IP + endpoint (sliding window in-memory), `429` + `Retry-After`
- Config `app.auth.rate-limit.*` / env `AUTH_RATE_LIMIT_*`
- Tests unitaires + intégration dépassement

**Prochaine mission :** [#48](https://github.com/abdellah-get/JEE-platform/issues/48) — refresh silencieux 401.

### 2026-10-24 — Mission #46 terminée (reset mot de passe)

**Fait :**
- Flyway V5 `password_reset_tokens` (hash SHA-256, TTL, single-use)
- `POST /api/v1/auth/forgot-password` + `POST /api/v1/auth/reset-password`
- Mail : log local (`LoggingMailService`) ou SMTP si `spring.mail.host` (Brevo…)
- Front `/forgot-password` + `/reset-password` branchés
- Tests flux complet + anti-énumération

**Prochaine mission :** [#47](https://github.com/abdellah-get/JEE-platform/issues/47) — rate-limit auth.

### 2026-10-24 — Mission #45 terminée (H2 + JWT fail-fast)

**Fait :**
- Profil `local` par défaut : console H2 uniquement via `application-local.properties`
- Profil `prod` : H2 off, cookies secure
- `ProductionSafetyValidator` : refuse secret JWT par défaut / trop court si prod, `JWT_COOKIE_SECURE`, ou Postgres
- Security : `/h2-console/**` permitAll seulement si console activée
- Tests unitaires + doc SECURITY / DEPLOY / README

**Prochaine mission :** [#46](https://github.com/abdellah-get/JEE-platform/issues/46) — Reset MDP + email.

### 2026-10-24 — Étude d’améliorations + board P5–P7

**Fait :**
- Étude approfondie : [`docs/ETUDE-AMELIORATIONS.md`](./docs/ETUDE-AMELIORATIONS.md)
- 18 missions GitHub **#45–#62** (labels `phase:P5`…`P7`) ajoutées au board
- Priorité : prod/auth → finir UX tâches → collab/reporting

**Prochaine mission :** [#45](https://github.com/abdellah-get/JEE-platform/issues/45) — H2 + JWT fail-fast.

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

### 2026-10-24 — Missions #13–#16 terminées (fin P2)

**Fait :**
- Flyway V3 : table `tasks` + `projects.progress_percent`
- API `/projects/{id}/tasks`, `PATCH/DELETE /tasks/{id}`, `GET /me/tasks`
- Progress auto = DONE / total
- Kanban `/projects/[id]/tasks` (drag & drop + boutons)
- Page `/tasks` avec filtres statut / priorité / projet

**Phase P2 = complète.**  
**Prochaine phase :** P3 — Annonces & Dashboard (#17).

### 2026-10-24 — Missions #17 #18 terminées (fin P3)

**Fait :**
- Flyway V4 : `announcements` (pin urgent)
- API annonces (lecture tous, écriture bureau) + `GET /dashboard`
- Pages `/announcements`, `/new`, `/[id]`
- Dashboard : pins, projets, tâches ; KPI pour bureau/admin

**Phase P3 = complète.**  
**Prochaine phase :** P4 — Polish (#19 UX, #20 seed/doc).

### 2026-10-24 — Missions #19 #20 terminées (fin P4)

**Fait :**
- UX mobile : sidebar sticky/safe-area, Kanban scroll horizontal, empty/loading, toasts
- Seed demo (`SEED_ENABLED=true`) : users, projets, tâches, annonces
- Doc bureau : `docs/ADMIN.md`

**Toutes les phases P0–P4 du board sont livrées.**

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
