import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const ClientModal = ({ isOpen, onClose, onSuccess, editClient = null }) => {
  const { addToast } = useToast();
  const [ledgerType, setLedgerType] = useState('RECEIVABLE'); // 'RECEIVABLE' (Borrowed from me) | 'PAYABLE' (I borrowed)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [clientRefId, setClientRefId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editClient) {
      setLedgerType(editClient.ledgerType || 'RECEIVABLE');
      setName(editClient.name || '');
      setPhone(editClient.phone || '');
      setEmail(editClient.email || '');
      setAddress(editClient.address || '');
      setClientRefId(editClient.clientRefId || '');
      setTotalAmount(String(editClient.totalAmount || editClient.totalExpected || ''));
      setDueDate(
        editClient.dueDate
          ? new Date(editClient.dueDate).toISOString().split('T')[0]
          : ''
      );
      setNotes(editClient.notes || '');
    } else {
      // Defaults for new entry
      setLedgerType('RECEIVABLE');
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setClientRefId('');
      setTotalAmount('');
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      setDueDate(defaultDate.toISOString().split('T')[0]);
      setNotes('');
    }
  }, [editClient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Please enter person / client name', 'error');
      return;
    }
    if (!totalAmount || Number(totalAmount) < 0) {
      addToast('Please enter a valid total amount', 'error');
      return;
    }
    if (!dueDate) {
      addToast('Please select a scheduled due date', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ledgerType,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        clientRefId: clientRefId.trim(),
        totalAmount: Number(totalAmount),
        dueDate,
        notes: notes.trim(),
      };

      if (editClient) {
        await api.clients.update(editClient._id || editClient.id, payload);
        addToast(`Record for '${name}' updated successfully!`, 'success');
      } else {
        await api.clients.create(payload);
        addToast(
          ledgerType === 'RECEIVABLE'
            ? `New Receivable: Added '${name}' (Borrowed from you)`
            : `New Payable: Added '${name}' (You borrowed from them)`,
          'success'
        );
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to save record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isReceivable = ledgerType === 'RECEIVABLE';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: isReceivable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                color: isReceivable ? '#10b981' : '#f43f5e',
                padding: '8px',
                borderRadius: '8px',
              }}
            >
              {isReceivable ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                {editClient
                  ? `Edit Record: ${editClient.name}`
                  : isReceivable
                  ? 'Add Person (Borrowed From Me)'
                  : 'Add Person (Which I Have Borrowed)'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {isReceivable
                  ? 'You gave money → You will receive repayment'
                  : 'You took money → You need to pay back'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* TYPE SELECTOR TABS */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Transaction Type / Direction *</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '5px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setLedgerType('RECEIVABLE')}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: isReceivable ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                    color: isReceivable ? '#10b981' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: isReceivable ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none',
                    border: isReceivable ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent',
                  }}
                >
                  <ArrowDownLeft size={16} />
                  <span>They Borrowed From Me (Receive)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLedgerType('PAYABLE')}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: !isReceivable ? 'rgba(244, 63, 94, 0.25)' : 'transparent',
                    color: !isReceivable ? '#f43f5e' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: !isReceivable ? '0 0 12px rgba(244, 63, 94, 0.2)' : 'none',
                    border: !isReceivable ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid transparent',
                  }}
                >
                  <ArrowUpRight size={16} />
                  <span>I Borrowed (To Pay / Give)</span>
                </button>
              </div>
            </div>

            {/* Person Name & Ref ID */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">
                  {isReceivable ? 'Client / Borrower Name *' : 'Lender / Creditor Name *'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={isReceivable ? 'e.g. Rahul Sharma' : 'e.g. Amit Kapoor'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reference ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. REF-101"
                  value={clientRefId}
                  onChange={(e) => setClientRefId(e.target.value)}
                />
              </div>
            </div>

            {/* Agreed Amount & Due Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">
                  {isReceivable ? 'Total Amount To Receive (₹) *' : 'Total Amount I Borrowed (₹) *'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 50000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                  style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    borderColor: isReceivable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Settlement / Due Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Phone / WhatsApp Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. person@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">Address / Location (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Green Park, New Delhi"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes & Purpose</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder={
                  isReceivable
                    ? 'e.g. Emergency loan given for medical expense, promised back in 2 installments.'
                    : 'e.g. Borrowed for office equipment purchase, scheduled to clear by month end.'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${isReceivable ? 'btn-primary' : 'btn-danger'}`}
              style={{
                background: isReceivable
                  ? 'var(--accent-gradient)'
                  : 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                color: '#ffffff',
              }}
              disabled={submitting}
            >
              <Save size={16} />
              {submitting
                ? 'Saving...'
                : editClient
                ? 'Update Record'
                : isReceivable
                ? 'Save (To Receive)'
                : 'Save (To Give)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
