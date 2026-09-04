const fs = require('fs');
const path = require('path');

const filePath = path.join('apps', 'customer-web', 'src', 'app', 'checkout', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const returnIndex = content.indexOf('return (\n    <CustomerAuthGuard>');
if (returnIndex === -1) {
  console.error('Could not find return statement');
  process.exit(1);
}

const beforeReturn = content.substring(0, returnIndex);

const newReturnBlock = \eturn (
    <CustomerAuthGuard>
      <div className="bg-gray-50 min-h-screen pb-[350px] lg:pb-12">
        {/* Mobile Header & Progress Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
          <div className="mx-auto max-w-4xl flex items-center justify-between">
            <button
              onClick={() => router.push('/cart')}
              className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <h1 className="text-sm font-black text-gray-900">Secure Payment</h1>
            <div className="w-8" />
          </div>

          {/* Stepper Progress */}
          <div className="mx-auto max-w-4xl mt-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
            <Link href="/cart" className="text-gray-500 hover:text-gray-900 transition hover:underline">
              Cart
            </Link>
            <span>&gt;</span>
            <span className="font-bold text-orange-600 underline decoration-2 underline-offset-4">
              Payment
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-4 lg:px-5 space-y-4">
          {paymentError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 shadow-xs">
              ⚠ {paymentError}
            </div>
          )}

          {locationError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 shadow-xs flex justify-between">
              <span>⚠ {locationError}</span>
              <button onClick={() => setLocationError(null)}><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT COLUMN: Order Details & Price */}
            <div className="lg:col-span-7 space-y-4">
              {/* Order Items */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-black text-gray-900 mb-3 pb-3 border-b border-gray-100">
                  <Store className="h-4 w-4 text-orange-600" />
                  <span>Order Items</span>
                </div>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover shrink-0 border border-gray-100"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-black text-gray-900 shrink-0">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Instructions */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                    <span>Delivery Instructions</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Optional</span>
                </div>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Leave at gate, do not ring bell..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Tip Your Driver */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <HeartHandshake className="h-4 w-4 text-orange-600" />
                    <span>Tip Your Driver</span>
                  </div>
                  <span className="text-[10px] text-gray-400">100% goes to driver</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[20, 30, 50].map((amt) => {
                    const isSelected = tipAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectTip(amt)}
                        className={\ounded-xl border py-2.5 text-xs font-bold transition text-center flex items-center justify-center \\}
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowCustomTipInput(!showCustomTipInput)}
                    className={\ounded-xl border py-2.5 text-xs font-bold transition text-center flex items-center justify-center \\}
                  >
                    Custom
                  </button>
                </div>
                {showCustomTipInput && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSelectTip(parseInt(customTip) || 0)}
                      className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black transition"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-2 text-sm font-black text-gray-900 mb-3 pb-3 border-b border-gray-100">
                  <Banknote className="h-4 w-4 text-orange-600" />
                  <span>Price Breakdown</span>
                </div>
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span className="font-bold text-gray-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>
                    {dynamicDeliveryFee !== null ? (
                      <span className="font-bold text-gray-900">₹{dynamicDeliveryFee}</span>
                    ) : (
                      <span className="text-amber-700 font-bold text-[11px]">Pending distance</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-bold text-gray-900">₹{platformFee ?? 3}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span className="font-bold text-gray-900">₹{tax}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Driver Tip</span>
                    <span className="font-bold">+₹{tipAmount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN / STICKY BOTTOM BAR: Checkout Actions */}
            <div className="lg:col-span-5 relative">
              <div className="fixed bottom-0 left-0 right-0 z-40 lg:static lg:block bg-white rounded-t-3xl lg:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-sm border-t lg:border border-gray-100 p-4 sm:p-5 space-y-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-5">
                
                {/* 1. DELIVERY ADDRESS */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 min-w-0 pr-2">
                    <div className="mt-1">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide truncate">{selectedAddress?.label || 'Delivery Address'}</h3>
                      </div>
                      <p className="text-xs text-gray-500 font-medium truncate mt-0.5 max-w-[240px]">
                        {selectedAddress ? \\, \\ : 'No address selected'}
                      </p>
                      
                      {selectedAddress ? (
                        <p className="text-xs font-bold text-gray-800 mt-1 flex items-center gap-1">
                          {orderQuote && routeAvailable && realDistanceKm !== null ? (
                            <>
                              <span className={isDeliveryEligible ? 'text-emerald-700' : 'text-rose-700'}>
                                {realDistanceKm} km
                              </span>
                              <span className="text-gray-300">•</span>
                              <span>{orderQuote.etaMinutes ? \\ MINS\ : ''}</span>
                            </>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">Calculating ETA...</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-rose-600 mt-1">Select an address to continue</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setManualAddress('');
                      setMatchedAddressResult(null);
                      setAddressVerificationError(null);
                      setShowCustomAddressModal(true);
                    }} 
                    className="text-[10px] font-black text-orange-600 uppercase tracking-wide px-3 py-1.5 bg-orange-50 hover:bg-orange-100 transition rounded-lg shrink-0 border border-orange-100"
                  >
                    CHANGE
                  </button>
                </div>

                {/* 2. CUTLERY PREFERENCE */}
                <div className="flex items-center gap-2 border-y border-gray-100 py-3">
                  <input 
                    type="checkbox" 
                    id="cutlery" 
                    checked={alwaysSendCutlery} 
                    onChange={(e) => setAlwaysSendCutlery(e.target.checked)} 
                    className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500" 
                  />
                  <label htmlFor="cutlery" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Always send cutlery to this address
                  </label>
                </div>

                {/* 3. PAYMENT METHOD */}
                <div className="flex flex-col gap-2 pt-1 pb-2">
                  <span className="text-[10px] font-black text-gray-400 tracking-wider">PAY USING</span>
                  <div className="flex gap-2 mt-1">
                    {['UPI', 'CARD', 'COD'].map((method) => (
                      <button 
                        key={method} 
                        onClick={() => setPaymentMethod(method as any)} 
                        className={\lex-1 py-3 rounded-xl text-xs font-black border transition-colors \\}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {method === 'UPI' && <Smartphone className="w-3.5 h-3.5" />}
                          {method === 'CARD' && <CreditCard className="w-3.5 h-3.5" />}
                          {method === 'COD' && <Banknote className="w-3.5 h-3.5" />}
                          {method === 'CARD' ? 'Card' : method}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. TOTAL & PLACE ORDER CTA */}
                <div className="flex gap-3 pt-1">
                  <div className="flex flex-col justify-center bg-gray-50 px-4 rounded-2xl border border-gray-200 min-w-[110px] shadow-inner">
                    <span className="text-[10px] font-black text-gray-500">TOTAL</span>
                    <span className="text-lg font-black text-gray-900">₹{finalPayableTotal}</span>
                  </div>
                  
                  <button
                    onClick={orderQuote && (!routeAvailable || realDistanceKm === null) ? refreshQuote : handlePlaceOrder}
                    disabled={isPlacing || !selectedAddress || Boolean(orderQuote && routeAvailable && realDistanceKm !== null && !isDeliveryEligible)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition text-white font-black text-sm rounded-2xl py-4 flex items-center justify-between px-5 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:active:scale-100"
                  >
                    <span>
                      {isPlacing 
                        ? 'Placing Order...' 
                        : !selectedAddress 
                          ? 'Select Address' 
                          : orderQuote && (!routeAvailable || realDistanceKm === null)
                            ? 'Check Distance'
                            : !isDeliveryEligible 
                              ? 'Out of Range' 
                              : 'Place Order'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MANUAL ADDRESS MODAL */}
        {showCustomAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-[420px] overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 p-4 pb-3">
                <h2 className="text-base font-black text-gray-900">Change Delivery Location</h2>
                <button
                  onClick={() => setShowCustomAddressModal(false)}
                  className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 pt-3 space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocatingUser}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-50 px-3 py-3 text-xs font-bold text-orange-700 hover:bg-orange-100 transition disabled:opacity-50 border border-orange-100"
                  >
                    <MapPin className={\h-4 w-4 \\} />
                    <span>{isLocatingUser ? 'Locating...' : 'Use Current GPS'}</span>
                  </button>
                </div>
                
                {addresses.length > 0 && (
                  <div className="space-y-2 mt-4 border-t border-gray-100 pt-4">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider px-1">
                      Saved Addresses
                    </label>
                    <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddress(addr.id);
                            setShowCustomAddressModal(false);
                          }}
                          className={\w-full text-left p-3 rounded-xl border transition-colors \\}
                        >
                          <p className="text-xs font-black text-gray-900 uppercase">{addr.label}</p>
                          <p className="text-[11px] text-gray-600 truncate mt-0.5">{addr.addressLine1}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 border-t border-gray-100 pt-4">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider px-1">
                    Enter Custom Address
                  </label>
                  <textarea
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="e.g. House No 24, Kenusa, Dangarpora, Baramulla..."
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none shadow-sm box-border h-[80px]"
                  />
                  <button
                    onClick={handleConfirmManualAddress}
                    disabled={!manualAddress.trim() || isVerifyingAddress}
                    className="w-full flex items-center justify-center rounded-xl bg-orange-600 h-[52px] text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 shadow-sm"
                  >
                    {isVerifyingAddress ? 'Verifying location...' : 'Save & Select Location'}
                  </button>
                  {addressVerificationError && (
                    <p className="mt-1.5 text-[11px] font-bold text-red-500 text-center leading-tight">
                      {addressVerificationError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerAuthGuard>
  );
}
\;

fs.writeFileSync(filePath, beforeReturn + newReturnBlock, 'utf8');
console.log('Successfully patched UI!');
