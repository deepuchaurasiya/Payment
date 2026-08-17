import React, { useState, useEffect } from 'react';
import { X, Send, Copy, MessageSquare, Check, PhoneCall, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const WhatsAppModal = ({ isOpen, onClose, client }) => {
  const { addToast } = useToast();
  const [templateType, setTemplateType] = useState('standard');
  const [message, setMessage] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (client && isOpen) {
      fetchReminderTemplate(templateType);
    }
  }, [client, templateType, isOpen]);

  const fetchReminderTemplate = async (type) => {
    try {
      setLoading(true);
      const res = await api.clients.getWhatsAppReminder(client._id || client.id, type);
      setMessage(res.data.message);
      setTargetPhone(res.data.cleanPhone || client.phone || '');
      setDirectUrl(res.data.directWhatsAppUrl);
    } catch (err) {
      addToast(err.message || 'Error loading WhatsApp message template', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    addToast('WhatsApp message copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchWhatsApp = () => {
    let phoneNum = targetPhone.replace(/[^\d]/g, '');
    if (phoneNum.length === 10) phoneNum = `91${phoneNum}`;
    
    const encoded = encodeURIComponent(message);
    const url = phoneNum
      ? `https://wa.me/${phoneNum}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
    addToast('Opening WhatsApp...', 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: 'rgba(37, 211, 102, 0.2)',
                color: '#25d366',
                padding: '8px',
                borderRadius: '8px',
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                {client.ledgerType === 'PAYABLE' ? 'WhatsApp Payment Update Generator' : 'WhatsApp Payment Reminder Generator'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {client.ledgerType === 'PAYABLE'
                  ? `Payment schedule update for ${client.name} (Amount to Pay: ₹${Number(client.remainingAmount || 0).toLocaleString('en-IN')})`
                  : `Personalized payment follow-up for ${client.name} (Due: ₹${Number(client.remainingAmount || 0).toLocaleString('en-IN')})`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Template Style Selector */}
          <div className="form-group">
            <label className="form-label">Select Message Tone / Template</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { id: 'standard', label: 'Standard' },
                { id: 'friendly', label: 'Friendly' },
                { id: 'formal', label: 'Formal' },
                { id: 'urgent', label: 'Urgent' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateType(t.id)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: templateType === t.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: templateType === t.id ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-input)',
                    color: templateType === t.id ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Target */}
          <div className="form-group">
            <label className="form-label">Recipient Phone Number</label>
            <input
              type="text"
              className="form-input"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>

          {/* Message Textarea */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Preview & Edit Message</label>
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '11px' }}
              >
                {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              className="form-textarea"
              rows="7"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: 1.6,
                background: 'rgba(0, 0, 0, 0.3)',
                borderColor: 'rgba(37, 211, 102, 0.3)',
              }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-whatsapp"
            onClick={handleLaunchWhatsApp}
            disabled={loading}
          >
            <Send size={16} />
            Launch WhatsApp Chat
          </button>
        </div>
      </div>
    </div>
  );
};
