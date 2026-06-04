#!/usr/bin/env node
/**
 * fix-feedscreen.js
 * 
 * For files where StyleSheet.create() inside the component causes
 * "styles doesn't exist" — this happens when the component has early
 * returns BEFORE the styles declaration (e.g. if (loading) return <Spinner />)
 * 
 * Fix: move styles back to module level, replace COLORS.x with hardcoded
 * dark hex values (static styles). Dynamic colors remain as inline styles in JSX.
 */

const fs   = require("fs");
const path = require("path");

const KNOWN_DARK = {
  bg: "#0F0A1E", card: "#1A1330", border: "#2D2450",
  accent: "#9B6FD4", accentSoft: "#C4A3E8",
  text: "#EDE8F5", textMuted: "#8B7FA8",
  error: "#D4607A", success: "#4CAF8F", warning: "#D4A44C",
};

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, "utf8");

  // Only fix files where styles is INSIDE the component
  if (!/^\s+const styles = StyleSheet\.create/m.test(code)) {
    return { skipped: true, reason: "styles already at module level" };
  }

  // Find the styles block inside the component
  const insideRe = /^(\s+)(const styles = StyleSheet\.create\s*\()/m;
  const m = insideRe.exec(code);
  if (!m) return { skipped: true, reason: "could not find styles block" };

  // Find opening { of the object passed to StyleSheet.create
  let start = m.index;
  let objOpen = code.indexOf("{", m.index + m[0].length - 1);
  let depth = 0, i = objOpen;
  while (i < code.length) {
    if (code[i] === "{") depth++;
    else if (code[i] === "}") { depth--; if (depth === 0) break; }
    i++;
  }
  let blockEnd = i + 1;
  while (blockEnd < code.length && /[\s;)]/.test(code[blockEnd]) && code[blockEnd] !== "\n") blockEnd++;
  if (code[blockEnd] === "\n") blockEnd++;

  const fullBlock = code.slice(start, blockEnd);
  const indent = m[1];

  // Also get any DARK map defined in this file
  const darkMap = { ...KNOWN_DARK };
  const darkRe = /const DARK = \{([^}]+)\}/;
  const darkMatch = darkRe.exec(code);
  if (darkMatch) {
    for (const e of darkMatch[1].matchAll(/(\w+)\s*:\s*["']([^"']+)["']/g)) {
      darkMap[e[1]] = e[2];
    }
  }

  // Replace COLORS.x in the styles block with hardcoded hex
  let fixedBlock = fullBlock.replace(/COLORS\.(\w+)/g, (match, key) => {
    return darkMap[key] ? `"${darkMap[key]}"` : match;
  });

  // De-indent
  fixedBlock = fixedBlock
    .split("\n")
    .map(line => line.startsWith(indent) ? line.slice(indent.length) : line)
    .join("\n")
    .replace(/^\n+/, "");

  // Remove from inside component
  let newCode = code.slice(0, start) + code.slice(blockEnd);

  // Append at end of file
  newCode = newCode.trimEnd() + "\n\n" + fixedBlock + "\n";

  fs.writeFileSync(filePath + ".bak2", code);
  fs.writeFileSync(filePath, newCode);
  return { skipped: false };
}

// Run on all migrated files
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node fix-feedscreen.js ./src");
  process.exit(0);
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(entry)) out.push(full);
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
    if (r.skipped) { skipped++; }
    else { console.log(`  ✅  ${path.basename(f)}`); fixed++; }
  } catch(e) {
    console.error(`  ❌  ${path.basename(f)}: ${e.message}`);
  }
}
console.log(`\nFixed: ${fixed}  Skipped: ${skipped}`);