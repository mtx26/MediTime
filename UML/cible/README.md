# Architecture cible MediTime — Rust et PostgreSQL interne

Ces diagrammes décrivent une **cible proposée**, distincte des diagrammes de l'architecture actuelle. Ils partent des choix confirmés :

- backend en Rust ;
- Axum pour l'API HTTP et SQLx pour l'accès à PostgreSQL ;
- PostgreSQL 18 auto-hébergé sur un VPS avec Docker Compose ;
- authentification gérée par le backend, avec OAuth possible ;
- access tokens JWT courts et refresh tokens rotatifs, stockés en base sous forme de hash ;
- stockage objet compatible S3, fournisseur à choisir ;
- services e-mail, push, analyse documentaire et catalogue conservés comme intégrations au départ.

## Diagrammes

1. [Architecture cible](./01-architecture-cible.puml) — [PNG](./01-architecture-cible.png), frontières du système et services.
2. [Modules du backend Rust](./02-modules-backend-rust.puml) — [PNG](./02-modules-backend-rust.png), responsabilités, ports et adaptateurs.
3. [Modèle de données cible](./03-modele-donnees-cible.puml) — [PNG](./03-modele-donnees-cible.png), entités relationnelles, y compris les comptes et sessions internes.
4. [Séquence d'authentification interne](./04-sequence-auth-interne.puml) — [PNG](./04-sequence-auth-interne.png), inscription, connexion e-mail/OAuth et renouvellement de session.
5. [Plan de migration](./05-plan-migration.puml) — [PNG](./05-plan-migration.png), phases de travail, critères de vérification et bascule.

## Rendre les diagrammes

Depuis la racine de `MediTime` :

```powershell
plantuml -tpng UML/cible/01-architecture-cible.puml
plantuml -tpng UML/cible/02-modules-backend-rust.puml
plantuml -tpng UML/cible/03-modele-donnees-cible.puml
plantuml -tpng UML/cible/04-sequence-auth-interne.puml
plantuml -tpng UML/cible/05-plan-migration.puml
```

Les images PNG sont générées à côté des sources.

## Décisions encore à prendre

Les choix structurants ci-dessus sont fixés. Les détails restants à confirmer sont :

- compatibilité de l'image PostgreSQL 18 avec le VPS, le système d'exploitation et la stratégie de mises à jour ;
- fournisseur et endpoint S3, région éventuelle, chiffrement, cycle de vie et sauvegarde des objets ;
- durées exactes des access tokens et sessions refresh, nombre d'appareils, règles d'inactivité et de révocation ;
- règles de liaison des comptes OAuth et exigences de vérification d'e-mail ;
- protection anti-abus, quotas, rétention des journaux et objectifs de sauvegarde ;
- contrat de permissions des calendriers partagés et expiration des invitations/liens.

Le modèle de données constitue une proposition : il reprend le domaine MediTime existant, mais introduit des identifiants, mots de passe hashés, identités OAuth et sessions internes. Il n'est pas une migration SQL prête à appliquer. Les contraintes de sécurité (hachage des mots de passe et jetons, rotation et révocation) doivent être validées puis couvertes par des tests avant la mise en production. Le déploiement VPS devra aussi prévoir pare-feu, TLS, secrets hors du dépôt, sauvegardes PostgreSQL testées en restauration et sauvegardes/versions du stockage objet.

## Ordre de travail conseillé

Suivre les phases du diagramme de migration. Ne pas commencer la migration des données avant d'avoir validé les permissions, le contrat API cible et le mapping de l'identité Supabase vers les nouveaux comptes. Prévoir une répétition complète, des sauvegardes restaurables et un retour arrière avant toute bascule.
