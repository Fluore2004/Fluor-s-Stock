import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${',
    'className={`w-full py-4 md:py-3 rounded-xl text-sm md:text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Updated Validate button.")
