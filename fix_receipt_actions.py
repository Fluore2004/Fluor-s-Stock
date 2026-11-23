import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Update CSS
old_css = """          #receipt-modal { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
          .print\\:hidden { display: none !important; }
        }"""
new_css = """          #receipt-modal { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
          .print\\:hidden { display: none !important; }
          .no-print { display: none !important; }
        }"""
if old_css in content:
    content = content.replace(old_css, new_css)
else:
    print("WARNING: Could not find old_css block")


# Add buttons
old_qr = """            {/* QR Code Placeholder (Visual Only) */}
            <div className="text-center border-t border-dashed border-gray-200 pt-6">
               <div className="inline-block p-2 bg-white border border-gray-200 rounded-xl shadow-sm mb-2">
                 <QrCode className="h-16 w-16 text-gray-800 mx-auto opacity-80" />
               </div>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Scanner pour vérification</p>
            </div>
            
          </div>"""

new_qr = """            {/* QR Code Placeholder (Visual Only) */}
            <div className="text-center border-t border-dashed border-gray-200 pt-6 mb-6">
               <div className="inline-block p-2 bg-white border border-gray-200 rounded-xl shadow-sm mb-2">
                 <QrCode className="h-16 w-16 text-gray-800 mx-auto opacity-80" />
               </div>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Scanner pour vérification</p>
            </div>

            {/* ACTION BUTTONS (Hidden on Print) */}
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
            </div>
            
          </div>"""
if old_qr in content:
    content = content.replace(old_qr, new_qr)
else:
    print("WARNING: Could not find old_qr block")

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Applied action buttons to receipt modal.")
