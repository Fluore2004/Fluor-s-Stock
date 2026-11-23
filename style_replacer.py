import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace Slate with Gray for the minimalist feel
replacements = {
    'border-slate-200': 'border-gray-200',
    'border-slate-100': 'border-gray-100',
    'text-slate-400': 'text-gray-400',
    'text-slate-500': 'text-gray-500',
    'text-slate-800': 'text-gray-800',
    'text-slate-900': 'text-gray-900',
    'bg-slate-50': 'bg-gray-50',
    'bg-slate-100': 'bg-gray-100',
    'divide-slate-100': 'divide-gray-100',
    'divide-slate-200': 'divide-gray-200',
    
    # Specific KPI card styling
    'className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-amber-200 transition-colors"': 'className="bg-white p-5 rounded-xl border-l-4 border-l-[#FACC15] border-gray-100 shadow-sm hover:border-amber-200 transition-colors"',
    
    'className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-blue-200 transition-colors"': 'className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors"',

    # Make sure we don't mess up previous replace (since slate was replaced to gray before KPI check)
    # Let's do KPI checks first, then global replace.
}

# Actually, order matters. Let's write them explicitly.
# 1. Update KPI border
content = content.replace(
    'className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-amber-200 transition-colors"', 
    'className="bg-white p-5 rounded-xl border-l-4 border-l-[#FACC15] border-gray-100 shadow-sm hover:border-amber-200 transition-colors"'
)

# Sales count card to have yellow border
content = content.replace(
    'className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-blue-200 transition-colors"\n                  >\n                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ventes Validées</span>',
    'className="bg-white p-5 rounded-xl border-l-4 border-l-[#FACC15] border-gray-100 shadow-sm hover:border-blue-200 transition-colors relative overflow-hidden"\n                  >\n                    <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest block mb-1">Ventes Validées</span>'
)

# And replace the generic ones:
content = content.replace('className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-blue-200 transition-colors"', 'className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors"')


for k, v in [
    ('border-slate-200', 'border-gray-200'),
    ('border-slate-100', 'border-gray-100'),
    ('text-slate-400', 'text-gray-400'),
    ('text-slate-500', 'text-gray-500'),
    ('text-slate-800', 'text-gray-800'),
    ('text-slate-900', 'text-gray-900'),
    ('bg-slate-50', 'bg-gray-50'),
    ('bg-slate-100', 'bg-gray-100'),
    ('divide-slate-100', 'divide-gray-100'),
    ('divide-slate-200', 'divide-gray-200'),
]:
    content = content.replace(k, v)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Styles replaced.")
