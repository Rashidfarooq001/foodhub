import os, re

filepath = 'apps/backend/src/modules/geolocation/geolocation.service.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

bad_signature = """  async resolveLocation(lat: number, lng: number)
    if (!this.isValidCoordinates(lat, lng)) throw new Error('Invalid GPS coordinates');: Promise<{
    latitude: number;
    longitude: number;
    locality: string;
    district: string;
    subDistrict?: string;
    state: string;
    country: string;
    formattedAddress: string;
  }> {"""

good_signature = """  async resolveLocation(lat: number, lng: number): Promise<{
    latitude: number;
    longitude: number;
    locality: string;
    district: string;
    subDistrict?: string;
    state: string;
    country: string;
    formattedAddress: string;
  }> {
    if (!this.isValidCoordinates(lat, lng)) throw new Error('Invalid GPS coordinates');"""

content = content.replace(bad_signature, good_signature)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed resolveLocation signature")
