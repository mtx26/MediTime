const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

// getDefaultConfig ne configure pas le monorepo tout seul : par défaut Metro ne
// surveille que projectRoot. Sans watchFolders, les modifications dans
// packages/* (@meditime/types, utils, constants, config, i18n) ne déclenchent
// pas de rechargement, et Metro peut échouer à résoudre des fichiers situés
// hors du dossier de l'app.
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Surveiller tout le monorepo (packages/* sont des symlinks vers ../../packages).
config.watchFolders = [workspaceRoot];

// 2. Chercher les modules dans l'app puis à la racine (npm workspaces hoiste
//    la majorité des dépendances vers la racine).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Ne pas remonter la hiérarchie au-delà des chemins ci-dessus : évite qu'une
//    dépendance soit chargée en double depuis deux node_modules différents.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
