# JEE Platform — Junior Entreprise ENSEM

Plateforme d’avancement de projets (tâches, équipes, annonces) pour le club JEE ENSEM.

## Structure

```
JEE-platform/
├── backend/          # Spring Boot (Java 21) — API REST
├── frontend/         # Next.js 15 (TypeScript + Tailwind)
├── etat-de-projet.md # Suivi d’avancement (mis à jour à chaque mission)
└── README.md
```

## Prérequis

- **Java 21+** (JDK installé)
- **Node.js 20+** et npm
- (optionnel) PostgreSQL / Neon — localement **H2** suffit (mémoire)

## Démarrage local

### Backend (port 8081)

```bash
cd backend
./mvnw spring-boot:run
```

Windows (PowerShell) :

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Vérifier : [http://localhost:8081/api/v1/health](http://localhost:8081/api/v1/health)

> Note : le port **8080** est souvent occupé par Oracle TNS Listener sous Windows ; l’API utilise **8081** en local.

Console H2 (local) : [http://localhost:8081/h2-console](http://localhost:8081/h2-console)  
JDBC URL : `jdbc:h2:mem:jee` · user `sa` · password vide.

### Base PostgreSQL (Neon) — optionnel

Variables d’environnement (voir `backend/.env.example`) :

```text
DATABASE_URL=jdbc:postgresql://.../neondb?sslmode=require
DATABASE_USERNAME=...
DATABASE_PASSWORD=...
DATABASE_DRIVER=org.postgresql.Driver
```

Flyway applique automatiquement `backend/src/main/resources/db/migration/V1__create_users.sql`.

### Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Ouvrir : [http://localhost:3000](http://localhost:3000)

## Suivi

Voir [etat-de-projet.md](./etat-de-projet.md) et le board GitHub  
[JEE Platform — Missions](https://github.com/users/abdellah-get/projects/6).

## Stack

| Couche   | Techno                          |
|----------|---------------------------------|
| API      | Spring Boot 4, Java 21, Maven   |
| Front    | Next.js 15, TypeScript, Tailwind|
| DB (prévu)| PostgreSQL (Neon) + Flyway     |
| Auth (prévu)| JWT + Spring Security        |
