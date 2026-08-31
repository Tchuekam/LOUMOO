/**
 * Unit Test: Saved Items / Wishlist (04.04)
 */

// Must come first: setup pins NODE_ENV=test and the test-auth secret before
// any module loads the configuration (see setup.js).
require('../setup');
const assert = require('assert');
const SavedItemsUseCase = require('../../server/modules/identity/application/SavedItemsUseCase');
const { ConflictError } = require('../../server/shared/errors/AppError');
const dbModule = require('../../server/infrastructure/database/SupabaseClient');
const { makeFakeDb } = require('../helpers/fallbackDb');

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

  /* ── 6. Regression: memory-store merge on reads (dev fallback path) ────── */
  // The in-memory store is populated only when the DB write fails (dev mode).
  // Once populated, reads MUST stay consistent with it:
  //   (a) DB returns EMPTY rows  -> merge the in-memory records
  //   (b) DB ERRORS              -> fall back to the in-memory records

  const originalGetAdmin = dbModule.SupabaseClient.getAdmin;
  try {
    const forcedError = { code: 'PGRST301', message: 'connection refused (forced)' };

    // (a) prime the in-memory store via the DB-error fallback on save.
    const fallbackUser = `usr_saved_fallback_${Date.now()}`;
    const fallbackProductId = 'prod_fallback_regression';
    dbModule.SupabaseClient.getAdmin = () => makeFakeDb({ data: null, count: 0, error: forcedError });

    const fallbackSaved = await SavedItemsUseCase.saveItem(fallbackUser, {
      productId: fallbackProductId,
      title: 'Fallback Product',
      priceXaf: 999,
      category: 'Computers'
    });
    assert.ok(fallbackSaved.id, 'DB-error save must fall back to an in-memory record');
    assert.strictEqual(fallbackSaved.productId, fallbackProductId);

    // (a2) DB healthy but EMPTY: the read must merge the in-memory record.
    dbModule.SupabaseClient.getAdmin = () => makeFakeDb({ data: [], count: 0, error: null });

    const mergedList = await SavedItemsUseCase.listSavedItems(fallbackUser, { limit: 10, offset: 0 });
    assert.strictEqual(mergedList.items.length, 1,
      'A DB-empty read must surface in-memory fallback records (merge)');
    assert.strictEqual(mergedList.items[0].productId, fallbackProductId);
    assert.strictEqual(mergedList.total, 1, 'Merged total must count the in-memory records');

    const mergedCheck = await SavedItemsUseCase.isItemSaved(fallbackUser, fallbackProductId);
    assert.strictEqual(mergedCheck, true,
      'isItemSaved must consult the memory store when the DB returns no rows');

    // (b) DB ERRORS on read: fall back to the in-memory store.
    const errorUser = `usr_saved_error_${Date.now()}`;
    dbModule.SupabaseClient.getAdmin = () => makeFakeDb({ data: null, count: 0, error: forcedError });

    const errorList = await SavedItemsUseCase.listSavedItems(errorUser, { limit: 10, offset: 0 });
    assert.strictEqual(errorList.items.length, 0,
      'A DB-error read with an empty memory store must return no items');

    const errorFallbackUser = `usr_saved_error_fb_${Date.now()}`;
    const errorFallbackSaved = await SavedItemsUseCase.saveItem(errorFallbackUser, {
      productId: 'prod_error_fallback',
      title: 'Error Fallback Product',
      priceXaf: 555
    });
    assert.ok(errorFallbackSaved.id);

    const errorListWithMemory = await SavedItemsUseCase.listSavedItems(errorFallbackUser, { limit: 10, offset: 0 });
    assert.strictEqual(errorListWithMemory.items.length, 1,
      'A DB-error read must fall back to in-memory records');
    assert.strictEqual(errorListWithMemory.items[0].productId, 'prod_error_fallback');
  } finally {
    dbModule.SupabaseClient.getAdmin = originalGetAdmin;
  }

  console.log('    ✓ Saved items tests passed.');
}

module.exports = { run };
