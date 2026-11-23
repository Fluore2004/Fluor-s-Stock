/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sale, SaleItem, Product, Customer, Expense, CompanySettings } from '../types';

export interface PrintA4ReportOptions {
  periodName: string;
  dateSubtitle?: string;
  salesList: Sale[];
  saleItems: SaleItem[];
  expensesList: Expense[];
  products: Product[];
  customers: Customer[];
  userName: string;
  userRole: string;
  companySettings?: CompanySettings;
}

const formatBIF = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' BIF';
};

/**
 * Generates and opens an A4 Portrait Sales History & Financial Report Pop-up.
 * Complies with `@page { size: A4 portrait; margin: 15mm; }`.
 */
export function printA4SalesReport(options: PrintA4ReportOptions): boolean {
  const {
    periodName,
    dateSubtitle,
    salesList,
    saleItems,
    expensesList,
    products,
    customers,
    userName,
    userRole,
    companySettings
  } = options;

  const companyName = companySettings?.name || 'Nom du Commerce';
  const companyAddress = companySettings?.address || 'Bujumbura, Burundi';
  const companyPhone = companySettings?.phone || '+257 22 00 00 00';
  const companyNif = companySettings?.nif || '';
  const companyCurrency = companySettings?.currency || 'BIF';

  // 1. Calculate Totals & Net Margins
  const totalSalesCount = salesList.length;
  const totalRevenue = salesList.reduce((sum, s) => sum + s.total_amount, 0);
  const totalExpenses = expensesList.reduce((sum, e) => sum + e.amount, 0);

  let totalCost = 0;
  let totalProfit = 0;

  // Breakdown by payment mode
  let especesAmount = 0;
  let especesCount = 0;
  let mobileMoneyAmount = 0;
  let mobileMoneyCount = 0;
  let virementAmount = 0;
  let virementCount = 0;
  let detteAmount = 0;
  let detteCount = 0;

  // Prepare table row data
  const saleIdSet = new Set(salesList.map(s => s.id));
  const relevantItems = saleItems.filter(item => saleIdSet.has(item.sale_id));

  // Map of sale items grouped by sale_id
  const itemsBySale = new Map<number, SaleItem[]>();
  for (const item of relevantItems) {
    const list = itemsBySale.get(item.sale_id) || [];
    list.push(item);
    itemsBySale.set(item.sale_id, list);
  }

  const rows = salesList.map(sale => {
    const sItems = itemsBySale.get(sale.id) || [];
    let saleCost = 0;
    let saleProfit = 0;

    const itemsSummaryList: string[] = [];
    for (const it of sItems) {
      const prod = products.find(p => p.id === it.product_id);
      const buyPrice = prod ? prod.purchase_price : 0;
      saleCost += it.quantity * buyPrice;
      saleProfit += it.quantity * (it.unit_price - buyPrice);
      const prodName = prod ? prod.name : `Produit #${it.product_id}`;
      itemsSummaryList.push(`${it.quantity}x ${prodName}`);
    }

    totalCost += saleCost;
    totalProfit += saleProfit;

    // Track payment stats
    if (sale.payment_status === 'Dette') {
      detteAmount += sale.total_amount;
      detteCount++;
    } else {
      const method = sale.payment_method || 'Espèces';
      if (method === 'Mobile Money') {
        mobileMoneyAmount += sale.total_amount;
        mobileMoneyCount++;
      } else if (method === 'Virement') {
        virementAmount += sale.total_amount;
        virementCount++;
      } else {
        especesAmount += sale.total_amount;
        especesCount++;
      }
    }

    const customer = customers.find(c => c.id === sale.customer_id);
    const customerLabel = customer 
      ? `${customer.name} (${customer.phone || 'N/A'})` 
      : 'Client Comptoir (Anonyme)';

    const dateFormatted = new Date(sale.created_at).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const paymentLabel = sale.payment_status === 'Dette' 
      ? 'Crédit / Dette' 
      : (sale.payment_method || 'Espèces');

    const paymentRef = sale.payment_reference || 'N/A';

    return {
      id: sale.id,
      code: `#FLX-${String(sale.id).padStart(4, '0')}`,
      date: dateFormatted,
      customer: customerLabel,
      paymentLabel,
      paymentRef,
      paymentStatus: sale.payment_status,
      itemsSummary: itemsSummaryList.join(', ') || 'Articles divers',
      totalAmount: sale.total_amount,
      profit: saleProfit
    };
  });

  const marginRate = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const printDateStr = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // 2. Open pop-up window and write A4 document
  const printWindow = window.open('', '_blank', 'width=1000,height=900,menubar=no,toolbar=no,location=no,status=no');
  if (!printWindow) {
    return false;
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport A4 - Historique des Ventes (${periodName}) - ${companyName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 10pt;
      line-height: 1.4;
      padding: 0;
    }

    /* Floating On-Screen Toolbar for direct printing */
    .print-toolbar {
      position: fixed;
      top: 12px;
      right: 12px;
      background: #0f172a;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      gap: 10px;
      align-items: center;
      z-index: 9999;
      font-size: 13px;
      font-weight: bold;
    }

    .btn-action {
      background: #0066FF;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
      transition: background 0.2s;
    }

    .btn-action:hover {
      background: #0052cc;
    }

    .btn-secondary {
      background: #334155;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    }

    .btn-secondary:hover {
      background: #475569;
    }

    @media print {
      .print-toolbar {
        display: none !important;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }

    .container {
      width: 100%;
      max-width: 180mm;
      margin: 0 auto;
    }

    /* HEADER */
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 15px;
    }

    .company-name {
      font-size: 18pt;
      font-weight: 900;
      color: #0d1b2a;
      letter-spacing: -0.5px;
    }

    .company-sub {
      font-size: 8.5pt;
      color: #475569;
      font-weight: 500;
      margin-top: 2px;
    }

    .report-badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #bae6fd;
    }

    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 15px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      font-size: 8.5pt;
    }

    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .meta-item span {
      font-weight: 700;
      color: #0f172a;
      font-size: 9pt;
    }

    /* TABLE */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 8.5pt;
    }

    table.data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.5px;
      padding: 7px 8px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }

    table.data-table th.text-right,
    table.data-table td.text-right {
      text-align: right;
    }

    table.data-table th.text-center,
    table.data-table td.text-center {
      text-align: center;
    }

    table.data-table td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    table.data-table tr:nth-child(even) {
      background: #fafafa;
    }

    .tag-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
    }

    .tag-especes { background: #dcfce7; color: #166534; }
    .tag-mobile { background: #dbeafe; color: #1e40af; }
    .tag-virement { background: #e0e7ff; color: #3730a3; }
    .tag-dette { background: #fef3c7; color: #92400e; }

    /* SUMMARY TOTALS */
    .summary-section {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    .summary-title {
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 10px;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: left;
    }

    .kpi-card.highlight {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    .kpi-card .kpi-label {
      font-size: 7pt;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 2px;
    }

    .kpi-card .kpi-val {
      font-size: 11pt;
      font-weight: 900;
      color: #0f172a;
    }

    .kpi-card.highlight .kpi-val {
      color: #0066FF;
    }

    /* PAYMENT BREAKDOWN PILLS */
    .breakdown-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 8pt;
      background: #ffffff;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .breakdown-item strong {
      color: #0f172a;
    }

    /* SIGNATURE BLOCK */
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 24px;
      page-break-inside: avoid;
    }

    .signature-box {
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
      text-align: center;
      font-size: 8pt;
      color: #475569;
    }

    .signature-box strong {
      color: #0f172a;
      display: block;
      margin-bottom: 35px;
    }

    /* FOOTER */
    .footer-note {
      text-align: center;
      font-size: 7pt;
      color: #94a3b8;
      margin-top: 20px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
  </style>
</head>
<body>

  <!-- Floating screen toolbar -->
  <div class="print-toolbar">
    <span>Impression Format A4</span>
    <button class="btn-action" onclick="window.print()">Imprimer maintenant</button>
    <button class="btn-secondary" onclick="window.close()">Fermer</button>
  </div>

  <div class="container">
    
    <!-- HEADER -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="company-name">${companyName}</div>
          <div class="company-sub">Système de Gestion Commerciale, Stocks & Caisse POS</div>
          <div class="company-sub">${companyAddress} • Tél : ${companyPhone} ${companyNif ? `• NIF : ${companyNif}` : ''}</div>
        </td>
        <td style="vertical-align: top; text-align: right;">
          <div class="report-badge">RAPPORT FINANCIER A4</div>
          <div style="font-size: 8pt; color: #64748b; margin-top: 6px; font-weight: 600;">
            Période : <strong style="color: #0f172a;">${periodName}</strong>
          </div>
          ${dateSubtitle ? `<div style="font-size: 7.5pt; color: #94a3b8;">${dateSubtitle}</div>` : ''}
        </td>
      </tr>
    </table>

    <!-- METADATA BOX -->
    <div class="meta-box">
      <div class="meta-item">
        <strong>Période Analysée</strong>
        <span>${periodName}</span>
      </div>
      <div class="meta-item">
        <strong>Date & Heure d'Édition</strong>
        <span>${printDateStr}</span>
      </div>
      <div class="meta-item">
        <strong>Opérateur / Caisse</strong>
        <span>${userName} (${userRole})</span>
      </div>
      <div class="meta-item">
        <strong>Volume Ventes</strong>
        <span>${totalSalesCount} transaction(s)</span>
      </div>
    </div>

    <!-- SALES DATA TABLE -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 14%;">N° Facture</th>
          <th style="width: 16%;">Date & Heure</th>
          <th style="width: 22%;">Client</th>
          <th style="width: 18%;">Règlement & Réf</th>
          <th style="width: 16%;" class="text-right">Montant Vente</th>
          <th style="width: 14%;" class="text-right">Marge Nette</th>
        </tr>
      </thead>
      <tbody>
        ${rows.length === 0 ? `
          <tr>
            <td colspan="6" class="text-center" style="padding: 24px; color: #94a3b8;">
              Aucune vente enregistrée pour la période sélectionnée.
            </td>
          </tr>
        ` : rows.map(r => `
          <tr>
            <td>
              <strong style="color: #0f172a;">${r.code}</strong>
            </td>
            <td>${r.date}</td>
            <td>
              <div style="font-weight: 600; color: #1e293b;">${r.customer}</div>
              <div style="font-size: 7pt; color: #64748b; margin-top: 1px;">${r.itemsSummary}</div>
            </td>
            <td>
              <span class="tag-badge ${
                r.paymentStatus === 'Dette' ? 'tag-dette' :
                r.paymentLabel === 'Mobile Money' ? 'tag-mobile' :
                r.paymentLabel === 'Virement' ? 'tag-virement' : 'tag-especes'
              }">
                ${r.paymentLabel}
              </span>
              <div style="font-size: 7pt; font-family: monospace; color: #64748b; margin-top: 2px;">
                Réf: ${r.paymentRef}
              </div>
            </td>
            <td class="text-right">
              <strong>${formatBIF(r.totalAmount)}</strong>
            </td>
            <td class="text-right" style="color: #0284c7; font-weight: 700;">
              +${formatBIF(r.profit)}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- BOTTOM FINANCIAL SUMMARY BLOCK -->
    <div class="summary-section">
      <div class="summary-title">Bilan Récapitulatif & Performance Financière Globales</div>
      
      <div class="kpi-grid" style="grid-template-columns: repeat(5, 1fr);">
        <div class="kpi-card highlight">
          <div class="kpi-label">Chiffre d'Affaires Total (CA)</div>
          <div class="kpi-val">${formatBIF(totalRevenue)}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Marge Brute (Ventes)</div>
          <div class="kpi-val" style="color: #475569;">${formatBIF(totalProfit)}</div>
        </div>

        <div class="kpi-card" style="background: #fef2f2; border-color: #fecaca;">
          <div class="kpi-label" style="color: #991b1b;">Total Charges / Dépenses</div>
          <div class="kpi-val" style="color: #b91c1c;">-${formatBIF(totalExpenses)}</div>
        </div>

        <div class="kpi-card highlight" style="background: #ecfdf5; border-color: #a7f3d0;">
          <div class="kpi-label" style="color: #065f46;">Bénéfice Net Réel</div>
          <div class="kpi-val" style="color: #059669;">+${formatBIF(totalProfit - totalExpenses)}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Taux de Rentabilité Réel</div>
          <div class="kpi-val" style="color: #0284c7;">${totalRevenue > 0 ? (((totalProfit - totalExpenses) / totalRevenue) * 100).toFixed(1) : 0} %</div>
        </div>
      </div>

      <!-- PAYMENT METHODS RECAP -->
      <div class="breakdown-row">
        <div class="breakdown-item">
          <span style="color: #166534;">● Espèces :</span>
          <strong>${formatBIF(especesAmount)}</strong> (${especesCount})
        </div>
        <div class="breakdown-item">
          <span style="color: #1e40af;">● Mobile Money :</span>
          <strong>${formatBIF(mobileMoneyAmount)}</strong> (${mobileMoneyCount})
        </div>
        <div class="breakdown-item">
          <span style="color: #3730a3;">● Virement :</span>
          <strong>${formatBIF(virementAmount)}</strong> (${virementCount})
        </div>
        <div class="breakdown-item">
          <span style="color: #92400e;">● Dettes / Crédits :</span>
          <strong>${formatBIF(detteAmount)}</strong> (${detteCount})
        </div>
      </div>
    </div>

    <!-- SIGNATURE & VISA SECTION -->
    <div class="signature-grid">
      <div class="signature-box">
        <strong>Visa du Caissier / Opérateur</strong>
        <span>Nom : ${userName} (${userRole})</span>
      </div>
      <div class="signature-box">
        <strong>Visa de la Direction Générale</strong>
        <span>${companyName} - ${companyAddress}</span>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer-note" style="display: flex; justify-content: space-between; align-items: center; font-size: 7.5pt;">
      <span>Document officiel généré par <strong>${companyName}</strong> - ${companyAddress}</span>
      <span style="color: #475569; font-weight: 600;">Logiciel édité par FLODELIXA Technologies (AI • Software • Digital Solutions)</span>
    </div>

  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  return true;
}
