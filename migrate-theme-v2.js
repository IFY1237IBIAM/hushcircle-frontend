#!/usr/bin/env node
/**
 * migrate-theme-v2.js
 *
 * Migrates hardcoded COLORS constants to useTheme() across all React Native files.
 *
 * Handles the special case where COLORS is used at module level (e.g. SVG icon
 * default props) by injecting a DARK fallback constant for those references,
 * while still wiring up useTheme() inside the component so runtime colors respond
 * to the theme toggle.
 *
 * Usage:
 *   node migrate-theme-v2.js ./screens ./components
 */

const fs   = require("fs");
const path = require("path");

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAllJsFiles(dirs) {
  const results = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️  Directory not found, skipping: ${dir}`);
      continue;
    }
    walk(dir, results);
  }
  return results;
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry)) out.push(full);
  }
}

// ── Find the COLORS block and extract its content ─────────────────────────────

function findColorsBlock(code) {
  const startRe = /const\s+COLORS\s*=\s*\{/;
  const match = startRe.exec(code);
  if (!match) return null;

  const openBrace = match.index + match[0].length - 1;
  let depth = 0, i = openBrace;
  while (i < code.length) {
    if (code[i] === "{") depth++;
    else if (code[i] === "}") { depth--; if (depth === 0) break; }
    i++;
  }

  let end = i + 1;
  while (end < code.length && /[;\s]/.test(code[end]) && code[end] !== "\n") end++;
  if (code[end] === "\n") end++;

  const lineStart = code.lastIndexOf("\n", match.index) + 1;

  return {
    start: lineStart,
    end,
    fullBlock: code.slice(lineStart, end),
    innerContent: code.slice(openBrace + 1, i), // everything inside { }
  };
}

// ── Parse key:value pairs from the COLORS block ───────────────────────────────

function parseColorValues(innerContent) {
  const map = {};
  const re = /(\w+)\s*:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(innerContent)) !== null) {
    map[m[1]] = m[2];
  }
  return map;
}

// ── Detect whether COLORS is used OUTSIDE the default export component ────────
// i.e. in module-level const declarations (like SVG icon default props)

function hasModuleLevelColorsUsage(code) {
  // Find where the default export component starts
  const exportMatch = /export\s+default\s+function/.exec(code);
  if (!exportMatch) return false;
  const beforeExport = code.slice(0, exportMatch.index);
  // Check if COLORS.anything appears before the export
  return /COLORS\.\w+/.test(beforeExport);
}

// ── Remove the COLORS block ───────────────────────────────────────────────────

function removeColorsBlock(code, blockInfo) {
  return code.slice(0, blockInfo.start) + code.slice(blockInfo.end);
}

// ── Build the DARK fallback constant ─────────────────────────────────────────
// Only includes keys that are actually used at module level

function buildDarkFallback(code, colorValues) {
  // Find default export position to know what's "module level"
  const exportMatch = /export\s+default\s+function/.exec(code);
  const beforeExport = exportMatch ? code.slice(0, exportMatch.index) : code;

  const usedKeys = Object.keys(colorValues).filter(key =>
    new RegExp(`COLORS\\.${key}\\b`).test(beforeExport)
  );

  if (usedKeys.length === 0) return null;

  const entries = usedKeys.map(k => `  ${k}: "${colorValues[k]}",`).join("\n");
  return `// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)\nconst DARK = {\n${entries}\n};\n`;
}

// ── Replace module-level COLORS.x with DARK.x ────────────────────────────────

function replaceModuleLevelColors(code, colorValues) {
  const exportMatch = /export\s+default\s+function/.exec(code);
  if (!exportMatch) return code;

  const before = code.slice(0, exportMatch.index);
  const after  = code.slice(exportMatch.index);

  const keys = Object.keys(colorValues);
  let newBefore = before;
  for (const key of keys) {
    newBefore = newBefore.replace(new RegExp(`COLORS\\.${key}\\b`, "g"), `DARK.${key}`);
  }

  return newBefore + after;
}

// ── Ensure useTheme is imported ───────────────────────────────────────────────

function ensureUseThemeImport(code, filePath) {
  if (/import\s+.*useTheme.*from/.test(code)) {
    // Already imported — make sure useTheme is in the destructure
    code = code.replace(
      /import\s+\{([^}]+)\}\s+from\s+(['"])([^'"]*ThemeContext[^'"]*)\2/,
      (full, imports, q, src) => {
        if (/\buseTheme\b/.test(imports)) return full;
        return `import {${imports.trimEnd()}, useTheme } from ${q}${src}${q}`;
      }
    );
    return code;
  }

  const rel = guessThemeContextPath(filePath);
  const importLine = `import { useTheme } from "${rel}";\n`;

  // Walk all imports including multi-line ones to find the true end of the import block
  let lastImportEnd = 0;
  const importStartRe = /^import\s+/gm;
  let im;
  while ((im = importStartRe.exec(code)) !== null) {
    let i = im.index, depth = 0, inStr = false, strCh = "";
    while (i < code.length) {
      const ch = code[i];
      if (inStr) {
        if (ch === strCh && code[i-1] !== "\\") inStr = false;
      } else {
        if (ch === '"' || ch === "'") { inStr = true; strCh = ch; }
        else if (ch === "{") depth++;
        else if (ch === "}") depth--;
        else if (ch === ";" && depth === 0) {
          lastImportEnd = i + 1;
          if (code[lastImportEnd] === "\n") lastImportEnd++;
          break;
        }
      }
      i++;
    }
  }

  if (lastImportEnd > 0) {
    return code.slice(0, lastImportEnd) + importLine + code.slice(lastImportEnd);
  }
  return importLine + code;
}

function guessThemeContextPath(filePath) {
  let dir = path.dirname(filePath);
  for (let d = 0; d < 5; d++) {
    const candidate = path.join(dir, "context", "ThemeContext");
    for (const ext of [".js", ".jsx", ".ts", ".tsx", ""]) {
      if (fs.existsSync(candidate + ext)) {
        let rel = path.relative(path.dirname(filePath), candidate);
        if (!rel.startsWith(".")) rel = "./" + rel;
        return rel.replace(/\\/g, "/");
      }
    }
    dir = path.dirname(dir);
  }
  return "../context/ThemeContext";
}

// ── Inject useTheme call inside the component ─────────────────────────────────
// Merges into existing useTheme() if present, otherwise adds a new line

function injectUseThemeCall(code) {
  if (/const\s*\{[^}]*colors\s*:\s*COLORS[^}]*\}\s*=\s*useTheme\s*\(\)/.test(code)) {
    return code; // already done
  }

  // Existing useTheme destructure inside the component?
  const existingUseTheme = /const\s*\{([^}]+)\}\s*=\s*useTheme\s*\(\)\s*;/.exec(code);
  if (existingUseTheme) {
    const fullMatch = existingUseTheme[0];
    const inner     = existingUseTheme[1];
    return code.replace(fullMatch, fullMatch.replace(inner, inner.trimEnd() + ", colors: COLORS"));
  }

  // No existing useTheme — add fresh line after component opens
  const fnMatch = /export\s+default\s+function\s*\w*\s*\([^)]*\)\s*\{/.exec(code);
  if (!fnMatch) return code;

  const openBrace = code.indexOf("{", fnMatch.index + fnMatch[0].length - 1);
  return code.slice(0, openBrace + 1) +
    "\n  const { colors: COLORS } = useTheme();" +
    code.slice(openBrace + 1);
}

// ── Move StyleSheet.create() inside the component ────────────────────────────

function moveStyleSheetInside(code) {
  const ssRe = /^const\s+styles\s*=\s*StyleSheet\.create\s*\(\s*\{/m;
  const ssMatch = ssRe.exec(code);
  if (!ssMatch) return code;

  // Check it's at module level (depth 0)
  const before = code.slice(0, ssMatch.index);
  let depth = 0;
  for (const ch of before) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  if (depth > 0) return code; // already inside a function

  // Find the full block
  const innerBracePos = code.indexOf("{", ssMatch.index + ssMatch[0].length - 1);
  let d = 0, i = innerBracePos;
  while (i < code.length) {
    if (code[i] === "{") d++;
    else if (code[i] === "}") { d--; if (d === 0) break; }
    i++;
  }

  let blockEnd = i + 1;
  while (blockEnd < code.length && /[\s;)]/.test(code[blockEnd]) && code[blockEnd] !== "\n") blockEnd++;
  if (code[blockEnd] === "\n") blockEnd++;

  const stylesBlock = code.slice(ssMatch.index, blockEnd).trimEnd();
  const lineStart   = code.lastIndexOf("\n", ssMatch.index) + 1;
  code = code.slice(0, lineStart) + code.slice(blockEnd);

  // Find `return` inside the component to insert before
  const returnMatch = /\n(\s*)return\s*[\(<]/.exec(code);
  if (!returnMatch) return code;

  const insertAt = returnMatch.index + 1;
  const indent   = returnMatch[1] || "  ";

  const reindented = stylesBlock
    .split("\n")
    .map(line => line.trim() === "" ? "" : indent + line.trimStart())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return code.slice(0, insertAt) + reindented + "\n\n" + code.slice(insertAt);
}

// ── Main transform ────────────────────────────────────────────────────────────

function migrate(filePath) {
  const original = fs.readFileSync(filePath, "utf8");

  if (!/const\s+COLORS\s*=\s*\{/.test(original)) {
    return { skipped: true, reason: "no COLORS constant found" };
  }
  if (!/export\s+default\s+function|export\s+default\s+class/.test(original)) {
    return { skipped: true, reason: "no default export component found" };
  }

  let code = original;

  // 1. Find and parse the COLORS block
  const blockInfo = findColorsBlock(code);
  if (!blockInfo) return { skipped: true, reason: "could not parse COLORS block" };

  const colorValues = parseColorValues(blockInfo.innerContent);

  // 2. Check for module-level COLORS usage (e.g. SVG icon default props)
  const hasModuleLevel = hasModuleLevelColorsUsage(code);

  if (hasModuleLevel) {
    // a. Replace module-level COLORS.x with DARK.x BEFORE removing the block
    code = replaceModuleLevelColors(code, colorValues);
    // b. Remove the COLORS block (re-find it since offsets may have shifted slightly)
    const block2 = findColorsBlock(code);
    if (block2) code = removeColorsBlock(code, block2);
    // c. Inject DARK fallback constant where COLORS used to be
    const darkFallback = buildDarkFallback(original, colorValues); // use original to detect used keys
    if (darkFallback) {
      // Insert at the position where COLORS block was
      const insertPos = block2 ? block2.start : blockInfo.start;
      // After removal the insert pos is the same start
      // Find a good anchor: after the last import
      const lastImport = [...code.matchAll(/^import\s+.+$/gm)].pop();
      const anchorPos  = lastImport ? lastImport.index + lastImport[0].length + 1 : 0;
      code = code.slice(0, anchorPos) + "\n" + darkFallback + code.slice(anchorPos);
    }
  } else {
    // Simple case: just remove the block
    code = removeColorsBlock(code, blockInfo);
  }

  // 3. Ensure useTheme is imported
  code = ensureUseThemeImport(code, filePath);

  // 4. Inject `colors: COLORS` into useTheme() inside the component
  code = injectUseThemeCall(code);

  // 5. Move StyleSheet.create() inside the component
  code = moveStyleSheetInside(code);

  if (code === original) return { skipped: true, reason: "no changes produced" };

  // Backup + write
  fs.writeFileSync(filePath + ".bak", original, "utf8");
  fs.writeFileSync(filePath, code, "utf8");

  return { skipped: false, hadModuleLevel: hasModuleLevel };
}

// ── Entry point ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage:
  node migrate-theme-v2.js <dir1> [dir2] ...

Examples:
  node migrate-theme-v2.js ./screens ./components
  node migrate-theme-v2.js ./src/screens ./src/components
`);
  process.exit(0);
}

const files = getAllJsFiles(args);
console.log(`\n🔍  Found ${files.length} JS/JSX files\n`);

let migrated = 0, skipped = 0, errors = 0;

for (const file of files) {
  try {
    const result = migrate(file);
    if (result.skipped) {
      console.log(`  ⏭   ${path.basename(file)}  — ${result.reason}`);
      skipped++;
    } else {
      const tag = result.hadModuleLevel ? " (+ DARK fallback for module-level icons)" : "";
      console.log(`  ✅  ${path.basename(file)}${tag}`);
      migrated++;
    }
  } catch (err) {
    console.error(`  ❌  ${path.basename(file)}  — ERROR: ${err.message}`);
    errors++;
  }
}

console.log(`
─────────────────────────────────────
  ✅  Migrated : ${migrated}
  ⏭   Skipped  : ${skipped}
  ❌  Errors   : ${errors}
─────────────────────────────────────

Next steps:
  1. Run: npx expo start  and check for red screens
  2. Toggle light/dark in Settings — all screens should respond
  3. Restore any broken file:  cp FileName.js.bak FileName.js
  4. Clean up backups when happy:
       Windows:  Get-ChildItem -Recurse -Filter "*.bak" | Remove-Item
       Mac/Linux: find . -name "*.bak" -delete
`);