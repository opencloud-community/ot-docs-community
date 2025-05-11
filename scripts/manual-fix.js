#!/usr/bin/env node

/**
 * This script manually fixes the documentation map file to correct URL formatting issues.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'reference');
const FILE_PATH = path.join(OUTPUT_DIR, 'official-docs-map.md');

// Read the current file
try {
  const content = fs.readFileSync(FILE_PATH, 'utf8');
  
  // Replace all occurrences of 'Https://' with 'https://'
  const fixedContent = content.replace(/\[Https:\/\//g, '[https://').replace(/\]\(Https:\/\//g, '](https://');
  
  // Write the fixed content back to the file
  fs.writeFileSync(FILE_PATH, fixedContent);
  
  console.log(`Fixed URL formatting issues in ${FILE_PATH}`);
} catch (error) {
  console.error('Error fixing the file:', error);
}