# État du projet — JEE Platform

Document de suivi vivant. Mis à jour à chaque mission terminée ou avancement notable.

**Dernière mise à jour :** 2026-10-24  
**Board GitHub :** [JEE Platform — Missions](https://github.com/users/abdellah-get/projects/6)

---

## Résumé

| Phase | Statut        | Progression |
|-------|---------------|-------------|
| P0 Fondations | En cours | 2/7 missions |
| P1 Projets & RBAC | À faire | 0/5 |
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
| 3 | Auth JWT (login, refresh, logout) | À faire |
| 4 | Pages auth frontend | À faire |
| 5 | Layout app + middleware routes protégées | À faire |
| 6 | Profil /me + page /profile | À faire |
| 7 | CI GitHub Actions + déploiement | À faire |

### P1 — Projets & RBAC

| # | Mission | Statut |
|---|---------|--------|
| 8 | API CRUD projets + désignation chef | À faire |
| 9 | ProjectMember + gestion équipe | À faire |
| 10 | Isolation accès projet (tests) | À faire |
| 11 | Pages projets | À faire |
| 12 | Admin membres et rôles club | À faire |

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
