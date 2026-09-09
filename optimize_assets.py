import os
from PIL import Image

brand_logo_path = 'packages/brand/assets/zaykafood-logo.png'

# 1. Compress main logo
logo = Image.open(brand_logo_path)
# Keep it as PNG but optimize it, or save as WEBP for the apps to use.
# Actually, the user asked to optimize the assets. Let's resize it to a reasonable maximum.
# The logo is used in headers, 400px wide is plenty.
if logo.width > 400:
    logo_resized = logo.resize((400, int(logo.height * 400 / logo.width)), Image.Resampling.LANCZOS)
else:
    logo_resized = logo

logo_resized.save('optimized-logo.png', 'PNG', optimize=True)
logo_resized.save('optimized-logo.webp', 'WEBP', quality=85)

# 2. Create proper icons
# Icons are usually square. The logo might not be square.
# Let's see if we should crop it to square or just pad it.
# Let's just fit it into a square with transparent background.
size = (192, 192)
icon = Image.new('RGBA', size, (255, 255, 255, 0))
icon_width = 192
icon_height = int(logo.height * 192 / logo.width)
if icon_height > 192:
    icon_height = 192
    icon_width = int(logo.width * 192 / logo.height)
    
temp_resized = logo.resize((icon_width, icon_height), Image.Resampling.LANCZOS)
icon.paste(temp_resized, ((192 - icon_width) // 2, (192 - icon_height) // 2))

icon.save('optimized-icon.png', 'PNG', optimize=True)
icon.save('optimized-apple-touch-icon.png', 'PNG', optimize=True) # Apple touch icon needs to be PNG

# 3. Favicon (32x32)
favicon = icon.resize((32, 32), Image.Resampling.LANCZOS)
favicon.save('optimized-favicon.ico', format='ICO', sizes=[(32, 32)])

print("Optimization complete.")
print("Logo sizes: PNG =", os.path.getsize('optimized-logo.png'), "WEBP =", os.path.getsize('optimized-logo.webp'))
print("Icon size: ", os.path.getsize('optimized-icon.png'))
print("Favicon size: ", os.path.getsize('optimized-favicon.ico'))
