import { Shield, Eye, Database, Lock, UserCheck, Mail, Clock, AlertTriangle, FileText } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: 'Dados que Recolhemos',
      content: `Ao utilizares o SUBMUNDO, recolhemos os seguintes dados:

• **Dados de Conta**: Email, nome de utilizador e password (encriptada)
• **Dados de Jogo**: Progresso, estatísticas, conquistas, transações no jogo
• **Dados de Sessão**: Informações de login, última atividade
• **Dados Técnicos**: Tipo de dispositivo, browser, endereço IP (para segurança)

Não recolhemos dados sensíveis como informações financeiras reais, localização precisa ou dados biométricos.`
    },
    {
      icon: Eye,
      title: 'Como Usamos os Dados',
      content: `Os teus dados são utilizados exclusivamente para:

• **Funcionamento do Jogo**: Guardar progresso, processar ações, calcular rankings
• **Segurança**: Prevenir fraudes, detectar comportamentos suspeitos
• **Melhorias**: Analisar padrões de uso para melhorar a experiência
• **Comunicação**: Enviar notificações importantes sobre o jogo (se autorizares)

Nunca vendemos os teus dados a terceiros nem os usamos para publicidade direcionada.`
    },
    {
      icon: Lock,
      title: 'Segurança dos Dados',
      content: `Implementamos medidas robustas de segurança:

• **Encriptação**: Passwords são encriptadas com bcrypt (one-way hash)
• **Tokens JWT**: Autenticação segura com tokens temporários
• **HTTPS**: Toda a comunicação é encriptada
• **Backups**: Dados são guardados com redundância
• **Acesso Limitado**: Apenas pessoal autorizado acede aos sistemas

Em caso de violação de segurança, serás notificado conforme exigido por lei.`
    },
    {
      icon: UserCheck,
      title: 'Os Teus Direitos',
      content: `Tens os seguintes direitos sobre os teus dados:

• **Acesso**: Podes solicitar uma cópia dos teus dados
• **Retificação**: Podes corrigir dados incorretos
• **Eliminação**: Podes pedir a eliminação da tua conta e dados
• **Portabilidade**: Podes exportar os teus dados num formato legível
• **Oposição**: Podes opor-te a certos tratamentos de dados

Para exercer estes direitos, contacta-nos através do email de suporte.`
    },
    {
      icon: Clock,
      title: 'Retenção de Dados',
      content: `Os teus dados são retidos enquanto:

• **Conta Ativa**: Dados mantidos enquanto a conta existir
• **Conta Inativa**: Contas sem atividade há mais de 2 anos podem ser arquivadas
• **Após Eliminação**: Dados são removidos em até 30 dias após pedido
• **Obrigações Legais**: Alguns dados podem ser retidos por obrigação legal

Logs de segurança são mantidos por 90 dias para fins de auditoria.`
    },
    {
      icon: AlertTriangle,
      title: 'Cookies e Tecnologias',
      content: `Utilizamos tecnologias de armazenamento local:

• **LocalStorage**: Para guardar o token de sessão
• **Cookies Essenciais**: Apenas para funcionamento básico
• **Sem Rastreamento**: Não usamos cookies de terceiros para tracking

Podes limpar os dados do browser a qualquer momento, mas terás de fazer login novamente.`
    },
    {
      icon: Mail,
      title: 'Contacto',
      content: `Para questões sobre privacidade:

• **Email**: privacidade@submundo.game
• **Tempo de Resposta**: Até 30 dias úteis
• **Autoridade**: Podes também contactar a autoridade de proteção de dados do teu país

Agradecemos feedback sobre como podemos melhorar as nossas práticas de privacidade.`
    },
  ];
  
  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl text-primary flex items-center gap-2">
          <Shield size={28} /> Política de Privacidade
        </h1>
        <p className="text-text-secondary text-sm">Última atualização: 1 de Fevereiro de 2026</p>
      </div>
      
      {/* Introduction */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <p className="text-text-primary leading-relaxed">
          No SUBMUNDO, levamos a tua privacidade a sério. Esta política explica como recolhemos, 
          usamos e protegemos os teus dados pessoais. Ao utilizares o jogo, concordas com as 
          práticas descritas neste documento.
        </p>
        <p className="text-text-secondary text-sm mt-4">
          Esta política está em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD) 
          e outras leis de privacidade aplicáveis.
        </p>
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
                <h2 className="font-heading text-lg text-text-primary">{section.title}</h2>
              </div>
              <div className="p-4">
                <div className="text-text-secondary leading-relaxed whitespace-pre-line prose-custom">
                  {section.content.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="text-text-primary">{part}</strong> : part
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer */}
      <div className="bg-surface border border-border rounded-lg p-6 text-center">
        <FileText size={32} className="mx-auto text-text-secondary mb-3" />
        <p className="text-text-secondary text-sm">
          Reservamo-nos o direito de atualizar esta política. Alterações significativas serão 
          comunicadas através do jogo. A continuação do uso após alterações implica aceitação.
        </p>
      </div>
    </div>
  );
}
