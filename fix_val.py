import os, re

def fix_validation(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "resolveLocation" in content and "isValidCoordinates" not in content:
        # Add basic coordinate validation
        validation = """
  private isValidCoordinates(lat: number, lng: number): boolean {
    return (lat >= -90 && lat <= 90) && (lng >= -180 && lng <= 180) && (lat !== 0 || lng !== 0);
  }
"""
        content = content.replace("export class GeolocationService {", "export class GeolocationService {\n" + validation)
        content = content.replace("async resolveLocation(lat: number, lng: number)", "async resolveLocation(lat: number, lng: number)\n    if (!this.isValidCoordinates(lat, lng)) throw new Error('Invalid GPS coordinates');")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed validation in " + filepath)

fix_validation('apps/backend/src/modules/geolocation/geolocation.service.ts')
