const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

// Workaround: Metro's FallbackWatcher crashes with ENOENT on platform-specific
// optional deps (e.g. @esbuild/android-x64) that aren't installed on this OS.
// Create stub directories so fs.watch doesn't throw.
const esbuildDir = path.resolve(monorepoRoot, "node_modules", "@esbuild");
if (fs.existsSync(esbuildDir)) {
  for (const entry of fs.readdirSync(esbuildDir)) {
    const fullPath = path.join(esbuildDir, entry);
    if (!fs.existsSync(fullPath)) {
      try {
        try { fs.unlinkSync(fullPath); } catch {}
        fs.mkdirSync(fullPath, { recursive: true });
      } catch {}
    }
  }
}

const config = getDefaultConfig(projectRoot);

// Only watch shared packages (not the entire monorepo root, which includes
// platform-specific esbuild binaries that may not exist on this OS).
const packagesDir = path.resolve(monorepoRoot, "packages");
const packageFolders = fs.readdirSync(packagesDir).map((p) => path.join(packagesDir, p));
config.watchFolders = packageFolders;

// Block esbuild platform binaries from Metro's resolver and watcher
config.resolver.blockList = [/node_modules\/@esbuild\/.*/];

// Resolve modules from both the project and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
