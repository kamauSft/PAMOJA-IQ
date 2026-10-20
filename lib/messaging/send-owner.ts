import { type SmsMessage } from "./provider";

/** Text the owner only when the SMS keys are set. The number comes from OWNER_PHONE. */
export async function sendOwnerSms(message: SmsMessage): Promise<boolean> {
  const username = process.env.AT_USERNAME?.trim();
  const apiKey = process.env.AT_API_KEY?.trim();
  if (!username || !apiKey) return false;
  const payload = new URLSearchParams({ username, to: message.to, message: message.body });
  const from = process.env.AT_FROM?.trim();
  if (from) payload.set("from", from);
  const response = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });
  return response.ok;
}
