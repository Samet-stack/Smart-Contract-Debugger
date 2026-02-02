import { execSync } from "node:child_process";
import { platform, arch } from "node:os";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const platformName = platform();
const archName = arch();

if (platformName !== "linux") {
  process.exit(0);
}

let pkgName = null;
if (archName === "x64") {
  pkgName = "@rollup/rollup-linux-x64-gnu";
} else if (archName === "arm64") {
  pkgName = "@rollup/rollup-linux-arm64-gnu";
}

if (!pkgName) {
  process.exit(0);
}

let rollupVersion = null;
try {
  rollupVersion = require("rollup/package.json").version;
} catch {
  process.exit(0);
}

try {
  require.resolve(`${pkgName}/package.json`);
  process.exit(0);
} catch {
  // Not installed yet; install without touching lockfile.
}

execSync(`npm install --no-save --no-package-lock ${pkgName}@${rollupVersion}`, {
  stdio: "inherit",
});
