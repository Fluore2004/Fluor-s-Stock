import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_block = """  const imprimerFacture = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };"""

new_block = """  const imprimerFacture = () => {
    setTimeout(() => {
      try {
        // Détection iframe : window.print() échoue ou est ignoré silencieusement dans une sandbox sans allow-modals
        if (window.top !== window.self) {
          throw new Error("Environnement sandbox iframe détecté");
        }
        window.print();
      } catch (error) {
        console.warn("Impression native bloquée, utilisation du fallback autonome :", error);
        
        const modalContent = document.getElementById('carte-recu');
        if (modalContent) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Facture FLORIXA</title>
                  <script src="https://cdn.tailwindcss.com"></script>
                  <style>
                    body { background: white; margin: 0; padding: 20px; font-family: sans-serif; display: flex; justify-content: center; }
                    #carte-recu { max-width: 320px; width: 100%; border: none !important; box-shadow: none !important; }
                    .no-print, .print\\\\:hidden, button { display: none !important; }
                  </style>
                </head>
                <body>
                  ${modalContent.outerHTML}
                  <script>
                    setTimeout(() => {
                      window.print();
                      window.close();
                    }, 800);
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
          } else {
            alert("Veuillez autoriser les pop-ups pour imprimer la facture.");
          }
        }
      }
    }, 100);
  };"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Success: Imprimer fallback applied.")
else:
    print("Error: Old block not found.")

