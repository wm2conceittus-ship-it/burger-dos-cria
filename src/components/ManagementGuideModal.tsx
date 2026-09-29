import React from 'react';
import { X, CheckCircle, ChefHat, Layers, BarChart3, Settings, Printer, PhoneCall, Sparkles } from 'lucide-react';

interface ManagementGuideModalProps {
  onClose: () => void;
  onNavigateTab: (tab: 'pedidos' | 'cardapio' | 'relatorios' | 'configuracoes') => void;
}

export const ManagementGuideModal: React.FC<ManagementGuideModalProps> = ({
  onClose,
  onNavigateTab,
}) => {
  const steps = [
    {
      num: '1',
      title: 'Fluxo de Pedidos em Tempo Real (KDS)',
      desc: 'Quando o cliente faz o pedido no cardápio, ele apita instantaneamente na aba "Novos". Você pode clicar em "Aceitar" para enviar à chapa ou "Recusar" caso esteja fora do horário.',
      action: 'Ver Pedidos',
      tab: 'pedidos' as const,
      icon: ChefHat,
    },
    {
      num: '2',
      title: 'Impressão de Comanda & Produção',
      desc: 'No card do pedido, clique no ícone da impressora para gerar a comanda térmica instantânea para a cozinha e motoboy com todos os detalhes e observações.',
      action: 'Ver Comandas',
      tab: 'pedidos' as const,
      icon: Printer,
    },
    {
      num: '3',
      title: 'Controle de Cardápio & Pausar Estoque',
      desc: 'Acabou o bacon ou o queijo gruyère? Na aba "Cardápio & Estoque", basta desligar o botão do produto para pausá-lo na hora no app do cliente, ou alterar preços quando quiser.',
      action: 'Gerenciar Cardápio',
      tab: 'cardapio' as const,
      icon: Layers,
    },
    {
      num: '4',
      title: 'Lançar Pedidos Manuais (Balcão/Telefone)',
      desc: 'Se um cliente ligar no WhatsApp ou pedir no balcão, use o botão "Criar Pedido Manual" para lançar direto na fila da cozinha com total controle.',
      action: 'Criar Pedido Manual',
      tab: 'pedidos' as const,
      icon: PhoneCall,
    },
    {
      num: '5',
      title: 'Relatórios do Turno & Fechamento de Caixa',
      desc: 'Acompanhe o faturamento bruto, ticket médio, método de pagamento (Pix, Cartão, Dinheiro) e produtos mais vendidos com opção de fechar o caixa do dia.',
      action: 'Ver Relatórios',
      tab: 'relatorios' as const,
      icon: BarChart3,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#20201f] border border-[#353535] rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#353535] flex justify-between items-center bg-[#1c1b1b]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ff5722]/15 flex items-center justify-center text-[#ff5722]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                Como Fazer Toda a Gestão da Loja
              </h3>
              <p className="text-[10px] text-[#b4b5b5]">Guia prático de operação do Burger Dash</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#b4b5b5] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 hide-scrollbar">
          {steps.map(step => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-[#1c1b1b] border border-[#353535]/60 rounded-2xl p-3.5 flex items-start gap-3 hover:border-[#ff5722]/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#ff5722] text-white font-['Montserrat'] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.num}
                </div>
                <div className="flex-grow space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-['Montserrat'] font-bold text-xs text-white">
                      {step.title}
                    </h4>
                    <Icon className="w-4 h-4 text-[#ffb5a0]" />
                  </div>
                  <p className="text-[11px] text-[#b4b5b5] leading-relaxed font-light">
                    {step.desc}
                  </p>
                  <button
                    onClick={() => {
                      onNavigateTab(step.tab);
                      onClose();
                    }}
                    className="mt-1.5 text-[10px] font-bold text-[#ff5722] hover:text-[#ff8a65] underline flex items-center gap-1 font-['Montserrat']"
                  >
                    <span>{step.action} &rarr;</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#1c1b1b] border-t border-[#353535] flex justify-end">
          <button
            onClick={onClose}
            className="btn-flame px-5 py-2 rounded-md text-xs font-bold text-white font-['Montserrat']"
          >
            Entendido, ir para o Gestor!
          </button>
        </div>
      </div>
    </div>
  );
};
