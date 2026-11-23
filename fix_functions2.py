import sys
import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

func_regex = r"const handleWhatsAppReceipt = \(\) => \{[\s\S]*?window\.open\([^)]+\), '_blank'\);\n  \};"

new_funcs = """const imprimerFacture = () => {
    setTimeout(() => {
      window.print();
    }, 100);
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

content = re.sub(func_regex, new_funcs, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Functions properly replaced.")
