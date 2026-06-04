#!/usr/bin/env node
/**
 * fix-early-colors.js
 * 
 * Fixes files where COLORS.x is used before the useTheme() hook is called.
 * This happens when COLORS is used in module-level constants like REPORT_REASONS,
 * TAB_CONFIG arrays etc. that are defined before the component.
 * 
 * Fix: replace COLORS.x in those early module-level usages with the actual
 * hardcoded dark hex values, since they're static config arrays anyway.
 */

const fs   = require("fs");
const path = require("path");

const DARK = {
  bg: "#0F0A1E", card: "#1A1330", border: "#2D2450",
  accent: "#9B6FD4", accentSoft: "#C4A3E8",
  text: "#EDE8F5", textMuted: "#8B7FA8",
  error: "#D4607A", success: "#4CAF8F", warning: "#D4A44C",
  replyBg: "#1A1330",
};

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, "utf8");

  // Find where the hook is declared
  const hookIdx = code.indexOf("colors: COLORS");
  
  // Find export default function — everything before it is module level
  const exportMatch = /export\s+default\s+function/.exec(code);
  const moduleLevelEnd = exportMatch ? exportMatch.index : (hookIdx > 0 ? hookIdx : code.length);

  // Check if there's any COLORS. before the hook/component
  const beforeHook = code.slice(0, moduleLevelEnd);
  if (!/COLORS\.\w+/.test(beforeHook)) {
    return { skipped: true, reason: "no COLORS before hook" };
  }

  // Also get DARK values from this file if present
  const localDark = { ...DARK };
  const darkMatch = /const DARK = \{([^}]+)\}/.exec(code);
  if (darkMatch) {
    for (const m of darkMatch[1].matchAll(/(\w+)\s*:\s*["']([^"']+)["']/g)) {
      localDark[m[1]] = m[2];
    }
  }

  // Replace COLORS.x in the module-level portion only
  const fixed = beforeHook.replace(/COLORS\.(\w+)/g, (match, key) => {
    if (localDark[key]) return `"${localDark[key]}"`;
    return match;
  });

  const newCode = fixed + code.slice(moduleLevelEnd);

  if (newCode === code) return { skipped: true, reason: "nothing changed" };

  fs.writeFileSync(filePath + ".bak3", code);
  fs.writeFileSync(filePath, newCode);
  return { skipped: false };
}

const args = process.argv.slice(2);
if (!args.length) { console.log("Usage: node fix-early-colors.js ./src"); process.exit(0); }

function walk(dir, out) {
  for (const e of fs.readdirSync(dir)) {
    const full = path.join(dir, e);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(e)) out.push(full);
  }
}

const files = [];
for (const arg of args) {
  if (fs.statSync(arg).isDirectory()) walk(arg, files);
  else files.push(arg);
}

let fixed = 0, skipped = 0;
for (const f of files) {
  try {
    const r = fixFile(f);
    if (r.skipped) skipped++;
    else { console.log(`  ✅  ${path.basename(f)}`); fixed++; }
  } catch(e) {
    console.error(`  ❌  ${path.basename(f)}: ${e.message}`);
  }
}
console.log(`\nFixed: ${fixed}  Skipped: ${skipped}`);