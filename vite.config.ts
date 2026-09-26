// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// The dev devtools plugin injects `data-tsd-source` attributes into every JSX element.
// react-three-fiber treats dashed prop names as nested paths and throws
// `R3F: Cannot set "data-tsd-source"` for three.js elements, blanking the screen.
// Strip the injected attribute from any module that uses react-three-fiber.
function stripTsdSourceFromR3F(): Plugin {
  return {
    name: "strip-tsd-source-from-r3f",
    enforce: "post",
    apply: "serve",
    transform(code, id) {
      if (id.includes("node_modules")) return null;
      if (!code.includes("data-tsd-source")) return null;
      if (!/@react-three\/(fiber|drei)|from ["']three["']/.test(code)) return null;
      const stripped = code
        .replace(/["']data-tsd-source["']\s*:\s*(["'])(?:\\.|(?!\1)[^\\])*\1\s*,?/g, "")
        .replace(/\sdata-tsd-source\s*=\s*(["'])(?:\\.|(?!\1)[^\\])*\1/g, "");
      return stripped === code ? null : { code: stripped, map: null };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripTsdSourceFromR3F()],
  },
});
