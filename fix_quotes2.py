import sys
import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("prix d'achat", "prix d\\'achat")

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Fixed nested quotes.")
