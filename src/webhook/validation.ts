import { verifyHMAC } from "../utils";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateGitHubWebhook(
  payload: string,
  signature: string | null,
  secret: string,
): Promise<ValidationResult> {
  if (!signature) {
    return { valid: false, error: "Missing signature" };
  }

  // GitHub sends x-hub-signature-256 as "sha256=<hex>"; verifyHMAC compares against bare hex.
  const normalizedSignature = signature.replace(/^sha(?:256|1)=/i, "");
  const isValid = await verifyHMAC(payload, secret, normalizedSignature);
  if (!isValid) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true };
}
