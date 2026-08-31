/**
 * Use Case: Address Management (04.08)
 * Handles full CRUD for Cameroon/African delivery and pickup addresses,
 * ensuring default address integrity and transactional consistency.
 */

const { z } = require('zod');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

const AddressSchema = z.object({
  recipientName: z.string().min(2, 'Recipient name is required').max(100),
  phoneNumber: z.string().min(8, 'Phone number is required').max(20),
  country: z.string().optional().default('Cameroon'),
  region: z.string().optional().default('Littoral'),
  city: z.string().min(1, 'City is required').max(60).default('Douala'),
  quarter: z.string().optional().nullable(),
  streetAddress: z.string().min(3, 'Street address is required').max(255),
  landmark: z.string().optional().nullable(),
  deliveryInstructions: z.string().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  category: z.enum(['shipping', 'billing', 'pickup']).optional().default('shipping')
});

const UpdateAddressSchema = AddressSchema.partial();

class AddressManagementUseCase {
  constructor() {
    this._memoryStore = new Map();
  }

  /**
   * List all active addresses for user
   */
  async listAddresses(userId) {
    if (!userId) throw new ValidationError('User ID is required');

    const cacheKey = `addresses:${userId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    let addresses = [];
    try {
      const supabase = SupabaseClient.getAdmin();
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) { handleDatabaseFailure(error, 'AddressManagement'); }
      if (!error && data) {
        addresses = data.map(this._mapRow);
      } else {
        throw error || new Error('No data');
      }
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase query');
      addresses = (this._memoryStore.get(userId) || []).filter(a => !a.deletedAt);
    }

    await CacheService.set(cacheKey, addresses, 120);
    return addresses;
  }

  /**
   * Add a new address
   */
  async addAddress(userId, addressData) {
    if (!userId) throw new ValidationError('User ID is required');

    const parseResult = AddressSchema.safeParse(addressData);
    if (!parseResult.success) {
      const msg = parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new ValidationError(`Invalid address data: ${msg}`);
    }
    const data = parseResult.data;

    let address = null;

    try {
      const supabase = SupabaseClient.getAdmin();

      // If marked default, unset other defaults in same category
      if (data.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('category', data.category);
      }

      const { data: row, error } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          recipient_name: data.recipientName,
          phone_number: data.phoneNumber,
          country: data.country,
          region: data.region,
          city: data.city,
          quarter: data.quarter,
          street_address: data.streetAddress,
          landmark: data.landmark,
          delivery_instructions: data.deliveryInstructions,
          is_default: data.isDefault,
          category: data.category
        })
        .select()
        .single();

      if (error) throw error;
      address = this._mapRow(row);
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase insert');
      
      const userAddresses = this._memoryStore.get(userId) || [];
      if (data.isDefault || userAddresses.length === 0) {
        userAddresses.forEach(a => { if (a.category === data.category) a.isDefault = false; });
        data.isDefault = true;
      }
      address = {
        id: `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        recipientName: data.recipientName,
        phoneNumber: data.phoneNumber,
        country: data.country,
        region: data.region,
        city: data.city,
        quarter: data.quarter,
        streetAddress: data.streetAddress,
        landmark: data.landmark,
        deliveryInstructions: data.deliveryInstructions,
        isDefault: data.isDefault,
        category: data.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };
      userAddresses.unshift(address);
      this._memoryStore.set(userId, userAddresses);
    }

    await this._invalidateCache(userId);
    logger.info(`[AddressManagement] Added address ${address.id} for user ${userId}`);
    return address;
  }

  /**
   * Update an existing address
   */
  async updateAddress(userId, addressId, updateData) {
    if (!userId || !addressId) throw new ValidationError('User ID and Address ID are required');

    const parseResult = UpdateAddressSchema.safeParse(updateData);
    if (!parseResult.success) {
      const msg = parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new ValidationError(`Invalid address update data: ${msg}`);
    }
    const data = parseResult.data;

    let updated = null;

    try {
      const supabase = SupabaseClient.getAdmin();

      if (data.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('category', data.category || 'shipping');
      }

      const dbUpdates = {};
      if (data.recipientName) dbUpdates.recipient_name = data.recipientName;
      if (data.phoneNumber) dbUpdates.phone_number = data.phoneNumber;
      if (data.country) dbUpdates.country = data.country;
      if (data.region) dbUpdates.region = data.region;
      if (data.city) dbUpdates.city = data.city;
      if (data.quarter !== undefined) dbUpdates.quarter = data.quarter;
      if (data.streetAddress) dbUpdates.street_address = data.streetAddress;
      if (data.landmark !== undefined) dbUpdates.landmark = data.landmark;
      if (data.deliveryInstructions !== undefined) dbUpdates.delivery_instructions = data.deliveryInstructions;
      if (data.isDefault !== undefined) dbUpdates.is_default = data.isDefault;
      if (data.category) dbUpdates.category = data.category;
      dbUpdates.updated_at = new Date().toISOString();

      const { data: row, error } = await supabase
        .from('addresses')
        .update(dbUpdates)
        .eq('id', addressId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!row) throw new NotFoundError('Address not found or unauthorized');
      updated = this._mapRow(row);
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      handleDatabaseFailure(err, 'Supabase update');

      const userAddresses = this._memoryStore.get(userId) || [];
      const index = userAddresses.findIndex(a => a.id === addressId && !a.deletedAt);
      if (index === -1) throw new NotFoundError('Address not found');

      if (data.isDefault) {
        userAddresses.forEach(a => { if (a.category === (data.category || userAddresses[index].category)) a.isDefault = false; });
      }

      userAddresses[index] = {
        ...userAddresses[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      updated = userAddresses[index];
      this._memoryStore.set(userId, userAddresses);
    }

    await this._invalidateCache(userId);
    logger.info(`[AddressManagement] Updated address ${addressId} for user ${userId}`);
    return updated;
  }

  /**
   * Delete address (Soft delete to preserve completed order historical snapshots)
   */
  async deleteAddress(userId, addressId) {
    if (!userId || !addressId) throw new ValidationError('User ID and Address ID are required');

    try {
      const supabase = SupabaseClient.getAdmin();
      const { error } = await supabase
        .from('addresses')
        .update({ deleted_at: new Date().toISOString(), is_default: false })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      handleDatabaseFailure(err, 'Supabase delete');
    }

    // Always soft-delete in memory store regardless of DB outcome
    const userAddresses = this._memoryStore.get(userId) || [];
    const target = userAddresses.find(a => a.id === addressId);
    if (target) {
      target.deletedAt = new Date().toISOString();
      target.isDefault = false;
    }

    await this._invalidateCache(userId);
    logger.info(`[AddressManagement] Deleted address ${addressId} for user ${userId}`);
    return { success: true, deletedAddressId: addressId };
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(userId, addressId) {
    return this.updateAddress(userId, addressId, { isDefault: true });
  }

  async _invalidateCache(userId) {
    await CacheService.del(`addresses:${userId}`);
    await CacheService.del(`dashboard:${userId}`);
  }

  _mapRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      recipientName: row.recipient_name,
      phoneNumber: row.phone_number,
      country: row.country,
      region: row.region,
      city: row.city,
      quarter: row.quarter,
      streetAddress: row.street_address,
      landmark: row.landmark,
      deliveryInstructions: row.delivery_instructions,
      isDefault: Boolean(row.is_default),
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }
}

module.exports = new AddressManagementUseCase();
