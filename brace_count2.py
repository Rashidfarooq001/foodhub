import sys

filepath = 'apps/backend/src/modules/geolocation/geolocation.service.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
in_class = False
for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
    
    if "class GeolocationService" in line:
        in_class = True
        class_depth = depth
        print(f"Class started at line {i+1}, depth {depth}")

    if in_class and depth == 0:
        print(f"Class ended at line {i+1}: {line.strip()}")
        in_class = False
