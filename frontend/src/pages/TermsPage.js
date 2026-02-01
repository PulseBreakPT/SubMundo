import { ScrollText, Check, X, AlertTriangle, Gavel, UserX, Shield, Scale, FileWarning, Ban } from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      icon: Check,
      title: 'Aceitação dos Termos',
      content: `Ao criares uma conta e utilizares o SUBMUNDO, aceitas estes Termos e Condições na sua totalidade. Se não concordares com algum ponto, não deves utilizar o serviço.

Estes termos constituem um acordo legal entre ti ("Jogador") e a equipa SUBMUNDO ("Nós"). O jogo é fornecido "tal como está" para fins de entretenimento.`
    },
    {
      icon: UserX,
      title: 'Elegibilidade',
      content: `Para jogar SUBMUNDO deves:

• Ter pelo menos 16 anos de idade
• Fornecer informações verdadeiras no registo
• Ter capacidade legal para aceitar estes termos
• Não estar banido de versões anteriores do jogo

Encarregados de educação são responsáveis pela atividade de menores sob a sua supervisão.`
    },
    {
      icon: Shield,
      title: 'Regras de Conduta',
      content: `Ao jogar, comprometes-te a:

**Permitido:**
• Jogar de forma justa e honesta
• Interagir respeitosamente com outros jogadores
• Reportar bugs e comportamentos suspeitos
• Competir dentro das mecânicas do jogo

**Proibido:**
• Usar cheats, bots ou scripts automatizados
• Explorar bugs para vantagem injusta
• Assediar, ameaçar ou insultar outros jogadores
• Partilhar ou vender contas
• Tentar hackear ou comprometer o sistema
• Fazer-se passar por staff ou outros jogadores`
    },
    {
      icon: Scale,
      title: 'Propriedade Intelectual',
      content: `Todo o conteúdo do SUBMUNDO é propriedade exclusiva nossa:

• Código, gráficos, textos e design
• Nome, logótipo e marca SUBMUNDO
• Mecânicas de jogo e sistemas
• Dados gerados pelo jogo

É proibido copiar, modificar, distribuir ou criar obras derivadas sem autorização escrita. Os teus dados de jogo são licenciados para teu uso pessoal dentro do jogo.`
    },
    {
      icon: Ban,
      title: 'Penalizações',
      content: `Violações das regras podem resultar em:

**Infrações Leves** (spam, linguagem imprópria):
• Aviso
• Silenciamento temporário

**Infrações Moderadas** (exploits, assédio):
• Suspensão temporária (1-30 dias)
• Reset de progresso parcial

**Infrações Graves** (hacking, fraude, ameaças):
• Banimento permanente
• Possível ação legal

Decisões de moderação são finais. Podes apelar através do suporte.`
    },
    {
      icon: FileWarning,
      title: 'Limitação de Responsabilidade',
      content: `O SUBMUNDO é fornecido para entretenimento:

• Não garantimos disponibilidade contínua do serviço
• Não somos responsáveis por perdas de dados devido a falhas técnicas
• O progresso no jogo não tem valor monetário real
• Podemos modificar ou descontinuar funcionalidades a qualquer momento
• Não somos responsáveis por interações negativas entre jogadores

Jogas por tua conta e risco. Este é um jogo de ficção - nenhuma atividade ilegal real é promovida ou encorajada.`
    },
    {
      icon: AlertTriangle,
      title: 'Conteúdo do Jogo',
      content: `SUBMUNDO contém temas para maiores de 16:

• Referências a atividades criminosas fictícias
• Violência simulada (text-based)
• Economia virtual com elementos de risco
• Competição entre jogadores

Todo o conteúdo é fictício e não representa nem encoraja comportamentos reais. O jogo é puramente para entretenimento.

Se sentires que o jogo está a afetar negativamente o teu bem-estar, recomendamos fazer uma pausa.`
    },
    {
      icon: Gavel,
      title: 'Disposições Legais',
      content: `Termos adicionais:

• **Lei Aplicável**: Estes termos são regidos pela lei portuguesa
• **Jurisdição**: Tribunais de Lisboa para resolução de disputas
• **Alterações**: Podemos alterar estes termos com aviso prévio de 30 dias
• **Severabilidade**: Se alguma cláusula for inválida, as restantes mantêm-se
• **Totalidade**: Este documento constitui o acordo completo

Questões legais: legal@submundo.game`
    },
  ];
  
  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl text-primary flex items-center gap-2">
          <ScrollText size={28} /> Termos e Condições
        </h1>
        <p className="text-text-secondary text-sm">Última atualização: 1 de Fevereiro de 2026</p>
      </div>
      
      {/* Warning Banner */}
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle size={24} className="text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-warning font-heading">Leitura Importante</p>
          <p className="text-text-secondary text-sm">
            Ao jogar SUBMUNDO, aceitas automaticamente estes termos. Recomendamos a leitura completa 
            antes de continuar a jogar.
          </p>
        </div>
      </div>
      
      {/* Summary */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="font-heading text-lg text-text-primary mb-3">Resumo Rápido</h2>
        <ul className="space-y-2 text-text-secondary">
          <li className="flex items-center gap-2">
            <Check size={16} className="text-success" />
            Joga de forma justa e respeita outros jogadores
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-success" />
            Não uses cheats, bots ou exploits
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-success" />
            O conteúdo é fictício - para maiores de 16 anos
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-success" />
            Podemos banir contas que violem as regras
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-success" />
            O jogo é gratuito e sem valor monetário real
          </li>
        </ul>
      </div>
      
      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div key={index} className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="p-4 bg-surface-highlight border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon size={20} />
                </div>
                <h2 className="font-heading text-lg text-text-primary">
                  {index + 1}. {section.title}
                </h2>
              </div>
              <div className="p-4">
                <div className="text-text-secondary leading-relaxed whitespace-pre-line">
                  {section.content.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="text-text-primary">{part}</strong> : part
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Accept */}
      <div className="bg-surface border border-border rounded-lg p-6 text-center">
        <ScrollText size={32} className="mx-auto text-text-secondary mb-3" />
        <p className="text-text-primary font-heading mb-2">Ao continuar a jogar, aceitas estes termos.</p>
        <p className="text-text-secondary text-sm">
          Dúvidas? Contacta-nos: suporte@submundo.game
        </p>
      </div>
    </div>
  );
}
