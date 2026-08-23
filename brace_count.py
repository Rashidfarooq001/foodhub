import sys

filepath = 'apps/backend/src/modules/geolocation/geolocation.service.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
    if depth == 0 and i > 25:
        print(f"Class ended at line {i+1}:\n{line}")
