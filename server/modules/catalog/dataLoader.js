/**
 * Catalog Data Loader
 * Loads multi-vertical product and category datasets safely from src/data
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const logger = require('../../shared/logging/logger');

function loadEsmDataset(relativeFilePath, exportName) {
  const fullPath = path.resolve(process.cwd(), relativeFilePath);
  try {
    if (!fs.existsSync(fullPath)) {
      logger.warn(`[DataLoader] File not found: ${fullPath}`);
      return exportName.endsWith('s') ? [] : {};
    }

    const code = fs.readFileSync(fullPath, 'utf-8');
    // Transform `export const xyz =` -> `const xyz =; exports.xyz = xyz;`
    const transformed = code
      .replace(/export\s+const\s+([a-zA-Z0-9_]+)\s*=/g, 'const $1 =; exports.$1 = $1; const __dummy_$1 =')
      .replace(/export\s+default\s+/g, 'exports.default = ');

    // Fallback safe evaluation sandbox
    const sandbox = { exports: {} };
    const scriptCode = code
      .replace(/export\s+const\s+/g, 'var ')
      .replace(/export\s+default\s+/g, 'var defaultExport = ');

    vm.createContext(sandbox);
    vm.runInContext(scriptCode, sandbox);

    return sandbox[exportName] || sandbox.exports?.[exportName] || [];
  } catch (err) {
    logger.warn(`[DataLoader] Failed parsing ${relativeFilePath}: ${err.message}`);
    return [];
  }
}

const products = loadEsmDataset('src/data/products.js', 'products') || {};
const categories = loadEsmDataset('src/data/categories.js', 'categories') || [];
const curatedBrands = loadEsmDataset('src/data/categories.js', 'curatedBrands') || [];
const commerceDomains = loadEsmDataset('src/data/categories.js', 'commerceDomains') || [];

// The storefront catalogue: the same curated products the app shows, generated
// from PRODUCTS_DATA on every frontend build. Keyed by product id.
const catalogProducts = loadEsmDataset('src/data/catalog_products.js', 'catalogProducts') || {};

module.exports = {
  products,
  categories,
  curatedBrands,
  commerceDomains,
  catalogProducts
};
