import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ProgressBar';
import { Button, Badge, Modal } from '../components/UI';
import { 
  Users, Heart, Handshake, AlertTriangle, Gift, 
  MessageSquare, Info, ChevronRight, Star, Shield,
  Skull, DollarSign, Eye, Phone, MapPin, Clock
} from 'lucide-react';
import { IMPORTANT_NPCS, QUOTES, getRandomWisdomQuote } from '../data/lore';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

export default function ContactsPage() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNPC, setSelectedNPC] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [wisdomQuote] = useState(getRandomWisdomQuote());

  useEffect(() => {
    fetchContacts();
  }, [token]);

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/npcs/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = async (npcId, action) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/npcs/${npcId}/interact?action=${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        // Refresh contacts to show updated relationship
        await fetchContacts();
        // Update selected NPC if viewing details
        if (selectedNPC?.id === npcId) {
          const updated = contacts.find(c => c.id === npcId);
          if (updated) setSelectedNPC(updated);
        }
        return result;
      }
    } catch (error) {
      console.error('Error interacting with NPC:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openNPCDetails = (npc) => {
    setSelectedNPC(npc);
    setShowDetailModal(true);
  };

  const getRelationshipIcon = (level) => {
    switch (level) {
      case 'enemy':
      case 'hostile':
        return <Skull className="text-error" size={20} />;
      case 'unfriendly':
        return <AlertTriangle className="text-warning" size={20} />;
      case 'neutral':
        return <Users className="text-text-secondary" size={20} />;
      case 'friendly':
        return <Handshake className="text-success" size={20} />;
      case 'allied':
        return <Star className="text-primary" size={20} />;
      case 'trusted':
        return <Heart className="text-gold" size={20} />;
      default:
        return <Users className="text-text-secondary" size={20} />;
    }
  };

  const getRelationshipColor = (level) => {
    switch (level) {
      case 'enemy':
      case 'hostile':
        return 'error';
      case 'unfriendly':
        return 'warning';
      case 'neutral':
        return 'secondary';
      case 'friendly':
        return 'success';
      case 'allied':
        return 'primary';
      case 'trusted':
        return 'gold';
      default:
        return 'secondary';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'agiota':
        return <DollarSign size={16} />;
      case 'informante':
        return <Eye size={16} />;
      case 'recetador':
        return <Gift size={16} />;
      case 'médico clandestino':
        return <Shield size={16} />;
      case 'traficante':
        return <AlertTriangle size={16} />;
      case 'polícia corrupto':
        return <Shield size={16} />;
      case 'hacker':
        return <Phone size={16} />;
      default:
        return <Users size={16} />;
    }
  };

  // Enrich contacts with lore data
  const enrichedContacts = contacts.map(contact => {
    const loreContact = IMPORTANT_NPCS.contacts.find(
      c => c.name.toLowerCase().includes(contact.name?.split(' ')[0]?.toLowerCase())
    );
    return {
      ...contact,
      lore: loreContact
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary italic">"{wisdomQuote}"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-text-primary flex items-center gap-3">
            <Users className="text-primary" />
            Contactos
          </h1>
          <p className="text-text-secondary mt-1">Gere as tuas relações no submundo</p>
        </div>
        <div className="text-right text-sm text-text-secondary italic max-w-xs hidden md:block">
          "{wisdomQuote}"
        </div>
      </div>

      {/* Wisdom Quote (mobile) */}
      <div className="md:hidden bg-surface/50 border border-surface-highlight p-3 rounded-lg">
        <p className="text-text-secondary italic text-sm">"{wisdomQuote}"</p>
      </div>

      {/* Relationship Legend */}
      <Card title="Níveis de Relacionamento" icon={Heart}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 bg-surface-highlight rounded">
            <Skull className="text-error" size={16} />
            <span>Inimigo</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-surface-highlight rounded">
            <AlertTriangle className="text-warning" size={16} />
            <span>Desconfiado</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-surface-highlight rounded">
            <Users className="text-text-secondary" size={16} />
            <span>Neutro</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-surface-highlight rounded">
            <Handshake className="text-success" size={16} />
            <span>Amigável</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-surface-highlight rounded">
            <Star className="text-primary" size={16} />
            <span>Aliado</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-surface-highlight rounded">
            <Heart className="text-gold" size={16} />
            <span>Confiança</span>
          </div>
        </div>
      </Card>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enrichedContacts.map((npc) => (
          <div
            key={npc.id}
            className="bg-surface border border-surface-highlight hover:border-primary transition-colors cursor-pointer group"
            onClick={() => openNPCDetails(npc)}
          >
            {/* Header */}
            <div className="p-4 border-b border-surface-highlight">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-${getRelationshipColor(npc.relationship?.level)}/20 border border-${getRelationshipColor(npc.relationship?.level)} flex items-center justify-center`}>
                    {getRelationshipIcon(npc.relationship?.level)}
                  </div>
                  <div>
                    <h3 className="font-heading text-text-primary group-hover:text-primary transition-colors">
                      {npc.name}
                    </h3>
                    <div className="flex items-center gap-1 text-text-secondary text-sm">
                      {getRoleIcon(npc.role)}
                      <span>{npc.role}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-text-secondary group-hover:text-primary transition-colors" />
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <p className="text-sm text-text-secondary line-clamp-2">
                {npc.description}
              </p>

              {/* Relationship Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`text-${getRelationshipColor(npc.relationship?.level)}`}>
                    {npc.relationship?.level_name}
                  </span>
                  <span className="text-text-secondary">
                    {npc.relationship?.points > 0 ? '+' : ''}{npc.relationship?.points} pts
                  </span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-${getRelationshipColor(npc.relationship?.level)} transition-all duration-500`}
                    style={{ width: `${Math.max(0, Math.min(100, (npc.relationship?.points + 100) / 2))}%` }}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <MapPin size={14} />
                <span>{npc.location?.charAt(0).toUpperCase() + npc.location?.slice(1)}</span>
              </div>

              {/* Effects Preview */}
              {npc.relationship?.effects && (
                <div className="flex gap-2 flex-wrap">
                  {npc.relationship.effects.can_trade && (
                    <Badge variant="success" size="sm">Pode negociar</Badge>
                  )}
                  {npc.relationship.effects.price_modifier < 1 && (
                    <Badge variant="gold" size="sm">
                      -{Math.round((1 - npc.relationship.effects.price_modifier) * 100)}% preços
                    </Badge>
                  )}
                  {npc.relationship.effects.will_betray && (
                    <Badge variant="error" size="sm">Perigoso</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Known Rivals Section */}
      <Card title="Rivais Conhecidos" icon={Skull}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {IMPORTANT_NPCS.rivals.map((rival, idx) => (
            <div key={idx} className="bg-error/10 border border-error/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-error/20 rounded-full flex items-center justify-center">
                  <Skull className="text-error" size={20} />
                </div>
                <div>
                  <h4 className="font-heading text-text-primary">{rival.name}</h4>
                  <p className="text-xs text-error">{rival.gang}</p>
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-2">{rival.description}</p>
              <Badge variant="error">Ameaça: {rival.threat}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* NPC Detail Modal */}
      {showDetailModal && selectedNPC && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedNPC.name}
        >
          <div className="space-y-4">
            {/* NPC Info */}
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 bg-${getRelationshipColor(selectedNPC.relationship?.level)}/20 border border-${getRelationshipColor(selectedNPC.relationship?.level)} flex items-center justify-center flex-shrink-0`}>
                {getRelationshipIcon(selectedNPC.relationship?.level)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-text-secondary">{selectedNPC.role}</span>
                  <span className="text-text-secondary">•</span>
                  <span className="text-text-secondary capitalize">{selectedNPC.location}</span>
                </div>
                <p className="text-text-secondary text-sm">{selectedNPC.description}</p>
              </div>
            </div>

            {/* Relationship Details */}
            <div className="bg-surface-highlight p-4 rounded-lg">
              <h4 className="font-ui text-sm uppercase text-text-secondary mb-3">Relacionamento</h4>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-${getRelationshipColor(selectedNPC.relationship?.level)} font-heading`}>
                  {selectedNPC.relationship?.level_name}
                </span>
                <span className="text-text-primary">
                  {selectedNPC.relationship?.points > 0 ? '+' : ''}{selectedNPC.relationship?.points} pontos
                </span>
              </div>
              <div className="h-3 bg-background rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full bg-${getRelationshipColor(selectedNPC.relationship?.level)} transition-all`}
                  style={{ width: `${Math.max(0, Math.min(100, (selectedNPC.relationship?.points + 100) / 2))}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Modificador de Preços:</span>
                  <span className={selectedNPC.relationship?.effects?.price_modifier < 1 ? 'text-success' : selectedNPC.relationship?.effects?.price_modifier > 1 ? 'text-error' : 'text-text-primary'}>
                    {Math.round(selectedNPC.relationship?.effects?.price_modifier * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Qualidade Info:</span>
                  <span className="text-text-primary capitalize">{selectedNPC.relationship?.effects?.info_quality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Chance de Ajuda:</span>
                  <span className="text-text-primary">{selectedNPC.relationship?.effects?.help_chance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Interações:</span>
                  <span className="text-text-primary">{selectedNPC.relationship?.interactions_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-ui text-sm uppercase text-text-secondary mb-2">Serviços</h4>
              <div className="flex flex-wrap gap-2">
                {selectedNPC.services?.map((service, idx) => (
                  <Badge key={idx} variant="secondary">{service}</Badge>
                ))}
              </div>
            </div>

            {/* Lore Info (if available) */}
            {selectedNPC.lore && (
              <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
                <h4 className="font-ui text-sm uppercase text-primary mb-2">Intel</h4>
                <p className="text-sm text-text-secondary">{selectedNPC.lore.description}</p>
                {selectedNPC.lore.services && (
                  <div className="mt-2">
                    <span className="text-xs text-text-secondary">Serviços conhecidos: </span>
                    <span className="text-xs text-text-primary">{selectedNPC.lore.services.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Available Interactions */}
            <div>
              <h4 className="font-ui text-sm uppercase text-text-secondary mb-2">Interações Disponíveis</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedNPC.available_interactions?.map((interaction) => (
                  <Button
                    key={interaction.id}
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleInteraction(selectedNPC.id, interaction.id)}
                    className="justify-start"
                  >
                    {interaction.id === 'gift' && <Gift size={14} className="mr-2" />}
                    {interaction.id === 'trade' && <DollarSign size={14} className="mr-2" />}
                    {interaction.id === 'request_favor' && <Handshake size={14} className="mr-2" />}
                    {interaction.id === 'share_info' && <MessageSquare size={14} className="mr-2" />}
                    {interaction.name}
                    {interaction.cost > 0 && (
                      <span className="ml-auto text-warning">€{interaction.cost}</span>
                    )}
                  </Button>
                ))}
                {(!selectedNPC.available_interactions || selectedNPC.available_interactions.length === 0) && (
                  <p className="text-text-secondary text-sm col-span-2">
                    Nenhuma interação disponível. Melhora o teu relacionamento primeiro.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
