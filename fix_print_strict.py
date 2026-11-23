import sys
import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Update the outer wrapper to add id="modal-recu"
old_wrapper = 'className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:block print:p-0"'
new_wrapper = 'className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:block print:p-0" id="modal-recu"'
content = content.replace(old_wrapper, new_wrapper)

# 2. Update the inner wrapper to id="carte-recu"
content = content.replace('id="receipt-modal"', 'id="carte-recu"')

# 3. Replace the entire CSS block with the super strict CSS
new_css = """      <style>{`
        @media print {
          /* HIDE APP INTERFACE COMPLETELY */
          nav, main {
            display: none !important;
          }
          
          #app_root {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* FORCE STRICT MODAL VISIBILITY */
          #modal-recu {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          #carte-recu {
            display: block !important;
            visibility: visible !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #carte-recu * {
            visibility: visible !important;
          }

          /* HIDE BUTTONS / ACTIONS */
          .no-print, .print\\\\:hidden, button {
            display: none !important;
          }
        }
      `}</style>"""

css_regex = r"<style>\{\`\s*@media print \{[\s\S]*?\}\s*\`\}<\/style>"
content = re.sub(css_regex, new_css.strip(), content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Strict Print CSS applied.")
