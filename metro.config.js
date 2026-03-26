const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable support for modern package exports (required for @huggingface/inference and others)
config.resolver.unstable_enablePackageExports = true;

const finalConfig = withNativeWind(config, { 
  input: "./global.css",
});

module.exports = finalConfig;
