import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ProgressBar';
import { Button, Badge, Modal, Input, Alert } from '../components/UI';
import { 
  DollarSign, ArrowDownCircle, ArrowUpCircle, 
  Send, History, Landmark, Wallet,
  ArrowRight, ArrowLeft
} from 'lucide-react';
import clsx from 'clsx';

// Transaction type icons and labels
const transactionConfig = {
  deposit: { icon: ArrowDownCircle, label: 'Depósito', color: 'text-success' },
  withdrawal: { icon: ArrowUpCircle, label: 'Levantamento', color: 'text-warning' },
  transfer_in: { icon: ArrowLeft, label: 'Transferência Recebida', color: 'text-success' },
  transfer_out: { icon: ArrowRight, label: 'Transferência Enviada', color: 'text-error' },
};

export default function BankPage() {
  const { api, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [bankStatus, setBankStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modal states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');

  useEffect(() => {
    fetchBankStatus();
    fetchTransactions();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchBankStatus = async () => {
    try {
      const response = await api().get('/bank/status');
      setBankStatus(response.data);
    } catch (err) {
      console.error('Erro ao buscar status do banco:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api().get('/bank/transactions');
      setTransactions(response.data.transactions || []);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      showNotification('Valor inválido', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api().post('/bank/deposit', { amount });
      showNotification(response.data.message, 'success');
      setShowDepositModal(false);
      setDepositAmount('');
      await fetchBankStatus();
      await fetchTransactions();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Erro ao depositar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      showNotification('Valor inválido', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api().post('/bank/withdraw', { amount });
      showNotification(response.data.message, 'success');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      await fetchBankStatus();
      await fetchTransactions();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Erro ao levantar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      showNotification('Valor inválido', 'error');
      return;
    }
    if (!transferRecipient) {
      showNotification('Destinatário obrigatório', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api().post('/bank/transfer', {
        amount,
        recipient_id: transferRecipient
      });
      showNotification(response.data.message, 'success');
      setShowTransferModal(false);
      setTransferAmount('');
      setTransferRecipient('');
      await fetchBankStatus();
      await fetchTransactions();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Erro ao transferir', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => `€${(value || 0).toLocaleString('pt-PT')}`;
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Landmark },
    { id: 'transactions', label: 'Transações', icon: History },
  ];

  if (!bankStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">A carregar banco...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <Alert variant={notification.type}>
          {notification.message}
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-text-primary mb-1">Banco SUBMUNDO</h1>
          <p className="text-text-secondary text-sm">Gestão financeira segura</p>
        </div>
        <Landmark className="w-10 h-10 md:w-12 md:h-12 text-primary opacity-50" />
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary uppercase mb-0.5">Dinheiro na Mão</p>
              <p className="text-xl md:text-2xl font-heading text-success">{formatCurrency(bankStatus.player_cash)}</p>
            </div>
            <Wallet className="w-8 h-8 md:w-10 md:h-10 text-success opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary uppercase mb-0.5">Dinheiro no Banco</p>
              <p className="text-xl md:text-2xl font-heading text-primary">{formatCurrency(bankStatus.bank_balance)}</p>
            </div>
            <Landmark className="w-8 h-8 md:w-10 md:h-10 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-gold/10 to-transparent border-gold/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary uppercase mb-0.5">Total</p>
              <p className="text-xl md:text-2xl font-heading text-gold">
                {formatCurrency(bankStatus.player_cash + bankStatus.bank_balance)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 md:w-10 md:h-10 text-gold opacity-50" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Operações" icon={DollarSign}>
        <div className="grid md:grid-cols-3 gap-2 md:gap-3">
          <Button
            variant="success"
            fullWidth
            icon={ArrowDownCircle}
            onClick={() => setShowDepositModal(true)}
          >
            Depositar
          </Button>
          <Button
            variant="warning"
            fullWidth
            icon={ArrowUpCircle}
            onClick={() => setShowWithdrawModal(true)}
          >
            Levantar
          </Button>
          <Button
            variant="primary"
            fullWidth
            icon={Send}
            onClick={() => setShowTransferModal(true)}
          >
            Transferir
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 md:gap-2 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 font-ui text-xs md:text-sm transition-all',
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Card title="Informações da Conta" icon={Landmark}>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-text-secondary text-sm">Titular</span>
              <span className="text-text-primary font-body text-sm">{user?.username}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-text-secondary text-sm">Saldo Disponível</span>
              <span className="text-success font-body text-sm">{formatCurrency(bankStatus.bank_balance)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-text-secondary text-sm">Total de Transações</span>
              <span className="text-text-primary font-body text-sm">{transactions.length}</span>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'transactions' && (
        <Card title="Histórico de Transações" icon={History}>
          {transactions.length === 0 ? (
            <div className="text-center py-6">
              <History size={40} className="mx-auto text-text-secondary opacity-50 mb-2" />
              <p className="text-text-secondary text-sm">Sem transações ainda</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {transactions.map((tx, index) => {
                const config = transactionConfig[tx.transaction_type] || {
                  icon: DollarSign,
                  label: tx.transaction_type,
                  color: 'text-text-primary'
                };
                const Icon = config.icon;
                const isPositive = tx.amount > 0;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 md:p-3 bg-surface-highlight hover:bg-surface border border-border rounded transition-colors"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={clsx('w-8 h-8 flex items-center justify-center rounded', config.color)}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-text-primary font-body">{config.label}</p>
                        <p className="text-xs text-text-secondary">{formatDate(tx.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={clsx('font-body text-sm md:text-base', isPositive ? 'text-success' : 'text-error')}>
                        {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Saldo: {formatCurrency(tx.balance_after)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Deposit Modal */}
      <Modal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title="Depositar Dinheiro"
      >
        <div className="space-y-3">
          <div className="bg-surface-highlight p-2.5 rounded border border-border">
            <p className="text-xs text-text-secondary mb-0.5">Disponível na Mão</p>
            <p className="text-lg md:text-xl text-success font-body">{formatCurrency(bankStatus.player_cash)}</p>
          </div>

          <Input
            label="Valor a Depositar"
            type="number"
            placeholder="0.00"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            prefix="€"
          />

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setShowDepositModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="success"
              fullWidth
              onClick={handleDeposit}
              loading={loading}
              disabled={!depositAmount || parseFloat(depositAmount) <= 0}
            >
              Depositar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Levantar Dinheiro"
      >
        <div className="space-y-4">
          <div className="bg-surface-highlight p-3 rounded border border-border">
            <p className="text-xs text-text-secondary mb-1">Disponível no Banco</p>
            <p className="text-xl text-primary font-body">{formatCurrency(bankStatus.bank_balance)}</p>
          </div>

          <Input
            label="Valor a Levantar"
            type="number"
            placeholder="0.00"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            prefix="€"
          />

          <Alert variant="warning">
            <p className="text-xs">Taxa de levantamento pode ser aplicada</p>
          </Alert>

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setShowWithdrawModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="warning"
              fullWidth
              onClick={handleWithdraw}
              loading={loading}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
            >
              Levantar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transferir Dinheiro"
      >
        <div className="space-y-4">
          <div className="bg-surface-highlight p-3 rounded border border-border">
            <p className="text-xs text-text-secondary mb-1">Disponível no Banco</p>
            <p className="text-xl text-primary font-body">{formatCurrency(bankStatus.bank_balance)}</p>
          </div>

          <Input
            label="ID do Destinatário"
            type="text"
            placeholder="ID do jogador"
            value={transferRecipient}
            onChange={(e) => setTransferRecipient(e.target.value)}
          />

          <Input
            label="Valor a Transferir"
            type="number"
            placeholder="0.00"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            prefix="€"
          />

          <Alert variant="warning">
            <p className="text-xs">Taxa de transferência: 1.0%</p>
          </Alert>

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setShowTransferModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleTransfer}
              loading={loading}
              disabled={!transferAmount || !transferRecipient || parseFloat(transferAmount) <= 0}
            >
              Transferir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
