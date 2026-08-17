import { useCartStore } from './use-cart-store';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('should add item to cart', () => {
    useCartStore.getState().addItem({
      foodItemId: 'food-101',
      name: 'Paneer Tikka',
      price: 250,
      isVeg: true,
      restaurantId: 'rest-1',
      restaurantName: 'Spice Garden',
      addons: [],
    });

    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Paneer Tikka');
    expect(useCartStore.getState().getSubtotal()).toBe(250);
  });

  it('should calculate grand total correctly including fees and taxes', () => {
    useCartStore.getState().addItem({
      foodItemId: 'food-101',
      name: 'Paneer Tikka',
      price: 200,
      isVeg: true,
      restaurantId: 'rest-1',
      restaurantName: 'Spice Garden',
      addons: [],
    });

    // Subtotal: 200, Packaging: 15, Delivery: 35, Tax (5% of 200): 10 -> Total: 260
    const total = useCartStore.getState().getGrandTotal();
    expect(total).toBe(260);
  });

  it('should apply coupon discount', () => {
    useCartStore.getState().addItem({
      foodItemId: 'food-101',
      name: 'Paneer Tikka',
      price: 300,
      isVeg: true,
      restaurantId: 'rest-1',
      restaurantName: 'Spice Garden',
      addons: [],
    });

    useCartStore.getState().applyCoupon('ZAYKA50', 50);
    expect(useCartStore.getState().getDiscountAmount()).toBe(50);
  });
});
