import { useKitchenStore } from './use-kitchen-store';

describe('useKitchenStore', () => {
  it('should accept order and transition status to PREPARING', () => {
    const queue = useKitchenStore.getState().queue;
    const pendingOrder = queue.find((q) => q.status === 'PENDING');
    if (pendingOrder) {
      useKitchenStore.getState().acceptOrder(pendingOrder.id);
      const updated = useKitchenStore.getState().queue.find((q) => q.id === pendingOrder.id);
      expect(updated?.status).toBe('PREPARING');
    }
  });

  it('should mark preparing order as READY_FOR_PICKUP', () => {
    const queue = useKitchenStore.getState().queue;
    const prepOrder = queue.find((q) => q.status === 'PREPARING');
    if (prepOrder) {
      useKitchenStore.getState().markReady(prepOrder.id);
      const updated = useKitchenStore.getState().queue.find((q) => q.id === prepOrder.id);
      expect(updated?.status).toBe('READY_FOR_PICKUP');
    }
  });
});
