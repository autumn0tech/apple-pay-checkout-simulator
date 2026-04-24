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

/* ── Apple Circular Pay Code ──────────────────────────────────────────── */
/*
  Mimics Apple's proprietary radial dot code shown in WWDC24 / the
  third-party browser QR sheet:
  - The Apple Pay  logo at center
  - Dense concentric rings of alternating-fill dots radiating outward
  - "Fanning" wave animation pulses ring-by-ring from center out
*/
function ApplePayCode({
  size = 120,
  scanning = true,
  scanned = false,
}: {
  size?: number;
  scanning?: boolean;
  scanned?: boolean;
}) {
  const cx = size / 2;
  const cy = size / 2;

  // Ring specs: [dotCount, radiusFraction, dotRadius, baseOpacity]
  const rings: [number, number, number, number][] = [
    [10,  0.14, 2.2, 1   ],
    [16,  0.22, 2.2, 0.95],
    [22,  0.30, 2.0, 0.9 ],
    [30,  0.38, 2.0, 0.85],
    [38,  0.46, 1.8, 0.8 ],
    [48,  0.55, 1.6, 0.75],
    [58,  0.63, 1.5, 0.7 ],
    [68,  0.71, 1.4, 0.65],
    [80,  0.80, 1.3, 0.6 ],
    [90,  0.88, 1.2, 0.55],
  ];

  const waveDelay = 0.13; // seconds per ring
  const cycleDuration = rings.length * waveDelay + 0.6;

  const dotColor = scanned ? "#34c759" : "#1a1a1a";
  const centerLogoColor = scanned ? "#34c759" : "#1a1a1a";

  return (
    <>
      <style>{`
        @keyframes ap-ring-pulse {
          0%, 100% { transform: scale(1);    opacity: var(--base-opacity); }
          50%       { transform: scale(1.55); opacity: 1;                  }
        }
      `}</style>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size, overflow: "visible" }}
      >
        {/* Outer boundary ring */}
        <circle
          cx={cx} cy={cy}
          r={size * 0.95 / 2}
          fill="none"
          stroke={dotColor}
          strokeWidth={size * 0.012}
          opacity={0.25}
        />

        {/* Dot rings */}
        {rings.map(([n, rFrac, dotR, baseOpacity], ringIdx) => {
          const radius = (size / 2) * rFrac;
          const animDelay = ringIdx * waveDelay;
          return Array.from({ length: n }).map((_, dotIdx) => {
            // Alternate fill/empty pattern for data-like appearance
            const fill = (dotIdx + ringIdx) % 3 !== 1;
            const angleDeg = (dotIdx / n) * 360;
            const angleRad = ((angleDeg - 90) * Math.PI) / 180;
            const dx = cx + radius * Math.cos(angleRad);
            const dy = cy + radius * Math.sin(angleRad);
            return (
              <circle
                key={`r${ringIdx}-d${dotIdx}`}
                cx={dx}
                cy={dy}
                r={dotR * (fill ? 1 : 0.5)}
                fill={dotColor}
                opacity={fill ? baseOpacity : baseOpacity * 0.35}
                style={
                  scanning
                    ? {
                        transformOrigin: `${dx}px ${dy}px`,
                        ["--base-opacity" as string]: baseOpacity,
                        animation: `ap-ring-pulse ${cycleDuration}s ease-in-out ${animDelay}s infinite`,
                      }
                    : undefined
                }
              />
            );
          });
        })}

        {/* White center disc */}
        <circle cx={cx} cy={cy} r={size * 0.10} fill="white" />

        {/* Apple Pay logo in center */}
        <g transform={`translate(${cx - size * 0.06}, ${cy - size * 0.07}) scale(${(size * 0.12) / 814})`}>
          <path d={APPLE_LOGO_PATH} fill={centerLogoColor} />
        </g>
        <text
          x={cx}
          y={cy + size * 0.115}
          textAnchor="middle"
          fontSize={size * 0.07}
          fontWeight={700}
          fontFamily="-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif"
          fill={centerLogoColor}
        >
          Pay
        </text>
      </svg>
    </>
  );
}

/* ── Desktop Chrome mockup ─────────────────────────────────────────────── */
function ChromeBrowser({ step }: { step: TPBStep }) {
  const showModal = step !== "idle";
  const isScanned = step === "qr_scanned" || step === "sheet_open" || step === "face_id";
  const isApproved = step === "approved" || step === "complete";
  const scanning = step === "modal_shown" || step === "camera_open";

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#f5f5f5" }}>

      {/* ── Checkout page (dims when modal open) ── */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{ filter: showModal ? "brightness(0.3) blur(1px)" : "none" }}
      >
        {/* Chrome tab bar */}
        <div style={{ background: "#dee1e6", height: 22 }}>
          <div className="flex items-center px-1.5 gap-0.5" style={{ height: 13, paddingTop: 2 }}>
            <div style={{ width: 52, height: 11, background: "white", borderRadius: "4px 4px 0 0", display: "flex", alignItems: "center", paddingLeft: 4, gap: 2 }}>
              <span style={{ fontSize: 4.5, color: "#555" }}>🎵</span>
              <span style={{ fontSize: 4, color: "#555" }}>AudioHound</span>
              <span style={{ fontSize: 3.5, color: "#aaa", marginLeft: "auto", marginRight: 2 }}>×</span>
            </div>
          </div>
          <div className="flex items-center gap-1 px-1.5" style={{ height: 9 }}>
            <span style={{ fontSize: 7, color: "#555" }}>←</span>
            <span style={{ fontSize: 7, color: "#aaa" }}>→</span>
            <span style={{ fontSize: 6, color: "#555" }}>↻</span>
            <div style={{ flex: 1, background: "white", borderRadius: 8, height: 6.5, display: "flex", alignItems: "center", padding: "0 4px", border: "1px solid #ccc" }}>
              <span style={{ fontSize: 4, color: "#888" }}>🔒 audiohound.com/checkout</span>
            </div>
          </div>
        </div>
        {/* Checkout body */}
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
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-gray-800">$313.20</span>
            </div>
          </div>
          <div className="bg-black rounded flex items-center justify-center gap-1 py-1.5">
            <svg viewBox="0 0 814 1000" style={{ width: 6, height: 6, fill: "white" }}><path d={APPLE_LOGO_PATH} /></svg>
            <span style={{ fontSize: 5.5, color: "white", fontWeight: 700 }}>Pay with Apple Pay</span>
          </div>
        </div>
      </div>

      {/* ── Apple's "Scan Code with iPhone" modal ── */}
      {showModal && !isApproved && (
        <div
          className="absolute rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center"
          style={{
            inset: "6px 5px",
            background: "white",
            border: "1px solid rgba(0,0,0,0.08)",
            padding: "10px 10px 8px",
            gap: 0,
          }}
        >
          {/* Modal header — "Scan Code with iPhone" */}
          <p style={{ fontSize: 8.5, fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.25, marginBottom: 3 }}>
            {isScanned ? "Opening Apple Pay…" : "Scan Code with iPhone"}
          </p>

          {/* The circular Apple Pay code */}
          <div
            className="flex items-center justify-center rounded-2xl"
            style={{
              padding: 8,
              background: "white",
              border: isScanned ? "1.5px solid #34c759" : "1.5px solid #e5e7eb",
              boxShadow: isScanned ? "0 0 10px rgba(52,199,89,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
              transition: "border-color 0.4s, box-shadow 0.4s",
            }}
          >
            <ApplePayCode size={88} scanning={scanning} scanned={isScanned} />
          </div>

          {/* Sub-text */}
          <p style={{ fontSize: 5.5, color: "#6b7280", textAlign: "center", lineHeight: 1.45, marginTop: 4, maxWidth: 140 }}>
            {isScanned
              ? "QR code recognised — opening Wallet on iPhone"
              : "Use the Camera app to make your Apple Pay purchase on your iPhone. Requires iOS\u00a018 or later."}
          </p>

          {/* Orange Apple Pay badge — matches Apple's design */}
          {!isScanned && (
            <div
              className="flex items-center gap-1 mt-3 rounded-full px-2.5 py-1"
              style={{ background: "#ff9500" }}
            >
              <svg viewBox="0 0 814 1000" style={{ width: 6, height: 6, fill: "white" }}><path d={APPLE_LOGO_PATH} /></svg>
              <span style={{ fontSize: 6, fontWeight: 700, color: "white", letterSpacing: "0.01em" }}>Apple Pay →</span>
            </div>
          )}
        </div>
      )}

      {/* ── Success overlay ── */}
      {isApproved && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "white" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1.5" style={{ background: "#34c759" }}>
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

/* ── iPhone screen ─────────────────────────────────────────────────────── */
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
        {/* Camera viewfinder mode */}
        <div className="absolute inset-0 flex flex-col items-center justify-between py-3 px-2">
          <p style={{ fontSize: 6, color: "rgba(255,255,255,0.7)", letterSpacing: "0.04em" }}>SCAN CODE</p>

          {/* Viewfinder with Apple circular code preview */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: 70, height: 70 }}
          >
            {/* Yellow iOS camera scan brackets */}
            {[
              { top: 0,    left: 0,    borderTop: "2px solid #ffd60a", borderLeft: "2px solid #ffd60a",    borderRadius: "3px 0 0 0" },
              { top: 0,    right: 0,   borderTop: "2px solid #ffd60a", borderRight: "2px solid #ffd60a",   borderRadius: "0 3px 0 0" },
              { bottom: 0, left: 0,    borderBottom: "2px solid #ffd60a", borderLeft: "2px solid #ffd60a",  borderRadius: "0 0 0 3px" },
              { bottom: 0, right: 0,   borderBottom: "2px solid #ffd60a", borderRight: "2px solid #ffd60a", borderRadius: "0 0 3px 0" },
            ].map((s, i) => (
              <div key={i} className="absolute" style={{ width: 12, height: 12, ...s }} />
            ))}

            {!isQRScanned ? (
              /* Show the Apple circular code inside the viewfinder */
              <div className="opacity-70">
                <ApplePayCode size={48} scanning={false} scanned={false} />
              </div>
            ) : (
              /* Scanned: green success overlay */
              <div
                className="absolute inset-1 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(52,199,89,0.18)", border: "1.5px solid #34c759" }}
              >
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "none", stroke: "#34c759", strokeWidth: 2.5 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          <p style={{ fontSize: 5, color: "rgba(255,255,255,0.5)" }}>
            {isQRScanned ? "Code recognised" : "Point camera at the Apple Pay code"}
          </p>
        </div>
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
          style={{ height: isApproved ? 86 : 128, background: "#f2f2f7", transition: "height 0.4s ease" }}
        >
          <div className="px-2.5 pt-2 pb-1 border-b border-gray-200">
            <div className="flex items-center gap-1 mb-0.5">
              <svg viewBox="0 0 814 1000" style={{ width: 7, height: 7, fill: "#1a1a1a" }}><path d={APPLE_LOGO_PATH} /></svg>
              <span style={{ fontSize: 7, fontWeight: 700, color: "#1a1a1a" }}>Pay</span>
            </div>
            <p style={{ fontSize: 5.5, color: "#666" }}>AudioHound Store</p>
          </div>
          {!isApproved && (
            <div className="px-2.5 py-1 space-y-0.5">
              <div className="flex justify-between" style={{ fontSize: 5.5 }}>
                <span className="text-gray-500">AirPods Pro</span><span className="font-semibold text-gray-800">$249</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: 5.5 }}>
                <span className="text-gray-500">MagSafe</span><span className="font-semibold text-gray-800">$39</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-0.5" style={{ fontSize: 5.5 }}>
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-gray-800">{TOTAL}</span>
              </div>
            </div>
          )}
          {isFaceId && !isApproved && (
            <div className="mx-2.5 mb-1 rounded-lg bg-blue-50 flex flex-col items-center justify-center py-2" style={{ minHeight: 32 }}>
              <div className="relative w-5 h-5 mb-0.5">
                <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-ping opacity-60" />
                <div className="absolute inset-0 border-2 border-blue-500 rounded-full" />
              </div>
              <span style={{ fontSize: 5.5, color: "#007aff", fontWeight: 600 }}>Face ID</span>
            </div>
          )}
          <div className={`mx-2.5 mt-0.5 rounded-lg py-1 flex items-center justify-center gap-1 transition-colors ${isApproved ? "bg-green-500" : isFaceId ? "bg-gray-300" : "bg-black"}`}>
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

/* ── Step timeline data ────────────────────────────────────────────────── */
const STEPS: { id: TPBStep; label: string }[] = [
  { id: "modal_shown", label: "Code Shown" },
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
  modal_shown: { next: "camera_open", delay: 2800 },
  camera_open: { next: "qr_scanned",  delay: 2400 },
  qr_scanned:  { next: "sheet_open",  delay: 1200 },
  sheet_open:  { next: "face_id",     delay: 1800 },
  face_id:     { next: "approved",    delay: 2200 },
  approved:    { next: "complete",    delay: 1600 },
};

/* ── Small fanning-dot spinner for the center connector ────────────────── */
function FanningDotSpinner({ active, scanned }: { active: boolean; scanned: boolean }) {
  const n = 8;
  const r = 10;
  const d = 2.5;
  const size = (r + d) * 2 + 2;
  const center = size / 2;
  return (
    <>
      <style>{`
        @keyframes fan-spin {
          0%, 100% { transform: scale(0.3); opacity: 0.2; }
          50%       { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {Array.from({ length: n }).map((_, i) => {
          const ang = ((i / n) * 360 - 90) * (Math.PI / 180);
          const x = center + r * Math.cos(ang);
          const y = center + r * Math.sin(ang);
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: d, height: d,
                background: scanned ? "#34c759" : "#007aff",
                left: x - d / 2, top: y - d / 2,
                transformOrigin: "center",
                animation: active ? `fan-spin 1.2s ease-in-out ${(i / n) * 1.2}s infinite` : "none",
                opacity: active ? undefined : 0.2,
                transform: active ? undefined : "scale(0.3)",
              }}
            />
          );
        })}
      </div>
    </>
  );
}

/* ── Main exported component ───────────────────────────────────────────── */
export default function ThirdPartyBrowserSimulator({ onStepChange }: { onStepChange?: (step: string) => void }) {
  const [step, setStep] = useState<TPBStep>("idle");

  const advance = (next: TPBStep) => { setStep(next); onStepChange?.(next); };

  useEffect(() => {
    const cfg = AUTO_ADVANCE[step];
    if (!cfg) return;
    const t = setTimeout(() => advance(cfg.next), cfg.delay);
    return () => clearTimeout(t);
  }, [step]);

  const handleReset = () => { setStep("idle"); onStepChange?.("idle"); };

  const isRunning = step !== "idle" && step !== "complete";
  const isDone = step === "complete";
  const isScanned = step === "qr_scanned" || step === "sheet_open" || step === "face_id" || step === "approved" || step === "complete";
  const spinnerActive = step === "modal_shown" || step === "camera_open";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#ff9500" }}
          >
            <svg viewBox="0 0 814 1000" className="w-3.5 h-3.5 fill-white"><path d={APPLE_LOGO_PATH} /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Third-Party Browser</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Chrome / Firefox / Edge → Apple circular code → iPhone authenticates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
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

      {/* ── Stage ── */}
      <div className="px-4 py-5 flex items-center justify-center gap-4">

        {/* DESKTOP: Chrome browser */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Chrome · Non-Safari</p>
          <div className="relative" style={{ width: 220 }}>
            <div
              className="rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl"
              style={{ background: "#2a2a2e", paddingBottom: "65%", position: "relative" }}
            >
              <div className="absolute inset-1 rounded-lg overflow-hidden">
                <ChromeBrowser step={step} />
              </div>
            </div>
            <div className="rounded-b-xl" style={{ height: 8, background: "linear-gradient(180deg,#4a4a4e 0%,#3a3a3e 100%)", marginTop: -1 }} />
            <div className="rounded-b-xl" style={{ height: 4, background: "#2a2a2e" }} />
          </div>
          <p className="text-[9px] text-gray-400 italic mt-0.5" style={{ minHeight: 12 }}>
            {step === "idle" ? "Click Apple Pay to open code" :
             step === "modal_shown" ? "\"Scan Code with iPhone\" shown" :
             step === "camera_open" ? "Waiting for iPhone scan…" :
             step === "qr_scanned"  ? "Code recognised — opening Wallet" :
             step === "sheet_open"  ? "Apple Pay sheet on iPhone" :
             step === "face_id"     ? "Awaiting Face ID…" :
             (step === "approved" || step === "complete") ? "Payment confirmed" : ""}
          </p>
        </div>

        {/* CENTER connector with fanning dots */}
        <div className="flex flex-col items-center justify-center gap-1.5" style={{ width: 52 }}>
          <FanningDotSpinner active={spinnerActive} scanned={isScanned} />
          <span
            className="text-center font-semibold"
            style={{
              fontSize: 7.5,
              letterSpacing: "0.04em",
              lineHeight: 1.4,
              whiteSpace: "pre-line",
              color: step === "idle" ? "#d1d5db" :
                     isScanned ? "#16a34a" : "#007aff",
            }}
          >
            {step === "idle" ? "CODE\nLINK" : isScanned ? "AUTH\nOK" : "SCAN\nLINK"}
          </span>
        </div>

        {/* IPHONE */}
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
          <p className="text-[9px] text-gray-400 mt-0.5" style={{ minHeight: 12 }}>
            {step === "idle" || step === "modal_shown" ? "Sleeping" :
             step === "camera_open" ? "Camera scanning" :
             step === "qr_scanned"  ? "Code detected" :
             step === "sheet_open"  ? "Apple Pay sheet" :
             step === "face_id"     ? "Face ID scanning" :
             "Payment done"}
          </p>
        </div>
      </div>

      {/* ── Step timeline ── */}
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
                    <div className={`h-px flex-1 -mt-3 transition-colors duration-500 ${
                      isPast || isDone ? "bg-green-400" : "bg-gray-200"
                    }`} style={{ maxWidth: 16 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Action row ── */}
      <div className="border-t border-gray-100 px-5 py-4">
        {step === "idle" && (
          <button
            onClick={() => advance("modal_shown")}
            className="w-full rounded-xl py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity bg-black text-white"
          >
            <svg viewBox="0 0 814 1000" className="w-3.5 h-3.5 fill-white"><path d={APPLE_LOGO_PATH} /></svg>
            <span className="text-sm font-semibold">Pay with Apple Pay</span>
            <span className="text-[10px] bg-white/20 rounded px-1.5 py-0.5 ml-0.5">Chrome</span>
          </button>
        )}
        {isRunning && (
          <div className="flex items-center justify-center gap-2">
            <FanningDotSpinner active scanned={isScanned} />
            <span className="text-xs text-gray-400">
              {step === "modal_shown" ? "\"Scan Code with iPhone\" modal open — Apple circular code shown" :
               step === "camera_open" ? "iPhone Camera scanning the Apple Pay code…" :
               step === "qr_scanned"  ? "Code scanned — handoff to Wallet in progress" :
               step === "sheet_open"  ? "Apple Pay sheet presented on iPhone…" :
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

      {/* ── Developer note ── */}
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-2.5 flex items-start gap-2">
        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-gray-400 stroke-2 shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4M12 16h.01" />
        </svg>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          When <code className="font-mono bg-gray-100 px-0.5 rounded">session.begin()</code> is called on a non-Safari browser, Apple's JS SDK (v1.2+) automatically renders the <strong>circular code modal</strong> — matching Apple's native design with the Apple Pay mark at center and radiating dot rings. The token is returned to the original session via Apple's servers; no Bluetooth or Continuity required. Requires iPhone with iOS\u00a018+.
        </p>
      </div>
    </div>
  );
}
