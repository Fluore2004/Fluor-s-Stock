import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the modal container wrapper
old_wrapper_start = '        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm print:bg-white print:block">\n          <div className="bg-white w-full max-w-xs rounded-xl p-4 md:p-5 shadow-2xl print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 relative mx-auto" id="receipt-modal">'

new_wrapper_start = '        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:block print:p-0">\n          <div className="bg-white w-full max-w-xs rounded-xl p-4 md:p-5 shadow-2xl print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 relative mx-auto max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible" id="receipt-modal">'

if old_wrapper_start in content:
    content = content.replace(old_wrapper_start, new_wrapper_start)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Modal container patched.")
else:
    print("Could not find the exact wrapper.")
