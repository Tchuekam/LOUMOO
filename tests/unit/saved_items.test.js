/**
 * Unit Test: Saved Items / Wishlist (04.04)
 */

const assert = require('assert');
const SavedItemsUseCase = require('../../server/modules/identity/application/SavedItemsUseCase');
const { ConflictError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing Saved Items / Wishlist Service...');

  const userId = `usr_saved_test_${Date.now()}`;
  const productId = 'prod_macbook_m3';

  // 1. Save an item
  const saved = await SavedItemsUseCase.saveItem(userId, {
    productId,
    title: 'Apple MacBook Pro 14" M3 Space Black',
    priceXaf: 1450000,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300',
    category: 'Computers'
  });

  assert.ok(saved.id, 'Saved item must have an ID');
  assert.strictEqual(saved.productId, productId);
  assert.strictEqual(saved.priceXaf, 1450000);

  // 2. Duplicate Prevention
  let duplicateBlocked = false;
  try {
    await SavedItemsUseCase.saveItem(userId, {
      productId,
      title: 'Duplicate MacBook',
      priceXaf: 1450000
    });
  } catch (err) {
    if (err instanceof ConflictError) duplicateBlocked = true;
  }
  assert.ok(duplicateBlocked, 'Duplicate saved item must be rejected with ConflictError');

  // 3. Check isItemSaved
  const isSaved = await SavedItemsUseCase.isItemSaved(userId, productId);
  assert.strictEqual(isSaved, true, 'Product should report as saved');

  const notSaved = await SavedItemsUseCase.isItemSaved(userId, 'non_existent_item');
  assert.strictEqual(notSaved, false, 'Non-saved item should report as false');

  // 4. List saved items
  const list = await SavedItemsUseCase.listSavedItems(userId, { limit: 10, offset: 0 });
  assert.ok(list.items.length >= 1, 'Should return at least 1 saved item');
  assert.strictEqual(list.items[0].productId, productId);

  // 5. Remove saved item
  const removeRes = await SavedItemsUseCase.removeItem(userId, productId);
  assert.strictEqual(removeRes.success, true, 'Remove should succeed');

  const checkAfterRemove = await SavedItemsUseCase.isItemSaved(userId, productId);
  assert.strictEqual(checkAfterRemove, false, 'Item should no longer be saved after removal');

  console.log('    ✓ Saved items tests passed.');
}

module.exports = { run };
