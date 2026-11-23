import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Make sure print styles are correctly isolating the modal
style_tag = """      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-modal, #receipt-modal * { visibility: visible; }
          #receipt-modal { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
          .print\\\\:hidden { display: none !important; }
        }
      `}</style>
"""
if "style>{`" not in content:
    content = content.replace("  return (\n    <div className=", style_tag + "  return (\n    <div className=")
    with open('src/App.tsx', 'w') as f:
        f.write(content)
