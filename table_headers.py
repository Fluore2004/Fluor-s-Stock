import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# For each table we'll change the thead block.
old_thead1 = """                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold">
                          <th className="p-3">Réf/Date</th>
                          <th className="p-3">Client</th>
                          <th className="p-3">Mode</th>
                          <th className="p-3 text-right">Montant Total</th>
                        </tr>
                      </thead>"""

new_thead1 = """                      <thead className="bg-gray-50 text-[11px] uppercase text-gray-400 font-bold sticky top-0">
                        <tr>
                          <th className="px-6 py-3">Réf/Date</th>
                          <th className="px-6 py-3">Client</th>
                          <th className="px-6 py-3">Mode</th>
                          <th className="px-6 py-3 text-right">Montant Total</th>
                        </tr>
                      </thead>"""

old_thead2 = """                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold">
                      <th className="p-3">Code / Produit</th>
                      <th className="p-3">Catégorie</th>
                      <th className="p-3 text-right">Prix d'Achat</th>
                      <th className="p-3 text-right">Prix de Vente</th>
                      <th className="p-3 text-right">Stock</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>"""

new_thead2 = """                  <thead className="bg-gray-50 text-[11px] uppercase text-gray-400 font-bold sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Code / Produit</th>
                      <th className="px-6 py-3">Catégorie</th>
                      <th className="px-6 py-3 text-right">Prix d'Achat</th>
                      <th className="px-6 py-3 text-right">Prix de Vente</th>
                      <th className="px-6 py-3 text-right">Stock</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>"""

old_thead3 = """                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold">
                      <th className="p-3">Client Débiteur</th>
                      <th className="p-3">Date Vente</th>
                      <th className="p-3 text-right">Crédit Total</th>
                      <th className="p-3 text-right">Total Remboursé</th>
                      <th className="p-3 text-right">Reste à Payer</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>"""

new_thead3 = """                  <thead className="bg-gray-50 text-[11px] uppercase text-gray-400 font-bold sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Client Débiteur</th>
                      <th className="px-6 py-3">Date Vente</th>
                      <th className="px-6 py-3 text-right">Crédit Total</th>
                      <th className="px-6 py-3 text-right">Total Remboursé</th>
                      <th className="px-6 py-3 text-right">Reste à Payer</th>
                      <th className="px-6 py-3 text-center">Action</th>
                    </tr>
                  </thead>"""

content = content.replace(old_thead1, new_thead1)
content = content.replace(old_thead2, new_thead2)
content = content.replace(old_thead3, new_thead3)

# And update the td padding to match the design (px-6 py-4 instead of p-3)
# We can just replace `<td className="p-3"` with `<td className="px-6 py-4"`
# Wait, let's just do it directly.
content = content.replace('className="p-3"', 'className="px-6 py-4"')
content = content.replace('className="p-3 text-right"', 'className="px-6 py-4 text-right"')
content = content.replace('className="p-3 text-center"', 'className="px-6 py-4 text-center"')
content = content.replace('className="p-3 text-right font-bold text-gray-900"', 'className="px-6 py-4 text-right font-bold text-gray-900"')

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Tables updated.")
