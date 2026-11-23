import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Update modal container
content = content.replace(
    'className="bg-white w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 relative" id="receipt-modal"',
    'className="bg-white w-full max-w-xs rounded-xl p-4 md:p-5 shadow-2xl print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 relative mx-auto" id="receipt-modal"'
)

# 2. Update Header
old_header = """            {/* Print Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black text-[#0D1B2A] tracking-tighter">FLORIXA</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Business • MVP</p>
              <div className="mt-4 border-b-2 border-dashed border-gray-200 pb-4">
                <p className="text-sm font-mono text-gray-500">Reçu N° #FLX-{String(receiptData.sale.id).padStart(4, '0')}</p>
                <p className="text-xs text-gray-400">{new Date(receiptData.sale.created_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</p>
              </div>
            </div>"""

new_header = """            {/* Print Header */}
            <div className="text-center mb-4">
              <h1 className="text-xl font-black text-[#0D1B2A] tracking-tighter">FLORIXA Business</h1>
              <p className="text-[10px] text-gray-500 font-medium">Bujumbura, Burundi</p>
              <p className="text-[10px] text-gray-500 font-medium mb-3">Tél: +257 00 00 00 00</p>
              <div className="border-b-2 border-dashed border-gray-200 pb-3">
                <p className="text-xs font-mono text-gray-600 font-bold">FACTURE N° #FLX-{String(receiptData.sale.id).padStart(4, '0')}</p>
                <p className="text-[10px] text-gray-400">{new Date(receiptData.sale.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
            </div>"""

content = content.replace(old_header, new_header)

# Reduce paddings inside customer and table
content = content.replace(
    'className="mb-6 bg-gray-50 p-4 rounded-xl print:bg-transparent print:p-0 print:mb-4"',
    'className="mb-4 bg-gray-50 p-3 rounded-lg print:bg-transparent print:p-0 print:mb-3"'
)
content = content.replace(
    '<table className="w-full text-left text-sm mb-6">',
    '<table className="w-full text-left text-xs mb-4">'
)
content = content.replace(
    '<td className="py-3">',
    '<td className="py-2">'
)
content = content.replace(
    '<td className="py-3 text-right font-bold text-gray-800">',
    '<td className="py-2 text-right font-bold text-gray-800">'
)

# 3. Update the yellow block to be 3 clear lines
old_yellow = """                  <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 print:border-2 print:border-amber-600">
                    <div className="text-center font-bold uppercase tracking-wider text-sm mb-2 text-[#F59E0B]">
                      Dette Active
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Avance versée:</span>
                      <span className="font-bold">{formatBIF(receiptData.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Reste à Payer:</span>
                      <span className="font-black text-rose-600">{formatBIF(receiptData.sale.total_amount - receiptData.amount_paid)}</span>
                    </div>
                  </div>"""

new_yellow = """                  <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 print:border-2 print:border-amber-600">
                    <div className="text-center font-bold uppercase tracking-wider text-[11px] mb-2 text-[#F59E0B]">
                      Dette Active
                    </div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Avance versée:</span>
                      <span className="font-bold">{formatBIF(receiptData.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-gray-900">Reste à payer:</span>
                      <span className="font-black text-rose-600">{formatBIF(receiptData.sale.total_amount - receiptData.amount_paid)}</span>
                    </div>
                  </div>"""

content = content.replace(old_yellow, new_yellow)

# Make sure footer margins are updated
content = content.replace('pt-4 mb-8', 'pt-3 mb-6')
content = content.replace('className="text-xl font-black', 'className="text-lg font-black')

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Receipt format tightened.")
