import os, re

def fix_frontend(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    content = re.sub(r"initialLat=\{form\.latitude \?\? 34\.3868\}", "initialLat={form.latitude}", content)
    content = re.sub(r"lat: initialLat \|\| 34\.0747,", "lat: initialLat || 0,", content)
    content = re.sub(r"lng: initialLng \|\| 74\.8022,", "lng: initialLng || 0,", content)
    content = re.sub(r"initialLng=\{form\.longitude \?\? 74\.6385\}", "initialLng={form.longitude}", content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed frontend: " + filepath)

for root, dirs, files in os.walk('apps'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            fix_frontend(os.path.join(root, f))
