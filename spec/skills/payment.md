# Payment gateway integration vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

This terrain is the **checkout flow against a third-party payment gateway** (Stripe, PayPal, a local PSP): the merchant backend creates an order, the user pays on the gateway's hosted page, and the gateway reports the result back. The general parameter-tampering and transaction-authorization mechanics live in `access-control`. Payment re-grounds them at the gateway boundary, where the tampered total becomes a real charge and idempotency keys on the gateway transaction ID. Specific here is the gateway round-trip and the callback that confirms it.

### Trusting the client's return instead of verifying with the gateway

After payment, the gateway sends the user back to a return URL, often with parameters (`status=success`, `paymentId=...`) in the query string. Marking the order paid because the user landed on `/payment/success` is the central flaw: those parameters are set on the user's side, so anyone who never paid can request the success URL directly or flip `status=failed` to `status=success`, and the order ships.

Safer shape: never fulfill on the user-facing return alone. Confirm the payment **server-to-server**, either by calling the gateway's API for the transaction status or by acting only on its server-sent notification (next block), and in both cases re-check that the **amount, currency, and order ID** the gateway reports match the order you created, not what the request claims. The redirect only shows the user a page, fulfillment is gated on that verified result.

### Unauthenticated or replayable gateway callbacks (webhooks)

The gateway's server-to-server notification (the webhook) is the trustworthy channel, but only once you prove it is really the gateway and really fresh. Three failures break that proof. An endpoint that **accepts any caller** as the gateway, so an attacker `POST`s a forged "paid" notification straight to it. A **signature left unverified**: the gateway signs the payload with a shared secret, and the code never checks it, or checks it without constant-time comparison. A genuine callback **replayed**, captured and re-sent or delivered more than once by the gateway, each delivery triggering fulfillment again (a second shipment, another account credit). A close trap is verifying the signature over a re-serialized body instead of the exact raw bytes the gateway signed, which silently breaks the check.

Safer shapes, applied where they fit:

- **Authenticate every callback.** Verify the gateway's HMAC/signature over the raw request body with the shared secret, comparing in constant time, and reject anything that does not validate. Where the gateway offers it, also pin the source (IP allowlist, mTLS) as a second layer, never the only one.
- **Fulfill only on the server-to-server callback**, never on a value the user's redirect carried.
- **Make fulfillment idempotent.** Key it on the gateway's unique transaction or event ID so the same payment is processed exactly once no matter how many callbacks arrive.
- **Reject stale and reused callbacks.** Refuse a transaction ID that is expired or already seen, closing the replay window.

### Order amount and contents trusted from the request

A request that sends `price=1` for a `$100` item, applies a discount the user is not entitled to, or swaps a product ID, creates a real order the gateway then charges for the tampered total. This is access-control's parameter-tampering surfacing here, where the tampered value becomes a charge.

Safer shape: re-derive every total on the backend from trusted data (the catalog price keyed by product ID, the user's actual entitlements) and create the gateway order from that amount, never from a client-supplied total.

## How to act on the result

- **In detect (detection):** each point where the checkout believes the client about money is a finding. Record what it is, why it matters (goods or credit released without real payment, a forged or replayed callback, a tampered charge), and the evidence (the return handler, the webhook handler, the order-creation code). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when no path to fulfillment trusts the browser. Fulfillment fires solely on a gateway result obtained server-to-server with amount, currency, and order ID matched. The callback signature is verified in constant time over the exact raw payload. Processing is idempotent on the gateway's transaction ID and rejects expired or reused IDs. The order total is recomputed server-side. If the user's redirect, an unsigned callback, a replay, or a client-supplied amount can still release goods or money, the risk is not closed: record it and point back to harden.
