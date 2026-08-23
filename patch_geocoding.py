import os, re

filepath = 'apps/backend/src/modules/geolocation/geolocation.service.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {"""

new_code = """        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
           this.logger.error("Google Geocoding Failed: " + JSON.stringify(data));
           fallback.formattedAddress = Error:  - ;
           return fallback;
        }

        if (data.results && data.results.length > 0) {"""

content = content.replace(replacement, new_code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added error visibility to Geocoding")
