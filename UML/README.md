# Diagramme de cas d'utilisation MediTime

Le diagramme général se trouve dans [`diagramme-cas-utilisation.puml`](./diagramme-cas-utilisation.puml). Il décrit les parcours disponibles dans les applications web et mobile ainsi que les interactions avec les services externes.

Le modèle de données est représenté dans [`diagramme-classes.puml`](./diagramme-classes.puml). Il reprend les tables et relations du schéma PostgreSQL, y compris les cardinalités, les clés et les références facultatives.

## Architecture cible sans Supabase

Pour la refonte backend Rust et PostgreSQL auto-hébergé, consulter le dossier [`cible/`](./cible/README.md). Ses diagrammes d'architecture, de modules, de données, d'authentification et de migration sont des propositions de cible ; ils ne décrivent pas le comportement actuellement déployé.

Les parcours détaillés sont documentés dans le sous-dossier [`sequences/`](./sequences/) :

- [Scanner et ajouter un médicament](./sequences/01-scan-ajout-medicament.puml) ([PNG](./sequences/01-scan-ajout-medicament.png))
- [Inviter un collaborateur et traiter sa réponse](./sequences/02-invitation-collaborateur.puml) ([PNG](./sequences/02-invitation-collaborateur.png))
- [Préparer le pilulier et décrémenter le stock](./sequences/03-preparer-pilulier.puml) ([PNG](./sequences/03-preparer-pilulier.png))
- [Prévisualiser et régulariser des prises manquées](./sequences/04-regulariser-prises-manquees.puml) ([PNG](./sequences/04-regulariser-prises-manquees.png))
- [Créer et consulter un partage public](./sequences/05-creer-et-consulter-partage-public.puml) ([PNG](./sequences/05-creer-et-consulter-partage-public.png))
- [Synchroniser un calendrier par ICS](./sequences/06-synchroniser-calendrier-ics.puml) ([PNG](./sequences/06-synchroniser-calendrier-ics.png))

## Rôles représentés

- **Visiteur** : inscription, connexion, vérification de l'adresse e-mail et récupération du mot de passe.
- **Utilisateur authentifié** : profil, préférences et notifications.
- **Propriétaire de calendrier** : gestion de ses calendriers, traitements, stocks et partages.
- **Collaborateur autorisé** : accès aux calendriers partagés, dans la limite des droits attribués.
- **Consultant d'un lien public** : accès limité aux données publiées par un jeton valide.
- **Services externes** : authentification, e-mail, notifications push, analyse de documents, notices, applications de calendrier et tâche planifiée.

## Afficher le diagramme

Les diagrammes sont au format PlantUML. Ouvrez le fichier souhaité avec une extension PlantUML ou rendez-le depuis la racine du projet avec, par exemple, `plantuml UML/diagramme-cas-utilisation.puml`, `plantuml UML/diagramme-classes.puml` ou `plantuml UML/sequences/01-scan-ajout-medicament.puml`.

## Périmètre et précisions

Le diagramme de cas d'utilisation couvre les fonctions repérées dans les interfaces web et mobile et les routes du backend : calendrier, médicaments et posologie, scan de code-barres, pilulier, prises manquées, stocks, partage, invitations, notifications, export PDF et synchronisation ICS. L'analyse de document est représentée comme une aide à la saisie, suivie d'une vérification par l'utilisateur. Les fonctionnalités du calendrier partagé restent soumises aux droits accordés.

Le diagramme de classes suit le schéma de `dumps/public_schema.sql`. Les services externes (notamment Supabase Auth) ne sont pas modélisés comme entités métier. Le pilulier persiste des préparations/restaurations, et non des prises individuelles.

Les diagrammes de séquence présentent les échanges frontend/API/services et les principaux cas alternatifs identifiés dans le code. Les opérations personnelles et celles sur calendrier partagé peuvent utiliser des routes distinctes, bien que leurs parcours fonctionnels soient équivalents.

Les diagrammes de la racine et du dossier `sequences/` documentent l'existant. Les diagrammes `cible/` organisent la nouvelle architecture et restent à valider pour les décisions qui y sont listées.
