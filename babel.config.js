module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@domain": "./src/domain",
            "@data": "./src/data",
            "@presentation": "./src/presentation",
            "@": "./src",
          },
        },
      ],
      // Reanimated plugin must always be listed last.
      "react-native-reanimated/plugin",
    ],
  };
};
