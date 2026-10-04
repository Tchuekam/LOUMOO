-- ============================================================================
-- LOUMOO — Migration 016: an index for "open orders, newest first"
-- ----------------------------------------------------------------------------
-- Two things read the open orders of EVERY seller at once, newest first:
--   1. the offer sweeper's reminder job, once a minute (DeliveryService.
--      nudgeUndispatched), looking for orders nobody is arranging;
--   2. the dispatch board when an administrator opens it.
-- Both are `WHERE fulfillment_status IN ('processing', 'in_transit')
-- ORDER BY created_at DESC LIMIT n`. The existing indexes lead with buyer_id or
-- seller_id, so without this the database scans and sorts the whole orders table
-- for each of those reads, which is fine for a thousand orders and not for a
-- million.
--
-- PARTIAL on the open statuses, so it stays small however many orders have been
-- delivered or cancelled: it holds only the orders still in flight.
--
-- Optional: nothing breaks without it, those reads are just slower on a big table.
-- Idempotent: safe to re-run. Adding an index changes no data and no behaviour,
-- and it can be dropped again with no application change.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_open_by_created
    ON iam.orders(created_at DESC)
    WHERE fulfillment_status IN ('processing', 'in_transit');
