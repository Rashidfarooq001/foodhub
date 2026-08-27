const { validateSync } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const { CreateOrderDto } = require('./dist/src/modules/orders/dto/create-order.dto');

const payload = {
  restaurantId: '0591d52e-8515-4cf7-9c4c-e0f9133bc916',
  items: [
    {
      foodItemId: 'eb11eba8-e571-4b79-b49b-1b05878ee7ff',
      variantId: '31213185-a04b-40d7-9e2f-8943f6ea01ac',
      quantity: 1
    }
  ],
  paymentMethod: 'UPI',
  deliveryAddress: {
    label: 'Current Location',
    street: 'Kenusa',
    addressLine1: 'Kenusa',
    addressLine2: 'Dangarpora, Baramulla',
    city: 'Baramulla',
    landmark: '',
    latitude: 34.386784,
    longitude: 74.522066,
    postalCode: '193201',
    state: 'Jammu & Kashmir',
    locationSource: 'CURRENT_GPS'
  }
};

const instance = plainToInstance(CreateOrderDto, payload);
const errors = validateSync(instance);
console.log(JSON.stringify(errors, null, 2));
