// eslint-plugin-drizzle 0.2.3は型定義を同梱していないため、設定で使う公開APIだけを定義する。
declare module "eslint-plugin-drizzle" {
  import type { ESLint, Rule } from "eslint";

  const plugin: {
    meta: ESLint.Plugin["meta"];
    rules: Record<string, Rule.RuleModule>;
  };
  export default plugin;
}
