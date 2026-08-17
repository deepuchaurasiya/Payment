import React from 'react';
import { X, Printer, Download, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateClientStatementPDF } from '../services/exportService';

export const ReceiptModal = ({ isOpen, onClose, client, payment }) => {
  const { user } = useAuth();

  if (!isOpen || !payment) return null;

  const handleDownloadStatement = () => {
    if (client) {
      generateClientStatementPDF(client, [payment], user);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={20} color="#10b981" />
            <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Payment Receipt</h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ background: '#ffffff', color: '#1e293b', padding: '28px', borderRadius: '4px' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '16px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{user?.businessName || 'DueLedger Payment Receipt'}</h2>
            <p style={{ fontSize: '11px', color: '#64748b' }}>Official Transaction Acknowledgment</p>
            {user?.upiId && <p style={{ fontSize: '11px', color: '#6366f1', marginTop: '2px' }}>UPI: {user.upiId}</p>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Receipt Date:</span>
            <span style={{ fontWeight: 600 }}>{new Date(payment.paymentDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Received From:</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{client?.name || payment.clientId?.name || 'Client'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Payment Mode:</span>
            <span style={{ fontWeight: 600 }}>{payment.paymentMethod || 'UPI'}</span>
          </div>

          {payment.referenceNumber && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#64748b' }}>UTR / Ref #:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{payment.referenceNumber}</span>
            </div>
          )}

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              margin: '18px 0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Amount Paid
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
              ₹{Number(payment.amount).toLocaleString('en-IN')}
            </div>
          </div>

          {payment.notes && (
            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '12px' }}>
              Note: {payment.notes}
            </div>
          )}

          <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginTop: '16px' }}>
            Thank you for your payment! This is a digitally verified receipt.
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} />
            Print Receipt
          </button>
          {client && (
            <button type="button" className="btn btn-primary" onClick={handleDownloadStatement}>
              <Download size={16} />
              Download Statement PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
