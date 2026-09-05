const fs = require('fs');
const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const platformFee = orderQuote\?\.platformFee \?\? 3\.0;[\s\S]*?const finalPayableTotal = orderQuote/,
  `const platformFee = orderQuote?.platformFee ?? 3.0;
  const subtotal = getSubtotal();
  const smallOrderFee = 0.0;

  const maxRadiusKm = restaurantData?.deliveryRadius ?? 15.0;
  const isDeliveryEligible = Boolean(orderQuote && routeAvailable && orderQuote.deliveryEligible);

  const refreshQuote = useCallback(() => {
    const sub = getSubtotal();
    const restId = useCartStore.getState().restaurantId || items[0]?.restaurantId;
    const hasCoords = selectedAddress?.latitude !== null && selectedAddress?.latitude !== undefined && selectedAddress?.longitude !== null && selectedAddress?.longitude !== undefined;
    const locationSource = (selectedAddress as any)?.locationSource || (selectedAddress?.id === 'current-location' ? 'CURRENT_GPS' : 'MANUAL_GEOCODED');

    fetchOrderQuote({
      foodSubtotal: sub,
      restaurantId: restId || undefined,
      latitude: hasCoords ? selectedAddress!.latitude! : undefined,
      longitude: hasCoords ? selectedAddress!.longitude! : undefined,
      locationSource,
      tipAmount: tipAmount,
      couponCode: useCartStore.getState().appliedCoupon || undefined,
      customerState: selectedAddress?.state || 'J&K',
      restaurantState: 'J&K',
    })
      .then((quote) => {
        if (quote) setOrderQuote(quote);
      })
      .catch((err) => {
        setPaymentError(err.message || 'Failed to calculate delivery fee.');
        setOrderQuote(null);
      });
  }, [items, selectedAddress, tipAmount]);

  useEffect(() => {
    refreshQuote();
  }, [refreshQuote]);

  const tax = orderQuote?.totalCustomerTaxes ?? 0;
  const discount = orderQuote?.discountAmount ?? 0;
  const baseGrandTotal = subtotal + (dynamicDeliveryFee || 0) + platformFee + tax - discount;
  const finalPayableTotal = orderQuote`
);

fs.writeFileSync(file, content);
console.log('Patched');
