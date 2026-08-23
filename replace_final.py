import io
with io.open('apps/backend/src/modules/geolocation/geolocation.service.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix computeRouteMatrix casting
old_crm = '''      origins: origins.map(([lat, lng]) => ({ waypoint: { location: { latLng: { latitude: lat, longitude: lng } } } })),
      destinations: destinations.map(([lat, lng]) => ({ waypoint: { location: { latLng: { latitude: lat, longitude: lng } } } })),'''
new_crm = '''      origins: origins.map(([lat, lng]) => ({ waypoint: { location: { latLng: { latitude: Number(lat), longitude: Number(lng) } } } })),
      destinations: destinations.map(([lat, lng]) => ({ waypoint: { location: { latLng: { latitude: Number(lat), longitude: Number(lng) } } } })),'''
text = text.replace(old_crm, new_crm)

# Replace reverseGeocode to use fetch
old_rg = '''    try {
      const response = await this.mapsClient.reverseGeocode({
        params: {
          latlng: [lat, lng],
          key: this.GoogleKey,
        },
        timeout: 5000,
      });

      if (response.data.results && response.data.results.length > 0) {
        // Find a rooftop or the most specific address
        const bestMatch = response.data.results[0];'''
new_rg = '''    try {
      const url = https://maps.googleapis.com/maps/api/geocode/json?latlng=,&key=;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const bestMatch = data.results[0];'''
text = text.replace(old_rg, new_rg)

with io.open('apps/backend/src/modules/geolocation/geolocation.service.ts', 'w', encoding='utf-8') as f:
    f.write(text)
