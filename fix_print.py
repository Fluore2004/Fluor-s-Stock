import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_css = """      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-modal, #receipt-modal * { visibility: visible; }
          #receipt-modal { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>"""

new_css = """      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-modal, #receipt-modal * { visibility: visible !important; }
          #receipt-modal { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; display: block !important; }
          .print\\:hidden, .no-print { display: none !important; }
        }
      `}</style>"""

if old_css in content:
    content = content.replace(old_css, new_css)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("CSS updated perfectly.")
else:
    print("Old CSS block not found exactly as expected. Trying regex replacement...")
    import re
    css_regex = r"<style>\{\`\s*@media print \{[\s\S]*?\}\s*\`\}<\/style>"
    if re.search(css_regex, content):
        content = re.sub(css_regex, new_css.strip(), content)
        with open('src/App.tsx', 'w') as f:
            f.write(content)
        print("CSS replaced via regex.")
    else:
        print("Could not find the style block.")

