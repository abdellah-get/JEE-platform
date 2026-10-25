# Étude approfondie — post P7 (frontend, backend, sécurité)

**Date :** 2026-10-25  
**Contexte :** P0–P7 terminés, plateforme déployée (Neon + Render + Vercel), UI marque ENSEM.  
**Objectif :** prioriser ce qui rend la plateforme **pratique au quotidien** et **crédible en prod publique**.

Canvas associé (IDE) : `audit-platforme-p8.canvas.tsx`.

---

## 1. État actuel (synthèse)

| Domaine | Niveau | Commentaire |
|---------|--------|-------------|
| Auth / RBAC | Fort | JWT 30 min, refresh hashé + rotation, rate-limit, allowlist, SameSite=None |
| Produit projets | Fort | Kanban, commentaires, notifs, activité, dashboard CSV |
| Frontend UX | Moyen | Design ENSEM OK ; pas de search / cache / offline |
| Sécurité runtime | Moyen+ | Gaps session (reset MDP), CSRF refresh, headers |
| Observabilité | Faible | Health sans DB, pas d’Actuator |
| Tests | Moyen | MockMvc riches ; 1 smoke E2E |
| Domaine JE élargi | Faible | Pas docs / events / finance / recrutement |

---

## 2. Frontend — constats

### Forces
- App Router clair, `apiFetch` + refresh silencieux, shell mobile, tokens CSS, Syne/Manrope.
- EmptyState / Loading / toasts ; Kanban a11y clavier ; PageHeader sur pages clés.

### Gaps (pratiques)
1. ~~`/notifications` hors middleware~~ → **corrigé** (`middleware.ts`).
2. Pas de **recherche** (projets, annonces, membres).
3. Data 100 % CSR `useEffect` — pas de **TanStack Query / SWR**.
4. A11y : ~~filtres Mes tâches~~ → labels ajoutés ; reste focus trap `TaskEditPanel` / cloche.
5. `confirm()` natif ; DS React incomplet (Select/Textarea/Modal).
6. E2E = un seul smoke Chromium.
7. ~~`focus:border-line0`~~ → **corrigé** (`focus:border-brand`).

---

## 3. Backend — constats

### Forces
- Flyway **V1–V9**, `ddl-auto=validate`, packages feature-based.
- `ProjectAccessService` (404 hors équipe), admin last/self guards.
- Refresh tokens SHA-256 + rotation (`AuthService`).
- `ProductionSafetyValidator` (JWT / H2).

### Gaps
1. **Change/reset password ne révoque pas** les refresh existants.
2. CSRF désactivé + cookie refresh `SameSite=None` → CSRF possible sur `/refresh` `/logout`.
3. Rate-limit **in-memory**, `X-Forwarded-For` 1er hop ; `/refresh` et `/reset-password` non limités.
4. Politique MDP = longueur 8 seulement.
5. `GET /api/v1/users` expose emails à tout membre authentifié.
6. Health **statique** (pas de check DB) ; pas d’Actuator ; pas de pagination listes.
7. Domaines JE absents : pièces jointes, événements, cotisations, recrutement.

---

## 4. Sécurité — risques P0

| Risque | Impact | Zone |
|--------|--------|------|
| Sessions vivantes après reset MDP | Compte compromis reste connecté | `MeService`, `PasswordResetService` |
| CSRF refresh cross-site | Rotation / invalidation forcée | `SecurityConfig`, cookie refresh |
| Access JWT en `localStorage` | XSS = prise de session | `auth-storage.ts` |
| `SEED_ENABLED=true` en prod | Comptes `Demo123!` | Render env |
| Route `/notifications` edge non gated | Incohérence UX (API reste protégée) | `middleware.ts` |

---

## 5. Roadmap P8 (recommandée)

### P0 — Sécurité session
1. Révoquer **tous** les refresh au change/reset MDP.
2. Anti-CSRF sur `/auth/refresh` et `/logout`.
3. Middleware : protéger `/notifications` ; a11y labels filtres tâches.
4. Prod safety : refuser `SEED_ENABLED` + exiger domaines / approval.

### P1 — Usage quotidien
5. Recherche client (projets, annonces, membres).
6. TanStack Query autour de `api.ts`.
7. ConfirmDialog + focus trap panneau tâche + a11y cloche.
8. Security headers + rate-limit refresh/reset + health DB.
9. Élargir E2E (logout, filtres, annonce).

### P2 — Plateforme JE
10. Pièces jointes / livrables.
11. Événements + calendrier échéances.
12. Access token hors localStorage (memory / BFF) si prioritaire XSS.
13. Pagination + OpenAPI + Actuator sécurisé.

---

## 6. Matrice décision

| Objectif | Faire d’abord |
|---------|----------------|
| Ouvrir le club sans risque | P0 session + seed/approval + CSRF |
| Fluidité quotidienne | P1 search + Query + a11y |
| JE digitale complète | P2 attachments + events |

---

## 7. Critères de succès P8

- Reset MDP coupe toutes les sessions.
- Refresh/logout non abusables cross-site.
- Membre trouve un projet / une annonce en &lt; 3 s (search).
- CI E2E couvre au moins logout + un flux métier hors Kanban.
- Health indique DB UP ; headers de base présents en prod.
