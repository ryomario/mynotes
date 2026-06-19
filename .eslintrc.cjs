const globals = require("globals");

module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  globals: globals.browser,
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "no-restricted-globals": [
      "error",
      {
        name: "chrome",
        message: "Do not access chrome APIs directly. Use BrowserService instead."
      }
    ]
  },
  overrides: [
    {
      files: [
        "src/shared/services/browser/ChromeBrowserService.ts",
        "src/shared/services/storage/ChromeApiStorageService.ts",
        "src/background/**/*.ts"
      ],
      rules: {
        "no-restricted-globals": "off"
      }
    },
    {
      files: ["src/features/notes/**/*.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["**/features/bookmarks/**", "../*/bookmarks/**"],
                message: "Notes feature is not allowed to import from Bookmarks feature."
              }
            ]
          }
        ]
      }
    },
    {
      files: ["src/features/bookmarks/**/*.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["**/features/notes/**", "../*/notes/**"],
                message: "Bookmarks feature is not allowed to import from Notes feature."
              }
            ]
          }
        ]
      }
    }
  ]
};
