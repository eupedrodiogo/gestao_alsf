import React, { useState } from 'react';
import { PresentationSlides } from './PresentationSlides';
import { useFirestore } from '../api/useFirestore';
import { Item, Mission, Beneficiary, Attendance } from '../types/index';
import {
    LayoutDashboard,
    Database,
    RefreshCw,
    Trash2,
    CheckCircle,
    AlertTriangle,
    ShieldAlert
} from 'lucide-react';

const DEMO_ITEMS: Omit<Item, 'id'>[] = [
    { name: 'Cobertor Casal Microfibra', category: 'Outros', quantity: 150, unit: 'un', unitValue: 45.90 },
    { name: 'Cesta Básica Tipo A', category: 'Alimentos', quantity: 80, unit: 'un', unitValue: 120.00 },
    { name: 'Kit Higiene Pessoal', category: 'Outros', quantity: 200, unit: 'kit', unitValue: 25.50 },
    { name: 'Paracetamol 500mg (Cx 20cp)', category: 'Medicamentos', quantity: 500, unit: 'cx', unitValue: 8.50 },
    { name: 'Leite em Pó Integral 400g', category: 'Alimentos', quantity: 300, unit: 'lata', unitValue: 18.90 },
    { name: 'Fralda Geriátrica G', category: 'Outros', quantity: 120, unit: 'pct', unitValue: 35.00 },
    { name: 'Dipirona Sódica Gotas', category: 'Medicamentos', quantity: 150, unit: 'frasco', unitValue: 5.20 },
    { name: 'Bola de Futebol', category: 'Brinquedos', quantity: 40, unit: 'un', unitValue: 45.00 },
    { name: 'Boneca de Pano Artesanal', category: 'Brinquedos', quantity: 35, unit: 'un', unitValue: 30.00 },
    { name: 'Arroz Tipo 1 (5kg)', category: 'Alimentos', quantity: 200, unit: 'pct', unitValue: 28.00 },
];

const DEMO_BENEFICIARIES: Omit<Beneficiary, 'id'>[] = [
    { name: 'Maria da Silva', document: '123.456.789-00', needs: 'Diabética, precisa de insulina e dieta restrita.' },
    { name: 'José dos Santos', document: '987.654.321-11', needs: 'Desempregado, 3 filhos menores em idade escolar.' },
    { name: 'Ana Souza', document: '456.123.789-22', needs: 'Idosa, vive sozinha, mobilidade reduzida.' },
    { name: 'Carlos Oliveira', document: '321.654.987-33', needs: 'Morador de rua, precisa de kit higiene e roupas.' },
    { name: 'Fernanda Lima', document: '789.123.456-44', needs: 'Mãe solo, 2 filhos, precisa de leite e fraldas.' },
    { name: 'Roberto Almeida', document: '654.987.321-55', needs: 'Deficiente visual, precisa de apoio para locomoção.' },
    { name: 'Lucia Gomes', document: '159.753.852-66', needs: 'Hipertensa, remédios de uso contínuo.' },
    { name: 'Paulo Silva', document: '357.951.258-77', needs: 'Recém-saído do sistema prisional, busca recolocação.' },
    { name: 'Juliana Costa', document: '258.147.369-88', needs: 'Acamada, precisa de fraldas geriátricas.' },
    { name: 'Marcos Pereira', document: '951.357.258-99', needs: 'Família numerosa (8 pessoas), insegurança alimentar grave.' }
];

export const PresentationDashboard = () => {
    const { data: items, addItem: addItemFirestore, deleteItem: deleteItemFirestore } = useFirestore<Item>('items');
    const { data: missions, addItem: addMissionFirestore, deleteItem: deleteMissionFirestore } = useFirestore<Mission>('missions');
    const { data: beneficiaries, addItem: addBeneficiaryFirestore, deleteItem: deleteBeneficiaryFirestore } = useFirestore<Beneficiary>('beneficiaries');
    const { data: attendances, deleteItem: deleteAttendanceFirestore } = useFirestore<Attendance>('attendances');

    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [showSlides, setShowSlides] = useState(false);

    const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const handleClearDatabase = async () => {
        if (!window.confirm('ATENÇÃO: ISSO APAGARÁ TODOS OS DADOS DO SISTEMA. Tem certeza absoluta?')) return;

        setLoading(true);
        addLog('Iniciando limpeza do banco de dados...');

        try {
            await Promise.all(items.map(i => deleteItemFirestore(i.id)));
            addLog(`Estoque limpo: ${items.length} itens removidos.`);

            await Promise.all(missions.map(m => deleteMissionFirestore(m.id)));
            addLog(`Missões limpas: ${missions.length} missões removidas.`);

            await Promise.all(beneficiaries.map(b => deleteBeneficiaryFirestore(b.id)));
            addLog(`Beneficiários limpos: ${beneficiaries.length} pessoas removidas.`);

            await Promise.all(attendances.map(a => deleteAttendanceFirestore(a.id)));
            addLog(`Atendimentos limpos: ${attendances.length} registros removidos.`);

            addLog('Limpeza concluída com sucesso!');
        } catch (error) {
            console.error(error);
            addLog('Erro durante a limpeza. Verifique o console.');
        } finally {
            setLoading(false);
        }
    };

    const handleSeedData = async () => {
        setLoading(true);
        addLog('Iniciando carga de dados de demonstração...');

        try {
            // Seed Items
            const itemIds: string[] = [];
            for (const item of DEMO_ITEMS) {
                const id = await addItemFirestore(item);
                if (id) itemIds.push(id);
            }
            addLog(`${itemIds.length} Itens de estoque criados.`);

            // Seed Beneficiaries
            const beneficiaryIds: string[] = [];
            for (const beneficiary of DEMO_BENEFICIARIES) {
                const id = await addBeneficiaryFirestore(beneficiary);
                if (id) beneficiaryIds.push(id);
            }
            addLog(`${beneficiaryIds.length} Beneficiários criados.`);

            // Seed Missions (using real item IDs if available, otherwise random)
            // We need to fetch items again or assume the IDS we just created are valid. 
            // Since firestore updates might be async in reflection, let's create missions loosely.

            // Demo Missions have to be created manually or with slight delay to ensure IDs exist if we wanted precise linking.
            // For this quick demo seeder, we will create generic missions without allocations first, or use a placeholder logic.
            // To make it robust, let's just create missions with empty allocations or logical placeholders if we had time to map.
            // For now, let's CREATE 3 robust missions.

            const mission1 = await addMissionFirestore({
                title: 'Operação Inverno Solidário 2026',
                date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
                description: 'Distribuição massiva de cobertores e sopas para população de rua.',
                status: 'planned',
                allocatedItems: [] // Would need real IDs to be perfect, but empty is safe for demo start
            });

            const mission2 = await addMissionFirestore({
                title: 'Mutirão de Saúde na Comunidade Norte',
                date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
                description: 'Atendimento médico, odontológico e farmácia básica.',
                status: 'planned',
                allocatedItems: []
            });

            const mission3 = await addMissionFirestore({
                title: 'Natal das Crianças',
                date: new Date(new Date().setDate(new Date().getDate() + 60)).toISOString().split('T')[0],
                description: 'Festa com distribuição de brinquedos e kits escolares.',
                status: 'planned',
                allocatedItems: []
            });

            addLog('3 Missões estratégicas criadas.');
            addLog('Carga de dados concluída! O sistema está pronto para a apresentação.');

        } catch (error) {
            console.error(error);
            addLog('Erro ao criar dados. Verifique o console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
                        <LayoutDashboard className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                            Painel de Apresentação
                        </h1>
                        <p className="text-slate-400">Ambiente de Controle e Demonstração Executiva</p>
                    </div>
                </div>

                {/* Hero Action for Presentation */}
                <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-8 rounded-2xl border border-indigo-500/30 mb-12 flex items-center justify-between group hover:border-indigo-500/60 transition-all shadow-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Modo Apresentação</h2>
                        <p className="text-indigo-200 max-w-lg">
                            Inicie os slides executivos preparados para a diretoria. Use as setas do teclado para navegar.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowSlides(true)}
                        className="px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-indigo-500/50 flex items-center gap-3"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        INICIAR SLIDES
                    </button>
                </div>

                {showSlides && <PresentationSlides onClose={() => setShowSlides(false)} />}


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Data Injection Card */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-3 mb-4 text-emerald-400">
                            <Database className="w-6 h-6" />
                            <h2 className="text-xl font-bold">Injetar Dados de Demo</h2>
                        </div>
                        <p className="text-slate-400 text-sm mb-6">
                            Adiciona 10 itens de estoque variados, 10 beneficiários com perfis reais e 3 missões planejadas.
                            Ideal para popular o sistema antes de começar.
                        </p>
                        <button
                            onClick={handleSeedData}
                            disabled={loading}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            Injetar Dados de Demonstração
                        </button>
                    </div>

                    {/* Reset Card */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <ShieldAlert className="w-32 h-32" />
                        </div>
                        <div className="flex items-center gap-3 mb-4 text-rose-400">
                            <Trash2 className="w-6 h-6" />
                            <h2 className="text-xl font-bold">Resetar Tudo</h2>
                        </div>
                        <p className="text-slate-400 text-sm mb-6">
                            <strong className="text-rose-400">PERIGO:</strong> Apaga TODOS os itens, missões, beneficiários e atendimentos do banco de dados.
                            Use para limpar o ambiente após testes.
                        </p>
                        <button
                            onClick={handleClearDatabase}
                            disabled={loading}
                            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                            Apagar Banco de Dados
                        </button>
                    </div>
                </div>

                {/* Log Console */}
                <div className="bg-black/50 rounded-xl border border-slate-800 p-4 h-64 overflow-y-auto font-mono text-sm">
                    <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2">Log de Operações...</div>
                    {log.length === 0 && <span className="text-slate-600 italic">Nenhuma ação registrada ainda.</span>}
                    {log.map((entry, i) => (
                        <div key={i} className="text-slate-300 py-0.5">{entry}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};
