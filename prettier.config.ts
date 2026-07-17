import type { Config } from "prettier";

const config: Config = {
  printWidth: 100,
  objectWrap: "collapse",
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
