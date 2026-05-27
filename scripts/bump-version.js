#!/usr/bin/env node
// Bumps the cache-version in index.html AND keeps version.json in sync.
// Usage: node scripts/bump-version.js <new-version>
// e.g.   node scripts/bump-version.js foo-bar-3

const fs = require("fs");
const path = require("path");

const newVer = process.argv[2];
if (!newVer) {
  console.error("Usage: node scripts/bump-version.js <new-version>");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "index.html");
const versionPath = path.join(root, "version.json");

let html = fs.readFileSync(indexPath, "utf8");
const re = /v=([a-zA-Z0-9_-]+)/g;
const current = (html.match(re) || []).map((s) => s.replace("v=", ""));
const oldVer = current[0];
if (!oldVer) { console.error("No ?v= found in index.html"); process.exit(1); }
html = html.replaceAll(`v=${oldVer}`, `v=${newVer}`);
fs.writeFileSync(indexPath, html);
fs.writeFileSync(versionPath, JSON.stringify({ version: newVer }) + "\n");
console.log(`Bumped ${oldVer} → ${newVer} (index.html + version.json)`);
