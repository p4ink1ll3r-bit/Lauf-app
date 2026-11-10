// Legt eine Kopie der Laufdaten in app/data ab, damit die iPhone-/Android-App auch ohne Netz Läufe zeigt.
// Die App lädt beim Start immer zuerst die aktuellen Daten von der Website.
import { mkdirSync, copyFileSync } from "node:fs";
mkdirSync("app/data", { recursive: true });
for (const f of ["races.json", "plz.json"]) copyFileSync(`data/${f}`, `app/data/${f}`);
console.log("Laufdaten nach app/data kopiert");
