import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ProgressBar';
import { Button, Badge, Modal, Input } from '../components/UI';
import { 
  Users, Crown, Shield, DollarSign, Map, 
  Plus, LogOut, Sword, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

export default function GangPage() {
  const { user, api } = useAuth();
  const { myGang, actionLoading, createGang, joinGang, leaveGang, showNotification } = useGame();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [gangsList, setGangsList] = useState([]);
  const [newGang, setNewGang] = useState({ name: '', tag: '' });
  const [loadingGangs, setLoadingGangs] = useState(false);

  useEffect(() => {
    fetchGangs();
  }, []);

  const fetchGangs = async () => {
    setLoadingGangs(true);
    try {
      const response = await api().get('/gangs');
      setGangsList(response.data);
    } catch (err) {
      console.error('Erro ao buscar gangues:', err);
    } finally {
      setLoadingGangs(false);
    }
  };

  const handleCreateGang = async () => {
    if (!newGang.name || !newGang.tag) {
      showNotification('Preenche todos os campos', 'error');
      return;
    }
    if (newGang.tag.length > 4) {
      showNotification('Tag deve ter no máximo 4 caracteres', 'error');
      return;
    }
    await createGang(newGang.name, newGang.tag);
    setShowCreateModal(false);
    setNewGang({ name: '', tag: '' });
    fetchGangs();
  };

  const handleJoinGang = async (gangId) => {
    await joinGang(gangId);
    fetchGangs();
  };

  const handleLeaveGang = async () => {
    await leaveGang();
    setShowLeaveModal(false);
    fetchGangs();
  };

  const isLeader = myGang && myGang.leader_id === user?.id;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="gang-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-text-primary flex items-center gap-3">
            <Users className="text-primary" size={28} />
            Gangue
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {myGang ? `Membro de ${myGang.name}` : 'Junta-te ou cria uma gangue'}
          </p>
        </div>
        
        {!myGang && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
            data-testid="create-gang-btn"
          >
            Criar Gangue
          </Button>
        )}
      </div>

      {/* My Gang Section */}
      {myGang && (
        <Card className="border-gold">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-surface-highlight border border-gold flex items-center justify-center">
                <Shield size={32} className="text-gold" />
              </div>
              <div>
                <h2 className="font-heading text-2xl text-text-primary flex items-center gap-2">
                  {myGang.name}
                  <Badge variant="gold">[{myGang.tag}]</Badge>
                </h2>
                <p className="text-text-secondary text-sm">
                  Fundada por {myGang.leader_name}
                </p>
              </div>
            </div>
            {isLeader && (
              <Badge variant="gold">
                <Crown size={12} className="mr-1" />
                Líder
              </Badge>
            )}
          </div>

          {/* Gang Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-highlight border border-border p-4 text-center">
              <p className="text-2xl font-body text-primary">{myGang.members_count || myGang.members?.length || 1}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider">Membros</p>
            </div>
            <div className="bg-surface-highlight border border-border p-4 text-center">
              <p className="text-2xl font-body text-gold">{myGang.reputation}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider">Reputação</p>
            </div>
            <div className="bg-surface-highlight border border-border p-4 text-center">
              <p className="text-2xl font-body text-success">€{myGang.treasury?.toFixed(0) || 0}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider">Cofre</p>
            </div>
            <div className="bg-surface-highlight border border-border p-4 text-center">
              <p className="text-2xl font-body text-secondary">{myGang.territories?.length || 0}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider">Territórios</p>
            </div>
          </div>

          {/* Members List */}
          {myGang.members && myGang.members.length > 0 && (
            <div className="mb-6">
              <h3 className="font-heading text-lg text-text-primary mb-3">Membros</h3>
              <div className="space-y-2">
                {myGang.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-surface-highlight border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface border border-border flex items-center justify-center">
                        {member.id === myGang.leader_id ? (
                          <Crown size={18} className="text-gold" />
                        ) : (
                          <Users size={18} className="text-text-secondary" />
                        )}
                      </div>
                      <div>
                        <p className="text-text-primary font-body">{member.username}</p>
                        <p className="text-xs text-text-secondary">Nível {member.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-success text-sm">€{member.total_earnings?.toFixed(0) || 0}</p>
                      <p className="text-xs text-text-secondary">total ganho</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={() => setShowLeaveModal(true)}
              icon={LogOut}
              data-testid="leave-gang-btn"
            >
              Sair da Gangue
            </Button>
          </div>
        </Card>
      )}

      {/* Available Gangs */}
      {!myGang && (
        <>
          <h2 className="font-heading text-xl text-text-primary">Gangues Disponíveis</h2>
          
          {loadingGangs ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-text-secondary">A carregar gangues...</p>
              </div>
            </Card>
          ) : gangsList.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-text-secondary mb-4" />
                <p className="text-text-secondary mb-4">Ainda não existem gangues.</p>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Criar a Primeira Gangue
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gangsList.map((gang) => (
                <div
                  key={gang.id}
                  className="bg-surface border border-border p-4 relative overflow-hidden"
                  data-testid={`gang-${gang.id}`}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading text-lg text-text-primary flex items-center gap-2">
                        {gang.name}
                        <Badge variant="primary">[{gang.tag}]</Badge>
                      </h3>
                      <p className="text-text-secondary text-sm">Líder: {gang.leader_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm mb-4">
                    <span className="text-text-secondary">
                      <Users size={14} className="inline mr-1" />
                      {gang.members_count} membros
                    </span>
                    <span className="text-gold">
                      <Shield size={14} className="inline mr-1" />
                      {gang.reputation} rep
                    </span>
                    <span className="text-secondary">
                      <Map size={14} className="inline mr-1" />
                      {gang.territories?.length || 0} territórios
                    </span>
                  </div>
                  
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleJoinGang(gang.id)}
                    loading={actionLoading}
                    data-testid={`join-gang-${gang.id}`}
                  >
                    Juntar-me
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Gang Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Gangue"
      >
        <div className="space-y-4">
          <Input
            label="Nome da Gangue"
            placeholder="Os Invencíveis"
            value={newGang.name}
            onChange={(e) => setNewGang({ ...newGang, name: e.target.value })}
            data-testid="gang-name-input"
          />
          <Input
            label="Tag (máx. 4 caracteres)"
            placeholder="INVS"
            maxLength={4}
            value={newGang.tag}
            onChange={(e) => setNewGang({ ...newGang, tag: e.target.value.toUpperCase() })}
            data-testid="gang-tag-input"
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleCreateGang}
              loading={actionLoading}
              data-testid="confirm-create-gang"
            >
              Criar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Leave Gang Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Sair da Gangue"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Tens a certeza que queres sair de <strong className="text-text-primary">{myGang?.name}</strong>?
          </p>
          {isLeader && (
            <div className="bg-warning/10 border border-warning/30 p-3 text-warning text-sm">
              Como líder, a liderança será transferida para outro membro. Se fores o único membro, a gangue será eliminada.
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowLeaveModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleLeaveGang}
              loading={actionLoading}
              data-testid="confirm-leave-gang"
            >
              Sair
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
