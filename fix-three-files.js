#!/usr/bin/env node
const fs   = require("fs");
const path = require("path");

const DARK = {
  bg: "#0F0A1E", card: "#1A1330", border: "#2D2450",
  accent: "#9B6FD4", accentSoft: "#C4A3E8",
  text: "#EDE8F5", textMuted: "#8B7FA8",
  error: "#D4607A", success: "#4CAF8F", warning: "#D4A44C",
};

const files = [
  "./src/components/UserProfileCard.js",
  "./src/screens/AddAccountScreen.js",
  "./src/screens/SettingsScreen.js",
];

for (const f of files) {
  if (!fs.existsSync(f)) { console.log("NOT FOUND: " + f); continue; }

  let code = fs.readFileSync(f, "utf8");

  const hookIdx = code.indexOf("colors: COLORS");
  if (hookIdx === -1) { console.log("no hook in " + path.basename(f)); continue; }

  const before = code.slice(0, hookIdx);
  const after  = code.slice(hookIdx);

  const fixed = before.replace(/COLORS\.(\w+)/g, (match, key) => {
    return DARK[key] ? JSON.stringify(DARK[key]) : match;
  });

  fs.writeFileSync(f + ".bak3", code);
  fs.writeFileSync(f, fixed + after);
  console.log("Fixed: " + path.basename(f));
}