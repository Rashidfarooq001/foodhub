import { useActiveDeliveryStore } from './use-active-delivery-store';

describe('useActiveDeliveryStore', () => {
  it('should verify OTP and complete order when correct OTP is provided', () => {
    const success = useActiveDeliveryStore.getState().verifyOtpAndComplete('4819');
    expect(success).toBe(true);
    expect(useActiveDeliveryStore.getState().currentJob).toBeNull();
  });

  it('should fail verification when incorrect OTP is provided', () => {
    const success = useActiveDeliveryStore.getState().verifyOtpAndComplete('0000');
    expect(success).toBe(false);
  });
});
