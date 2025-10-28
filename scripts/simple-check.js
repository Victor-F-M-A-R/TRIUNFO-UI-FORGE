// scripts/simple-check.js
const { execSync } = require("child_process");
const fs = require("fs");

console.log("Verificando erros...\n");

try {
  // Tenta compilar
  const output = execSync("npx next build", {
    encoding: "utf-8",
    stdio: "pipe",
  }).toString();

  console.log(output);
  fs.writeFileSync("build-output.txt", output);
} catch (error) {
  const errorOutput = error.stdout + "\n" + error.stderr;
  console.log(errorOutput);
  fs.writeFileSync("build-errors.txt", errorOutput);
  console.log("\nErros salvos em: build-errors.txt");
}
