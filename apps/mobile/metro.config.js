const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Block esbuild platform binaries from Metro's watcher (they are optional
// native binaries installed by the web app's Vite and may not exist on this OS).
config.resolver.blockList = [/node_modules\/@esbuild\/.*/];

module.exports = config;
