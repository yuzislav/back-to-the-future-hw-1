#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');
const LinkChecker = require('./lib/LinkChecker');
const TableFormatter = require('./lib/TableFormatter');

const args = process.argv.slice(2);

let folderPath = null;
let onlyDead = false;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--only-dead') {
    onlyDead = true;
  } else if (!args[i].startsWith('-')) {
    folderPath = args[i];
  }
}

if (!folderPath) {
  console.error('Usage: node index.js <folder-path> [--only-dead]');
  process.exit(1);
}

folderPath = path.resolve(folderPath);

if (!fs.existsSync(folderPath)) {
  console.error(`Error: Folder not found: ${folderPath}`);
  process.exit(1);
}

async function main() {
  try {
    const checker = new LinkChecker(folderPath);
    let results = await checker.checkAllLinks();

    // Filter to only dead links if flag is set
    if (onlyDead) {
      results = results.filter(r => !r.isAlive);
    }

    const formatter = new TableFormatter();
    formatter.displayResults(results);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
