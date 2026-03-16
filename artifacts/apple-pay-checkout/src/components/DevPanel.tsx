import { useState } from "react";

interface DevPanelProps {
  currentStep: string;
  total: number;
  devMode?: "onetime" | "recurring" | "combined";
  inStoreProvider?: "stripe" | "braintree";
}

type Tab = "flow" | "setup" | "events" | "recurring" | "combined" | "instore";

const ALL_STEPS: Record<string, { label: string; color: string; desc: string }> = {
  idle: { label: "Idle", color: "text-gray-400", desc: "Waiting for user to tap Apple Pay button" },
  validateMerchant: { label: "Validate Merchant", color: "text-yellow-400", desc: "Server fetches merchant session from Apple" },
  shippingMethodSelected: { label: "Sheet Presented", color: "text-blue-400", desc: "User sees payment sheet, selects details" },
  paymentAuthorized: { label: "Payment Authorized", color: "text-green-400", desc: "Token received, send to backend to charge" },
  authorized: { label: "One-Time Complete", color: "text-green-400", desc: "Payment processed, subscription upsell shown" },
  recurringValidateMerchant: { label: "Validate Merchant (recurring)", color: "text-yellow-400", desc: "New ApplePaySession for subscription" },
  recurringSheetPresented: { label: "Recurring Sheet", color: "text-purple-400", desc: "Shows recurringPaymentRequest billing UI" },
  recurringPaymentAuthorized: { label: "Recurring Token", color: "text-purple-400", desc: "Encrypted recurring token received from Apple" },
  recurringAuthorized: { label: "Subscription Active", color: "text-green-400", desc: "Token stored, billing agreement created" },
  combinedAuthorized: { label: "Payment + Subscription Active", color: "text-indigo-400", desc: "One session handled both — payment + subscription" },
};

const SETUP_CODE = `<!-- 1. Add Apple Pay SDK to <head> -->
<script src="https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js"
        crossorigin="anonymous"></script>

<!-- 2. Show button only when supported -->
<script>
if (window.ApplePaySession?.canMakePayments()) {
  document.getElementById('apple-pay-btn').style.display = 'block';
}
</script>

<!-- Two-Session: separate buy + subscribe buttons -->
<apple-pay-button id="apple-pay-buy-btn"
  buttonstyle="black" type="buy"
  locale="en-US" onclick="startPurchaseSession()">
</apple-pay-button>

<apple-pay-button id="apple-pay-sub-btn"
  buttonstyle="black" type="subscribe"
  locale="en-US" onclick="startSubscriptionSession()">
</apple-pay-button>

<!-- One-Session: single button handles both -->
<apple-pay-button id="apple-pay-combined-btn"
  buttonstyle="black" type="buy"
  locale="en-US" onclick="startCombinedSession()">
</apple-pay-button>`;

const EVENTS_CODE = `// ── TWO-SESSION: STEP 1 — One-Time Payment ──
function startPurchaseSession() {
  const request = {
    countryCode: 'US',
    currencyCode: 'USD',
    merchantCapabilities: ['supports3DS'],
    supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
    total: { label: 'Apple Demo Store', amount: '313.20' },
    lineItems: [
      { label: 'AirPods Pro',     amount: '249.00' },
      { label: 'MagSafe Charger', amount: '39.00'  },
      { label: 'Tax',             amount: '25.20'  }
    ],
    requiredShippingContactFields: ['postalAddress', 'email'],
    requiredBillingContactFields:  ['postalAddress']
  };

  const session = new ApplePaySession(14, request);

  session.onvalidatemerchant = async (event) => {
    const res = await fetch('/api/apple-pay/validate', {
      method: 'POST',
      body: JSON.stringify({ validationURL: event.validationURL }),
      headers: { 'Content-Type': 'application/json' }
    });
    session.completeMerchantValidation(await res.json());
  };

  session.onpaymentauthorized = async (event) => {
    const res = await fetch('/api/apple-pay/process', {
      method: 'POST',
      body: JSON.stringify({ token: event.payment.token }),
      headers: { 'Content-Type': 'application/json' }
    });
    const { success } = await res.json();
    session.completePayment(
      success ? ApplePaySession.STATUS_SUCCESS : ApplePaySession.STATUS_FAILURE
    );
    if (success) showSubscriptionUpsell(); // ← trigger step 2
  };

  session.oncancel = () => console.log('Cancelled');
  session.begin();
}`;

const RECURRING_CODE = `// ── TWO-SESSION: STEP 2 — Recurring Subscription ──
// Called AFTER the one-time payment succeeds
function startSubscriptionSession() {
  const request = {
    countryCode: 'US',
    currencyCode: 'USD',
    merchantCapabilities: ['supports3DS'],
    supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
    total: {
      label: 'AudioHound Pro',
      amount: '0.00',
      type: 'final'
    },
    lineItems: [
      { label: 'First month free', amount: '0.00', type: 'final' }
    ],
    recurringPaymentRequest: {
      paymentDescription: 'AudioHound Pro',
      trialBilling: {
        label: 'AudioHound Pro Trial',
        amount: '0.00',
        type: 'final',
        recurringPaymentIntervalUnit:  'month',
        recurringPaymentIntervalCount: 1,
        recurringPaymentStartDate:     new Date().toISOString(),
        recurringPaymentEndDate:       new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      },
      regularBilling: {
        label: 'AudioHound Pro Monthly',
        amount: '9.99',
        type: 'final',
        recurringPaymentIntervalUnit:  'month',
        recurringPaymentIntervalCount: 1,
        recurringPaymentStartDate:     new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      },
      billingAgreement:
        'You will be charged $0.00 today. After your free trial, ' +
        '$9.99/month will be billed until cancelled.',
      managementURL: 'https://yourdomain.com/subscriptions',
      tokenNotificationURL:
        'https://yourdomain.com/api/apple-pay/token-update'
    },
    requiredBillingContactFields: ['email']
  };

  const session = new ApplePaySession(14, request);

  session.onvalidatemerchant = async (event) => {
    const res = await fetch('/api/apple-pay/validate', {
      method: 'POST',
      body: JSON.stringify({ validationURL: event.validationURL }),
      headers: { 'Content-Type': 'application/json' }
    });
    session.completeMerchantValidation(await res.json());
  };

  session.onpaymentauthorized = async (event) => {
    const res = await fetch('/api/apple-pay/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        token: event.payment.token,
        plan: 'audiohound_pro_monthly',
        email: event.payment.billingContact?.emailAddress
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const { success, subscriptionId } = await res.json();
    session.completePayment(
      success ? ApplePaySession.STATUS_SUCCESS : ApplePaySession.STATUS_FAILURE
    );
  };

  session.oncancel = () => console.log('Subscription cancelled');
  session.begin();
}`;

const COMBINED_CODE = `// ── ONE-SESSION FLOW ──
// AudioHound Pro is a SKU at checkout — purchase + subscription
// in a single ApplePaySession with recurringPaymentRequest
function startCombinedSession() {
  const request = {
    countryCode: 'US',
    currencyCode: 'USD',
    merchantCapabilities: ['supports3DS'],
    supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],

    // Total = product charge only (subscription trial is $0 today)
    total: {
      label: 'Apple Demo Store',
      amount: '313.20',
      type: 'final'
    },
    lineItems: [
      { label: 'AirPods Pro',                amount: '249.00' },
      { label: 'MagSafe Charger',            amount: '39.00'  },
      { label: 'Tax',                        amount: '25.20'  },
      // ── Subscription shown as a line-item SKU ──
      { label: 'AudioHound Pro (1st month free)', amount: '0.00', type: 'final' }
    ],

    // ── Subscription set up in the SAME session ──
    // User authorizes both purchase AND recurring billing in one tap
    recurringPaymentRequest: {
      paymentDescription: 'AudioHound Pro',

      trialBilling: {
        label: 'AudioHound Pro Trial',
        amount: '0.00',
        type: 'final',
        recurringPaymentIntervalUnit:  'month',
        recurringPaymentIntervalCount: 1,
        recurringPaymentStartDate:     new Date().toISOString(),
        recurringPaymentEndDate:       new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      },
      regularBilling: {
        label: 'AudioHound Pro Monthly',
        amount: '9.99',
        type: 'final',
        recurringPaymentIntervalUnit:  'month',
        recurringPaymentIntervalCount: 1,
        recurringPaymentStartDate:     new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      },

      billingAgreement:
        'Your purchase includes AudioHound Pro. $0.00 for the first month, ' +
        'then $9.99/month billed automatically until cancelled.',

      managementURL: 'https://yourdomain.com/subscriptions',
      tokenNotificationURL:
        'https://yourdomain.com/api/apple-pay/token-update'
    },

    requiredShippingContactFields: ['postalAddress', 'email'],
    requiredBillingContactFields:  ['postalAddress']
  };

  const session = new ApplePaySession(14, request);

  session.onvalidatemerchant = async (event) => {
    const res = await fetch('/api/apple-pay/validate', {
      method: 'POST',
      body: JSON.stringify({ validationURL: event.validationURL }),
      headers: { 'Content-Type': 'application/json' }
    });
    session.completeMerchantValidation(await res.json());
  };

  // Single handler — token covers both the purchase and subscription
  session.onpaymentauthorized = async (event) => {
    const { token } = event.payment;
    // token.paymentData   ← encrypted data for the one-time charge
    // token.paymentMethod ← card info (displayName, network, type)
    // Apple stores the recurring billing agreement internally;
    // your backend charges the product amount and activates the plan.

    const res = await fetch('/api/apple-pay/purchase-with-subscription', {
      method: 'POST',
      body: JSON.stringify({
        token,
        plan: 'audiohound_pro_monthly',
        amount: '313.20',
        email: event.payment.billingContact?.emailAddress
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const { success } = await res.json();

    session.completePayment(
      success ? ApplePaySession.STATUS_SUCCESS : ApplePaySession.STATUS_FAILURE
    );
  };

  session.oncancel = () => console.log('Session cancelled by user');
  session.begin();
}

// ── BACKEND endpoint ──
// POST /api/apple-pay/purchase-with-subscription
app.post('/api/apple-pay/purchase-with-subscription', async (req, res) => {
  const { token, plan, amount, email } = req.body;
  // 1. Decrypt token.paymentData via your PSP (Stripe, Braintree, etc.)
  // 2. Charge the one-time amount
  // 3. Activate the subscription plan for this user
  // 4. Store the plan + email for future billing cycles
  res.json({ success: true });
});`;

const INSTORE_TWO_SESSION_CODE = `// ── IN-STORE TWO-SESSION (Ingenico P400 · Stripe Terminal JS SDK) ──
// Ref: docs.stripe.com/payments/wallets · docs.stripe.com/terminal
//
// Session 1 — Terminal NFC tap charges the cart
// Session 2 — Saved PaymentMethod activates the subscription off-session
//
// Apple Pay IS supported by Stripe Terminal (card_present wallet token).
// Saved digital-wallet tokens trigger an MIT flag → 24 hr auth window.
// See: docs.stripe.com/payments/wallets (product support table)

import { loadStripeTerminal } from '@stripe/terminal-js';

// ── STEP 1: Boot the Terminal SDK and connect to the P400 ──
const StripeTerminal = await loadStripeTerminal();
const terminal = StripeTerminal.create({
  onFetchConnectionToken: async () => {
    // Your server calls stripe.terminal.connectionTokens.create()
    const { secret } = await fetch('/terminal/connection-token',
      { method: 'POST' }).then(r => r.json());
    return secret;
  },
  onUnexpectedReaderDisconnect: () => console.warn('Reader disconnected'),
});

const { readers } = await terminal.discoverReaders({
  simulated: false,         // set true to use Stripe's built-in simulator
  location: 'tmr_loc_xxx'  // Stripe Dashboard → Terminal → Locations
});
if (readers.length === 0) throw new Error('No readers found');
await terminal.connectReader(readers[0]);

// ── STEP 2 (server): Create a PaymentIntent for the cart total ──
// setup_future_usage: 'off_session' vaults the card_present payment method
// so the same card can be billed again without the customer being present.
//
// app.post('/create-payment-intent', async (req, res) => {
//   const pi = await stripe.paymentIntents.create({
//     amount: 31320,          // $313.20 in cents
//     currency: 'usd',
//     payment_method_types: ['card_present'],
//     capture_method: 'automatic',
//     setup_future_usage: 'off_session', // ← vaults the card after auth
//   });
//   res.json({ clientSecret: pi.client_secret });
// });

const { clientSecret } = await fetch('/create-payment-intent', {
  method: 'POST',
  body: JSON.stringify({ amount: 31320, currency: 'usd' }),
  headers: { 'Content-Type': 'application/json' },
}).then(r => r.json());

// ── STEP 3: Customer taps iPhone / Apple Watch on the P400 ──
// The Terminal SDK presents Apple Pay on the customer's device.
// Face ID or Touch ID authorizes the payment — no PIN needed.
const { paymentIntent: collectedIntent, error: collectError } =
  await terminal.collectPaymentMethod(clientSecret);
if (collectError) throw collectError;

// ── STEP 4: Confirm — captures the charge ──
const { paymentIntent: confirmedIntent, error: confirmError } =
  await terminal.confirmPaymentIntent(collectedIntent);
if (confirmError) throw confirmError;

// confirmedIntent.status === 'succeeded'
// confirmedIntent.payment_method holds the vaulted card_present PaymentMethod

if (confirmedIntent.status === 'succeeded') {
  showSubscriptionOffer(); // display upsell on POS / customer-facing screen

  // ── STEP 5 (Session 2 — server): Activate subscription off-session ──
  // Use the vaulted PaymentMethod to create a Stripe Subscription.
  // This is an MIT (merchant-initiated transaction); Apple Pay digital-wallet
  // tokens have a 24-hour authorization expiry window — factor this into
  // your capture and re-auth logic (check authorizationExpiresAt).
  await fetch('/api/activate-subscription', {
    method: 'POST',
    body: JSON.stringify({
      paymentIntentId: confirmedIntent.id,  // server retrieves payment_method from this
      plan: 'audiohound_pro_monthly',
      trialDays: 30,
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  // Server-side /api/activate-subscription:
  // const pi  = await stripe.paymentIntents.retrieve(paymentIntentId);
  // const sub = await stripe.subscriptions.create({
  //   customer: customerId,
  //   items: [{ price: 'price_audiohound_pro_monthly' }],
  //   default_payment_method: pi.payment_method,  // ← vaulted card_present PM
  //   trial_period_days: 30,
  //   off_session: true,
  // });
}`;

const INSTORE_ONE_SESSION_CODE = `// ── IN-STORE ONE-SESSION (Ingenico P400 · Stripe Terminal JS SDK) ──
// Ref: docs.stripe.com/payments/wallets · docs.stripe.com/terminal
//
// Single NFC tap — payment captured AND card vaulted for subscription.
// setup_future_usage: 'off_session' on the PaymentIntent does both in one
// collectPaymentMethod call. No second tap required from the customer.
//
// Limitation (from docs.stripe.com/payments/wallets):
// "Some wallets don't support recurring payments, and others have limited
//  support — requiring customer re-authentication or restricting retries."
// Always confirm Apple Pay off-session support for your Stripe account region.

import { loadStripeTerminal } from '@stripe/terminal-js';

// ── STEP 1: Boot SDK + connect reader (identical to two-session) ──
const StripeTerminal = await loadStripeTerminal();
const terminal = StripeTerminal.create({
  onFetchConnectionToken: async () => {
    const { secret } = await fetch('/terminal/connection-token',
      { method: 'POST' }).then(r => r.json());
    return secret;
  },
  onUnexpectedReaderDisconnect: () => console.warn('Reader disconnected'),
});
const { readers } = await terminal.discoverReaders({ simulated: false });
await terminal.connectReader(readers[0]);

// ── STEP 2 (server): PaymentIntent with setup_future_usage ──
// setup_future_usage: 'off_session' tells Stripe to vault the card_present
// PaymentMethod after authorization so it can be charged again off-session.
//
// app.post('/create-payment-intent', async (req, res) => {
//   const pi = await stripe.paymentIntents.create({
//     amount: 31320,
//     currency: 'usd',
//     payment_method_types: ['card_present'],
//     capture_method: 'automatic',
//     setup_future_usage: 'off_session', // ← single-tap vault + charge
//     metadata: { plan: 'audiohound_pro_monthly', subscribe: 'true' },
//   });
//   res.json({ clientSecret: pi.client_secret });
// });

const { clientSecret } = await fetch('/create-payment-intent', {
  method: 'POST',
  body: JSON.stringify({
    amount: 31320,
    currency: 'usd',
    metadata: { subscribe: 'true', plan: 'audiohound_pro_monthly' },
  }),
  headers: { 'Content-Type': 'application/json' },
}).then(r => r.json());

// ── STEP 3: Single tap — customer taps iPhone / Watch once ──
// Stripe Terminal surfaces Apple Pay on the customer's device.
// The payment is captured AND the card is vaulted in one interaction.
const { paymentIntent: collectedIntent, error: collectError } =
  await terminal.collectPaymentMethod(clientSecret);
if (collectError) throw collectError;

const { paymentIntent: confirmedIntent, error: confirmError } =
  await terminal.confirmPaymentIntent(collectedIntent);
if (confirmError) throw confirmError;

// ── STEP 4 (server): Subscription is activated using the vaulted card ──
// The MIT (merchant-initiated) flag applies. Digital-wallet card_present
// tokens have a 24-hour auth expiry — build re-auth logic accordingly.
if (confirmedIntent.status === 'succeeded') {
  await fetch('/api/activate-subscription', {
    method: 'POST',
    body: JSON.stringify({
      paymentIntentId: confirmedIntent.id,
      plan: 'audiohound_pro_monthly',
      trialDays: 30,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  showConfirmation({ payment: true, subscription: true });

  // Server-side /api/activate-subscription:
  // const pi  = await stripe.paymentIntents.retrieve(paymentIntentId);
  // const sub = await stripe.subscriptions.create({
  //   customer: customerId,
  //   items: [{ price: 'price_audiohound_pro_monthly' }],
  //   default_payment_method: pi.payment_method, // vaulted card_present PM
  //   trial_period_days: 30,
  //   off_session: true,
  //   expand: ['latest_invoice.payment_intent'],
  // });
}`;

const BRAINTREE_TWO_SESSION_CODE = `// ── IN-STORE TWO-SESSION (Braintree GraphQL API) ──
// Ref: developer.paypal.com/braintree/in-person/guides/vaulting-and-customers/
//
// Session 1 — requestChargeFromInStoreReader charges the cart + vaults the card.
// Session 2 — chargePaymentMethod(paymentMethodId) activates subscription off-session.
//
// Vaulted digital-wallet PMs (Apple Pay, Google Pay, Samsung Pay) get an MIT flag
// automatically applied. Auth expiry is 24 hours — parse authorizationExpiresAt
// and build re-auth logic. Future charges are card-not-present (CNP) pricing.

const gql = (query, variables) =>
  fetch('https://payments.sandbox.braintree-api.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${btoa('pub_key:priv_key')}\`,
      'Braintree-Version': '2023-09-14',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  }).then(r => r.json()).then(r => r.data);

// ── STEP 1 (Optional): Create a Braintree Customer ──
const { createCustomer: { customer } } = await gql(\`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      customer { id email firstName lastName }
    }
  }\`, { input: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' } });

// ── STEP 2 (Session 1): Charge reader + vault in one NFC tap ──
// vaultPaymentMethodAfterTransacting: ON_SUCCESSFUL_TRANSACTION stores the
// Apple Pay DPAN as a reusable MULTI_USE PaymentMethod in the Braintree vault.
const { requestChargeFromInStoreReader: ctx } = await gql(\`
  mutation RequestCharge($input: RequestChargeFromInStoreReaderInput!) {
    requestChargeFromInStoreReader(input: $input) {
      id      # inStoreContextPayload.id — poll this for completion
      status
      reader { id name status }
    }
  }\`, {
  input: {
    readerId: 'your_reader_id',
    customerId: customer.id,
    transaction: {
      amount: '313.20',
      orderId: 'AUDIOHOUND-ORDER-001',
      lineItems: [
        { quantity: 1, unitAmount: '249.00', name: 'AirPods Pro',     kind: 'DEBIT' },
        { quantity: 1, unitAmount:  '39.00', name: 'MagSafe Charger', kind: 'DEBIT' },
      ],
    },
    vaultPaymentMethodAfterTransacting: {
      when: 'ON_SUCCESSFUL_TRANSACTION', // ← vault only on success
    },
  },
});

// ── STEP 3: Poll the context until COMPLETE ──
// Customer authenticates with Face ID / Touch ID on their device.
let result;
do {
  await new Promise(r => setTimeout(r, 1500)); // poll every 1.5 s
  const { node } = await gql(\`
    query CheckStatus($id: ID!) {
      node(id: $id) {
        ... on RequestChargeInStoreContext {
          id status statusReason
          transaction { id status amount { value } }
          paymentMethod {
            id     # ← store this — use for all future charges
            usage  # MULTI_USE for vaulted Apple Pay tokens
          }
        }
      }
    }\`, { id: ctx.id });
  result = node;
} while (!['COMPLETE', 'FAILED'].includes(result.status));

if (result.status !== 'COMPLETE') throw new Error(result.statusReason);
const paymentMethodId = result.paymentMethod.id;
showSubscriptionOffer(); // ← show AudioHound Pro upsell to customer

// ── STEP 4 (Session 2): Activate subscription off-session ──
// MIT flag is auto-applied — digital wallet vaults have a 24hr auth expiry.
// Parse authorizationExpiresAt for re-auth logic on deferred captures.
const { chargePaymentMethod: { transaction: sub } } = await gql(\`
  mutation ActivateSub($input: ChargePaymentMethodInput!) {
    chargePaymentMethod(input: $input) {
      transaction {
        id status
        authorizationExpiresAt  # 24hr window for Apple Pay digital wallet PMs
        amount { value currencyIsoCode }
      }
    }
  }\`, {
  input: {
    paymentMethodId,
    transaction: {
      amount: '0.00', // free trial — first month $0.00
      orderId: 'AUDIOHOUND-SUB-001',
      descriptor: { name: 'AudioHound*Pro' },
    },
  },
});`;

const BRAINTREE_ONE_SESSION_CODE = `// ── IN-STORE ONE-SESSION (Braintree GraphQL API) ──
// Ref: developer.paypal.com/braintree/in-person/guides/vaulting-and-customers/
//
// Single NFC tap: requestChargeFromInStoreReader charges the cart AND vaults
// the card. Server immediately activates AudioHound Pro using the vaulted
// paymentMethodId — no second customer interaction required.
//
// Key constraints (from Braintree docs):
//   • MIT flag auto-applied → 24hr authorizationExpiresAt on digital wallet PMs
//   • Future charges = card-not-present (CNP) pricing
//   • paymentMethodId is UNIQUE PER VAULT — use uniqueNumberIdentifier for analytics

const gql = (query, variables) =>
  fetch('https://payments.sandbox.braintree-api.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${btoa('pub_key:priv_key')}\`,
      'Braintree-Version': '2023-09-14',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  }).then(r => r.json()).then(r => r.data);

// ── STEP 1: Single NFC tap — charge + vault ──
const { requestChargeFromInStoreReader: ctx } = await gql(\`
  mutation RequestCharge($input: RequestChargeFromInStoreReaderInput!) {
    requestChargeFromInStoreReader(input: $input) {
      id status
      reader { id name status }
    }
  }\`, {
  input: {
    readerId: 'your_reader_id',
    customerId: 'customer_id_from_crm',
    transaction: {
      amount: '313.20',
      orderId: 'AUDIOHOUND-ORDER-001',
      lineItems: [
        { quantity: 1, unitAmount: '249.00', name: 'AirPods Pro',     kind: 'DEBIT' },
        { quantity: 1, unitAmount:  '39.00', name: 'MagSafe Charger', kind: 'DEBIT' },
        { quantity: 1, unitAmount:   '0.00', name: 'AudioHound Pro (1mo free)', kind: 'DEBIT' },
      ],
    },
    vaultPaymentMethodAfterTransacting: { when: 'ON_SUCCESSFUL_TRANSACTION' },
  },
});

// ── STEP 2: Poll until COMPLETE ──
let result;
do {
  await new Promise(r => setTimeout(r, 1500));
  const { node } = await gql(\`
    query CheckStatus($id: ID!) {
      node(id: $id) {
        ... on RequestChargeInStoreContext {
          id status statusReason
          transaction { id status }
          paymentMethod {
            id    # ← use for subscription billing
            details {
              ... on CreditCardDetails {
                uniqueNumberIdentifier  # stable per card — use for analytics/dedup
                brandCode last4 bin
              }
            }
          }
        }
      }
    }\`, { id: ctx.id });
  result = node;
} while (!['COMPLETE', 'FAILED'].includes(result.status));

if (result.status !== 'COMPLETE') throw new Error(result.statusReason);

// ── STEP 3 (server): Immediately activate subscription using vaulted PM ──
// No second tap required. MIT flag auto-applied — build re-auth on authorizationExpiresAt.
const { chargePaymentMethod: { transaction: sub } } = await gql(\`
  mutation ActivateSub($input: ChargePaymentMethodInput!) {
    chargePaymentMethod(input: $input) {
      transaction {
        id status
        authorizationExpiresAt  # 24hr for Apple Pay digital wallet card_present vaults
        amount { value currencyIsoCode }
      }
    }
  }\`, {
  input: {
    paymentMethodId: result.paymentMethod.id,
    transaction: {
      amount: '0.00', // $0.00 for free trial month
      orderId: 'AUDIOHOUND-SUB-001',
      descriptor: { name: 'AudioHound*Pro' },
    },
  },
});
showConfirmation({ payment: true, subscription: true });`;

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative bg-[#0d1117] rounded-xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></div>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-gray-500 hover:text-gray-300 text-[10px] font-medium transition-colors flex items-center gap-1"
        >
          {copied ? (
            <><svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-green-400 stroke-2" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg><span className="text-green-400">Copied!</span></>
          ) : (
            <><svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
          )}
        </button>
      </div>
      <pre className="code-block text-[11px] text-gray-300 overflow-x-auto p-3 max-h-80 overflow-y-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

export default function DevPanel({ currentStep, total, devMode = "onetime", inStoreProvider = "stripe" }: DevPanelProps) {
  const [tab, setTab] = useState<Tab>("flow");
  const stepInfo = ALL_STEPS[currentStep] ?? ALL_STEPS["idle"];

  const ONE_TIME_FLOW = [
    { key: "idle",                   label: "1. Button check",       detail: "ApplePaySession.canMakePayments()" },
    { key: "validateMerchant",       label: "2. Validate merchant",  detail: "onvalidatemerchant → POST /api/validate" },
    { key: "shippingMethodSelected", label: "3. Sheet presented",    detail: "User selects card, shipping, billing" },
    { key: "paymentAuthorized",      label: "4. Token received",     detail: "onpaymentauthorized → POST /api/process" },
    { key: "authorized",             label: "5. Complete",           detail: "completePayment(STATUS_SUCCESS)" },
  ];

  const RECURRING_FLOW = [
    { key: "authorized",                 label: "1. Prior purchase done",   detail: "One-time payment already authorized" },
    { key: "recurringValidateMerchant",  label: "2. New session",           detail: "new ApplePaySession(14, { recurringPaymentRequest })" },
    { key: "recurringSheetPresented",    label: "3. Recurring sheet",       detail: "Shows trial / regular billing to user" },
    { key: "recurringPaymentAuthorized", label: "4. Recurring token",       detail: "onpaymentauthorized → POST /api/subscribe" },
    { key: "recurringAuthorized",        label: "5. Subscription active",   detail: "Token stored, tokenNotificationURL registered" },
  ];

  const COMBINED_FLOW = [
    { key: "idle",                label: "1. Button check",        detail: "ApplePaySession.canMakePayments()" },
    { key: "validateMerchant",    label: "2. Validate merchant",   detail: "onvalidatemerchant → POST /api/validate" },
    { key: "shippingMethodSelected", label: "3. Combined sheet",   detail: "Shows products + subscription SKU in one sheet" },
    { key: "paymentAuthorized",   label: "4. Single token",        detail: "onpaymentauthorized → POST /api/purchase-with-subscription" },
    { key: "combinedAuthorized",  label: "5. Both complete",       detail: "Payment charged + subscription activated" },
  ];

  const activeFlow =
    devMode === "recurring" ? RECURRING_FLOW :
    devMode === "combined"  ? COMBINED_FLOW  : ONE_TIME_FLOW;

  const stepKeys = activeFlow.map((s) => s.key);
  const currentIndex = stepKeys.indexOf(currentStep);

  const isRecurringStep = currentStep.startsWith("recurring");
  const isCombinedStep = devMode === "combined";

  const dotColor =
    currentStep === "authorized" || currentStep === "recurringAuthorized" || currentStep === "combinedAuthorized" ? "bg-green-400" :
    isCombinedStep && currentStep !== "idle" ? "bg-indigo-400 animate-pulse" :
    isRecurringStep ? "bg-purple-400 animate-pulse" :
    currentStep === "idle" ? "bg-gray-600" : "bg-yellow-400 animate-pulse";

  const TABS: [Tab, string][] = [
    ["flow", "Flow"],
    ["setup", "HTML"],
    ["events", "Two-Session"],
    ["recurring", "Recurring"],
    ["combined", "One-Session"],
    ["instore", "In-Store"],
  ];

  const activeTabColor = (id: Tab) => {
    if (id === "combined") return "text-indigo-400 border-b-2 border-indigo-400 bg-gray-900/50";
    if (id === "recurring") return "text-purple-400 border-b-2 border-purple-400 bg-gray-900/50";
    if (id === "instore") return "text-orange-400 border-b-2 border-orange-400 bg-gray-900/50";
    return "text-blue-400 border-b-2 border-blue-400 bg-gray-900/50";
  };

  const flowColor = devMode === "combined" ? "bg-indigo-500" : devMode === "recurring" ? "bg-purple-500" : "bg-blue-500";
  const flowText = devMode === "combined" ? "text-indigo-300" : devMode === "recurring" ? "text-purple-300" : "text-blue-300";

  return (
    <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden text-sm">
      {/* Status bar */}
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
          <span className={`text-xs font-semibold ${stepInfo.color}`}>{stepInfo.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {devMode === "recurring" && (
            <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-semibold">RECURRING</span>
          )}
          {devMode === "combined" && (
            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full font-semibold">ONE-SESSION</span>
          )}
          <span className="text-[10px] text-gray-500 font-mono">${total.toFixed(2)} USD</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2.5 text-[10px] font-semibold transition-colors whitespace-nowrap px-1 ${
              tab === id ? activeTabColor(id) : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-3">
        {/* FLOW TAB */}
        {tab === "flow" && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-3 px-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                {devMode === "combined" ? "One-session flow" : devMode === "recurring" ? "Recurring flow" : "One-time flow"} — interact to see live updates
              </p>
              {devMode === "combined" && (
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-semibold border border-indigo-500/30">COMBINED</span>
              )}
              {devMode === "recurring" && (
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-semibold border border-purple-500/30">STEP 2</span>
              )}
            </div>

            {activeFlow.map((s, i) => {
              const isDone = i < currentIndex;
              const isActive = s.key === currentStep;
              const activeBg = devMode === "combined"
                ? "bg-indigo-500/10 border border-indigo-500/30"
                : devMode === "recurring"
                ? "bg-purple-500/10 border border-purple-500/30"
                : "bg-blue-500/10 border border-blue-500/30";
              const activeCircle = devMode === "combined"
                ? "bg-indigo-500 text-white animate-pulse"
                : devMode === "recurring"
                ? "bg-purple-500 text-white animate-pulse"
                : "bg-blue-500 text-white animate-pulse";

              return (
                <div key={s.key} className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                  isActive ? activeBg : isDone ? "opacity-60" : "opacity-40"
                }`}>
                  <div className={`w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold ${
                    isDone ? "bg-green-500 text-white" : isActive ? activeCircle : "bg-gray-800 text-gray-500"
                  }`}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${isActive ? "text-white" : "text-gray-400"}`}>{s.label}</p>
                    <p className="text-[10px] text-gray-600 font-mono mt-0.5">{s.detail}</p>
                  </div>
                </div>
              );
            })}

            <div className="mt-4 p-3 bg-gray-900 rounded-xl border border-gray-800">
              <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                <span className="text-gray-600">// Current event</span><br />
                <span className="text-yellow-300">session.</span>
                <span className={flowText}>
                  {currentStep === "idle" ? "canMakePayments"
                    : currentStep === "validateMerchant" || currentStep === "recurringValidateMerchant" ? "onvalidatemerchant"
                    : currentStep === "shippingMethodSelected" || currentStep === "recurringSheetPresented" ? "onshippingcontactselected"
                    : currentStep === "paymentAuthorized" || currentStep === "recurringPaymentAuthorized" ? "onpaymentauthorized"
                    : "completePayment"}
                </span>
                <span className="text-gray-500">(event)</span>
              </p>
              <p className="text-[10px] text-gray-600 mt-1.5 italic">{stepInfo.desc}</p>
            </div>

            {/* Context callout */}
            {devMode === "combined" ? (
              <div className="mt-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-[10px] text-indigo-300 font-semibold mb-1">One-session model — subscription as a SKU</p>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  The subscription is presented as a line item at checkout. A single <span className="text-white font-mono">ApplePaySession</span> carries both the one-time total and <span className="text-indigo-300 font-mono">recurringPaymentRequest</span>. The user authorizes both in one tap — ideal when the subscription is part of the initial purchase rather than a post-purchase offer.
                </p>
              </div>
            ) : (currentStep === "authorized" || devMode === "recurring") && (
              <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-[10px] text-purple-300 font-semibold mb-1">Two-session model (post-purchase upsell)</p>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  After the first session completes, launch a new <span className="text-white font-mono">ApplePaySession</span> with <span className="text-purple-300 font-mono">recurringPaymentRequest</span>. Best for upsells shown after purchase when the user has already committed.
                </p>
              </div>
            )}
          </div>
        )}

        {/* HTML TAB */}
        {tab === "setup" && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-3 px-1">HTML — button setup for both flows</p>
            <CodeBlock code={SETUP_CODE} />
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-[10px] text-yellow-300/80 font-medium mb-1">Button type matters</p>
              <ul className="text-[10px] text-yellow-200/60 space-y-0.5 list-disc list-inside">
                <li>Use <span className="font-mono">type="buy"</span> for one-time purchases and combined flows</li>
                <li>Use <span className="font-mono">type="subscribe"</span> for standalone subscription sessions</li>
                <li>Apple may reject apps using the wrong button type</li>
                <li>Domain must pass Apple Pay domain verification</li>
              </ul>
            </div>
          </div>
        )}

        {/* TWO-SESSION: ONE-TIME TAB */}
        {tab === "events" && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-3 px-1">Two-session flow · Step 1 — one-time payment</p>
            <CodeBlock code={EVENTS_CODE} />
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-[10px] text-blue-300/80 font-medium mb-2">Required Entitlements</p>
              <div className="space-y-1">
                {[
                  ["Merchant ID", "merchant.com.yourdomain.store"],
                  ["Domain file", "/.well-known/apple-developer-merchantid-domain-association"],
                  ["Certificate", "Apple Pay Payment Processing Certificate (.pem)"],
                  ["API version", "ApplePaySession(14, request) — v14+ for recurring"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-[10px] text-blue-400 font-mono shrink-0">{k}:</span>
                    <span className="text-[10px] text-gray-400 font-mono break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TWO-SESSION: RECURRING TAB */}
        {tab === "recurring" && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-2 px-1">Two-session flow · Step 2 — recurring session</p>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-2">
              <p className="text-[10px] text-purple-300 font-semibold mb-1">Key API fields (ApplePaySession v14+)</p>
              <div className="space-y-1 mt-1">
                {[
                  ["trialBilling", "Optional · shown as free/discounted first period"],
                  ["regularBilling", "Required · the amount charged every interval"],
                  ["billingAgreement", "Required · user-visible agreement text in sheet"],
                  ["managementURL", "Required · where user cancels subscription"],
                  ["tokenNotificationURL", "Recommended · Apple POSTs here on card change"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-[10px] text-purple-400 font-mono shrink-0">{k}:</span>
                    <span className="text-[10px] text-gray-400 leading-relaxed">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <CodeBlock code={RECURRING_CODE} />
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-[10px] text-green-300/80 font-semibold mb-1">Token lifecycle</p>
              <ul className="text-[10px] text-green-200/60 space-y-1 list-disc list-inside leading-relaxed">
                <li>The recurring token is <span className="text-white">not</span> the same as a one-time token — store it separately</li>
                <li>Apple calls <span className="font-mono">tokenNotificationURL</span> when the user's card is updated so you can silently update without re-auth</li>
                <li>Never charge the token before <span className="font-mono">recurringPaymentStartDate</span></li>
              </ul>
            </div>
          </div>
        )}

        {/* IN-STORE TAB */}
        {tab === "instore" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                In-store · Ingenico P400
              </p>
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                inStoreProvider === "stripe"
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                  : "bg-sky-500/20 text-sky-300 border-sky-500/30"
              }`}>
                {inStoreProvider === "stripe" ? "Stripe Terminal JS SDK" : "Braintree GraphQL API"}
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${inStoreProvider === "stripe" ? "bg-orange-500/10 border-orange-500/20" : "bg-sky-500/10 border-sky-500/20"}`}>
              <p className={`text-[10px] font-semibold mb-1.5 ${inStoreProvider === "stripe" ? "text-orange-300" : "text-sky-300"}`}>
                How in-store Apple Pay differs from online
              </p>
              <div className="space-y-1">
                {(inStoreProvider === "stripe" ? [
                  ["NFC layer",    "Stripe Terminal SDK — not the browser ApplePaySession"],
                  ["Reader",       "Ingenico P400 / BBPOS WisePOS E (Stripe-certified)"],
                  ["Auth surface", "Customer's iPhone/Watch — Face ID or Touch ID"],
                  ["Token type",   "Stripe PaymentMethod (card_present), not an Apple token"],
                  ["Vault",        "setup_future_usage: 'off_session' on the PaymentIntent"],
                  ["Subscription", "stripe.subscriptions.create() needs a generated_card PM"],
                ] : [
                  ["NFC layer",    "Braintree In-Person SDK — GraphQL mutations, not ApplePaySession"],
                  ["Reader",       "Braintree-certified readers (e.g., Ingenico Lane/3000 series)"],
                  ["Auth surface", "Customer's iPhone/Watch — Face ID or Touch ID"],
                  ["Token type",   "Braintree paymentMethodId (MULTI_USE) — unique per vault request"],
                  ["Vault",        "vaultPaymentMethodAfterTransacting: ON_SUCCESSFUL_TRANSACTION"],
                  ["Future",       "chargePaymentMethod(paymentMethodId) — MIT flag auto-applied"],
                ]).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className={`text-[10px] font-mono shrink-0 ${inStoreProvider === "stripe" ? "text-orange-400" : "text-sky-400"}`}>{k}:</span>
                    <span className="text-[10px] text-gray-400 leading-relaxed">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-1.5 mb-1">
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${inStoreProvider === "stripe" ? "text-orange-300 bg-orange-500/10 border-orange-500/20" : "text-sky-300 bg-sky-500/10 border-sky-500/20"}`}>
                Two-Session
              </span>
              <span className="text-[10px] text-gray-500 self-center">
                {inStoreProvider === "stripe" ? "— NFC purchase then browser subscription" : "— NFC charge + vault, then off-session subscription"}
              </span>
            </div>
            <CodeBlock code={inStoreProvider === "stripe" ? INSTORE_TWO_SESSION_CODE : BRAINTREE_TWO_SESSION_CODE} />

            <div className="flex gap-1.5 mt-2 mb-1">
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${inStoreProvider === "stripe" ? "text-orange-300 bg-orange-500/10 border-orange-500/20" : "text-sky-300 bg-sky-500/10 border-sky-500/20"}`}>
                One-Session
              </span>
              <span className="text-[10px] text-gray-500 self-center">
                {inStoreProvider === "stripe" ? "— single tap, saves card for subscription" : "— single tap charges + immediately activates subscription"}
              </span>
            </div>
            <CodeBlock code={inStoreProvider === "stripe" ? INSTORE_ONE_SESSION_CODE : BRAINTREE_ONE_SESSION_CODE} />

            <div className="p-3 bg-gray-800 border border-gray-700 rounded-xl">
              <p className="text-[10px] text-gray-400 font-semibold mb-1.5">
                {inStoreProvider === "stripe" ? "Required Stripe Terminal setup" : "Required Braintree setup"}
              </p>
              <div className="space-y-1">
                {(inStoreProvider === "stripe" ? [
                  ["SDK",        "npm install @stripe/terminal-js"],
                  ["Location",   "Register in Stripe Dashboard → Terminal → Locations"],
                  ["Reader",     "Ingenico P400 · register via Dashboard or API"],
                  ["Connection", "Server generates connection token (POST /terminal/connection-token)"],
                  ["Simulated",  "Use { simulated: true } in discoverReaders for testing"],
                ] : [
                  ["SDK",        "Braintree GraphQL API — no separate npm package required"],
                  ["Auth",       "HTTP Basic: base64(public_key:private_key) in Authorization header"],
                  ["Version",    "Braintree-Version: 2023-09-14 header required on all requests"],
                  ["Reader",     "Register reader in Braintree Control Panel → In-Store → Readers"],
                  ["Sandbox",    "Use payments.sandbox.braintree-api.com/graphql for testing"],
                ]).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-[10px] text-gray-500 font-mono shrink-0">{k}:</span>
                    <span className="text-[10px] text-gray-500 font-mono leading-relaxed">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ONE-SESSION: COMBINED TAB */}
        {tab === "combined" && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-2 px-1">One-session flow · subscription as a checkout SKU</p>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-2">
              <p className="text-[10px] text-indigo-300 font-semibold mb-1">How it differs from the two-session flow</p>
              <div className="space-y-1.5 mt-1">
                {[
                  ["Sessions", "1 — both payment + subscription in one ApplePaySession"],
                  ["SKU placement", "Subscription appears as a line item at checkout"],
                  ["User action", "Single tap authorizes both charges"],
                  ["Token", "One token covers both one-time and recurring"],
                  ["Best for", "Subscription offered upfront as part of the product"],
                  ["vs two-session", "Two-session is better for post-purchase upsell conversion"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-[10px] text-indigo-400 font-mono shrink-0">{k}:</span>
                    <span className="text-[10px] text-gray-400 leading-relaxed">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <CodeBlock code={COMBINED_CODE} />
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-[10px] text-amber-300/80 font-semibold mb-1">Tradeoffs to consider</p>
              <ul className="text-[10px] text-amber-200/60 space-y-1 list-disc list-inside leading-relaxed">
                <li>Subscription conversion may be lower when shown upfront vs. post-purchase</li>
                <li>Simpler backend — one endpoint handles both charges</li>
                <li>Users see full recurring terms before authorizing — better transparency</li>
                <li>No risk of user completing purchase then declining the upsell</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
