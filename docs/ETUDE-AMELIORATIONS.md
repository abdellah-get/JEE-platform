# Étude d’améliorations — JEE Platform (post P0–P4)

**Date :** 2026-10-24  
**Périmètre :** monorepo Spring Boot + Next.js après livraison du board P0–P4.  
**Objectif :** prioriser ce qui transforme la démo en outil hebdomadaire pour le club JEE ENSEM.

Board missions : [JEE Platform — Missions](https://github.com/users/abdellah-get/projects/6)  
Étude liée aux issues **#45–#62** (phases P5–P7).

---

## 1. Capacité actuelle (ce qui marche)

| Domaine | Couvert |
|---------|---------|
| Auth JWT | Register, login, refresh cookie, logout, profil `/me` |
| RBAC club | `MEMBRE` / `BUREAU` / `ADMIN_TECH` + admin membres/rôles |
| Projets | CRUD, chef, équipe, isolation 404 |
| Tâches | Kanban DnD, assignation, priorité, % avancement, `/tasks` |
| Annonces | CRUD API, pin, dashboard + KPI bureau |
| Ops | Flyway V1–V4, seed demo, CI + security (Gitleaks, Trivy, CodeQL) |

**Absents confirmés :** reset MDP réel, email, commentaires, notifications, pièces jointes, recherche, export, rate-limit, Docker, e2e front, OpenAPI.

---

## 2. Demi-fonctionnalités (stubs / gaps UX)

| Élément | État | Fichiers clés |
|---------|------|----------------|
| Forgot / reset password | UI factice, pas d’API email | `forgot-password/page.tsx`, `reset-password/page.tsx` |
| `dueDate` / `description` tâche | OK (#51) — panneau édition + cartes | `TaskEditPanel`, `projects/[id]/tasks` |
| `sortOrder` Kanban | Créé mais DnD ne réordonne pas | `TaskService`, Kanban |
| Edit annonce title/body | API oui, UI pin/delete seulement | `AnnouncementService`, `announcements/[id]` |
| EmptyState / Toast / Loading | Présents, adoption partielle | `components/ui/*`, `ToastContext` |
| Landing | Minimale | `app/page.tsx` |
| Suppression projet | Pas d’endpoint (archive via statut) | `ProjectController` |
| DEPLOY.md | Note Flyway encore « V1 » alors que V2–V4 existent | `docs/DEPLOY.md` |

---

## 3. Gaps par catégorie (synthèse)

### P0 — risques prod
- Console H2 ouverte + permitAll hors profil local
- Secret JWT par défaut acceptable en local, dangereux en prod sans fail-fast
- Reset MDP inexistant (support bureau + comptes bloqués)

### P1 — usage club hebdo
- Due dates / description / panneau d’édition tâche
- Edit annonces, refresh silencieux 401
- Rate-limit auth, restriction inscription (domaine / approbation)
- Commentaires tâches, notifications in-app
- KPI bureau enrichis + export CSV
- E2E smoke front, a11y formulaires

### P2 — confort / scale
- Attachments, activity feed, invite email projet
- Pagination listes, OpenAPI, Dockerfile, staging
- Hardening cookies / headers, workload par membre

---

## 4. Roadmap missions

### P5 — Production & auth (#45–#50)
| # | Mission |
|---|---------|
| 45 | H2 console local-only + fail-fast JWT secret prod |
| 46 | Reset MDP API + email (Brevo/SMTP) + UI |
| 47 | Rate-limit `/auth/**` |
| 48 | Refresh silencieux sur 401 (client API) |
| 49 | Restriction inscription (allowlist ou approbation bureau) |
| 50 | Dockerfile backend + DEPLOY.md (V1–V4 + smoke) |

### P6 — Collaboration & UX tâches (#51–#56)
| # | Mission |
|---|---------|
| 51 | Kanban : due date, description, panneau édition |
| 52 | Persister `sortOrder` (réordonner colonne) |
| 53 | Edit annonce + badges overdue dashboard |
| 54 | Unifier EmptyState / Loading / toasts |
| 55 | Commentaires sur tâches |
| 56 | Notifications in-app (assignation + pin) |

### P7 — Reporting, hardening, qualité (#57–#62)
| # | Mission |
|---|---------|
| 57 | Dashboard bureau enrichi + export CSV |
| 58 | Rotation / révocation refresh tokens |
| 59 | E2E smoke CI (login → Kanban) |
| 60 | Permissions tâches (delete chef/bureau) |
| 61 | Pass a11y (erreurs form, Kanban clavier, landmarks) |
| 62 | *(Stretch)* Activity feed **ou** pièces jointes / liens |

---

## 5. Principes de priorisation

1. **Sécurité / prod** avant nouvelles features (P5).  
2. **Finir** ce qui est à moitié câblé (dates, edit annonces) avant gros modules.  
3. **Signaux** (commentaires, notifs) avant reporting avancé.  
4. Mesurer l’usage club après deploy avant d’investir dans fichiers / PWA.

---

## 6. Critères de succès P5–P7

- Plateforme déployée (Neon/Render/Vercel) utilisable hors laptop.  
- Un membre peut récupérer son MDP sans admin.  
- Un chef gère échéances et contexte tâche dans le Kanban.  
- Le bureau voit overdue + peut exporter un suivi.  
- CI empêche les régressions auth/Kanban de base.
