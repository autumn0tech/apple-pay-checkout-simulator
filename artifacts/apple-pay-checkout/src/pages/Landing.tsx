import { useLocation } from "wouter";

const wallets = [
  {
    id: "apple-pay",
    name: "Apple Pay",
    description: "One-session & two-session flows with subscription upsell",
    emoji: "🍎",
    color: "from-gray-900 to-gray-700",
    border: "border-gray-200 hover:border-gray-400",
    badge: "bg-green-100 text-green-700",
    badgeText: "Live",
    available: true,
    href: "/apple-pay",
  },
  {
    id: "google-pay",
    name: "Google Pay",
    description: "Express checkout with Google Wallet integration",
    emoji: "🔵",
    color: "from-blue-600 to-blue-400",
    border: "border-gray-200 hover:border-blue-200",
    badge: "bg-amber-100 text-amber-700",
    badgeText: "Coming soon",
    available: false,
    href: "#",
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "PayPal express, Pay Later, and Venmo flows",
    emoji: "🅿️",
    color: "from-blue-800 to-indigo-600",
    border: "border-gray-200 hover:border-indigo-200",
    badge: "bg-amber-100 text-amber-700",
    badgeText: "Coming soon",
    available: false,
    href: "#",
  },
  {
    id: "shop-pay",
    name: "Shop Pay",
    description: "Shopify accelerated checkout & installments",
    emoji: "🛍️",
    color: "from-violet-600 to-purple-500",
    border: "border-gray-200 hover:border-violet-200",
    badge: "bg-amber-100 text-amber-700",
    badgeText: "Coming soon",
    available: false,
    href: "#",
  },
  {
    id: "link",
    name: "Link by Stripe",
    description: "Stripe Link one-click checkout simulation",
    emoji: "⚡",
    color: "from-indigo-500 to-blue-500",
    border: "border-gray-200 hover:border-indigo-200",
    badge: "bg-amber-100 text-amber-700",
    badgeText: "Coming soon",
    available: false,
    href: "#",
  },
  {
    id: "amazon-pay",
    name: "Amazon Pay",
    description: "Amazon wallet express checkout flow",
    emoji: "📦",
    color: "from-orange-500 to-yellow-400",
    border: "border-gray-200 hover:border-orange-200",
    badge: "bg-amber-100 text-amber-700",
    badgeText: "Coming soon",
    available: false,
    href: "#",
  },
];

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎵</span>
            <span className="text-gray-900 font-semibold text-base tracking-tight">AudioHound</span>
          </div>
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Developer Simulator</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
          Digital Payments Simulator
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
          Choose a wallet to simulate
        </h1>
        <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
          Explore how different digital wallets handle express checkout, subscriptions, and post-purchase flows — with live code snippets for your integration.
        </p>
      </div>

      {/* Wallet grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => wallet.available && navigate(wallet.href)}
              disabled={!wallet.available}
              className={`group relative text-left bg-white rounded-2xl border ${wallet.border} p-6 transition-all duration-200 shadow-sm
                ${wallet.available ? "cursor-pointer hover:shadow-md active:scale-[0.98]" : "cursor-not-allowed opacity-60"}`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${wallet.color} flex items-center justify-center text-2xl mb-4 shadow-sm`}>
                {wallet.emoji}
              </div>

              {/* Badge */}
              <span className={`absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full ${wallet.badge}`}>
                {wallet.badgeText}
              </span>

              <h2 className="text-base font-semibold text-gray-900 mb-1">{wallet.name}</h2>
              <p className="text-sm text-gray-500 leading-snug">{wallet.description}</p>

              {wallet.available && (
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-gray-700 transition-colors">
                  Open simulator
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2 group-hover:translate-x-0.5 transition-transform" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
