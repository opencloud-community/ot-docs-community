#!/usr/bin/env node

/**
 * This script fetches and processes the sitemap.xml from the official OpenTalk documentation
 * to create a structured documentation map that helps avoid redundancy in the community docs.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');

// Configuration
const SITEMAP_URL = 'https://docs.opentalk.eu/sitemap.xml';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'reference');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'official-docs-map.md');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Fetch the sitemap
https.get(SITEMAP_URL, (res) => {
  let xml = '';

  res.on('data', (chunk) => {
    xml += chunk;
  });

  res.on('end', () => {
    parseString(xml, (err, result) => {
      if (err) {
        console.error('Error parsing XML:', err);
        return;
      }

      processSitemap(result);
    });
  });
}).on('error', (err) => {
  console.error('Error fetching sitemap:', err);
});

// Process the sitemap data
function processSitemap(data) {
  if (!data.urlset || !data.urlset.url) {
    console.error('Unexpected sitemap format');
    return;
  }

  // Extract URLs and normalize them
  const urls = data.urlset.url.map(url => {
    const originalUrl = url.loc[0];
    // Ensure URLs are properly formatted (lowercase https://)
    return originalUrl.replace(/^Https:\/\//i, 'https://');
  });
  
  // Organize by documentation type
  const userDocs = urls.filter(url => url.includes('/user/'));
  const adminDocs = urls.filter(url => url.includes('/admin/'));
  const developerDocs = urls.filter(url => url.includes('/developer/'));
  const releasesDocs = urls.filter(url => url.includes('/releases/'));
  const architectureDocs = urls.filter(url => url.includes('/architecture/'));

  // Sub-categorize admin docs based on the sidebar structure
  const adminControllerDocs = adminDocs.filter(url => url.includes('/admin/controller/'));
  const adminControllerCoreDocs = adminControllerDocs.filter(url => url.includes('/admin/controller/core/'));
  const adminControllerAdvancedDocs = adminControllerDocs.filter(url => url.includes('/admin/controller/advanced/'));
  const adminControllerCliDocs = adminControllerDocs.filter(url => url.includes('/admin/controller/cli/'));
  const adminControllerMigrationDocs = adminControllerDocs.filter(url => url.includes('/admin/controller/migration/'));
  const adminControllerUnderTheHoodDocs = adminControllerDocs.filter(url => url.includes('/admin/controller/under_the_hood/'));

  // Other admin components
  const adminObeliskDocs = adminDocs.filter(url => url.includes('/admin/obelisk/'));
  const adminRecorderDocs = adminDocs.filter(url => url.includes('/admin/recorder/'));
  const adminSmtpDocs = adminDocs.filter(url => url.includes('/admin/smtp-mailer/'));

  // Sub-categorize user docs based on the sidebar structure
  const userFaqDocs = userDocs.filter(url => url.includes('/user/FAQ/'));
  const userManualDocs = userDocs.filter(url => url.includes('/user/Handbuch/'));
  const userTechnicalDocs = userDocs.filter(url => url.includes('/user/Technische'));
  const userTroubleshootingDocs = userDocs.filter(url => url.includes('/user/Troubleshooting/'));

  // Sub-categorize developer docs based on the sidebar structure
  const developerControllerDocs = developerDocs.filter(url => url.includes('/developer/controller/'));
  const developerControllerSignalingDocs = developerControllerDocs.filter(url => url.includes('/developer/controller/signaling/'));

  // Other docs that don't fit these categories
  const otherDocs = urls.filter(url =>
    !url.includes('/user/') &&
    !url.includes('/admin/') &&
    !url.includes('/developer/') &&
    !url.includes('/releases/') &&
    !url.includes('/architecture/')
  );
  
  // Format as Markdown
  const markdown = `---
sidebar_position: 1
title: Official Documentation Map
description: Map of the official OpenTalk documentation (auto-generated)
---

# Official OpenTalk Documentation Map

This is an automatically generated map of the official OpenTalk documentation, created from the sitemap at [docs.opentalk.eu](https://docs.opentalk.eu/).

Last updated: ${new Date().toISOString().split('T')[0]}

## User Documentation

### User Handbook
${formatUrlList(userManualDocs)}

### FAQ
${formatUrlList(userFaqDocs)}

### Technical Documentation for Users
${formatUrlList(userTechnicalDocs)}

### Troubleshooting
${formatUrlList(userTroubleshootingDocs)}

### All User Documentation
${formatUrlList(userDocs)}

## Admin Documentation

### Controller

#### Core Configuration
${formatUrlList(adminControllerCoreDocs)}

#### Advanced Configuration
${formatUrlList(adminControllerAdvancedDocs)}

#### Command-Line Usage
${formatUrlList(adminControllerCliDocs)}

#### Migration Guide
${formatUrlList(adminControllerMigrationDocs)}

#### Under the Hood
${formatUrlList(adminControllerUnderTheHoodDocs)}

#### All Controller Documentation
${formatUrlList(adminControllerDocs)}

### Obelisk
${formatUrlList(adminObeliskDocs)}

### Recorder
${formatUrlList(adminRecorderDocs)}

### SMTP Mailer
${formatUrlList(adminSmtpDocs)}

### All Admin Documentation
${formatUrlList(adminDocs)}

## Developer Documentation

### Controller
${formatUrlList(developerControllerDocs)}

#### Signaling
${formatUrlList(developerControllerSignalingDocs)}

### All Developer Documentation
${formatUrlList(developerDocs)}

## Releases Documentation
${formatUrlList(releasesDocs)}

## Architecture Documentation
${formatUrlList(architectureDocs)}

## Other Documentation
${formatUrlList(otherDocs)}

## How to Use This Map

When writing community documentation:

1. **Check for existing content**: Use this map to check if a topic is already covered in the official docs
2. **Link to official docs**: Reference the official documentation when appropriate
3. **Focus on unique value**: The community docs should complement rather than duplicate official content
4. **Update regularly**: This map is generated from the current sitemap and will be updated periodically

:::tip
To avoid redundancy, always check if a topic is covered in the official docs before adding it here.
When a topic is already covered, link to the official docs and focus on adding deployment-specific
or practical operational guidance that complements the official content.
:::
`;

  // Fix URL formatting issues (Https:// -> https://)
  const fixedMarkdown = markdown.replace(/\[Https:\/\//g, '[https://').replace(/\]\(Https:\/\//g, '](https://');

  // Save to file
  fs.writeFileSync(OUTPUT_FILE, fixedMarkdown);
  console.log(`Generated documentation map at ${OUTPUT_FILE}`);
}

// Format a list of URLs as a Markdown list
function formatUrlList(urls) {
  if (urls.length === 0) {
    return '_No documents found in this category._';
  }

  // Sort URLs to group similar paths together
  urls.sort();

  // Format as markdown list with clean titles
  return urls.map(url => {
    // Fix URL capitalization and encoding
    const cleanUrl = url.toLowerCase().replace(/%20/g, ' ').replace(/%C3%A4/g, 'ä').replace(/%C3%B6/g, 'ö').replace(/%C3%BC/g, 'ü');

    // Extract title from URL path
    let title = cleanUrl.split('/').pop() || cleanUrl;

    // Clean up the title
    title = title.replace(/-/g, ' ').replace('.html', '');
    title = title.split('/').pop() || title;

    // Capitalize first letter of each word
    title = title.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Special case for empty title (index pages)
    if (!title || title === '' || title === '/') {
      // Extract section from URL
      const parts = cleanUrl.split('/');
      const section = parts[parts.length - 2] || 'Index';
      title = `${section.charAt(0).toUpperCase() + section.slice(1)} (Index)`;
    }

    // Handle special cases for better display
    if (title === 'Smtp Mailer') {
      title = 'SMTP Mailer';
    } else if (title === 'Api') {
      title = 'API';
    } else if (title === 'Faq') {
      title = 'FAQ';
    } else if (title === 'Ucs') {
      title = 'UCS';
    }

    return `- [${title}](${url.toLowerCase()})`;
  }).join('\n');
}