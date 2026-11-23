import sys
import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Root wrapper
content = content.replace(
    '<div className="flex h-screen w-full',
    '<div className="flex flex-col md:flex-row h-screen w-full'
)

# 2. Sidebar wrapper
content = content.replace(
    '<aside className="w-64 bg-[#0D1B2A] text-white flex flex-col flex-shrink-0 z-20" id="sidebar_nav_container">',
    '<aside className="w-full md:w-64 bg-[#0D1B2A] text-white flex flex-col flex-shrink-0 z-20 h-auto md:h-full overflow-hidden" id="sidebar_nav_container">'
)

# 3. Sidebar header
content = content.replace(
    '<div className="p-6 flex flex-col gap-1">',
    '<div className="p-3 md:p-6 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start gap-1">'
)

# 4. Sidebar nav
content = content.replace(
    '<nav className="mt-6 flex-1 px-4 space-y-2" id="navigation_menu">',
    '<nav className="mt-1 md:mt-6 flex-1 px-4 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 md:space-y-2 space-y-0 scrollbar-hide" id="navigation_menu">'
)

# Replace all nav buttons className to be flex-shrink-0 and responsive
content = re.sub(
    r'className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors \$\{activeTab === \'(.*?)\' \? \'bg-\[\#0066FF\] text-white\' : \'text-gray-400 hover:text-white\'\}`\}',
    r'className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-colors ${activeTab === \'\1\' ? \'bg-[#0066FF] text-white\' : \'text-gray-400 hover:text-white\'}`}',
    content
)

# Hide sidebar footer on mobile
content = content.replace(
    '<div className="p-6 border-t border-gray-800 text-[11px] text-gray-400 flex justify-between items-center">',
    '<div className="hidden md:flex p-6 border-t border-gray-800 text-[11px] text-gray-400 justify-between items-center">'
)

# Fix Header Bar on mobile
content = content.replace(
    '<header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">',
    '<header className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0">'
)
content = content.replace(
    '<section className="p-8 flex-1 overflow-auto">',
    '<section className="p-4 md:p-8 flex-1 overflow-auto">'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("App Shell made responsive.")
