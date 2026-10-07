-- ============================================================================
-- LOUMOO — Migration 019: the order's buyer-protection states
-- ----------------------------------------------------------------------------
-- The buyer-protection attestation (no money moves: pay on delivery) follows the
-- delivery. PAYMENT_STATUS in server/modules/commerce/domain/Order.js has six
-- states, and two of them never fitted the CHECK that migration 003 put on
-- iam.orders.payment_status:
--   released   - the rider handed the order over: the protection is settled
--                (DeliveryService._syncEscrow on "delivered");
--   refundable - the order was cancelled: the buyer owes nothing and a refund
--                is due if anything was paid (OrderLifecycleService).
-- Both writes are best-effort, so the refusal (23514) was only logged: a
-- delivered order stayed "escrow_held" for ever and a cancelled one never
-- became "refundable".
--
-- Additive: the new CHECK accepts every value the old one did, plus those two.
-- Idempotent: safe to re-run (drops the constraint by name, then adds it back).
-- Rollback: put the four-value CHECK back, after moving any released or
-- refundable rows to a state it accepts.
-- ============================================================================

ALTER TABLE iam.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE iam.orders
    ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('pending', 'paid', 'escrow_held', 'released', 'refundable', 'refunded'));
