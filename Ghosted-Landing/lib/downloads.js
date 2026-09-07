const fs = require('fs');
const path = require('path');

// Single source of truth for the shipped zip filenames. Update ONLY here when a
// new build is zipped in. success.html, order.js, api/download.js and the
// license-email sender all read from this instead of hardcoding the name.
const DOWNLOADS = {
  // OJO al cambiar de version: estos nombres tienen que existir en
  // api/_private/ o la descarga falla despues de haber cobrado.
  // Pro sale ofuscado (tools/empaquetar-pro.js); Plus no, porque va tal cual
  // a la Chrome Web Store cuando se pueda enviar.
  pro: { file: 'Ghoosted-Pro-v1.58.0.zip', name: 'Ghoosted Pro' },
  plus: { file: 'Ghoosted-Plus-v1.58.0.zip', name: 'Ghoosted Plus' },
};

// The zips live under api/ ON PURPOSE: Vercel serves the repo root statically
// but treats api/ as the functions dir, so nothing in here is reachable by URL.
// They used to sit in /downloads, where anyone with the link could take them —
// the filename hash was the only thing standing between a paid product and the
// open internet. api/download.js is now the only way out, and it checks the
// licence first. vercel.json also redirects the old /downloads/* links away.
const PRIVATE_DIR = 'api/_private';

function downloadFor(plan) {
  return DOWNLOADS[plan] || DOWNLOADS.pro;
}

// Resolved at call time against a couple of roots: which one is right depends on
// how the platform lays the bundle out, and guessing wrong means every download
// 500s. Returns null if the file genuinely isn't there, so the caller can log it.
function filePath(plan) {
  const file = downloadFor(plan).file;
  const candidates = [
    path.join(process.cwd(), PRIVATE_DIR, file),
    path.join(__dirname, '..', PRIVATE_DIR, file),
    path.join('/var/task', PRIVATE_DIR, file),
  ];
  for (const candidate of candidates) {
    try { if (fs.existsSync(candidate)) return candidate; } catch (e) { /* keep trying */ }
  }
  return null;
}

module.exports = { DOWNLOADS, PRIVATE_DIR, downloadFor, filePath };
