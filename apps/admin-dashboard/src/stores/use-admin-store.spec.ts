import { useAdminStore } from './use-admin-store';

describe('useAdminStore', () => {
  it('should approve restaurant onboarding application', () => {
    const pending = useAdminStore.getState().pendingRestaurants[0];
    if (pending) {
      useAdminStore.getState().approveRestaurant(pending.id);
      const updated = useAdminStore.getState().pendingRestaurants.find((r) => r.id === pending.id);
      expect(updated?.status).toBe('APPROVED');
    }
  });

  it('should toggle maintenance mode', () => {
    const initial = useAdminStore.getState().isMaintenanceMode;
    useAdminStore.getState().toggleMaintenanceMode();
    expect(useAdminStore.getState().isMaintenanceMode).toBe(!initial);
  });
});
