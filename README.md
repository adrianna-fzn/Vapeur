# Vapeur

Vapeur est une application web dynamique ayant pour but de gérer une collection de jeux vidéo. Elle permet de visualiser, ajouter, supprimer ou de modifier les jeux, leurs genres et leurs éditeurs. Les jeux peuvent également être mis en avant et apparaitront alors sur la page d'accueil.

## Technologies utilisées

- Express     - Backend
- SQLite      - Base de donnée
- Nodemon     - Facilite le développement
- Multer      - Téléchargement des images de l'utilisateur
- Handlebars  - Moteur de template
- Prisma      - Gestion de la base de donnée
- Body parser - Aide à la lecture de formulaires

## Installation

- ### Clonner le dépot

``git clone https://github.com/adrianna-fzn/Vapeur.git``

- ### Installer les dépendances

``npm install``

- ### Appliquer les migrations

``npx prisma migrate deploy``

- ### Démarrer l'application

``npm run stat``

## Arborescence

<pre>
Vapeur/
├── pageScript/
│   ├── buttons.js
│   └── dropFile.js
├── prisma/
│   ├── migrations/
│   │   ├── 20251206114141_1st_migration/
│   │   │   └── migration.sql
│   │   ├── 20251206123849_ajout_highlighted_dans_le_model_game/
│   │   │   └── migration.sql
│   │   ├── 20251206145229_nom_de_l_editeur_unique/
│   │   │   └── migration.sql
│   │   ├── 20251206170123_ajout_d_un_champ_filename_dans_game/
│   │   │   └── migration.sql
│   │   ├── 20251208141002_editeur_non_obligatoire/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── schema.prisma
├── public/
│   ├── Images/
│       ├── DRAG_AND_DROP.png
│       ├── deleteButton.png
│       └── editButton.png
├── scripts/
│   ├── config_hbs.js
│   ├── model.js
│   └── test.js
├── style/
│   ├── editButtons.css
│   ├── gameDetails.css
│   ├── gameList.css
│   ├── gestionGame.css
│   └── global.css
├── views/
│   ├── editors/
│   │   ├── add.hbs
│   │   ├── detail.hbs
│   │   └── index.hbs
│   ├── games/
│   │   ├── add.hbs
│   │   ├── detail.hbs
│   │   ├── edit.hbs
│   │   └── list.hbs
│   ├── genres/
│   │   ├── detail.hbs
│   │   └── index.hbs
│   ├── partials/
│   │   ├── add_game_form.hbs
│   │   ├── editButtons.hbs
│   │   ├── form_field.hbs
│   │   ├── game_list.hbs
│   │   └── header.hbs
│   ├── 404.hbs
│   ├── index.hbs
│   └── layout.hbs
├── README.md
├── index.js
├── package-lock.json
└── package.json
  </pre>

## Crédits

Développé par [Syvlio Pelage-Maxime](https://github.com/Sylverstone), [Evan Thonnerieux](https://github.com/TheRevanZz), [Clara Alves](https://github.com/AlvesClara22) et [Adrianna Fanzone](https://github.com/adrianna-fzn)
