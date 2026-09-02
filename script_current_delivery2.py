import re

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\delivery-dashboard\src\app\current-delivery\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the fetch string
content = content.replace("${API_BASE}/delivery/current?_t=", "${API_BASE}/delivery/active-jobs?_t=")

# Replace the parsing logic using start and end logic
start_parse = content.find("const text = await res.text();")
end_parse = content.find("} catch {", start_parse)
if start_parse != -1 and end_parse != -1:
    end_parse_block = content.find("}", end_parse) + 1
    new_parse = """const text = await res.text();
      try {
        const parsed = text ? JSON.parse(text) : null;
        const jobs = parsed?.data || parsed || [];
        
        if (Array.isArray(jobs) && jobs.length > 0) {
          if (targetJobId) {
            const found = jobs.find((j: any) => j.id === targetJobId);
            setCurrentJob(found || jobs[0]);
          } else {
            setCurrentJob(jobs[0]);
          }
        } else {
          setCurrentJob(null);
        }
      } catch {
        setCurrentJob(null);
      }"""
    content = content[:start_parse] + new_parse + content[end_parse_block:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
