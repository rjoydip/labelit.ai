export function createErrorResponse(error: unknown, status: number = 500): Response {
  return new Response(
    JSON.stringify({
      error: error instanceof Error ? error.message : error,
      status,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export function createSuccessResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function generateHMAC(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);

  const cryptoKey = crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const key = await cryptoKey;
  const signature = await crypto.subtle.sign("HMAC", key, payloadData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyHMAC(
  payload: string,
  secret: string,
  signature: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);

  const cryptoKey = crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const key = await cryptoKey;
  const expectedSignature = await crypto.subtle.sign("HMAC", key, payloadData);
  const expected = Array.from(new Uint8Array(expectedSignature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expected === signature;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function exponentialBackoff(attempt: number, baseMs: number): number {
  return baseMs * Math.pow(2, attempt);
}
