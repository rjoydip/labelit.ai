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

  const isValid = await verifyHMAC(payload, secret, signature);
  if (!isValid) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true };
}
