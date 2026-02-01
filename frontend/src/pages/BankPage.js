import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Card, ProgressBar, StatCard } from '../components/ProgressBar';
import { Button, Badge, Modal, Input } from '../components/UI';
import { 
  Building2, DollarSign, ArrowDownCircle, ArrowUpCircle, 
  Send, History, Shield, TrendingUp, Clock, AlertTriangle,
  Lock, Unlock, CreditCard, PiggyBank, Wallet, Landmark,
  RefreshCw, Search, Users, Target, ChevronRight, ChevronDown,
  Check, X, Plus, Minus, Percent, Calendar, Award,
  Banknote, ArrowLeftRight, Eye, EyeOff, Zap, Star,
  ShieldCheck, ShieldAlert, Timer, TrendingDown, Coins,
  Receipt, FileText, Settings, HelpCircle, Info,
  ArrowRight, ArrowLeft, Crosshair, Skull
} from 'lucide-react';
import clsx from 'clsx';
import { formatNumber, TimeSystem } from '../utils/gameLogic';

// Transaction type icons and labels
const transactionConfig = {
  deposit: { icon: ArrowDownCircle, label: 'Depósito', color: 'text-success' },
  withdrawal: { icon: ArrowUpCircle, label: 'Levantamento', color: 'text-warning' },
  transfer_in: { icon: ArrowLeft, label: 'Transferência Recebida', color: 'text-success' },
  transfer_out: { icon: ArrowRight, label: 'Transferência Enviada', color: 'text-error' },
  interest: { icon: TrendingUp, label: 'Juros', color: 'text-success' },
  fee: { icon: Receipt, label: 'Taxa', color: 'text-error' },
  investment: { icon: TrendingUp, label: 'Investimento', color: 'text-primary' },
  investment_return: { icon: Coins, label: 'Retorno Investimento', color: 'text-success' },
  loan: { icon: CreditCard, label: 'Empréstimo', color: 'text-primary' },
  loan_payment: { icon: Check, label: 'Pagamento Empréstimo', color: 'text-warning' },
  robbery_loss: { icon: Skull, label: 'Roubado', color: 'text-error' },
  robbery_gain: { icon: Target, label: 'Roubo', color: 'text-success' },
  vault_rental: { icon: Lock, label: 'Cofre', color: 'text-secondary' },
  security_upgrade: { icon: ShieldCheck, label: 'Upgrade Segurança', color: 'text-primary' }
};

// Investment card component
const InvestmentCard = ({ investment, onInvest, onCancel, disabled }) => {
  const [amount, setAmount] = useState('');
  const [showInput, setShowInput] = useState(false);
  
  const riskColors = {
    0: 'text-success',
    10: 'text-success',
    25: 'text-warning',
    40: 'text-warning',
    60: 'text-error'
  };
  
  const getRiskColor = (risk) => {
    if (risk === 0) return 'text-success';
    if (risk <= 10) return 'text-success';
    if (risk <= 30) return 'text-warning';
    return 'text-error';
  };
  
  return (
    <div className={clsx(
      'p-4 border rounded transition-all',
      investment.can_invest ? 'bg-surface border-border hover:border-primary' : 'bg-surface/50 border-border/50 opacity-60'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-body text-text-primary">{investment.name}</h4>
          <p className="text-xs text-text-secondary">{investment.description}</p>
        </div>
        <Badge variant={investment.locked ? 'warning' : 'success'} size="sm">
          {investment.locked ? <Lock size={10} className="mr-1" /> : <Unlock size={10} className="mr-1" />}
          {investment.locked ? 'Bloqueado' : 'Flexível'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-surface-highlight p-2 rounded">
          <p className="text-lg font-body text-success">{investment.interest_rate}%</p>
          <p className="text-xs text-text-secondary">Retorno</p>
        </div>
        <div className="bg-surface-highlight p-2 rounded">
          <p className={clsx('text-lg font-body', getRiskColor(investment.risk))}>{investment.risk}%</p>
          <p className="text-xs text-text-secondary">Risco</p>
        </div>
        <div className="bg-surface-highlight p-2 rounded">
          <p className="text-lg font-body text-primary">{investment.duration_days || '1'}d</p>
          <p className="text-xs text-text-secondary">Prazo</p>
        </div>
      </div>
      
      <p className="text-xs text-text-secondary mb-3">Mínimo: €{formatNumber(investment.min_amount)}</p>
      
      {showInput ? (
        <div className="space-y-2">
          <Input
            type="number"
            placeholder={`Mínimo €${investment.min_amount}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              fullWidth
              onClick={() => {
                setShowInput(false);
                setAmount('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              fullWidth
              onClick={() => {
                onInvest(investment.id, parseFloat(amount));
                setShowInput(false);
                setAmount('');
              }}
              disabled={!amount || parseFloat(amount) < investment.min_amount}
            >
              Confirmar
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          variant="secondary" 
          size="sm" 
          fullWidth
          onClick={() => setShowInput(true)}
          disabled={disabled || !investment.can_invest}
        >
          <TrendingUp size={14} className="mr-1" />
          Investir
        </Button>
      )}
    </div>
  );
};

// Active investment card
const ActiveInvestmentCard = ({ investment, onCancel }) => {
  const maturityDate = new Date(investment.maturity_date);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((maturityDate - now) / (1000 * 60 * 60 * 24)));
  const progress = Math.min(100, ((investment.duration_days || 1) - daysRemaining) / (investment.duration_days || 1) * 100);
  
  return (
    <div className="p-4 bg-surface border border-primary/30 rounded">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-body text-text-primary">{investment.investment_type}</p>
          <p className="text-2xl font-body text-primary">€{formatNumber(investment.amount)}</p>
        </div>
        <Badge variant={investment.locked ? 'warning' : 'success'}>
          {daysRemaining > 0 ? `${daysRemaining}d restantes` : 'Processando...'}
        </Badge>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Progresso</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-surface-highlight rounded overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      
      <div className="flex justify-between text-sm mb-3">
        <span className="text-text-secondary">Taxa: {investment.interest_rate}%</span>
        <span className="text-text-secondary">Risco: {investment.risk}%</span>
      </div>
      
      {!investment.locked && (
        <Button variant="ghost" size="sm" fullWidth onClick={() => onCancel(investment.id)}>
          Cancelar Investimento
        </Button>
      )}
      {investment.locked && (
        <p className="text-xs text-warning text-center">
          <Lock size={12} className="inline mr-1" />
          Cancelamento com 20% de penalização
        </p>
      )}
    </div>
  );
};

// Loan card component
const LoanCard = ({ loan, onPay }) => {
  const [payAmount, setPayAmount] = useState('');
  const [showPay, setShowPay] = useState(false);
  
  const dueDate = new Date(loan.due_date);
  const now = new Date();
  const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;
  
  return (
    <div className={clsx(
      'p-4 border rounded',
      isOverdue ? 'bg-error/10 border-error' : 'bg-surface border-border'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-text-secondary">Empréstimo</p>
          <p className="text-2xl font-body text-primary">€{formatNumber(loan.amount)}</p>
        </div>
        <Badge variant={isOverdue ? 'error' : daysRemaining <= 2 ? 'warning' : 'secondary'}>
          {isOverdue ? 'Em Atraso!' : `${daysRemaining}d para pagar`}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <p className="text-text-secondary">Em dívida:</p>
          <p className="text-error font-body">€{formatNumber(loan.remaining_amount)}</p>
        </div>
        <div>
          <p className="text-text-secondary">Juros:</p>
          <p className="text-warning font-body">{loan.interest_rate}%</p>
        </div>
      </div>
      
      {showPay ? (
        <div className="space-y-2">
          <Input
            type="number"
            placeholder={`Máximo €${formatNumber(loan.remaining_amount)}`}
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" fullWidth onClick={() => setShowPay(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              fullWidth
              onClick={() => {
                onPay(loan.id, parseFloat(payAmount));
                setShowPay(false);
                setPayAmount('');
              }}
              disabled={!payAmount || parseFloat(payAmount) <= 0}
            >
              Pagar
            </Button>
          </div>
          <Button 
            variant="success" 
            size="sm" 
            fullWidth
            onClick={() => {
              onPay(loan.id, loan.remaining_amount);
              setShowPay(false);
            }}
          >
            Liquidar Tudo (€{formatNumber(loan.remaining_amount)})
          </Button>
        </div>
      ) : (
        <Button variant="primary" size="sm" fullWidth onClick={() => setShowPay(true)}>
          <DollarSign size={14} className="mr-1" />
          Pagar
        </Button>
      )}
    </div>
  );
};

// Transaction item component
const TransactionItem = ({ transaction }) => {
  const config = transactionConfig[transaction.type] || { icon: Receipt, label: transaction.type, color: 'text-text-secondary' };
  const Icon = config.icon;
  const isPositive = transaction.amount > 0;
  
  return (
    <div className="flex items-center gap-3 p-3 bg-surface border border-border hover:border-primary/30 transition-colors rounded">
      <div className={clsx('w-10 h-10 flex items-center justify-center rounded bg-surface-highlight', config.color)}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{config.label}</p>
        <p className="text-xs text-text-secondary">
          {new Date(transaction.timestamp).toLocaleString('pt-PT')}
        </p>
        {transaction.details?.recipient && (
          <p className="text-xs text-text-secondary">Para: {transaction.details.recipient}</p>
        )}
        {transaction.details?.sender && (
          <p className="text-xs text-text-secondary">De: {transaction.details.sender}</p>
        )}
      </div>
      <div className="text-right">
        <p className={clsx('font-body', isPositive ? 'text-success' : 'text-error')}>
          {isPositive ? '+' : ''}€{formatNumber(Math.abs(transaction.amount))}
        </p>
        <p className="text-xs text-text-secondary">
          Saldo: €{formatNumber(transaction.balance_after)}
        </p>
      </div>
    </div>
  );
};

// Robbery target card
const RobberyTargetCard = ({ target, onRob, canRob }) => {
  const difficultyColors = {
    'Fácil': 'text-success',
    'Médio': 'text-warning',
    'Difícil': 'text-error',
    'Muito Difícil': 'text-error'
  };
  
  return (
    <div className="flex items-center gap-3 p-3 bg-surface border border-border hover:border-error/50 transition-colors rounded">
      <div className="w-10 h-10 bg-error/20 flex items-center justify-center rounded">
        <Target size={18} className="text-error" />
      </div>
      <div className="flex-1">
        <p className="font-body text-text-primary">{target.username}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-secondary">Nível {target.level}</span>
          <span className="text-text-secondary">•</span>
          <span className="text-success">{target.cash_range}</span>
          {target.in_gang && (
            <>
              <span className="text-text-secondary">•</span>
              <span className="text-warning">Em Gangue</span>
            </>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={clsx('text-sm font-body', difficultyColors[target.difficulty])}>
          {target.difficulty}
        </p>
        <Button 
          variant="error" 
          size="sm"
          onClick={() => onRob(target.id)}
          disabled={!canRob}
        >
          <Crosshair size={12} className="mr-1" />
          Roubar
        </Button>
      </div>
    </div>
  );
};

export default function BankPage() {
  const { api } = useAuth();
  const { gameState, showNotification, refreshGameState } = useGame();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [bankStatus, setBankStatus] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [investments, setInvestments] = useState(null);
  const [loans, setLoans] = useState(null);
  const [robberyTargets, setRobberyTargets] = useState(null);
  
  // Modal states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showRobberyResult, setShowRobberyResult] = useState(null);
  
  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [transferInstant, setTransferInstant] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const player = gameState?.player;

  // Fetch bank status
  const fetchBankStatus = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    try {
      const response = await api().get('/bank/status');
      setBankStatus(response.data);
    } catch (err) {
      console.error('Error fetching bank status:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!api) return;
    try {
      const response = await api().get('/bank/transactions?limit=50');
      setTransactions(response.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, [api]);

  // Fetch investments
  const fetchInvestments = useCallback(async () => {
    if (!api) return;
    try {
      const response = await api().get('/bank/investments');
      setInvestments(response.data);
    } catch (err) {
      console.error('Error fetching investments:', err);
    }
  }, [api]);

  // Fetch loans
  const fetchLoans = useCallback(async () => {
    if (!api) return;
    try {
      const response = await api().get('/bank/loans');
      setLoans(response.data);
    } catch (err) {
      console.error('Error fetching loans:', err);
    }
  }, [api]);

  // Fetch robbery targets
  const fetchRobberyTargets = useCallback(async () => {
    if (!api) return;
    try {
      const response = await api().get('/bank/robbery-targets');
      setRobberyTargets(response.data);
    } catch (err) {
      console.error('Error fetching robbery targets:', err);
    }
  }, [api]);

  // Initial load
  useEffect(() => {
    fetchBankStatus();
  }, [fetchBankStatus]);

  // Tab-specific loading
  useEffect(() => {
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'investments') fetchInvestments();
    if (activeTab === 'loans') fetchLoans();
    if (activeTab === 'robbery') fetchRobberyTargets();
  }, [activeTab, fetchTransactions, fetchInvestments, fetchLoans, fetchRobberyTargets]);

  // Search players for transfer
  const handleSearchPlayers = useCallback(async (query) => {
    if (!api || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await api().get(`/profile/search-players?q=${encodeURIComponent(query)}&limit=5`);
      setSearchResults(response.data.results.filter(p => p.id !== player?.id));
    } catch (err) {
      console.error('Error searching players:', err);
    }
  }, [api, player?.id]);

  // Deposit
  const handleDeposit = async () => {
    if (!api) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification?.('Montante inválido', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api().post('/bank/deposit', { amount });
      showNotification?.(response.data.message, 'success');
      setShowDepositModal(false);
      setDepositAmount('');
      await fetchBankStatus();
      await refreshGameState?.();
    } catch (err) {
      showNotification?.(err.response?.data?.detail || 'Erro ao depositar', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Withdraw
  const handleWithdraw = async () => {
    if (!api) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification?.('Montante inválido', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api().post('/bank/withdraw', { amount });
      showNotification?.(response.data.message, 'success');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      await fetchBankStatus();
      await refreshGameState?.();
    } catch (err) {
      showNotification?.(err.response?.data?.detail || 'Erro ao levantar', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Transfer
  const handleTransfer = async () => {
    if (!api || !transferRecipient) return;
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification?.('Montante inválido', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api().post('/bank/transfer', {
        recipient_id: transferRecipient,
        amount,
        instant: transferInstant,
        message: transferMessage || null
      });
      showNotification?.(response.data.message, 'success');
      setShowTransferModal(false);
      setTransferAmount('');
      setTransferRecipient('');
      setTransferMessage('');
      setTransferInstant(false);
      setSearchResults([]);
      setSearchQuery('');
      await fetchBankStatus();
    } catch (err) {
      showNotification?.(err.response?.data?.detail || 'Erro na transferência', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create investment
  const handleInvest = async (investmentId, amount) => {
    if (!api) return;
    
    try {
      setLoading(true);
      const response = await api().post('/bank/invest', {
        investment_id: investmentId,
        amount
      });
      showNotification?.(response.data.message, 'success');
      await fetchInvestments();
      await fetchBankStatus();
    } catch (err) {
      showNotification?.(err.response?.data?.detail || 'Erro ao investir', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cancel investment
  const handleCancelInvestment = async (investmentId) => {
    if (!api) return;
    
    try {
      setLoading(true);
      const response = await api().delete(`/bank/invest/${investmentId}`);
      showNotification?.(response.data.message, 'success');
      await fetchInvestments();
      await fetchBankStatus();
    } catch (err) {
      showNotification?.(err.response?.data?.detail || 'Erro ao cancelar', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Request loan
  const handleRequestLoan = async () => {
    if (!api) return;
    const amount = parseFloat(loanAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification?.('Montante inválido', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api().post('/bank/loan', { amount });
      showNotification?.(response.data.message, 'success');
      setShowLoanModal(false);
      setLoanAmount('');
      await fetchLoans();
      await fetchBankStatus();
    } catch (err) {
      showNotification?.(err.response?.data?.detail || 'Erro no empréstimo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pay loan
  const handlePayLoan = async (loanId, amount) => {
    if (!api) return;
    
    try {
      setLoading(true);
      const response = await api().post(`/bank/loan/${loanId}/pay`, { amount });
      showNotification?.(response.data.message, 'success');
      await fetchLoans();
      await fetchBankStatus();
    } catch (err) {
      showNotification?.(err.response?.data?.detail || 'Erro no pagamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Upgrade security
  const handleUpgradeSecurity = async (level) => {
    if (!api) return;
    
    try {
      setLoading(true);
      const response = await api().post('/bank/security/upgrade', { level });
      showNotification?.(response.data.message, 'success');
      setShowSecurityModal(false);
      await fetchBankStatus();
    } catch (err) {
      showNotification?.(err.response?.data?.detail || 'Erro no upgrade', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Rob player
  const handleRobPlayer = async (targetId) => {
    if (!api) return;
    
    try {
      setLoading(true);
      const response = await api().post(`/bank/rob/${targetId}`);
      setShowRobberyResult(response.data);
      await fetchRobberyTargets();
      await fetchBankStatus();
      await refreshGameState?.();
    } catch (err) {
      showNotification?.(err.response?.data?.detail || 'Erro no roubo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate cash (compatibility with old system)
  const cash = player?.cash ?? (player?.clean_money ?? 0) + (player?.dirty_money ?? 0);

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Landmark },
    { id: 'transactions', label: 'Transações', icon: History },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp },
    { id: 'loans', label: 'Empréstimos', icon: CreditCard },
    { id: 'robbery', label: 'Roubar', icon: Crosshair }
  ];

  if (!player) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bank Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-surface to-gold/20 border border-primary/30 p-6 rounded">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gold/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/20 border border-primary flex items-center justify-center rounded">
              <Building2 size={32} className="text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-text-primary">Banco Submundo</h1>
              <p className="text-text-secondary">O teu dinheiro, a tua segurança</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="primary" icon={ArrowDownCircle} onClick={() => setShowDepositModal(true)}>
              Depositar
            </Button>
            <Button variant="secondary" icon={ArrowUpCircle} onClick={() => setShowWithdrawModal(true)}>
              Levantar
            </Button>
            <Button variant="ghost" icon={Send} onClick={() => setShowTransferModal(true)}>
              Transferir
            </Button>
          </div>
        </div>
      </div>

      {/* Money Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border-l-4 border-l-warning border border-border p-4 rounded">
          <div className="flex items-center gap-2 mb-2">
            <Banknote size={20} className="text-warning" />
            <p className="text-xs text-text-secondary uppercase tracking-wider">Dinheiro na Mão</p>
          </div>
          <p className="text-3xl font-body text-warning">€{formatNumber(cash)}</p>
          <p className="text-xs text-error mt-1">⚠️ Pode ser roubado</p>
        </div>
        
        <div className="bg-surface border-l-4 border-l-success border border-border p-4 rounded">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank size={20} className="text-success" />
            <p className="text-xs text-text-secondary uppercase tracking-wider">No Banco</p>
          </div>
          <p className="text-3xl font-body text-success">€{formatNumber(bankStatus?.account?.bank_balance || 0)}</p>
          <p className="text-xs text-success mt-1">✓ Protegido ({bankStatus?.security?.protection || 0}%)</p>
        </div>
        
        <div className="bg-surface border-l-4 border-l-primary border border-border p-4 rounded">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-primary" />
            <p className="text-xs text-text-secondary uppercase tracking-wider">Investido</p>
          </div>
          <p className="text-3xl font-body text-primary">€{formatNumber(bankStatus?.account?.total_invested || 0)}</p>
          <p className="text-xs text-text-secondary mt-1">A render juros</p>
        </div>
        
        <div className="bg-surface border-l-4 border-l-error border border-border p-4 rounded">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={20} className="text-error" />
            <p className="text-xs text-text-secondary uppercase tracking-wider">Em Dívida</p>
          </div>
          <p className="text-3xl font-body text-error">€{formatNumber(bankStatus?.account?.total_debt || 0)}</p>
          <p className="text-xs text-text-secondary mt-1">Empréstimos activos</p>
        </div>
      </div>

      {/* Security & Interest Info */}
      {bankStatus && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Security */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="text-primary" size={20} />
                <h3 className="font-heading text-lg text-text-primary">Segurança da Conta</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSecurityModal(true)}>
                <Settings size={14} className="mr-1" />
                Melhorar
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-heading text-primary">{bankStatus.security.level}</span>
              </div>
              <div>
                <p className="font-body text-text-primary">{bankStatus.security.name}</p>
                <p className="text-sm text-text-secondary">Proteção contra roubo: {bankStatus.security.protection}%</p>
              </div>
            </div>
            
            <ProgressBar
              label="Nível de Proteção"
              value={bankStatus.security.protection}
              max={100}
              color="primary"
            />
          </Card>

          {/* Interest & Limits */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Percent className="text-success" size={20} />
              <h3 className="font-heading text-lg text-text-primary">Juros & Limites</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-surface-highlight p-3 rounded">
                <p className="text-xs text-text-secondary">Taxa de Juros Diária</p>
                <p className="text-xl font-body text-success">{bankStatus.interest.daily_rate}%</p>
              </div>
              <div className="bg-surface-highlight p-3 rounded">
                <p className="text-xs text-text-secondary">Juros Ganhos Hoje</p>
                <p className="text-xl font-body text-success">€{formatNumber(bankStatus.interest.earned_today)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Levantamento diário:</span>
                <span className="text-text-primary">
                  €{formatNumber(bankStatus.limits.daily_withdrawal_used)} / €{formatNumber(bankStatus.limits.daily_withdrawal_limit)}
                </span>
              </div>
              <div className="h-1 bg-surface-highlight rounded overflow-hidden">
                <div 
                  className="h-full bg-warning"
                  style={{ width: `${(bankStatus.limits.daily_withdrawal_used / bankStatus.limits.daily_withdrawal_limit) * 100}%` }}
                />
              </div>
              
              <div className="flex justify-between text-sm mt-3">
                <span className="text-text-secondary">Transferência diária:</span>
                <span className="text-text-primary">
                  €{formatNumber(bankStatus.limits.daily_transfer_used)} / €{formatNumber(bankStatus.limits.daily_transfer_limit)}
                </span>
              </div>
              <div className="h-1 bg-surface-highlight rounded overflow-hidden">
                <div 
                  className="h-full bg-primary"
                  style={{ width: `${(bankStatus.limits.daily_transfer_used / bankStatus.limits.daily_transfer_limit) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 font-ui text-sm uppercase tracking-wider transition-all whitespace-nowrap',
              activeTab === id 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-text-secondary hover:text-text-primary'
            )}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      
      {/* Overview Tab */}
      {activeTab === 'overview' && bankStatus && (
        <div className="space-y-6">
          {/* Matured Investments Alert */}
          {bankStatus.matured_investments?.length > 0 && (
            <div className="bg-success/10 border border-success p-4 rounded">
              <h4 className="font-heading text-success mb-2">🎉 Investimentos Maduros!</h4>
              {bankStatus.matured_investments.map((inv, idx) => (
                <p key={idx} className="text-sm text-text-primary">
                  {inv.type}: €{formatNumber(inv.invested)} → €{formatNumber(inv.returned)} 
                  <span className={inv.profit >= 0 ? 'text-success' : 'text-error'}>
                    ({inv.profit >= 0 ? '+' : ''}€{formatNumber(inv.profit)})
                  </span>
                </p>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-2xl font-body text-gold">€{formatNumber(bankStatus.account.net_worth)}</p>
              <p className="text-xs text-text-secondary">Património Total</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-2xl font-body text-success">€{formatNumber(bankStatus.interest.total_earned)}</p>
              <p className="text-xs text-text-secondary">Total Juros Ganhos</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-2xl font-body text-primary">{bankStatus.active_investments?.length || 0}</p>
              <p className="text-xs text-text-secondary">Investimentos Activos</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-2xl font-body text-error">{bankStatus.active_loans?.length || 0}</p>
              <p className="text-xs text-text-secondary">Empréstimos Activos</p>
            </div>
          </div>

          {/* Recent Transactions */}
          {bankStatus.recent_transactions?.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg text-text-primary">Transações Recentes</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('transactions')}>
                  Ver Todas <ChevronRight size={14} />
                </Button>
              </div>
              <div className="space-y-2">
                {bankStatus.recent_transactions.slice(0, 5).map((tx, idx) => (
                  <TransactionItem key={tx.id || idx} transaction={tx} />
                ))}
              </div>
            </Card>
          )}

          {/* Fee Information */}
          <Card>
            <h3 className="font-heading text-lg text-text-primary mb-4">Taxas & Comissões</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-surface-highlight p-3 rounded">
                <p className="text-lg font-body text-warning">{bankStatus.fees.withdrawal}%</p>
                <p className="text-xs text-text-secondary">Levantamento</p>
              </div>
              <div className="bg-surface-highlight p-3 rounded">
                <p className="text-lg font-body text-primary">{bankStatus.fees.transfer}%</p>
                <p className="text-xs text-text-secondary">Transferência</p>
              </div>
              <div className="bg-surface-highlight p-3 rounded">
                <p className="text-lg font-body text-error">{bankStatus.fees.instant_transfer}%</p>
                <p className="text-xs text-text-secondary">Transf. Instantânea</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && transactions && (
        <div className="space-y-4">
          {/* Transaction Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(transactions.stats).slice(0, 4).map(([type, data]) => {
              const config = transactionConfig[type];
              return (
                <div key={type} className="bg-surface border border-border p-3 text-center rounded">
                  <p className="text-lg font-body text-primary">{data.count}</p>
                  <p className="text-xs text-text-secondary">{config?.label || type}</p>
                </div>
              );
            })}
          </div>

          {/* Transaction List */}
          <Card>
            <h3 className="font-heading text-lg text-text-primary mb-4">Histórico de Transações</h3>
            <div className="space-y-2">
              {transactions.transactions.map((tx, idx) => (
                <TransactionItem key={tx.id || idx} transaction={tx} />
              ))}
            </div>
            
            {transactions.pagination.has_more && (
              <div className="text-center mt-4">
                <Button variant="ghost" size="sm">Carregar Mais</Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Investments Tab */}
      {activeTab === 'investments' && investments && (
        <div className="space-y-6">
          {/* Investment Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-2xl font-body text-primary">€{formatNumber(investments.summary.total_invested)}</p>
              <p className="text-xs text-text-secondary">Investido</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-2xl font-body text-success">€{formatNumber(investments.summary.total_returns)}</p>
              <p className="text-xs text-text-secondary">Retornos</p>
            </div>
            <div className={clsx(
              'bg-surface border border-border p-4 text-center rounded',
              investments.summary.total_profit >= 0 ? 'border-success' : 'border-error'
            )}>
              <p className={clsx('text-2xl font-body', investments.summary.total_profit >= 0 ? 'text-success' : 'text-error')}>
                {investments.summary.total_profit >= 0 ? '+' : ''}€{formatNumber(investments.summary.total_profit)}
              </p>
              <p className="text-xs text-text-secondary">Lucro Total</p>
            </div>
            <div className="bg-surface border border-border p-4 text-center rounded">
              <p className="text-2xl font-body text-gold">{investments.summary.active_count}</p>
              <p className="text-xs text-text-secondary">Activos</p>
            </div>
          </div>

          {/* Active Investments */}
          {investments.active_investments?.length > 0 && (
            <Card>
              <h3 className="font-heading text-lg text-text-primary mb-4">Investimentos Activos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {investments.active_investments.map(inv => (
                  <ActiveInvestmentCard 
                    key={inv.id} 
                    investment={inv} 
                    onCancel={handleCancelInvestment}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Investment Options */}
          <Card>
            <h3 className="font-heading text-lg text-text-primary mb-4">Opções de Investimento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {investments.options.map(option => (
                <InvestmentCard
                  key={option.id}
                  investment={option}
                  onInvest={handleInvest}
                  disabled={loading}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && loans && (
        <div className="space-y-6">
          {/* Credit Info */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="text-primary" size={20} />
                <h3 className="font-heading text-lg text-text-primary">Linha de Crédito</h3>
              </div>
              <Button 
                variant="primary"
                onClick={() => setShowLoanModal(true)}
                disabled={!loans.can_borrow}
              >
                <Plus size={14} className="mr-1" />
                Pedir Empréstimo
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-surface-highlight p-3 rounded text-center">
                <p className="text-xl font-body text-primary">€{formatNumber(loans.credit.max_loan)}</p>
                <p className="text-xs text-text-secondary">Crédito Máximo</p>
              </div>
              <div className="bg-surface-highlight p-3 rounded text-center">
                <p className="text-xl font-body text-success">€{formatNumber(loans.credit.available_credit)}</p>
                <p className="text-xs text-text-secondary">Disponível</p>
              </div>
              <div className="bg-surface-highlight p-3 rounded text-center">
                <p className="text-xl font-body text-error">€{formatNumber(loans.credit.total_debt)}</p>
                <p className="text-xs text-text-secondary">Em Dívida</p>
              </div>
              <div className="bg-surface-highlight p-3 rounded text-center">
                <p className="text-xl font-body text-warning">{loans.credit.interest_rate}%</p>
                <p className="text-xs text-text-secondary">Taxa de Juros</p>
              </div>
            </div>
            
            <ProgressBar
              label="Utilização do Crédito"
              value={loans.credit.total_debt}
              max={loans.credit.max_loan}
              color="error"
            />
          </Card>

          {/* Active Loans */}
          {loans.active_loans?.length > 0 && (
            <Card>
              <h3 className="font-heading text-lg text-text-primary mb-4">Empréstimos Activos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loans.active_loans.map(loan => (
                  <LoanCard key={loan.id} loan={loan} onPay={handlePayLoan} />
                ))}
              </div>
            </Card>
          )}

          {loans.active_loans?.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <CreditCard size={48} className="mx-auto text-text-secondary mb-4" />
                <p className="text-text-secondary">Não tens empréstimos activos</p>
                <p className="text-sm text-text-secondary mt-1">Podes pedir até €{formatNumber(loans.credit.available_credit)}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Robbery Tab */}
      {activeTab === 'robbery' && robberyTargets && (
        <div className="space-y-6">
          {/* Robbery Warning */}
          <div className="bg-error/10 border border-error p-4 rounded">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-error flex-shrink-0" size={24} />
              <div>
                <h4 className="font-heading text-error">Zona de Perigo</h4>
                <p className="text-sm text-text-secondary mt-1">
                  Roubar outros jogadores é arriscado! Se falhares, ganhas heat. 
                  Só podes roubar dinheiro que está NA MÃO do jogador - não no banco.
                </p>
              </div>
            </div>
          </div>

          {/* Robbery Status */}
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-body text-primary">{robberyTargets.player_level}</p>
                <p className="text-xs text-text-secondary">Teu Nível</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-body text-warning">{robberyTargets.min_level_required}</p>
                <p className="text-xs text-text-secondary">Nível Mínimo</p>
              </div>
              <div className="text-center">
                {robberyTargets.can_rob ? (
                  <Badge variant="success">Pronto!</Badge>
                ) : (
                  <Badge variant="error">
                    <Timer size={12} className="mr-1" />
                    {robberyTargets.cooldown_remaining_hours}h
                  </Badge>
                )}
                <p className="text-xs text-text-secondary mt-1">Status</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-body text-error">{robberyTargets.targets?.length || 0}</p>
                <p className="text-xs text-text-secondary">Alvos</p>
              </div>
            </div>
          </Card>

          {/* Targets */}
          {robberyTargets.targets?.length > 0 ? (
            <Card>
              <h3 className="font-heading text-lg text-text-primary mb-4">Potenciais Alvos</h3>
              <div className="space-y-2">
                {robberyTargets.targets.map(target => (
                  <RobberyTargetCard
                    key={target.id}
                    target={target}
                    onRob={handleRobPlayer}
                    canRob={robberyTargets.can_rob && robberyTargets.player_level >= robberyTargets.min_level_required}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-text-secondary mb-4" />
                <p className="text-text-secondary">Nenhum alvo disponível</p>
                <p className="text-sm text-text-secondary mt-1">Jogadores com dinheiro na mão aparecem aqui</p>
              </div>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <h4 className="font-heading text-md text-text-primary mb-3">💡 Dicas de Roubo</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Melhora as tuas skills de <span className="text-primary">Stealth</span> e <span className="text-primary">Combat</span> para aumentar a taxa de sucesso</li>
              <li>• Alvos de nível inferior são mais fáceis de roubar</li>
              <li>• Jogadores em gangues podem ter aliados que te perseguem</li>
              <li>• Roubo falhado aumenta o teu heat em 15%</li>
              <li>• Sucesso aumenta o heat em 20% mas roubas até 25% do dinheiro</li>
            </ul>
          </Card>
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Deposit Modal */}
      <Modal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title="Depositar Dinheiro"
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Deposita dinheiro no banco para o proteger de roubos. Dinheiro no banco rende juros diários!
          </p>
          
          <div className="bg-surface-highlight border border-border p-4 rounded">
            <p className="text-text-secondary text-sm mb-2">Disponível para depositar:</p>
            <p className="text-warning text-2xl font-body">€{formatNumber(cash)}</p>
          </div>
          
          <Input
            label="Montante a depositar"
            type="number"
            placeholder={`Mínimo €${bankStatus?.config?.min_deposit || 10}`}
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setDepositAmount(String(Math.floor(cash * 0.25)))}>25%</Button>
            <Button variant="ghost" size="sm" onClick={() => setDepositAmount(String(Math.floor(cash * 0.5)))}>50%</Button>
            <Button variant="ghost" size="sm" onClick={() => setDepositAmount(String(Math.floor(cash * 0.75)))}>75%</Button>
            <Button variant="ghost" size="sm" onClick={() => setDepositAmount(String(cash))}>Tudo</Button>
          </div>
          
          <div className="bg-success/10 border border-success/30 p-3 text-sm rounded">
            <p className="text-success flex items-center gap-2">
              <ShieldCheck size={16} />
              Taxa de juros: {bankStatus?.interest?.daily_rate || 0.1}% ao dia
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowDepositModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" fullWidth onClick={handleDeposit} loading={loading}>
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
          <p className="text-text-secondary text-sm">
            Levanta dinheiro do banco. Atenção: dinheiro na mão pode ser roubado!
          </p>
          
          <div className="bg-surface-highlight border border-border p-4 rounded">
            <p className="text-text-secondary text-sm mb-2">Saldo no banco:</p>
            <p className="text-success text-2xl font-body">€{formatNumber(bankStatus?.account?.bank_balance || 0)}</p>
          </div>
          
          <Input
            label="Montante a levantar"
            type="number"
            placeholder={`Mínimo €${bankStatus?.config?.min_withdrawal || 10}`}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setWithdrawAmount(String(Math.floor((bankStatus?.account?.bank_balance || 0) * 0.25)))}>25%</Button>
            <Button variant="ghost" size="sm" onClick={() => setWithdrawAmount(String(Math.floor((bankStatus?.account?.bank_balance || 0) * 0.5)))}>50%</Button>
            <Button variant="ghost" size="sm" onClick={() => setWithdrawAmount(String(Math.floor((bankStatus?.account?.bank_balance || 0) * 0.75)))}>75%</Button>
            <Button variant="ghost" size="sm" onClick={() => setWithdrawAmount(String(bankStatus?.account?.bank_balance || 0))}>Tudo</Button>
          </div>
          
          <div className="bg-warning/10 border border-warning/30 p-3 text-sm rounded space-y-1">
            <p className="text-warning flex items-center gap-2">
              <Receipt size={16} />
              Taxa de levantamento: {bankStatus?.fees?.withdrawal || 0.5}%
            </p>
            <p className="text-text-secondary">
              Limite restante hoje: €{formatNumber(bankStatus?.limits?.daily_withdrawal_remaining || 0)}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowWithdrawModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" fullWidth onClick={handleWithdraw} loading={loading}>
              Levantar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setSearchResults([]);
          setSearchQuery('');
          setTransferRecipient('');
        }}
        title="Transferir Dinheiro"
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Transfere dinheiro para outro jogador. Transferências são seguras e rastreáveis.
          </p>
          
          <div className="relative">
            <Input
              label="Destinatário"
              placeholder="Pesquisar jogador..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearchPlayers(e.target.value);
              }}
              icon={Search}
            />
            
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded shadow-lg max-h-40 overflow-auto">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-surface-highlight text-left"
                    onClick={() => {
                      setTransferRecipient(p.id);
                      setSearchQuery(p.username);
                      setSearchResults([]);
                    }}
                  >
                    <div className="w-8 h-8 bg-surface-highlight rounded flex items-center justify-center">
                      <Users size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-text-primary">{p.username}</p>
                      <p className="text-xs text-text-secondary">Nível {p.level}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {transferRecipient && (
            <div className="bg-success/10 border border-success/30 p-2 rounded text-sm text-success">
              ✓ Destinatário selecionado: {searchQuery}
            </div>
          )}
          
          <Input
            label="Montante"
            type="number"
            placeholder={`Mínimo €${bankStatus?.config?.min_transfer || 50}`}
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
          />
          
          <Input
            label="Mensagem (opcional)"
            placeholder="Ex: Pagamento do carro"
            value={transferMessage}
            onChange={(e) => setTransferMessage(e.target.value)}
          />
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={transferInstant}
              onChange={(e) => setTransferInstant(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-text-secondary">
              Transferência instantânea (+{bankStatus?.fees?.instant_transfer - bankStatus?.fees?.transfer}% taxa)
            </span>
          </label>
          
          <div className="bg-surface-highlight border border-border p-3 rounded text-sm">
            <p className="text-text-secondary">Taxa: {transferInstant ? bankStatus?.fees?.instant_transfer : bankStatus?.fees?.transfer}%</p>
            <p className="text-text-secondary">Limite restante: €{formatNumber(bankStatus?.limits?.daily_transfer_remaining || 0)}</p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowTransferModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleTransfer} 
              loading={loading}
              disabled={!transferRecipient}
            >
              Transferir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Loan Modal */}
      <Modal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        title="Pedir Empréstimo"
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Pede um empréstimo ao banco. Tens {loans?.credit?.duration_days || 7} dias para pagar.
          </p>
          
          <div className="bg-surface-highlight border border-border p-4 rounded">
            <p className="text-text-secondary text-sm mb-2">Crédito disponível:</p>
            <p className="text-success text-2xl font-body">€{formatNumber(loans?.credit?.available_credit || 0)}</p>
          </div>
          
          <Input
            label="Montante a pedir"
            type="number"
            placeholder="Mínimo €100"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
          />
          
          {loanAmount && parseFloat(loanAmount) > 0 && (
            <div className="bg-warning/10 border border-warning/30 p-3 rounded space-y-1 text-sm">
              <p className="text-warning">Juros: {loans?.credit?.interest_rate || 5}%</p>
              <p className="text-text-primary">
                Total a pagar: €{formatNumber(parseFloat(loanAmount) * (1 + (loans?.credit?.interest_rate || 5) / 100))}
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowLoanModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleRequestLoan} 
              loading={loading}
              disabled={!loanAmount || parseFloat(loanAmount) <= 0}
            >
              Pedir Empréstimo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Security Upgrade Modal */}
      <Modal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        title="Upgrade de Segurança"
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Melhora a segurança da tua conta para aumentar a proteção contra roubos e ganhar mais juros.
          </p>
          
          <div className="space-y-2">
            {[1, 2, 3, 4].map(level => {
              const config = {
                1: { name: 'Básico', protection: 50, cost: 0 },
                2: { name: 'Avançado', protection: 75, cost: 1000 },
                3: { name: 'Elite', protection: 90, cost: 5000 },
                4: { name: 'Máximo', protection: 99, cost: 25000 }
              }[level];
              
              const isCurrent = (bankStatus?.security?.level || 1) === level;
              const isUpgrade = level > (bankStatus?.security?.level || 1);
              const canAfford = (bankStatus?.account?.bank_balance || 0) >= config.cost;
              
              return (
                <div 
                  key={level}
                  className={clsx(
                    'p-4 border rounded',
                    isCurrent ? 'bg-primary/10 border-primary' : 'bg-surface border-border',
                    !isUpgrade && !isCurrent && 'opacity-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={clsx('font-body', isCurrent ? 'text-primary' : 'text-text-primary')}>
                        {config.name} {isCurrent && '(Actual)'}
                      </p>
                      <p className="text-sm text-text-secondary">Proteção: {config.protection}%</p>
                    </div>
                    <div className="text-right">
                      {config.cost > 0 && (
                        <p className={clsx('font-body', canAfford ? 'text-success' : 'text-error')}>
                          €{formatNumber(config.cost)}
                        </p>
                      )}
                      {isUpgrade && (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleUpgradeSecurity(level)}
                          disabled={!canAfford || loading}
                        >
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Robbery Result Modal */}
      <Modal
        isOpen={!!showRobberyResult}
        onClose={() => setShowRobberyResult(null)}
        title={showRobberyResult?.result === 'success' ? '🎉 Roubo Bem-Sucedido!' : '❌ Roubo Falhado'}
      >
        {showRobberyResult && (
          <div className="space-y-4">
            <div className={clsx(
              'p-6 text-center rounded',
              showRobberyResult.result === 'success' ? 'bg-success/20' : 'bg-error/20'
            )}>
              {showRobberyResult.result === 'success' ? (
                <>
                  <Coins size={48} className="mx-auto text-success mb-3" />
                  <p className="text-3xl font-body text-success">+€{formatNumber(showRobberyResult.stolen)}</p>
                  <p className="text-text-secondary mt-2">{showRobberyResult.message}</p>
                </>
              ) : (
                <>
                  <X size={48} className="mx-auto text-error mb-3" />
                  <p className="text-xl font-body text-error">{showRobberyResult.message}</p>
                </>
              )}
            </div>
            
            <div className="bg-warning/10 border border-warning/30 p-3 rounded">
              <p className="text-warning text-sm">
                ⚠️ Heat ganho: +{showRobberyResult.heat_gained}%
              </p>
            </div>
            
            <Button variant="secondary" fullWidth onClick={() => setShowRobberyResult(null)}>
              Fechar
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
