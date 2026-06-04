#!/usr/bin/env node
/**
 * fix-final.js
 * Replaces every COLORS.x that appears BEFORE `export default function`
 * with the hardcoded dark hex value. This permanently fixes the
 * "COLORS doesn't exist" crash for module-level usages.
 */

const fs   = require("fs");
const path = require("path");

const DARK = {
  bg:         "#0F0A1E",
  card:       "#1A1330",
  border:     "#2D2450",
  accent:     "#9B6FD4",
  accentSoft: "#C4A3E8",
  text:       "#EDE8F5",
  textMuted:  "#8B7FA8",
  error:      "#D4607A",
  success:    "#4CAF8F",
  warning:    "#D4A44C",
  replyBg:    "#1A1330",
};

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, "utf8");

  // Find where export default function starts
  const exportMatch = /export\s+default\s+function/.exec(code);
  if (!exportMatch) return { skipped: true, reason: "no export default function" };

  const splitAt = exportMatch.index;
  const before  = code.slice(0, splitAt);
  const after   = code.slice(splitAt);

  // Check if there's any COLORS. before export default
  if (!/COLORS\.\w+/.test(before)) {
    return { skipped: true, reason: "no COLORS before export" };
  }

  // Replace COLORS.x with hardcoded hex in the module-level portion
  const fixed = before.replace(/COLORS\.(\w+)/g, (match, key) => {
    if (DARK[key]) return JSON.stringify(DARK[key]);
    console.log(`  ⚠️  unknown key COLORS.${key} in ${path.basename(filePath)}`);
    return match;
  });

  if (fixed === before) return { skipped: true, reason: "nothing to replace" };

  fs.writeFileSync(filePath, fixed + after);
  return { skipped: false };
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir)) {
    const full = path.join(dir, e);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(e)) out.push(full);
  }
}

const args = process.argv.slice(2);
if (!args.length) { console.log("Usage: node fix-final.js ./src"); process.exit(0); }

const files = [];
for (const arg of args) {
  if (fs.existsSync(arg) && fs.statSync(arg).isDirectory()) walk(arg, files);
  else if (fs.existsSync(arg)) files.push(arg);
}

let fixed = 0, skipped = 0;
for (const f of files) {
  try {
    const r = fixFile(f);
    if (r.skipped) skipped++;
    else { console.log("  ✅  " + path.basename(f)); fixed++; }
  } catch(e) {
    console.error("  ❌  " + path.basename(f) + ": " + e.message);
  }
}
console.log("\nFixed: " + fixed + "  Skipped: " + skipped);