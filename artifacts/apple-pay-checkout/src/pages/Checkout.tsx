import { useState, useRef } from "react";
import ApplePaySheet from "@/components/ApplePaySheet";
import DevPanel from "@/components/DevPanel";
import OrderSummary from "@/components/OrderSummary";
import SimulationGuide from "@/components/SimulationGuide";

export type PaymentStatus = "idle" | "processing" | "success" | "failed";
export type SubStatus = "none" | "upsell" | "processing" | "success" | "declined";
export type FlowMode = "two-session" | "one-session";
export type SheetMode = "onetime" | "recurring" | "combined";

const CART_ITEMS = [
  { id: 1, name: "AirPods Pro (2nd generation)", price: 249.00, qty: 1, image: "🎧" },
  { id: 2, name: "MagSafe Charger", price: 39.00, qty: 1, image: "🔋" },
];

const TAX_RATE = 0.0875;

const APPLECAREPLUS = {
  name: "AudioHound Pro",
  description: "Unlimited streaming, offline downloads, lossless audio, and priority support.",
  trialAmount: "0.00",
  regularAmount: "9.99",
  interval: "month",
  trialLabel: "First month free",
  emoji: "🎵",
  sku: "AUDIOHOUND-PRO-MONTHLY",
};

export default function Checkout() {
  const [flowMode, setFlowMode] = useState<FlowMode>("one-session");
  const [showSheet, setShowSheet] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [subStatus, setSubStatus] = useState<SubStatus>("none");
  const [devPanelOpen, setDevPanelOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState<string>("idle");
  const [sheetMode, setSheetMode] = useState<SheetMode>("onetime");
  const [manualPayStatus, setManualPayStatus] = useState<"idle" | "processing" | "confirmed">("idle");
  const [manualSubOffer, setManualSubOffer] = useState<"hidden" | "visible" | "dismissed">("hidden");
  const manualTxId = useRef("SIM-" + Math.random().toString(36).slice(2, 10).toUpperCase()).current;

  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleFlowModeChange = (mode: FlowMode) => {
    setFlowMode(mode);
    setPaymentStatus("idle");
    setSubStatus("none");
    setCurrentStep("idle");
    setShowSheet(false);
    setManualPayStatus("idle");
    setManualSubOffer("hidden");
  };

  const handleManualPay = () => {
    setManualPayStatus("processing");
    setTimeout(() => {
      setManualPayStatus("confirmed");
      setTimeout(() => setManualSubOffer("visible"), 700);
    }, 1600);
  };

  const handleApplePayClick = () => {
    if (flowMode === "one-session") {
      setSheetMode("combined");
      setCurrentStep("validateMerchant");
    } else {
      setSheetMode("onetime");
      setCurrentStep("validateMerchant");
    }
    setShowSheet(true);
    setPaymentStatus("processing");
  };

  const handleSheetSuccess = () => {
    setShowSheet(false);
    if (sheetMode === "combined") {
      setPaymentStatus("success");
      setSubStatus("success");
      setCurrentStep("combinedAuthorized");
    } else if (sheetMode === "onetime") {
      setPaymentStatus("success");
      setCurrentStep("authorized");
      setTimeout(() => setSubStatus("upsell"), 600);
    } else {
      setSubStatus("success");
      setCurrentStep("recurringAuthorized");
    }
  };

  const handleSheetCancel = () => {
    setShowSheet(false);
    if (sheetMode === "combined" || sheetMode === "onetime") {
      setPaymentStatus("idle");
      setCurrentStep("idle");
    } else {
      setSubStatus("upsell");
      setCurrentStep("authorized");
    }
  };

  const handleSubscribeClick = () => {
    setSheetMode("recurring");
    setSubStatus("processing");
    setShowSheet(true);
    setCurrentStep("recurringValidateMerchant");
  };

  const handleReset = () => {
    setPaymentStatus("idle");
    setSubStatus("none");
    setCurrentStep("idle");
    setManualPayStatus("idle");
    setManualSubOffer("hidden");
  };

  const devMode: "onetime" | "recurring" | "combined" =
    flowMode === "one-session"
      ? "combined"
      : currentStep.startsWith("recurring") || subStatus === "success"
      ? "recurring"
      : "onetime";

  const isSuccess = paymentStatus === "success";
  const isCombinedSuccess = isSuccess && flowMode === "one-session";

  return (
    <div
      className="min-h-screen bg-[#f5f5f7]"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}
    >
      {/* Top Nav */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎵</span>
            <span className="text-gray-900 font-semibold text-base tracking-tight">AudioHound</span>
          </div>
          <span className="text-sm text-gray-500 font-medium">Secure Checkout</span>
          <div className="flex items-center gap-1 text-gray-400">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            <span className="text-xs">SSL Secured</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form + Apple Pay */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Digital Payments Simulator</h1>
              <button
                onClick={handleReset}
                disabled={paymentStatus === "idle" && manualPayStatus === "idle"}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-400 disabled:hover:border-gray-200 bg-white rounded-lg px-3 py-1.5 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>

            {/* Flow mode switcher */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex gap-1">
              {(["one-session", "two-session"] as FlowMode[]).map((mode) => {
                const active = flowMode === mode;
                const label = mode === "two-session" ? "Two-Session Flow" : "One-Session Flow";
                const sublabel = mode === "two-session" ? "Purchase → post-purchase upsell" : "Subscription as SKU at checkout";
                const activeClass = mode === "two-session"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-indigo-600 text-white shadow-sm";
                return (
                  <button
                    key={mode}
                    onClick={() => handleFlowModeChange(mode)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-left transition-all ${active ? activeClass : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                  >
                    <p className={`text-xs font-semibold leading-tight ${active ? "text-white" : "text-gray-700"}`}>{label}</p>
                    <p className={`text-[10px] mt-0.5 leading-tight ${active ? "text-white/70" : "text-gray-400"}`}>{sublabel}</p>
                  </button>
                );
              })}
            </div>

            {/* Apple Pay session rules reference grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">Apple Pay Session Rules</span>
                <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wide">Reference</span>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  {
                    scenario: "Single session: product total + recurringPaymentRequest",
                    note: "One-session flow — this simulator's combined mode",
                    allowed: true,
                    source: "Apple API",
                  },
                  {
                    scenario: "recurringPaymentRequest + automaticReloadPaymentRequest in same request",
                    note: "Results in an API error and cancels the payment request",
                    allowed: false,
                    source: "Apple API",
                  },
                  {
                    scenario: "recurringPaymentRequest + multiTokenContexts in same request",
                    note: "Results in an API error and cancels the payment request",
                    allowed: false,
                    source: "Apple API",
                  },
                  {
                    scenario: "Reusing a stored Apple Pay token for an on-session payment",
                    note: "Customer is present — must re-authorize with a fresh cryptogram",
                    allowed: false,
                    source: "Apple ToS · Stripe docs",
                  },
                ].map((row, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <span className={`mt-0.5 shrink-0 text-base leading-none ${row.allowed ? "text-green-500" : "text-red-500"}`}>
                      {row.allowed ? "✅" : "❌"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 leading-snug font-mono">{row.scenario}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{row.note}</p>
                    </div>
                    <span className="shrink-0 text-[9px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full whitespace-nowrap mt-0.5">
                      {row.source}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation guide */}
            <SimulationGuide flowMode={flowMode} />

            {/* Express Checkout */}
            {manualPayStatus === "idle" && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Express Checkout</p>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* ONE-SESSION success: combined result card */}
              {isCombinedSuccess ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 text-indigo-500 fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment + Subscription Authorized!</h3>
                  <p className="text-sm text-gray-500 mb-1">
                    Transaction:{" "}
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      sim_{Math.random().toString(36).slice(2, 10).toUpperCase()}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mb-2">${total.toFixed(2)} charged · AirPods Pro + MagSafe + AudioHound Pro</p>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full">
                    <span>🎵</span> AudioHound Pro active · $9.99/mo after trial
                  </div>
                </div>
              ) : isSuccess && flowMode === "two-session" ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 text-green-500 fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">One-Time Payment Authorized!</h3>
                  <p className="text-sm text-gray-500 mb-1">
                    Transaction ID:{" "}
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      sim_{Math.random().toString(36).slice(2, 10).toUpperCase()}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">${total.toFixed(2)} charged · AirPods Pro + MagSafe</p>
                </div>
              ) : (
                <>
                  <button
                    className="apple-pay-button-sim w-full"
                    onClick={handleApplePayClick}
                    disabled={paymentStatus === "processing"}
                  >
                    <svg viewBox="0 0 814 1000" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.5 46.4 42.7 0 109.2-49 190.5-49 30.7 0 134.4 2.9 210.7 92.3zm-209-181.3c31.3-37.2 53.7-88.1 53.7-139 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.3-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.9-71.6z" />
                    </svg>
                    <span>
                      {flowMode === "one-session" ? "Pay + Subscribe" : "Pay"}
                    </span>
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-3">
                    {flowMode === "one-session"
                      ? "Authorizes payment + AudioHound Pro subscription in one tap"
                      : "Touch ID or Face ID required · Simulated demo environment"}
                  </p>
                </>
              )}
            </div>}

            {/* TWO-SESSION: subscription upsell (appears after one-time payment) */}
            {flowMode === "two-session" && subStatus === "upsell" && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl" />
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl shrink-0 mt-0.5">
                    {APPLECAREPLUS.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{APPLECAREPLUS.name}</h3>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">ADD-ON</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{APPLECAREPLUS.description}</p>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold text-gray-900">Free</span>
                      <span className="text-sm text-gray-400">for 1 month</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      Then ${APPLECAREPLUS.regularAmount}/{APPLECAREPLUS.interval} · Cancel anytime
                    </p>
                    <button className="apple-pay-button-sim w-full" onClick={handleSubscribeClick}>
                      <svg viewBox="0 0 814 1000" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.5 46.4 42.7 0 109.2-49 190.5-49 30.7 0 134.4 2.9 210.7 92.3zm-209-181.3c31.3-37.2 53.7-88.1 53.7-139 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.3-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.9-71.6z" />
                      </svg>
                      <span>Subscribe</span>
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Uses a separate <span className="font-mono">recurringPaymentRequest</span> session
                    </p>
                    <button
                      onClick={() => { setSubStatus("declined"); setCurrentStep("authorized"); }}
                      className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
                    >
                      No thanks, skip
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription success (two-session) */}
            {flowMode === "two-session" && subStatus === "success" && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-green-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-500 fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-0.5">AudioHound Pro Activated!</h3>
                    <p className="text-sm text-gray-500">First month free · then $9.99/month</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Recurring token stored · Apple will notify your server on card updates
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reset */}
            {isSuccess && (flowMode === "one-session" || subStatus === "success" || subStatus === "declined") && (
              <div className="text-center">
                <button
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
                >
                  Reset simulation
                </button>
              </div>
            )}

            {/* Divider */}
            {!isSuccess && manualPayStatus === "idle" && (
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium">or continue below</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            )}

            {/* Shipping */}
            {!isSuccess && manualPayStatus === "idle" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Shipping Information</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">First Name</label>
                    <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-gray-50 text-gray-900" placeholder="John" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Last Name</label>
                    <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-gray-50 text-gray-900" placeholder="Appleseed" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                    <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-gray-50 text-gray-900" placeholder="john@example.com" type="email" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Address</label>
                    <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-gray-50 text-gray-900" placeholder="One Apple Park Way" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">City</label>
                    <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-gray-50 text-gray-900" placeholder="Cupertino" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">ZIP</label>
                    <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-gray-50 text-gray-900" placeholder="95014" />
                  </div>
                </div>
              </div>
            )}

            {/* Payment */}
            {!isSuccess && manualPayStatus === "idle" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Card Number</label>
                    <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-gray-50 text-gray-900 font-mono" placeholder="4242 4242 4242 4242" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Expiry</label>
                    <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-gray-50 text-gray-900 font-mono" placeholder="MM / YY" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">CVV</label>
                    <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-gray-50 text-gray-900 font-mono" placeholder="•••" />
                  </div>
                </div>
                <button
                  onClick={handleManualPay}
                  className="mt-4 w-full py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-[0.99] transition-all"
                >
                  Pay ${total.toFixed(2)}
                </button>
              </div>
            )}

            {/* Manual pay: processing spinner */}
            {manualPayStatus === "processing" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 relative">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin absolute inset-0" />
                </div>
                <p className="text-sm font-medium text-gray-900">Processing payment…</p>
                <p className="text-xs text-gray-400 mt-1">Contacting issuing bank</p>
              </div>
            )}

            {/* Manual pay: order confirmed */}
            {manualPayStatus === "confirmed" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-2xl" />
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-500 fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-0.5">Order Confirmed</h3>
                      <p className="text-xs text-gray-400 mb-4">
                        Transaction ID:{" "}
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{manualTxId}</span>
                      </p>
                      <div className="space-y-2 border-t border-gray-100 pt-3">
                        {CART_ITEMS.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.image} {item.name}</span>
                            <span className="text-gray-900 font-medium">${item.price.toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs text-gray-400 border-t border-gray-100 pt-2">
                          <span>Tax (8.75%)</span>
                          <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-gray-900">
                          <span>Total charged</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-4">
                        A receipt has been sent to <span className="text-gray-600">john@example.com</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manual pay: subscription upsell */}
            {manualPayStatus === "confirmed" && manualSubOffer === "visible" && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl" />
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl shrink-0 mt-0.5">
                    {APPLECAREPLUS.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{APPLECAREPLUS.name}</h3>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">OFFER</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{APPLECAREPLUS.description}</p>
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">First month</p>
                        <p className="text-lg font-bold text-green-600">Free</p>
                      </div>
                      <div className="text-center border-l border-gray-200">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Then</p>
                        <p className="text-lg font-bold text-gray-900">${APPLECAREPLUS.regularAmount}<span className="text-xs font-normal text-gray-400">/{APPLECAREPLUS.interval}</span></p>
                      </div>
                    </div>
                    <button
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-[0.99] transition-all"
                      onClick={() => {}}
                    >
                      Add AudioHound Pro — Free for 1 Month
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-2">Cancel anytime · no commitment</p>
                    <button
                      onClick={() => setManualSubOffer("dismissed")}
                      className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
                    >
                      No thanks
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Manual pay: reset */}
            {manualPayStatus === "confirmed" && (manualSubOffer === "dismissed" || manualSubOffer === "visible") && (
              <div className="text-center">
                <button
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
                >
                  Reset simulation
                </button>
              </div>
            )}

            {/* Developer References */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">Developer References</span>
                <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wide">Docs</span>
              </div>

              {/* Apple */}
              <div className="px-5 pt-4 pb-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Apple Developer</p>
                <div className="space-y-1">
                  {[
                    {
                      label: "Apple Pay on the Web — Overview",
                      url: "https://developer.apple.com/documentation/apple_pay_on_the_web",
                      desc: "Entry point for the Apple Pay JS API and merchant setup",
                    },
                    {
                      label: "ApplePaySession",
                      url: "https://developer.apple.com/documentation/applepayontheweb/applepaysession",
                      desc: "Core class for initiating and managing Apple Pay sessions",
                    },
                    {
                      label: "recurringPaymentRequest",
                      url: "https://developer.apple.com/documentation/applepayontheweb/applepaypaymentrequest/3955946-recurringpaymentrequest",
                      desc: "API property for setting up subscription billing in a session",
                    },
                    {
                      label: "Apple Pay Merchant Tokens (MPAN)",
                      url: "https://developer.apple.com/apple-pay/merchant-tokens/",
                      desc: "Cloud tokens for reliable recurring billing across devices",
                    },
                  ].map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <svg viewBox="0 0 814 1000" className="w-3.5 h-3.5 fill-current text-gray-400 group-hover:text-gray-700 shrink-0 mt-0.5 transition-colors" xmlns="http://www.w3.org/2000/svg">
                        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.5 46.4 42.7 0 109.2-49 190.5-49 30.7 0 134.4 2.9 210.7 92.3zm-209-181.3c31.3-37.2 53.7-88.1 53.7-139 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.3-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.9-71.6z" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-blue-600 group-hover:text-blue-700 leading-snug">{link.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{link.desc}</p>
                      </div>
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-current stroke-2 text-gray-300 group-hover:text-gray-400 shrink-0 mt-1 transition-colors" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* Stripe */}
              <div className="px-5 pt-3 pb-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Stripe</p>
                <div className="space-y-1">
                  {[
                    {
                      label: "Apple Pay Recurring Transactions",
                      url: "https://docs.stripe.com/apple-pay/apple-pay-recurring",
                      desc: "Saved payments restriction, MPAN vs DPAN, and cryptogram expiry",
                    },
                    {
                      label: "Apple Pay Merchant Tokens (Stripe)",
                      url: "https://docs.stripe.com/apple-pay/merchant-tokens",
                      desc: "How Stripe provisions and manages MPANs for subscriptions",
                    },
                    {
                      label: "Apple Pay Best Practices",
                      url: "https://docs.stripe.com/apple-pay/best-practices",
                      desc: "Authorization rate improvements and integration tips",
                    },
                  ].map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 mt-0.5 transition-colors" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="#635BFF"/>
                      </svg>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-blue-600 group-hover:text-blue-700 leading-snug">{link.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{link.desc}</p>
                      </div>
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-current stroke-2 text-gray-300 group-hover:text-gray-400 shrink-0 mt-1 transition-colors" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary + Dev Panel */}
          <div className="space-y-4">
            <OrderSummary
              items={CART_ITEMS}
              subtotal={subtotal}
              tax={tax}
              total={total}
              subscription={flowMode === "one-session" ? APPLECAREPLUS : undefined}
            />

            {/* Dev Panel Toggle */}
            <button
              onClick={() => setDevPanelOpen(!devPanelOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 text-white rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{"</>"}</span>
                <span>Developer Integration</span>
                <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-semibold">LIVE</span>
              </div>
              <svg
                viewBox="0 0 24 24"
                className={`w-4 h-4 fill-none stroke-current stroke-2 transition-transform ${devPanelOpen ? "rotate-180" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {devPanelOpen && (
              <DevPanel currentStep={currentStep} total={total} devMode={devMode} />
            )}
          </div>
        </div>
      </div>

      {/* Apple Pay Sheet */}
      {showSheet && (
        <ApplePaySheet
          items={CART_ITEMS}
          total={total}
          mode={sheetMode}
          recurringDetails={APPLECAREPLUS}
          onSuccess={handleSheetSuccess}
          onCancel={handleSheetCancel}
          onStepChange={setCurrentStep}
        />
      )}
    </div>
  );
}
