import sys
import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("L'acompte", "L\\'acompte")
content = content.replace("n'a pas", "n\\'a pas")

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Fixed nested quotes.")
