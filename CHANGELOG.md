# Changelog - Sistema de Gestão ALSF (Lar de São Francisco)

Todas as alterações notáveis, implementações de módulos e atualizações deste projeto estão documentadas neste arquivo. 
O formato baseia-se em *Keep a Changelog*, focando na evolução da arquitetura e das funcionalidades entregues.

## [Unreleased] - MVP Fase 1 Concluído

### 🛒 Módulo PDV (Ponto de Venda)
- **Implementado:** Interface de Ponto de Venda completa para uso em Bazares e Missões.
- **Implementado:** Gestão de carrinho inteligente (Adição, Remoção, Alteração de Quantidade) vinculada ao estoque dinâmico.
- **Implementado:** Sistema de pagamento otimizado com métodos: PIX, Cartão e Dinheiro.
- **Adicionado:** Emissão de Recibo Digital Pós-Venda renderizado in-app imediatamente após o checkout.
- **Adicionado:** Botão de Impressão Térmica gerando documentos formatados para bobinas de 80mm/58mm.
- **Adicionado:** Painel "Relatório de Vendas" interativo com seleção de Data e dashboards financeiros.
- **Adicionado:** Suporte a estornos com exclusão de vendas atreladas ao fluxo de caixa diário.
- **Adicionado:** Recurso de aplicação rápida de descontos manuais (5%, 10%, 15%) durante transações.

### 🏥 Gestão Hospitalar e Clínica (Triagem e Atendimentos)
- **Implementado:** Fluxo de Triagem de saúde com aferição de sinais vitais (Pressão, Glicemia, Temperatura).
- **Implementado:** Ficha de Anamnese detalhada para registros médicos e psicológicos (dores, histórico familiar).
- **Implementado:** Consultório Modular dividido por especialidades: Médico, Psicologia, Fisioterapia, Enfermagem e Odontologia.
- **Adicionado:** Gestão avançada de Prontuários limitando o acesso e a visibilidade dos dados clínicos conforme a especialidade (LGPD e sigilo).
- **Adicionado:** Prescrição médica integrada com geração de receituários digitais salvos no histórico do paciente.

### 💊 Módulo Farmácia e Movimentação de Estoque
- **Implementado:** Gestão de Medicamentos Controlados e insumos médicos (Antibióticos, Psicotrópicos).
- **Implementado:** Sistema de lote e controle de validades com alertas visuais para medicamentos próximos ao vencimento.
- **Adicionado:** Dispensação de medicamentos vinculada a receitas médicas digitalizadas do CRAM.
- **Adicionado:** Interface de Entrada/Saída de estoque (`StockMovementModal`) detalhando doações, compras e baixas.

### 👥 Voluntariado e Controle de Acesso
- **Implementado:** Banco de talentos e registro de voluntários (Dados pessoais, habilidades, escalas).
- **Implementado:** Sistema de controle de acesso Baseado em Cargos (RBAC), incluindo até 12 níveis de permissões distintas.
- **Adicionado:** Telas pós-login contextuais. (ex: "Triagem" acessa a área de Sinais Vitais direto; "Admin" acessa o Dashboard Global).
- **Adicionado:** Criação dinâmica de painéis segmentados para perfis da coordenação.

### 📊 Dashboard da Presidência e Inteligência de Dados
- **Implementado:** Painel Executivo ('President Dashboard') exclusivo para visão macro da gestão da ONG.
- **Adicionado:** Gráficos interativos (PieCharts, BarCharts) calculando impacto social em tempo real.
- **Adicionado:** Monitoramento cruzado de doações, despesas hospitalares e número total de beneficiados (famílias e pacientes).

### 🚀 Modo Missão (Operação de Retaguarda)
- **Implementado:** 'Mission Control' e 'Mission Panel', um ambiente focado na execução de frentes de serviço de emergência.
- **Adicionado:** Sincronização em Lote projetada para garantir que o caixa operacional funcione mesmo em condições de rede instáveis.

### 💼 Painel Financeiro
- **Implementado:** Fluxo de Entrada (Receitas / Doações) e Saída (Despesas operacionais e folha).
- **Adicionado:** Lançamento rápido de transações, integração com doações e consolidação automática dos rendimentos gerados no PDV.
- **Adicionado:** Separação contábil por Centros de Custo (Missões, Alvenaria, Bazar, Clínica).

### 🖥️ Infraestrutura, UI/UX e Deploy
- **Adicionado:** Arquitetura baseada em React (Vite) + TailwindCSS, focando na modularidade de componentes.
- **Adicionado:** Banco de dados e Autenticação robusta utilizando Firebase (Firestore e Auth).
- **Adicionado:** Interface Glassmorphism moderna com temas light/dark suaves focados na leitura prolongada.
- **Adicionado:** Layout 100% responsivo para operações "on-the-go" via tablets ou smartphones.
- **Adicionado:** Modo "Apresentação em TV" projetado para exibir KPIs e status das missões em monitores passivos na sede da ONG.
