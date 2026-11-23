import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add receiptData state
state_marker = "const [copiedFile, setCopiedFile] = useState(false);"
new_state = """const [copiedFile, setCopiedFile] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);"""
content = content.replace(state_marker, new_state)

# 2. Update handleCheckout
checkout_marker = """    // Clear Cart & reset POS state
    setCart([]);
    setSelectedCustomerId('');
    setPaymentStatus('Cash');
    setAmountPaidInitial(0);

    showNotification('success', `Vente enregistrée avec succès ! Reçu #${nextSaleId} généré.`);
  };"""

new_checkout = """    // Prepare receipt data
    const receiptCustomer = finalCustomerId ? (customers.find(c => c.id === finalCustomerId) || createdCustomerObj) : null;
    
    setReceiptData({
      sale: newSale,
      items: newItems.map(item => ({
        ...item,
        product_name: products.find(p => p.id === item.product_id)?.name || 'Produit inconnu'
      })),
      customer: receiptCustomer,
      debt: paymentStatus === 'Dette' ? newDebt : null
    });

    // Clear Cart & reset POS state
    setCart([]);
    setSelectedCustomerId('');
    setPaymentStatus('Cash');
    setAmountPaidInitial(0);
    setNewCustomer({ name: '', phone: '' });

    showNotification('success', `Vente enregistrée avec succès ! Reçu #${nextSaleId} généré.`);
  };"""

# We need to make sure `createdCustomerObj` exists in handleCheckout.
# Let's see how `created` is defined.
