import { useState } from "react";
import ApplePaySheet from "@/components/ApplePaySheet";
import DevPanel from "@/components/DevPanel";
import OrderSummary from "@/components/OrderSummary";
import SimulationGuide from "@/components/SimulationGuide";

export type PaymentStatus = "idle" | "processing" | "success" | "failed";
export type SubStatus = "none" | "upsell" | "processing" | "success" | "declined";

const CART_ITEMS = [
  { id: 1, name: "AirPods Pro (2nd generation)", price: 249.00, qty: 1, image: "🎧" },
  { id: 2, name: "MagSafe Charger", price: 39.00, qty: 1, image: "🔋" },
];

const TAX_RATE = 0.0875;

const APPLECAREPLUS = {
  name: "AppleCare+ for AirPods Pro",
  description: "Accidental damage coverage, priority support, and battery service.",
  trialAmount: "0.00",
  regularAmount: "3.99",
  interval: "month",
  trialLabel: "First month free",
  emoji: "🛡️",
};

export default function Checkout() {
  const [showSheet, setShowSheet] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [subStatus, setSubStatus] = useState<SubStatus>("none");
  const [devPanelOpen, setDevPanelOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState<string>("idle");
  const [sheetMode, setSheetMode] = useState<"onetime" | "recurring">("onetime");

  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleApplePayClick = () => {
    setSheetMode("onetime");
    setShowSheet(true);
    setPaymentStatus("processing");
    setCurrentStep("validateMerchant");
  };

  const handleSheetSuccess = () => {
    setShowSheet(false);
    if (sheetMode === "onetime") {
      setPaymentStatus("success");
      setCurrentStep("authorized");
      // After one-time payment, show subscription upsell
      setTimeout(() => setSubStatus("upsell"), 600);
    } else {
      setSubStatus("success");
      setCurrentStep("recurringAuthorized");
    }
  };

  const handleSheetCancel = () => {
    setShowSheet(false);
    if (sheetMode === "onetime") {
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
  };

  const devMode =
    currentStep.startsWith("recurring") || subStatus === "success"
      ? "recurring"
      : "onetime";

  return (
    <div
      className="min-h-screen bg-[#f5f5f7]"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}
    >
      {/* Top Nav */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 814 1000" className="w-5 h-5 fill-current text-gray-900" xmlns="http://www.w3.org/2000/svg">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.5 46.4 42.7 0 109.2-49 190.5-49 30.7 0 134.4 2.9 210.7 92.3zm-209-181.3c31.3-37.2 53.7-88.1 53.7-139 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.3-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.9-71.6z" />
            </svg>
            <span className="text-gray-900 font-medium text-base">Store</span>
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
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Checkout</h1>

            {/* Simulation guide */}
            <SimulationGuide />

            {/* Express Checkout */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Express Checkout</p>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {paymentStatus === "success" ? (
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
                    <span>Pay</span>
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Touch ID or Face ID required · Simulated demo environment
                  </p>
                </>
              )}
            </div>

            {/* ── SUBSCRIPTION UPSELL ── appears after one-time payment */}
            {subStatus === "upsell" && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 p-6 relative overflow-hidden">
                {/* Blue accent bar */}
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

                    {/* Pricing display */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold text-gray-900">Free</span>
                      <span className="text-sm text-gray-400">for 1 month</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      Then ${APPLECAREPLUS.regularAmount}/{APPLECAREPLUS.interval} · Cancel anytime
                    </p>

                    {/* Recurring Apple Pay button */}
                    <button
                      className="apple-pay-button-sim w-full"
                      onClick={handleSubscribeClick}
                    >
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

            {/* Subscription success */}
            {subStatus === "success" && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-green-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-500 fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-0.5">AppleCare+ Activated!</h3>
                    <p className="text-sm text-gray-500">First month free · then $3.99/month</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Recurring token stored · Apple will notify your server on card updates
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reset — shown after full flow done */}
            {paymentStatus === "success" && (subStatus === "success" || subStatus === "declined") && (
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
            {paymentStatus !== "success" && (
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium">or continue below</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            )}

            {/* Shipping */}
            {paymentStatus !== "success" && (
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
            {paymentStatus !== "success" && (
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
                <button className="mt-4 w-full py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-[0.99] transition-all">
                  Pay ${total.toFixed(2)}
                </button>
              </div>
            )}
          </div>

          {/* Right: Order Summary + Dev Panel */}
          <div className="space-y-4">
            <OrderSummary items={CART_ITEMS} subtotal={subtotal} tax={tax} total={total} />

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
          items={sheetMode === "onetime" ? CART_ITEMS : []}
          total={sheetMode === "onetime" ? total : 0}
          mode={sheetMode}
          recurringDetails={sheetMode === "recurring" ? APPLECAREPLUS : undefined}
          onSuccess={handleSheetSuccess}
          onCancel={handleSheetCancel}
          onStepChange={setCurrentStep}
        />
      )}
    </div>
  );
}
