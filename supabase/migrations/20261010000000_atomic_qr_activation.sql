BEGIN;

CREATE OR REPLACE FUNCTION public.activate_qr_card(
  p_code text,
  p_owner_name text,
  p_owner_phone text,
  p_vehicle_make text,
  p_vehicle_model text,
  p_vehicle_colour text,
  p_vehicle_registration text
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_match_count bigint;
  v_card_id uuid;
  v_card_status text;
  v_updated_count integer;
BEGIN
  IF p_code IS NULL
    OR p_owner_name IS NULL
    OR p_owner_phone IS NULL
    OR p_vehicle_make IS NULL
    OR p_vehicle_model IS NULL
    OR p_vehicle_colour IS NULL
    OR p_vehicle_registration IS NULL
  THEN
    RAISE EXCEPTION 'Activation details are required'
      USING ERRCODE = '22023';
  END IF;

  -- Serialize activation attempts for this code, including duplicate-code checks.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_code));

  SELECT pg_catalog.count(*)
    INTO v_match_count
    FROM public.qr_cards AS cards
    WHERE cards.code = p_code;

  IF v_match_count = 0 THEN
    RETURN 'not_found';
  END IF;

  IF v_match_count <> 1 THEN
    RETURN 'duplicate_code';
  END IF;

  SELECT cards.id, cards.status
    INTO v_card_id, v_card_status
    FROM public.qr_cards AS cards
    WHERE cards.code = p_code
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF v_card_status <> 'UNACTIVATED' THEN
    RETURN 'already_activated';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.registrations AS registrations
      WHERE registrations.card_id = v_card_id
  ) THEN
    RETURN 'already_activated';
  END IF;

  INSERT INTO public.registrations (
    card_id,
    owner_name,
    owner_phone,
    vehicle_make,
    vehicle_model,
    vehicle_colour,
    vehicle_registration
  )
  VALUES (
    v_card_id,
    p_owner_name,
    p_owner_phone,
    p_vehicle_make,
    p_vehicle_model,
    p_vehicle_colour,
    p_vehicle_registration
  );

  UPDATE public.qr_cards AS cards
    SET status = 'ACTIVE'
    WHERE cards.id = v_card_id
      AND cards.code = p_code
      AND cards.status = 'UNACTIVATED';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count <> 1 THEN
    RAISE EXCEPTION 'QR card activation state changed unexpectedly'
      USING ERRCODE = '40001';
  END IF;

  -- PostgREST returns only this outcome, never registration data.
  RETURN 'activated';
END;
$function$;

REVOKE ALL ON FUNCTION public.activate_qr_card(text, text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_qr_card(text, text, text, text, text, text, text)
  TO service_role;

COMMIT;
