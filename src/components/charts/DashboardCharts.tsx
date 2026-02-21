import React from 'react';
import {
    MOCK_MONTHLY_STATS,
    MOCK_DEMAND_STATS,
    MOCK_PEOPLE_COST_STATS
} from '../../mocks';

export const SimpleBarChart = ({ data }: { data: typeof MOCK_MONTHLY_STATS }) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.input, d.output))) * 1.1;

    return (
        <div className="flex items-end justify-between h-64 gap-2 w-full pt-8 pb-2 overflow-x-auto min-w-[300px]">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center justify-end gap-2 flex-1 h-full group relative cursor-default min-w-[40px]">
                    {/* Shared Summary Tooltip */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl min-w-[120px]">
                        <div className="font-bold text-slate-300 mb-1 border-b border-slate-700 pb-1 text-center">{d.month}</div>
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <span className="flex items-center gap-1 text-slate-300">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                                Entrada
                            </span>
                            <span className="font-medium">R$ {d.input.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1 text-slate-300">
                                <div className="w-1.5 h-1.5 bg-rose-400 rounded-full"></div>
                                Saída
                            </span>
                            <span className="font-medium">R$ {d.output.toLocaleString('pt-BR')}</span>
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                    </div>

                    <div className="flex gap-2 w-full justify-center items-end flex-1 px-1 hover:bg-slate-50/50 rounded-lg transition-colors">
                        {/* Input Bar */}
                        <div className="relative w-3 h-full flex items-end">
                            <div
                                className="w-full bg-emerald-400 rounded-t-sm transition-all group-hover:bg-emerald-500"
                                style={{ height: `${(d.input / maxVal) * 100}%` }}
                            ></div>
                        </div>

                        {/* Output Bar */}
                        <div className="relative w-3 h-full flex items-end">
                            <div
                                className="w-full bg-rose-400 rounded-t-sm transition-all group-hover:bg-rose-500"
                                style={{ height: `${(d.output / maxVal) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium group-hover:text-slate-800">{d.month}</span>
                </div>
            ))}
        </div>
    );
};

export const DemandBarChart = ({ data }: { data: typeof MOCK_DEMAND_STATS }) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.demand, d.consumption))) * 1.1;

    return (
        <div className="flex items-end justify-between h-64 gap-2 w-full pt-8 pb-2 overflow-x-auto min-w-[300px]">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center justify-end gap-2 flex-1 h-full group relative cursor-default min-w-[40px]">
                    {/* Tooltip */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl min-w-[120px]">
                        <div className="font-bold text-slate-300 mb-1 border-b border-slate-700 pb-1 text-center">{d.month}</div>
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <span className="flex items-center gap-1 text-slate-300">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                Demanda
                            </span>
                            <span className="font-medium">{d.demand} itens</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1 text-slate-300">
                                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                                Consumo
                            </span>
                            <span className="font-medium">{d.consumption} itens</span>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                    </div>

                    <div className="flex gap-2 w-full justify-center items-end flex-1 px-1 hover:bg-slate-50/50 rounded-lg transition-colors">
                        {/* Demand Bar */}
                        <div className="relative w-3 h-full flex items-end">
                            <div
                                className="w-full bg-blue-400 rounded-t-sm transition-all group-hover:bg-blue-500"
                                style={{ height: `${(d.demand / maxVal) * 100}%` }}
                            ></div>
                        </div>
                        {/* Consumption Bar */}
                        <div className="relative w-3 h-full flex items-end">
                            <div
                                className="w-full bg-amber-400 rounded-t-sm transition-all group-hover:bg-amber-500"
                                style={{ height: `${(d.consumption / maxVal) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium group-hover:text-slate-800">{d.month}</span>
                </div>
            ))}
        </div>
    );
};

export const PeopleCostChart = ({ data }: { data: typeof MOCK_PEOPLE_COST_STATS }) => {
    // Normalize separately since People count and Money have very different scales
    const maxPeople = Math.max(...data.map(d => d.people)) * 1.1;
    const maxCost = Math.max(...data.map(d => d.cost)) * 1.1;

    return (
        <div className="flex items-end justify-between h-64 gap-2 w-full pt-8 pb-2 overflow-x-auto min-w-[300px]">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center justify-end gap-2 flex-1 h-full group relative cursor-default min-w-[40px]">
                    {/* Tooltip */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl min-w-[120px]">
                        <div className="font-bold text-slate-300 mb-1 border-b border-slate-700 pb-1 text-center">{d.month}</div>
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <span className="flex items-center gap-1 text-slate-300">
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                Pessoas
                            </span>
                            <span className="font-medium">{d.people}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1 text-slate-300">
                                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full"></div>
                                Custo
                            </span>
                            <span className="font-medium">R$ {d.cost.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                    </div>

                    <div className="flex gap-2 w-full justify-center items-end flex-1 px-1 hover:bg-slate-50/50 rounded-lg transition-colors">
                        {/* People Bar */}
                        <div className="relative w-3 h-full flex items-end">
                            <div
                                className="w-full bg-indigo-400 rounded-t-sm transition-all group-hover:bg-indigo-500"
                                style={{ height: `${(d.people / maxPeople) * 100}%` }}
                            ></div>
                        </div>
                        {/* Cost Bar */}
                        <div className="relative w-3 h-full flex items-end">
                            <div
                                className="w-full bg-teal-400 rounded-t-sm transition-all group-hover:bg-teal-500"
                                style={{ height: `${(d.cost / maxCost) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium group-hover:text-slate-800">{d.month}</span>
                </div>
            ))}
        </div>
    );
};
