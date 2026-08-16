#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');
const LinkChecker = require('./lib/LinkChecker');
const TableFormatter = require('./lib/TableFormatter');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node index.js <folder-path>');
  process.exit(1);
}

const folderPath = path.resolve(args[0]);

if (!fs.existsSync(folderPath)) {
  console.error(`Error: Folder not found: ${folderPath}`);
  process.exit(1);
}

async function main() {
  try {
    const checker = new LinkChecker(folderPath);
    const results = await checker.checkAllLinks();
    const formatter = new TableFormatter();
    formatter.displayResults(results);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
