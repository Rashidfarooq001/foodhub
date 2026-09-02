import sys

file1 = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\admin-dashboard\src\components\modals\ReviewDriverModal.tsx'
file2 = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\admin-dashboard\src\components\modals\ReviewRestaurantModal.tsx'

def remove_verified(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    old_code = '''                    <span className="col-span-2 font-mono text-gray-900 flex items-center gap-2">
                      {user?.phone} 
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">Verified</span>
                    </span>'''
    
    new_code = '''                    <span className="col-span-2 font-mono text-gray-900 flex items-center gap-2">
                      {user?.phone} 
                    </span>'''
    
    content = content.replace(old_code, new_code)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

remove_verified(file1)
remove_verified(file2)
