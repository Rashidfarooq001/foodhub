const fs = require('fs');
const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const refreshQuoteStr = `  const refreshQuote = useCallback((overrideCoupon?: string | null) => {
    const sub = getSubtotal();
    const restId = useCartStore.getState().restaurantId || items[0]?.restaurantId;
    const hasCoords = selectedAddress?.latitude !== null && selectedAddress?.latitude !== undefined && selectedAddress?.longitude !== null && selectedAddress?.longitude !== undefined;
    const locationSource = (selectedAddress as any)?.locationSource || (selectedAddress?.id === 'current-location' ? 'CURRENT_GPS' : 'MANUAL_GEOCODED');

    const couponToUse = overrideCoupon !== undefined ? (overrideCoupon || undefined) : (useCartStore.getState().appliedCoupon || undefined);

    return fetchOrderQuote({
      foodSubtotal: sub,
      restaurantId: restId || undefined,
      latitude: hasCoords ? selectedAddress!.latitude! : undefined,
      longitude: hasCoords ? selectedAddress!.longitude! : undefined,
      locationSource,
      tipAmount: tipAmount,
      couponCode: couponToUse,
      customerState: selectedAddress?.state || 'J&K',
      restaurantState: 'J&K',
    })
      .then((quote) => {
        if (quote) setOrderQuote(quote);
        return quote;
      })
      .catch((err) => {
        setPaymentError(err.message || 'Failed to calculate delivery fee.');
        setOrderQuote(null);
        return null;
      });
  }, [items, selectedAddress, tipAmount]);`;

const applyCouponStr = `  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponMessage(null);
    try {
      const quote = await refreshQuote(couponInput.trim());
      if (quote && quote.appliedCouponCode) {
        useCartStore.getState().applyCoupon(quote.appliedCouponCode);
        setCouponMessage({ type: 'success', text: quote.couponMessage || 'Coupon applied successfully!' });
      } else {
        useCartStore.getState().removeCoupon();
        setCouponMessage({ type: 'error', text: quote?.couponMessage || 'Invalid coupon' });
      }
    } catch (e: any) {
      setCouponMessage({ type: 'error', text: e.message || 'Invalid coupon' });
      useCartStore.getState().removeCoupon();
    } finally {
      setIsApplyingCoupon(false);
    }
  };`;

// replace refreshQuote
content = content.replace(/const refreshQuote = useCallback\(\(\) => \{[\s\S]*?\}, \[items, selectedAddress, tipAmount\]\);/, refreshQuoteStr);

// replace handleApplyCoupon
content = content.replace(/const handleApplyCoupon = async \(\) => \{[\s\S]*?^\s*\};/m, applyCouponStr);

// Also fix the initial useEffect to call refreshQuote() without args
content = content.replace(/useEffect\(\(\) => \{\s+if \(items\.length > 0\) \{\s+refreshQuote\(\);\s+\}\s+\}, \[refreshQuote, items\.length\]\);/, 
`useEffect(() => {
    if (items.length > 0) {
      refreshQuote();
    }
  }, [refreshQuote, items.length]);`);

fs.writeFileSync(file, content);
console.log('Fixed coupon validation sync issue');
