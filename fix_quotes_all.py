import sys
import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix the specific errors
content = content.replace("d'origine", "d\\'origine")
content = content.replace("s'est", "s\\'est")
content = content.replace("n'est", "n\\'est")
content = content.replace("qu'il", "qu\\'il")
content = content.replace("jusqu'à", "jusqu\\'à")
content = content.replace("aujourd'hui", "aujourd\\'hui")

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Fixed quotes.")
