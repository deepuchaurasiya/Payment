import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Search,
  Plus,
  CreditCard,
  Send,
  Download,
  Trash2,
  Edit2,
  Calendar,
  Phone,
  Mail,
  Receipt,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Settings,
  LogOut,
  RefreshCw,
  FileSpreadsheet,
  X,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../services/api';
import { exportClientsCSV, generateClientStatementPDF } from '../services/exportService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const UnifiedLedgerPage = ({
  onOpenNewClient,
  onOpenEditClient,
  onOpenNewPayment,
  onOpenWhatsApp,
  onViewReceipt,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  const [clients, setClients] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'RECEIVABLE' | 'PAYABLE' | 'OVERDUE'

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsRes, dashboardRes] = await Promise.all([
        api.clients.getAll(),
        api.dashboard.getSummary(),
      ]);

      const allClients = clientsRes.data || [];
      setClients(allClients);
      setDashboardData(dashboardRes.data);

      // If a client was previously selected, refresh their detail
      if (selectedClient) {
        const stillExists = allClients.find((c) => (c._id || c.id) === (selectedClient._id || selectedClient.id));
        if (stillExists) {
          loadClientDetail(stillExists._id || stillExists.id);
        }
      }
    } catch (err) {
      addToast(err.message || 'Error loading ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loadClientDetail = async (id) => {
    try {
      setDetailLoading(true);
      const res = await api.clients.getById(id);
      setSelectedClientDetail(res.data);
    } catch (err) {
      addToast(err.message || 'Failed to load client details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    loadClientDetail(client._id || client.id);
  };

  const handleDeselectClient = () => {
    setSelectedClient(null);
    setSelectedClientDetail(null);
  };

  const handleDeleteClient = async (client) => {
    if (!window.confirm(`Delete record for "${client.name}" and all associated payments?`)) {
      return;
    }
    try {
      await api.clients.delete(client._id || client.id);
      addToast(`Record for "${client.name}" deleted`, 'success');
      if (selectedClient?._id === client._id) {
        handleDeselectClient();
      }
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to delete record', 'error');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Delete this payment transaction? Balance will recalculate automatically.')) {
      return;
    }
    try {
      await api.payments.delete(paymentId);
      addToast('Payment deleted', 'success');
      if (selectedClient) {
        loadClientDetail(selectedClient._id || selectedClient.id);
      }
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to delete payment', 'error');
    }
  };

  const handleExportCSV = () => {
    if (clients.length === 0) {
      addToast('No records to export', 'info');
      return;
    }
    exportClientsCSV(clients, `DueLedger_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    addToast('Ledger CSV exported!', 'success');
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const isReceivable = (c.ledgerType || 'RECEIVABLE') === 'RECEIVABLE';
    const matchesType =
      typeFilter === 'ALL'
        ? true
        : typeFilter === 'RECEIVABLE'
        ? isReceivable
        : typeFilter === 'PAYABLE'
        ? !isReceivable
        : typeFilter === 'OVERDUE'
        ? c.status === 'Overdue'
        : true;

    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase())) ||
      (c.clientRefId && c.clientRefId.toLowerCase().includes(search.toLowerCase()));

    return matchesType && matchesSearch;
  });

  const summary = dashboardData?.summary;
  const receivables = summary?.receivables || { remainingAmount: 0, count: 0 };
  const payables = summary?.payables || { remainingAmount: 0, count: 0 };
  const netBalance = summary?.netBalance !== undefined ? summary.netBalance : receivables.remainingAmount - payables.remainingAmount;
  const recentPayments = dashboardData?.recentPayments || [];
  const monthlyCollections = dashboardData?.monthlyCollections || [];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px' }}>
      {/* 1. TOP HEADER RIBBON: BRAND & USER CONTROLS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '12px 18px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--accent-glow)',
            }}
          >
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.1 }}>DueLedger</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {user?.businessName || 'Personal Payment & Debt Tracker'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} title="Refresh Ledger">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span style={{ fontSize: '12px' }}>Sync</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="Export CSV">
            <Download size={14} />
            <span style={{ fontSize: '12px' }}>CSV</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onOpenSettings} title="Settings">
            <Settings size={14} />
          </button>
          <button className="btn btn-danger btn-sm" onClick={logout} title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* 2. THREE CORE METRIC SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        {/* You Will Receive */}
        <div
          onClick={() => setTypeFilter(typeFilter === 'RECEIVABLE' ? 'ALL' : 'RECEIVABLE')}
          className="card card-interactive"
          style={{
            padding: '16px',
            background: typeFilter === 'RECEIVABLE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${typeFilter === 'RECEIVABLE' ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
              <ArrowDownLeft size={16} />
              <span>YOU WILL RECEIVE</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {receivables.count || 0} People
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: '#10b981' }}>
            ₹{(receivables.remainingAmount || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Money lent / Borrowed from me
          </div>
        </div>

        {/* You Will Give */}
        <div
          onClick={() => setTypeFilter(typeFilter === 'PAYABLE' ? 'ALL' : 'PAYABLE')}
          className="card card-interactive"
          style={{
            padding: '16px',
            background: typeFilter === 'PAYABLE' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.08)',
            border: `1px solid ${typeFilter === 'PAYABLE' ? '#f43f5e' : 'rgba(244, 63, 94, 0.3)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#f43f5e' }}>
              <ArrowUpRight size={16} />
              <span>YOU WILL GIVE</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {payables.count || 0} People
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: '#f43f5e' }}>
            ₹{(payables.remainingAmount || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Money I borrowed / To repay
          </div>
        </div>

        {/* Net Position */}
        <div
          className="card"
          style={{
            padding: '16px',
            background: netBalance >= 0 ? 'rgba(99, 102, 241, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${netBalance >= 0 ? 'rgba(99, 102, 241, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: netBalance >= 0 ? '#818cf8' : '#f87171' }}>
              <Scale size={16} />
              <span>NET CASH POSITION</span>
            </div>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                background: netBalance >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                color: netBalance >= 0 ? '#10b981' : '#f43f5e',
                fontWeight: 700,
              }}
            >
              {netBalance >= 0 ? 'SURPLUS' : 'DEFICIT'}
            </span>
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              marginTop: '4px',
              color: netBalance >= 0 ? '#38bdf8' : '#f87171',
            }}
          >
            {netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {netBalance >= 0 ? "You're owed more than you owe" : 'You owe more than you are owed'}
          </div>
        </div>
      </div>

      {/* 3. ACTION & FILTER TOOLBAR */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search person, phone, note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '34px', height: '38px', fontSize: '13px' }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All (${clients.length})` },
            { id: 'RECEIVABLE', label: `🟢 To Receive (${receivables.count || 0})` },
            { id: 'PAYABLE', label: `🔴 To Give (${payables.count || 0})` },
            { id: 'OVERDUE', label: `🚨 Overdue (${summary?.counts?.overdue || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: typeFilter === tab.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: typeFilter === tab.id ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: typeFilter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => onOpenNewPayment(null)} style={{ height: '38px', fontSize: '13px' }}>
            <CreditCard size={15} />
            Record Payment
          </button>
          <button className="btn btn-primary" onClick={onOpenNewClient} style={{ height: '38px', fontSize: '13px' }}>
            <Plus size={15} />
            Add Person / Entry
          </button>
        </div>
      </div>

      {/* 4. SPLIT SCREEN MASTER-DETAIL WORKSPACE */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedClient ? '1.1fr 1.4fr' : '1fr', gap: '20px' }}>
        {/* LEFT COLUMN: LIST OF PEOPLE */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading ledger records...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>No records found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                {search || typeFilter !== 'ALL' ? 'Try adjusting your search or filters.' : 'Click "Add Person / Entry" to add your first record.'}
              </p>
              <button className="btn btn-primary btn-sm" onClick={onOpenNewClient}>
                <Plus size={14} /> Add New Entry
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredClients.map((client) => {
                const isSelected = selectedClient?._id === client._id;
                const isReceivable = (client.ledgerType || 'RECEIVABLE') === 'RECEIVABLE';
                const isOverdue = client.status === 'Overdue';

                return (
                  <div
                    key={client._id}
                    onClick={() => handleSelectClient(client)}
                    className="card card-interactive"
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                      background: isSelected
                        ? 'rgba(99, 102, 241, 0.12)'
                        : 'var(--bg-card)',
                      borderLeft: `4px solid ${
                        isReceivable ? '#10b981' : '#f43f5e'
                      }`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                            {client.name}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: isReceivable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                              color: isReceivable ? '#10b981' : '#f43f5e',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            {isReceivable ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                            {isReceivable ? 'To Receive' : 'To Give'}
                          </span>
                          <span
                            className={`badge ${
                              client.status === 'Paid'
                                ? 'badge-paid'
                                : client.status === 'Overdue'
                                ? 'badge-overdue'
                                : 'badge-partial'
                            }`}
                            style={{ fontSize: '10px', padding: '1px 6px' }}
                          >
                            {client.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '10px' }}>
                          {client.phone && <span>📞 {client.phone}</span>}
                          <span>
                            Due: {new Date(client.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {isOverdue && ` (${client.daysOverdue}d late)`}
                          </span>
                        </div>
                      </div>

                      {/* Remaining Amount */}
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '16px',
                            fontWeight: 800,
                            color: client.remainingAmount === 0 ? '#10b981' : isReceivable ? '#f59e0b' : '#f43f5e',
                          }}
                        >
                          ₹{Number(client.remainingAmount).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          of ₹{Number(client.totalExpected).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Quick Inline Actions */}
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1 }} className="progress-container">
                        <div
                          className={`progress-bar ${
                            client.status === 'Paid'
                              ? 'progress-bar-paid'
                              : client.status === 'Overdue'
                              ? 'progress-bar-overdue'
                              : 'progress-bar-partial'
                          }`}
                          style={{ width: `${client.paymentPercentage}%` }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {client.paymentPercentage}%
                      </span>

                      {/* Quick Action buttons */}
                      <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                        {client.remainingAmount > 0 && (
                          <button
                            className="btn btn-whatsapp btn-icon"
                            style={{ padding: '4px 6px' }}
                            title="WhatsApp"
                            onClick={() => onOpenWhatsApp(client)}
                          >
                            <Send size={12} />
                          </button>
                        )}
                        <button
                          className="btn btn-primary btn-icon"
                          style={{ padding: '4px 6px' }}
                          title="Record Payment"
                          onClick={() => onOpenNewPayment(client)}
                        >
                          <CreditCard size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAIL DOSSIER & INSTANT TRANSACTION LEDGER */}
        {selectedClient && (
          <div>
            <div className="card" style={{ position: 'sticky', top: '20px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{selectedClient.name}</h2>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: selectedClient.ledgerType === 'PAYABLE' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: selectedClient.ledgerType === 'PAYABLE' ? '#f43f5e' : '#10b981',
                        fontWeight: 700,
                      }}
                    >
                      {selectedClient.ledgerType === 'PAYABLE' ? '🔴 I Borrowed' : '🟢 They Borrowed'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {selectedClient.phone && `📞 ${selectedClient.phone}`}
                    {selectedClient.email && ` • ✉️ ${selectedClient.email}`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary btn-icon"
                    style={{ padding: '6px' }}
                    title="Edit Record"
                    onClick={() => onOpenEditClient(selectedClient)}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="btn btn-danger btn-icon"
                    style={{ padding: '6px' }}
                    title="Delete Record"
                    onClick={() => handleDeleteClient(selectedClient)}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    className="btn btn-secondary btn-icon"
                    style={{ padding: '6px' }}
                    title="Close Details"
                    onClick={handleDeselectClient}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Financial Status Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '10px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Agreed</div>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>
                    ₹{Number(selectedClient.totalExpected || selectedClient.totalAmount).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cleared / Paid</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>
                    ₹{Number(selectedClient.totalPaid || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining Balance</div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: selectedClient.remainingAmount > 0 ? (selectedClient.ledgerType === 'PAYABLE' ? '#f43f5e' : '#f59e0b') : '#10b981',
                    }}
                  >
                    ₹{Number(selectedClient.remainingAmount).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Action Buttons for this person */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
                  onClick={() => onOpenNewPayment(selectedClient)}
                >
                  <CreditCard size={14} />
                  {selectedClient.ledgerType === 'PAYABLE' ? 'Record Repayment Sent' : 'Record Money Received'}
                </button>
                {selectedClient.remainingAmount > 0 && (
                  <button
                    className="btn btn-whatsapp"
                    style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
                    onClick={() => onOpenWhatsApp(selectedClient)}
                  >
                    <Send size={14} /> WhatsApp Note
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-icon"
                  style={{ padding: '8px' }}
                  title="Download Statement PDF"
                  onClick={() => {
                    generateClientStatementPDF(selectedClient, selectedClientDetail?.payments || [], user);
                    addToast('PDF statement generated!', 'success');
                  }}
                >
                  <Download size={14} />
                </button>
              </div>

              {/* Transaction Ledger Timeline */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                  Payment History ({selectedClientDetail?.payments?.length || 0} transactions)
                </div>

                {detailLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Loading transactions...
                  </div>
                ) : (selectedClientDetail?.payments || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                    No payments recorded yet. Click above to record the first transaction.
                  </div>
                ) : (
                  <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(selectedClientDetail?.payments || []).map((p) => (
                      <div
                        key={p._id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#10b981' }}>
                            +₹{Number(p.amount).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {p.paymentMethod}
                            {p.referenceNumber && ` • Ref: ${p.referenceNumber}`}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            style={{ padding: '4px' }}
                            title="Receipt"
                            onClick={() => onViewReceipt(selectedClient, p)}
                          >
                            <Receipt size={12} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            style={{ padding: '4px' }}
                            title="Delete"
                            onClick={() => handleDeletePayment(p._id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
