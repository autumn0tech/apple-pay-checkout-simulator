import { useState, useEffect, useRef } from "react";

type SessionMode = "one-session" | "two-session";

type TerminalStep =
  | "idle"
  | "amount_shown"
  | "tap_detected"
  | "authorizing"
  | "purchase_approved"
  | "upsell_prompt"
  | "upsell_processing"
  | "sub_authorizing"
  | "complete";

interface StepMeta {
  screen: React.ReactNode;
  indicator: string;
  indicatorColor: string;
  action?: string;
  autoNext?: TerminalStep;
  autoDelay?: number;
}

const TOTAL = "$313.20";
const SUB_NAME = "AudioHound Pro";
const SUB_PRICE = "$9.99/mo";

function TerminalScreen({ step, sessionMode }: { step: TerminalStep; sessionMode: SessionMode }) {
  const isApproved = step === "purchase_approved" || step === "complete";
  const isSub = step === "upsell_prompt" || step === "upsell_processing" || step === "sub_authorizing";

  if (step === "idle") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-white/80 select-none">
        <div className="text-3xl mb-1">📶</div>
        <p className="text-sm font-semibold tracking-wide">Ready</p>
        <p className="text-[11px] text-white/50">Tap · Insert · Swipe</p>
      </div>
    );
  }

  if (step === "amount_shown") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1 select-none">
        <p className="text-[11px] text-white/50 uppercase tracking-widest mb-1">Total Due</p>
        <p className="text-3xl font-bold text-white tracking-tight">{TOTAL}</p>
        {sessionMode === "one-session" && (
          <p className="text-[10px] text-indigo-300 mt-1">Incl. {SUB_NAME} trial</p>
        )}
        <div className="mt-3 flex items-center gap-1.5 text-white/60 text-[11px]">
          <span>🛜</span>
          <span>Tap · Insert · Swipe</span>
        </div>
      </div>
    );
  }

  if (step === "tap_detected") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 select-none">
        <div className="w-10 h-10 rounded-full border-2 border-blue-400/60 animate-ping absolute" />
        <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
          <span className="text-base">📱</span>
        </div>
        <p className="text-xs font-semibold text-blue-300 mt-2">NFC Detected</p>
        <p className="text-[10px] text-white/40">Reading device…</p>
      </div>
    );
  }

  if (step === "authorizing" || step === "sub_authorizing") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 select-none">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-xs font-semibold text-white/80 mt-2">
          {step === "sub_authorizing" ? "Authorizing Subscription…" : "Awaiting Authorization…"}
        </p>
        <p className="text-[10px] text-white/40">Customer approving on device</p>
      </div>
    );
  }

  if (step === "purchase_approved") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 select-none">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-green-400 stroke-[2.5]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-bold text-green-400">APPROVED</p>
        <p className="text-[10px] text-white/50">{TOTAL} charged</p>
        {sessionMode === "two-session" && (
          <p className="text-[10px] text-white/30 mt-1 text-center px-2">Loading offer…</p>
        )}
      </div>
    );
  }

  if (step === "upsell_prompt") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1.5 px-3 select-none">
        <span className="text-xl mb-1">🎵</span>
        <p className="text-[11px] font-bold text-white text-center leading-snug">{SUB_NAME}</p>
        <p className="text-[10px] text-white/60 text-center">First month free · then {SUB_PRICE}</p>
        <div className="flex gap-2 mt-3 w-full">
          <div className="flex-1 bg-green-500 rounded text-[10px] font-bold text-white text-center py-1.5">YES</div>
          <div className="flex-1 bg-white/10 rounded text-[10px] font-semibold text-white/60 text-center py-1.5">NO</div>
        </div>
        <p className="text-[9px] text-white/30 mt-1">Tap YES to subscribe via Apple Pay</p>
      </div>
    );
  }

  if (step === "upsell_processing") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 select-none">
        <p className="text-xs font-semibold text-white/80">Tap phone to subscribe</p>
        <div className="flex items-center gap-1.5 text-white/50 text-[10px] mt-1">
          <span>🛜</span>
          <span>NFC ready</span>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 select-none">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-indigo-400 stroke-[2.5]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-bold text-indigo-400">
          {sessionMode === "one-session" ? "APPROVED" : "SUBSCRIBED"}
        </p>
        <p className="text-[10px] text-white/50 text-center px-2">
          {sessionMode === "one-session"
            ? `${TOTAL} · ${SUB_NAME} active`
            : `${SUB_NAME} activated · ${SUB_PRICE}`}
        </p>
      </div>
    );
  }

  return null;
}

function P400Terminal({ step, sessionMode }: { step: TerminalStep; sessionMode: SessionMode }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative rounded-[20px] shadow-2xl overflow-hidden flex flex-col"
        style={{
          width: 180,
          height: 280,
          background: "linear-gradient(160deg, #2a2a2e 0%, #1a1a1d 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="text-[8px] font-bold text-white/30 tracking-widest uppercase">Ingenico</div>
          <div className="text-[8px] text-white/20">P400</div>
        </div>

        {/* Screen */}
        <div
          className="mx-2 rounded-[10px] relative overflow-hidden flex-1"
          style={{
            background: step === "idle"
              ? "linear-gradient(135deg, #1c1c2e 0%, #16213e 100%)"
              : step === "purchase_approved"
              ? "linear-gradient(135deg, #0a2e1a 0%, #0d3321 100%)"
              : step === "complete"
              ? "linear-gradient(135deg, #12103a 0%, #1a1050 100%)"
              : step === "upsell_prompt" || step === "upsell_processing"
              ? "linear-gradient(135deg, #1e1040 0%, #2a1060 100%)"
              : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            border: "1px solid rgba(255,255,255,0.05)",
            minHeight: 160,
          }}
        >
          <TerminalScreen step={step} sessionMode={sessionMode} />
        </div>

        {/* NFC area */}
        <div className="flex items-center justify-between px-3 py-2 mt-1">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1 h-4 rounded-full bg-white/10" />
            ))}
          </div>
          <div
            className={`text-xs transition-all duration-500 ${
              step === "tap_detected" || step === "upsell_processing"
                ? "text-blue-400 animate-pulse"
                : "text-white/20"
            }`}
          >
            )))
          </div>
        </div>

        {/* Chip slot */}
        <div className="mx-2 mb-2 h-5 rounded-md border border-white/10 flex items-center justify-center">
          <div className="w-8 h-2 rounded-sm bg-white/10" />
        </div>

        {/* LED indicator */}
        <div
          className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor:
              step === "purchase_approved" || step === "complete"
                ? "#22c55e"
                : step === "authorizing" || step === "sub_authorizing"
                ? "#f59e0b"
                : step === "tap_detected" || step === "upsell_processing"
                ? "#3b82f6"
                : "#6b7280",
            boxShadow:
              step === "purchase_approved" || step === "complete"
                ? "0 0 6px #22c55e"
                : step === "authorizing" || step === "sub_authorizing"
                ? "0 0 6px #f59e0b"
                : step === "tap_detected" || step === "upsell_processing"
                ? "0 0 6px #3b82f6"
                : "none",
          }}
        />
      </div>

      {/* Base/stand */}
      <div
        className="rounded-b-lg"
        style={{ width: 140, height: 8, background: "linear-gradient(180deg,#222226,#18181b)", marginTop: -4 }}
      />
    </div>
  );
}

function PhoneMockup({ visible, isSubscription }: { visible: boolean; isSubscription: boolean }) {
  return (
    <div
      className={`transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6 pointer-events-none"}`}
    >
      <div
        className="rounded-[22px] overflow-hidden shadow-xl relative flex flex-col"
        style={{
          width: 130,
          height: 200,
          background: "#1c1c1e",
          border: "1.5px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-xl z-10" />

        {/* Apple Pay Sheet */}
        <div className="absolute bottom-0 left-0 right-0 rounded-t-[18px] overflow-hidden" style={{ height: 160, background: "#f2f2f7" }}>
          <div className="px-3 pt-3 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <svg viewBox="0 0 814 1000" className="w-3 h-3 fill-gray-800"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.5 46.4 42.7 0 109.2-49 190.5-49 30.7 0 134.4 2.9 210.7 92.3zm-209-181.3c31.3-37.2 53.7-88.1 53.7-139 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.3-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.9-71.6z" /></svg>
              <span className="text-[9px] font-semibold text-gray-800">Pay</span>
            </div>
            <p className="text-[8px] text-gray-500">AudioHound Store</p>
          </div>

          <div className="px-3 py-2 space-y-1">
            <div className="flex justify-between text-[8px]">
              <span className="text-gray-500">AirPods Pro</span>
              <span className="text-gray-800 font-medium">$249.00</span>
            </div>
            <div className="flex justify-between text-[8px]">
              <span className="text-gray-500">MagSafe</span>
              <span className="text-gray-800 font-medium">$39.00</span>
            </div>
            {isSubscription && (
              <div className="flex justify-between text-[8px]">
                <span className="text-indigo-600">AudioHound Pro</span>
                <span className="text-indigo-600 font-medium">Free trial</span>
              </div>
            )}
            <div className="flex justify-between text-[8px] pt-1 border-t border-gray-200">
              <span className="text-gray-800 font-semibold">Total</span>
              <span className="text-gray-800 font-bold">$313.20</span>
            </div>
          </div>

          <div className="mx-3 mt-1 bg-black rounded-lg py-1.5 flex items-center justify-center gap-1">
            <svg viewBox="0 0 814 1000" className="w-2.5 h-2.5 fill-white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.5 46.4 42.7 0 109.2-49 190.5-49 30.7 0 134.4 2.9 210.7 92.3zm-209-181.3c31.3-37.2 53.7-88.1 53.7-139 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.3-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.9-71.6z" /></svg>
            <span className="text-white text-[8px] font-semibold">Pay</span>
          </div>
        </div>
      </div>
      <p className="text-center text-[9px] text-gray-400 mt-1.5">Customer's iPhone</p>
    </div>
  );
}

const TWO_SESSION_STEPS: { step: TerminalStep; label: string; desc: string }[] = [
  { step: "idle",              label: "Terminal Ready",        desc: "P400 waiting for transaction" },
  { step: "amount_shown",      label: "Amount Displayed",      desc: "Cashier enters total on POS" },
  { step: "tap_detected",      label: "NFC Tap Detected",      desc: "Customer taps iPhone/Watch" },
  { step: "authorizing",       label: "Awaiting Auth",         desc: "Apple Pay sheet on customer device" },
  { step: "purchase_approved", label: "Payment Approved",      desc: "Cryptogram verified, charge succeeded" },
  { step: "upsell_prompt",     label: "Upsell Displayed",      desc: "Terminal shows subscription offer" },
  { step: "upsell_processing", label: "Sub NFC Ready",         desc: "Customer taps again for subscription" },
  { step: "sub_authorizing",   label: "Awaiting Sub Auth",     desc: "Second Apple Pay session" },
  { step: "complete",          label: "Subscription Active",   desc: "Recurring token stored, billing set" },
];

const ONE_SESSION_STEPS: { step: TerminalStep; label: string; desc: string }[] = [
  { step: "idle",         label: "Terminal Ready",       desc: "P400 waiting for transaction" },
  { step: "amount_shown", label: "Amount + Sub Shown",   desc: "Combined total with trial line item" },
  { step: "tap_detected", label: "NFC Tap Detected",     desc: "Customer taps iPhone/Watch" },
  { step: "authorizing",  label: "Awaiting Auth",        desc: "Apple Pay sheet shows payment + subscription" },
  { step: "complete",     label: "Payment + Sub Active", desc: "One tap covers charge + recurring enrollment" },
];

interface Props {
  onStepChange?: (step: string) => void;
}

export default function InStoreSimulator({ onStepChange }: Props) {
  const [sessionMode, setSessionMode] = useState<SessionMode>("one-session");
  const [stepIndex, setStepIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = sessionMode === "two-session" ? TWO_SESSION_STEPS : ONE_SESSION_STEPS;
  const current = steps[stepIndex];

  const AUTO_ADVANCE: Partial<Record<TerminalStep, number>> = {
    tap_detected: 1400,
    authorizing: 2000,
    sub_authorizing: 1800,
  };

  useEffect(() => {
    onStepChange?.(current.step);
    const delay = AUTO_ADVANCE[current.step];
    if (delay && stepIndex < steps.length - 1) {
      timerRef.current = setTimeout(() => setStepIndex((i) => i + 1), delay);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stepIndex, sessionMode]);

  const handleSessionChange = (mode: SessionMode) => {
    setSessionMode(mode);
    setStepIndex(0);
  };

  const handleReset = () => setStepIndex(0);
  const handleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
  };

  const isAutoStep = !!AUTO_ADVANCE[current.step];
  const isLast = stepIndex === steps.length - 1;
  const phoneVisible = current.step === "authorizing" || current.step === "sub_authorizing";
  const isSubAuth = current.step === "sub_authorizing";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🖥️</span>
          <span className="text-sm font-semibold text-gray-900">In-Store · Ingenico P400</span>
          <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">NFC / Tap to Pay</span>
        </div>
        {/* Session sub-toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {(["one-session", "two-session"] as SessionMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleSessionChange(m)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                sessionMode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {m === "one-session" ? "1-Session" : "2-Session"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {/* Main visual area */}
        <div className="flex items-end justify-center gap-8 mb-6">
          <P400Terminal step={current.step} sessionMode={sessionMode} />
          <PhoneMockup visible={phoneVisible} isSubscription={isSubAuth || sessionMode === "one-session"} />
        </div>

        {/* Step progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">{current.label}</p>
            <p className="text-[10px] text-gray-400">{stepIndex + 1} / {steps.length}</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1">
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: `${((stepIndex + 1) / steps.length) * 100}%`,
                background: sessionMode === "two-session" ? "#3b82f6" : "#6366f1",
              }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">{current.desc}</p>
        </div>

        {/* Step pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {steps.map((s, i) => (
            <div
              key={s.step}
              className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-all ${
                i < stepIndex
                  ? "bg-green-100 text-green-700"
                  : i === stepIndex
                  ? sessionMode === "two-session"
                    ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                    : "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < stepIndex ? "✓" : `${i + 1}`} {s.label}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={stepIndex === 0}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 disabled:opacity-30 border border-gray-200 hover:border-gray-400 disabled:hover:border-gray-200 rounded-lg px-3 py-1.5 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
          <button
            onClick={handleNext}
            disabled={isLast || isAutoStep}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg transition-all
              ${isLast
                ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                : isAutoStep
                ? "bg-gray-50 text-gray-400 border border-gray-100 cursor-wait"
                : sessionMode === "two-session"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
          >
            {isLast ? (
              <>✓ Flow Complete</>
            ) : isAutoStep ? (
              <>
                <div className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                Auto-advancing…
              </>
            ) : (
              <>
                {current.step === "idle" ? "Start Transaction" :
                 current.step === "amount_shown" ? "Simulate NFC Tap →" :
                 current.step === "purchase_approved" ? "Show Subscription Offer →" :
                 current.step === "upsell_prompt" ? "Customer Accepts →" :
                 "Next →"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
        <span className="text-[10px] text-gray-400">
          {sessionMode === "two-session"
            ? "2 separate ApplePaySession calls — one for the charge, one for the recurring enrollment"
            : "1 ApplePaySession with recurringPaymentRequest embedded in the initial request"}
        </span>
      </div>
    </div>
  );
}
