import os

filepath = 'apps/delivery-dashboard/src/app/current-delivery/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
    let lastEmit = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const now = Date.now();
        if (now - lastEmit > 3000) {
          lastEmit = now;
          socket.emit('updateLocation', {
            orderId: currentJob.orderId || currentJob.id,
            lat: latitude,
            lng: longitude,
          });
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
"""

content = content.replace("""    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        socket.emit('updateLocation', {
          orderId: currentJob.orderId || currentJob.id,
          lat: latitude,
          lng: longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );""", replacement.strip('\n'))

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added GPS throttling")
