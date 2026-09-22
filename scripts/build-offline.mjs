import { readFile, writeFile } from "node:fs/promises";
const files = ["engine.js", "tasks.js", "app.js"];
const chunks = [];
for (const name of files) {
  let code = await readFile(
    new URL("../" + name, import.meta.url),
    "utf8",
  );
  code = code
    .replace(/^import[\s\S]*?;\s*/gm, "")
    .replace(/export\s+(?=(?:const|function)\b)/g, "");
  chunks.push(`\n/* ===== ${name} ===== */\n` + code);
}
await writeFile(
  new URL("../game.js", import.meta.url),
  '/* Кванториум — полный код игры. Исходные модули: engine.js, tasks.js, app.js. */\n(function(){\n"use strict";\n' +
    chunks.join("\n") +
    "\n})();\n",
);
console.log("Built offline-compatible game.js");
