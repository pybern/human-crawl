import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Imperative three.js / R3F code mutates THREE objects (Vector3, Matrix4,
    // quaternions, instanced meshes) every frame — that's the correct, intended
    // pattern (R3F itself does it). The new react-hooks/immutability rule is
    // incompatible with this, so disable it for the WebGL layer.
    files: [
      "components/canvas/**/*.{ts,tsx}",
      "components/sections/**/*.{ts,tsx}",
      "lib/three/**/*.{ts,tsx}",
    ],
    rules: {
      "react-hooks/immutability": "off",
      // Generative 3D seeds content with Math.random() at init (in useMemo /
      // lazy state) — intentional, deterministic enough for visuals.
      "react-hooks/purity": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
