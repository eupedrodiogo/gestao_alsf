# 📘 Documentação Oficial do Sistema
**Lar São Francisco na Providência de Deus**

---

## 1. Sumário Executivo (Visão para Diretoria e Stakeholders)

**Propósito:**
O Sistema de Gestão ALSF é uma plataforma corporativa (ERP/SaaS) desenvolvida sob medida para centralizar, auditar e otimizar todas as frentes de atuação do Lar São Francisco. Seu objetivo é substituir o uso de planilhas e controles manuais desconexos por uma fonte única de verdade (Single Source of Truth), acessível em tempo real.

**Impacto Operacional e Governança:**
- **Transparência e Auditoria:** Cada transação financeira, dispensa de medicamento ou atendimento médico fica registrado com carimbo de tempo (*timestamp*) e autoria, reduzindo desperdícios e desvios.
- **Eficiência Financeira:** A unificação do Ponto de Venda (Bazar/Cantina) com o Livro Caixa e o controle de Doações permite saber exatamente o custo das missões em oposição à arrecadação do dia.
- **Proteção de Dados (LGPD):** Prontuários médicos e dados sensíveis de pacientes só podem ser acessados por profissionais autorizados, blindando a instituição contra riscos legais.
- **Tomada de Decisão:** O Painel do Presidente (*President Dashboard*) centraliza indicadores-chave (KPIs) para que a diretoria possa avaliar a saúde da organização em instantes.

---

## 2. Visão Geral dos Módulos Funcionais (Negócio e Operação)

O ecossistema é dividido em módulos operacionais interdependentes:

### 🏥 Módulo Saúde & Atendimento
1. **Recepção e Fila de Espera:** Organiza a entrada de pacientes de forma justa e rastreável.
2. **Triagem (Enfermagem):** Aferição de sinais vitais (pressão, glicemia, temperatura) e preenchimento de ficha de Anamnese prévia.
3. **Consultório Clínico:** Interface separada para Médicos, Psicólogos e Dentistas. Possui histórico longitudinal do paciente e prescrição digital direta para a farmácia.

### 💊 Módulo Farmácia e Almoxarifado
1. **Controle de Estoque Ativo:** Rastreia entradas (compras/doações) e saídas, com suporte a múltiplas unidades de medida (caixas, cartelas, frascos).
2. **Dispensação Segura:** A farmácia interna só libera medicamentos (especialmente controlados e antibióticos) mediante vínculo com um paciente ou missão ativa.
3. **Alertas de Validade:** Monitora ativamente lotes perto do vencimento.

### 🛒 Ponto de Venda (PDV) e Financeiro
1. **PDV Integrado:** Interface de caixa rápido para bazares e eventos, com suporte a leitor de código de barras, controle de carrinho, aplicação de descontos e emissão instantânea de Recibos em impressora térmica.
2. **Livro Caixa Corporativo:** Consolida entradas (PDV, Doações, Arrecadação) e saídas (Compras de suprimentos, despesas operacionais).
3. **Centros de Custo:** Permite ratear despesas e receitas por "Missão" ou "Recurso Fixo".

### 🚀 Módulo Missões e Voluntariado
1. **Gestão de Pessoas (Banco de Talentos):** Cadastro de voluntários, suas especialidades médicas ou operacionais e disponibilidade.
2. **Mission Control (Operação de Campo):** Permite a abertura de uma "Missão" temporária (ex: Ação Comunitária de final de semana), provisionando recursos do estoque principal e alocando a equipe de voluntários acionada. O módulo possui arquitetura resiliente para atuar mesmo em locais de missão com oscilação na rede de internet.

---

## 3. Arquitetura Técnica (Visão Equipe de T.I.)

Construído sob o escopo de **Aplicações Web de Página Única (SPA)** consumindo infraestrutura como serviço (BaaS/Serverless), o que zera o custo inicial de servidores rígidos e garante alta escalabilidade.

### Stack Tecnológico Frontend
- **Framework Core:** `React 19` (Hooks, Context API).
- **Linguagem:** `TypeScript 5.8` (Forte tipagem para prevenção de falhas em tempo de compilação).
- **Bundler & Build Tool:** `Vite 6` (Alta velocidade de HMR e builds enxutos).
- **Estilização e UI:** `Tailwind CSS v3` (Utility-first) e ícones vetorizados do `Lucide React`. O padrão visual adotado prioriza o *Glassmorphism* moderno, com alto contraste e design responsivo (Mobile-first).

### Back-End, Database e Infraestrutura (Serverless)
Todo o back-end gira em torno dos serviços providos pelo ecossistema do **Google Firebase**:
- **Banco de Dados (Cloud Firestore):** Banco puramente NoSQL, orientado a documentos. Utiliza sincronização *onSnapshot* para atualização multitelas em tempo real.
- **Autenticação (Firebase Auth):** Gestão de usuários, senhas e sessões de forma criptografada e segura, em conformidade sólida com normas ISO de proteção.
- **Hospedagem (Firebase Hosting):** Distribuição via CDN global com certificados SSL automáticos.

---

## 4. Segurança e Controle de Acesso Baseado em Perfis (RBAC)

Para atender a lei de sigilo médico (LGPD) e regras de compliance financeiro, a aplicação possui **9 camadas hierárquicas** rigorosamente controladas pelas *Firestore Security Rules* (lado do servidor) e pelo roteamento do React (lado do cliente). 

**Tabela de Permissões Básicas:**
1. **`admin` / `presidente`:** Acesso unificado a relatórios estratégicos globais; criação e remoção de outros perfis e delegação de cargos.
2. **`medico`:** Acesso exclusivo aos prontuários clínicos, prescrições e evolução continuada do paciente.
3. **`recepcao`:** Admissão e fila de cadastro basilar. 
4. **`triagem` / `enfermagem`:** Acesso a anamnese e inserção de dados de enfermagem.
5. **`farmacia`:** Liberação do estoque baseando-se em requisições médicas e movimentação interna.
6. **`financeiro`:** Restrito ao Livro Caixa, aprovações de notas fiscais e relatórios gerenciais monetários.
7. **`estoque`:** Restrito ao inventário não clínico e alimentos.
8. **`voluntario`:** Portal próprio focado em acompanhar as agendas logísticas e missões aprovadas para que ele participe.
9. **`operador`:** Perfil operacional para rodar apenas os caixas de PDV durante feiras e lojinhas.

---

## 5. Deployment e Manutenção Operacional

### Ambiente de Produção
- **URL Base:** `https://gestaoalsf.web.app`
- **Controle de Versão:** Todo o código é versionado utilizando `Git` e `GitHub`. O repositório atua como a única fonte de verdade para a equipe de tecnologia.

### Como a T.I. faz Atualizações (CI/CD Manual atual)
A integração de novos *features* ocorre majoritariamente com os seguintes comandos (já configurados via Node.js):
\`\`\`bash
# 1. Analisa e verifica integridade da tipagem TypeScript
npx tsc --noEmit

# 2. Embala a aplicação e minifica recursos estáticos
npm run build

# 3. Faz o push dos entregáveis para os edge-servers do Google
npx firebase-tools deploy --only hosting
\`\`\`

---

## 6. Evolução, Próximos Passos e Oportunidades (Roadmap)
Do ponto de vista técnico e corporativo, o sistema alcançou maturidade operacional (MVP Validado em Produção). Os próximos estágios envolveriam:

1. **Refatoração Interna da UI:** Fatiar as mais de 6.000 linhas do arquivo controlador primário (`index.tsx`) em pastas e micro-componentes sob a ótica da Arquitetura Limpa (S.O.L.I.D), visando que times com múltiplos desenvolvedores atuem organicamente no código sem gerar conflitos de branch.
2. **Inteligência Artificial (IA):** Consolidar endpoints via *Cloud Functions* utilizando bibliotecas Vertex AI (Gemini Flash) para relatórios preditivos descritivos ao invés de meros *dashboards* estáticos. (Ex: A IA prever surtos de falta de antitérmico com base em picos de agendamento em postos base).
3. **App Nativo e Offline-First Compartilhado:** Criar subaplicativos ou um front em *React Native* apenas para a gestão de ponto/entrada dos voluntários (bater ponto de localização via GPS ao chegar em missões isoladas e remotas).
4. **Logs Persistentes de Ação Sistêmica (Audit Trail):** Registrar não apenas quem modificou *X* registro, com qual valor e para quem, em tabelas puramente textuais espelhadas e prontas para auditorias legais rigorosas (Sistemas como o DataDog ou Cloud Logging).
