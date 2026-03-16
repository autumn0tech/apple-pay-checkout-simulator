import { useState } from "react";

interface DevPanelProps {
  currentStep: string;
  total: number;
  devMode?: "onetime" | "recurring";
}

type Tab = "flow" | "setup" | "events" | "recurring";

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
};

const SETUP_CODE = `<!-- 1. Add Apple Pay SDK to <head> -->
<script src="https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js"
        crossorigin="anonymous"></script>

<!-- 2. Show button only when supported -->
<script>
if (window.ApplePaySession?.canMakePayments()) {
  document.getElementById('apple-pay-btn').style.display = 'block';
  document.getElementById('apple-pay-sub-btn').style.display = 'block';
}
</script>

<!-- 3. One-time purchase button -->
<apple-pay-button id="apple-pay-btn"
  buttonstyle="black" type="buy"
  locale="en-US" onclick="startPurchaseSession()">
</apple-pay-button>

<!-- 4. Subscription button (shown after purchase) -->
<apple-pay-button id="apple-pay-sub-btn"
  buttonstyle="black" type="subscribe"
  locale="en-US" onclick="startSubscriptionSession()">
</apple-pay-button>`;

const EVENTS_CODE = `// ── ONE-TIME PAYMENT SESSION ──
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

const RECURRING_CODE = `// ── RECURRING SUBSCRIPTION SESSION ──
// Called AFTER the one-time payment succeeds
// Uses ApplePayRecurringPaymentRequest (API v14+)
function startSubscriptionSession() {
  const request = {
    countryCode: 'US',
    currencyCode: 'USD',
    merchantCapabilities: ['supports3DS'],
    supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],

    // For subscriptions, total reflects only the TRIAL amount
    total: {
      label: 'AppleCare+ for AirPods Pro',
      amount: '0.00',  // ← $0 today (trial period)
      type: 'final'
    },
    lineItems: [
      {
        label: 'First month free',
        amount: '0.00',
        type: 'final'
      }
    ],

    // ── The key: recurringPaymentRequest ──
    recurringPaymentRequest: {
      paymentDescription: 'AppleCare+ for AirPods Pro',

      // Trial billing (optional — remove if no trial)
      trialBilling: {
        label: 'AppleCare+ Trial',
        amount: '0.00',
        type: 'final',
        recurringPaymentIntervalUnit:  'month',
        recurringPaymentIntervalCount: 1,
        recurringPaymentStartDate:     new Date().toISOString(),
        recurringPaymentEndDate:       new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      },

      // Regular billing (required)
      regularBilling: {
        label: 'AppleCare+ Monthly',
        amount: '3.99',
        type: 'final',
        recurringPaymentIntervalUnit:  'month',
        recurringPaymentIntervalCount: 1,
        recurringPaymentStartDate:     new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      },

      // Shown to user as the "billing agreement" in the sheet
      billingAgreement:
        'You will be charged $0.00 today. After your free trial, ' +
        '$3.99/month will be billed until cancelled.',

      // Where user can manage their subscription
      managementURL: 'https://yourdomain.com/subscriptions',

      // Apple calls this URL when the user's card changes
      // so you can update the stored token without re-auth
      tokenNotificationURL:
        'https://yourdomain.com/api/apple-pay/token-update'
    },

    // Subscriptions don't need shipping address
    requiredBillingContactFields: ['email']
  };

  const session = new ApplePaySession(14, request);

  // Merchant validation — same as one-time
  session.onvalidatemerchant = async (event) => {
    const res = await fetch('/api/apple-pay/validate', {
      method: 'POST',
      body: JSON.stringify({ validationURL: event.validationURL }),
      headers: { 'Content-Type': 'application/json' }
    });
    session.completeMerchantValidation(await res.json());
  };

  // Recurring token received — DIFFERENT from one-time token
  // This token must be stored for future charges
  session.onpaymentauthorized = async (event) => {
    const { token } = event.payment;
    // token.paymentData   ← encrypted payment data
    // token.paymentMethod ← card info (displayName, network, type)

    const res = await fetch('/api/apple-pay/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        token,
        plan: 'applecare_plus_monthly',
        email: event.payment.billingContact?.emailAddress
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const { success, subscriptionId } = await res.json();

    session.completePayment(
      success ? ApplePaySession.STATUS_SUCCESS : ApplePaySession.STATUS_FAILURE
    );
    if (success) showSubscriptionConfirmation(subscriptionId);
  };

  session.oncancel = () => console.log('Subscription cancelled by user');
  session.begin();
}

// ── BACKEND: Token update webhook ──
// Apple calls tokenNotificationURL when card changes (lost, expired, etc.)
// POST /api/apple-pay/token-update
app.post('/api/apple-pay/token-update', async (req, res) => {
  const { token } = req.body;
  // 1. Decrypt token.paymentData with your PSP
  // 2. Update stored subscription payment method
  // 3. Respond 200 OK to Apple within 30 seconds
  res.sendStatus(200);
});`;

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

export default function DevPanel({ currentStep, total, devMode = "onetime" }: DevPanelProps) {
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

  const activeFlow = devMode === "recurring" ? RECURRING_FLOW : ONE_TIME_FLOW;
  const stepKeys = activeFlow.map((s) => s.key);
  const currentIndex = stepKeys.indexOf(currentStep);

  const isRecurringStep = currentStep.startsWith("recurring");
  const dotColor =
    currentStep === "authorized" || currentStep === "recurringAuthorized" ? "bg-green-400" :
    isRecurringStep ? "bg-purple-400 animate-pulse" :
    currentStep === "idle" ? "bg-gray-600" : "bg-yellow-400 animate-pulse";

  const TABS: [Tab, string][] = [["flow", "Flow"], ["setup", "HTML"], ["events", "One-Time"], ["recurring", "Recurring"]];

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
          <span className="text-[10px] text-gray-500 font-mono">${total.toFixed(2)} USD</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2.5 text-[10px] font-semibold transition-colors ${
              tab === id
                ? id === "recurring"
                  ? "text-purple-400 border-b-2 border-purple-400 bg-gray-900/50"
                  : "text-blue-400 border-b-2 border-blue-400 bg-gray-900/50"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-3">
        {tab === "flow" && (
          <div className="space-y-1">
            {/* Mode switcher label */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                {devMode === "recurring" ? "Recurring flow" : "One-time flow"} — interact to see live updates
              </p>
              {devMode === "recurring" && (
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-semibold border border-purple-500/30">STEP 2</span>
              )}
            </div>

            {activeFlow.map((s, i) => {
              const isDone = i < currentIndex;
              const isActive = s.key === currentStep;
              return (
                <div key={s.key} className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                  isActive
                    ? devMode === "recurring" ? "bg-purple-500/10 border border-purple-500/30" : "bg-blue-500/10 border border-blue-500/30"
                    : isDone ? "opacity-60" : "opacity-40"
                }`}>
                  <div className={`w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold ${
                    isDone ? "bg-green-500 text-white" :
                    isActive ? (devMode === "recurring" ? "bg-purple-500 text-white animate-pulse" : "bg-blue-500 text-white animate-pulse") :
                    "bg-gray-800 text-gray-500"
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
                <span className={devMode === "recurring" ? "text-purple-300" : "text-blue-300"}>
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

            {/* Explain the two-session model */}
            {(currentStep === "authorized" || devMode === "recurring") && (
              <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-[10px] text-purple-300 font-semibold mb-1">Two-session model (Apple's recommendation)</p>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Apple requires a <span className="text-white font-mono">separate</span> ApplePaySession for recurring payments. You cannot combine a one-time payment and a subscription into a single session. After the first session completes successfully, launch a new session with <span className="text-purple-300 font-mono">recurringPaymentRequest</span> populated.
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "setup" && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-3 px-1">HTML — both button types</p>
            <CodeBlock code={SETUP_CODE} />
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-[10px] text-yellow-300/80 font-medium mb-1">Button type matters for subscriptions</p>
              <ul className="text-[10px] text-yellow-200/60 space-y-0.5 list-disc list-inside">
                <li>Use <span className="font-mono">type="buy"</span> for one-time purchases</li>
                <li>Use <span className="font-mono">type="subscribe"</span> for recurring plans</li>
                <li>Apple may reject apps using the wrong button type</li>
                <li>Domain must pass Apple Pay domain verification</li>
              </ul>
            </div>
          </div>
        )}

        {tab === "events" && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-3 px-1">One-time session · all event handlers</p>
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

        {tab === "recurring" && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-2 px-1">Recurring session · recurringPaymentRequest</p>
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
                <li>Apple calls <span className="font-mono">tokenNotificationURL</span> when the user's card is updated (lost, expired) so you can silently update without re-auth</li>
                <li>Never charge the token server-side without first verifying with your PSP (Stripe, Braintree, Adyen)</li>
                <li>Respect <span className="font-mono">recurringPaymentStartDate</span> — don't charge before it</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
