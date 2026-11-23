import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Update POS form labels
content = content.replace(
    '<label className="block text-[10px] font-semibold text-amber-900 mb-1">Acompte Versé (BIF)</label>',
    '<label className="block text-[10px] font-semibold text-amber-900 mb-1">Avance versée (BIF)</label>'
)

content = content.replace(
    '<input \n                                type="text"\n                                placeholder="Nom Complet"',
    '<input \n                                type="text"\n                                placeholder="Nom et Prénom"'
)

# 2. Update Receipt label
content = content.replace(
    '<span>Acompte Versé:</span>',
    '<span>Avance versée:</span>'
)

# 3. Update Debts Registry to show phone and contact action
old_debt_customer = """                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{customer?.name || 'Inconnu'}</div>
                            <div className="text-[10px] text-gray-400">ID: {debt.customer_id}</div>
                          </td>"""

new_debt_customer = """                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{customer?.name || 'Inconnu'}</div>
                            {customer?.phone ? (
                              <div className="flex flex-col items-start mt-0.5">
                                <span className="text-[10px] text-gray-500 font-medium">{customer.phone}</span>
                                <a 
                                  href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[9px] text-[#0066FF] hover:underline font-bold mt-0.5 inline-flex items-center gap-1"
                                >
                                  Relancer
                                </a>
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-400">Sans contact</div>
                            )}
                          </td>"""

content = content.replace(old_debt_customer, new_debt_customer)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Adjustments applied.")
