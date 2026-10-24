# Guide admin club — JEE Platform

Onboarding pour le **bureau** et l’**admin technique**.

## Comptes demo (local)

Activer le seed au démarrage backend :

```bash
# Windows PowerShell
$env:SEED_ENABLED="true"
cd backend
./mvnw spring-boot:run
```

Ou dans `.env` / variables :

```
SEED_ENABLED=true
```

| Email | Rôle | Mot de passe |
|-------|------|--------------|
| `admin@ensem.jee` | ADMIN_TECH | `Demo123!` |
| `bureau@ensem.jee` | BUREAU | `Demo123!` |
| `chef@ensem.jee` | MEMBRE (+ chef projet) | `Demo123!` |
| `membre@ensem.jee` | MEMBRE | `Demo123!` |

Le seed est **idempotent** (ne recrée pas si `bureau@ensem.jee` existe) et **désactivé** en tests / prod par défaut.

## Rôles club

| Rôle | Peut |
|------|------|
| **MEMBRE** | Voir ses projets/tâches, lire les annonces |
| **BUREAU** | Créer projets, gérer membres (actif/inactif), publier annonces, KPI dashboard |
| **ADMIN_TECH** | Tout le bureau + changer les rôles club (`/admin/roles`) |

Rôles **projet** (sur l’équipe) : `CHEF_PROJET` / `CONTRIBUTEUR` — le chef compose l’équipe et gère le Kanban.

## Parcours bureau recommandés

1. **Promouvoir un membre**  
   Admin → Rôles (compte `ADMIN_TECH`) → passer un user en `BUREAU`.

2. **Créer un projet**  
   Projets → Nouveau → désigner un chef → le chef ajoute l’équipe dans **Équipe**.

3. **Suivre l’avancement**  
   Le % se calcule automatiquement (tâches DONE / total) sur la fiche projet et le Kanban.

4. **Annonce urgente**  
   Annonces → Nouvelle → cocher **Épingler** → visible en tête et sur le dashboard.

5. **Désactiver un compte**  
   Admin → Membres → Désactiver (ne peut pas se désactiver soi-même).

## Déploiement

Voir [DEPLOY.md](./DEPLOY.md) (Neon + Render + Vercel) et [SECURITY.md](./SECURITY.md).

**Ne jamais** activer `SEED_ENABLED=true` en production publique.
