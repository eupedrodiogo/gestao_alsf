import React, { useState, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Users,
    Plus,
    LayoutGrid,
    List,
    ArrowRight
} from 'lucide-react';
import { Mission } from '../../types/index';

interface CalendarModuleProps {
    missions: Mission[];
    onMissionClick?: (mission: Mission) => void;
    onAddMission?: () => void;
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({
    missions,
    onMissionClick,
    onAddMission
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        const days = [];

        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                month: month - 1,
                year,
                isCurrentMonth: false,
                fullDate: new Date(year, month - 1, prevMonthDays - i).toLocaleDateString('en-CA')
            });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                month,
                year,
                isCurrentMonth: true,
                fullDate: new Date(year, month, i).toLocaleDateString('en-CA')
            });
        }

        const totalSlots = 42;
        const remainingSlots = totalSlots - days.length;
        for (let i = 1; i <= remainingSlots; i++) {
            days.push({
                day: i,
                month: month + 1,
                year,
                isCurrentMonth: false,
                fullDate: new Date(year, month + 1, i).toLocaleDateString('en-CA')
            });
        }

        return days;
    }, [currentDate]);

    const missionsByDate = useMemo(() => {
        const map: Record<string, Mission[]> = {};
        missions.forEach(m => {
            if (m.date) {
                if (!map[m.date]) map[m.date] = [];
                map[m.date].push(m);
            }
        });
        return map;
    }, [missions]);

    const todayStr = new Date().toLocaleDateString('en-CA');

    const renderGridView = () => (
        <div className="flex-1 flex flex-col bg-[#1a2c27] text-white">
            {/* Day Header */}
            <div className="grid grid-cols-7 border-b border-white/10">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                    <div key={idx} className="py-2 text-center">
                        <span className="text-xs font-medium text-white/80">{day}</span>
                    </div>
                ))}
            </div>

            {/* Grid Days */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-fr">
                {calendarData.map((cell, idx) => {
                    const dayMissions = missionsByDate[cell.fullDate] || [];
                    const isToday = cell.fullDate === todayStr;

                    return (
                        <div
                            key={idx}
                            className={`min-h-[50px] md:min-h-[100px] border-r border-b border-white/10 p-0.5 md:p-2 relative group transition-colors hover:bg-white/5 ${!cell.isCurrentMonth ? 'opacity-20' : ''}`}
                        >
                            <div className="flex justify-center mb-0">
                                <span className={`text-[9px] md:text-[11px] font-bold w-4 h-4 md:w-6 md:h-6 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-[#00d1c1] text-black shadow-[0_0_10px_rgba(0,209,193,0.5)]' : 'text-white'}`}>
                                    {cell.day}
                                </span>
                            </div>

                            <div className="space-y-1">
                                {dayMissions.slice(0, 3).map((m) => (
                                    <div
                                        key={m.id}
                                        onClick={() => onMissionClick?.(m)}
                                        className="text-[7px] md:text-[9px] px-1 md:px-1.5 py-0 md:py-0.5 bg-[#4ea8a0] text-white rounded-[2px] md:rounded font-medium truncate cursor-pointer hover:brightness-110 transition-all shadow-sm"
                                        title={m.title}
                                    >
                                        {m.title}
                                    </div>
                                ))}
                                {dayMissions.length > 3 && (
                                    <div className="text-[8px] font-bold text-[#00d1c1] pl-1">
                                        + {dayMissions.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderListView = () => (
        <div className="p-6 space-y-4 bg-[#1a2c27] min-h-full">
            {missions.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                    <p className="text-sm font-bold uppercase tracking-widest text-white">Nenhum evento agendado</p>
                </div>
            ) : (
                [...missions]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(m => (
                        <div
                            key={m.id}
                            onClick={() => onMissionClick?.(m)}
                            className="bg-[#243b35] p-5 rounded-2xl border border-white/10 hover:border-[#00d1c1]/50 transition-all cursor-pointer group flex items-center gap-4"
                        >
                            <div className="flex flex-col items-center justify-center p-3 bg-[#1a2c27] rounded-xl min-w-[60px] border border-white/5">
                                <span className="text-[10px] font-bold text-[#00d1c1] uppercase">{new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                <span className="text-xl font-black text-white leading-none mt-1">{new Date(m.date + 'T12:00:00').getDate()}</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white leading-tight group-hover:text-[#00d1c1] transition-colors">{m.title}</h4>
                                <div className="flex gap-3 mt-1.5 opacity-50">
                                    <div className="flex items-center gap-1 text-[10px] text-white">
                                        <Clock className="w-3 h-3" /> 09:00
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-white">
                                        <MapPin className="w-3 h-3" /> ALSF
                                    </div>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[#00d1c1] transition-all" />
                        </div>
                    ))
            )}
        </div>
    );

    return (
        <div className="bg-[#1a2c27] rounded-[32px] overflow-hidden shadow-2xl animate-fade-in flex flex-col h-full flex-1">
            {/* Custom Header from Screenshot */}
            <div className="p-4 md:p-6 pb-2">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-medium text-white tracking-tight">
                        {monthNames[currentDate.getMonth()]}
                    </h2>

                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="flex items-center gap-4 md:gap-8">
                            <button onClick={handlePrevMonth} className="text-white/80 hover:text-white transition-colors p-1">
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <button onClick={handleToday} className="text-[10px] font-bold text-[#00d1c1] uppercase tracking-widest px-2">Hoje</button>
                            <button onClick={handleNextMonth} className="text-white/80 hover:text-white transition-colors p-1">
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        <button
                            onClick={onAddMission}
                            className="w-10 h-10 md:w-12 md:h-12 bg-[#00d1c1] hover:bg-[#00b8a9] text-black rounded-[14px] md:rounded-[18px] flex items-center justify-center shadow-lg shadow-[#00d1c1]/20 transition-all active:scale-95"
                        >
                            <Plus className="w-6 h-6 md:w-7 md:h-7" />
                        </button>
                    </div>
                </div>

                {/* Switcher simplificado para não poluir o design do print */}
                <div className="flex gap-4 mb-4">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'text-[#00d1c1]' : 'text-white/40 hover:text-white/60'}`}
                    >
                        Mês Completo
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'text-[#00d1c1]' : 'text-white/40 hover:text-white/60'}`}
                    >
                        Agenda
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-x-auto custom-scrollbar">
                {viewMode === 'grid' ? (
                    <div className="w-full flex-1 flex flex-col">
                        {renderGridView()}
                    </div>
                ) : (
                    renderListView()
                )}
            </div>

            {/* Style for custom scrollbar hidden */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1a2c27;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #2a3c37;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};
