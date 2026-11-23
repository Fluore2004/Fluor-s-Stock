import sys
import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_style = """                  <style>
                    body { background: white; margin: 0; padding: 20px; font-family: sans-serif; display: flex; justify-content: center; }
                    #carte-recu { max-width: 320px; width: 100%; border: none !important; box-shadow: none !important; }
                    .no-print, .print\\\\:hidden, button { display: none !important; }
                  </style>"""

new_style = """                  <style>
                    @page {
                      size: 80mm auto;
                      margin: 0mm !important;
                    }

                    html, body {
                      width: 80mm !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      background: white;
                      font-family: sans-serif;
                    }

                    #carte-recu {
                      width: 80mm !important;
                      max-width: 80mm !important;
                      padding: 6px !important;
                      margin: 0 auto !important;
                      box-shadow: none !important;
                      border: none !important;
                    }

                    .no-print, .print\\\\:hidden, button {
                      display: none !important;
                    }
                  </style>"""

if old_style in content:
    content = content.replace(old_style, new_style)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Thermal print styles applied successfully.")
else:
    print("Could not find the exact style block. Trying regex.")
    # Regex fallback just in case
    style_regex = r"<style>\s*body \{ background: white.*?<\/style>"
    if re.search(style_regex, content, re.DOTALL):
        content = re.sub(style_regex, new_style.replace('\\\\:', '\\:'), content, flags=re.DOTALL)
        with open('src/App.tsx', 'w') as f:
            f.write(content)
        print("Thermal print styles applied via regex.")
    else:
        print("Failed to find style block.")
