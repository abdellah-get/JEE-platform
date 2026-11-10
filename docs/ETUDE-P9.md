# Étude — P9 à P11 (post audit plateforme)

**Date :** 2026-11-10  
**Contexte :** P0–P8 terminés. Audit code (backend + frontend + sécu + UX).  
**Board :** [JEE Platform — Missions](https://github.com/users/abdellah-get/projects/6)

---

## 1. Priorisation

1. **P9 Fiabiliser** — perf DB, stockage prod, data layer front, a11y mobile, E2E, hardening.  
2. **P10 Quotidien club** — calendrier, RSVP, digest, preview, audit, landing, charge.  
3. **P11 Junior-Entreprise** — CRM, finance, recrutement, realtime, 2FA (si objectif métier).

---

## 2. Missions GitHub

### P9 — Fiabiliser (#140–#147)

| # | Titre |
|---|--------|
| [140](https://github.com/abdellah-get/JEE-platform/issues/140) | Pagination JPA réelle |
| [141](https://github.com/abdellah-get/JEE-platform/issues/141) | N+1 projets + commentaires |
| [142](https://github.com/abdellah-get/JEE-platform/issues/142) | Attachments S3/R2 + MIME |
| [143](https://github.com/abdellah-get/JEE-platform/issues/143) | TanStack Query généralisé |
| [144](https://github.com/abdellah-get/JEE-platform/issues/144) | Recherche serveur + Cmd+K |
| [145](https://github.com/abdellah-get/JEE-platform/issues/145) | Focus trap + bottom nav |
| [146](https://github.com/abdellah-get/JEE-platform/issues/146) | E2E admin / PJ / notifs |
| [147](https://github.com/abdellah-get/JEE-platform/issues/147) | Prod hardening OpenAPI / refresh reuse / batch notifs |

### P10 — Quotidien club (#148–#154)

| # | Titre |
|---|--------|
| [148](https://github.com/abdellah-get/JEE-platform/issues/148) | Calendrier semaine / agenda |
| [149](https://github.com/abdellah-get/JEE-platform/issues/149) | RSVP événements |
| [150](https://github.com/abdellah-get/JEE-platform/issues/150) | Digest email + préférences |
| [151](https://github.com/abdellah-get/JEE-platform/issues/151) | Preview PJ + markdown |
| [152](https://github.com/abdellah-get/JEE-platform/issues/152) | Audit log admin |
| [153](https://github.com/abdellah-get/JEE-platform/issues/153) | Landing + pending approval UX |
| [154](https://github.com/abdellah-get/JEE-platform/issues/154) | Charge membre cross-projets |

### P11 — Junior-Entreprise (#155–#159)

| # | Titre |
|---|--------|
| [155](https://github.com/abdellah-get/JEE-platform/issues/155) | CRM missions |
| [156](https://github.com/abdellah-get/JEE-platform/issues/156) | Finance légère |
| [157](https://github.com/abdellah-get/JEE-platform/issues/157) | Recrutement + pôles |
| [158](https://github.com/abdellah-get/JEE-platform/issues/158) | Notifs temps réel |
| [159](https://github.com/abdellah-get/JEE-platform/issues/159) | 2FA / SSO campus |

---

## 3. Ordre de travail recommandé

Commencer par **#140 → #141 → #142**, puis data/UX front (**#143–#145**), qualité (**#146–#147**).  
P10 après usage réel P9. P11 seulement si le club valide l’ambition JE commerciale.

---

## 4. Critères de succès P9

- Listes API paginées en SQL (plus de `PageResponse.slice` sur listes chaudes).  
- Fichiers persistants hors disque Render éphémère.  
- Cache front cohérent hors des 4 écrans actuels.  
- Recherche globale utilisable.  
- CI E2E couvre admin + PJ + notifs.
