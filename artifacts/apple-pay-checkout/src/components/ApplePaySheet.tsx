import { useState, useEffect } from "react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  image: string;
}

interface RecurringDetails {
  name: string;
  trialAmount: string;
  regularAmount: string;
  interval: string;
  trialLabel: string;
  emoji: string;
}

interface ApplePaySheetProps {
  items: CartItem[];
  total: number;
  mode?: "onetime" | "recurring" | "combined";
  recurringDetails?: RecurringDetails;
  onSuccess: () => void;
  onCancel: () => void;
  onStepChange: (step: string) => void;
}

type SheetStep = "validating" | "selecting" | "authorizing" | "done";

const SIMULATED_CARD = { last4: "4242", name: "John Appleseed" };
const SIMULATED_ADDRESS = { name: "John Appleseed", street: "1 Apple Park Way", city: "Cupertino, CA 95014" };

export default function ApplePaySheet({
  items,
  total,
  mode = "onetime",
  recurringDetails,
  onSuccess,
  onCancel,
  onStepChange,
}: ApplePaySheetProps) {
  const [step, setStep] = useState<SheetStep>("validating");
  const [validationMsg, setValidationMsg] = useState("Contacting merchant...");
  const [authProgress, setAuthProgress] = useState(0);

  const tax = items.reduce((s, i) => s + i.price * i.qty, 0) * 0.0875;
  const isRecurring = mode === "recurring";
  const isCombined = mode === "combined";

  const accentColor = isCombined ? "#6366f1" : isRecurring ? "#a78bfa" : "#34d399";
  const accentBg = isCombined ? "bg-indigo-500" : isRecurring ? "bg-purple-500" : "bg-green-500";

  useEffect(() => {
    if (step === "validating") {
      if (isRecurring) onStepChange("recurringValidateMerchant");
      else onStepChange("validateMerchant");

      const t1 = setTimeout(() => setValidationMsg("Validating merchant certificate..."), 600);
      const t2 = setTimeout(() => setValidationMsg("Merchant validated ✓"), 1200);
      const t3 = setTimeout(() => {
        setStep("selecting");
        onStepChange(isRecurring ? "recurringSheetPresented" : "shippingMethodSelected");
      }, 1900);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [step]);

  const handleAuthorize = () => {
    setStep("authorizing");
    onStepChange(isRecurring ? "recurringPaymentAuthorized" : "paymentAuthorized");
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 30 + 10;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setAuthProgress(100);
        setTimeout(() => {
          setStep("done");
          setTimeout(onSuccess, 800);
        }, 400);
      }
      setAuthProgress(p);
    }, 250);
  };

  const headerLabel = isCombined ? "Pay + Subscribe" : isRecurring ? "Subscribe" : "Pay";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={step === "selecting" ? onCancel : undefined}
      />

      <div className="relative w-full sm:w-[400px] bg-[#1c1c1e] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="bg-[#2c2c2e] px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 814 1000" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.5 46.4 42.7 0 109.2-49 190.5-49 30.7 0 134.4 2.9 210.7 92.3zm-209-181.3c31.3-37.2 53.7-88.1 53.7-139 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.3-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.9-71.6z" />
            </svg>
            <span className="text-white font-semibold text-base">{headerLabel}</span>
            {isRecurring && (
              <span className="text-[10px] bg-purple-500/30 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
                RECURRING
              </span>
            )}
            {isCombined && (
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                ONE SESSION
              </span>
            )}
          </div>
          {step === "selecting" && (
            <button onClick={onCancel} className="text-gray-400 hover:text-white text-sm transition-colors">
              Cancel
            </button>
          )}
        </div>

        {/* Validating */}
        {step === "validating" && (
          <div className="px-5 py-10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 relative">
              <div
                className="w-12 h-12 rounded-full border-2 border-t-2 animate-spin absolute inset-0"
                style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }}
              />
            </div>
            <p className="text-white/80 text-sm">{validationMsg}</p>
            {isCombined && (
              <p className="text-gray-500 text-xs mt-2">Setting up payment + subscription…</p>
            )}
            {isRecurring && (
              <p className="text-gray-500 text-xs mt-2">Setting up recurring billing agreement…</p>
            )}
          </div>
        )}

        {/* Selection sheet */}
        {step === "selecting" && (
          <div className="px-5 py-5 space-y-3 overflow-y-auto flex-1">
            {/* Merchant */}
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-700 rounded-xl mx-auto mb-2 flex items-center justify-center text-2xl">
                {isRecurring ? recurringDetails?.emoji ?? "🛡️" : "🍎"}
              </div>
              <p className="text-white font-semibold text-sm">Apple Demo Store</p>
              <p className="text-gray-400 text-xs">demo.apple.com</p>
            </div>

            {/* RECURRING: subscription details only */}
            {isRecurring && recurringDetails && (
              <div className="bg-[#2c2c2e] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Subscription</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-medium">Monthly</span>
                </div>
                <p className="text-white text-sm font-semibold">{recurringDetails.name}</p>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-xs font-semibold uppercase tracking-wide">Trial Period</p>
                    <p className="text-white text-sm font-medium mt-0.5">{recurringDetails.trialLabel}</p>
                  </div>
                  <p className="text-green-300 text-lg font-bold">$0.00</p>
                </div>
                <div className="bg-[#3a3a3c] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Then</p>
                    <p className="text-white text-sm font-medium mt-0.5">Every {recurringDetails.interval}</p>
                  </div>
                  <p className="text-white text-lg font-bold">${recurringDetails.regularAmount}</p>
                </div>
                <div className="text-[10px] text-gray-500 leading-relaxed px-1">
                  By subscribing, you authorize Apple Demo Store to charge $0.00 for 1 month, then ${recurringDetails.regularAmount}/{recurringDetails.interval} until you cancel.{" "}
                  <span className="text-blue-400 underline cursor-pointer">Manage at yourdomain.com</span>.
                </div>
              </div>
            )}

            {/* ONE-TIME: products only */}
            {!isRecurring && !isCombined && (
              <div className="bg-[#2c2c2e] rounded-2xl p-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-300 truncate mr-2">{item.image} {item.name}</span>
                      <span className="text-white shrink-0">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                    <span className="text-gray-400">Tax</span>
                    <span className="text-gray-300">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-white">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* COMBINED: products + subscription SKU in one sheet */}
            {isCombined && recurringDetails && (
              <>
                {/* Products */}
                <div className="bg-[#2c2c2e] rounded-2xl p-4">
                  <p className="text-gray-400 text-xs uppercase tracking-wide font-medium mb-2">Items</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-300 truncate mr-2">{item.image} {item.name}</span>
                        <span className="text-white shrink-0">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                      <span className="text-gray-400">Tax</span>
                      <span className="text-gray-300">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-white/10 pt-2">
                      <span className="text-white">Subtotal</span>
                      <span className="text-white">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Subscription SKU */}
                <div className="bg-[#2c2c2e] rounded-2xl p-4 border border-indigo-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{recurringDetails.emoji}</span>
                      <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Subscription</span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">INCLUDED</span>
                  </div>
                  <p className="text-white text-sm font-semibold mb-3">{recurringDetails.name}</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2.5 text-center">
                      <p className="text-green-300 text-[10px] font-semibold uppercase tracking-wide">Today</p>
                      <p className="text-green-300 text-base font-bold mt-0.5">$0.00</p>
                      <p className="text-gray-500 text-[9px] mt-0.5">{recurringDetails.trialLabel}</p>
                    </div>
                    <div className="bg-[#3a3a3c] rounded-xl p-2.5 text-center">
                      <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide">After trial</p>
                      <p className="text-white text-base font-bold mt-0.5">${recurringDetails.regularAmount}</p>
                      <p className="text-gray-500 text-[9px] mt-0.5">per {recurringDetails.interval}</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 leading-relaxed mt-3 px-1">
                    Your purchase includes AudioHound Pro. $0.00 today, then ${recurringDetails.regularAmount}/{recurringDetails.interval} after your free month until cancelled.{" "}
                    <span className="text-blue-400 underline cursor-pointer">Manage at yourdomain.com</span>.
                  </p>
                </div>

                {/* Combined total */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-indigo-300 text-xs font-semibold uppercase tracking-wide">Charged Today</span>
                  <span className="text-white text-base font-bold">${total.toFixed(2)}</span>
                </div>
              </>
            )}

            {/* Payment method */}
            <div className="bg-[#2c2c2e] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Pay With</span>
                <span className="text-blue-400 text-xs font-medium cursor-pointer hover:text-blue-300">Change</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 bg-[#1a1a2e] rounded-md flex items-center justify-center">
                  <span className="text-[8px] font-bold text-blue-300">VISA</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Visa ···· {SIMULATED_CARD.last4}</p>
                  <p className="text-gray-400 text-xs">{SIMULATED_CARD.name}</p>
                </div>
              </div>
            </div>

            {/* Shipping — not for recurring-only */}
            {!isRecurring && (
              <div className="bg-[#2c2c2e] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Ship To</span>
                  <span className="text-blue-400 text-xs font-medium cursor-pointer hover:text-blue-300">Change</span>
                </div>
                <p className="text-white text-sm font-medium">{SIMULATED_ADDRESS.name}</p>
                <p className="text-gray-400 text-xs">{SIMULATED_ADDRESS.street}</p>
                <p className="text-gray-400 text-xs">{SIMULATED_ADDRESS.city}</p>
              </div>
            )}

            {/* Authorize button */}
            <button
              onClick={handleAuthorize}
              className="w-full py-4 rounded-2xl bg-white text-black font-semibold text-base flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-[0.98] transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
              {isCombined ? "Double Click to Pay + Subscribe" : isRecurring ? "Double Click to Subscribe" : "Double Click to Pay"}
            </button>
            <p className="text-center text-gray-500 text-xs pb-1">
              Simulated · No real {isRecurring ? "subscription" : "payment"} processed
            </p>
          </div>
        )}

        {/* Authorizing */}
        {step === "authorizing" && (
          <div className="px-5 py-10 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - authProgress / 100)}`}
                  style={{ transition: "stroke-dashoffset 0.25s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{Math.round(authProgress)}%</span>
              </div>
            </div>
            <p className="text-white font-medium text-sm">
              {isCombined ? "Processing payment + subscription..." : isRecurring ? "Creating billing agreement..." : "Authorizing payment..."}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {isCombined ? "Storing payment + recurring token" : isRecurring ? "Storing recurring token securely" : "Processing with issuing bank"}
            </p>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="px-5 py-10 text-center">
            <div className={`w-16 h-16 ${accentBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-white stroke-2" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold text-lg">
              {isCombined ? "Payment + Subscription Active!" : isRecurring ? "Subscribed!" : "Done"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {isCombined
                ? `$${total.toFixed(2)} charged · AudioHound Pro trial started`
                : isRecurring
                ? "Recurring token saved · Free for 30 days"
                : `$${total.toFixed(2)} authorized`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
