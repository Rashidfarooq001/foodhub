import re

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\delivery-dashboard\src\app\current-delivery\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("} catch {\n        setCurrentJob(null);\n      } catch {\n        setCurrentJob(null);\n      }", "} catch {\n        setCurrentJob(null);\n      }")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
