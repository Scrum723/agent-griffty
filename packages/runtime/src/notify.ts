import type { WorldState, NotificationRecord } from "@griffty/domain";
import { newId } from "@griffty/domain";

export interface CryptoProposal {
  id?: string;
  asset: string;
  amount: number;
  direction: "buy" | "sell" | "swap" | "transfer";
  exchange: string;
  estimatedValueUsd: number;
  justification: string;
  targetAddress?: string;
}

/**
 * Dispatches an SMS alert to operator phone with full transaction justification.
 */
export async function sendOperatorSms(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`\n📱 [SMS DISPATCH to ${phone}]:\n${message}\n`);

  const webhook = process.env.SMS_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, message }),
      });
      return { success: true };
    } catch (err) {
      console.warn("SMS Webhook error:", err);
      return { success: false, error: err instanceof Error ? err.message : "webhook failed" };
    }
  }

  return { success: true };
}

/**
 * Initiates a crypto transaction proposal requiring operator approval via SMS.
 */
export async function proposeCryptoTransaction(
  world: WorldState,
  proposal: CryptoProposal
): Promise<NotificationRecord> {
  const proposalId = proposal.id || newId("crypto_tx");
  const phone = world.operator.phone || process.env.OPERATOR_PHONE || "555-0100";

  const smsText = `[GRIFFTY CRYPTO ALERT]
Action: ${proposal.direction.toUpperCase()} ${proposal.amount} ${proposal.asset} on ${proposal.exchange} (~$${proposal.estimatedValueUsd.toFixed(2)})
Justification: ${proposal.justification}
Status: PENDING OPERATOR APPROVAL
Review & approve in dashboard: http://127.0.0.1:5173`;

  await sendOperatorSms(phone, smsText);

  const notif: NotificationRecord = {
    id: newId("notif"),
    type: "crypto_transaction_approval_required",
    title: `Crypto Transaction Approval: ${proposal.direction.toUpperCase()} ${proposal.asset}`,
    body: `${proposal.direction.toUpperCase()} ${proposal.amount} ${proposal.asset} (~$${proposal.estimatedValueUsd}) on ${proposal.exchange}. Justification: ${proposal.justification}`,
    read: false,
    createdAt: new Date().toISOString(),
  };

  world.notifications.push(notif);

  world.events.push({
    id: newId("evt"),
    name: "crypto.transaction_suggested" as any,
    ts: notif.createdAt,
    uid: world.operator.uid,
    cycleId: world.cycleId,
    props: {
      proposalId,
      asset: proposal.asset,
      amount: proposal.amount,
      direction: proposal.direction,
      exchange: proposal.exchange,
      estimatedValueUsd: proposal.estimatedValueUsd,
      justification: proposal.justification,
      phoneTarget: phone,
    },
  });

  return notif;
}
