import os, re

def fix_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    # In auth.service.ts
    content = re.sub(r"addressLine:\s*fullAddress\s*\|\|\s*dto\.addressLine\s*\|\|\s*'Bandipora',", "addressLine: fullAddress || dto.addressLine,", content)
    content = re.sub(r"city:\s*dto\.city\s*\|\|\s*'Bandipora',", "city: dto.city,", content)
    content = re.sub(r"latitude:\s*dto\.latitude\s*!=\s*null\s*\?\s*Number\(dto\.latitude\)\s*:\s*34\.\d+,", "latitude: dto.latitude != null ? Number(dto.latitude) : null,", content)
    content = re.sub(r"longitude:\s*dto\.longitude\s*!=\s*null\s*\?\s*Number\(dto\.longitude\)\s*:\s*74\.\d+,", "longitude: dto.longitude != null ? Number(dto.longitude) : null,", content)
    
    # In orders.service.ts
    content = re.sub(r"formattedAddressText = 'Kehnusa, Bandipora, Jammu & Kashmir';", "formattedAddressText = 'Location address not provided';", content)
    content = re.sub(r"city: typeof rawAddress === 'object' \? \(rawAddress\.city \|\| 'Bandipora'\) : 'Bandipora',", "city: typeof rawAddress === 'object' ? (rawAddress.city || '') : '',", content)
    content = re.sub(r"restaurantAddress: activeOrder\.restaurant\?\.addressLine \|\| 'Main Market, Bandipora',", "restaurantAddress: activeOrder.restaurant?.addressLine || '',", content)
    
    # Coordinates in orders
    content = re.sub(r": \(\(dto as any\)\.latitude \|\| \(\(dto as any\)\.lat \|\| 34\.386784\)\);", ": ((dto as any).latitude || (dto as any).lat);", content)
    content = re.sub(r": \(\(dto as any\)\.latitude \|\| \(dto as any\)\.lat \|\| 34\.\d+\);", ": ((dto as any).latitude || (dto as any).lat);", content)
    content = re.sub(r": \(\(dto as any\)\.longitude \|\| \(\(dto as any\)\.lng \|\| 74\.638573\)\);", ": ((dto as any).longitude || (dto as any).lng);", content)
    content = re.sub(r": \(\(dto as any\)\.longitude \|\| \(dto as any\)\.lng \|\| 74\.\d+\);", ": ((dto as any).longitude || (dto as any).lng);", content)
    
    content = re.sub(r"Number\(restaurant\.latitude\) : 34\.3868;", "Number(restaurant.latitude) : 0;", content)
    content = re.sub(r"Number\(restaurant\.longitude\) : 74\.6385;", "Number(restaurant.longitude) : 0;", content)
    
    content = re.sub(r"Number\(activeOrder\.restaurant\.latitude \|\| 34\.3868\) : 34\.3868;", "Number(activeOrder.restaurant.latitude || 0) : 0;", content)
    content = re.sub(r"Number\(activeOrder\.restaurant\.longitude \|\| 74\.6385\) : 74\.6385;", "Number(activeOrder.restaurant.longitude || 0) : 0;", content)
    
    # In order-state-machine.service.ts
    content = re.sub(r"city: delAddr\.city \|\| 'Bandipora',", "city: delAddr.city || '',", content)
    content = re.sub(r"city: delAddr\?\.city \|\| 'Bandipora',", "city: delAddr?.city || '',", content)
    content = re.sub(r"Number\(order\.restaurant\.latitude \|\| 34\.3868\);", "Number(order.restaurant.latitude || 0);", content)
    content = re.sub(r"Number\(order\.restaurant\.longitude \|\| 74\.6385\);", "Number(order.restaurant.longitude || 0);", content)
    content = re.sub(r"Number\(delAddr\.latitude \|\| 34\.3877\);", "Number(delAddr.latitude || 0);", content)
    content = re.sub(r"Number\(delAddr\.longitude \|\| 74\.6390\);", "Number(delAddr.longitude || 0);", content)
    content = re.sub(r"Number\(delAddr\?\.latitude \|\| 34\.3877\);", "Number(delAddr?.latitude || 0);", content)
    content = re.sub(r"Number\(delAddr\?\.longitude \|\| 74\.6390\);", "Number(delAddr?.longitude || 0);", content)
    
    # In orders.controller.ts
    content = re.sub(r"Number\(order\.restaurant\.latitude \|\| 34\.3868\);", "Number(order.restaurant.latitude || 0);", content)
    content = re.sub(r"Number\(order\.restaurant\.longitude \|\| 74\.6385\);", "Number(order.restaurant.longitude || 0);", content)

    # In restaurants.service.ts
    content = re.sub(r"latitude: dto\.latitude != null \? Number\(dto\.latitude\) : 34\.4226,", "latitude: dto.latitude != null ? Number(dto.latitude) : null,", content)
    content = re.sub(r"longitude: dto\.longitude != null \? Number\(dto\.longitude\) : 74\.6628,", "longitude: dto.longitude != null ? Number(dto.longitude) : null,", content)
    content = re.sub(r"addressLine: fullAddress \|\| dto\.address \|\| 'Bandipora',", "addressLine: fullAddress || dto.address,", content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filepath}")

for root, dirs, files in os.walk('apps/backend/src'):
    for f in files:
        if f.endswith('.ts'):
            fix_file(os.path.join(root, f))
