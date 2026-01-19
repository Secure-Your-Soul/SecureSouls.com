import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "dist");

// 1. NIE KASUJEMY - tylko upewniamy się, że folder istnieje
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

const items = fs.readdirSync(__dirname);

for (const item of items) {
  const fullPath = path.join(__dirname, item);

  if (
    fs.lstatSync(fullPath).isDirectory() &&
    !["dist", "node_modules"].includes(item) &&
    !item.startsWith(".")
  ) {
    console.log(`[SoulEngine] Mergowanie modułu: ${item}`);

    // Kopiujemy zawartość folderu do dist/nazwa_modułu
    fs.cpSync(fullPath, path.join(distPath, item), {
      recursive: true,
      force: true, // Nadpisuj pliki, ale filtr poniżej pilnuje czego NIE brać
      filter: (src) => {
        // ZAKAZ kopiowania plików .ts - one mają zostać tam gdzie są
        // Dopuszczamy wszystko inne (html, css, i już istniejące js)
        return !src.endsWith(".ts");
      },
    });
  }
}

console.log(
  "✅ Assety dorzucone do dist. Pliki .js od TSC powinny tam zostać.",
);
