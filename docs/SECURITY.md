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

Sur un repo **privé**, le *Secret scanning* / *Push protection* GitHub nécessite souvent **GitHub Advanced Security** (payant).

En compensation, **Gitleaks** tourne à chaque push/PR (équivalent pratique gratuit).

À activer manuellement si dispo :  
Repo → **Settings** → **Code security** → Secret scanning / Push protection.

## Dependabot

Après merge de cette config, vérifier :  
Repo → **Settings** → **Code security** → Dependabot alerts + Dependabot security updates = **On**.

## Interpréter un échec CI Security

1. **Gitleaks** → un secret est dans l’historique ou le diff → le retirer, le faire tourner (rotation), ne jamais le re-commit.
2. **npm audit** → `cd frontend && npm audit` puis mettre à jour le package.
3. **Trivy** → lire le CVE, mettre à jour la dépendance Maven/npm.
4. **CodeQL** → l’analyse tourne en CI ; les SARIF sont en artifact du workflow.
   L’onglet **Security → Code scanning** GitHub exige un repo **public** ou
   **GitHub Advanced Security** (payant en privé). Pour l’activer plus tard :
   Settings → Code security → Code scanning.

## Règles club

- Jamais de `.env` / mots de passe / `JWT_SECRET` dans Git
- Utiliser `.env.example` sans valeurs réelles
- Secrets uniquement dans Render / Vercel / GitHub Secrets
