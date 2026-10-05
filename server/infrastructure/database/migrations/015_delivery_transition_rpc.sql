-- ============================================================================
-- LOUMOO - Migration 015: Atomic delivery transitions
-- ----------------------------------------------------------------------------
-- Adds a service-role RPC that updates iam.deliveries and appends the matching
-- iam.delivery_events row in the same Postgres transaction. The application
-- service remains the single source of truth for legal delivery transitions.
-- ============================================================================

CREATE OR REPLACE FUNCTION iam.delivery_transition_atomic(
    p_delivery_id VARCHAR,
    p_expected JSONB,
    p_patch JSONB,
    p_event_status VARCHAR,
    p_event_previous_status VARCHAR,
    p_actor_id VARCHAR DEFAULT NULL,
    p_note TEXT DEFAULT NULL,
    p_event_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = iam, pg_temp
AS $$
DECLARE
    v_delivery iam.deliveries%ROWTYPE;
BEGIN
    p_expected := COALESCE(p_expected, '{}'::jsonb);
    p_patch := COALESCE(p_patch, '{}'::jsonb);

    UPDATE iam.deliveries AS d
       SET driver_id = CASE WHEN p_patch ? 'driver_id' THEN p_patch->>'driver_id' ELSE d.driver_id END,
           status = CASE WHEN p_patch ? 'status' THEN p_patch->>'status' ELSE d.status END,
           pickup = CASE WHEN p_patch ? 'pickup' THEN COALESCE(p_patch->'pickup', '{}'::jsonb) ELSE d.pickup END,
           dropoff = CASE WHEN p_patch ? 'dropoff' THEN COALESCE(p_patch->'dropoff', '{}'::jsonb) ELSE d.dropoff END,
           handover_nonce = CASE WHEN p_patch ? 'handover_nonce' THEN (p_patch->>'handover_nonce')::integer ELSE d.handover_nonce END,
           code_attempts = CASE WHEN p_patch ? 'code_attempts' THEN (p_patch->>'code_attempts')::integer ELSE d.code_attempts END,
           eta_minutes = CASE WHEN p_patch ? 'eta_minutes' THEN (p_patch->>'eta_minutes')::integer ELSE d.eta_minutes END,
           distance_km = CASE WHEN p_patch ? 'distance_km' THEN (p_patch->>'distance_km')::numeric ELSE d.distance_km END,
           last_location = CASE
             WHEN p_patch ? 'last_location' AND jsonb_typeof(p_patch->'last_location') = 'null' THEN NULL
             WHEN p_patch ? 'last_location' THEN p_patch->'last_location'
             ELSE d.last_location
           END,
           failure_reason = CASE WHEN p_patch ? 'failure_reason' THEN p_patch->>'failure_reason' ELSE d.failure_reason END,
           assigned_at = CASE WHEN p_patch ? 'assigned_at' THEN (p_patch->>'assigned_at')::timestamptz ELSE d.assigned_at END,
           accepted_at = CASE WHEN p_patch ? 'accepted_at' THEN (p_patch->>'accepted_at')::timestamptz ELSE d.accepted_at END,
           picked_up_at = CASE WHEN p_patch ? 'picked_up_at' THEN (p_patch->>'picked_up_at')::timestamptz ELSE d.picked_up_at END,
           arrived_at = CASE WHEN p_patch ? 'arrived_at' THEN (p_patch->>'arrived_at')::timestamptz ELSE d.arrived_at END,
           delivered_at = CASE WHEN p_patch ? 'delivered_at' THEN (p_patch->>'delivered_at')::timestamptz ELSE d.delivered_at END,
           cancelled_at = CASE WHEN p_patch ? 'cancelled_at' THEN (p_patch->>'cancelled_at')::timestamptz ELSE d.cancelled_at END,
           updated_at = CASE WHEN p_patch ? 'updated_at' THEN (p_patch->>'updated_at')::timestamptz ELSE d.updated_at END
     WHERE d.id = p_delivery_id
       AND (NOT p_expected ? 'status' OR d.status IS NOT DISTINCT FROM p_expected->>'status')
       AND (NOT p_expected ? 'driver_id' OR d.driver_id IS NOT DISTINCT FROM p_expected->>'driver_id')
       AND (NOT p_expected ? 'assigned_at' OR d.assigned_at IS NOT DISTINCT FROM (p_expected->>'assigned_at')::timestamptz)
       AND (NOT p_expected ? 'accepted_at' OR d.accepted_at IS NOT DISTINCT FROM (p_expected->>'accepted_at')::timestamptz)
       AND (NOT p_expected ? 'picked_up_at' OR d.picked_up_at IS NOT DISTINCT FROM (p_expected->>'picked_up_at')::timestamptz)
       AND (NOT p_expected ? 'arrived_at' OR d.arrived_at IS NOT DISTINCT FROM (p_expected->>'arrived_at')::timestamptz)
       AND (NOT p_expected ? 'delivered_at' OR d.delivered_at IS NOT DISTINCT FROM (p_expected->>'delivered_at')::timestamptz)
       AND (NOT p_expected ? 'cancelled_at' OR d.cancelled_at IS NOT DISTINCT FROM (p_expected->>'cancelled_at')::timestamptz)
       AND (NOT p_expected ? 'updated_at' OR d.updated_at IS NOT DISTINCT FROM (p_expected->>'updated_at')::timestamptz)
       AND (NOT p_expected ? 'code_attempts' OR d.code_attempts IS NOT DISTINCT FROM (p_expected->>'code_attempts')::integer)
       AND (NOT p_expected ? 'handover_nonce' OR d.handover_nonce IS NOT DISTINCT FROM (p_expected->>'handover_nonce')::integer)
    RETURNING d.* INTO v_delivery;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    INSERT INTO iam.delivery_events (
        delivery_id,
        status,
        previous_status,
        actor_id,
        note,
        created_at
    ) VALUES (
        v_delivery.id,
        p_event_status,
        p_event_previous_status,
        p_actor_id,
        p_note,
        COALESCE(p_event_at, v_delivery.updated_at, NOW())
    );

    RETURN to_jsonb(v_delivery);
END;
$$;

REVOKE ALL ON FUNCTION iam.delivery_transition_atomic(VARCHAR, JSONB, JSONB, VARCHAR, VARCHAR, VARCHAR, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION iam.delivery_transition_atomic(VARCHAR, JSONB, JSONB, VARCHAR, VARCHAR, VARCHAR, TEXT, TIMESTAMPTZ) TO service_role;

NOTIFY pgrst, 'reload schema';
