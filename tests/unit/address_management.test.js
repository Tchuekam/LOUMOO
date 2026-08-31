/**
 * Unit Test: Address Management (04.08)
 */

require('../setup');
const assert = require('assert');
const AddressManagementUseCase = require('../../server/modules/identity/application/AddressManagementUseCase');
const harness = require('../helpers/harness');

async function run() {
  console.log('  Testing Address Management Service...');

  // `iam.addresses.user_id` is a real foreign key into `iam.profiles`, so the
  // address book is exercised against a real account rather than a made-up id.
  const user = await harness.createUser({ stage: 'ready' });
  const userId = user.id;

  // 1. Add first shipping address (should default to isDefault: true)
  const addr1 = await AddressManagementUseCase.addAddress(userId, {
    recipientName: 'Rostand Tchuekam',
    phoneNumber: '+237 690 12 34 56',
    country: 'Cameroon',
    region: 'Littoral',
    city: 'Douala',
    quarter: 'Akwa',
    streetAddress: 'Boulevard de la Liberté',
    landmark: 'Facing Commercial Bank',
    isDefault: true,
    category: 'shipping'
  });

  assert.ok(addr1.id, 'Address must have an ID');
  assert.strictEqual(addr1.recipientName, 'Rostand Tchuekam');
  assert.strictEqual(addr1.isDefault, true);

  // 2. Add second shipping address and set isDefault: true
  // The system must ensure single default address integrity (addr1 becomes false)
  const addr2 = await AddressManagementUseCase.addAddress(userId, {
    recipientName: 'Rostand Tchuekam (Office)',
    phoneNumber: '+237 677 88 99 00',
    country: 'Cameroon',
    region: 'Littoral',
    city: 'Douala',
    quarter: 'Bonanjo',
    streetAddress: 'Avenue Charles de Gaulle',
    landmark: 'Port Authority Gate 2',
    isDefault: true,
    category: 'shipping'
  });

  assert.strictEqual(addr2.isDefault, true);

  const addresses = await AddressManagementUseCase.listAddresses(userId);
  const defaultCount = addresses.filter(a => a.category === 'shipping' && a.isDefault).length;
  assert.strictEqual(defaultCount, 1, 'Only exactly 1 default shipping address must exist');

  // 3. Update address
  const updated = await AddressManagementUseCase.updateAddress(userId, addr1.id, {
    landmark: 'Opposite Cathedral'
  });
  assert.strictEqual(updated.landmark, 'Opposite Cathedral');

  // 4. Delete address (Soft delete)
  const delRes = await AddressManagementUseCase.deleteAddress(userId, addr2.id);
  assert.strictEqual(delRes.success, true);

  const remaining = await AddressManagementUseCase.listAddresses(userId);
  assert.ok(!remaining.some(a => a.id === addr2.id), 'Deleted address must not appear in active list');

  console.log('    ✓ Address management tests passed.');
}

module.exports = { run };
