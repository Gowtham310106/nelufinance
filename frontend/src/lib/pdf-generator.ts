// src/lib/pdf-generator.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { AdakuKadanItem, AdakuPaymentItem } from "@/features/adaku/hooks/use-adaku";
import { Customer, CustomerLedgerEntry } from "@/features/customers/hooks/use-customers";
import { Sale } from "@/features/sales/hooks/use-sales";

export interface ShopInfo {
  name: string;
  phone: string;
  address?: string;
}

/**
 * 1. Generate Adaku Pawn Pledge Ticket PDF (அடகு ரசீது / சீட்டு)
 */
export async function generateAdakuPawnTicketPDF(pledge: AdakuKadanItem, shop: ShopInfo) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5", // Compact standard pawn slip size
  });

  const pavan = (pledge.netWeightGrams / 8).toFixed(2);
  const loanRupees = (pledge.loanAmountPaise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  // Header
  doc.setFillColor(245, 243, 239);
  doc.rect(0, 0, 148, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(180, 83, 9);
  doc.text(shop.name || "VETRINEL RICE & PAWN TRADERS", 74, 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`${shop.address || "Tamil Nadu"} • Ph: ${shop.phone || ""}`, 74, 15, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("PAWN PLEDGE RECEIPT / அடகு ரசீது", 74, 23, { align: "center" });

  doc.setDrawColor(200, 200, 200);
  doc.line(10, 28, 138, 28);

  // Ticket Meta Grid
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);

  doc.setFont("helvetica", "bold");
  doc.text(`Pledge No: ${pledge.pledgeNumber}`, 12, 35);
  doc.text(`Date: ${new Date(pledge.pledgeDate).toLocaleDateString("en-IN")}`, 95, 35);

  doc.setFont("helvetica", "normal");
  doc.text(`Locker: ${pledge.lockerNumber || "Safe Vault"}`, 12, 40);
  doc.text(`Due Date: ${new Date(pledge.dueDate).toLocaleDateString("en-IN")}`, 95, 40);

  // Customer Box
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(10, 44, 128, 20, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Customer / வாடிக்கையாளர்: ${pledge.customerName}`, 14, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Phone: ${pledge.customerPhone} ${pledge.customerAadhaar ? `• Aadhaar/ID: ${pledge.customerAadhaar}` : ""}`, 14, 55);
  if (pledge.customerAddress) {
    doc.text(`Address: ${pledge.customerAddress}`, 14, 60);
  }

  // Collateral Details Table
  autoTable(doc, {
    startY: 68,
    theme: "grid",
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    head: [["Item Description (பொருள்)", "Karat", "Gross (g)", "Net (g / Pavan)"]],
    body: [
      [
        `${pledge.itemDescription} (${pledge.itemCount} item)`,
        pledge.purityKarat,
        `${pledge.grossWeightGrams} g`,
        `${pledge.netWeightGrams} g (${pavan} Pavan)`,
      ],
    ],
    margin: { left: 10, right: 10 },
  });

  const afterTableY = (doc as any).lastAutoTable.finalY + 6;

  // Loan & Interest Box
  doc.setFillColor(254, 243, 199); // Amber light
  doc.roundedRect(10, afterTableY, 128, 22, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(180, 83, 9);
  doc.text(`Loan Principal (அடகு கடன் தொகை):  Rs. ${loanRupees}`, 14, afterTableY + 8);

  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Monthly Vatti Rate (மாத வட்டி): Rs. ${pledge.monthlyVattiRate.toFixed(2)} per Rs. 100/month`, 14, afterTableY + 14);
  doc.text(`Status: ${pledge.status}`, 14, afterTableY + 19);

  // Terms & Conditions note
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Terms: 1. Monthly interest must be paid promptly. 2. Pledged items can be redeemed upon full payment of principal and interest. 3. Loss of pawn ticket must be notified immediately.",
    10,
    afterTableY + 30,
    { maxWidth: 128 }
  );

  // Signatures
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text("Customer Signature", 14, afterTableY + 44);
  doc.text("Authorized Signatory (Pawnbroker)", 90, afterTableY + 44);

  // Save PDF
  doc.save(`Adaku_Ticket_${pledge.pledgeNumber}.pdf`);
}

/**
 * 2. Generate Adaku Payment Receipt PDF (வட்டி / பொருள் மீட்பு ரசீது)
 */
export async function generateAdakuPaymentReceiptPDF(
  payment: AdakuPaymentItem,
  pledge: AdakuKadanItem,
  shop: ShopInfo
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(180, 83, 9);
  doc.text(shop.name || "VETRINEL TRADERS", 74, 12, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    payment.type === "FULL_REDEMPTION"
      ? "COLLATERAL REDEMPTION RECEIPT (பொருள் மீட்பு ரசீது)"
      : "VATTI INTEREST PAYMENT RECEIPT (வட்டி ரசீது)",
    74,
    18,
    { align: "center" }
  );

  doc.setDrawColor(200, 200, 200);
  doc.line(10, 22, 138, 22);

  doc.setFontSize(8.5);
  doc.text(`Receipt No: ${payment.receiptNumber}`, 12, 28);
  doc.text(`Date: ${new Date(payment.date).toLocaleDateString("en-IN")}`, 95, 28);
  doc.text(`Pledge Ref: ${payment.pledgeNumber}`, 12, 34);
  doc.text(`Customer: ${payment.customerName}`, 95, 34);

  autoTable(doc, {
    startY: 40,
    theme: "grid",
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    head: [["Particulars", "Details", "Amount (Rs.)"]],
    body: [
      ["Pledged Item", `${pledge.itemDescription} (${pledge.netWeightGrams}g)`, "-"],
      ["Interest Payment", `${payment.monthsCovered || 1} month(s) interest`, `Rs. ${(payment.interestAmountPaise / 100).toFixed(2)}`],
      ["Principal Payment", payment.type === "FULL_REDEMPTION" ? "Full Loan Repayment" : "Partial Repayment", `Rs. ${(payment.principalAmountPaise / 100).toFixed(2)}`],
      ["Total Paid", `Mode: ${payment.paymentMethod.toUpperCase()}`, `Rs. ${(payment.totalPaidPaise / 100).toFixed(2)}`],
    ],
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  if (payment.type === "FULL_REDEMPTION") {
    doc.text("Declaration: I have received the pledged article in good condition without any damage.", 12, finalY);
  }

  doc.text("Customer Signature", 14, finalY + 16);
  doc.text("Pawnbroker Signature", 90, finalY + 16);

  doc.save(`Adaku_Receipt_${payment.receiptNumber}.pdf`);
}

/**
 * 3. Generate Sales Bill Invoice PDF (விற்பனை ரசீது)
 */
export async function generateSaleBillPDF(sale: Sale, shop: ShopInfo) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(180, 83, 9);
  doc.text(shop.name || "VETRINEL RICE TRADERS", 105, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`${shop.address || "Tamil Nadu"} • Ph: ${shop.phone || ""}`, 105, 22, { align: "center" });
  doc.text("TAX INVOICE / SALES BILL (விற்பனை ரசீது)", 105, 28, { align: "center" });

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 32, 196, 32);

  // Meta
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Bill No: ${sale.transactionNumber}`, 14, 38);
  doc.text(`Date: ${new Date(sale.date).toLocaleDateString("en-IN")}`, 140, 38);
  doc.text(`Customer: ${sale.customerName || "Cash / Walk-in"}`, 14, 44);
  doc.text(`Payment: ${sale.paymentMethod.toUpperCase()}`, 140, 44);

  // Items Table
  const tableRows = sale.items.map((item, index) => [
    index + 1,
    item.productName,
    `${item.inputQuantity || 1} ${item.inputUnit || "kg"}`,
    `${item.quantityKg} kg`,
    `Rs. ${(item.ratePaisePerKg / 100).toFixed(2)}/kg`,
    `Rs. ${(item.totalAmountPaise / 100).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 50,
    theme: "striped",
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    head: [["S.No", "Product Name", "Units", "Weight (kg)", "Rate / Unit", "Amount (Rs.)"]],
    body: tableRows,
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Summary Box
  const totalRupees = (sale.totalAmountPaise / 100).toFixed(2);
  const paidRupees = (sale.receivedAmountPaise / 100).toFixed(2);
  const creditRupees = (sale.creditAmountPaise / 100).toFixed(2);

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(120, finalY, 76, 26, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(`Total Bill: Rs. ${totalRupees}`, 124, finalY + 7);
  doc.text(`Paid: Rs. ${paidRupees}`, 124, finalY + 14);
  if (sale.creditAmountPaise > 0) {
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`Udhar / Credit: Rs. ${creditRupees}`, 124, finalY + 21);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Thank you for your business! / நன்றி மீண்டும் வருக!", 105, finalY + 40, { align: "center" });

  doc.save(`Sale_Bill_${sale.transactionNumber}.pdf`);
}

/**
 * 4. Generate Customer Statement PDF (கணக்கு அறிக்கை)
 */
export async function generateCustomerStatementPDF(
  customer: Customer,
  entries: CustomerLedgerEntry[],
  shop: ShopInfo
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(180, 83, 9);
  doc.text(shop.name || "VETRINEL TRADERS", 105, 16, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`CUSTOMER STATEMENT OF ACCOUNT (வாடிக்கையாளர் கணக்கு அறிக்கை)`, 105, 23, { align: "center" });

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 28, 196, 28);

  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Customer Name: ${customer.name}`, 14, 34);
  doc.text(`Phone: ${customer.phone}`, 14, 40);
  doc.text(`As of Date: ${new Date().toLocaleDateString("en-IN")}`, 140, 34);
  doc.text(`Outstanding Due: Rs. ${((customer.currentBalancePaise || 0) / 100).toFixed(2)}`, 140, 40);

  const tableRows = entries.map((entry) => [
    new Date(entry.date).toLocaleDateString("en-IN"),
    entry.transactionNumber || "-",
    entry.description,
    entry.debitPaise > 0 ? `Rs. ${(entry.debitPaise / 100).toFixed(2)}` : "-",
    entry.creditPaise > 0 ? `Rs. ${(entry.creditPaise / 100).toFixed(2)}` : "-",
    `Rs. ${(entry.runningBalancePaise / 100).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 46,
    theme: "grid",
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontSize: 8.5 },
    bodyStyles: { fontSize: 8 },
    head: [["Date", "Txn No", "Description", "Debit (+)", "Credit (-)", "Running Bal (Rs.)"]],
    body: tableRows,
    margin: { left: 14, right: 14 },
  });

  doc.save(`Statement_${customer.name.replace(/\s+/g, "_")}.pdf`);
}
