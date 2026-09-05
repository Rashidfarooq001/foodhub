const fs = require('fs');

const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add lucide icons if missing
if (!content.includes('Tag')) {
  content = content.replace(/Banknote, /g, 'Banknote, Tag, X, ');
}

// 2. Add state variables inside CheckoutPage
if (!content.includes('couponInput')) {
  content = content.replace(
    'const [isProcessing, setIsProcessing] = useState(false);',
    `const [isProcessing, setIsProcessing] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);`
  );
}

// 3. Add handleApplyCoupon
if (!content.includes('handleApplyCoupon')) {
  content = content.replace(
    'const calculateDynamicPricing = async () => {',
    `const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponMessage(null);
    try {
      useCartStore.getState().applyCoupon(couponInput.trim());
      await calculateDynamicPricing();
      setCouponMessage({ type: 'success', text: 'Coupon applied successfully!' });
    } catch (e: any) {
      setCouponMessage({ type: 'error', text: e.message || 'Invalid coupon' });
      useCartStore.getState().removeCoupon();
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    useCartStore.getState().removeCoupon();
    setCouponInput('');
    setCouponMessage(null);
    await calculateDynamicPricing();
  };

  const calculateDynamicPricing = async () => {`
  );
}

// 4. Inject UI
if (!content.includes('5.5. COUPON')) {
  content = content.replace(
    '{/* 6. PRICE BREAKDOWN */}',
    `{/* 5.5. COUPON */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
              <Tag className="w-5 h-5 text-gray-900" /> APPLY COUPON
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                disabled={isApplyingCoupon || !!useCartStore.getState().appliedCoupon}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm uppercase font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:bg-gray-50"
              />
              {!useCartStore.getState().appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || isApplyingCoupon}
                  className="rounded-xl bg-gray-900 px-6 py-2 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {isApplyingCoupon ? '...' : 'APPLY'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-200"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {couponMessage && (
              <p className={\`text-xs font-bold \${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}\`}>
                {couponMessage.text}
              </p>
            )}
            {/* Show applied coupon message from store if quote returned a message */}
            {!couponMessage && useCartStore.getState().appliedCoupon && useCartStore.getState().quoteData?.couponMessage && (
              <p className="text-xs font-bold text-green-600">
                {useCartStore.getState().quoteData?.couponMessage}
              </p>
            )}
          </div>

          {/* 6. PRICE BREAKDOWN */}`
  );
}

fs.writeFileSync(file, content);
console.log('Fixed checkout');
