import os, re

filepath = 'apps/backend/test/test-full-e2e-suite.ts'
if not os.path.exists(filepath):
    print("Test file not found")
else:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where OrdersService is instantiated in tests
    # Original: new OrdersService(prisma as any, ordersRepo, ordersValidation, gateway, quoteService);
    content = content.replace(
        "new OrdersService(prisma as any, ordersRepo, ordersValidation, gateway, quoteService);",
        "new OrdersService(prisma as any, ordersRepo, ordersValidation, gateway, quoteService, {} as any);"
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed test-full-e2e-suite.ts")
