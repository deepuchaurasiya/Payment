import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { UnifiedLedgerPage } from './pages/UnifiedLedgerPage';
import { AuthPage } from './pages/AuthPage';

import { PaymentModal } from './components/PaymentModal';
import { ClientModal } from './components/ClientModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';

import { api } from './services/api';

export function App() {
  const { isAuthenticated, loading } = useAuth();
  const [clientsList, setClientsList] = useState([]);

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalInitialClient, setPaymentModalInitialClient] = useState(null);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientModalEditTarget, setClientModalEditTarget] = useState(null);

  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppTargetClient, setWhatsAppTargetClient] = useState(null);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptTarget, setReceiptTarget] = useState({ client: null, payment: null });

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshClientsList = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.clients.getAll();
      setClientsList(res.data || []);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshClientsList();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070a12',
          color: '#818cf8',
          fontSize: '18px',
          fontWeight: 700,
        }}
      >
        Initializing DueLedger...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleOpenNewPayment = (client = null) => {
    setPaymentModalInitialClient(client);
    setPaymentModalOpen(true);
  };

  const handleOpenNewClient = () => {
    setClientModalEditTarget(null);
    setClientModalOpen(true);
  };

  const handleOpenEditClient = (client) => {
    setClientModalEditTarget(client);
    setClientModalOpen(true);
  };

  const handleOpenWhatsApp = (client) => {
    setWhatsAppTargetClient(client);
    setWhatsAppModalOpen(true);
  };

  const handleViewReceipt = (client, payment) => {
    setReceiptTarget({ client, payment });
    setReceiptModalOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* UNIFIED SINGLE SCREEN LEDGER */}
      <UnifiedLedgerPage
        key={refreshTrigger}
        onOpenNewClient={handleOpenNewClient}
        onOpenEditClient={handleOpenEditClient}
        onOpenNewPayment={handleOpenNewPayment}
        onOpenWhatsApp={handleOpenWhatsApp}
        onViewReceipt={handleViewReceipt}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Global Modals */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={refreshClientsList}
        initialClient={paymentModalInitialClient}
        clientsList={clientsList}
      />

      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onSuccess={refreshClientsList}
        editClient={clientModalEditTarget}
      />

      <WhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        client={whatsAppTargetClient}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        client={receiptTarget.client}
        payment={receiptTarget.payment}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}
