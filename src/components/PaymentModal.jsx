import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Calendar, Hash, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const PaymentModal = ({ isOpen, onClose, onSuccess, initialClient = null, clientsList = [] }) => {
  const { addToast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialClient) {
      setSelectedClientId(initialClient._id || initialClient.id);
      if (initialClient.remainingAmount) {
        setAmount(String(initialClient.remainingAmount));
      }
    } else if (clientsList.length > 0 && !selectedClientId) {
      setSelectedClientId(clientsList[0]._id);
    }
  }, [initialClient, clientsList, isOpen]);

  if (!isOpen) return null;

  const currentClient = clientsList.find(
    (c) => (c._id || c.id) === selectedClientId
  ) || initialClient;

  const isReceivable = (currentClient?.ledgerType || 'RECEIVABLE') === 'RECEIVABLE';
  const parsedAmount = Number(amount) || 0;
  const currentRemaining = currentClient ? Number(currentClient.remainingAmount || 0) : 0;
  const newBalance = Math.max(0, currentRemaining - parsedAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      addToast('Please select a person / client', 'error');
      return;
    }
    if (parsedAmount <= 0) {
      addToast('Please enter a valid payment amount greater than 0', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.payments.record({
        clientId: selectedClientId,
        amount: parsedAmount,
        paymentDate,
        paymentMethod,
        referenceNumber,
        notes,
      });

      addToast(
        isReceivable
          ? `Payment of ₹${parsedAmount.toLocaleString('en-IN')} received from '${currentClient?.name}' recorded!`
          : `Repayment of ₹${parsedAmount.toLocaleString('en-IN')} paid to '${currentClient?.name}' recorded!`,
        'success'
      );
      onSuccess?.();
      onClose();
      // Reset form
      setAmount('');
      setReferenceNumber('');
      setNotes('');
    } catch (err) {
      addToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
                {isReceivable ? 'Record Money Received' : 'Record Payment Paid (Repayment)'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {isReceivable
                  ? 'Record amount paid to you by person who borrowed from you'
                  : 'Record amount you paid back to person you borrowed from'}
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
            {/* Client Selector */}
            <div className="form-group">
              <label className="form-label">Select Person / Record *</label>
              <select
                className="form-select"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
              >
                <option value="">-- Choose Person --</option>
                {clientsList.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.ledgerType === 'PAYABLE' ? '🔴 [I Borrowed] ' : '🟢 [Borrowed From Me] '}
                    {c.name} (Balance: ₹{Number(c.remainingAmount || 0).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Status Card */}
            {currentClient && (
              <div
                style={{
                  background: isReceivable ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)',
                  border: `1px solid ${isReceivable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {isReceivable ? 'Total To Receive' : 'Total I Borrowed'}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>
                    ₹{Number(currentClient.totalAmount || currentClient.totalExpected || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {isReceivable ? 'Received So Far' : 'Repaid So Far'}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--status-paid-text)' }}>
                    ₹{Number(currentClient.totalPaid || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {isReceivable ? 'Remaining To Collect' : 'Remaining To Pay'}
                  </div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: isReceivable ? 'var(--status-overdue-text)' : '#f43f5e',
                    }}
                  >
                    ₹{Number(currentClient.remainingAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Amount */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">
                  {isReceivable ? 'Amount Received (₹) *' : 'Amount Paid Out (₹) *'}
                </label>
                {currentRemaining > 0 && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                      onClick={() => setAmount(String(currentRemaining))}
                    >
                      Full Balance (₹{currentRemaining.toLocaleString('en-IN')})
                    </button>
                    {currentRemaining > 1000 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => setAmount(String(Math.round(currentRemaining / 2)))}
                      >
                        50%
                      </button>
                    )}
                  </div>
                )}
              </div>
              <input
                type="number"
                step="any"
                min="1"
                className="form-input"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                style={{ fontSize: '16px', fontWeight: 700 }}
              />
            </div>

            {/* Live Calculation Preview Banner */}
            {parsedAmount > 0 && currentClient && (
              <div
                style={{
                  background: newBalance === 0 ? 'var(--status-paid-bg)' : 'rgba(99, 102, 241, 0.1)',
                  border: `1px solid ${newBalance === 0 ? 'var(--status-paid-border)' : 'rgba(99, 102, 241, 0.3)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  After Payment:{' '}
                  <strong style={{ color: newBalance === 0 ? 'var(--status-paid-text)' : '#ffffff' }}>
                    {newBalance === 0
                      ? 'Fully Settled! (Status: PAID)'
                      : `Remaining Balance: ₹${newBalance.toLocaleString('en-IN')}`}
                  </strong>
                </span>
                <span className={`badge ${newBalance === 0 ? 'badge-paid' : 'badge-partial'}`}>
                  {newBalance === 0 ? 'PAID' : 'PARTIAL'}
                </span>
              </div>
            )}

            {/* Date & Payment Method */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Payment Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Reference # */}
            <div className="form-group">
              <label className="form-label">Transaction / UTR / Reference Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. UPI Ref # 423982938128"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Notes (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Cleared installment 1"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Check size={16} />
              {submitting ? 'Recording...' : 'Confirm & Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
