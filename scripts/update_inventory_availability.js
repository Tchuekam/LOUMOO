/**
 * Script to enforce LOUMOO Inventory Policy:
 * Every product across all categories and catalogs must have at least 1,000 pcs in stock.
 */
const fs = require('fs');
const path = require('path');

const dataLoader = require('../server/modules/catalog/dataLoader.js');

// 1. Update src/data/catalog_products.js
const catalogJsPath = path.join(__dirname, '../src/data/catalog_products.js');
const catalogProducts = dataLoader.catalogProducts || {};
const catKeys = Object.keys(catalogProducts);

console.log(`Updating ${catKeys.length} catalog products with at least 1000 pcs stock...`);
for (const key of catKeys) {
  const p = catalogProducts[key];
  p.inStock = true;
  p.stock = Math.max(1000, Number(p.stock || p.stockQuantity || p.stockUnits || 1000));
  p.stockQuantity = p.stock;
  p.stockUnits = p.stock;
  p.inStockLabel = 'En stock (1 000+ disponibles)';
}

const updatedCatalogCode = `// LOUMOO Curated Catalog Dataset — Enforced >= 1000 pcs per product
export const catalogProducts = ${JSON.stringify(catalogProducts, null, 2)};
`;
fs.writeFileSync(catalogJsPath, updatedCatalogCode, 'utf8');
console.log(`✓ Updated src/data/catalog_products.js with ${catKeys.length} products having >= 1000 pcs stock.`);

// 2. Update src/data/products.js
const productsJsPath = path.join(__dirname, '../src/data/products.js');
const rawProducts = dataLoader.products || {};
const categories = Object.keys(rawProducts);
let productCount = 0;

for (const cat of categories) {
  for (const item of rawProducts[cat]) {
    item.inStock = true;
    item.stockUnits = Math.max(1000, Number(item.stockUnits || item.stockQuantity || item.stock || 1000));
    item.stockQuantity = item.stockUnits;
    item.stock = item.stockUnits;
    item.inStockLabel = 'In Stock (1,000+ pcs)';
    productCount++;
  }
}

const updatedProductsCode = `/**
 * LOUMOO PRODUCTS DATASET — Universal Commerce Catalog & Comparison Engine Dataset
 * Guaranteed inventory: >= 1000 pcs for all items.
 */
export const products = ${JSON.stringify(rawProducts, null, 2)};
`;
fs.writeFileSync(productsJsPath, updatedProductsCode, 'utf8');
console.log(`✓ Updated src/data/products.js with ${productCount} items having >= 1000 pcs stock.`);
