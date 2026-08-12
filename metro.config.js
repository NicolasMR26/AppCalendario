const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Some deps (zustand's ESM build, picked via `exports.import`/`exports.module`)
// use `import.meta`, which breaks Metro's classic (non-ESM) web bundle output.
// Their "react-native" export condition happens to point at a safe CJS build,
// so including it for every platform sidesteps the issue without patching a
// dependency directly. See: https://github.com/expo/expo/issues/26160
config.resolver.unstable_conditionNames = ["require", "react-native", "browser", "default"];

module.exports = config;
