import { useState, useEffect } from "react";

type CrossDeviceStep =
  | "idle"
  | "qr_shown"
  | "notified"
  | "sheet_open"
  | "face_id"
  | "approved"
  | "complete";

const APPLE_LOGO_PATH =
  "M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.5 46.4 42.7 0 109.2-49 190.5-49 30.7 0 134.4 2.9 210.7 92.3zm-209-181.3c31.3-37.2 53.7-88.1 53.7-139 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.3-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.9-71.6z";

const TOTAL = "$313.20";

const QR_PATTERN = [
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,0,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0],
  [1,1,0,1,1,0,1,0,1,0,1,1,0,1,0,1,0,1,1],
  [0,1,0,0,1,0,0,1,0,1,0,0,1,0,1,0,0,0,1],
  [1,0,1,1,0,1,1,0,1,1,1,0,0,1,0,0,1,1,0],
  [0,0,0,0,0,0,0,0,1,0,0,1,1,0,0,1,0,1,0],
  [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,0,0,1,0],
  [1,0,0,0,0,0,1,0,1,0,1,0,0,1,0,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,1,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,0,1,0,0,1,1,0],
  [1,0,1,1,1,0,1,0,0,0,1,1,0,0,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,1,1,0,0,1,1,0,1,0,1,1],
  [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,1,0,0,1],
];

function QRCode() {
  return (
    <svg viewBox="0 0 95 95" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
      {QR_PATTERN.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect key={`${r}-${c}`} x={c * 5} y={r * 5} width={5} height={5} fill="black" />
          ) : null
        )
      )}
    </svg>
  );
}

const STEPS: { id: CrossDeviceStep; label: string }[] = [
  { id: "qr_shown", label: "Handoff" },
  { id: "notified", label: "Notified" },
  { id: "sheet_open", label: "Sheet" },
  { id: "face_id", label: "Face ID" },
  { id: "approved", label: "Approved" },
];

const AUTO_ADVANCE: Partial<Record<CrossDeviceStep, { next: CrossDeviceStep; delay: number }>> = {
  qr_shown:   { next: "notified",   delay: 2600 },
  notified:   { next: "sheet_open", delay: 2000 },
  sheet_open: { next: "face_id",    delay: 1800 },
  face_id:    { next: "approved",   delay: 2200 },
  approved:   { next: "complete",   delay: 1600 },
};

function LaptopScreen({ step }: { step: CrossDeviceStep }) {
  const showModal = step !== "idle";
  const isApproved = step === "approved" || step === "complete";

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#f0f0f5" }}>
      {/* Dimmed page background */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{ filter: showModal ? "brightness(0.45) blur(1px)" : "none" }}
      >
        {/* Browser chrome */}
        <div className="h-5 bg-[#e8e8ea] flex items-center px-2 gap-1.5 border-b border-gray-300/60">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <div className="flex-1 mx-1 h-2.5 bg-white/80 rounded-sm flex items-center px-1 border border-gray-300/50">
            <span style={{ fontSize: 5, color: "#888" }}>audiohound.com/checkout</span>
          </div>
        </div>
        {/* Page */}
        <div className="px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-1 mb-2">
            <span style={{ fontSize: 7 }}>🎵</span>
            <span style={{ fontSize: 7, fontWeight: 700, color: "#1a1a1a" }}>AudioHound</span>
          </div>
          <div className="bg-white rounded p-1.5 space-y-0.5">
            <div className="flex justify-between" style={{ fontSize: 5.5 }}>
              <span className="text-gray-600">AirPods Pro</span><span className="font-semibold text-gray-800">$249</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: 5.5 }}>
              <span className="text-gray-600">MagSafe</span><span className="font-semibold text-gray-800">$39</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-0.5" style={{ fontSize: 5.5 }}>
              <span className="text-gray-800 font-bold">Total</span><span className="text-gray-800 font-bold">$313.20</span>
            </div>
          </div>
          <div className="bg-black rounded flex items-center justify-center gap-1 py-1.5">
            <svg viewBox="0 0 814 1000" style={{ width: 6, height: 6, fill: "white" }}><path d={APPLE_LOGO_PATH} /></svg>
            <span style={{ fontSize: 5.5, color: "white", fontWeight: 700 }}>Pay with Apple Pay</span>
          </div>
        </div>
      </div>

      {/* Handoff Modal */}
      {showModal && !isApproved && (
        <div
          className="absolute inset-x-3 rounded-lg overflow-hidden shadow-2xl"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(245,245,250,0.96)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(0,0,0,0.12)",
          }}
        >
          <div className="px-3 pt-2.5 pb-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <svg viewBox="0 0 814 1000" style={{ width: 9, height: 9, fill: "#1a1a1a" }}><path d={APPLE_LOGO_PATH} /></svg>
              <span style={{ fontSize: 8, fontWeight: 700, color: "#1a1a1a" }}>Pay</span>
            </div>
            <p style={{ fontSize: 6, color: "#444", marginBottom: 6 }}>Complete with iPhone</p>
            {/* QR */}
            <div className="mx-auto p-1 bg-white rounded" style={{ width: 56, height: 56 }}>
              <QRCode />
            </div>
            <p style={{ fontSize: 5, color: "#888", marginTop: 5 }}>Or bring iPhone near this Mac</p>
            <div className="flex items-center justify-center gap-0.5 mt-1.5">
              <div className={`w-1 h-1 rounded-full bg-blue-500 ${step === "qr_shown" ? "animate-bounce" : ""}`} style={{ animationDelay: "0ms" }} />
              <div className={`w-1 h-1 rounded-full bg-blue-500 ${step === "qr_shown" ? "animate-bounce" : ""}`} style={{ animationDelay: "150ms" }} />
              <div className={`w-1 h-1 rounded-full bg-blue-500 ${step === "qr_shown" ? "animate-bounce" : ""}`} style={{ animationDelay: "300ms" }} />
            </div>
            {step !== "qr_shown" && (
              <p style={{ fontSize: 5.5, color: "#007aff", marginTop: 4 }}>
                {step === "notified" ? "iPhone detected…" : step === "sheet_open" ? "Waiting for Face ID…" : step === "face_id" ? "Authenticating…" : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Approved overlay */}
      {isApproved && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: "rgba(255,255,255,0.97)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mb-1.5"
            style={{ background: "#34c759" }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "none", stroke: "white", strokeWidth: 3 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p style={{ fontSize: 7.5, fontWeight: 700, color: "#1a1a1a" }}>Payment Confirmed</p>
          <p style={{ fontSize: 5.5, color: "#666", marginTop: 2 }}>{TOTAL} · AudioHound Store</p>
        </div>
      )}
    </div>
  );
}

function ConnectionBeam({ step }: { step: CrossDeviceStep }) {
  const active = step !== "idle" && step !== "complete";
  const returning = step === "approved" || step === "complete";

  return (
    <div className="flex flex-col items-center justify-center gap-2" style={{ width: 64 }}>
      {/* BT icon */}
      <div className={`transition-all duration-500 ${active ? "text-blue-500" : "text-gray-300"}`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l4 4-4 4V2zM12 22l4-4-4-4v8zM12 6l-4 4 4 4" />
        </svg>
      </div>
      {/* Animated dashes */}
      <div className="flex flex-col items-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-0.5 rounded-full transition-all duration-300 ${active ? (returning ? "bg-green-400" : "bg-blue-400") : "bg-gray-200"}`}
            style={{
              height: 6,
              opacity: active ? 1 : 0.4,
              animation: active ? `pulse 1s ease-in-out ${i * 0.15}s infinite` : "none",
            }}
          />
        ))}
      </div>
      <span
        className={`text-center transition-colors duration-300 ${active ? (returning ? "text-green-600" : "text-blue-500") : "text-gray-300"}`}
        style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.05em", lineHeight: 1.4 }}
      >
        {step === "idle" ? "CONTINUITY" : returning ? "AUTH\nCONFIRMED" : "HAND\nOFF"}
      </span>
    </div>
  );
}

function PhoneScreen({ step }: { step: CrossDeviceStep }) {
  const isSleeping = step === "idle" || step === "qr_shown";
  const isLock = step === "notified";
  const isSheet = step === "sheet_open" || step === "face_id";
  const isApproved = step === "approved" || step === "complete";
  const isFaceId = step === "face_id";

  if (isSleeping) {
    return (
      <div className="w-full h-full bg-black rounded-[10px] flex items-end justify-center pb-3">
        <div className="w-8 h-0.5 bg-gray-700 rounded-full" />
      </div>
    );
  }

  if (isLock) {
    return (
      <div
        className="w-full h-full rounded-[10px] relative overflow-hidden flex flex-col items-center"
        style={{ background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)" }}
      >
        <div className="text-white mt-3 text-center">
          <p style={{ fontSize: 18, fontWeight: 300, letterSpacing: -1, lineHeight: 1 }}>12:41</p>
          <p style={{ fontSize: 6.5, color: "rgba(255,255,255,0.6)" }}>Friday, April 25</p>
        </div>
        {/* Notification banner */}
        <div
          className="absolute mx-1.5 rounded-xl overflow-hidden"
          style={{
            top: 42,
            left: 6,
            right: 6,
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div className="flex items-center gap-1.5 px-2 py-1.5">
            <div className="w-4 h-4 rounded bg-black flex items-center justify-center shrink-0">
              <svg viewBox="0 0 814 1000" style={{ width: 9, height: 9, fill: "white" }}><path d={APPLE_LOGO_PATH} /></svg>
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: 6, fontWeight: 700, color: "white" }}>Apple Pay</p>
              <p style={{ fontSize: 5.5, color: "rgba(255,255,255,0.8)", lineHeight: 1.3 }}>
                Double-click to pay {TOTAL}
              </p>
            </div>
          </div>
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-1.5 w-8 h-0.5 bg-white/30 rounded-full" />
      </div>
    );
  }

  if (isSheet || isApproved) {
    return (
      <div className="w-full h-full rounded-[10px] relative overflow-hidden" style={{ background: "#f2f2f7" }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-2 pt-1" style={{ height: 14 }}>
          <span style={{ fontSize: 5.5, fontWeight: 700, color: "#1a1a1a" }}>12:41</span>
          <div className="flex items-center gap-0.5">
            <svg viewBox="0 0 24 24" style={{ width: 7, height: 7, fill: "#1a1a1a" }}><rect x="0" y="10" width="4" height="14" rx="1"/><rect x="6" y="6" width="4" height="18" rx="1"/><rect x="12" y="2" width="4" height="22" rx="1"/><rect x="18" y="0" width="4" height="24" rx="1"/></svg>
            <svg viewBox="0 0 24 24" style={{ width: 7, height: 7, fill: "#1a1a1a" }}><rect x="0" y="4" width="18" height="16" rx="2" stroke="#1a1a1a" strokeWidth="2" fill="none"/><rect x="2" y="6" width={isApproved ? 14 : 10} height="12" rx="1" fill="#1a1a1a"/><rect x="18" y="9" width="3" height="6" rx="1" fill="#1a1a1a"/></svg>
          </div>
        </div>
        {/* Apple Pay Sheet */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-t-xl overflow-hidden"
          style={{ height: isApproved ? 88 : 130, background: "#f2f2f7", transition: "height 0.4s ease" }}
        >
          <div className="px-2.5 pt-2 pb-1.5 border-b border-gray-200">
            <div className="flex items-center gap-1 mb-0.5">
              <svg viewBox="0 0 814 1000" style={{ width: 7, height: 7, fill: "#1a1a1a" }}><path d={APPLE_LOGO_PATH} /></svg>
              <span style={{ fontSize: 7, fontWeight: 700, color: "#1a1a1a" }}>Pay</span>
            </div>
            <p style={{ fontSize: 5.5, color: "#666" }}>AudioHound Store</p>
          </div>

          {!isApproved && (
            <div className="px-2.5 py-1.5 space-y-0.5">
              <div className="flex justify-between" style={{ fontSize: 6 }}>
                <span className="text-gray-500">AirPods Pro</span><span className="font-semibold text-gray-800">$249</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: 6 }}>
                <span className="text-gray-500">MagSafe</span><span className="font-semibold text-gray-800">$39</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-0.5" style={{ fontSize: 6 }}>
                <span className="font-bold text-gray-800">Total</span><span className="font-bold text-gray-800">{TOTAL}</span>
              </div>
            </div>
          )}

          {/* Face ID scanner */}
          {isFaceId && !isApproved && (
            <div className="mx-2.5 mb-1.5 rounded-lg bg-blue-50 flex flex-col items-center justify-center py-2" style={{ minHeight: 36 }}>
              <div className="relative w-6 h-6 mb-0.5">
                <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-ping opacity-60" />
                <div className="absolute inset-0 border-2 border-blue-500 rounded-full" />
                <div className="absolute inset-1 border border-blue-300 rounded-full" />
                <div className="absolute inset-2 bg-blue-500/20 rounded-full" />
              </div>
              <span style={{ fontSize: 5.5, color: "#007aff", fontWeight: 600 }}>Face ID</span>
            </div>
          )}

          {/* Pay button */}
          <div className={`mx-2.5 mt-0.5 rounded-lg py-1 flex items-center justify-center gap-1 transition-colors ${
            isApproved ? "bg-green-500" : isFaceId ? "bg-gray-300" : "bg-black"
          }`}>
            {isApproved ? (
              <>
                <svg viewBox="0 0 24 24" style={{ width: 7, height: 7, fill: "none", stroke: "white", strokeWidth: 3 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ fontSize: 6.5, color: "white", fontWeight: 700 }}>Done</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 814 1000" style={{ width: 6, height: 6, fill: isFaceId ? "#999" : "white" }}><path d={APPLE_LOGO_PATH} /></svg>
                <span style={{ fontSize: 6.5, color: isFaceId ? "#999" : "white", fontWeight: 700 }}>
                  {isFaceId ? "Authorizing…" : "Pay"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div className="w-full h-full bg-black rounded-[10px]" />;
}

export default function CrossDeviceSimulator({ onStepChange }: { onStepChange?: (step: string) => void }) {
  const [step, setStep] = useState<CrossDeviceStep>("idle");

  const advance = (next: CrossDeviceStep) => {
    setStep(next);
    onStepChange?.(next);
  };

  useEffect(() => {
    const cfg = AUTO_ADVANCE[step];
    if (!cfg) return;
    const t = setTimeout(() => advance(cfg.next), cfg.delay);
    return () => clearTimeout(t);
  }, [step]);

  const handleReset = () => {
    setStep("idle");
    onStepChange?.("idle");
  };

  const isRunning = step !== "idle" && step !== "complete";
  const isDone = step === "complete";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-white stroke-2">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <path strokeLinecap="round" d="M9 7h6M9 11h6M9 15h4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Cross-Device Payment</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Desktop initiates → iPhone authenticates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
            Continuity
          </span>
          {(isRunning || isDone) && (
            <button
              onClick={handleReset}
              className="text-[10px] font-medium text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-400 rounded-lg px-2 py-0.5 transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Stage: 3-column layout */}
      <div className="px-4 py-5 flex items-center justify-center gap-3">

        {/* LAPTOP MOCKUP */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Desktop · Safari</p>
          {/* Laptop outer body */}
          <div
            className="relative"
            style={{ width: 220 }}
          >
            {/* Screen bezel */}
            <div
              className="rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl relative"
              style={{ background: "#2a2a2e", paddingBottom: "65%" }}
            >
              <div className="absolute inset-1 rounded-lg overflow-hidden">
                <LaptopScreen step={step} />
              </div>
            </div>
            {/* Laptop chin */}
            <div
              className="rounded-b-xl"
              style={{ height: 8, background: "linear-gradient(180deg, #4a4a4e 0%, #3a3a3e 100%)", marginTop: -1 }}
            />
            <div
              className="rounded-b-xl"
              style={{ height: 4, background: "#2a2a2e", marginTop: 0 }}
            />
          </div>
          {/* Click-to-pay instruction */}
          {step === "idle" && (
            <p className="text-[9px] text-gray-400 italic mt-0.5">Click Apple Pay to begin</p>
          )}
          {step !== "idle" && step !== "complete" && (
            <p className="text-[9px] text-blue-500 font-medium mt-0.5">
              {step === "qr_shown" ? "Waiting for iPhone…" :
               step === "notified" ? "iPhone detected nearby" :
               step === "sheet_open" ? "Sheet presented on iPhone" :
               step === "face_id" ? "Awaiting authentication…" :
               step === "approved" ? "Payment confirmed" : ""}
            </p>
          )}
        </div>

        {/* CONNECTION BEAM */}
        <ConnectionBeam step={step} />

        {/* iPHONE MOCKUP */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">iPhone · Wallet</p>
          <div
            className="relative rounded-[18px] border-2 border-gray-800 shadow-xl overflow-hidden"
            style={{ width: 96, height: 172, background: "#1c1c1e" }}
          >
            {/* Notch */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 z-10 rounded-b-xl"
              style={{ width: 28, height: 7, background: "#1c1c1e" }}
            />
            {/* Screen content */}
            <div className="absolute inset-0">
              <PhoneScreen step={step} />
            </div>
          </div>
          {step !== "idle" && (
            <p className="text-[9px] text-gray-400 mt-0.5">
              {step === "qr_shown" ? "Sleeping" :
               step === "notified" ? "Lock screen" :
               step === "sheet_open" ? "Apple Pay sheet" :
               step === "face_id" ? "Face ID scanning" :
               "Payment done"}
            </p>
          )}
        </div>
      </div>

      {/* Step timeline */}
      {step !== "idle" && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const stepOrder: CrossDeviceStep[] = ["qr_shown","notified","sheet_open","face_id","approved","complete"];
              const currentIdx = stepOrder.indexOf(step);
              const thisIdx = stepOrder.indexOf(s.id);
              const isPast = thisIdx < currentIdx;
              const isCurrent = thisIdx === currentIdx;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-0.5 flex-1">
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isPast || isDone ? "bg-green-500" : isCurrent ? "bg-blue-500 animate-pulse" : "bg-gray-200"
                    }`} />
                    <span className={`text-[8px] font-medium text-center leading-tight ${
                      isPast || isDone ? "text-green-600" : isCurrent ? "text-blue-500" : "text-gray-400"
                    }`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 transition-colors duration-500 -mt-3 ${
                      isPast || isDone ? "bg-green-400" : "bg-gray-200"
                    }`} style={{ maxWidth: 24 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="border-t border-gray-100 px-5 py-4">
        {step === "idle" && (
          <button
            onClick={() => advance("qr_shown")}
            className="w-full bg-black text-white rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
          >
            <svg viewBox="0 0 814 1000" className="w-3.5 h-3.5 fill-white"><path d={APPLE_LOGO_PATH} /></svg>
            <span className="text-sm font-semibold">Pay with Apple Pay</span>
          </button>
        )}
        {isRunning && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="text-xs text-gray-400 ml-1">
              {step === "qr_shown" ? "Detecting iPhone via Bluetooth…" :
               step === "notified" ? "iPhone received notification…" :
               step === "sheet_open" ? "Apple Pay sheet presented…" :
               step === "face_id" ? "Authenticating with Face ID…" :
               "Confirming payment…"}
            </span>
          </div>
        )}
        {isDone && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-green-600 stroke-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-green-700">Payment Complete · {TOTAL}</span>
          </div>
        )}
      </div>

      {/* Info strip */}
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-2.5 flex items-start gap-2">
        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-gray-400 stroke-2 shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4M12 16h.01" />
        </svg>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Apple Pay Continuity works on macOS Safari when an iPhone on the same iCloud account is nearby via Bluetooth.
          The <code className="font-mono bg-gray-100 px-0.5 rounded">ApplePaySession</code> API is identical to online flows — the OS handles the cross-device handoff transparently.
        </p>
      </div>
    </div>
  );
}
