import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_buttons = """            {/* ACTION BUTTONS (Hidden on Print) */}
            <div className="no-print print:hidden flex flex-col gap-3 mt-4 border-t border-gray-100 pt-4">
              <button 
                onClick={() => window.print()}
                className="w-full py-3 bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition-all flex justify-center items-center gap-2"
              >
                <Printer className="h-4 w-4" /> Imprimer la Facture
              </button>
              <button 
                onClick={() => setReceiptData(null)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all flex justify-center items-center"
              >
                Retour au POS (Nouvelle Vente)
              </button>
            </div>"""

new_buttons = """            {/* ACTION BUTTONS (Hidden on Print) */}
            <div className="no-print print:hidden flex gap-2 mt-4 border-t border-gray-100 pt-4">
              <button 
                onClick={() => setReceiptData(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Nouv. Vente</span>
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold shadow-sm shadow-blue-200 transition-all flex justify-center items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Imprimer Facture</span>
              </button>
            </div>"""

if old_buttons in content:
    content = content.replace(old_buttons, new_buttons)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Buttons updated successfully.")
else:
    print("Old buttons not found. Checking current content...")
    import re
    match = re.search(r'\{\/\* ACTION BUTTONS.*?<\/div>\s*<\/div>', content, re.DOTALL)
    if match:
        print("Found alternative match.")
