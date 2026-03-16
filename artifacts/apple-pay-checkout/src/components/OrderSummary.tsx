interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  image: string;
}

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export default function OrderSummary({ items, subtotal, tax, total }: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h2>

      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
              {item.image}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 leading-tight">{item.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Qty: {item.qty}</p>
            </div>
            <p className="text-sm font-semibold text-gray-900 shrink-0">${item.price.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tax (8.75%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2 shrink-0" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>256-bit SSL encryption · PCI DSS Level 1</span>
      </div>
    </div>
  );
}
