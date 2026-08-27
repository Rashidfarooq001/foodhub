const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { OrdersService } = require('./dist/src/modules/orders/orders.service');

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ordersService = app.get(OrdersService);

    const dto = {
      restaurantId: "0591d52e-8515-4cf7-9c4c-e0f9133bc916",
      items: [
        {
          foodItemId: "eb11eba8-e571-4b79-b49b-1b05878ee7ff",
          variantId: "31213185-a04b-40d7-9e2f-8943f6ea01ac",
          quantity: 1
        }
      ],
      deliveryAddress: {
        label: "Current Location",
        street: "Kenusa",
        addressLine1: "Kenusa",
        addressLine2: "Dangarpora, Baramulla",
        city: "Baramulla",
        state: "Jammu & Kashmir",
        postalCode: "193201",
        latitude: 34.386784,
        longitude: 74.522066,
        locationSource: "CURRENT_GPS"
      },
      paymentMethod: "COD"
    };

    console.log('Calling createOrder...');
    const result = await ordersService.createOrder('11111111-1111-1111-1111-111111111111', dto);
    console.log('Order Created Successfully:', result.id);
    
    await app.close();
  } catch (err) {
    console.error('Error occurred:', err);
    process.exit(1);
  }
}

bootstrap();
