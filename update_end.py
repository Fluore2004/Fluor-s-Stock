import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Finding the footer
footer_index = content.find('      {/* FOOTER BRANDS */}')
if footer_index != -1:
    # also find the preceding `</main>\n      </div>`
    main_end = content.rfind('</main>', 0, footer_index)
    
    if main_end != -1:
        new_content = content[:main_end] + "</section>\n      </main>\n    </div>\n  );\n}\n"
        with open('src/App.tsx', 'w') as f:
            f.write(new_content)
        print("Success: End layout updated")
    else:
        print("Error: </main> not found before footer")
else:
    print("Error: Footer not found")
