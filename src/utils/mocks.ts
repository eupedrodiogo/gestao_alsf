import { Item, Beneficiary, Mission, Attendance, Transaction } from '../types/index';

export const INITIAL_ITEMS: Item[] = [
    // Farmácia (Medicamentos)
    { id: '1', name: 'Paracetamol 500mg', category: 'Medicamentos', quantity: 500, unit: 'cx', unitValue: 5.50 },
    { id: '5', name: 'Dipirona Gotas', category: 'Medicamentos', quantity: 300, unit: 'frasco', unitValue: 4.20 },
    { id: '7', name: 'Amoxicilina 500mg', category: 'Medicamentos', quantity: 200, unit: 'cx', unitValue: 12.00 },
    { id: '8', name: 'Ibuprofeno 600mg', category: 'Medicamentos', quantity: 400, unit: 'cx', unitValue: 8.50 },
    { id: '9', name: 'Soro Fisiológico 0.9%', category: 'Medicamentos', quantity: 100, unit: 'frasco', unitValue: 6.00 },

    // Brinquedoteca (Brinquedos)
    { id: '2', name: 'Boneca de Pano', category: 'Brinquedos', quantity: 120, unit: 'un', unitValue: 15.00 },
    { id: '4', name: 'Carrinho de Plástico', category: 'Brinquedos', quantity: 200, unit: 'un', unitValue: 8.90 },
    { id: '10', name: 'Bola de Futebol', category: 'Brinquedos', quantity: 50, unit: 'un', unitValue: 25.00 },
    { id: '11', name: 'Jogo de Tabuleiro', category: 'Brinquedos', quantity: 30, unit: 'un', unitValue: 35.00 },
    { id: '12', name: 'Kit de Colorir', category: 'Brinquedos', quantity: 100, unit: 'kit', unitValue: 12.00 },

    // Nutrição (Alimentos)
    { id: '3', name: 'Cesta Básica Tipo A', category: 'Alimentos', quantity: 45, unit: 'un', unitValue: 85.00 },
    { id: '13', name: 'Leite em Pó 400g', category: 'Alimentos', quantity: 200, unit: 'lata', unitValue: 18.00 },
    { id: '14', name: 'Arroz 5kg', category: 'Alimentos', quantity: 100, unit: 'pct', unitValue: 22.00 },
    { id: '15', name: 'Feijão 1kg', category: 'Alimentos', quantity: 150, unit: 'pct', unitValue: 8.00 },
    { id: '16', name: 'Macarrão 500g', category: 'Alimentos', quantity: 300, unit: 'pct', unitValue: 4.50 },

    // Outros
    { id: '6', name: 'Kit Higiene', category: 'Outros', quantity: 150, unit: 'kit', unitValue: 12.50 },
];

export const INITIAL_BENEFICIARIES: Beneficiary[] = [
    { id: 'b1', name: 'Maria da Silva', document: '123.456.789-00', needs: 'Diabética, precisa de insulina' },
    { id: 'b2', name: 'José Santos', document: '987.654.321-99', needs: 'Desempregado, 3 filhos' },
    { id: 'b3', name: 'Ana Oliveira', document: '456.123.789-11', needs: 'Idosa, vive sozinha' },
];

export const INITIAL_MISSIONS: Mission[] = [
    {
        id: 'm1',
        title: 'Ação Comunidade Esperança',
        date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
        description: 'Distribuição de alimentos e recreação infantil.',
        status: 'planned',
        allocatedItems: [
            { itemId: '3', quantity: 20 },
            { itemId: '2', quantity: 30 },
            { itemId: '4', quantity: 30 }
        ]
    },
    {
        id: 'm2',
        title: 'Saúde para Todos',
        date: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString().split('T')[0],
        description: 'Atendimento médico básico e farmácia solidária.',
        status: 'planned',
        allocatedItems: [
            { itemId: '1', quantity: 100 },
            { itemId: '5', quantity: 50 }
        ]
    }
];

export const INITIAL_ATTENDANCES: Attendance[] = [
    {
        id: 'a1',
        date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
        locationType: 'Presídio',
        locationName: 'Complexo Penitenciário Norte',
        description: 'Entrega de kits de higiene e atendimento espiritual.',
        peopleServed: 150,
        status: 'Completed',
        responsible: 'Frei João',
        beneficiaryIds: ['b2'] // Example link
    },
    {
        id: 'a2',
        date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
        locationType: 'Praça',
        locationName: 'Praça da Sé',
        description: 'Sopa solidária noturna.',
        peopleServed: 80,
        status: 'Scheduled',
        responsible: 'Maria Voluntária',
        beneficiaryIds: []
    },
    {
        id: 'a3',
        date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0],
        locationType: 'Comunidade',
        locationName: 'Vila Esperança',
        description: 'Recreação e lanche para crianças.',
        peopleServed: 200,
        status: 'Completed',
        responsible: 'Carlos Educador',
        beneficiaryIds: ['b1', 'b3']
    }
];

export const MOCK_MONTHLY_STATS = [
    { month: 'Jan', input: 12500, output: 8900 },
    { month: 'Fev', input: 15000, output: 12000 },
    { month: 'Mar', input: 9800, output: 11500 },
    { month: 'Abr', input: 18000, output: 14200 },
    { month: 'Mai', input: 22000, output: 19000 },
    { month: 'Jun', input: 20000, output: 18500 },
];

export const MOCK_DEMAND_STATS = [
    { month: 'Jan', demand: 450, consumption: 410 },
    { month: 'Fev', demand: 520, consumption: 480 },
    { month: 'Mar', demand: 380, consumption: 380 },
    { month: 'Abr', demand: 600, consumption: 550 },
    { month: 'Mai', demand: 750, consumption: 700 },
    { month: 'Jun', demand: 800, consumption: 780 },
];

export const MOCK_PEOPLE_COST_STATS = [
    { month: 'Jan', people: 450, cost: 4500 },
    { month: 'Fev', people: 520, cost: 5800 },
    { month: 'Mar', people: 380, cost: 3900 },
    { month: 'Abr', people: 600, cost: 6200 },
    { month: 'Mai', people: 750, cost: 8100 },
    { month: 'Jun', people: 800, cost: 7500 },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: 'mock1',
        description: 'Doação Anônima',
        amount: 5000,
        type: 'income',
        category: 'Doação',
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        paymentMethod: 'pix',
        person: 'Doador Anônimo',
        docUrl: 'https://example.com/comprovante.pdf'
    },
    {
        id: 'mock2',
        description: 'Compra de Medicamentos',
        amount: 1250.50,
        type: 'expense',
        category: 'Medicamentos',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        status: 'paid',
        paymentMethod: 'card',
        person: 'Farmácia Central',
        missionId: 'm1'
    },
    {
        id: 'mock3',
        description: 'Venda de Artesanato',
        amount: 350.00,
        type: 'income',
        category: 'Venda',
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        status: 'paid',
        paymentMethod: 'cash',
        person: 'Feira Local',
        missionId: 'm2'
    },
    {
        id: 'mock4',
        description: 'Conta de Energia',
        amount: 890.00,
        type: 'expense',
        category: 'Contas',
        date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
        status: 'pending',
        paymentMethod: 'pix',
        person: 'CEMIG'
    },
    {
        id: 'mock5',
        description: 'Compra de Alimentos',
        amount: 2500.00,
        type: 'expense',
        category: 'Alimentação',
        date: new Date(Date.now() - 432000000).toISOString().split('T')[0],
        status: 'paid',
        paymentMethod: 'transfer',
        person: 'Supermercado Atacadista',
        missionId: 'm1'
    }
];
