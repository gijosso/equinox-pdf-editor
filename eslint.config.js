import next from "eslint-config-next"
import unusedImports from "eslint-plugin-unused-imports"

const config = [
  ...next,
  {
    ignores: ["public/pdf.worker.min.mjs"],
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      curly: ["error", "all"],
      "nonblock-statement-body-position": ["error", "below"],

      // Prefer plugin-based unused handling
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
]

export default config
