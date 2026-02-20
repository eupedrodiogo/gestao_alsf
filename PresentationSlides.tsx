import React, { useState, useEffect } from 'react';
import {
    ChevronRight,
    ChevronLeft,
    X,
    Package,
    MapPin,
    Users,
    Zap,
    CheckCircle2,
    BarChart3,
    TrendingUp,
    Shield,
    Clock,
    ArrowRight,
    Cpu,
    FileSearch,
    AlertTriangle,
    Target,
    Layers,
    Smartphone,
    BrainCircuit
} from 'lucide-react';

const SLIDES = [
    {
        id: 1,
        title: '',
        subtitle: '',
        content: (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-10">
                {/* Geometric accent */}
                <div className="relative">
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-2xl shadow-indigo-900/40 rotate-3">
                        <img
                            src="/logo alsf.webp"
                            alt="Lar São Francisco"
                            className="w-22 h-22 object-contain -rotate-3 rounded-lg"
                        />
                    </div>
                    <div className="absolute -z-10 -inset-3 bg-indigo-500/10 rounded-3xl blur-xl" />
                </div>
                <div className="space-y-4">
                    <h1 className="text-6xl font-extrabold text-white tracking-tight leading-tight">
                        Inovação & Governança
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full" />
                    <h2 className="text-2xl text-slate-400 font-light tracking-wide uppercase">
                        Sistema Integrado — Lar São Francisco
                    </h2>
                </div>
                <div className="mt-8 p-6 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/60 max-w-2xl">
                    <p className="text-lg text-slate-300 italic leading-relaxed">
                        "Transformando a dedicação dos voluntários em dados auditáveis e impacto mensurável."
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 2,
        title: 'O Cenário Atual',
        subtitle: 'Dores e Riscos Operacionais',
        content: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full">
                <div className="space-y-6">
                    {[
                        {
                            num: '01',
                            icon: <Layers className="w-5 h-5" />,
                            title: 'Descentralização',
                            desc: 'Informações espalhadas em planilhas ou conversas de WhatsApp.'
                        },
                        {
                            num: '02',
                            icon: <TrendingUp className="w-5 h-5" />,
                            title: 'Falta de Previsibilidade',
                            desc: 'Dificuldade crítica em prever custos de missões futuras.'
                        },
                        {
                            num: '03',
                            icon: <AlertTriangle className="w-5 h-5" />,
                            title: 'Risco de Ruptura',
                            desc: 'Gestão manual de estoque, com risco real de faltar itens críticos.'
                        }
                    ].map((item) => (
                        <div key={item.num} className="flex items-start gap-4 p-5 bg-rose-950/30 border border-rose-900/40 rounded-xl hover:border-rose-700/50 transition-colors">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rose-900/50 text-rose-400 flex items-center justify-center">
                                {item.icon}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-rose-500/70 font-mono text-xs">{item.num}</span>
                                    <h3 className="text-lg font-semibold text-rose-200">{item.title}</h3>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col items-center justify-center p-10 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl">
                    <div className="w-12 h-12 rounded-full bg-rose-900/30 text-rose-400 flex items-center justify-center mb-6">
                        <Target className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Consequência</h3>
                    <p className="text-lg text-center text-slate-300 leading-relaxed">
                        Sem dados centralizados, a gestão é{' '}
                        <span className="text-rose-400 font-semibold">reativa</span>, e não{' '}
                        <span className="text-emerald-400 font-semibold">proativa</span>.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 3,
        title: 'A Solução',
        subtitle: 'Ecossistema Integrado',
        content: (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                    {[
                        {
                            icon: <Package className="w-6 h-6" />,
                            color: 'indigo',
                            title: 'Recursos',
                            subtitle: 'Estoque',
                            desc: 'Controle financeiro e físico total com rastreabilidade.',
                            borderColor: 'border-indigo-500/30 hover:border-indigo-500/70',
                            iconBg: 'bg-indigo-600',
                            iconShadow: 'shadow-indigo-900/30'
                        },
                        {
                            icon: <MapPin className="w-6 h-6" />,
                            color: 'emerald',
                            title: 'Operação',
                            subtitle: 'Missões',
                            desc: 'Planejamento e execução de atividades em campo.',
                            borderColor: 'border-emerald-500/30 hover:border-emerald-500/70',
                            iconBg: 'bg-emerald-600',
                            iconShadow: 'shadow-emerald-900/30'
                        },
                        {
                            icon: <Users className="w-6 h-6" />,
                            color: 'violet',
                            title: 'Beneficiários',
                            subtitle: 'Pessoas',
                            desc: 'Histórico único de atendimento e demandas.',
                            borderColor: 'border-violet-500/30 hover:border-violet-500/70',
                            iconBg: 'bg-violet-600',
                            iconShadow: 'shadow-violet-900/30'
                        }
                    ].map((card) => (
                        <div
                            key={card.title}
                            className={`p-8 bg-slate-800/80 rounded-xl border ${card.borderColor} shadow-lg transition-all duration-300 group`}
                        >
                            <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center mb-5 shadow-lg ${card.iconShadow} group-hover:scale-110 transition-transform text-white`}>
                                {card.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{card.title}</h3>
                            <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">{card.subtitle}</p>
                            <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-12 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl px-8 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <p className="text-slate-300 font-medium text-sm">
                        Tudo integrado em tempo real: Saída de Estoque
                        <ArrowRight className="w-4 h-4 inline mx-2 text-slate-500" />
                        Custo da Missão
                        <ArrowRight className="w-4 h-4 inline mx-2 text-slate-500" />
                        Histórico do Beneficiário
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 4,
        title: 'Governança Financeira',
        subtitle: 'A Visão Executiva',
        content: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full">
                <div className="space-y-5">
                    {[
                        'Custo por Missão Automático',
                        'Valor em Estoque (KPI em Tempo Real)',
                        'Relatórios Auditáveis (CSV)'
                    ].map((text, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <p className="text-xl text-slate-200">{text}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-white p-6 rounded-xl shadow-2xl transform rotate-1">
                    {/* Mock chart visual */}
                    <div className="h-40 bg-slate-50 rounded-lg mb-4 flex items-end justify-between px-4 pb-2">
                        <div className="w-8 h-12 bg-emerald-400/40 rounded-t" />
                        <div className="w-8 h-24 bg-emerald-400/55 rounded-t" />
                        <div className="w-8 h-16 bg-emerald-400/65 rounded-t" />
                        <div className="w-8 h-32 bg-emerald-500 rounded-t shadow-lg" />
                        <div className="w-8 h-28 bg-emerald-400/75 rounded-t" />
                    </div>
                    <div className="flex justify-between text-slate-500 font-mono text-xs">
                        <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span>
                    </div>
                    <div className="mt-4 border-t pt-4 flex items-end justify-between">
                        <div>
                            <p className="text-slate-500 text-sm">Custo Previsto vs Realizado</p>
                            <h3 className="text-2xl font-bold text-slate-800">R$ 14.250,00</h3>
                        </div>
                        <BarChart3 className="w-6 h-6 text-emerald-500" />
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 5,
        title: 'Eficiência & Inovação',
        subtitle: 'Inteligência Artificial Integrada',
        content: (
            <div className="flex flex-col h-full justify-center">
                <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/60 p-10 rounded-2xl border border-indigo-500/30 shadow-2xl mb-8 relative overflow-hidden">
                    {/* Geometric bg accent */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Google Gemini 2.0 Flash</h2>
                            <p className="text-indigo-300/70 text-sm">Motor de Inteligência Artificial</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <ul className="space-y-4 text-indigo-100">
                            {[
                                { icon: <FileSearch className="w-4 h-4" />, text: 'Leitura automática de notas fiscais' },
                                { icon: <Shield className="w-4 h-4" />, text: 'Redução drástica de erro humano' },
                                { icon: <Zap className="w-4 h-4" />, text: 'Agilidade na entrada de mercadorias' }
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <span className="text-indigo-400/70">{item.icon}</span>
                                    <span className="text-[15px]">{item.text}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="bg-black/40 p-5 rounded-xl border border-white/5 font-mono text-sm text-emerald-400 leading-relaxed">
                            {`> Processando nota_fiscal.pdf... OK`}
                            <br />
                            {`> Item identificado: "Leite em Pó"`}
                            <br />
                            {`> Quantidade: 50 latas`}
                            <br />
                            {`> Confiança: 98.7%`}
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 6,
        title: 'Roadmap',
        subtitle: 'Visão Estratégica de Evolução',
        content: (
            <div className="flex flex-col h-full justify-center items-center">
                <div className="relative border-l-2 border-slate-700/80 pl-10 space-y-14 max-w-2xl">
                    {[
                        {
                            icon: <CheckCircle2 className="w-4 h-4" />,
                            color: 'emerald',
                            dotBg: 'bg-emerald-500',
                            textColor: 'text-emerald-400',
                            label: 'Hoje — v1.0',
                            desc: 'Gestão completa de Estoque, Missões e Beneficiários.'
                        },
                        {
                            icon: <Smartphone className="w-4 h-4" />,
                            color: 'blue',
                            dotBg: 'bg-blue-500',
                            textColor: 'text-blue-400',
                            label: 'Curto Prazo',
                            desc: 'App Mobile para voluntários (Check-in/Check-out).'
                        },
                        {
                            icon: <BrainCircuit className="w-4 h-4" />,
                            color: 'purple',
                            dotBg: 'bg-purple-500',
                            textColor: 'text-purple-400',
                            label: 'Médio Prazo',
                            desc: 'Dashboards Preditivos com IA (Previsão de Demanda).'
                        }
                    ].map((phase) => (
                        <div key={phase.label} className="relative">
                            <div className={`absolute -left-[2.85rem] top-0.5 w-7 h-7 ${phase.dotBg} rounded-full border-4 border-slate-950 flex items-center justify-center text-white`}>
                                {phase.icon}
                            </div>
                            <h3 className={`text-2xl font-bold ${phase.textColor}`}>{phase.label}</h3>
                            <p className="text-slate-400 mt-1 leading-relaxed">{phase.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        id: 7,
        title: 'Conclusão',
        content: (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-12">
                <h2 className="text-3xl text-white font-light tracking-wide">
                    O Sistema Lar São Francisco entrega:
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
                    {[
                        {
                            icon: <Shield className="w-7 h-7" />,
                            color: 'indigo',
                            borderColor: 'border-indigo-500',
                            iconColor: 'text-indigo-400',
                            title: 'Segurança',
                            desc: 'Para a Diretoria'
                        },
                        {
                            icon: <Zap className="w-7 h-7" />,
                            color: 'emerald',
                            borderColor: 'border-emerald-500',
                            iconColor: 'text-emerald-400',
                            title: 'Agilidade',
                            desc: 'Para a Operação'
                        },
                        {
                            icon: <Users className="w-7 h-7" />,
                            color: 'violet',
                            borderColor: 'border-violet-500',
                            iconColor: 'text-violet-400',
                            title: 'Dignidade',
                            desc: 'Para os Beneficiários'
                        }
                    ].map((card) => (
                        <div key={card.title} className={`p-8 bg-slate-800/80 rounded-xl border-t-4 ${card.borderColor} hover:shadow-lg transition-shadow`}>
                            <div className={`${card.iconColor} mb-4 flex justify-center`}>{card.icon}</div>
                            <h3 className="text-2xl font-bold text-white mb-2">{card.title}</h3>
                            <p className="text-slate-400">{card.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="max-w-2xl mt-4">
                    <div className="w-16 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mb-6 rounded-full" />
                    <p className="text-xl text-slate-300 italic leading-relaxed">
                        "Escalando o impacto social com responsabilidade fiscal e excelência operacional."
                    </p>
                </div>
            </div>
        )
    }
];

export const PresentationSlides = ({ onClose }: { onClose: () => void }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, SLIDES.length - 1));
    const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const slide = SLIDES[currentSlide];

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden">
            {/* Subtle background grain */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80" />

            {/* Header / Controls */}
            <div className="absolute top-0 w-full p-5 flex justify-between items-center z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="text-slate-500 text-xs font-mono tracking-wider">
                    {String(currentSlide + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Slide Content Area */}
            <div className="w-full max-w-7xl h-full p-12 md:p-24 flex flex-col relative z-10">
                <div className="flex-1 flex flex-col">
                    {slide.title && (
                        <div className="mb-10 pb-6 border-b border-slate-800/80">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-1 tracking-tight">{slide.title}</h1>
                            {slide.subtitle && (
                                <h2 className="text-xl text-indigo-400/80 font-light tracking-wide">{slide.subtitle}</h2>
                            )}
                        </div>
                    )}
                    <div className="flex-1 text-slate-200">
                        {slide.content}
                    </div>
                </div>
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className={`absolute left-6 p-3 rounded-full bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/30 transition-all ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : ''}`}
            >
                <ChevronLeft className="w-6 h-6 text-slate-400 hover:text-white" />
            </button>
            <button
                onClick={nextSlide}
                className={`absolute right-6 p-3 rounded-full bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/30 transition-all ${currentSlide === SLIDES.length - 1 ? 'opacity-0 pointer-events-none' : ''}`}
            >
                <ChevronRight className="w-6 h-6 text-slate-400 hover:text-white" />
            </button>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-800">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 transition-all duration-500 ease-out"
                    style={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
                />
            </div>
        </div>
    );
};
