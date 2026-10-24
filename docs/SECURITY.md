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
| **Profils** | Local : `spring.profiles.default=local`. Render : `SPRING_PROFILES_ACTIVE=prod`. |
| **Rate-limit auth** | `POST` login / register / forgot-password : 20 req / IP / endpoint / 60 s (configurable). Réponse `429` + `Retry-After`. |
| **Refresh silencieux** | Sur `401` API (hors `/auth/**`) : un `POST /auth/refresh` puis retry. Échec → clear session + redirect `/login`. Single-flight (pas de boucle). |

Variables : `AUTH_RATE_LIMIT_ENABLED`, `AUTH_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW_SECONDS`.

En prod, définir au minimum :

```text
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=<aléatoire ≥ 32 caractères>
JWT_COOKIE_SECURE=true
SEED_ENABLED=false
```
