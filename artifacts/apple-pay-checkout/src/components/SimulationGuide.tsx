import { useState } from "react";
import type { FlowMode } from "@/pages/Checkout";

interface Step {
  number: string;
  phase: string;
  phaseColor: string;
  phaseBg: string;
  title: string;
  description: string;
  tag?: string;
  tagColor?: string;
  bullets?: string[];
}

const TWO_SESSION_STEPS: Step[] = [
  {
    number: "1",
    phase: "One-Time",
    phaseColor: "text-blue-600",
    phaseBg: "bg-blue-50",
    title: "Tap the Apple Pay button",
    description:
      'Click the black "Pay" button to start the purchase. A simulated payment sheet walks through merchant validation and authorization for the AirPods Pro + MagSafe Charger.',
    tag: "Session 1",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    number: "2",
    phase: "Upsell",
    phaseColor: "text-orange-600",
    phaseBg: "bg-orange-50",
    title: "Subscription offer appears automatically",
    description:
      "Once the one-time payment succeeds, an AudioHound Pro card slides in. This is the recommended post-purchase moment to offer a subscription — the user's identity and payment method are already verified.",
    bullets: [
      "First month free (trial billing)",
      "Then $9.99/month, cancel anytime",
      "Powered by recurringPaymentRequest",
    ],
  },
  {
    number: "3",
    phase: "Recurring",
    phaseColor: "text-purple-600",
    phaseBg: "bg-purple-50",
    title: 'Tap "Subscribe with Apple Pay"',
    description:
      "This launches a brand-new, separate ApplePaySession — Apple's requirement for subscriptions offered as post-purchase upsells. The recurring sheet shows trial period, regular billing, and the billing agreement text.",
    tag: "Session 2",
    tagColor: "bg-purple-100 text-purple-700",
    bullets: [
      "No shipping address required for subscriptions",
      "trialBilling + regularBilling shown side-by-side",
      "billingAgreement text displayed in sheet",
    ],
  },
  {
    number: "4",
    phase: "Dev Panel",
    phaseColor: "text-gray-700",
    phaseBg: "bg-gray-100",
    title: "Watch the Developer Panel update live",
    description:
      'The panel on the right tracks every event in real time. Switch to "Two-Session" or "Recurring" tabs for copy-ready code, token lifecycle rules, and the tokenNotificationURL webhook explanation.',
    bullets: [
      "Flow tab → blue steps (one-time) switch to purple (recurring)",
      "Two-Session tab → one-time session code",
      "Recurring tab → full recurringPaymentRequest object",
    ],
  },
];

const ONE_SESSION_STEPS: Step[] = [
  {
    number: "1",
    phase: "SKU Setup",
    phaseColor: "text-indigo-600",
    phaseBg: "bg-indigo-50",
    title: "AudioHound Pro appears as a subscription SKU",
    description:
      "In one-session mode, the AudioHound Pro subscription is a line item in the Order Summary — just like a product. It's shown with a SUBSCRIPTION badge, the SKU code, trial pricing, and recurring amount before the user ever taps Apple Pay.",
    tag: "Checkout time",
    tagColor: "bg-indigo-100 text-indigo-700",
    bullets: [
      "SKU: AUDIOHOUND-PRO-MONTHLY",
      "Trial price displayed as $0.00",
      "Recurring terms visible before authorizing",
    ],
  },
  {
    number: "2",
    phase: "One Session",
    phaseColor: "text-indigo-600",
    phaseBg: "bg-indigo-50",
    title: 'Tap "Pay + Subscribe"',
    description:
      'A single ApplePaySession carries both the product total and a recurringPaymentRequest. The payment sheet shows the items, the subscription terms side-by-side, and the billing agreement — all in one view.',
    tag: "Single session",
    tagColor: "bg-indigo-100 text-indigo-700",
    bullets: [
      "recurringPaymentRequest included in the initial session",
      "Subscription SKU appears as a $0.00 line item",
      "User authorizes both purchase + recurring in one tap",
    ],
  },
  {
    number: "3",
    phase: "Authorized",
    phaseColor: "text-green-600",
    phaseBg: "bg-green-50",
    title: "Payment + subscription active in one step",
    description:
      "A single onpaymentauthorized event fires. Your backend receives the token, charges the product amount, and activates the subscription. No second session or post-purchase step needed.",
    bullets: [
      "One token covers both the charge and the subscription",
      "Single POST /api/purchase-with-subscription endpoint",
      "tokenNotificationURL still recommended for card updates",
    ],
  },
  {
    number: "4",
    phase: "Dev Panel",
    phaseColor: "text-gray-700",
    phaseBg: "bg-gray-100",
    title: "See the one-session code in the Developer Panel",
    description:
      'Switch to the "One-Session" tab in the panel for the full combined session code, tradeoff analysis vs. two-session, and the backend endpoint pattern.',
    bullets: [
      "One-Session tab → combined session code with recurringPaymentRequest",
      "Tradeoffs section → conversion rate vs. simplicity comparison",
      "Backend endpoint handles both charge + subscription activation",
    ],
  },
];

const TWO_SESSION_CALLOUTS = [
  {
    icon: "⚠️",
    color: "bg-amber-50 border-amber-200",
    labelColor: "text-amber-700",
    label: "Apple's rule for post-purchase upsells",
    text: "When offering a subscription after a one-time purchase, Apple requires a separate ApplePaySession. One session cannot mix an already-completed payment with a new recurring auth.",
  },
  {
    icon: "🔑",
    color: "bg-purple-50 border-purple-200",
    labelColor: "text-purple-700",
    label: "Recurring token",
    text: "The token returned for a subscription is different from a one-time token. Store it separately and never charge it before recurringPaymentStartDate.",
  },
  {
    icon: "🔔",
    color: "bg-blue-50 border-blue-200",
    labelColor: "text-blue-700",
    label: "tokenNotificationURL",
    text: "Register this webhook so Apple can silently push updated card tokens when a user's card changes — no re-auth needed.",
  },
];

const ONE_SESSION_CALLOUTS = [
  {
    icon: "✅",
    color: "bg-indigo-50 border-indigo-200",
    labelColor: "text-indigo-700",
    label: "One session — both authorized together",
    text: "Including recurringPaymentRequest in the initial checkout session is valid when the subscription is part of the product offering, not an afterthought. The user sees everything upfront.",
  },
  {
    icon: "📊",
    color: "bg-amber-50 border-amber-200",
    labelColor: "text-amber-700",
    label: "Conversion tradeoff",
    text: "Post-purchase upsells (two-session) typically convert better because the user has already committed to buying. One-session is simpler to implement and offers full transparency.",
  },
  {
    icon: "🔔",
    color: "bg-blue-50 border-blue-200",
    labelColor: "text-blue-700",
    label: "tokenNotificationURL still required",
    text: "Even in one-session flows, register the tokenNotificationURL webhook. Apple calls it when a card changes so you can update stored tokens without re-asking the user.",
  },
];

interface SimulationGuideProps {
  flowMode?: FlowMode;
}

export default function SimulationGuide({ flowMode = "two-session" }: SimulationGuideProps) {
  const [open, setOpen] = useState(false);

  const isOneSession = flowMode === "one-session";
  const steps = isOneSession ? ONE_SESSION_STEPS : TWO_SESSION_STEPS;
  const callouts = isOneSession ? ONE_SESSION_CALLOUTS : TWO_SESSION_CALLOUTS;

  const badge = isOneSession ? "Online: One-session flow" : "Online: Two-session flow";
  const badgeClass = isOneSession
    ? "bg-indigo-100 text-indigo-700 border-indigo-200/80"
    : "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200/80";
  const subtitle = isOneSession
    ? "Subscription as checkout SKU → single Apple Pay session authorizes payment + recurring"
    : "One-time payment → subscription upsell → recurring Apple Pay session · based on Apple developer docs";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Trigger bar */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors group"
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isOneSession ? "bg-indigo-600" : "bg-gradient-to-br from-blue-500 to-purple-600"}`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-white stroke-2" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">How this simulation works</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full hidden sm:block ${badgeClass}`}>
            {badge}
          </span>
          <svg
            viewBox="0 0 24 24"
            className={`w-4 h-4 fill-none stroke-gray-400 stroke-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-6">
          {/* Intro */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {isOneSession
              ? "This mode simulates the one-session Apple Pay flow — AudioHound Pro is presented as a subscription SKU at checkout rather than a post-purchase upsell. A single ApplePaySession handles both the product payment and the subscription setup in one user action."
              : "This page simulates the complete Apple Pay integration pattern recommended by Apple's developer documentation — combining a one-time product purchase with a post-purchase subscription offer. Both use real Apple Pay JS API events so developers can see exactly how the code would behave in production."}
          </p>

          {/* Steps */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Walk-through</p>
            <div className="space-y-3">
              {steps.map((s) => (
                <div key={s.number} className="flex gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0 w-14">
                    <div className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center ${isOneSession ? "bg-indigo-700" : "bg-gray-900"}`}>
                      {s.number}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${s.phaseBg} ${s.phaseColor}`}>
                      {s.phase}
                    </span>
                  </div>
                  <div className="flex-1 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                      {s.tag && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.tagColor}`}>
                          {s.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">{s.description}</p>
                    {s.bullets && (
                      <ul className="space-y-0.5">
                        {s.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-1.5 text-xs text-gray-500">
                            <span className="text-gray-300 mt-0.5 shrink-0">›</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Callouts */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Key rules from Apple docs</p>
            <div className="space-y-2">
              {callouts.map((c) => (
                <div key={c.label} className={`flex gap-3 p-3 rounded-xl border ${c.color}`}>
                  <span className="text-base shrink-0 leading-none mt-0.5">{c.icon}</span>
                  <div>
                    <p className={`text-xs font-semibold mb-0.5 ${c.labelColor}`}>{c.label}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <p className="text-[11px] text-gray-400">
              Based on <span className="font-mono">ApplePaySession</span> v14 · <span className="font-mono">recurringPaymentRequest</span> API
            </p>
            <a
              href="https://developer.apple.com/documentation/apple_pay_on_the_web/applepaypaymentrequest/2928612-recurringpaymentrequest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-500 hover:text-blue-600 font-medium flex items-center gap-0.5 transition-colors"
            >
              Apple docs
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Collapse guide
          </button>
        </div>
      )}
    </div>
  );
}
