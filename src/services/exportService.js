import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Format INR currency for exports
export const formatINR = (val) => {
  return `Rs. ${Number(val || 0).toLocaleString('en-IN')}`;
};

export const exportClientsCSV = (clients, filename = 'dueledger_export.csv') => {
  const data = clients.map((c, index) => ({
    'S.No': index + 1,
    'Type': c.ledgerType === 'PAYABLE' ? 'I Borrowed (To Pay)' : 'Borrowed From Me (To Receive)',
    'Person Name': c.name,
    'Phone': c.phone || 'N/A',
    'Email': c.email || 'N/A',
    'Reference ID': c.clientRefId || 'N/A',
    'Total Agreed (INR)': c.totalAmount || c.totalExpected,
    'Total Cleared (INR)': c.totalPaid,
    'Remaining Balance (INR)': c.remainingAmount,
    'Payment %': `${c.paymentPercentage}%`,
    'Status': c.status,
    'Due Date': new Date(c.dueDate).toLocaleDateString('en-IN'),
    'Days Overdue': c.daysOverdue || 0,
    'Notes': c.notes || '',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportPaymentsCSV = (payments, filename = 'payment_transactions_export.csv') => {
  const data = payments.map((p, index) => ({
    'Transaction No': index + 1,
    'Payment ID': p._id,
    'Client Name': p.clientId?.name || 'N/A',
    'Amount (INR)': p.amount,
    'Payment Date': new Date(p.paymentDate).toLocaleDateString('en-IN'),
    'Payment Method': p.paymentMethod,
    'Reference / Transaction #': p.referenceNumber || 'N/A',
    'Notes': p.notes || '',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateClientStatementPDF = (client, payments = [], userProfile = {}) => {
  const doc = new jsPDF();

  // Header Title
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text(userProfile.businessName || 'DueLedger Statement', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 14, 26);
  if (userProfile.upiId) {
    doc.text(`UPI Payment Handle: ${userProfile.upiId}`, 14, 31);
  }

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 35, 196, 35);

  // Client Details Section
  doc.setFontSize(14);
  doc.setTextColor(33, 37, 41);
  doc.text(`Account Statement: ${client.name}`, 14, 44);

  doc.setFontSize(10);
  doc.setTextColor(70, 80, 95);
  doc.text(`Phone: ${client.phone || 'N/A'}`, 14, 51);
  doc.text(`Email: ${client.email || 'N/A'}`, 14, 56);
  doc.text(`Due Date: ${new Date(client.dueDate).toLocaleDateString('en-IN')}`, 14, 61);

  // Summary Metrics Box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(120, 39, 76, 26, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setTextColor(100, 110, 120);
  doc.text('Total Agreed:', 124, 46);
  doc.text('Total Received:', 124, 52);
  doc.text('Remaining Due:', 124, 58);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text(formatINR(client.totalExpected || client.totalAmount), 160, 46);
  doc.setTextColor(16, 185, 129);
  doc.text(formatINR(client.totalPaid), 160, 52);
  doc.setTextColor(client.remainingAmount > 0 ? 225 : 16, client.remainingAmount > 0 ? 29 : 185, client.remainingAmount > 0 ? 72 : 129);
  doc.text(formatINR(client.remainingAmount), 160, 58);

  doc.setFont('helvetica', 'normal');

  // Transactions Table
  const tableData = payments.map((p, i) => [
    i + 1,
    new Date(p.paymentDate).toLocaleDateString('en-IN'),
    p.paymentMethod || 'UPI',
    p.referenceNumber || '-',
    p.notes || '-',
    formatINR(p.amount),
  ]);

  doc.autoTable({
    startY: 72,
    head: [['#', 'Date', 'Method', 'Ref / UTR', 'Notes', 'Amount Paid']],
    body: tableData.length > 0 ? tableData : [['-', '-', 'No payment records yet', '-', '-', 'Rs. 0']],
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  // Footer Note
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(9);
  doc.setTextColor(130, 140, 150);
  doc.text('Thank you for your business. Please clear any pending balance before the due date.', 14, Math.min(finalY, 280));

  doc.save(`${client.name.replace(/\s+/g, '_')}_Payment_Statement.pdf`);
};
