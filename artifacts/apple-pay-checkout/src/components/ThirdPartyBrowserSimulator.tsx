import { useState, useEffect } from "react";

type TPBStep =
  | "idle"
  | "modal_shown"
  | "camera_open"
  | "qr_scanned"
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

function QRCode({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 95 95" style={{ width: size, height: size, imageRendering: "pixelated" }}>
      {QR_PATTERN.map((row, r) =>
        row.map((cell, c) =>
          cell ? <rect key={`${r}-${c}`} x={c * 5} y={r * 5} width={5} height={5} fill="#1a1a1a" /> : null
        )
      )}
    </svg>
  );
}

function FanningDotCircle({
  radius = 36,
  numDots = 12,
  dotSize = 3.5,
  active = true,
  color = "#007aff",
  cycleDuration = 1.4,
}: {
  radius?: number;
  numDots?: number;
  dotSize?: number;
  active?: boolean;
  color?: string;
  cycleDuration?: number;
}) {
  const size = (radius + dotSize) * 2;
  const center = size / 2;

  return (
    <>
      <style>{`
        @keyframes fanning-dot {
          0%, 100% { transform: scale(0.35); opacity: 0.22; }
          50%       { transform: scale(1);    opacity: 1;    }
        }
      `}</style>
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        {Array.from({ length: numDots }).map((_, i) => {
          const angleDeg = (i / numDots) * 360 - 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          const cx = center + radius * Math.cos(angleRad);
          const cy = center + radius * Math.sin(angleRad);
          const delay = (i / numDots) * cycleDuration;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: dotSize,
                height: dotSize,
                background: color,
                left: cx - dotSize / 2,
                top: cy - dotSize / 2,
                transformOrigin: "center",
                animation: active
                  ? `fanning-dot ${cycleDuration}s ease-in-out ${delay}s infinite`
                  : "none",
                opacity: active ? undefined : 0.2,
                transform: active ? undefined : "scale(0.35)",
              }}
            />
          );
        })}
      </div>
    </>
  );
}

function ChromeBrowser({ step }: { step: TPBStep }) {
  const showModal = step !== "idle";
  const isApproved = step === "approved" || step === "complete";
  const isScanned = step === "qr_scanned" || step === "sheet_open" || step === "face_id";

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#f5f5f5" }}>
      {/* Page content — dims when modal shows */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{ filter: showModal ? "brightness(0.35) blur(1.5px)" : "none" }}
      >
        {/* Chrome browser chrome */}
        <div style={{ background: "#dee1e6", height: 22 }}>
          <div className="flex items-center px-1.5 gap-0.5" style={{ height: 13, paddingTop: 2 }}>
            <div style={{ width: 48, height: 11, background: "white", borderRadius: "4px 4px 0 0", display: "flex", alignItems: "center", paddingLeft: 4, gap: 2 }}>
              <span style={{ fontSize: 4.5, color: "#555" }}>🎵</span>
              <span style={{ fontSize: 4, color: "#555" }}>AudioHound</span>
              <span style={{ fontSize: 3.5, color: "#aaa", marginLeft: "auto", marginRight: 2 }}>×</span>
            </div>
          </div>
          <div className="flex items-center gap-1 px-1.5" style={{ height: 9 }}>
            <div style={{ fontSize: 7, color: "#555" }}>←</div>
            <div style={{ fontSize: 7, color: "#aaa" }}>→</div>
            <div style={{ fontSize: 6, color: "#555" }}>↻</div>
            <div style={{ flex: 1, background: "white", borderRadius: 8, height: 6.5, display: "flex", alignItems: "center", padding: "0 4px", border: "1px solid #ccc" }}>
              <span style={{ fontSize: 4, color: "#888" }}>🔒 audiohound.com/checkout</span>
            </div>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4285f4" }} />
          </div>
        </div>
        {/* Page body */}
        <div className="px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-1 mb-1">
            <span style={{ fontSize: 7 }}>🎵</span>
            <span style={{ fontSize: 7, fontWeight: 700, color: "#1a1a1a" }}>AudioHound</span>
          </div>
          <div className="bg-white rounded p-1.5 space-y-0.5" style={{ border: "1px solid #e5e5e5" }}>
            <div className="flex justify-between" style={{ fontSize: 5.5 }}>
              <span className="text-gray-600">AirPods Pro</span><span className="font-semibold text-gray-800">$249</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: 5.5 }}>
              <span className="text-gray-600">MagSafe</span><span className="font-semibold text-gray-800">$39</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-0.5" style={{ fontSize: 5.5 }}>
              <span className="text-gray-800 font-bold">Total</span>
              <span className="text-gray-800 font-bold">$313.20</span>
            </div>
          </div>
          <div className="bg-black rounded flex items-center justify-center gap-1 py-1.5">
            <svg viewBox="0 0 814 1000" style={{ width: 6, height: 6, fill: "white" }}><path d={APPLE_LOGO_PATH} /></svg>
            <span style={{ fontSize: 5.5, color: "white", fontWeight: 700 }}>Pay with Apple Pay</span>
          </div>
        </div>
      </div>

      {/* Apple Pay QR Modal */}
      {showModal && !isApproved && (
        <div
          className="absolute rounded-xl overflow-hidden shadow-2xl"
          style={{
            inset: "8px 6px",
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 8px 8px",
            gap: 4,
          }}
        >
          <div className="flex items-center gap-1 mb-0.5">
            <svg viewBox="0 0 814 1000" style={{ width: 9, height: 9, fill: "#1a1a1a" }}><path d={APPLE_LOGO_PATH} /></svg>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: "#1a1a1a" }}>Pay</span>
          </div>
          <p style={{ fontSize: 5.5, color: "#444", textAlign: "center", lineHeight: 1.4, marginBottom: 2 }}>
            {isScanned ? "QR code detected\u2009—\u2009opening Wallet" : "Scan with your iPhone camera"}
          </p>

          {/* QR + fanning dot circle combined */}
          <div className="relative flex items-center justify-center" style={{ width: 90, height: 90 }}>
            {/* Fanning dots behind QR */}
            <div className="absolute inset-0 flex items-center justify-center">
              <FanningDotCircle
                radius={41}
                numDots={12}
                dotSize={3.2}
                active={!isScanned}
                color={isScanned ? "#34c759" : "#007aff"}
                cycleDuration={1.3}
              />
            </div>
            {/* QR code in center */}
            <div
              className="relative z-10 p-1 rounded-md"
              style={{
                background: "white",
                border: `1.5px solid ${isScanned ? "#34c759" : "#e5e5e5"}`,
                transition: "border-color 0.4s ease",
                boxShadow: isScanned ? "0 0 8px rgba(52,199,89,0.35)" : "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              <QRCode size={54} />
            </div>
          </div>

          <p style={{ fontSize: 5, color: "#888", textAlign: "center", marginTop: 2 }}>
            {isScanned ? "Redirecting to Apple Pay…" : "Point your camera at the code above"}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#4285f4" }} />
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#ea4335" }} />
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fbbc05" }} />
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#34a853" }} />
            <span style={{ fontSize: 4.5, color: "#888", marginLeft: 2 }}>Chrome · Not Safari</span>
          </div>
        </div>
      )}

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

function PhoneScreen({ step }: { step: TPBStep }) {
  const isSleeping = step === "idle" || step === "modal_shown";
  const isCamera = step === "camera_open" || step === "qr_scanned";
  const isQRScanned = step === "qr_scanned";
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

  if (isCamera) {
    return (
      <div className="w-full h-full rounded-[10px] relative overflow-hidden" style={{ background: "#111" }}>
        {/* Camera viewfinder */}
        <div className="absolute inset-0 flex flex-col items-center justify-between py-4 px-3">
          <p style={{ fontSize: 6, color: "rgba(255,255,255,0.7)", letterSpacing: "0.04em" }}>SCAN QR CODE</p>
          {/* Viewfinder box */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: 64, height: 64 }}
          >
            {/* Corner brackets */}
            {[
              { top: 0,    left: 0,    borderTop: "2px solid white", borderLeft: "2px solid white",   borderRadius: "2px 0 0 0" },
              { top: 0,    right: 0,   borderTop: "2px solid white", borderRight: "2px solid white",  borderRadius: "0 2px 0 0" },
              { bottom: 0, left: 0,    borderBottom: "2px solid white", borderLeft: "2px solid white", borderRadius: "0 0 0 2px" },
              { bottom: 0, right: 0,   borderBottom: "2px solid white", borderRight: "2px solid white",borderRadius: "0 0 2px 0" },
            ].map((s, i) => (
              <div key={i} className="absolute" style={{ width: 10, height: 10, ...s }} />
            ))}
            {/* Scan line */}
            {!isQRScanned && (
              <div
                className="absolute left-1 right-1"
                style={{
                  height: 1,
                  background: "rgba(0,122,255,0.85)",
                  animation: "scan-line 1.5s ease-in-out infinite",
                  top: "50%",
                }}
              />
            )}
            {/* QR detected overlay */}
            {isQRScanned && (
              <div
                className="absolute inset-1 rounded flex items-center justify-center"
                style={{ background: "rgba(52,199,89,0.25)", border: "1px solid #34c759" }}
              >
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "none", stroke: "#34c759", strokeWidth: 2.5 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <p style={{ fontSize: 5.5, color: "rgba(255,255,255,0.55)" }}>
            {isQRScanned ? "QR code recognised" : "Position the code in the frame"}
          </p>
        </div>
        <style>{`
          @keyframes scan-line {
            0%   { top: 10%; }
            50%  { top: 88%; }
            100% { top: 10%; }
          }
        `}</style>
      </div>
    );
  }

  if (isSheet || isApproved) {
    return (
      <div className="w-full h-full rounded-[10px] relative overflow-hidden" style={{ background: "#f2f2f7" }}>
        <div className="flex items-center justify-between px-2 pt-1" style={{ height: 14 }}>
          <span style={{ fontSize: 5.5, fontWeight: 700, color: "#1a1a1a" }}>12:41</span>
          <div className="flex items-center gap-0.5">
            <svg viewBox="0 0 24 24" style={{ width: 7, height: 7, fill: "#1a1a1a" }}>
              <rect x="0" y="10" width="4" height="14" rx="1"/><rect x="6" y="6" width="4" height="18" rx="1"/>
              <rect x="12" y="2" width="4" height="22" rx="1"/><rect x="18" y="0" width="4" height="24" rx="1"/>
            </svg>
            <svg viewBox="0 0 24 24" style={{ width: 7, height: 7 }}>
              <rect x="0" y="4" width="18" height="16" rx="2" stroke="#1a1a1a" strokeWidth="2" fill="none"/>
              <rect x="2" y="6" width={isApproved ? 14 : 10} height="12" rx="1" fill="#1a1a1a"/>
              <rect x="18" y="9" width="3" height="6" rx="1" fill="#1a1a1a"/>
            </svg>
          </div>
        </div>
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
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-gray-800">{TOTAL}</span>
              </div>
            </div>
          )}
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

const STEPS: { id: TPBStep; label: string }[] = [
  { id: "modal_shown", label: "QR Modal" },
  { id: "camera_open", label: "Camera" },
  { id: "qr_scanned",  label: "Scanned" },
  { id: "sheet_open",  label: "Sheet" },
  { id: "face_id",     label: "Face ID" },
  { id: "approved",    label: "Approved" },
];

const STEP_ORDER: TPBStep[] = [
  "modal_shown","camera_open","qr_scanned","sheet_open","face_id","approved","complete",
];

const AUTO_ADVANCE: Partial<Record<TPBStep, { next: TPBStep; delay: number }>> = {
  modal_shown: { next: "camera_open", delay: 2600 },
  camera_open: { next: "qr_scanned",  delay: 2200 },
  qr_scanned:  { next: "sheet_open",  delay: 1400 },
  sheet_open:  { next: "face_id",     delay: 1800 },
  face_id:     { next: "approved",    delay: 2200 },
  approved:    { next: "complete",    delay: 1600 },
};

export default function ThirdPartyBrowserSimulator({ onStepChange }: { onStepChange?: (step: string) => void }) {
  const [step, setStep] = useState<TPBStep>("idle");

  const advance = (next: TPBStep) => {
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
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #4285f4 0%, #34a853 50%, #ea4335 100%)" }}
          >
            <svg viewBox="0 0 814 1000" className="w-3.5 h-3.5 fill-white"><path d={APPLE_LOGO_PATH} /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Third-Party Browser</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Chrome / Firefox / Edge → QR code → iPhone authenticates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
            QR Flow
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

      {/* Stage */}
      <div className="px-4 py-5 flex items-center justify-center gap-4">

        {/* DESKTOP: CHROME MOCKUP */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">
            Chrome · Non-Safari
          </p>
          <div className="relative" style={{ width: 220 }}>
            <div
              className="rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl relative"
              style={{ background: "#2a2a2e", paddingBottom: "65%" }}
            >
              <div className="absolute inset-1 rounded-lg overflow-hidden">
                <ChromeBrowser step={step} />
              </div>
            </div>
            <div className="rounded-b-xl" style={{ height: 8, background: "linear-gradient(180deg,#4a4a4e 0%,#3a3a3e 100%)", marginTop: -1 }} />
            <div className="rounded-b-xl" style={{ height: 4, background: "#2a2a2e" }} />
          </div>
          {step === "idle" && <p className="text-[9px] text-gray-400 italic mt-0.5">Click Apple Pay to show QR</p>}
          {step !== "idle" && step !== "complete" && (
            <p className="text-[9px] font-medium mt-0.5" style={{ color: "#007aff" }}>
              {step === "modal_shown" ? "Fanning dots scanning…" :
               step === "camera_open" ? "iPhone camera open" :
               step === "qr_scanned"  ? "QR detected — opening Wallet" :
               step === "sheet_open"  ? "Sheet on iPhone" :
               step === "face_id"     ? "Awaiting Face ID…" :
               step === "approved"    ? "Payment confirmed" : ""}
            </p>
          )}
        </div>

        {/* CENTER: QR LINK */}
        <div className="flex flex-col items-center justify-center gap-1.5" style={{ width: 52 }}>
          <FanningDotCircle
            radius={20}
            numDots={8}
            dotSize={3}
            active={step === "modal_shown" || step === "camera_open"}
            color={step === "qr_scanned" || step === "sheet_open" || step === "face_id" || step === "approved" || step === "complete" ? "#34c759" : "#007aff"}
            cycleDuration={1.3}
          />
          <span
            className="text-center"
            style={{
              fontSize: 7.5,
              fontWeight: 600,
              letterSpacing: "0.04em",
              lineHeight: 1.4,
              whiteSpace: "pre-line",
              color: step === "idle" ? "#d1d5db" :
                     (step === "approved" || step === "complete") ? "#16a34a" : "#007aff",
            }}
          >
            {step === "idle" ? "QR\nLINK" :
             (step === "approved" || step === "complete") ? "AUTH\nOK" :
             "SCAN\nLINK"}
          </span>
        </div>

        {/* IPHONE MOCKUP */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">iPhone · Camera / Wallet</p>
          <div
            className="relative rounded-[18px] border-2 border-gray-800 shadow-xl overflow-hidden"
            style={{ width: 96, height: 172, background: "#1c1c1e" }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 z-10 rounded-b-xl"
              style={{ width: 28, height: 7, background: "#1c1c1e" }}
            />
            <div className="absolute inset-0">
              <PhoneScreen step={step} />
            </div>
          </div>
          {step !== "idle" && (
            <p className="text-[9px] text-gray-400 mt-0.5">
              {step === "modal_shown" ? "Sleeping" :
               step === "camera_open" ? "Camera scanning" :
               step === "qr_scanned"  ? "QR detected" :
               step === "sheet_open"  ? "Apple Pay sheet" :
               step === "face_id"     ? "Face ID scanning" :
               "Payment done"}
            </p>
          )}
        </div>
      </div>

      {/* Step timeline */}
      {step !== "idle" && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-0.5">
            {STEPS.map((s, i) => {
              const currentIdx = STEP_ORDER.indexOf(step);
              const thisIdx = STEP_ORDER.indexOf(s.id);
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
                    }`} style={{ maxWidth: 16 }} />
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
            onClick={() => advance("modal_shown")}
            className="w-full rounded-xl py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-white"
            style={{ background: "linear-gradient(90deg, #4285f4 0%, #5f6368 100%)" }}
          >
            <svg viewBox="0 0 814 1000" className="w-3.5 h-3.5 fill-white"><path d={APPLE_LOGO_PATH} /></svg>
            <span className="text-sm font-semibold">Pay with Apple Pay</span>
            <span className="text-[10px] bg-white/20 rounded px-1 py-0.5 ml-0.5">Chrome</span>
          </button>
        )}
        {isRunning && (
          <div className="flex items-center justify-center gap-2">
            <FanningDotCircle radius={8} numDots={8} dotSize={2} active color="#60a5fa" cycleDuration={1.1} />
            <span className="text-xs text-gray-400 ml-1">
              {step === "modal_shown" ? "QR modal shown — fanning dots animating…" :
               step === "camera_open" ? "iPhone camera open — scanning QR code…" :
               step === "qr_scanned"  ? "QR scanned — opening Apple Pay on iPhone…" :
               step === "sheet_open"  ? "Apple Pay sheet presented…" :
               step === "face_id"     ? "Authenticating with Face ID…" :
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
          On non-Apple browsers, <code className="font-mono bg-gray-100 px-0.5 rounded">ApplePaySession.canMakePayments()</code> returns <code className="font-mono bg-gray-100 px-0.5 rounded">false</code>.
          Apple redirects to a QR code flow — the user scans with their iPhone camera, which opens Wallet directly.
          No Bluetooth or Continuity required; the token is returned to the original session via Apple's servers.
        </p>
      </div>
    </div>
  );
}
