import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Update POS workspace grid to flex flex-col md:flex-row
content = content.replace(
    '<div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="pos_workspace">',
    '<div className="flex flex-col md:flex-row gap-4 md:gap-6" id="pos_workspace">'
)

content = content.replace(
    '<div className="lg:col-span-7 space-y-4">',
    '<div className="w-full md:w-[60%] lg:w-[65%] space-y-4">'
)

content = content.replace(
    '<div className="lg:col-span-5 bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col justify-between" id="pos_checkout_box">',
    '<div className="w-full md:w-[40%] lg:w-[35%] bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col justify-between" id="pos_checkout_box">'
)

# 2. Make touch buttons in cart larger on mobile
# quantity minus
content = content.replace(
    'className="h-5 w-5 rounded bg-gray-100 hover:bg-slate-200 flex items-center justify-center font-bold"',
    'className="h-7 w-7 md:h-5 md:w-5 rounded bg-gray-100 hover:bg-slate-200 flex items-center justify-center font-bold text-base md:text-sm"'
)

# payment status buttons
content = content.replace(
    'className={`py-2 text-xs font-bold rounded-xl border transition-all ${',
    'className={`py-3 md:py-2 text-sm md:text-xs font-bold rounded-xl border transition-all ${'
)

# 3. Update the receipt modal width and centering
# From: w-full max-w-xs rounded-xl
# To: w-full max-w-md rounded-xl mx-auto
content = content.replace(
    'className="bg-white w-full max-w-xs rounded-xl',
    'className="bg-white w-full max-w-md rounded-xl mx-auto'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("POS and buttons made responsive.")
