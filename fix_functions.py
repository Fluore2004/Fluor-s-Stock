import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Replace handleWhatsAppReceipt with the three new named functions
old_funcs = """  const handleWhatsAppReceipt = () => {
    if (!receiptData) return;
    if (!receiptData.customer?.phone) {
      showNotification('error', 'Aucun numéro de téléphone enregistré pour ce client.');
      return;
    }
    const phone = receiptData.customer.phone.replace(/[^0-9]/g, '');
    const isDebt = receiptData.sale.payment_status === 'Dette';
    const text = `*FLORIXA Business*\\n====================\\nFacture N°#FLX-${String(receiptData.sale.id).padStart(4, '0')}\\nDate: ${new Date(receiptData.sale.created_at).toLocaleString('fr-FR')}\\n\\nClient: ${receiptData.customer.name}\\n\\n*Total Général: ${receiptData.sale.total_amount.toLocaleString()} BIF*\\nStatut: ${isDebt ? 'Dette Active' : 'Payé en Comptant'}\\n${isDebt ? `Reste à payer: ${(receiptData.sale.total_amount - receiptData.amount_paid).toLocaleString()} BIF` : ''}\\n\\nMerci de votre confiance !`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };"""

new_funcs = """  const imprimerFacture = () => {
    window.print();
  };

  const fermerModale = () => {
    setReceiptData(null);
  };

  const envoyerWhatsApp = () => {
    if (!receiptData) return;
    if (!receiptData.customer?.phone || receiptData.customer.name === 'Client Comptoir (Anonyme)') {
      showNotification('error', 'Aucun numéro de téléphone enregistré pour ce client.');
      return;
    }
    const phone = receiptData.customer.phone.replace(/[^0-9]/g, '');
    const isDebt = receiptData.sale.payment_status === 'Dette';
    const text = `*FLORIXA Business*\\n====================\\nFacture N°#FLX-${String(receiptData.sale.id).padStart(4, '0')}\\nDate: ${new Date(receiptData.sale.created_at).toLocaleString('fr-FR')}\\n\\nClient: ${receiptData.customer.name}\\n\\n*Total Général: ${receiptData.sale.total_amount.toLocaleString()} BIF*\\nStatut: ${isDebt ? 'Dette Active' : 'Payé en Comptant'}\\n${isDebt ? `Reste à payer: ${(receiptData.sale.total_amount - receiptData.amount_paid).toLocaleString()} BIF` : ''}\\n\\nMerci de votre confiance !`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };"""

content = content.replace(old_funcs, new_funcs)


# 2. Update JSX bindings
# Top printer
content = content.replace(
    '<button onClick={() => window.print()} className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors" title="Imprimer">',
    '<button onClick={imprimerFacture} className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors" title="Imprimer">'
)

# Top WA
content = content.replace(
    '<button onClick={handleWhatsAppReceipt} className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors" title="Envoyer sur WhatsApp">',
    '<button onClick={envoyerWhatsApp} className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors" title="Envoyer sur WhatsApp">'
)

# Top X
content = content.replace(
    '<button onClick={() => setReceiptData(null)} className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors" title="Fermer">',
    '<button onClick={fermerModale} className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors" title="Fermer">'
)

# Bottom new sale
content = content.replace(
    'onClick={() => setReceiptData(null)}\n                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1.5"',
    'onClick={fermerModale}\n                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1.5"'
)

# Bottom print
content = content.replace(
    'onClick={() => window.print()}\n                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold shadow-sm shadow-blue-200 transition-all flex justify-center items-center gap-1.5"',
    'onClick={imprimerFacture}\n                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold shadow-sm shadow-blue-200 transition-all flex justify-center items-center gap-1.5"'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Logic functions bound successfully.")
