/**
 * Store Settings Entity — Merchant Preferences & Fulfillment Policies (05.10)
 */

class StoreSettings {
  constructor(data = {}) {
    this.id = data.id || null;
    this.storeId = data.store_id || data.storeId || null;
    this.currency = data.currency || 'XAF';
    this.acceptsEscrow = data.accepts_escrow ?? data.acceptsEscrow ?? true;
    this.acceptsMomo = data.accepts_momo ?? data.acceptsMomo ?? true;
    this.acceptsOrangeMoney = data.accepts_orange_money ?? data.acceptsOrangeMoney ?? true;
    this.acceptsCashOnDelivery = data.accepts_cash_on_delivery ?? data.acceptsCashOnDelivery ?? false;
    this.allowStorePickup = data.allow_store_pickup ?? data.allowStorePickup ?? true;
    this.allowNationalShipping = data.allow_national_shipping ?? data.allowNationalShipping ?? true;
    this.minimumOrderXaf = Number(data.minimum_order_xaf || data.minimumOrderXaf || 0);
    this.autoAcceptOrders = data.auto_accept_orders ?? data.autoAcceptOrders ?? false;
    this.notificationSettings = data.notification_settings || data.notificationSettings || {
      newOrderSms: true,
      newOrderEmail: true,
      lowStockAlert: true,
      payoutProcessed: true
    };
    this.privacySettings = data.privacy_settings || data.privacySettings || {
      showPhone: true,
      showEmail: false,
      showPhysicalAddress: true
    };
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      storeId: this.storeId,
      currency: this.currency,
      acceptsEscrow: this.acceptsEscrow,
      acceptsMomo: this.acceptsMomo,
      acceptsOrangeMoney: this.acceptsOrangeMoney,
      acceptsCashOnDelivery: this.acceptsCashOnDelivery,
      allowStorePickup: this.allowStorePickup,
      allowNationalShipping: this.allowNationalShipping,
      minimumOrderXaf: this.minimumOrderXaf,
      autoAcceptOrders: this.autoAcceptOrders,
      notificationSettings: this.notificationSettings,
      privacySettings: this.privacySettings,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = StoreSettings;
