import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the conditional check {paymentStatus === 'Dette' && ( ... )} with always visible but styled slightly differently.
old_block = """                        {/* CONDITIONAL DEBT CUSTOMER FIELD */}
                        {paymentStatus === 'Dette' && (
                          <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl space-y-3 animate-fade-in text-xs">
                            <h4 className="font-bold text-amber-950 text-xs">Suivi Dette Client</h4>
                            
                            <div>
                              <label className="block text-[10px] font-semibold text-amber-900 mb-1">Sélectionner un Client Débiteur</label>
                              <select 
                                value={selectedCustomerId}
                                onChange={(e) => {
                                  setSelectedCustomerId(e.target.value as any);
                                  if (e.target.value === 'new') {
                                    setIsCreatingCustomerPOS(true);
                                  } else {
                                    setIsCreatingCustomerPOS(false);
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                              >
                                <option value="">-- Choisir un client débiteur --</option>
                                {customers.map(c => (
                                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                ))}
                                <option value="new">+ Créer une nouvelle fiche client</option>
                              </select>
                            </div>

                            {isCreatingCustomerPOS && (
                              <div className="space-y-2 border-t border-amber-100/50 pt-2">
                                <input 
                                  type="text"
                                  placeholder="Nom Complet"
                                  value={newCustomer.name}
                                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                                  className="w-full px-2.5 py-1.5 border border-amber-200 rounded text-xs bg-white"
                                />
                                <input 
                                  type="text"
                                  placeholder="Numéro Téléphone / WhatsApp"
                                  value={newCustomer.phone}
                                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                                  className="w-full px-2.5 py-1.5 border border-amber-200 rounded text-xs bg-white"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-[10px] font-semibold text-amber-900 mb-1">Acompte Versé (BIF)</label>
                              <input 
                                type="number"
                                min="0"
                                value={amountPaidInitial}
                                onChange={(e) => setAmountPaidInitial(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 border border-amber-200 rounded-lg text-xs bg-white font-bold"
                              />
                            </div>
                          </div>
                        )}"""

new_block = """                        {/* UNIVERSAL CUSTOMER FIELD */}
                        <div className={`p-3 rounded-xl space-y-3 animate-fade-in text-xs border ${paymentStatus === 'Dette' ? 'bg-amber-50/60 border-amber-100' : 'bg-gray-50 border-gray-200'}`}>
                          <h4 className={`font-bold text-xs ${paymentStatus === 'Dette' ? 'text-amber-950' : 'text-gray-700'}`}>
                            {paymentStatus === 'Dette' ? 'Suivi Dette Client' : 'Informations Client (Optionnel)'}
                          </h4>
                          
                          <div>
                            <label className={`block text-[10px] font-semibold mb-1 ${paymentStatus === 'Dette' ? 'text-amber-900' : 'text-gray-500'}`}>Sélectionner un Client</label>
                            <select 
                              value={selectedCustomerId}
                              onChange={(e) => {
                                setSelectedCustomerId(e.target.value as any);
                                if (e.target.value === 'new') {
                                  setIsCreatingCustomerPOS(true);
                                } else {
                                  setIsCreatingCustomerPOS(false);
                                }
                              }}
                              className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white outline-none ${paymentStatus === 'Dette' ? 'border-amber-200' : 'border-gray-200'}`}
                            >
                              <option value="">{paymentStatus === 'Dette' ? '-- Choisir un client débiteur --' : '-- Client Comptoir (Anonyme) --'}</option>
                              {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                              ))}
                              <option value="new">+ Créer une nouvelle fiche client</option>
                            </select>
                          </div>

                          {isCreatingCustomerPOS && (
                            <div className={`space-y-2 border-t pt-2 ${paymentStatus === 'Dette' ? 'border-amber-100/50' : 'border-gray-200/50'}`}>
                              <input 
                                type="text"
                                placeholder="Nom Complet"
                                value={newCustomer.name}
                                onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                                className={`w-full px-2.5 py-1.5 border rounded text-xs bg-white ${paymentStatus === 'Dette' ? 'border-amber-200' : 'border-gray-200'}`}
                              />
                              <input 
                                type="text"
                                placeholder="Numéro Téléphone / WhatsApp"
                                value={newCustomer.phone}
                                onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                                className={`w-full px-2.5 py-1.5 border rounded text-xs bg-white ${paymentStatus === 'Dette' ? 'border-amber-200' : 'border-gray-200'}`}
                              />
                            </div>
                          )}

                          {paymentStatus === 'Dette' && (
                            <div>
                              <label className="block text-[10px] font-semibold text-amber-900 mb-1">Acompte Versé (BIF)</label>
                              <input 
                                type="number"
                                min="0"
                                value={amountPaidInitial}
                                onChange={(e) => setAmountPaidInitial(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 border border-amber-200 rounded-lg text-xs bg-white font-bold"
                              />
                            </div>
                          )}
                        </div>"""

content = content.replace(old_block, new_block)

# Remove the strict customer check for Cash if it exists (it was only inside the 'Dette' block earlier, so we're good).
# Wait, I need to make sure `finalCustomerId` handles 'new' even for Cash.
old_checkout_logic = """    if (paymentStatus === 'Dette') {
      if (selectedCustomerId === 'new') {
        if (!newCustomer.name || !newCustomer.phone) {
          showNotification('error', 'Veuillez saisir le nom et le téléphone du client débiteur.');
          return;
        }
        // Create customer
        const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
        const created: Customer = {
          id: newId,
          name: newCustomer.name,
          phone: newCustomer.phone
        };
        setCustomers([...customers, created]);
        finalCustomerId = newId;
        // Reset POS customer states
        setNewCustomer({ name: '', phone: '' });
        setIsCreatingCustomerPOS(false);
      } else if (selectedCustomerId === '') {
        showNotification('error', 'Sélectionnez un client débiteur ou créez-en un pour les dettes.');
        return;
      } else {
        finalCustomerId = Number(selectedCustomerId);
      }

      if (amountPaidInitial > total) {
        showNotification('error', 'L\\'acompte ne peut pas être supérieur au montant total de la vente.');
        return;
      }
    }"""

new_checkout_logic = """    // Handle Customer Creation universally
    if (selectedCustomerId === 'new') {
      if (!newCustomer.name || !newCustomer.phone) {
        showNotification('error', 'Veuillez saisir le nom et le téléphone du client.');
        return;
      }
      // Create customer
      const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
      const created: Customer = {
        id: newId,
        name: newCustomer.name,
        phone: newCustomer.phone
      };
      setCustomers([...customers, created]);
      finalCustomerId = newId;
      // Reset POS customer states
      setNewCustomer({ name: '', phone: '' });
      setIsCreatingCustomerPOS(false);
    } else if (selectedCustomerId !== '') {
      finalCustomerId = Number(selectedCustomerId);
    }

    if (paymentStatus === 'Dette') {
      if (!finalCustomerId) {
        showNotification('error', 'Sélectionnez un client débiteur ou créez-en un pour les dettes.');
        return;
      }
      if (amountPaidInitial > total) {
        showNotification('error', 'L\\'acompte ne peut pas être supérieur au montant total de la vente.');
        return;
      }
    }"""
content = content.replace(old_checkout_logic, new_checkout_logic)

with open('src/App.tsx', 'w') as f:
    f.write(content)
