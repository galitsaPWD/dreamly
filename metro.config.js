const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable support for modern package exports (required for @huggingface/inference and others)
config.resolver.unstable_enablePackageExports = true;

const finalConfig = withNativeWind(config, { 
  input: "./global.css",
});

// Normalize paths safely (handles Windows/Linux differences)
if (finalConfig.transformerPath) {
  finalConfig.transformerPath = finalConfig.transformerPath.replace(/\\/g, "/");
}
if (finalConfig.transformer?.nativewind) {
  if (finalConfig.transformer.nativewind.input) {
    finalConfig.transformer.nativewind.input = finalConfig.transformer.nativewind.input.replace(/\\/g, "/");
  }
  if (finalConfig.transformer.nativewind.output) {
    finalConfig.transformer.nativewind.output = finalConfig.transformer.nativewind.output.replace(/\\/g, "/");
  }
}

module.exports = finalConfig;
