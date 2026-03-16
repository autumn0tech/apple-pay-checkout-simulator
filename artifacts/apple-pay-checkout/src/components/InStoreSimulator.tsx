import { useState, useEffect, useRef } from "react";

type SessionMode = "one-session" | "two-session";

type TerminalStep =
  | "idle"
  | "amount_shown"
  | "tap_detected"
  | "authorizing"
  | "purchase_approved"
  | "vaulting"
  | "sub_activating"
  | "upsell_prompt"
  | "upsell_processing"
  | "sub_authorizing"
  | "complete";

export type InStoreProvider = "stripe" | "braintree";

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

function TerminalScreen({ step, sessionMode, provider }: { step: TerminalStep; sessionMode: SessionMode; provider: InStoreProvider }) {
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

  if (step === "vaulting") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 select-none px-3">
        <div className="w-6 h-6 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-indigo-300 mt-1">Vaulting Card…</p>
        <p className="text-[10px] text-white/40 text-center leading-relaxed">
          {provider === "stripe"
            ? "Stripe stores a card_present PM via setup_future_usage: 'off_session'"
            : "Braintree vaults via vaultPaymentMethodAfterTransacting: ON_SUCCESSFUL_TRANSACTION"}
        </p>
      </div>
    );
  }

  if (step === "sub_activating") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 select-none px-3">
        <div className="w-6 h-6 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-indigo-300 mt-1">Activating Subscription…</p>
        <p className="text-[10px] text-white/40 text-center leading-relaxed">
          Server creates Subscription using vaulted PM off-session
        </p>
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

function P400Terminal({ step, sessionMode, provider }: { step: TerminalStep; sessionMode: SessionMode; provider: InStoreProvider }) {
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
              : step === "vaulting" || step === "sub_activating"
              ? "linear-gradient(135deg, #1a1040 0%, #221060 100%)"
              : step === "complete"
              ? "linear-gradient(135deg, #12103a 0%, #1a1050 100%)"
              : step === "upsell_prompt" || step === "upsell_processing"
              ? "linear-gradient(135deg, #1e1040 0%, #2a1060 100%)"
              : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            border: "1px solid rgba(255,255,255,0.05)",
            minHeight: 160,
          }}
        >
          <TerminalScreen step={step} sessionMode={sessionMode} provider={provider} />
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
                : step === "vaulting" || step === "sub_activating"
                ? "text-indigo-400"
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
                : step === "vaulting" || step === "sub_activating"
                ? "#818cf8"
                : step === "authorizing" || step === "sub_authorizing"
                ? "#f59e0b"
                : step === "tap_detected" || step === "upsell_processing"
                ? "#3b82f6"
                : "#6b7280",
            boxShadow:
              step === "purchase_approved" || step === "complete"
                ? "0 0 6px #22c55e"
                : step === "vaulting" || step === "sub_activating"
                ? "0 0 6px #818cf8"
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

const APPLE_LOGO_PATH = "M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.5 46.4 42.7 0 109.2-49 190.5-49 30.7 0 134.4 2.9 210.7 92.3zm-209-181.3c31.3-37.2 53.7-88.1 53.7-139 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.3-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.9-71.6z";

function FaceIdBrackets({ color = "rgba(255,255,255,0.7)", size = 36, thickness = 2, radius = 5 }: {
  color?: string; size?: number; thickness?: number; radius?: number;
}) {
  const arm = size * 0.28;
  const corners = [
    { top: 0, left: 0, borderTop: thickness, borderLeft: thickness, borderTopLeftRadius: radius },
    { top: 0, right: 0, borderTop: thickness, borderRight: thickness, borderTopRightRadius: radius },
    { bottom: 0, left: 0, borderBottom: thickness, borderLeft: thickness, borderBottomLeftRadius: radius },
    { bottom: 0, right: 0, borderBottom: thickness, borderRight: thickness, borderBottomRightRadius: radius },
  ];
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {corners.map((s, i) => (
        <div key={i} style={{
          position: "absolute", width: arm, height: arm,
          borderColor: color, borderStyle: "solid", borderWidth: 0,
          ...s,
        }} />
      ))}
    </div>
  );
}

function PhoneMockup({ visible, isSubscription, step }: {
  visible: boolean;
  isSubscription: boolean;
  step: TerminalStep;
}) {
  const isAuthorizing = step === "authorizing" || step === "sub_authorizing";
  const isApproved    = step === "purchase_approved" || step === "vaulting" || step === "complete";

  return (
    <div className={`transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6 pointer-events-none"}`}>
      <style>{`
        @keyframes faceIdScan {
          0%   { top: 8%;  opacity: 0.9; }
          45%  { top: 82%; opacity: 0.9; }
          50%  { top: 82%; opacity: 0;   }
          55%  { top: 8%;  opacity: 0;   }
          100% { top: 8%;  opacity: 0.9; }
        }
        @keyframes faceIdPulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1;    }
        }
        @keyframes approvedScale {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <div
        className="rounded-[22px] overflow-hidden shadow-xl relative"
        style={{ width: 138, height: 240, background: "#111113", border: "1.5px solid rgba(255,255,255,0.13)" }}
      >
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20"
          style={{ width: 46, height: 13, background: "#000", borderRadius: 8 }} />

        {/* ── FACE ID SCANNING STATE ── */}
        {isAuthorizing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: 110 }}>
            {/* Brackets with pulse */}
            <div style={{ animation: "faceIdPulse 1.4s ease-in-out infinite", position: "relative" }}>
              <FaceIdBrackets color="#ffffff" size={44} thickness={2.5} radius={6} />
              {/* Face silhouette */}
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 3,
              }}>
                {/* Eyes */}
                <div style={{ display: "flex", gap: 9, marginTop: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />
                </div>
                {/* Nose */}
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                {/* Mouth */}
                <div style={{ width: 12, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.2)", marginTop: 1 }} />
              </div>
              {/* Animated scan line */}
              <div style={{
                position: "absolute", left: "5%", right: "5%", height: 1.5,
                background: "linear-gradient(90deg, transparent, rgba(100,180,255,0.9), transparent)",
                borderRadius: 1,
                animation: "faceIdScan 2s linear infinite",
                boxShadow: "0 0 6px rgba(100,180,255,0.7)",
              }} />
            </div>
            {/* Status text */}
            <p className="text-[8px] font-semibold mt-3" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>
              {step === "sub_authorizing" ? "Double-tap to Pay" : "Look at iPhone to Pay"}
            </p>
          </div>
        )}

        {/* ── APPROVED STATE ── */}
        {isApproved && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5" style={{ paddingBottom: 100 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(52,199,89,0.15)",
              border: "1.5px solid rgba(52,199,89,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "approvedScale 0.4s cubic-bezier(.17,.67,.38,1.2) both",
            }}>
              <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "#34c759", strokeWidth: 2.5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p style={{ color: "#34c759", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em" }}>APPROVED</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 8 }}>$313.20</p>
          </div>
        )}

        {/* ── APPLE PAY SHEET (bottom) ── */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-t-[18px] overflow-hidden"
          style={{
            height: isApproved ? 96 : 118,
            background: isApproved ? "#f2f2f7" : "#f2f2f7",
            transition: "height 0.4s ease",
          }}
        >
          {/* Sheet header */}
          <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-200/80">
            <div className="flex items-center gap-1.5 mb-0.5">
              <svg viewBox="0 0 814 1000" className="w-3 h-3 fill-gray-800"><path d={APPLE_LOGO_PATH} /></svg>
              <span className="text-[9px] font-semibold text-gray-800">Pay</span>
            </div>
            <p className="text-[8px] text-gray-500">AudioHound Store</p>
          </div>

          {!isApproved && (
            <div className="px-3 py-1.5 space-y-0.5">
              <div className="flex justify-between text-[7.5px]">
                <span className="text-gray-500">AirPods Pro</span>
                <span className="text-gray-700 font-medium">$249.00</span>
              </div>
              <div className="flex justify-between text-[7.5px]">
                <span className="text-gray-500">MagSafe</span>
                <span className="text-gray-700 font-medium">$39.00</span>
              </div>
              {isSubscription && (
                <div className="flex justify-between text-[7.5px]">
                  <span className="text-indigo-600">AudioHound Pro</span>
                  <span className="text-indigo-600 font-medium">Free trial</span>
                </div>
              )}
              <div className="flex justify-between text-[7.5px] pt-0.5 border-t border-gray-200">
                <span className="text-gray-800 font-semibold">Total</span>
                <span className="text-gray-800 font-bold">$313.20</span>
              </div>
            </div>
          )}

          {/* Button */}
          <div className={`mx-3 mt-1 rounded-lg py-1.5 flex items-center justify-center gap-1 transition-colors ${
            isApproved ? "bg-green-500" : isAuthorizing ? "bg-gray-300" : "bg-black"
          }`}>
            {isApproved ? (
              <svg viewBox="0 0 24 24" style={{ width: 10, height: 10, fill: "none", stroke: "white", strokeWidth: 2.5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 814 1000" className={`w-2 h-2 ${isAuthorizing ? "fill-gray-400" : "fill-white"}`}><path d={APPLE_LOGO_PATH} /></svg>
            )}
            <span className={`text-[8px] font-semibold ${isApproved ? "text-white" : isAuthorizing ? "text-gray-400" : "text-white"}`}>
              {isApproved ? "Done" : isAuthorizing ? "Authorizing…" : "Pay"}
            </span>
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
  { step: "idle",          label: "Terminal Ready",       desc: "P400 waiting for transaction" },
  { step: "amount_shown",  label: "Amount + Sub Shown",   desc: "Cashier enters total — trial line item displayed" },
  { step: "tap_detected",  label: "NFC Tap Detected",     desc: "Customer taps iPhone / Apple Watch on reader" },
  { step: "authorizing",   label: "Face ID / Touch ID",   desc: "Apple Pay sheet on customer's device — one auth for both charge and card vault" },
  { step: "purchase_approved", label: "Payment Approved", desc: "Cryptogram verified — $313.20 captured" },
  { step: "vaulting",      label: "Card Vaulted",         desc: "Stripe stores the card_present PM via setup_future_usage: 'off_session'" },
  { step: "sub_activating",label: "Subscription Created", desc: "Server calls stripe.subscriptions.create() using the vaulted PM — no second tap needed" },
  { step: "complete",      label: "Complete",             desc: "Payment captured · card vaulted · subscription active — all from one NFC tap" },
];

interface Props {
  onStepChange?: (step: string) => void;
  provider: InStoreProvider;
  onProviderChange: (p: InStoreProvider) => void;
}

export default function InStoreSimulator({ onStepChange, provider, onProviderChange }: Props) {
  const [sessionMode, setSessionMode] = useState<SessionMode>("one-session");
  const [stepIndex, setStepIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = sessionMode === "two-session" ? TWO_SESSION_STEPS : ONE_SESSION_STEPS;
  const current = steps[stepIndex];

  const AUTO_ADVANCE: Partial<Record<TerminalStep, number>> = {
    tap_detected:    1800,
    authorizing:     3000,
    vaulting:        2400,
    sub_activating:  2800,
    sub_authorizing: 2000,
    ...(sessionMode === "one-session" ? { purchase_approved: 1200 } : {}),
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
  const phoneVisible =
    current.step === "authorizing" ||
    current.step === "sub_authorizing" ||
    (sessionMode === "one-session" && (current.step === "purchase_approved" || current.step === "vaulting"));
  const isSubAuth = current.step === "sub_authorizing";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">🖥️</span>
            <span className="text-sm font-semibold text-gray-900">In-Store · Ingenico P400</span>
            <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">NFC / Tap to Pay</span>
          </div>
          {/* Session sub-toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 shrink-0">
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
        {/* Provider toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-gray-400 font-medium shrink-0">Provider:</span>
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {(["stripe", "braintree"] as InStoreProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => onProviderChange(p)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                  provider === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {p === "stripe" ? "Stripe Terminal" : "Braintree / PayPal"}
              </button>
            ))}
          </div>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
            provider === "stripe"
              ? "bg-violet-50 text-violet-600 border-violet-200"
              : "bg-sky-50 text-sky-600 border-sky-200"
          }`}>
            {provider === "stripe" ? "Stripe Terminal JS SDK" : "Braintree GraphQL API"}
          </span>
        </div>
      </div>

      {/* Braintree consent disclosure — must appear before the NFC tap */}
      {provider === "braintree" && (
        <div className="px-5 py-3.5 bg-sky-50 border-b border-sky-100">
          <div className="flex gap-2.5 items-start">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-sky-600 stroke-2 shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-sky-800 mb-1">Consent must be captured before this tap</p>
              <p className="text-[10px] text-sky-700 leading-relaxed mb-2">
                Braintree policy: vaulting Apple Pay is only permitted when the customer explicitly consents to future merchant-initiated charges <em>during checkout</em> — before the NFC reader activates. Charging a vaulted PM when the customer is present and can authorize in real-time will result in declines.
              </p>
              <div className="bg-white border border-sky-200 rounded-lg px-3 py-2">
                <p className="text-[9px] text-sky-500 font-semibold uppercase tracking-widest mb-1">Typical checkout disclosure</p>
                <p className="text-[10px] text-gray-600 leading-relaxed italic">
                  "By saving your Apple Pay card, you authorize AudioHound to charge your stored payment method for future subscription renewals. You may cancel at any time via account settings."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Main visual area */}
        <div className="flex items-end justify-center gap-8 mb-6">
          <P400Terminal step={current.step} sessionMode={sessionMode} provider={provider} />
          <PhoneMockup visible={phoneVisible} isSubscription={isSubAuth || sessionMode === "one-session"} step={current.step} />
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
                {current.step === "idle"             ? "Start Transaction →" :
                 current.step === "amount_shown"     ? "Simulate NFC Tap →" :
                 current.step === "purchase_approved" && sessionMode === "two-session" ? "Show Subscription Offer →" :
                 current.step === "upsell_prompt"    ? "Customer Accepts →" :
                 "Next →"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recurring billing limitations — one-session only */}
      {sessionMode === "one-session" && (
        <div className="px-5 pb-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-amber-600 stroke-2 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                {provider === "stripe" ? "card_present limitations for recurring billing" : "Vaulted digital wallet limitations"}
              </p>
              <a
                href={provider === "stripe"
                  ? "https://docs.stripe.com/terminal/features/saving-payment-details/overview"
                  : "https://developer.paypal.com/braintree/in-person/guides/vaulting-and-customers/"}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[10px] text-amber-600 hover:text-amber-800 underline underline-offset-2 shrink-0"
              >
                {provider === "stripe" ? "Stripe docs ↗" : "Braintree docs ↗"}
              </a>
            </div>
            <ul className="space-y-2">
              {(provider === "stripe" ? [
                {
                  label: "card_present ≠ card",
                  detail: "The vaulted PaymentMethod is type card_present. Stripe Subscriptions require a card or generated_card PM — Stripe auto-generates one via network tokenization if the card network supports it.",
                },
                {
                  label: "Network tokenization is not guaranteed",
                  detail: "A generated_card PM is only produced if the card's network (Visa, Mastercard, etc.) and issuer support it. Cards that don't qualify cannot be billed off-session using this approach.",
                },
                {
                  label: "Apple Pay at Terminal issues a DPAN, not an MPAN",
                  detail: "In-store Apple Pay uses a Device PAN (cryptogram per tap). Online Apple Pay with recurringPaymentRequest can yield an MPAN — a persistent merchant token better suited for subscriptions.",
                },
                {
                  label: "24-hour authorization window",
                  detail: "Saved card_present tokens from digital wallets have a 24-hour auth expiry. Build re-auth logic (check authorizationExpiresAt) for any captured-later flows.",
                },
                {
                  label: "Test before going live",
                  detail: "Use Stripe's Terminal simulator (simulated: true) and confirm a generated_card is attached to the Customer after payment before building subscription activation logic.",
                },
              ] : [
                {
                  label: "Explicit customer consent required — before the tap",
                  detail: "Braintree policy: vaulting Apple Pay for recurring billing requires the customer's explicit consent to future MIT charges at checkout. Do not vault if the customer is present and able to authorize in real-time — Braintree states this will result in declines.",
                },
                {
                  label: "MIT flag auto-applied",
                  detail: "When Apple Pay, Google Pay, or Samsung Pay are tapped on a reader and vaulted, subsequent chargePaymentMethod calls automatically receive a merchant-initiated transaction (MIT) flag.",
                },
                {
                  label: "24-hour authorization expiry",
                  detail: "Vaulted digital-wallet payment methods carry a 24-hour auth window. Parse authorizationExpiresAt from the API response and build re-auth logic for any deferred capture flows.",
                },
                {
                  label: "Card-not-present pricing for future charges",
                  detail: "Future charges against a Multi-Use PaymentMethod are processed as card-not-present and receive CNP interchange rates — not the lower card-present rates from the original tap.",
                },
                {
                  label: "paymentMethodId is unique per vault request",
                  detail: "Each vaulting event produces a new paymentMethodId token. Do not use it for analytics or deduplication. Use uniqueNumberIdentifier (stable per card number) for analytics instead.",
                },
                {
                  label: "Apple Pay at reader yields DPAN, not MPAN",
                  detail: "In-store NFC tap issues a Device PAN (one-time cryptogram per tap). Online Apple Pay with recurringPaymentRequest can yield a Merchant PAN — a persistent token better suited for subscriptions.",
                },
              ]).map(({ label, detail }) => (
                <li key={label} className="flex gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0 text-[11px]">▸</span>
                  <div>
                    <span className="text-[11px] font-semibold text-amber-900">{label} — </span>
                    <span className="text-[11px] text-amber-700">{detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
        <span className="text-[10px] text-gray-400">
          {provider === "stripe"
            ? sessionMode === "two-session"
              ? "Two terminal.collectPaymentMethod calls — one per NFC tap. The subscription NFC tap triggers a second Apple Pay auth on the customer's device."
              : "One terminal.collectPaymentMethod call with setup_future_usage: 'off_session' — single NFC tap captures payment and vaults the card for server-side subscription billing."
            : sessionMode === "two-session"
              ? "Two requestChargeFromInStoreReader calls via Braintree GraphQL API. Poll the inStoreContextPayload until COMPLETE, then use chargePaymentMethod(paymentMethodId) to activate the subscription."
              : "One requestChargeFromInStoreReader with vaultPaymentMethodAfterTransacting: ON_SUCCESSFUL_TRANSACTION — single NFC tap charges the cart and vaults the card. Server immediately calls chargePaymentMethod(paymentMethodId) to activate AudioHound Pro."}
        </span>
      </div>
    </div>
  );
}
