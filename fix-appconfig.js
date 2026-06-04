const fs = require("fs");
let code = fs.readFileSync("app.config.js", "utf8");
code = code.replace(/\s*userInterfaceStyle:\s*["']dark["']\s*,?\n/, "");
fs.writeFileSync("app.config.js", code);
console.log("Done - removed userInterfaceStyle");