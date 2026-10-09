import {
  Router,
  type IRouter,
  type Request,
  type Response as ExpressResponse,
} from "express";
import {
  ActivateQrBody,
  ActivateQrParams,
  GetQrStatusParams,
} from "@workspace/api-zod";

type SupabaseTable = "qr_cards" | "registrations";
type SupabaseConfig = { url: URL; key: string };
type CardRecord = { id: string; code: string; status: string };

const router: IRouter = Router();

function supabaseConfig(): SupabaseConfig | null {
  const rawUrl = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !key) return null;

  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "yskhbzievopsooadzgqo.supabase.co" ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return { url, key };
  } catch {
    return null;
  }
}

function setPrivateResponseHeaders(res: ExpressResponse): void {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
}

function getCode(req: Request, schema: typeof GetQrStatusParams | typeof ActivateQrParams): string | null {
  const rawCode = req.params.code;
  if (typeof rawCode !== "string") return null;
  const parsed = schema.safeParse({ code: rawCode });
  return parsed.success ? parsed.data.code : null;
}

function endpoint(
  config: SupabaseConfig,
  table: SupabaseTable,
  query: URLSearchParams,
): URL {
  const url = new URL(`/rest/v1/${table}`, config.url);
  url.search = query.toString();
  return url;
}

async function requestSupabase(
  config: SupabaseConfig,
  table: SupabaseTable,
  query: URLSearchParams,
  method = "GET",
  body?: unknown,
  prefer?: string,
): Promise<globalThis.Response> {
  const headers: Record<string, string> = {
    apikey: config.key,
    authorization: `Bearer ${config.key}`,
    accept: "application/json",
  };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (prefer) headers.prefer = prefer;

  return fetch(endpoint(config, table, query), {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function rowsFrom(response: globalThis.Response): Promise<Record<string, unknown>[] | null> {
  try {
    const value: unknown = await response.json();
    return Array.isArray(value) && value.every((row) => row && typeof row === "object")
      ? (value as Record<string, unknown>[])
      : null;
  } catch {
    return null;
  }
}

function isCardRecord(value: Record<string, unknown>): value is CardRecord {
  return (
    typeof value.id === "string" &&
    typeof value.code === "string" &&
    typeof value.status === "string"
  );
}

function unavailable(res: ExpressResponse): void {
  res.status(503).json({ error: "QR service is temporarily unavailable." });
}

async function findCard(
  config: SupabaseConfig,
  code: string,
): Promise<{ kind: "error" } | { kind: "missing" } | { kind: "duplicate" } | { kind: "card"; card: CardRecord }> {
  const query = new URLSearchParams({
    select: "id,code,status",
    code: `eq.${code}`,
    limit: "2",
  });
  const response = await requestSupabase(config, "qr_cards", query);
  if (!response.ok) {
    await response.body?.cancel();
    return { kind: "error" };
  }

  const rows = await rowsFrom(response);
  if (!rows) return { kind: "error" };
  if (rows.length === 0) return { kind: "missing" };
  if (rows.length !== 1) return { kind: "duplicate" };
  if (!isCardRecord(rows[0])) return { kind: "error" };
  return { kind: "card", card: rows[0] };
}

async function hasRegistration(
  config: SupabaseConfig,
  cardId: string,
): Promise<number | null> {
  const query = new URLSearchParams({
    select: "id",
    card_id: `eq.${cardId}`,
    limit: "2",
  });
  const response = await requestSupabase(config, "registrations", query);
  if (!response.ok) {
    await response.body?.cancel();
    return null;
  }
  const rows = await rowsFrom(response);
  return rows ? rows.length : null;
}

async function updateCardStatus(
  config: SupabaseConfig,
  cardId: string,
  from: string,
  to: string,
): Promise<boolean | null> {
  const query = new URLSearchParams({
    id: `eq.${cardId}`,
    status: `eq.${from}`,
    select: "id",
  });
  const response = await requestSupabase(
    config,
    "qr_cards",
    query,
    "PATCH",
    { status: to },
    "return=representation",
  );
  if (!response.ok) {
    await response.body?.cancel();
    return null;
  }
  const rows = await rowsFrom(response);
  return rows ? rows.length === 1 : null;
}

function normalizeActivationBody(body: unknown): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  const values = body as Record<string, unknown>;
  const trim = (value: unknown) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value;
  const phone = typeof values.ownerPhone === "string"
    ? values.ownerPhone.trim().replace(/[()\s-]/g, "")
    : values.ownerPhone;
  return {
    ...values,
    ownerName: trim(values.ownerName),
    ownerPhone: phone,
    vehicleMake: trim(values.vehicleMake),
    vehicleModel: trim(values.vehicleModel),
    vehicleColour: trim(values.vehicleColour),
    vehicleRegistration:
      typeof values.vehicleRegistration === "string"
        ? values.vehicleRegistration.trim().toUpperCase().replace(/\s+/g, " ")
        : values.vehicleRegistration,
  };
}

router.get("/qr/:code", async (req, res): Promise<void> => {
  setPrivateResponseHeaders(res);
  const code = getCode(req, GetQrStatusParams);
  if (!code) {
    res.status(400).json({ error: "Invalid QR code format." });
    return;
  }

  const config = supabaseConfig();
  if (!config) {
    unavailable(res);
    return;
  }

  try {
    const result = await findCard(config, code);
    if (result.kind === "error") {
      req.log.warn("QR lookup could not be completed.");
      unavailable(res);
      return;
    }
    if (result.kind === "missing") {
      res.status(404).json({ error: "This QR code is invalid or unavailable." });
      return;
    }
    if (result.kind === "duplicate") {
      res.status(409).json({ error: "This QR code is invalid or unavailable." });
      return;
    }
    if (result.card.status === "ACTIVE") {
      res.json({ state: "active" });
      return;
    }
    if (result.card.status === "UNACTIVATED") {
      res.json({ state: "activation_required" });
      return;
    }
    res.status(404).json({ error: "This QR code is invalid or unavailable." });
  } catch {
    req.log.warn("QR lookup could not be completed.");
    unavailable(res);
  }
});

router.post("/qr/:code/activate", async (req, res): Promise<void> => {
  setPrivateResponseHeaders(res);
  const code = getCode(req, ActivateQrParams);
  if (!code) {
    res.status(400).json({ error: "Invalid QR code format." });
    return;
  }

  const activation = ActivateQrBody.safeParse(normalizeActivationBody(req.body));
  if (!activation.success) {
    res.status(400).json({ error: "Check the owner and vehicle details and try again." });
    return;
  }

  const config = supabaseConfig();
  if (!config) {
    unavailable(res);
    return;
  }

  try {
    const result = await findCard(config, code);
    if (result.kind === "error") {
      req.log.warn("QR activation could not be completed.");
      unavailable(res);
      return;
    }
    if (result.kind === "missing" || result.kind === "duplicate") {
      res.status(404).json({ error: "This QR code is invalid or unavailable." });
      return;
    }
    if (result.card.status !== "UNACTIVATED") {
      res.status(result.card.status === "ACTIVE" ? 409 : 404).json({
        error: "This QR code is invalid or unavailable.",
      });
      return;
    }

    const priorRegistration = await hasRegistration(config, result.card.id);
    if (priorRegistration === null) {
      req.log.warn("Registration status could not be checked.");
      unavailable(res);
      return;
    }
    if (priorRegistration > 0) {
      res.status(409).json({ error: "This QR code is invalid or unavailable." });
      return;
    }

    const claimed = await updateCardStatus(
      config,
      result.card.id,
      "UNACTIVATED",
      "ACTIVE",
    );
    if (claimed === null) {
      req.log.warn("QR card could not be claimed for activation.");
      unavailable(res);
      return;
    }
    if (!claimed) {
      res.status(409).json({ error: "This QR code is invalid or unavailable." });
      return;
    }

    const details = activation.data;
    const registration = {
      card_id: result.card.id,
      owner_name: details.ownerName,
      owner_phone: details.ownerPhone,
      vehicle_make: details.vehicleMake,
      vehicle_model: details.vehicleModel,
      vehicle_colour: details.vehicleColour,
      vehicle_registration: details.vehicleRegistration,
    };
    const insertQuery = new URLSearchParams();
    let insertResponse: globalThis.Response | null = null;
    try {
      insertResponse = await requestSupabase(
        config,
        "registrations",
        insertQuery,
        "POST",
        registration,
        "return=minimal",
      );
    } catch {
      insertResponse = null;
    }

    if (insertResponse?.ok) {
      res.status(201).json({ state: "active" });
      return;
    }

    if (insertResponse) await insertResponse.body?.cancel();
    const confirmedRegistration = await hasRegistration(config, result.card.id);
    if (confirmedRegistration === 1) {
      res.status(201).json({ state: "active" });
      return;
    }
    if (confirmedRegistration === 0) {
      const restored = await updateCardStatus(
        config,
        result.card.id,
        "ACTIVE",
        "UNACTIVATED",
      );
      if (restored === false) {
        res.status(503).json({ error: "Activation could not be completed. Please try again." });
        return;
      }
    }
    req.log.warn("QR activation outcome could not be confirmed.");
    unavailable(res);
  } catch {
    req.log.warn("QR activation could not be completed.");
    unavailable(res);
  }
});

export default router;
