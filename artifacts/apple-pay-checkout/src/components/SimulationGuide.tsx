import { useState } from "react";

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

const STEPS: Step[] = [
  {
    number: "1",
    phase: "One-Time",
    phaseColor: "text-blue-600",
    phaseBg: "bg-blue-50",
    title: "Tap the Apple Pay button",
    description:
      'Click the black " Pay" button to start the purchase. A simulated payment sheet appears, walking through merchant validation and payment authorization for the AirPods Pro + MagSafe Charger.',
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
      "Once the one-time payment succeeds, an AppleCare+ subscription card slides in. This is the recommended post-purchase moment to offer a plan — the user's identity and payment method are already verified.",
    bullets: [
      "First month free (trial billing)",
      "Then $3.99/month, cancel anytime",
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
      "This launches a brand-new, separate ApplePaySession — Apple's hard requirement. You cannot combine a one-time charge and a subscription into the same session. The recurring sheet shows the trial period, the regular billing amount, and the billing agreement text exactly as Apple's API renders them.",
    tag: "Session 2",
    tagColor: "bg-purple-100 text-purple-700",
    bullets: [
      "No shipping address required for subscriptions",
      "trialBilling + regularBilling shown side-by-side",
      "billingAgreement text displayed to user in sheet",
    ],
  },
  {
    number: "4",
    phase: "Dev Panel",
    phaseColor: "text-gray-700",
    phaseBg: "bg-gray-100",
    title: "Watch the Developer Panel update live",
    description:
      'The panel on the right tracks every event in real time. Switch to the "Recurring" tab to see the full recurringPaymentRequest code, token lifecycle rules, and the tokenNotificationURL webhook — the endpoint Apple calls silently when a card is lost or expires, so you can update the stored token without re-asking the user.',
    bullets: [
      'Flow tab → blue steps (one-time) switch to purple (recurring)',
      "Recurring tab → copy-ready recurringPaymentRequest object",
      "tokenNotificationURL explained with backend code",
    ],
  },
];

const CALLOUTS = [
  {
    icon: "⚠️",
    color: "bg-amber-50 border-amber-200",
    labelColor: "text-amber-700",
    label: "Apple's rule",
    text: "One-time and recurring payments must use separate ApplePaySession instances. A single session cannot mix both.",
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

export default function SimulationGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Trigger bar */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors group"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-white stroke-2" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">How this simulation works</p>
          <p className="text-xs text-gray-500 mt-0.5">
            One-time payment → subscription upsell → recurring Apple Pay session · based on Apple developer docs
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-full hidden sm:block">
            Two-session flow
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
            This page simulates the complete Apple Pay integration pattern recommended by Apple's developer documentation — combining a one-time product purchase with a post-purchase subscription offer. Both use real Apple Pay JS API events so developers can see exactly how the code would behave in production.
          </p>

          {/* Steps */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Walk-through</p>
            <div className="space-y-3">
              {STEPS.map((s) => (
                <div key={s.number} className="flex gap-4">
                  {/* Left: number + phase */}
                  <div className="flex flex-col items-center gap-1 shrink-0 w-14">
                    <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                      {s.number}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${s.phaseBg} ${s.phaseColor}`}>
                      {s.phase}
                    </span>
                  </div>
                  {/* Right: content */}
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
              {CALLOUTS.map((c) => (
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
