import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore } from './useFirestore';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { StockMovementModal } from './StockMovementModal';
import { PresentationDashboard } from './PresentationDashboard';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import SetupAdmin from './SetupAdmin';
import { MissionModePanel } from './MissionModePanel';
import { MissionControl } from './MissionControl';
import { PresidentDashboard } from './PresidentDashboard';
import { isOfflineModeEnabled } from './offlineMode';
import {
  Calendar as CalendarIcon,
  Package,
  Bell,
  Plus,
  Trash2,
  Edit,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Stethoscope,
  MessageCircle,
  Mail,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  X,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  Menu,
  ClipboardList,
  MapPinned,
  UserCheck,
  UserPlus,
  FileText,
  PieChart,
  Wallet,
  LogOut,
  Heart,
  Phone,
  Store,
  CreditCard,
  Banknote,
  ShieldCheck,
  HandCoins,
  LayoutDashboard,
  Megaphone,
  Briefcase,
  Activity,
  Pill,
  Camera,
  Settings,
  Check,
  ShoppingCart,
  Minus,
  Printer,
  History
} from 'lucide-react';

import { VolunteerModal } from './VolunteerModal';
import { FinancialModal } from './FinancialModal';

// --- Types ---

import { Category, LocationType, Item, AllocatedItem, Mission, Beneficiary, Attendance, NotificationLog, Volunteer, PatientVisit, Transaction } from './types';

// --- Mock Data ---

const INITIAL_ITEMS: Item[] = [
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

const INITIAL_BENEFICIARIES: Beneficiary[] = [
  { id: 'b1', name: 'Maria da Silva', document: '123.456.789-00', needs: 'Diabética, precisa de insulina' },
  { id: 'b2', name: 'José Santos', document: '987.654.321-99', needs: 'Desempregado, 3 filhos' },
  { id: 'b3', name: 'Ana Oliveira', document: '456.123.789-11', needs: 'Idosa, vive sozinha' },
];

const INITIAL_MISSIONS: Mission[] = [
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

const INITIAL_ATTENDANCES: Attendance[] = [
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

const MOCK_MONTHLY_STATS = [
  { month: 'Jan', input: 12500, output: 8900 },
  { month: 'Fev', input: 15000, output: 12000 },
  { month: 'Mar', input: 9800, output: 11500 },
  { month: 'Abr', input: 18000, output: 14200 },
  { month: 'Mai', input: 22000, output: 19000 },
  { month: 'Jun', input: 20000, output: 18500 },
];

const MOCK_DEMAND_STATS = [
  { month: 'Jan', demand: 450, consumption: 410 },
  { month: 'Fev', demand: 520, consumption: 480 },
  { month: 'Mar', demand: 380, consumption: 380 },
  { month: 'Abr', demand: 600, consumption: 550 },
  { month: 'Mai', demand: 750, consumption: 700 },
  { month: 'Jun', demand: 800, consumption: 780 },
];

const MOCK_PEOPLE_COST_STATS = [
  { month: 'Jan', people: 450, cost: 4500 },
  { month: 'Fev', people: 520, cost: 5800 },
  { month: 'Mar', people: 380, cost: 3900 },
  { month: 'Abr', people: 600, cost: 6200 },
  { month: 'Mai', people: 750, cost: 8100 },
  { month: 'Jun', people: 800, cost: 7500 },
];

const MOCK_TRANSACTIONS: Transaction[] = [
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

// --- Helper Functions ---

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatCompactNumber = (number: number) => {
  return new Intl.NumberFormat('pt-BR', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(number);
};

const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;

  // Create CSV content
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle strings with commas or newlines
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Components ---

const SimpleBarChart = ({ data }: { data: typeof MOCK_MONTHLY_STATS }) => {
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

const DemandBarChart = ({ data }: { data: typeof MOCK_DEMAND_STATS }) => {
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

const PeopleCostChart = ({ data }: { data: typeof MOCK_PEOPLE_COST_STATS }) => {
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

// --- Custom Toast Component ---
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) => (
  <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none items-end">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className={`
          pointer-events-auto flex items-start gap-4 p-4 pl-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border w-[380px] animate-slide-in-right transition-all duration-300 transform hover:-translate-x-1
          ${toast.type === 'success' ? 'bg-white/95 border-emerald-100/50 backdrop-blur-xl' :
            toast.type === 'error' ? 'bg-white/95 border-rose-100/50 backdrop-blur-xl' :
              toast.type === 'warning' ? 'bg-white/95 border-amber-100/50 backdrop-blur-xl' :
                'bg-white/95 border-blue-100/50 backdrop-blur-xl'}
        `}
      >
        <div className={`
          p-2.5 rounded-xl shrink-0 shadow-sm
          ${toast.type === 'success' ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600' :
            toast.type === 'error' ? 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600' :
              toast.type === 'warning' ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600' :
                'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600'}
        `}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
          {toast.type === 'info' && <Bell className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="font-bold text-sm text-slate-800 leading-tight mb-1">{toast.message}</h4>
          {toast.description && <p className="text-xs text-slate-500 leading-snug font-medium">{toast.description}</p>}
        </div>
        <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100/50 rounded-lg transition-colors -mr-2 -mt-2">
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

// --- Main App Component ---

const App = () => {
  // HIDDEN PRESENTATION MODE CHECK
  // Robust check for both standard and encoded URLs
  const search = window.location.search;
  const isPresentationMode = search.includes('mode=presentation') || search.includes('mode%3Dpresentation');

  // MISSION CONTROL DASHBOARD (For Coordinator)
  if (window.location.pathname === '/mission-control') {
    return <MissionControl />;
  }



  const { user, loading, logout } = useAuth();
  console.log('Current user:', user); // DEBUG: Check user role

  // --- Role-based access control ---
  // ------ Painel Presidencial: desvio antecipado ------
  if (user?.role === 'presidente') {
    return <PresidentDashboard />;
  }

  const ROLE_TABS: Record<string, string[]> = {
    admin: ['dashboard', 'reception', 'triage', 'consultation', 'pharmacy', 'volunteers', 'events', 'beneficiaries', 'inventory', 'financial', 'approvals', 'fundraising', 'pos', 'calendar', 'notifications', 'users'],
    operador: ['dashboard', 'reception', 'triage', 'consultation', 'pharmacy', 'volunteers', 'events', 'beneficiaries', 'inventory', 'financial', 'approvals', 'fundraising', 'pos', 'calendar', 'notifications'],
    recepcao: ['reception'],
    triagem: ['triage'],
    medico: ['consultation'],
    farmacia: ['pharmacy'],
    enfermeiro: ['triage', 'consultation'],
    dentista: ['consultation'],
    fisioterapeuta: ['consultation'],
    psicologo: ['consultation'],
    voluntario: ['volunteers'],
    estoque: ['inventory'],
    financeiro: ['financial', 'fundraising'],
    arrecadacao: ['fundraising'],
  };

  const DEFAULT_TAB: Record<string, string> = {
    admin: 'dashboard',
    operador: 'dashboard',
    recepcao: 'reception',
    triagem: 'triage',
    medico: 'consultation',
    farmacia: 'pharmacy',
    enfermeiro: 'triage',
    dentista: 'consultation',
    fisioterapeuta: 'consultation',
    psicologo: 'consultation',
    voluntario: 'volunteers',
    estoque: 'inventory',
    financeiro: 'financial',
    arrecadacao: 'fundraising',
  };

  const allowedTabs = ROLE_TABS[user?.role || ''] || ['dashboard'];
  const defaultTab = DEFAULT_TAB[user?.role || ''] || 'dashboard';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'reception' | 'triage' | 'consultation' | 'pharmacy' | 'volunteers' | 'events' | 'beneficiaries' | 'inventory' | 'financial' | 'approvals' | 'fundraising' | 'pos' | 'calendar' | 'notifications' | 'users'>(() => {
    // Read saved tab from localStorage without role validation here,
    // because user?.role is still undefined at initialization time.
    // Role validation happens in the useEffect below once auth resolves.
    const savedTab = localStorage.getItem('activeTab');
    return (savedTab as any) || 'dashboard';
  });

  // When user role resolves, redirect to allowed tab if the saved one is not permitted
  useEffect(() => {
    if (user?.role) {
      const currentAllowed = ROLE_TABS[user.role] || ['dashboard'];
      const currentDefault = DEFAULT_TAB[user.role] || 'dashboard';
      if (!currentAllowed.includes(activeTab)) {
        setActiveTab(currentDefault as any);
      }
    }
  }, [user?.role]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // --- Firestore Integration ---
  const { data: items, addItem: addItemFirestore, updateItem: updateItemFirestore, deleteItem: deleteItemFirestore } = useFirestore<Item>('items');
  const { data: missions, addItem: addMissionFirestore, updateItem: updateMissionFirestore, deleteItem: deleteMissionFirestore } = useFirestore<Mission>('missions');
  const { data: attendances, addItem: addAttendanceFirestore, updateItem: updateAttendanceFirestore, deleteItem: deleteAttendanceFirestore } = useFirestore<Attendance>('attendances');
  const { data: beneficiaries, addItem: addBeneficiaryFirestore, updateItem: updateBeneficiaryFirestore, deleteItem: deleteBeneficiaryFirestore } = useFirestore<Beneficiary>('beneficiaries');
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const { data: notifications, addItem: addNotificationFirestore, updateItem: updateNotificationFirestore } = useFirestore<NotificationLog>('notifications');
  const { data: volunteers, addItem: addVolunteerFirestore, updateItem: updateVolunteerFirestore, deleteItem: deleteVolunteerFirestore } = useFirestore<Volunteer>('volunteers');
  const { data: patientVisits, addItem: addPatientVisitFirestore, updateItem: updatePatientVisitFirestore } = useFirestore<PatientVisit>('patient_visits');
  const { data: transactions, addItem: addTransactionFirestore, updateItem: updateTransactionFirestore, deleteItem: deleteTransactionFirestore } = useFirestore<Transaction>('transactions');

  // Financial State
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({ type: 'expense', date: new Date().toISOString().split('T')[0], status: 'pending', paymentMethod: 'pix' });
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');

  // PDV (POS) State
  const [cart, setCart] = useState<{ item: Item; quantity: number }[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [posCategory, setPosCategory] = useState<'all' | Category>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [posMode, setPosMode] = useState<'sales' | 'reports'>('sales');
  const [posDiscount, setPosDiscount] = useState(0); // Optional discount in percentage
  const [showReceipt, setShowReceipt] = useState<{ items: any[], total: number, method: string } | null>(null);
  const [posReportDate, setPosReportDate] = useState<string>(new Date().toISOString().split('T')[0]);


  // Sort notifications by date (newest first) locally since Firestore order requires composite index sometimes
  const sortedNotifications = useMemo(() => {
    if (!notifications) return [];
    return [...notifications].sort((a, b) => {
      const getTime = (ts: any) => {
        if (!ts) return 0;
        if (ts instanceof Date) return ts.getTime();
        if (ts.seconds) return ts.seconds * 1000;
        const d = new Date(ts);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      return getTime(b.timestamp) - getTime(a.timestamp);
    });
  }, [notifications]);

  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'users') {
      const fetchUsers = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, 'users'));
          const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAppUsers(usersList);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchUsers();
    }
  }, [user, activeTab]);

  // Modals state - MUST be declared before any conditional returns
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isBeneficiaryModalOpen, setIsBeneficiaryModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isMissionPanelOpen, setIsMissionPanelOpen] = useState(false);
  const offlineModeActive = isOfflineModeEnabled();
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<PatientVisit | null>(null);
  const [triageForm, setTriageForm] = useState({ weight: '', bloodPressure: '', temperature: '', symptoms: '', notes: '', nurseName: '' });
  const [consultationForm, setConsultationForm] = useState<{ diagnosis: string; prescription: string; internalNotes: string; selectedMedications: string[] }>({ diagnosis: '', prescription: '', internalNotes: '', selectedMedications: [] });
  const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);
  const [pharmacyForm, setPharmacyForm] = useState<{ dispensedItems: { itemId: string; name: string; quantity: number }[], notes: string }>({ dispensedItems: [], notes: '' });

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info', description?: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, message, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);

  // Inventory Tab State
  const [inventoryTab, setInventoryTab] = useState<'all' | 'Medicamentos' | 'Brinquedos' | 'Alimentos' | 'Outros'>('all');

  // UI States for Beneficiaries
  const [beneficiarySearchTerm, setBeneficiarySearchTerm] = useState('');
  const [receptionSearchTerm, setReceptionSearchTerm] = useState('');
  const [volunteerSearchTerm, setVolunteerSearchTerm] = useState('');

  // Attendance Modal UI State
  const [attendanceModalTab, setAttendanceModalTab] = useState<'details' | 'people'>('details');
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [newPersonForm, setNewPersonForm] = useState<Partial<Beneficiary>>({});

  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  // Filter & Sort States
  const [missionFilterStatus, setMissionFilterStatus] = useState<'all' | 'planned' | 'completed' | 'cancelled'>('all');
  const [missionFilterStartDate, setMissionFilterStartDate] = useState<string>('');
  const [missionFilterEndDate, setMissionFilterEndDate] = useState<string>('');
  const [missionSortBy, setMissionSortBy] = useState<'date' | 'title'>('date');
  const [missionSortOrder, setMissionSortOrder] = useState<'asc' | 'desc'>('asc');
  const [missionSearch, setMissionSearch] = useState<string>('');
  const [missionViewMode, setMissionViewMode] = useState<'grid' | 'list'>('grid');
  const [missionFilterPeriod, setMissionFilterPeriod] = useState<'all' | 'upcoming' | 'thismonth' | 'past'>('all');
  const [missionFiltersOpen, setMissionFiltersOpen] = useState<boolean>(false);

  // Mission Modal Tab State
  const [missionModalTab, setMissionModalTab] = useState<'info' | 'rh' | 'resources' | 'finance' | 'enrollment' | 'report'>('info');

  const [attendanceFilterType, setAttendanceFilterType] = useState<LocationType | 'all'>('all');

  // Form states
  const [newItem, setNewItem] = useState<Partial<Item>>({ category: 'Outros' });
  const [newMission, setNewMission] = useState<Partial<Mission>>({ status: 'planned', allocatedItems: [] });
  const [newAttendance, setNewAttendance] = useState<Partial<Attendance>>({
    status: 'Scheduled',
    locationType: 'Outros',
    beneficiaryIds: []
  });
  const [itemErrors, setItemErrors] = useState<{ [key: string]: string }>({});

  // --- Derived Stats (useMemo must be before conditional returns) ---
  const totalStockValue = useMemo(() => (items || []).reduce((acc, i) => acc + ((i.quantity || 0) * (i.unitValue || 0)), 0), [items]);

  // --- Conditional returns AFTER all hooks ---
  if (isPresentationMode) {
    return <PresentationDashboard />;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  if (!user) return <Login />;

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setAppUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  // Notification Logic
  // Notification Logic
  const addNotification = async (type: 'WHATSAPP' | 'EMAIL', recipient: 'Coordenador' | 'Financeiro' | 'Voluntários', msg: string) => {
    await addNotificationFirestore({
      type,
      recipient,
      message: msg,
      timestamp: new Date(),
      read: false
    });
  };

  const handleStockUpdate = async (item: Item, qtyChange: number, isEntry: boolean) => {
    if (item.id) {
      await updateItemFirestore(item.id, { quantity: item.quantity + qtyChange });

      const action = isEntry ? 'Entrada' : 'Saída';
      const totalValue = Math.abs(qtyChange) * item.unitValue;

      // Simulate external notifications
      addNotification('WHATSAPP', 'Coordenador', `${action} de estoque: ${Math.abs(qtyChange)} ${item.unit} de ${item.name}.`);
      addNotification('EMAIL', 'Financeiro', `Registro de ${action}: ${item.name}. Valor total: ${formatCurrency(totalValue)}.`);
    }
  };

  const handleStockMovementConfirm = async (item: Item, quantity: number, isEntry: boolean, fileUrl?: string, fileName?: string) => {
    const qtyChange = isEntry ? quantity : -quantity;

    // Validate stock for exit
    if (!isEntry && (item.quantity + qtyChange < 0)) {
      showToast("Estoque insuficiente", "error", "Quantidade não disponível.");
      return;
    }

    if (item.id) {
      await updateItemFirestore(item.id, { quantity: item.quantity + qtyChange });

      const action = isEntry ? 'Entrada (NF)' : 'Saída (Requisição)';
      const totalValue = Math.abs(qtyChange) * item.unitValue;

      let msg = `${action}: ${Math.abs(qtyChange)} ${item.unit} de ${item.name}.`;
      if (fileName) msg += ` Comprovante: ${fileName}`;

      // Notifications
      addNotification('WHATSAPP', 'Coordenador', msg);
      addNotification('EMAIL', 'Financeiro', `Registro de ${action}: ${item.name}. Valor total: ${formatCurrency(totalValue)}.${fileUrl ? ` Link do documento: ${fileUrl}` : ''}`);
    }
  };

  const handleSaveItem = async () => {
    // Validation
    const errors: { [key: string]: string } = {};
    if (!newItem.name?.trim()) errors.name = 'O nome do material é obrigatório.';
    if (!newItem.unit?.trim()) errors.unit = 'A unidade de medida é obrigatória.';
    if (newItem.quantity === undefined || newItem.quantity < 0) errors.quantity = 'A quantidade não pode ser negativa.';
    if (newItem.unitValue === undefined || newItem.unitValue <= 0) errors.unitValue = 'O valor unitário deve ser maior que zero.';

    if (Object.keys(errors).length > 0) {
      setItemErrors(errors);
      return;
    }

    if (editingItem) {
      await updateItemFirestore(editingItem.id, newItem as Item);
      addNotification('EMAIL', 'Coordenador', `Item atualizado: ${newItem.name}`);
    } else {
      await addItemFirestore({
        name: newItem.name!,
        category: newItem.category || 'Outros',
        quantity: newItem.quantity || 0,
        unit: newItem.unit || 'un',
        unitValue: newItem.unitValue || 0,
      });
      addNotification('EMAIL', 'Coordenador', `Novo item cadastrado: ${newItem.name}`);
    }
    setIsItemModalOpen(false);
    setNewItem({ category: 'Outros' });
    setEditingItem(null);
    setItemErrors({});
  };

  const handleSaveMission = async () => {
    if (!newMission.title || !newMission.date) return;

    // Calculate total cost for notification
    const totalCost = (newMission.allocatedItems || []).reduce((acc, alloc) => {
      const item = items.find(i => i.id === alloc.itemId);
      return acc + (alloc.quantity * (item?.unitValue || 0));
    }, 0);

    if (editingMission) {
      // Update existing mission
      await updateMissionFirestore(editingMission.id, newMission as Mission);

      addNotification('WHATSAPP', 'Voluntários', `Missão atualizada: ${newMission.title}. Data: ${new Date(newMission.date! + 'T12:00:00').toLocaleDateString('pt-BR')}.`);
      addNotification('EMAIL', 'Financeiro', `Atualização de custos para missão "${newMission.title}": Novo total previsto ${formatCurrency(totalCost)}`);
    } else {
      // Create new mission
      await addMissionFirestore({
        title: newMission.title!,
        date: newMission.date!,
        time: (newMission as any).time || '',
        description: newMission.description || '',
        status: 'planned',
        allocatedItems: newMission.allocatedItems || []
      });

      addNotification('WHATSAPP', 'Voluntários', `Nova missão agendada: ${newMission.title} para ${new Date(newMission.date! + 'T12:00:00').toLocaleDateString('pt-BR')}.`);
      addNotification('EMAIL', 'Financeiro', `Previsão de custo para missão "${newMission.title}": ${formatCurrency(totalCost)}`);
    }

    setIsMissionModalOpen(false);
    setNewMission({ status: 'planned', allocatedItems: [] });
    setEditingMission(null);
  };

  const handleSaveAttendance = async () => {
    if (!newAttendance.locationName || !newAttendance.date) return;

    // Auto-update count if beneficiary list is used
    const finalCount = (newAttendance.beneficiaryIds?.length || 0) > 0
      ? newAttendance.beneficiaryIds!.length
      : (newAttendance.peopleServed || 0);

    const attendanceData = {
      ...newAttendance,
      peopleServed: finalCount
    };

    if (editingAttendance) {
      await updateAttendanceFirestore(editingAttendance.id, attendanceData as Attendance);
    } else {
      await addAttendanceFirestore({
        date: attendanceData.date!,
        locationType: attendanceData.locationType || 'Outros',
        locationName: attendanceData.locationName!,
        description: attendanceData.description || '',
        peopleServed: finalCount,
        status: attendanceData.status || 'Scheduled',
        responsible: attendanceData.responsible || 'Equipe',
        beneficiaryIds: attendanceData.beneficiaryIds || []
      });
      addNotification('WHATSAPP', 'Voluntários', `Novo atendimento registrado: ${attendanceData.locationType} - ${attendanceData.locationName}`);
    }
    setIsAttendanceModalOpen(false);
    setNewAttendance({ status: 'Scheduled', locationType: 'Outros', beneficiaryIds: [] });
    setEditingAttendance(null);
  };

  const handleSaveTransaction = async (transactionData: Omit<Transaction, 'id'>, file?: File | null) => {
    try {
      let docUrl = transactionData.docUrl;

      if (file) {
        const storageRef = ref(storage, `transactions/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        docUrl = await getDownloadURL(snapshot.ref);
      }

      const dataToSave = { ...transactionData, docUrl };

      if (newTransaction.id) {
        await updateTransactionFirestore(newTransaction.id, dataToSave);
        showToast('Transação atualizada com sucesso', 'success');
      } else {
        await addTransactionFirestore(dataToSave);
        showToast('Transação registrada com sucesso', 'success');
      }
      setIsFinancialModalOpen(false);
      setNewTransaction({});
    } catch (error) {
      console.error("Error saving transaction:", error);
      showToast('Erro ao salvar transação', 'error');
    }
  };

  const createBeneficiary = async () => {
    if (!newPersonForm.name) return;

    // Create new beneficiary and get ID
    const newId = await addBeneficiaryFirestore({
      name: newPersonForm.name,
      document: newPersonForm.document || '',
      needs: newPersonForm.needs || ''
    });

    setNewPersonForm({});

    // If we are within the attendance modal, add it there too
    if (isAttendanceModalOpen && newId) {
      setNewAttendance((prev) => ({
        ...prev,
        beneficiaryIds: [...(prev.beneficiaryIds || []), newId]
      }));
    }
  };

  const handleSaveMainBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    // Legacy document field, now optional or derived
    const document = formData.get('cpf') as string || formData.get('rg') as string || formData.get('document') as string;
    const needs = formData.get('needs') as string;
    const biologicalSex = formData.get('biologicalSex') as any;
    const color = formData.get('color') as any;
    const birthDate = formData.get('birthDate') as string;
    const age = Number(formData.get('age'));
    const cpf = formData.get('cpf') as string;
    const rg = formData.get('rg') as string;
    // Use state if available, otherwise form fallback
    const photoUrl = uploadedPhotoUrl || (formData.get('photoUrl') as string);

    if (!name.trim()) {
      alert('Por favor, preencha o nome do beneficiário.');
      return;
    }

    const beneficiaryData = {
      name,
      document: document || '',
      needs: needs || '',
      biologicalSex: biologicalSex || '',
      color: color || '',
      birthDate: birthDate || '',
      age: age || 0,
      cpf: cpf || '',
      rg: rg || '',
      photoUrl: photoUrl || ''
    };

    try {
      if (editingBeneficiary) {
        await updateBeneficiaryFirestore(editingBeneficiary.id, beneficiaryData);
      } else {
        await addBeneficiaryFirestore(beneficiaryData);
      }

      setIsBeneficiaryModalOpen(false);
      setEditingBeneficiary(null);
      setUploadedPhotoUrl(null); // Reset upload state
    } catch (error) {
      console.error('Erro ao salvar beneficiário:', error);
      alert('Erro ao salvar o cadastro. Verifique sua conexão e tente novamente.');
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `beneficiaries/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setUploadedPhotoUrl(url);
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteBeneficiary = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      await deleteBeneficiaryFirestore(id);
    }
  };

  const handleSaveVolunteer = async (volunteerData: Omit<Volunteer, 'id'>) => {
    try {
      if (editingVolunteer) {
        await updateVolunteerFirestore(editingVolunteer.id, volunteerData);
        await addNotification('WHATSAPP', 'Coordenador', `Voluntário atualizado: ${volunteerData.name}`);
      } else {
        await addVolunteerFirestore(volunteerData);
        await addNotification('WHATSAPP', 'Coordenador', `Novo voluntário: ${volunteerData.name}`);
      }
      setIsVolunteerModalOpen(false);
      setEditingVolunteer(null);
    } catch (error) {
      console.error("Error saving volunteer:", error);
      alert('Erro ao salvar voluntário.');
    }
  };

  const handleDeleteVolunteer = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este voluntário?')) {
      try {
        await deleteVolunteerFirestore(id);
      } catch (error) {
        console.error("Error deleting volunteer:", error);
      }
    }
  };

  // --- Derived Stats ---
  const activeMissionsCount = (missions || []).filter(m => m.status === 'planned').length;
  const lowStockItems = (items || []).filter(i => (i.quantity || 0) < 50).length;

  const handleTabChange = (tab: typeof activeTab) => {
    // Only allow switching to tabs the user has access to
    if (!allowedTabs.includes(tab)) return;
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close sidebar on mobile when navigating
  };

  // --- Views ---

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {(user?.role === 'admin' || user?.role === 'operador') && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Valor em Estoque</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalStockValue)}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +12% vs mês anterior
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Missões Planejadas</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeMissionsCount}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            Próxima em 5 dias
          </div>
        </div>

        {(user?.role === 'admin' || user?.role === 'operador') && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Pessoas Cadastradas</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{(beneficiaries || []).length}</h3>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-indigo-600 font-medium">
              Base de dados unificada
            </div>
          </div>
        )}

        {user?.role === 'admin' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Notificações</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{(notifications || []).filter(n => !n.read).length}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Última há 2h via WhatsApp
            </div>
          </div>
        )}
      </div>

      {/* Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {(user?.role === 'admin' || user?.role === 'operador') ? (
            <>
              {/* Financial Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                  <h3 className="text-lg font-bold text-slate-800">Evolução Financeira</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center text-xs text-slate-500">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full mr-2"></div>
                      Entradas
                    </div>
                    <div className="flex items-center text-xs text-slate-500">
                      <div className="w-3 h-3 bg-rose-400 rounded-full mr-2"></div>
                      Saídas
                    </div>
                    <button
                      onClick={() => {
                        const data = MOCK_MONTHLY_STATS.map(m => ({
                          Mes: m.month,
                          Entrada: m.input,
                          Saida: m.output
                        }));
                        exportToCSV(data, 'relatorio_financeiro_mensal');
                      }}
                      className="ml-0 sm:ml-2 flex items-center gap-1 text-blue-600 text-xs hover:bg-blue-50 px-2 py-1 rounded"
                    >
                      <Download className="w-3 h-3" /> CSV
                    </button>
                  </div>
                </div>
                <SimpleBarChart data={MOCK_MONTHLY_STATS} />
              </div>

              {/* Combined Charts Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Demand vs Consumption Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="flex flex-col justify-between items-start mb-6 gap-2">
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        Demanda vs Consumo
                      </h3>
                      <button
                        onClick={() => {
                          const data = MOCK_DEMAND_STATS.map(m => ({
                            Mes: m.month,
                            Demanda: m.demand,
                            Consumo: m.consumption
                          }));
                          exportToCSV(data, 'relatorio_demanda_consumo');
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center text-xs text-slate-500">
                        <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                        Demanda
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <div className="w-3 h-3 bg-amber-400 rounded-full mr-2"></div>
                        Consumo
                      </div>
                    </div>
                  </div>
                  <DemandBarChart data={MOCK_DEMAND_STATS} />
                </div>

                {/* People vs Cost Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="flex flex-col justify-between items-start mb-6 gap-2">
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        Pessoas vs Custo
                      </h3>
                      <button
                        onClick={() => {
                          const data = MOCK_PEOPLE_COST_STATS.map(m => ({
                            Mes: m.month,
                            Pessoas: m.people,
                            Custo: m.cost
                          }));
                          exportToCSV(data, 'relatorio_pessoas_custo');
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center text-xs text-slate-500">
                        <div className="w-3 h-3 bg-indigo-400 rounded-full mr-2"></div>
                        Pessoas
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <div className="w-3 h-3 bg-teal-400 rounded-full mr-2"></div>
                        Custo
                      </div>
                    </div>
                  </div>
                  <PeopleCostChart data={MOCK_PEOPLE_COST_STATS} />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col items-center justify-center text-center">
              <img src="/logo%20fraternidade%20alsf.png" alt="Logo Lar São Francisco na Providência de Deus" className="w-24 h-24 object-contain mb-6 drop-shadow-sm" />
              <h3 className="text-lg font-bold text-slate-800">Bem-vindo ao Lar São Francisco na Providência de Deus</h3>
              <p className="text-slate-500 mt-2 max-w-md">
                Obrigado por sua dedicação e serviço. Utilize o painel lateral para acessar suas tarefas e missões.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Próximas Missões</h3>
          <div className="space-y-4">
            {missions.filter(m => m.status === 'planned').slice(0, 3).map(mission => (
              <div key={mission.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-700 truncate mr-2">{mission.title}</h4>
                  <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500 shrink-0">
                    {new Date(mission.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <Users className="w-3 h-3" />
                  {mission.allocatedItems.length} recursos alocados
                </div>
                {(user?.role === 'admin' || user?.role === 'operador') && (
                  <div className="text-xs font-medium text-emerald-600">
                    Custo Previsto: {formatCurrency(mission.allocatedItems.reduce((acc, itemAlloc) => {
                      const item = items.find(i => i.id === itemAlloc.itemId);
                      return acc + (itemAlloc.quantity * (item?.unitValue || 0));
                    }, 0))}
                  </div>
                )}
              </div>
            ))}
            {missions.length === 0 && <p className="text-sm text-slate-400">Nenhuma missão planejada.</p>}
          </div>
          <button
            onClick={() => handleTabChange('missions')}
            className="w-full mt-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
          >
            Ver todas
          </button>
        </div>
      </div>
    </div>
  );

  const renderAttendances = () => {
    const filteredAttendances = (attendances || []).filter(a => {
      if (attendanceFilterType !== 'all' && a.locationType !== attendanceFilterType) return false;
      return true;
    });

    const totalPeopleServed = (attendances || []).reduce((acc, curr) => acc + (curr.peopleServed || 0), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pessoas Atendidas</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalPeopleServed}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <UserCheck className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Ações Realizadas</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{attendances.filter(a => a.status === 'Completed').length}</h3>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg">
              <MapPinned className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
            Gestão de Atendimentos
          </h2>
          {(user?.role === 'admin' || user?.role === 'operador') && (
            <button
              onClick={() => {
                setEditingAttendance(null);
                setNewAttendance({ status: 'Scheduled', locationType: 'Outros', beneficiaryIds: [] });
                setAttendanceModalTab('details');
                setIsAttendanceModalOpen(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" /> Registrar Atendimento
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filtrar Local:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'Presídio', 'Comunidade', 'Praça', 'Outros'] as const).map(type => (
              <button
                key={type}
                onClick={() => setAttendanceFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${attendanceFilterType === type
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
              >
                {type === 'all' ? 'Todos' : type}
              </button>
            ))}
          </div>

          {(user?.role === 'admin' || user?.role === 'operador') && (
            <button
              onClick={() => {
                const data = filteredAttendances.map(a => ({
                  Data: new Date(a.date + 'T12:00:00').toLocaleDateString('pt-BR'),
                  Local: a.locationName,
                  Tipo: a.locationType,
                  Status: a.status === 'Completed' ? 'Realizado' : 'Agendado',
                  Pessoas_Atendidas: a.peopleServed,
                  Responsavel: a.responsible
                }));
                exportToCSV(data, 'relatorio_atendimentos');
              }}
              className="ml-auto w-full sm:w-auto justify-center bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors text-sm"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAttendances.map(attendance => (
            <div key={attendance.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border ${attendance.locationType === 'Presídio' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                  attendance.locationType === 'Comunidade' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                    attendance.locationType === 'Praça' ? 'bg-green-50 text-green-600 border-green-200' :
                      'bg-blue-50 text-blue-600 border-blue-200'
                  }`}>
                  {attendance.locationType}
                </span>
                {(user?.role === 'admin' || user?.role === 'operador') && (
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingAttendance(attendance);
                      setNewAttendance({ ...attendance });
                      setAttendanceModalTab('details');
                      setIsAttendanceModalOpen(true);
                    }} className="text-slate-400 hover:text-blue-500">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-slate-800 text-lg mb-1">{attendance.locationName}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <CalendarIcon className="w-3 h-3" />
                {new Date(attendance.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                <span>Resp: {attendance.responsible}</span>
              </div>

              <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px]">{attendance.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Users className="w-4 h-4 text-slate-400" />
                  {attendance.peopleServed} <span className="text-xs font-normal text-slate-500">pessoas</span>
                </div>
                <span className={`text-xs font-medium flex items-center gap-1 ${attendance.status === 'Completed' ? 'text-emerald-600' :
                  attendance.status === 'Cancelled' ? 'text-red-500' :
                    'text-amber-500'
                  }`}>
                  {attendance.status === 'Completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {attendance.status === 'Completed' ? 'Realizado' : attendance.status === 'Cancelled' ? 'Cancelado' : 'Agendado'}
                </span>
              </div>

              {attendance.beneficiaryIds && attendance.beneficiaryIds.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {attendance.beneficiaryIds.length} nomes registrados na lista
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInventory = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 self-start md:self-center">
          <Package className="w-5 h-5" />
          Gestão de Estoque
        </h2>
        {(user?.role === 'admin' || user?.role === 'operador') && (
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                const data = (items || []).map(i => ({
                  Nome: i.name,
                  Categoria: i.category,
                  Quantidade: i.quantity || 0,
                  Unidade: i.unit,
                  Valor_Unitario: i.unitValue || 0,
                  Valor_Total: (i.quantity || 0) * (i.unitValue || 0)
                }));
                exportToCSV(data, 'relatorio_estoque');
              }}
              className="justify-center bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
            <button
              onClick={() => setIsStockModalOpen(true)}
              className="justify-center bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors"
            >
              <TrendingUp className="w-4 h-4" /> Movimentar
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setNewItem({ category: 'Outros' });
                setItemErrors({});
                setIsItemModalOpen(true);
              }}
              className="justify-center bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Novo Item
            </button>
          </div>
        )}
      </div>

      {/* Categories Tabs */}
      <div className="px-6 border-b border-slate-100 flex gap-6 overflow-x-auto">
        {(['all', 'Medicamentos', 'Brinquedos', 'Alimentos', 'Outros'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setInventoryTab(cat)}
            className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${inventoryTab === cat
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
              }`}
          >
            {cat === 'all' ? 'Todos' :
              cat === 'Medicamentos' ? 'Farmácia' :
                cat === 'Brinquedos' ? 'Brinquedoteca' :
                  cat === 'Alimentos' ? 'Nutrição' : cat}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Item</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Qtd. Atual</th>
              <th className="px-6 py-4">Valor Un.</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.filter(i => inventoryTab === 'all' || i.category === inventoryTab).map(item => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.category === 'Medicamentos' ? 'bg-red-100 text-red-700' :
                    item.category === 'Alimentos' ? 'bg-amber-100 text-amber-700' :
                      item.category === 'Brinquedos' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                    }`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <span className={item.quantity < 50 ? 'text-rose-600 font-bold' : ''}>
                    {item.quantity} {item.unit}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{formatCurrency(item.unitValue || 0)}</td>
                <td className="px-6 py-4 font-medium text-slate-800">{formatCurrency((item.quantity || 0) * (item.unitValue || 0))}</td>
                <td className="px-6 py-4">
                  {(user?.role === 'admin' || user?.role === 'operador') && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleStockUpdate(item, 10, true)}
                        title="Entrada Rápida (+10)"
                        className="p-1 hover:bg-emerald-100 text-emerald-600 rounded"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStockUpdate(item, -10, false)}
                        title="Saída Rápida (-10)"
                        className="p-1 hover:bg-rose-100 text-rose-600 rounded"
                      >
                        <TrendingDown className="w-4 h-4" />
                      </button>
                      <div className="h-4 w-px bg-slate-200 mx-1" />
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setNewItem(item);
                          setItemErrors({});
                          setIsItemModalOpen(true);
                        }}
                        className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {items.filter(i => inventoryTab === 'all' || i.category === inventoryTab).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">Nenhum item encontrado nesta categoria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMissions = () => {
    // ── Apply filters & sort ──────────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // String "YYYY-MM-DD" no fuso local — comparação direta sem aritmética de ms
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const filtered = (missions || []).filter(m => {
      const mDate = new Date(m.date + 'T12:00:00');

      // Search
      const q = missionSearch.toLowerCase();
      if (q && !m.title.toLowerCase().includes(q) && !(m.description || '').toLowerCase().includes(q)) return false;

      // Status
      if (missionFilterStatus !== 'all' && m.status !== missionFilterStatus) return false;

      // Period
      if (missionFilterPeriod === 'upcoming' && mDate < today) return false;
      if (missionFilterPeriod === 'past' && mDate >= today) return false;
      if (missionFilterPeriod === 'thismonth' && (mDate < thisMonthStart || mDate > thisMonthEnd)) return false;

      // Date range
      if (missionFilterStartDate && m.date < missionFilterStartDate) return false;
      if (missionFilterEndDate && m.date > missionFilterEndDate) return false;

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (missionSortBy === 'date') cmp = a.date.localeCompare(b.date);
      if (missionSortBy === 'title') cmp = a.title.localeCompare(b.title, 'pt-BR');
      return missionSortOrder === 'asc' ? cmp : -cmp;
    });

    // ── Summary counts ─────────────────────────────────────────────────────
    const totalAll = (missions || []).length;
    const totalPlanned = (missions || []).filter(m => m.status === 'planned').length;
    const totalDone = (missions || []).filter(m => m.status === 'completed').length;
    const totalUpcoming = (missions || []).filter(m => m.date >= todayStr).length;

    // ── Card renderer ──────────────────────────────────────────────────────
    const MissionCard: React.FC<{ mission: Mission }> = ({ mission }) => {
      const isPast = mission.date < todayStr;
      return (
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all ${missionViewMode === 'list' ? 'flex' : ''} ${isPast && mission.status !== 'completed' ? 'border-slate-200 opacity-75' : 'border-slate-100'}`}>
          <div className={`${missionViewMode === 'list' ? 'w-2 h-auto shrink-0' : 'h-2 w-full'} ${mission.status === 'completed' ? 'bg-emerald-500' : isPast ? 'bg-slate-300' : 'bg-blue-500'}`} />
          <div className={`p-5 flex-1 ${missionViewMode === 'list' ? 'flex gap-4 items-start' : ''}`}>
            {/* Header */}
            <div className={`flex justify-between items-start mb-3 ${missionViewMode === 'list' ? 'flex-1' : ''}`}>
              <div className="flex-1 min-w-0 mr-3">
                <h3 className="text-base font-bold text-slate-800 mb-0.5 truncate">{mission.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                  <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{new Date(mission.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  {mission.time && (
                    <span className="flex items-center gap-1 text-slate-600 font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {mission.time}h
                    </span>
                  )}
                  {!isPast && mission.status === 'planned' && (() => {
                    const isToday = mission.date === todayStr;
                    const mDateOnly = new Date(mission.date + 'T00:00:00');
                    const diffDays = Math.round((mDateOnly.getTime() - today.getTime()) / 86400000);
                    return (
                      <span className={`ml-1 font-semibold ${isToday ? 'text-orange-500' : 'text-blue-500'}`}>
                        &bull; {isToday ? '🔔 Hoje!' : `Em ${diffDays} dia(s)`}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${mission.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : isPast ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                {mission.status === 'completed' ? '✓ Realizada' : isPast ? 'Passada' : 'Planejada'}
              </span>
            </div>

            {/* Description */}
            <p className="text-slate-500 text-xs mb-4 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 italic line-clamp-2">
              "{mission.description || 'Sem descrição.'}"
            </p>

            {/* Resources */}
            {missionViewMode === 'grid' && (
              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Recursos ({mission.allocatedItems?.length || 0})
                </h4>
                {(!mission.allocatedItems || mission.allocatedItems.length === 0) ? (
                  <p className="text-xs text-slate-300 italic">Nenhum recurso alocado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {mission.allocatedItems.slice(0, 3).map((alloc, idx) => {
                      const item = items.find(i => i.id === alloc.itemId);
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 rounded border border-slate-100">
                          <span className="font-medium text-slate-600 truncate mr-2 flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item?.category === 'Alimentos' ? 'bg-amber-400' : item?.category === 'Brinquedos' ? 'bg-purple-400' : item?.category === 'Medicamentos' ? 'bg-red-400' : 'bg-slate-400'}`} />
                            {item?.name || 'Item desconhecido'}
                          </span>
                          <span className="font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] shrink-0">{alloc.quantity} {item?.unit}</span>
                        </div>
                      );
                    })}
                    {(mission.allocatedItems?.length || 0) > 3 && (
                      <p className="text-[10px] text-slate-400 italic text-right">+{(mission.allocatedItems?.length || 0) - 3} item(s) a mais</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {(user?.role === 'admin' || user?.role === 'operador') && (
              <div className={`${missionViewMode === 'grid' ? 'mt-3 pt-3 border-t border-slate-100' : 'mt-0 ml-auto shrink-0'} flex justify-end`}>
                <button
                  onClick={() => { setEditingMission(mission); setNewMission(mission); setMissionModalTab('info'); setIsMissionModalOpen(true); }}
                  className="text-xs text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" /> Gerenciar
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              Gestão de Missões e Eventos
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {totalAll} missão(ões) no total · {totalUpcoming} próxima(s)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <button
              onClick={() => window.open('/mission-control', '_blank')}
              className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors w-full sm:w-auto text-sm font-semibold shadow-sm"
              title="Acessar o Monitor de Telemetria e Operações em Tempo Real"
            >
              <Activity className="w-4 h-4 text-emerald-400" /> Monitorar Telemetria
            </button>
            {(user?.role === 'admin' || user?.role === 'operador') && (
              <button
                onClick={() => { setEditingMission(null); setNewMission({ title: '', status: 'planned', allocatedItems: [] }); setMissionModalTab('info'); setIsMissionModalOpen(true); }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center text-sm font-semibold"
              >
                <Plus className="w-4 h-4" /> Nova Missão
              </button>
            )}
          </div>
        </div>

        {/* ── KPI Strip ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: totalAll, color: 'bg-slate-50 border-slate-200', text: 'text-slate-700' },
            { label: 'Próximas', value: totalUpcoming, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
            { label: 'Planejadas', value: totalPlanned, color: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
            { label: 'Realizadas', value: totalDone, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
          ].map(kpi => (
            <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.color}`}>
              <p className={`text-2xl font-extrabold ${kpi.text}`}>{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── Search + Filters ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 space-y-3">

          {/* Always-visible row: search + view toggle + filter toggle button */}
          <div className="flex gap-2 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={missionSearch}
                onChange={e => setMissionSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
              {missionSearch && (
                <button onClick={() => setMissionSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
              )}
            </div>

            {/* View mode toggle — always visible */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setMissionViewMode('grid')}
                title="Grade"
                className={`px-2.5 py-2 text-sm transition-colors ${missionViewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
              >⊞</button>
              <button
                onClick={() => setMissionViewMode('list')}
                title="Lista"
                className={`px-2.5 py-2 text-sm transition-colors ${missionViewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
              >☰</button>
            </div>

            {/* Filter toggle button (mobile-first, hidden on lg+) */}
            {(() => {
              const activeCount = [
                missionFilterStatus !== 'all',
                missionFilterPeriod !== 'all',
                !!missionFilterStartDate,
                !!missionFilterEndDate,
                missionSortBy !== 'date' || missionSortOrder !== 'asc',
              ].filter(Boolean).length;
              return (
                <button
                  onClick={() => setMissionFiltersOpen(o => !o)}
                  className={`lg:hidden shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${activeCount > 0
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : missionFiltersOpen
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                  Filtros
                  {activeCount > 0 && (
                    <span className="bg-white text-indigo-700 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">{activeCount}</span>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 transition-transform ${missionFiltersOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              );
            })()}
          </div>

          {/* Collapsible filter panel: hidden on mobile unless toggled; always visible on lg+ */}
          <div className={`space-y-3 ${missionFiltersOpen ? 'block' : 'hidden'} lg:block`}>

            {/* Status + Period + Sort in one responsive row */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Status pills */}
              <div className="flex gap-1 flex-wrap">
                {(['all', 'planned', 'completed'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setMissionFilterStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${missionFilterStatus === s
                      ? s === 'completed' ? 'bg-emerald-500 text-white border-emerald-500'
                        : s === 'planned' ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {s === 'all' ? 'Todas' : s === 'planned' ? 'Planejadas' : 'Realizadas'}
                  </button>
                ))}
              </div>

              <div className="w-px h-5 bg-slate-200" />

              {/* Period pills */}
              <div className="flex gap-1 flex-wrap">
                {([
                  { key: 'all', label: 'Qualquer data' },
                  { key: 'upcoming', label: 'Próximas' },
                  { key: 'thismonth', label: 'Este mês' },
                  { key: 'past', label: 'Passadas' },
                ] as const).map(p => (
                  <button
                    key={p.key}
                    onClick={() => setMissionFilterPeriod(p.key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${missionFilterPeriod === p.key
                      ? 'bg-violet-500 text-white border-violet-500'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Sort (pushed right on desktop) */}
              <div className="sm:ml-auto">
                <select
                  value={`${missionSortBy}-${missionSortOrder}`}
                  onChange={e => {
                    const [by, order] = e.target.value.split('-') as ['date' | 'title', 'asc' | 'desc'];
                    setMissionSortBy(by);
                    setMissionSortOrder(order);
                  }}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full sm:w-auto"
                >
                  <option value="date-asc">Data ↑ (Antiga)</option>
                  <option value="date-desc">Data ↓ (Recente)</option>
                  <option value="title-asc">Título A–Z</option>
                  <option value="title-desc">Título Z–A</option>
                </select>
              </div>
            </div>

            {/* Date range */}
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-xs text-slate-400">Período personalizado:</span>
              <input type="date" value={missionFilterStartDate} onChange={e => setMissionFilterStartDate(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
              <span className="text-xs text-slate-400">até</span>
              <input type="date" value={missionFilterEndDate} onChange={e => setMissionFilterEndDate(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
              {(missionFilterStartDate || missionFilterEndDate) && (
                <button onClick={() => { setMissionFilterStartDate(''); setMissionFilterEndDate(''); }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold">Limpar</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Results count ──────────────────────────────────────────────── */}
        {(missionSearch || missionFilterStatus !== 'all' || missionFilterPeriod !== 'all' || missionFilterStartDate || missionFilterEndDate) && (
          <p className="text-sm text-slate-500">
            {sorted.length === 0 ? 'Nenhuma missão encontrada' : `${sorted.length} missão(ões) encontrada(s)`}
            {' '}
            <button onClick={() => { setMissionSearch(''); setMissionFilterStatus('all'); setMissionFilterPeriod('all'); setMissionFilterStartDate(''); setMissionFilterEndDate(''); }}
              className="text-indigo-500 hover:text-indigo-700 font-semibold ml-1">Limpar filtros</button>
          </p>
        )}

        {/* ── Mission list/grid ──────────────────────────────────────────── */}
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <CalendarIcon className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-slate-500 mb-1">Nenhuma missão encontrada</p>
            <p className="text-sm">Tente ajustar os filtros ou crie uma nova missão.</p>
            {(user?.role === 'admin' || user?.role === 'operador') && (
              <button onClick={() => { setEditingMission(null); setNewMission({ title: '', status: 'planned', allocatedItems: [] }); setMissionModalTab('info'); setIsMissionModalOpen(true); }}
                className="mt-4 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                + Nova Missão
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Upcoming section */}
            {sorted.filter(m => new Date(m.date + 'T12:00:00') >= today).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  Próximas / Em andamento ({sorted.filter(m => new Date(m.date + 'T12:00:00') >= today).length})
                </h3>
                <div className={missionViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
                  {sorted.filter(m => new Date(m.date + 'T12:00:00') >= today).map(m => <MissionCard key={m.id} mission={m} />)}
                </div>
              </div>
            )}

            {/* Past section */}
            {sorted.filter(m => new Date(m.date + 'T12:00:00') < today).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                  Histórico / Realizadas ({sorted.filter(m => new Date(m.date + 'T12:00:00') < today).length})
                </h3>
                <div className={missionViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
                  {sorted.filter(m => new Date(m.date + 'T12:00:00') < today).map(m => <MissionCard key={m.id} mission={m} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };



  const renderBeneficiaries = () => {
    const filtered = (beneficiaries || []).filter(b =>
      b.name.toLowerCase().includes(beneficiarySearchTerm.toLowerCase()) ||
      b.document.includes(beneficiarySearchTerm)
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Cadastro de Pessoas
          </h2>
          {(user?.role === 'admin' || user?.role === 'operador' || user?.role === 'recepcao') && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  const data = beneficiaries.map(b => ({
                    Nome: b.name,
                    Documento: b.document,
                    Observacoes: b.needs
                  }));
                  exportToCSV(data, 'lista_beneficiarios');
                }}
                className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors text-sm flex-1 sm:flex-none justify-center"
              >
                <Download className="w-4 h-4" /> Exportar
              </button>
              <button
                onClick={() => {
                  setEditingBeneficiary(null);
                  setIsBeneficiaryModalOpen(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors text-sm flex-1 sm:flex-none justify-center"
              >
                <Plus className="w-4 h-4" /> Novo Cadastro
              </button>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou documento..."
              value={beneficiarySearchTerm}
              onChange={(e) => setBeneficiarySearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhuma pessoa encontrada na busca.</p>
            </div>
          ) : filtered.map(b => (
            <div key={b.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 font-bold shrink-0">
                  {b.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(user?.role === 'admin' || user?.role === 'operador' || user?.role === 'recepcao') && (
                    <button
                      onClick={() => {
                        setEditingBeneficiary(b);
                        setIsBeneficiaryModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => deleteBeneficiary(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{b.name}</h3>
              <p className="text-xs text-slate-400 mb-4 font-mono">{b.document || 'Sem documento registrado'}</p>

              <div className="bg-slate-50 p-3 rounded-lg min-h-[60px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Necessidades / Observações</p>
                <p className="text-sm text-slate-600 line-clamp-3">
                  {b.needs || 'Nenhuma informação adicional.'}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <MapPinned className="w-3 h-3" />
                  Ultimo atendimento há 12 dias
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSaveTriage = async () => {
    if (!editingVisit || !triageForm) return;

    try {
      await updatePatientVisitFirestore(editingVisit.id, {
        triage: {
          ...triageForm,
          nurseName: user?.name || 'Enfermeiro',
        },
        status: 'waiting_consultation'
      });

      setIsTriageModalOpen(false);
      setEditingVisit(null);
      setTriageForm({ weight: '', bloodPressure: '', temperature: '', symptoms: '', notes: '', nurseName: '' });
    } catch (error) {
      console.error("Error saving triage:", error);
      showToast("Erro ao salvar triagem", "error", "Tente novamente.");
    }
  };

  const handleSaveConsultation = async () => {
    if (!editingVisit || !consultationForm) return;

    try {
      await updatePatientVisitFirestore(editingVisit.id, {
        doctor: {
          ...consultationForm,
          doctorName: user?.name || 'Médico',
        },
        status: 'pharmacy'
      });

      setIsConsultationModalOpen(false);
      setEditingVisit(null);
      setConsultationForm({ diagnosis: '', prescription: '', internalNotes: '', selectedMedications: [] });
      showToast('Consulta finalizada', 'success', 'Paciente encaminhado para farmácia.');
    } catch (error) {
      console.error("Error saving consultation:", error);
      showToast("Erro ao salvar consulta", "error");
    }
  };

  const handleSavePharmacy = async () => {
    if (!editingVisit || !pharmacyForm) return;

    try {
      // 1. Update Inventory (decrement stock)
      for (const dispensed of pharmacyForm.dispensedItems) {
        const originalItem = items?.find(i => i.id === dispensed.itemId);
        if (originalItem) {
          await updateItemFirestore(originalItem.id, {
            quantity: originalItem.quantity - dispensed.quantity
          });
          // Log stock movement could be added here
        }
      }

      // 2. Update Visit
      await updatePatientVisitFirestore(editingVisit.id, {
        pharmacy: {
          ...pharmacyForm,
          pharmacistName: user?.name || 'Farmacêutico',
        },
        status: 'completed',
        // completionTime: new Date()
      });

      setIsPharmacyModalOpen(false);
      setEditingVisit(null);
      setPharmacyForm({ dispensedItems: [], notes: '' });
      showToast('Sucesso', 'success', 'Dispensação realizada e estoque atualizado!');
    } catch (error) {
      console.error("Error saving pharmacy:", error);
      showToast("Erro ao finalizar farmácia", "error");
    }
  };

  const renderReception = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysVisits = (patientVisits || []).filter(v => v.date && v.date.startsWith(today));

    // KPI counts per status
    const inTriage = todaysVisits.filter(v => v.status === 'triage').length;
    const inDoctor = todaysVisits.filter(v => v.status === 'waiting_consultation' || v.status === 'in_consultation').length;
    const inPharmacy = todaysVisits.filter(v => v.status === 'pharmacy').length;
    const completedCount = todaysVisits.filter(v => v.status === 'completed').length;

    // Filter beneficiaries for check-in
    const filteredBeneficiaries = (beneficiaries || []).filter(b =>
      b.name.toLowerCase().includes(receptionSearchTerm.toLowerCase()) ||
      b.document.includes(receptionSearchTerm)
    );

    const handleCheckIn = async (beneficiary: Beneficiary) => {
      // Check if already checked in today
      const existing = todaysVisits.find(v => v.beneficiaryId === beneficiary.id);
      if (existing) {
        showToast('Atenção', 'warning', 'Beneficiário já fez check-in hoje!');
        return;
      }

      try {
        await addPatientVisitFirestore({
          beneficiaryId: beneficiary.id,
          beneficiaryName: beneficiary.name,
          date: new Date().toISOString(),
          status: 'triage', // Send directly to Triage queue
          priority: 'normal',
          createdAt: { seconds: Math.floor(Date.now() / 1000) } // Mocking firestore timestamp for local optimistic UI
        } as any);
        showToast("Check-in realizado", "success", `Para ${beneficiary.name}`);
        setReceptionSearchTerm(''); // Clear search
      } catch (error) {
        console.error("Error creating visit:", error);
        showToast("Erro", "error", "Não foi possível realizar o check-in.");
      }
    };

    return (
      <div className="space-y-6">
        {/* Header with action buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-blue-600" />
              Recepção
            </h2>
            <p className="text-sm text-slate-500 mt-1">Gerencie a chegada e cadastro dos beneficiários</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingBeneficiary(null);
                setIsBeneficiaryModalOpen(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Novo Cadastro
            </button>
          </div>
        </div>

        {/* KPI Cards - Clinical Flow Status */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Hoje</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{todaysVisits.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Triagem</span>
            </div>
            <p className="text-2xl font-black text-amber-600">{inTriage}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Médico</span>
            </div>
            <p className="text-2xl font-black text-blue-600">{inDoctor}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Pill className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Farmácia</span>
            </div>
            <p className="text-2xl font-black text-purple-600">{inPharmacy}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Concluídos</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">{completedCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Search & Check-in */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Buscar e iniciar atendimento</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar beneficiário por nome ou documento para iniciar check-in..."
                  value={receptionSearchTerm}
                  onChange={(e) => setReceptionSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">Resultados da Busca</h3>
                {receptionSearchTerm && (
                  <span className="text-xs text-slate-500">{filteredBeneficiaries.length} encontrado(s)</span>
                )}
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {receptionSearchTerm === '' ? (
                  <div className="p-12 text-center text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Busque um beneficiário para iniciar o atendimento</p>
                    <p className="text-xs mt-2">Ou clique em <strong>"Novo Cadastro"</strong> para registrar um novo beneficiário</p>
                  </div>
                ) : filteredBeneficiaries.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <p>Nenhum beneficiário encontrado.</p>
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setEditingBeneficiary(null);
                          setIsBeneficiaryModalOpen(true);
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 mx-auto"
                      >
                        <UserPlus className="w-4 h-4" />
                        Cadastrar Novo Beneficiário
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredBeneficiaries.map(b => {
                      const alreadyCheckedIn = todaysVisits.some(v => v.beneficiaryId === b.id);
                      return (
                        <div key={b.id} className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${alreadyCheckedIn ? 'opacity-60' : ''}`}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800">{b.name}</p>
                              {alreadyCheckedIn && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">JÁ EM ATENDIMENTO</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono">{b.document}</p>
                            {b.needs && <p className="text-xs text-amber-600 mt-1">⚠️ {b.needs}</p>}
                          </div>
                          {!alreadyCheckedIn ? (
                            <button
                              onClick={() => handleCheckIn(b)}
                              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 shrink-0"
                            >
                              <UserCheck className="w-4 h-4" />
                              Iniciar Atendimento
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 shrink-0">
                              <Check className="w-4 h-4" /> Registrado
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Today's Queue */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-full min-h-[500px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Fila de Hoje
                </h3>
                <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                  {todaysVisits.length}
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto p-2">
                {todaysVisits.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    Nenhum check-in realizado hoje.
                  </div>
                ) : (
                  [...todaysVisits].reverse().map(v => (
                    <div key={v.id} className="p-3 bg-white border border-slate-100 rounded-lg mb-2 shadow-sm relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${v.status === 'triage' ? 'bg-amber-400' :
                        v.status === 'waiting_consultation' ? 'bg-blue-400' :
                          v.status === 'in_consultation' ? 'bg-purple-400' :
                            v.status === 'pharmacy' ? 'bg-emerald-400' :
                              v.status === 'completed' ? 'bg-emerald-600' :
                                'bg-slate-300'
                        }`} />
                      <div className="pl-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm text-slate-700 truncate max-w-[120px]" title={v.beneficiaryName}>{v.beneficiaryName}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${v.status === 'triage' ? 'bg-amber-100 text-amber-700' :
                            v.status === 'waiting_consultation' ? 'bg-blue-100 text-blue-700' :
                              v.status === 'in_consultation' ? 'bg-purple-100 text-purple-700' :
                                v.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                  v.status === 'pharmacy' ? 'bg-emerald-50 text-emerald-600' :
                                    'bg-slate-100 text-slate-600'
                            }`}>
                            {v.status === 'triage' ? 'Triagem' :
                              v.status === 'waiting_consultation' ? 'Médico' :
                                v.status === 'in_consultation' ? 'Consulta' :
                                  v.status === 'pharmacy' ? 'Farmácia' :
                                    v.status === 'completed' ? 'Concluído' :
                                      v.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {v.createdAt && (v.createdAt.seconds
                            ? new Date(v.createdAt.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : new Date(v.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
                          }
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };



  const renderTriage = () => {
    const today = new Date().toISOString().split('T')[0];
    const queue = (patientVisits || []).filter(v => v.date && v.date.startsWith(today) && v.status === 'triage');
    const waitingDoctor = (patientVisits || []).filter(v => v.date && v.date.startsWith(today) && v.status === 'waiting_consultation');
    const completedTriage = (patientVisits || []).filter(v => v.date && v.date.startsWith(today) && ['waiting_consultation', 'in_consultation', 'pharmacy', 'completed'].includes(v.status));

    const handleStartTriage = (visit: PatientVisit) => {
      setEditingVisit(visit);
      setTriageForm(visit.triage || { weight: '', bloodPressure: '', temperature: '', symptoms: '', notes: '', nurseName: '' });
      setIsTriageModalOpen(true);
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-6 h-6 text-amber-600" />
              Triagem
            </h2>
            <p className="text-sm text-slate-500 mt-1">Realize a triagem dos pacientes que chegaram na recepção</p>
          </div>
          <div className="flex gap-3">
            {queue.length > 0 && (
              <button
                onClick={() => handleStartTriage(queue[0])}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-bold rounded-xl hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-200 transition-all flex items-center gap-2 animate-pulse"
              >
                <Stethoscope className="w-4 h-4" />
                Chamar Próximo Paciente
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Na Fila</span>
            </div>
            <p className="text-2xl font-black text-amber-600">{queue.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Aguard. Médico</span>
            </div>
            <p className="text-2xl font-black text-blue-600">{waitingDoctor.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Triadas Hoje</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">{completedTriage.length}</p>
          </div>
        </div>

        {/* Triage Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-amber-50 flex justify-between items-center">
            <h3 className="font-bold text-amber-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Fila de Triagem ({queue.length})
            </h3>
            <span className="text-xs text-amber-600">Protocolo: Recepção → <strong>Triagem</strong> → Médico → Farmácia</span>
          </div>
          <div className="divide-y divide-slate-100">
            {queue.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Nenhum paciente aguardando triagem no momento.</p>
                <p className="text-xs mt-2">Pacientes aparecerão aqui após o check-in na Recepção</p>
              </div>
            ) : (
              queue.map((v, idx) => (
                <div key={v.id} className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-amber-50/50 transition-colors ${idx === 0 ? 'bg-amber-50/30 border-l-4 border-amber-400' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {idx === 0 && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">PRÓXIMO</span>}
                      <p className="font-bold text-slate-800 text-lg truncate">{v.beneficiaryName}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Chegada: {v.createdAt && new Date(v.createdAt.seconds ? v.createdAt.seconds * 1000 : v.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {v.priority === 'preferencial' && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">PREFERENCIAL</span>}
                      {v.priority === 'emergencia' && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">EMERGÊNCIA</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartTriage(v)}
                    className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${idx === 0
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-200'
                      : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 shadow-slate-200'
                      }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    Iniciar Triagem
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Finished / Waiting Doctor */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-600 flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Aguardando Médico ({waitingDoctor.length})
            </h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
            {waitingDoctor.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                Nenhum paciente aguardando consultório.
              </div>
            ) : waitingDoctor.map(v => (
              <div key={v.id} className="p-3 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                <div>
                  <span className="text-slate-700 font-medium block">{v.beneficiaryName}</span>
                  <span className="text-xs text-slate-400">Triagem completa</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">Pronto p/ Médico</span>
                  <button
                    onClick={() => handleStartTriage(v)}
                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Editar Triagem"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderConsultation = () => {
    const today = new Date().toISOString().split('T')[0];
    const queue = (patientVisits || []).filter(v => v.date && v.date.startsWith(today) && v.status === 'waiting_consultation');
    const inConsultation = (patientVisits || []).filter(v => v.date && v.date.startsWith(today) && v.status === 'in_consultation');
    const finished = (patientVisits || []).filter(v => v.date && v.date.startsWith(today) && (v.status === 'pharmacy' || v.status === 'completed'));

    const handleStartConsultation = (visit: PatientVisit) => {
      setEditingVisit(visit);
      const existingDoctor = visit.doctor;
      setConsultationForm({
        diagnosis: existingDoctor?.diagnosis || '',
        prescription: existingDoctor?.prescription || '',
        internalNotes: existingDoctor?.internalNotes || '',
        selectedMedications: existingDoctor?.selectedMedications || [],
      });
      setIsConsultationModalOpen(true);
    };

    // --- Mission Stock Panel Logic ---
    // 1. Find the volunteer record matching the logged-in user
    const allVolunteers = volunteers || [];
    const allMissions = missions && missions.length > 0 ? missions : INITIAL_MISSIONS;
    const allItems = items && items.length > 0 ? items : INITIAL_ITEMS;

    const myVolunteer = allVolunteers.find(
      v => v.email?.toLowerCase() === user?.email?.toLowerCase() ||
        v.name?.toLowerCase() === user?.email?.toLowerCase().split('@')[0]
    );

    // 2. Find active missions this volunteer is participating in (today or future planned)
    const myMissions = allMissions.filter(m =>
      m.status !== 'cancelled' &&
      myVolunteer && (m.volunteerIds || []).includes(myVolunteer.id)
    );

    // 3. If no mission found by volunteer link, show next upcoming planned missions as fallback
    const upcomingMissions = myMissions.length > 0
      ? myMissions
      : allMissions.filter(m => m.status === 'planned').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 1);

    // 4. Aggregate all medication items across those missions
    type MissionMedItem = { itemName: string; unit: string; quantity: number; missionTitle: string; missionDate: string; stockQuantity: number };
    const missionMedItems: MissionMedItem[] = [];
    upcomingMissions.forEach(mission => {
      (mission.allocatedItems || []).forEach(alloc => {
        const item = allItems.find(i => i.id === alloc.itemId);
        if (item && item.category === 'Medicamentos') {
          missionMedItems.push({
            itemName: item.name,
            unit: item.unit,
            quantity: alloc.quantity,
            missionTitle: mission.title,
            missionDate: mission.date,
            stockQuantity: item.quantity,
          });
        }
      });
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              Consultório Médico
            </h2>
            <p className="text-sm text-slate-500 mt-1">Atenda os pacientes triados e registre diagnóstico e prescrição</p>
          </div>
          <div className="flex gap-3">
            {queue.length > 0 && (
              <button
                onClick={() => handleStartConsultation(queue[0])}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 animate-pulse"
              >
                <Stethoscope className="w-4 h-4" />
                Chamar Próximo Paciente
              </button>
            )}
          </div>
        </div>

        {/* === MISSION STOCK PANEL === */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-teal-900 text-sm">Farmácia da Missão</h3>
                <p className="text-[11px] text-teal-600">
                  {upcomingMissions.length > 0
                    ? `Medicamentos disponíveis para prescrição${myMissions.length === 0 ? ' (próxima missão planejada)' : ''}`
                    : 'Nenhuma missão ativa encontrada'}
                </p>
              </div>
            </div>
            {upcomingMissions.length > 0 && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-1 rounded-full flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {upcomingMissions[0]?.title}
                </span>
                <p className="text-[10px] text-teal-500 mt-0.5">
                  {upcomingMissions[0] && new Date(upcomingMissions[0].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {missionMedItems.length === 0 ? (
            <div className="p-8 text-center text-teal-400">
              <Pill className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Nenhum medicamento alocado à missão.</p>
              <p className="text-xs mt-1 opacity-70">Solicite ao coordenador que aloque medicamentos a esta missão.</p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {missionMedItems.map((med, idx) => {
                const stockRatio = med.stockQuantity > 0 ? Math.min(med.quantity / med.stockQuantity, 1) : 0;
                const stockStatus = med.stockQuantity === 0
                  ? { color: 'red', label: 'Sem estoque', bg: 'bg-red-50 border-red-200' }
                  : med.stockQuantity < med.quantity
                    ? { color: 'amber', label: 'Estoque limitado', bg: 'bg-amber-50 border-amber-200' }
                    : { color: 'emerald', label: 'Disponível', bg: 'bg-white border-teal-100' };

                return (
                  <div key={idx} className={`rounded-xl border p-3 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow ${stockStatus.bg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm leading-tight">{med.itemName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Alocado para missão: <span className="font-semibold text-teal-700">{med.quantity} {med.unit}</span>
                        </p>
                      </div>
                      <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide
                        ${stockStatus.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                          stockStatus.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'}`}>
                        {stockStatus.label}
                      </span>
                    </div>

                    {/* Stock bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Estoque geral</span>
                        <span className="font-semibold text-slate-700">{med.stockQuantity} {med.unit}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${stockStatus.color === 'emerald' ? 'bg-emerald-400' :
                            stockStatus.color === 'amber' ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                          style={{ width: `${Math.min(stockRatio * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 italic border-t border-slate-100 pt-1.5">
                      Ao prescrever, informe o farmacêutico para dispensar da missão <strong className="text-slate-600">{med.missionTitle}</strong>.
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* === END MISSION STOCK PANEL === */}

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Aguardando</span>
            </div>
            <p className="text-2xl font-black text-blue-600">{queue.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Em Consulta</span>
            </div>
            <p className="text-2xl font-black text-purple-600">{inConsultation.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Atendidos Hoje</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">{finished.length}</p>
          </div>
        </div>

        {/* Consultation Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-blue-50 flex justify-between items-center">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Fila de Espera ({queue.length})
            </h3>
            <span className="text-xs text-blue-600">Protocolo: Recepção → Triagem → <strong>Médico</strong> → Farmácia</span>
          </div>
          <div className="divide-y divide-slate-100">
            {queue.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Nenhum paciente aguardando atendimento médico.</p>
                <p className="text-xs mt-2">Pacientes aparecerão aqui após a triagem</p>
              </div>
            ) : (
              queue.map((v, idx) => (
                <div key={v.id} className={`p-4 hover:bg-blue-50/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${idx === 0 ? 'bg-blue-50/20 border-l-4 border-blue-400' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {idx === 0 && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">PRÓXIMO</span>}
                      <p className="font-bold text-slate-800 text-lg">{v.beneficiaryName}</p>
                      {v.priority && v.priority !== 'normal' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${v.priority === 'emergencia' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                          }`}>{v.priority}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p><span className="font-semibold text-slate-500">PA:</span> {v.triage?.bloodPressure || '-'}</p>
                      <p><span className="font-semibold text-slate-500">Temp:</span> {v.triage?.temperature || '-'}°C</p>
                      <p><span className="font-semibold text-slate-500">Peso:</span> {v.triage?.weight || '-'}kg</p>
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {v.createdAt && new Date(v.createdAt.seconds ? v.createdAt.seconds * 1000 : v.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="col-span-2 md:col-span-4 mt-1 pt-2 border-t border-slate-200">
                        <span className="font-semibold text-slate-500 block text-xs uppercase">Sintomas/Queixas:</span>
                        <p className="italic text-slate-800">{v.triage?.symptoms || 'Não informado.'}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartConsultation(v)}
                    className={`px-6 py-3 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 ${idx === 0
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-200'
                      : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 shadow-slate-200'
                      }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    Atender Paciente
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Finished */}
        {finished.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-600 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                Atendimentos Realizados Hoje ({finished.length})
              </h3>
            </div>
            <div className="p-4 max-h-40 overflow-y-auto space-y-2">
              {finished.map(v => (
                <div key={v.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                  <div>
                    <span className="font-medium text-slate-700 block">{v.beneficiaryName}</span>
                    <span className={`font-bold flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full w-fit ${v.status === 'pharmacy' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Check className="w-3 h-3" /> {v.status === 'pharmacy' ? 'Na Farmácia' : 'Concluído'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleStartConsultation(v)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar Atendimento"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPharmacy = () => {
    const today = new Date().toISOString().split('T')[0];
    const queue = (patientVisits || []).filter(v => v.date && v.date.startsWith(today) && v.status === 'pharmacy');
    const completed = (patientVisits || []).filter(v => v.date && v.date.startsWith(today) && v.status === 'completed');

    const handleStartPharmacy = (visit: PatientVisit) => {
      setEditingVisit(visit);
      setPharmacyForm({ dispensedItems: [], notes: '' });
      setIsPharmacyModalOpen(true);
    };

    // --- Mission Stock Panel Logic (same as renderConsultation) ---
    const allVolunteers = volunteers || [];
    const allMissions = missions && missions.length > 0 ? missions : INITIAL_MISSIONS;
    const allItems = items && items.length > 0 ? items : INITIAL_ITEMS;

    const myVolunteer = allVolunteers.find(
      v => v.email?.toLowerCase() === user?.email?.toLowerCase() ||
        v.name?.toLowerCase() === user?.email?.toLowerCase().split('@')[0]
    );

    const myMissions = allMissions.filter(m =>
      m.status !== 'cancelled' &&
      myVolunteer && (m.volunteerIds || []).includes(myVolunteer.id)
    );

    const upcomingMissions = myMissions.length > 0
      ? myMissions
      : allMissions.filter(m => m.status === 'planned').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 1);

    type MissionMedItem = { itemName: string; unit: string; quantity: number; missionTitle: string; missionDate: string; stockQuantity: number };
    const missionMedItems: MissionMedItem[] = [];
    upcomingMissions.forEach(mission => {
      (mission.allocatedItems || []).forEach(alloc => {
        const item = allItems.find(i => i.id === alloc.itemId);
        if (item && item.category === 'Medicamentos') {
          missionMedItems.push({
            itemName: item.name,
            unit: item.unit,
            quantity: alloc.quantity,
            missionTitle: mission.title,
            missionDate: mission.date,
            stockQuantity: item.quantity,
          });
        }
      });
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Pill className="w-6 h-6 text-emerald-600" />
              Farmácia
            </h2>
            <p className="text-sm text-slate-500 mt-1">Dispense medicamentos conforme prescrição médica</p>
          </div>
          <div className="flex gap-3">
            {queue.length > 0 && (
              <button
                onClick={() => handleStartPharmacy(queue[0])}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 animate-pulse"
              >
                <Pill className="w-4 h-4" />
                Chamar Próximo Paciente
              </button>
            )}
          </div>
        </div>

        {/* === MISSION STOCK PANEL === */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-teal-900 text-sm">Farmácia da Missão</h3>
                <p className="text-[11px] text-teal-600">
                  {upcomingMissions.length > 0
                    ? `Medicamentos disponíveis para dispensação${myMissions.length === 0 ? ' (próxima missão planejada)' : ''}`
                    : 'Nenhuma missão ativa encontrada'}
                </p>
              </div>
            </div>
            {upcomingMissions.length > 0 && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-1 rounded-full flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {upcomingMissions[0]?.title}
                </span>
                <p className="text-[10px] text-teal-500 mt-0.5">
                  {upcomingMissions[0] && new Date(upcomingMissions[0].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {missionMedItems.length === 0 ? (
            <div className="p-8 text-center text-teal-400">
              <Pill className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Nenhum medicamento alocado à missão.</p>
              <p className="text-xs mt-1 opacity-70">Solicite ao coordenador que aloque medicamentos a esta missão.</p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {missionMedItems.map((med, idx) => {
                const stockRatio = med.stockQuantity > 0 ? Math.min(med.quantity / med.stockQuantity, 1) : 0;
                const stockStatus = med.stockQuantity === 0
                  ? { color: 'red', label: 'Sem estoque', bg: 'bg-red-50 border-red-200' }
                  : med.stockQuantity < med.quantity
                    ? { color: 'amber', label: 'Estoque limitado', bg: 'bg-amber-50 border-amber-200' }
                    : { color: 'emerald', label: 'Disponível', bg: 'bg-white border-teal-100' };

                return (
                  <div key={idx} className={`rounded-xl border p-3 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow ${stockStatus.bg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm leading-tight">{med.itemName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Alocado para missão: <span className="font-semibold text-teal-700">{med.quantity} {med.unit}</span>
                        </p>
                      </div>
                      <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide
                        ${stockStatus.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                          stockStatus.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'}`}>
                        {stockStatus.label}
                      </span>
                    </div>

                    {/* Stock bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Estoque geral</span>
                        <span className="font-semibold text-slate-700">{med.stockQuantity} {med.unit}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${stockStatus.color === 'emerald' ? 'bg-emerald-400' :
                            stockStatus.color === 'amber' ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                          style={{ width: `${Math.min(stockRatio * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 italic border-t border-slate-100 pt-1.5">
                      Dispensar da missão <strong className="text-slate-600">{med.missionTitle}</strong>.
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* === END MISSION STOCK PANEL === */}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Aguardando Medicação</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">{queue.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Dispensados Hoje</span>
            </div>
            <p className="text-2xl font-black text-slate-700">{completed.length}</p>
          </div>
        </div>

        {/* Pharmacy Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-emerald-50 flex justify-between items-center">
            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Fila da Farmácia ({queue.length})
            </h3>
            <span className="text-xs text-emerald-600">Protocolo: Recepção → Triagem → Médico → <strong>Farmácia</strong></span>
          </div>
          <div className="divide-y divide-slate-100">
            {queue.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Pill className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Nenhum paciente aguardando medicamentos.</p>
                <p className="text-xs mt-2">Pacientes aparecerão aqui após a consulta médica</p>
              </div>
            ) : (
              queue.map((v, idx) => (
                <div key={v.id} className={`p-4 hover:bg-emerald-50/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${idx === 0 ? 'bg-emerald-50/20 border-l-4 border-emerald-400' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {idx === 0 && <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">PRÓXIMO</span>}
                      <p className="font-bold text-slate-800 text-lg">{v.beneficiaryName}</p>
                      {v.priority && v.priority !== 'normal' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${v.priority === 'emergencia' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                          }`}>{v.priority}</span>
                      )}
                    </div>
                    <div className="mt-2 space-y-2">
                      {/* Medicamentos selecionados pelo médico */}
                      {v.doctor?.selectedMedications && v.doctor.selectedMedications.length > 0 && (
                        <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                          <p className="font-bold text-teal-800 text-xs uppercase mb-2 flex items-center gap-1">
                            <Pill className="w-3 h-3" />
                            Medicamentos Prescritos pelo Médico:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {v.doctor.selectedMedications.map((med, i) => (
                              <span key={i} className="text-xs bg-teal-100 border border-teal-300 text-teal-800 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                {med}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="font-bold text-blue-800 text-xs uppercase mb-1 flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          Prescrição / Posologia:
                        </p>
                        <p className="text-slate-700 font-mono whitespace-pre-wrap text-sm">{v.doctor?.prescription || 'Sem prescrição registrada.'}</p>
                      </div>
                      {v.doctor?.diagnosis && (
                        <div className="text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="font-semibold text-slate-500 text-xs uppercase mb-0.5">Diagnóstico:</p>
                          <p className="text-slate-700">{v.doctor.diagnosis}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartPharmacy(v)}
                    className={`px-6 py-3 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 ${idx === 0
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-200'
                      : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 shadow-slate-200'
                      }`}
                  >
                    <Pill className="w-4 h-4" />
                    Dispensar Medicação
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-600 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                Atendimentos Finalizados Hoje ({completed.length})
              </h3>
            </div>
            <div className="p-4 max-h-40 overflow-y-auto space-y-2">
              {completed.map(v => (
                <div key={v.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                  <span className="font-medium text-slate-700">{v.beneficiaryName}</span>
                  <span className="text-xs bg-emerald-50 text-emerald-600 font-bold flex items-center gap-1 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3" /> Concluído
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCalendar = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay(); // 0 = Sun

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Calendário de Ações - </span>
            {today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg min-w-[600px]">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="bg-slate-50 p-4 text-center text-sm font-bold text-slate-500 uppercase">
                {d}
              </div>
            ))}
            {days.map((day, idx) => {
              const currentDateStr = day ? new Date(today.getFullYear(), today.getMonth(), day).toISOString().split('T')[0] : '';
              const dayMissions = (missions || []).filter(m => m.date === currentDateStr);

              return (
                <div key={idx} className={`bg-white min-h-[120px] p-2 hover:bg-slate-50 transition-colors ${!day ? 'bg-slate-50/50' : ''}`}>
                  {day && (
                    <>
                      <span className={`text-sm font-bold ${day === today.getDate() ? 'bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-slate-700'
                        }`}>{day}</span>
                      <div className="mt-2 space-y-1">
                        {dayMissions.map(m => (
                          <div key={m.id} className="text-xs p-1.5 bg-blue-100 text-blue-800 rounded border border-blue-200 truncate cursor-pointer hover:bg-blue-200" title={m.title}>
                            {m.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Central de Notificações
        </h2>
        <p className="text-sm text-slate-500 mt-1">Histórico de alertas enviados via WhatsApp e Email</p>
      </div>
      <div className="divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Nenhuma notificação registrada.
          </div>
        ) : (sortedNotifications || []).map(notif => (
          <div key={notif.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
            <div className={`p-3 rounded-full h-fit shrink-0 ${notif.type === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
              }`}>
              {notif.type === 'WHATSAPP' ? <MessageCircle className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <h4 className="font-bold text-slate-800 text-sm truncate">{notif.type === 'WHATSAPP' ? 'WhatsApp' : 'Email'} para {notif.recipient}</h4>
                <span className="text-xs text-slate-400 shrink-0">
                  {notif.timestamp ? (
                    (() => {
                      if (notif.timestamp instanceof Date) return notif.timestamp.toLocaleTimeString();
                      if (notif.timestamp.seconds) return new Date(notif.timestamp.seconds * 1000).toLocaleTimeString();
                      return new Date(notif.timestamp).toLocaleTimeString();
                    })()
                  ) : '--:--'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 break-words">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Gerenciamento de Usuários
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Usuário</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Email</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Função Atual</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(appUsers || []).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{u.name}</td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'operador' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                      {u.role === 'admin' ? 'Administrador' : u.role === 'operador' ? 'Operador' : 'Voluntário'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      disabled={u.id === user?.uid} // Don't let user change their own role to prevent lockout
                      className="text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="voluntario">Voluntário</option>
                      <option value="operador">Operador/Recepção</option>
                      <option value="saude">Saúde (Médico/Triagem)</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="arrecadacao">Arrecadação</option>
                      <option value="pdv">PDV</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFinancial = () => {
    // Sort transactions by date (newest first)
    const transactionData = (transactions && transactions.length > 0) ? transactions : MOCK_TRANSACTIONS;
    const allTransactionsSorted = (transactionData || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate totals
    const totalIncome = allTransactionsSorted
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = allTransactionsSorted
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const filteredTransactions = transactionFilter === 'all'
      ? allTransactionsSorted
      : allTransactionsSorted.filter(t => t.type === transactionFilter);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Gestão Financeira
          </h2>
          <button
            onClick={() => {
              setNewTransaction({
                type: 'expense',
                date: new Date().toISOString().split('T')[0],
                status: 'pending',
                paymentMethod: 'pix',
                category: 'Outros'
              });
              setIsFinancialModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nova Transação
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <div className="relative z-10">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Receitas Realizadas</p>
              <h3 className="text-3xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</h3>
              <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-medium">
                <ArrowUpRight className="w-3 h-3" />
                <span>Entradas confirmadas</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <div className="relative z-10">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Despesas Realizadas</p>
              <h3 className="text-3xl font-bold text-red-500">{formatCurrency(totalExpense)}</h3>
              <div className="flex items-center gap-1 mt-2 text-red-500 text-xs font-medium">
                <ArrowDownLeft className="w-3 h-3" />
                <span>Saídas confirmadas</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-slate-700/50 rounded-full -mr-8 -mt-8 blur-xl transition-opacity group-hover:opacity-75" />
            <div className="relative z-10">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Saldo Atual</p>
              <h3 className={`text-3xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(balance)}
              </h3>
              <p className="text-xs text-slate-400 mt-2">Balanço geral do período</p>
            </div>
          </div>
        </div>

        {/* Filters & Transaction List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              Histórico de Transações
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTransactionFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${transactionFilter === 'all' ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setTransactionFilter('income')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${transactionFilter === 'income' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
              >
                Receitas
              </button>
              <button
                onClick={() => setTransactionFilter('expense')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${transactionFilter === 'expense' ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
              >
                Despesas
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      Nenhuma transação registrada no sistema.
                    </td>
                  </tr>
                ) : filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800 text-sm">{t.description}</p>
                      {t.person && <p className="text-xs text-slate-400 mt-0.5">{t.person}</p>}
                      {t.missionId && (
                        <div className="flex items-center gap-1 text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 w-fit">
                          <Briefcase className="w-3 h-3" />
                          {(missions?.find(m => m.id === t.missionId) || INITIAL_MISSIONS.find(m => m.id === t.missionId))?.title || 'Missão'}
                        </div>
                      )}
                      {t.docUrl && (
                        <a
                          href={t.docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-800 underline mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3 h-3" /> Comprovante
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => updateTransactionFirestore(t.id, { status: t.status === 'paid' ? 'pending' : 'paid' })}
                        className={`px-2 py-1 rounded-full text-xs font-bold transition-all ${t.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        title="Clique para alterar status"
                      >
                        {t.status === 'paid' ? 'Pago' : 'Pendente'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setNewTransaction(t);
                            setIsFinancialModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
                              deleteTransactionFirestore(t.id);
                              showToast('Transação excluída com sucesso', 'success');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderVolunteers = () => {
    const filtered = (volunteers || []).filter(v =>
      v.name.toLowerCase().includes(volunteerSearchTerm.toLowerCase()) ||
      v.role.toLowerCase().includes(volunteerSearchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Heart className="w-5 h-5 text-indigo-500" />
            Gestão de Voluntários
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar voluntários..."
                value={volunteerSearchTerm}
                onChange={(e) => setVolunteerSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              onClick={() => {
                setEditingVolunteer(null);
                setIsVolunteerModalOpen(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors text-sm flex-1 sm:flex-none justify-center sm:justify-start"
            >
              <Plus className="w-4 h-4" /> Novo Voluntário
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => (
            <div key={v.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {v.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{v.name}</h3>
                    <p className="text-xs text-slate-500">{v.role}</p>
                    {v.crm && (
                      <p className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                        <Stethoscope size={10} />
                        {(v.role.toLowerCase().includes('médico') || v.role.toLowerCase().includes('medico')) ? 'CRM' :
                          (v.role.toLowerCase().includes('farmacêutico') || v.role.toLowerCase().includes('farmaceutico')) ? 'CRF' : 'Registro'}: {v.crm}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingVolunteer(v); setIsVolunteerModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteVolunteer(v.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{v.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{v.email || 'Sem email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{v.availability || 'Disponibilidade não informada'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {v.active ? 'Ativo' : 'Inativo'}
                </span>
                {v.notes && (
                  <span className="text-xs text-slate-400 italic max-w-[150px] truncate" title={v.notes}>
                    {v.notes}
                  </span>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Heart className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Nenhum voluntário encontrado.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFundraising = () => {
    // Focando em doações (income transactions)
    const donations = (transactions || []).filter(t => t.type === 'income' && (t.category === 'Doação' || t.category === 'Campanha'));
    const totalRaised = donations.reduce((acc, t) => acc + t.amount, 0);
    const mockGoal = 150000;
    const progress = Math.min((totalRaised / mockGoal) * 100, 100);

    return (
      <div className="space-y-6">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Arrecadação</h2>
            <p className="text-slate-500 mt-1 text-sm">Acompanhamento de doações, metas e campanhas solidárias.</p>
          </div>
          <button
            onClick={() => {
              setNewTransaction({ type: 'income', category: 'Doação', status: 'paid', date: new Date().toISOString().split('T')[0], paymentMethod: 'pix' });
              setIsFinancialModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-105 transition-all text-sm"
          >
            <Heart className="w-5 h-5" /> Nova Doação
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Raised Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
                <HandCoins className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Arrecadado</p>
                <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totalRaised)}</h3>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>{progress.toFixed(1)}% da meta global</span>
              <span>Meta: {formatCurrency(mockGoal)}</span>
            </div>
          </div>

          {/* Active Donors */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Doadores Ativos</p>
                <h3 className="text-2xl font-black text-slate-800">{new Set(donations.map(d => d.person)).size}</h3>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">+12 novos doadores este mês</p>
          </div>

          {/* Quick Link/Share */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-700 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-pink-500 rounded-full blur-3xl opacity-20"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-base mb-1 flex items-center gap-2"><Megaphone className="w-4 h-4 text-pink-400" /> Divulgar Campanha</h3>
              <p className="text-xs text-slate-300">Compartilhe o link de arrecadação nas redes sociais.</p>
            </div>
            <button
              onClick={() => alert('Link copiado para área de transferência!')}
              className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-lg transition-colors border border-white/10 text-sm relative z-10"
            >
              Copiar Link
            </button>
          </div>
        </div>

        {/* Campanhas Ativas (Mock) e Últimas Doações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2"><Megaphone className="w-5 h-5 text-indigo-500" /> Campanhas Ativas</h3>
            <div className="space-y-5">
              {[
                { name: 'Inverno Sem Frio', raised: 4500, goal: 10000, color: 'from-cyan-400 to-blue-500', perc: 45 },
                { name: 'Cesta Básica Solidária', raised: 8200, goal: 8000, color: 'from-emerald-400 to-teal-500', perc: 100 },
                { name: 'Reforma do Refeitório', raised: 1200, goal: 50000, color: 'from-amber-400 to-orange-500', perc: 2.4 }
              ].map((camp, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{camp.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{formatCurrency(camp.raised)} de {formatCurrency(camp.goal)}</p>
                    </div>
                    <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                      {camp.perc.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`bg-gradient-to-r ${camp.color} h-full rounded-full group-hover:opacity-80 transition-opacity`} style={{ width: `${Math.min(camp.perc, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500" /> Últimas Doações</h3>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-100 uppercase tracking-widest">Tempo Real</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[300px] p-0">
              {donations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Nenhuma doação registrada ainda.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-slate-500 font-medium select-none sticky top-0">
                    <tr>
                      <th className="p-4 py-3 text-xs uppercase tracking-wider">Origem</th>
                      <th className="p-4 py-3 text-xs uppercase tracking-wider w-24">Data</th>
                      <th className="p-4 py-3 text-xs uppercase tracking-wider text-right w-24">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {donations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 py-3">
                          <p className="font-bold text-slate-800 text-[13px] line-clamp-1">{d.person || 'Doação Anônima'}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{d.description}</p>
                        </td>
                        <td className="p-4 py-3 text-[12px] text-slate-500 font-medium">
                          {new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="p-4 py-3 text-right">
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-[13px] border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                            +{formatCurrency(d.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPOS = () => {
    // Filter items for POS (usually toys, food or "others", excluding public meds)
    const posItems = (items || INITIAL_ITEMS).filter(i =>
      (i.category === 'Brinquedos' || i.category === 'Alimentos' || i.category === 'Outros') &&
      i.name.toLowerCase().includes(posSearch.toLowerCase()) &&
      (posCategory === 'all' || i.category === posCategory)
    );

    const cartSubtotal = cart.reduce((acc, curr) => acc + (curr.item.unitValue * curr.quantity), 0);
    const cartTotal = cartSubtotal * (1 - (posDiscount / 100));

    const addToCart = (item: Item) => {
      setCart(prev => {
        const existing = prev.find(c => c.item.id === item.id);
        if (existing) {
          if (existing.quantity >= item.quantity) {
            alert('Estoque insuficiente no inventário.');
            return prev;
          }
          return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
        }
        return [...prev, { item, quantity: 1 }];
      });
    };

    const removeFromCart = (itemId: string) => {
      setCart(prev => prev.filter(c => c.item.id !== itemId));
    };

    const updateCartQty = (itemId: string, delta: number) => {
      setCart(prev => prev.map(c => {
        if (c.item.id === itemId) {
          const newQty = c.quantity + delta;
          if (newQty <= 0) return c;
          if (newQty > c.item.quantity) {
            alert('Limite de estoque atingido.');
            return c;
          }
          return { ...c, quantity: newQty };
        }
        return c;
      }).filter(c => c.quantity > 0));
    };

    const handleCheckout = async (method: Transaction['paymentMethod']) => {
      if (cart.length === 0) return;

      setIsProcessing(true);
      try {
        // Create transaction
        await addTransactionFirestore({
          description: `Venda PDV - ${cart.length} itens`,
          amount: cartTotal,
          type: 'income',
          category: 'Venda Geral',
          date: new Date().toISOString().split('T')[0],
          status: 'paid',
          paymentMethod: method,
          person: 'Cliente PDV'
        });

        // Update inventory for each item
        for (const cartItem of cart) {
          await updateItemFirestore(cartItem.item.id, {
            quantity: Math.max(0, cartItem.item.quantity - cartItem.quantity)
          });
        }

        // Show Receipt
        setShowReceipt({ items: [...cart], total: cartTotal, method });

        setCart([]);
        setPosDiscount(0);
      } catch (err) {
        console.error(err);
        alert('Falha ao processar checkout.');
      } finally {
        setIsProcessing(false);
      }
    };

    const categories: ('all' | Category)[] = ['all', 'Brinquedos', 'Alimentos', 'Outros'];

    const renderPOSReports = () => {
      const posSales = (transactions || []).filter(t => t.category === 'Venda Geral' || t.description.includes('PDV'));
      const periodSales = posSales.filter(t => t.date === posReportDate);
      const totalPeriod = periodSales.reduce((acc, curr) => acc + curr.amount, 0);

      return (
        <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-bottom-5 duration-500 overflow-hidden">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-blue-500" /> Data do Relatório</h3>
            <input
              type="date"
              value={posReportDate}
              onChange={e => setPosReportDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Vendas no Período</p>
              <p className="text-4xl font-black text-slate-900">{periodSales.length}</p>
            </div>
            <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-200 text-white">
              <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest mb-1">Faturamento no Período</p>
              <p className="text-4xl font-black">{formatCurrency(totalPeriod)}</p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Faturamento Geral PDV</p>
              <p className="text-4xl font-black">
                {formatCurrency(posSales.reduce((acc, curr) => acc + curr.amount, 0))}
              </p>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
              <h4 className="font-bold text-slate-800">Histórico de Vendas ({posReportDate.split('-').reverse().join('/')})</h4>
              <div className="flex gap-2">
                <div className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Atualizado agora
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 pt-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <th className="pb-4">Data/ID</th>
                    <th className="pb-4">Descrição</th>
                    <th className="pb-4">Pagamento</th>
                    <th className="pb-4 text-right">Valor</th>
                    <th className="pb-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {periodSales.sort((a, b) => b.id.localeCompare(a.id)).map(s => (
                    <tr key={s.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                      <td className="py-4">
                        <p className="text-[11px] font-bold text-slate-800">{s.date}</p>
                        <p className="text-[9px] text-slate-400 truncate w-24" title={s.id}>{s.id}</p>
                      </td>
                      <td className="py-4 text-sm font-medium text-slate-600">{s.description}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${s.paymentMethod === 'pix' ? 'bg-blue-50 text-blue-600' :
                          s.paymentMethod === 'card' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                          {s.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 text-sm font-black text-slate-800 text-right">{formatCurrency(s.amount)}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={async () => {
                            if (window.confirm('Deseja cancelar esta venda e estornar o valor? (Aviso: o estoque não será devolvido automaticamente nesta versão)')) {
                              await deleteTransactionFirestore(s.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-500 p-2 transition-colors ml-auto flex" title="Cancelar Venda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {periodSales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-medium">
                        Nenhuma venda encontrada para esta data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
        {/* Sub-Header / Navigation */}
        <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100">
          <div className="flex gap-1">
            <button
              onClick={() => setPosMode('sales')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all ${posMode === 'sales' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <Store className="w-4 h-4" /> PDV OPERACIONAL
            </button>
            <button
              onClick={() => setPosMode('reports')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all ${posMode === 'reports' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <History className="w-4 h-4" /> RELATÓRIO DE VENDAS
            </button>
          </div>
          {posMode === 'sales' && (
            <div className="pr-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Caixa Aberto: </span>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">● Online</span>
            </div>
          )}
        </div>

        {posMode === 'reports' ? renderPOSReports() : (
          <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden animate-in fade-in duration-500">
            {/* Product Grid Area (existing content here) */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
              {/* Filters */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Escaneie ou busque o produto..."
                    value={posSearch}
                    onChange={e => setPosSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  />
                </div>
                <div className="flex gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setPosCategory(cat)}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${posCategory === cat
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100'
                        : 'text-slate-500 hover:bg-white/50'
                        }`}
                    >
                      {cat === 'all' ? 'Tudo' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
                {posItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                      <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-200">
                        <Plus className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="w-full aspect-square bg-slate-50 rounded-[1.5rem] mb-4 flex items-center justify-center relative overflow-hidden group-hover:bg-blue-50 transition-colors">
                      {item.category === 'Brinquedos' ? <Heart className="w-10 h-10 text-pink-400/30" /> : <Package className="w-10 h-10 text-blue-400/30" />}
                    </div>
                    <div className="px-1">
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{item.category}</p>
                      <div className="mt-4 flex justify-between items-end">
                        <span className="text-blue-600 font-black text-lg">{formatCurrency(item.unitValue)}</span>
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border ${item.quantity < 5 ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {posItems.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Nenhum produto encontrado.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cart / Summary Area */}
            <div className="w-full lg:w-[420px] flex flex-col h-full animate-in slide-in-from-right duration-700">
              <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl flex-1 flex flex-col overflow-hidden text-white border border-slate-800">
                <div className="p-8 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                  <h3 className="font-bold text-lg flex items-center gap-4">
                    <div className="bg-blue-500/20 p-3 rounded-2xl ring-1 ring-blue-500/30">
                      <ShoppingCart className="w-6 h-6 text-blue-400" />
                    </div>
                    Carrinho
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCart([])}
                      className="text-[10px] font-black uppercase text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      LIMPAR
                    </button>
                    <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-1.5 rounded-full text-xs font-black ring-1 ring-blue-500/20">
                      {cart.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                      <ShoppingCart className="w-16 h-16 opacity-10" />
                      <p className="text-sm font-bold tracking-tight uppercase opacity-40">Nenhum item selecionado</p>
                    </div>
                  ) : (
                    cart.map(c => (
                      <div key={c.item.id} className="flex gap-5 items-center group animate-in slide-in-from-right-10 duration-500">
                        <div className="bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/5">
                          <Package className="w-6 h-6 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[13px] text-slate-200 line-clamp-1 leading-tight group-hover:text-white transition-colors">{c.item.name}</p>
                          <p className="text-[11px] text-slate-500 font-bold mt-1 tracking-wide">{formatCurrency(c.item.unitValue)}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-1.5 px-3 border border-white/5 ring-1 ring-white/5 shadow-inner">
                          <button onClick={() => updateCartQty(c.item.id, -1)} className="text-slate-500 hover:text-rose-400 transition-colors p-1"><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-black min-w-[14px] text-center text-blue-400">{c.quantity}</span>
                          <button onClick={() => updateCartQty(c.item.id, 1)} className="text-slate-500 hover:text-emerald-400 transition-colors p-1"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button
                          onClick={() => removeFromCart(c.item.id)}
                          className="text-slate-700 hover:text-rose-500 transition-all transform hover:scale-110 p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-8 bg-slate-950/80 border-t border-slate-800/50 space-y-6 backdrop-blur-xl">
                  {/* Discount Selector */}
                  <div className="flex items-center justify-between gap-2 p-2 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-3">Desconto</span>
                    <div className="flex gap-1">
                      {[0, 5, 10, 15].map(d => (
                        <button
                          key={d}
                          onClick={() => setPosDiscount(d)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${posDiscount === d ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-400'}`}
                        >
                          {d}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <span>Subtotal</span>
                        <span>{formatCurrency(cartSubtotal)}</span>
                      </div>
                      {posDiscount > 0 && (
                        <div className="flex justify-between text-rose-400 text-[11px] font-bold uppercase tracking-wider">
                          <span>Desconto ({posDiscount}%)</span>
                          <span>-{formatCurrency(cartSubtotal * (posDiscount / 100))}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline text-white">
                      <span className="text-sm font-black uppercase tracking-[0.2em] opacity-40">Total</span>
                      <span className="text-4xl font-black tracking-tighter text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleCheckout('pix')}
                      disabled={cart.length === 0 || isProcessing}
                      className="group bg-white/5 hover:bg-white/10 border border-white/10 py-5 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                        <DollarSign className="w-6 h-6 text-blue-400" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">PIX</span>
                    </button>
                    <button
                      onClick={() => handleCheckout('card')}
                      disabled={cart.length === 0 || isProcessing}
                      className="group bg-white/5 hover:bg-white/10 border border-white/10 py-5 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <div className="p-2.5 rounded-xl bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
                        <CreditCard className="w-6 h-6 text-teal-400" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Cartão</span>
                    </button>
                    <button
                      onClick={() => handleCheckout('cash')}
                      disabled={cart.length === 0 || isProcessing}
                      className="col-span-2 relative group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-blue-600 rounded-[1.5rem] transition-all group-hover:bg-blue-500 shadow-xl shadow-blue-950/20" />
                      <div className="relative py-5 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-30">
                        <Banknote className="w-6 h-6 text-white" />
                        <span className="font-black text-[11px] uppercase tracking-[0.2em] text-white">Dinheiro</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Receipt Modal */}
                {showReceipt && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                      <div className="p-8 text-center bg-emerald-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 opacity-10 rounded-full -mr-16 -mt-16 blur-3xl wave-bg"></div>
                        <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                          <CheckCircle className="w-10 h-10" />
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">Venda Sucesso!</h4>
                        <p className="text-emerald-700 font-bold text-sm mt-1">Recibo gerado para {showReceipt.method.toUpperCase()}</p>
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {showReceipt.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                              <div>
                                <p className="font-bold text-slate-800">{item.item.name}</p>
                                <p className="text-[11px] text-slate-400 font-medium">{item.quantity} {item.item.unit} x {formatCurrency(item.item.unitValue)}</p>
                              </div>
                              <span className="font-black text-slate-700">{formatCurrency(item.quantity * item.item.unitValue)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t-2 border-dashed border-slate-100 space-y-2">
                          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <span>Valor Final</span>
                            <span className="text-2xl font-black text-slate-900">{formatCurrency(showReceipt.total)}</span>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              const itemsHtml = showReceipt.items.map((i: any) => `
                         <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>${i.item.name} (${i.quantity}x)</span>
                            <span>${formatCurrency(i.item.unitValue * i.quantity)}</span>
                         </div>
                       `).join('');

                              printWindow.document.write(`
                         <html>
                           <head>
                             <title>Recibo ALSF</title>
                             <style>
                               body { font-family: 'Courier New', monospace; width: 80mm; padding: 10px; font-size: 12px; }
                               .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                               .footer { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; text-align: center; font-size: 10px; }
                               .total { font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; margin-top: 10px; }
                             </style>
                           </head>
                           <body>
                             <div class="header">
                               <strong>LAR SÃO FRANCISCO NA PROVIDÊNCIA DE DEUS</strong><br/>
                               RECIBO DE VENDA PDV<br/>
                               ${new Date().toLocaleString()}
                             </div>
                             ${itemsHtml}
                             <div class="total">
                               <span>TOTAL:</span>
                               <span>${formatCurrency(showReceipt.total)}</span>
                             </div>
                             <div class="footer">
                               Pagamento: ${showReceipt.method.toUpperCase()}<br/>
                               Obrigado por ajudar nossa Missão!
                             </div>
                             <script>
                               window.onload = () => { window.print(); window.close(); };
                             </script>
                           </body>
                         </html>
                       `);
                              printWindow.document.close();
                            }
                          }}
                          className="w-full mb-3 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all border border-slate-200"
                        >
                          <Printer className="w-4 h-4" /> IMPRIMIR RECIBO (TÉRMICA)
                        </button>
                        <button
                          onClick={() => setShowReceipt(null)}
                          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                          FECHAR RECIBO
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  const renderUnderConstruction = (moduleName: string) => (
    <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
      <div className="bg-slate-100 p-6 rounded-full mb-4">
        <Store className="w-12 h-12 text-slate-300" />
      </div>
      <h2 className="text-xl font-bold text-slate-600 mb-2">Módulo {moduleName}</h2>
      <p className="text-sm">Esta funcionalidade está em desenvolvimento.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 relative">
      {/* Mobile Sidebar Overlay (now controlled by isMoreMenuOpen for the bottom drawer) */}
      {isMoreMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMoreMenuOpen(false)}
        />
      )}

      {/* DESKTOP SIDEBAR - Premium Look */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 overflow-y-auto shrink-0 shadow-2xl z-30">
        {/* Brand Header */}
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500" />
              <img src="/logo alsf.webp" alt="ALSF" className="relative w-12 h-12 object-contain bg-white rounded-xl p-1.5 ring-1 ring-slate-700 shadow-xl" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white leading-tight tracking-tight text-[11px]">Lar São Francisco na Providência de Deus</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/50 rounded-lg p-2 border border-slate-800/50 pl-3 ml-4 relative">
            <div className="absolute -left-4 top-1/2 w-4 h-px bg-slate-700"></div>
            <div className="absolute -left-4 bottom-1/2 h-10 w-px border-l border-slate-700"></div>
            <img src="/logo fraternidade alsf.png" alt="Fraternidade" className="w-8 h-8 object-contain shrink-0 drop-shadow-md bg-white/10 rounded-md p-1" />
            <div className="flex-1">
              <span className="text-xs text-slate-300 font-semibold tracking-wide">Fraternidade ALSF</span>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">São Francisco de Assis</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
          {/* Dashboard */}
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group ${activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-900/20'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-teal-200' : 'text-slate-500 group-hover:text-teal-400'} transition-colors`} />
            Visão Geral
          </button>

          {/* DIA DA AÇÃO */}
          {(allowedTabs.some(t => ['reception', 'triage', 'consultation', 'pharmacy'].includes(t))) && (
            <div>
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Dia da Ação</p>
              <div className="space-y-1">
                {allowedTabs.includes('reception') && (
                  <button
                    onClick={() => handleTabChange('reception')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'reception' ? 'bg-blue-600/10 text-blue-400 border-l-[3px] border-blue-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <UserPlus className="w-4 h-4 shrink-0 group-hover:text-blue-400 transition-colors" /> Recepção
                  </button>
                )}
                {allowedTabs.includes('triage') && (
                  <button
                    onClick={() => handleTabChange('triage')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'triage' ? 'bg-amber-600/10 text-amber-400 border-l-[3px] border-amber-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <Activity className="w-4 h-4 shrink-0 group-hover:text-amber-400 transition-colors" /> Triagem
                  </button>
                )}
                {allowedTabs.includes('consultation') && (
                  <button
                    onClick={() => handleTabChange('consultation')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'consultation' ? 'bg-emerald-600/10 text-emerald-400 border-l-[3px] border-emerald-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <Stethoscope className="w-4 h-4 shrink-0 group-hover:text-emerald-400 transition-colors" /> Consultório
                  </button>
                )}
                {allowedTabs.includes('pharmacy') && (
                  <button
                    onClick={() => handleTabChange('pharmacy')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'pharmacy' ? 'bg-purple-600/10 text-purple-400 border-l-[3px] border-purple-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <Pill className="w-4 h-4 shrink-0 group-hover:text-purple-400 transition-colors" /> Farmácia
                  </button>
                )}
              </div>
            </div>
          )}

          {/* GESTÃO */}
          {(allowedTabs.some(t => ['volunteers', 'events', 'beneficiaries', 'inventory', 'financial', 'approvals', 'fundraising', 'pos'].includes(t))) && (
            <div>
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Gestão</p>
              <div className="space-y-1">
                {allowedTabs.includes('beneficiaries') && (
                  <button
                    onClick={() => handleTabChange('beneficiaries')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'beneficiaries' ? 'bg-cyan-600/10 text-cyan-400 border-l-[3px] border-cyan-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <FileText className="w-4 h-4 shrink-0 group-hover:text-cyan-400 transition-colors" /> Cadastro Geral
                  </button>
                )}
                {allowedTabs.includes('volunteers') && (
                  <button
                    onClick={() => handleTabChange('volunteers')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'volunteers' ? 'bg-rose-600/10 text-rose-400 border-l-[3px] border-rose-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <Heart className="w-4 h-4 shrink-0 group-hover:text-rose-400 transition-colors" /> Voluntários
                  </button>
                )}
                {allowedTabs.includes('events') && (
                  <button
                    onClick={() => handleTabChange('events')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'events' ? 'bg-orange-600/10 text-orange-400 border-l-[3px] border-orange-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <Megaphone className="w-4 h-4 shrink-0 group-hover:text-orange-400 transition-colors" /> Eventos
                  </button>
                )}
                {allowedTabs.includes('inventory') && (
                  <button
                    onClick={() => handleTabChange('inventory')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'inventory' ? 'bg-indigo-600/10 text-indigo-400 border-l-[3px] border-indigo-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <Package className="w-4 h-4 shrink-0 group-hover:text-indigo-400 transition-colors" /> Estoque
                  </button>
                )}
                {allowedTabs.includes('financial') && (
                  <button
                    onClick={() => handleTabChange('financial')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'financial' ? 'bg-yellow-600/10 text-yellow-400 border-l-[3px] border-yellow-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <DollarSign className="w-4 h-4 shrink-0 group-hover:text-yellow-400 transition-colors" /> Financeiro
                  </button>
                )}
                {allowedTabs.includes('approvals') && (
                  <button
                    onClick={() => handleTabChange('approvals')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'approvals' ? 'bg-teal-600/10 text-teal-400 border-l-[3px] border-teal-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0 group-hover:text-teal-400 transition-colors" /> Aprovações
                  </button>
                )}
                {allowedTabs.includes('fundraising') && (
                  <button
                    onClick={() => handleTabChange('fundraising')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'fundraising' ? 'bg-pink-600/10 text-pink-400 border-l-[3px] border-pink-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <HandCoins className="w-4 h-4 shrink-0 group-hover:text-pink-400 transition-colors" /> Arrecadação
                  </button>
                )}
                {allowedTabs.includes('pos') && (
                  <button
                    onClick={() => handleTabChange('pos')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'pos' ? 'bg-blue-600/10 text-blue-400 border-l-[3px] border-blue-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <Store className="w-4 h-4 shrink-0 group-hover:text-blue-400 transition-colors" /> PDV
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SISTEMA (Desktop) */}
          {(allowedTabs.includes('users') || user?.role === 'admin') && (
            <div>
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Sistema</p>
              <div className="space-y-1">
                <button
                  onClick={() => { }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-slate-500 cursor-not-allowed hover:bg-slate-800/30`}
                >
                  <Settings className="w-4 h-4 shrink-0" /> Configurações
                </button>
                {allowedTabs.includes('users') && (
                  <button
                    onClick={() => handleTabChange('users')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'users' ? 'bg-slate-700/50 text-white border-l-[3px] border-white pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <UserCheck className="w-4 h-4 shrink-0 group-hover:text-white transition-colors" /> Usuários
                  </button>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* User Footer (Desktop) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
          {/* Botão Modo Missão (Desktop Sidebar) */}
          <button
            onClick={() => setIsMissionPanelOpen(true)}
            className={`w-full mb-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${offlineModeActive
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-700/60 hover:text-slate-200'
              }`}
            title="Configurar Modo Missão Offline"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${offlineModeActive ? 'bg-amber-400' : 'bg-slate-600'}`} />
            {offlineModeActive ? '🏕️ Modo Missão ATIVO' : 'Modo Missão Offline'}
          </button>
          <div className="flex items-center justify-between gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-blue-900/20">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate">{user?.name || 'Usuário'}</p>
                <p className="text-[10px] text-teal-400 truncate capitalize font-medium tracking-wide">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION DRAWER - The "More" Menu */}
      <div className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden rounded-t-[2rem] bg-slate-900 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.3)] border-t border-slate-800 max-h-[85vh] overflow-hidden flex flex-col ${isMoreMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}>

        {/* Drawer Handle */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsMoreMenuOpen(false)}>
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Drawer Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Menu Principal</h3>
            <p className="text-xs text-slate-400">Selecione uma opção para navegar</p>
          </div>
          <button onClick={() => setIsMoreMenuOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Card in Drawer */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{user?.name}</p>
                <p className="text-xs text-teal-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <button onClick={logout} className="p-2 bg-slate-900 rounded-xl text-red-400 hover:bg-red-900/20 border border-slate-800">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 pb-24">
          {/* Same navigation logic as sidebar but tailored for mobile list */}
          <div className="grid grid-cols-2 gap-3">
            {/* Dashboard Tile */}
            <button
              onClick={() => { handleTabChange('dashboard'); setIsMoreMenuOpen(false); }}
              className={`col-span-2 flex items-center gap-3 p-4 rounded-2xl border transition-all ${activeTab === 'dashboard' ? 'bg-teal-600 border-teal-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-bold">Visão Geral</span>
            </button>

            {allowedTabs.includes('reception') && (
              <button onClick={() => { handleTabChange('reception'); setIsMoreMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700 text-blue-400 hover:bg-slate-700">
                <UserPlus className="w-6 h-6" />
                <span className="text-xs font-medium">Recepção</span>
              </button>
            )}
            {allowedTabs.includes('triage') && (
              <button onClick={() => { handleTabChange('triage'); setIsMoreMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700 text-amber-400 hover:bg-slate-700">
                <Activity className="w-6 h-6" />
                <span className="text-xs font-medium">Triagem</span>
              </button>
            )}
            {allowedTabs.includes('consultation') && (
              <button onClick={() => { handleTabChange('consultation'); setIsMoreMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700 text-emerald-400 hover:bg-slate-700">
                <Stethoscope className="w-6 h-6" />
                <span className="text-xs font-medium">Médico</span>
              </button>
            )}
            {allowedTabs.includes('pharmacy') && (
              <button onClick={() => { handleTabChange('pharmacy'); setIsMoreMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700 text-purple-400 hover:bg-slate-700">
                <Pill className="w-6 h-6" />
                <span className="text-xs font-medium">Farmácia</span>
              </button>
            )}
            {allowedTabs.includes('beneficiaries') && (
              <button onClick={() => { handleTabChange('beneficiaries'); setIsMoreMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700 text-cyan-400 hover:bg-slate-700">
                <FileText className="w-6 h-6" />
                <span className="text-xs font-medium">Cadastro</span>
              </button>
            )}
            {allowedTabs.includes('inventory') && (
              <button onClick={() => { handleTabChange('inventory'); setIsMoreMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700 text-indigo-400 hover:bg-slate-700">
                <Package className="w-6 h-6" />
                <span className="text-xs font-medium">Estoque</span>
              </button>
            )}
            {allowedTabs.includes('users') && (
              <button onClick={() => { handleTabChange('users'); setIsMoreMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700 text-slate-300 hover:bg-slate-700">
                <UserCheck className="w-6 h-6" />
                <span className="text-xs font-medium">Usuários</span>
              </button>
            )}
            {allowedTabs.includes('events') && (
              <button onClick={() => { handleTabChange('events'); setIsMoreMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700 text-orange-400 hover:bg-slate-700">
                <Megaphone className="w-6 h-6" />
                <span className="text-xs font-medium">Eventos</span>
              </button>
            )}
          </div>

          {/* List View for other items */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Outros Módulos</p>
            {allowedTabs.includes('volunteers') && (
              <button onClick={() => { handleTabChange('volunteers'); setIsMoreMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800">
                <Heart className="w-5 h-5 text-rose-400" /> Voluntários
              </button>
            )}
            {allowedTabs.includes('financial') && (
              <button onClick={() => { handleTabChange('financial'); setIsMoreMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800">
                <DollarSign className="w-5 h-5 text-yellow-400" /> Financeiro
              </button>
            )}
            {allowedTabs.includes('approvals') && (
              <button onClick={() => { handleTabChange('approvals'); setIsMoreMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800">
                <ShieldCheck className="w-5 h-5 text-teal-400" /> Aprovações
              </button>
            )}
            {allowedTabs.includes('fundraising') && (
              <button onClick={() => { handleTabChange('fundraising'); setIsMoreMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800">
                <HandCoins className="w-5 h-5 text-pink-400" /> Arrecadação
              </button>
            )}
            {allowedTabs.includes('pos') && (
              <button onClick={() => { handleTabChange('pos'); setIsMoreMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800">
                <Store className="w-5 h-5 text-blue-400" /> PDV
              </button>
            )}
            {/* Add other items as needed */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full pb-24 md:pb-8">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Mobile hamburger removed - replaced by footer bar */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img src="/logo alsf.webp" alt="ALSF" className="w-12 h-12 md:w-14 md:h-14 object-contain bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm" />
                <div className="h-6 w-px bg-slate-300"></div>
                <img src="/logo fraternidade alsf.png" alt="Fraternidade" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 truncate">
                  {activeTab === 'dashboard' && 'Visão Geral'}
                  {activeTab === 'reception' && 'Recepção'}
                  {activeTab === 'triage' && 'Triagem'}
                  {activeTab === 'consultation' && 'Consultório Médico'}
                  {activeTab === 'pharmacy' && 'Farmácia'}
                  {activeTab === 'events' && 'Eventos e Promoções'}
                  {activeTab === 'financial' && 'Gestão Financeira'}
                  {activeTab === 'approvals' && 'Central de Aprovações'}
                  {activeTab === 'fundraising' && 'Gestão de Arrecadação'}
                  {activeTab === 'pos' && 'Ponto de Venda (PDV)'}
                  {activeTab === 'beneficiaries' && 'Cadastro Geral'}
                  {activeTab === 'inventory' && 'Controle de Estoque'}
                  {activeTab === 'calendar' && 'Calendário de Atividades'}
                  {activeTab === 'notifications' && 'Logs de Comunicação'}
                  {activeTab === 'volunteers' && 'Gestão de Voluntários'}
                  {activeTab === 'users' && 'Gestão de Usuários'}
                </h1>
                <p className="text-slate-500 text-xs md:text-sm mt-1 hidden sm:block">Sistema de gestão do Lar São Francisco na Providência de Deus</p>
              </div>
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-2 items-center">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar..." className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            {offlineModeActive && (
              <button
                onClick={() => setIsMissionPanelOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shrink-0 animate-pulse shadow-lg shadow-amber-200 transition-colors"
                title="Modo Missão Offline está ATIVO"
              >
                <span className="w-2 h-2 bg-white rounded-full" />
                <span className="hidden sm:inline">OFFLINE</span>
              </button>
            )}
            <button
              onClick={() => setIsMissionPanelOpen(true)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shrink-0 relative"
              title="Modo Missão Offline"
            >
              <Bell className="w-5 h-5" />
              {offlineModeActive && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && renderDashboard()}

        {/* Dia da Ação */}
        {activeTab === 'reception' && renderReception()}
        {activeTab === 'triage' && renderTriage()}
        {activeTab === 'consultation' && renderConsultation()}
        {activeTab === 'pharmacy' && renderPharmacy()}

        {/* Gestão */}
        {activeTab === 'volunteers' && renderVolunteers()}
        {activeTab === 'events' && renderMissions()}
        {activeTab === 'beneficiaries' && renderBeneficiaries()}
        {activeTab === 'inventory' && renderInventory()}

        {activeTab === 'financial' && renderFinancial()}
        {activeTab === 'approvals' && renderUnderConstruction('Aprovações')}
        {activeTab === 'fundraising' && renderFundraising()}
        {activeTab === 'pos' && renderPOS()}

        {/* Sistema */}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'users' && user?.role === 'admin' && renderUsers()}
      </main>

      {/* Modo Missão Offline Panel */}
      {isMissionPanelOpen && (
        <MissionModePanel onClose={() => setIsMissionPanelOpen(false)} />
      )}

      {/* MOBILE FOOTER BAR - Fixed Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 pb-safe shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'dashboard' ? 'bg-teal-50' : ''}`}>
            <LayoutDashboard className={`w-6 h-6 ${activeTab === 'dashboard' ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[10px] font-medium">Início</span>
        </button>

        {allowedTabs.includes('calendar') && (
          <button
            onClick={() => handleTabChange('calendar')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'calendar' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`p-1.5 rounded-xl ${activeTab === 'calendar' ? 'bg-teal-50' : ''}`}>
              <CalendarIcon className={`w-6 h-6 ${activeTab === 'calendar' ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] font-medium">Agenda</span>
          </button>
        )}

        {/* Dynamic FAB based on Role/Context */}
        <div className="relative -top-6">
          <button
            onClick={() => {
              // Reception Action: Open New Beneficiary Modal
              if (user?.role === 'recepcao' || (user?.role === 'admin' && activeTab === 'reception')) {
                setEditingBeneficiary(null);
                setIsBeneficiaryModalOpen(true);
                return;
              }
              // Triage Action: Go to Triage Tab (Worklist)
              if (user?.role === 'triagem' || (user?.role === 'admin' && activeTab === 'triage')) {
                handleTabChange('triage');
                return;
              }
              // Doctor Action: Go to Consultation Tab (Worklist)
              if (user?.role?.includes('medico') || (user?.role === 'admin' && activeTab === 'consultation')) {
                handleTabChange('consultation');
                return;
              }
              // Pharmacy Action: Go to Pharmacy Tab (Worklist)
              if (user?.role === 'farmacia' || (user?.role === 'admin' && activeTab === 'pharmacy')) {
                handleTabChange('pharmacy');
                return;
              }
              // Default: Open Menu
              setIsMoreMenuOpen(true);
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transform transition-transform active:scale-95 border-4 border-slate-50 ${(user?.role === 'recepcao' || activeTab === 'reception') ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30' :
              (user?.role === 'triagem' || activeTab === 'triage') ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30' :
                (user?.role?.includes('medico') || activeTab === 'consultation') ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-teal-500/30' :
                  (user?.role === 'farmacia' || activeTab === 'pharmacy') ? 'bg-gradient-to-br from-purple-400 to-violet-600 shadow-purple-500/30' :
                    'bg-gradient-to-br from-teal-500 to-blue-600 shadow-blue-500/30'
              }`}
          >
            {/* Dynamic Icon */}
            {(user?.role === 'recepcao' || (user?.role === 'admin' && activeTab === 'reception')) ? <UserPlus className="w-7 h-7" /> :
              (user?.role === 'triagem' || (user?.role === 'admin' && activeTab === 'triage')) ? <Activity className="w-7 h-7" /> :
                (user?.role?.includes('medico') || (user?.role === 'admin' && activeTab === 'consultation')) ? <Stethoscope className="w-7 h-7" /> :
                  (user?.role === 'farmacia' || (user?.role === 'admin' && activeTab === 'pharmacy')) ? <Pill className="w-7 h-7" /> :
                    <Plus className="w-7 h-7" /> // Default Menu Icon
            }
          </button>
        </div>

        <button
          onClick={() => handleTabChange('notifications')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'notifications' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative">
            <div className={`p-1.5 rounded-xl ${activeTab === 'notifications' ? 'bg-teal-50' : ''}`}>
              <Bell className={`w-6 h-6 ${activeTab === 'notifications' ? 'fill-current' : ''}`} />
            </div>
            {sortedNotifications.filter((n: any) => !n.read).length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </div>
          <span className="text-[10px] font-medium">Alertas</span>
        </button>

        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className={`flex flex-col items-center gap-1 transition-colors ${isMoreMenuOpen ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-1.5 rounded-xl ${isMoreMenuOpen ? 'bg-teal-50' : ''}`}>
            <Menu className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>

      {/* Modals */}
      {
        isItemModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">{editingItem ? 'Editar Item' : 'Novo Item'}</h3>
                <button onClick={() => setIsItemModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Material</label>
                  <input
                    value={newItem.name || ''}
                    onChange={e => {
                      setNewItem({ ...newItem, name: e.target.value });
                      if (itemErrors.name) setItemErrors({ ...itemErrors, name: '' });
                    }}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${itemErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                  />
                  {itemErrors.name && <p className="text-xs text-red-500 mt-1">{itemErrors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                    <select
                      value={newItem.category}
                      onChange={e => setNewItem({ ...newItem, category: e.target.value as Category })}
                      className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                    >
                      <option value="Medicamentos">Medicamentos</option>
                      <option value="Brinquedos">Brinquedos</option>
                      <option value="Alimentos">Alimentos</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                    <input
                      value={newItem.unit || ''}
                      onChange={e => {
                        setNewItem({ ...newItem, unit: e.target.value });
                        if (itemErrors.unit) setItemErrors({ ...itemErrors, unit: '' });
                      }}
                      placeholder="Ex: cx, kg"
                      className={`w-full p-2 border rounded-lg outline-none ${itemErrors.unit ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                    />
                    {itemErrors.unit && <p className="text-xs text-red-500 mt-1">{itemErrors.unit}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade Inicial</label>
                    <input
                      type="number"
                      value={newItem.quantity || 0}
                      onChange={e => {
                        setNewItem({ ...newItem, quantity: Number(e.target.value) });
                        if (itemErrors.quantity) setItemErrors({ ...itemErrors, quantity: '' });
                      }}
                      className="w-full p-2 border rounded-lg outline-none"
                    />
                    {itemErrors.quantity && <p className="text-xs text-red-500 mt-1">{itemErrors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor Unitário (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.unitValue || 0}
                      onChange={e => {
                        setNewItem({ ...newItem, unitValue: Number(e.target.value) });
                        if (itemErrors.unitValue) setItemErrors({ ...itemErrors, unitValue: '' });
                      }}
                      className="w-full p-2 border rounded-lg outline-none"
                    />
                    {itemErrors.unitValue && <p className="text-xs text-red-500 mt-1">{itemErrors.unitValue}</p>}
                  </div>
                </div>
                <button onClick={handleSaveItem} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 mt-2">
                  Salvar Item
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        isMissionModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {editingMission ? <Edit className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                    {editingMission ? 'Gerenciar Missão' : 'Nova Missão'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {editingMission ? editingMission.title : 'Preencha os dados para criar uma nova ação'}
                  </p>
                </div>
                <button onClick={() => setIsMissionModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 bg-white overflow-x-auto px-6">
                {[
                  { id: 'info', label: 'Geral', icon: <FileText className="w-4 h-4" /> },
                  { id: 'rh', label: 'RH', icon: <Users className="w-4 h-4" /> },
                  { id: 'resources', label: 'Insumos', icon: <Package className="w-4 h-4" /> },
                  { id: 'finance', label: 'Financeiro', icon: <DollarSign className="w-4 h-4" /> },
                  { id: 'enrollment', label: 'Cadastro', icon: <UserPlus className="w-4 h-4" /> },
                  { id: 'report', label: 'Prestação de Contas', icon: <ClipboardList className="w-4 h-4" /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMissionModalTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${missionModalTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                {missionModalTab === 'info' && (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Título da Ação</label>
                        <input
                          value={newMission.title || ''}
                          onChange={e => setNewMission({ ...newMission, title: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Ex: Ação Social no Centro"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Data Realização</label>
                        <input
                          type="date"
                          value={newMission.date || ''}
                          onChange={e => setNewMission({ ...newMission, date: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Horário (opcional)</label>
                        <input
                          type="time"
                          value={(newMission as any).time || ''}
                          onChange={e => setNewMission({ ...newMission, time: e.target.value } as any)}
                          className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Ex: 09:00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Descrição Detalhada</label>
                      <textarea
                        value={newMission.description || ''}
                        onChange={e => setNewMission({ ...newMission, description: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-lg outline-none h-32 resize-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Objetivos, local exato, público alvo..."
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Status da Ação</label>
                      <select
                        value={newMission.status || 'planned'}
                        onChange={e => setNewMission({ ...newMission, status: e.target.value as any })}
                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="planned">Planejada (Em Aberto)</option>
                        <option value="completed">Concluída (Realizada)</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </div>
                  </div>
                )}

                {missionModalTab === 'rh' && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" /> Equipe de Voluntários
                      </h4>
                      <div className="flex gap-2 mb-4">
                        <select id="volunteerSelect" className="flex-1 p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50">
                          <option value="">Selecione um voluntário...</option>
                          {(volunteers || []).filter(v => !newMission.volunteerIds?.includes(v.id)).map(v => (
                            <option key={v.id} value={v.id}>{v.name} ({v.role})</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const select = document.getElementById('volunteerSelect') as HTMLSelectElement;
                            if (select.value) {
                              setNewMission({
                                ...newMission,
                                volunteerIds: [...(newMission.volunteerIds || []), select.value]
                              });
                            }
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                        >
                          Adicionar
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(!newMission.volunteerIds || newMission.volunteerIds.length === 0) ? (
                          <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm">
                            Nenhum voluntário alocado para esta missão.
                          </div>
                        ) : (
                          newMission.volunteerIds.map(vid => {
                            const vol = volunteers?.find(v => v.id === vid);
                            return (
                              <div key={vid} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                    {vol?.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-800 text-sm">{vol?.name}</p>
                                    <p className="text-xs text-slate-500">{vol?.role} • {vol?.phone}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setNewMission({
                                    ...newMission,
                                    volunteerIds: newMission.volunteerIds?.filter(id => id !== vid)
                                  })}
                                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {missionModalTab === 'resources' && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-600" /> Alocação de Materiais
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <select id="itemSelect" className="flex-1 p-2 border border-slate-200 rounded-lg text-sm bg-white">
                          {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit} disp)</option>)}
                        </select>
                        <input id="qtyInput" type="number" placeholder="Qtd" className="w-24 p-2 border border-slate-200 rounded-lg text-sm" />
                        <button
                          onClick={() => {
                            const select = document.getElementById('itemSelect') as HTMLSelectElement;
                            const input = document.getElementById('qtyInput') as HTMLInputElement;
                            const itemId = select.value;
                            const qty = Number(input.value);
                            if (qty > 0) {
                              const existing = newMission.allocatedItems?.find(a => a.itemId === itemId);
                              let newAlloc;
                              if (existing) {
                                newAlloc = newMission.allocatedItems?.map(a => a.itemId === itemId ? { ...a, quantity: a.quantity + qty } : a);
                              } else {
                                newAlloc = [...(newMission.allocatedItems || []), { itemId, quantity: qty }];
                              }
                              setNewMission({ ...newMission, allocatedItems: newAlloc });
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm"
                        >
                          Adicionar Item
                        </button>
                      </div>

                      <div className="space-y-2">
                        {newMission.allocatedItems?.map((alloc, idx) => {
                          const item = items.find(i => i.id === alloc.itemId);
                          return (
                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                              <div>
                                <p className="font-medium text-slate-800 text-sm">{item?.name}</p>
                                <p className="text-xs text-slate-400 capitalize">{item?.category}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-bold bg-slate-100 px-2 py-1 rounded text-sm">{alloc.quantity} {item?.unit}</span>
                                <button
                                  onClick={() => {
                                    setNewMission({
                                      ...newMission,
                                      allocatedItems: newMission.allocatedItems?.filter(a => a.itemId !== alloc.itemId)
                                    });
                                  }}
                                  className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                                ><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          );
                        })}
                        {(!newMission.allocatedItems || newMission.allocatedItems.length === 0) && (
                          <div className="text-center py-6 text-slate-400 italic">Nenhum recurso alocado.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {missionModalTab === 'finance' && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Orçamento Disponível</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                          <input
                            type="number"
                            value={newMission.financial?.budget || 0}
                            onChange={e => setNewMission({
                              ...newMission,
                              financial: { ...newMission.financial, budget: Number(e.target.value), expenses: newMission.financial?.expenses || [] }
                            })}
                            className="w-full pl-8 pr-4 py-2 text-lg font-bold text-slate-800 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <div className="bg-slate-800 p-4 rounded-xl text-white">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Saldo Atual</label>
                        <p className={`text-2xl font-bold ${((newMission.financial?.budget || 0) - (newMission.financial?.expenses?.reduce((acc, e) => acc + e.value, 0) || 0)) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {formatCurrency((newMission.financial?.budget || 0) - (newMission.financial?.expenses?.reduce((acc, e) => acc + e.value, 0) || 0))}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-yellow-500" /> Registro de Despesas
                      </h4>

                      <div className="flex flex-col sm:flex-row gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <input id="expDesc" placeholder="Descrição da despesa" className="flex-1 p-2 border border-slate-200 rounded-lg text-sm" />
                        <input id="expVal" type="number" placeholder="Valor (R$)" className="w-24 p-2 border border-slate-200 rounded-lg text-sm" />
                        <select id="expCat" className="p-2 border border-slate-200 rounded-lg text-sm bg-white">
                          <option value="Transporte">Transporte</option>
                          <option value="Alimentação">Alimentação</option>
                          <option value="Materiais">Materiais</option>
                          <option value="Outros">Outros</option>
                        </select>
                        <button
                          onClick={() => {
                            const desc = (document.getElementById('expDesc') as HTMLInputElement).value;
                            const val = Number((document.getElementById('expVal') as HTMLInputElement).value);
                            const cat = (document.getElementById('expCat') as HTMLSelectElement).value;

                            if (desc && val > 0) {
                              const newExp = { id: Math.random().toString(36).substr(2, 9), description: desc, value: val, category: cat };
                              setNewMission({
                                ...newMission,
                                financial: {
                                  budget: newMission.financial?.budget || 0,
                                  expenses: [...(newMission.financial?.expenses || []), newExp]
                                }
                              });
                              (document.getElementById('expDesc') as HTMLInputElement).value = '';
                              (document.getElementById('expVal') as HTMLInputElement).value = '';
                            }
                          }}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm"
                        >Launch</button>
                      </div>

                      <div className="space-y-2">
                        {newMission.financial?.expenses?.map((exp) => (
                          <div key={exp.id} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{exp.description}</p>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{exp.category}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-700">{formatCurrency(exp.value)}</span>
                              <button
                                onClick={() => setNewMission({
                                  ...newMission,
                                  financial: {
                                    ...newMission.financial!,
                                    expenses: newMission.financial!.expenses.filter(e => e.id !== exp.id)
                                  }
                                })}
                                className="text-red-400 hover:text-red-600"
                              ><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                        {(!newMission.financial?.expenses || newMission.financial.expenses.length === 0) && (
                          <div className="text-center py-4 text-slate-400 italic text-sm">Nenhuma despesa lançada.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {missionModalTab === 'enrollment' && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-cyan-600" /> Beneficiários Participantes
                        </h4>
                        <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded-full font-bold">Total: {newMission.beneficiaryIds?.length || 0}</span>
                      </div>

                      <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input id="benSearch" placeholder="Buscar beneficiário..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                            onChange={(e) => {
                              // Implement local filter if needed, or rely on dropdown logic below
                            }}
                          />
                        </div>
                      </div>

                      <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg mb-4 bg-slate-50">
                        {beneficiaries
                          .filter(b => !newMission.beneficiaryIds?.includes(b.id))
                          .slice(0, 50) // Limit list
                          .map(b => (
                            <div key={b.id} className="flex justify-between items-center p-2 hover:bg-white cursor-pointer border-b border-slate-100 last:border-0"
                              onClick={() => setNewMission({
                                ...newMission,
                                beneficiaryIds: [...(newMission.beneficiaryIds || []), b.id]
                              })}
                            >
                              <span className="text-sm text-slate-700">{b.name} <span className="text-slate-400 text-xs">({b.document})</span></span>
                              <Plus className="w-4 h-4 text-emerald-500" />
                            </div>
                          ))}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Lista de Inscritos</p>
                        {newMission.beneficiaryIds?.map(bId => {
                          const ben = beneficiaries.find(b => b.id === bId);
                          return (
                            <div key={bId} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                              <span className="text-sm font-medium text-slate-700">{ben?.name}</span>
                              <button
                                onClick={() => setNewMission({
                                  ...newMission,
                                  beneficiaryIds: newMission.beneficiaryIds?.filter(id => id !== bId)
                                })}
                                className="text-red-400 hover:text-red-600"
                              ><X className="w-3 h-3" /></button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {missionModalTab === 'report' && (
                  <div className="space-y-6 max-w-3xl mx-auto h-full flex flex-col">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-slate-600" /> Relatório e Prestação de Contas
                      </h4>
                      <div className="flex-1">
                        <textarea
                          value={newMission.report || ''}
                          onChange={e => setNewMission({ ...newMission, report: e.target.value })}
                          className="w-full h-full p-4 border border-slate-200 rounded-lg outline-none resize-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
                          placeholder="Descreva aqui os resultados da ação, pontos positivos, ocorrências e fechamento..."
                        ></textarea>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        * Este campo é fundamental para a transparência e histórico das ações do Lar.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                <button onClick={() => setIsMissionModalOpen(false)} className="px-6 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveMission} className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors">
                  {editingMission ? 'Salvar Alterações' : 'Criar Missão'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        isAttendanceModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl p-0 h-[85vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">{editingAttendance ? 'Editar Atendimento' : 'Novo Atendimento'}</h3>
                <button onClick={() => setIsAttendanceModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 px-6 gap-6">
                <button
                  onClick={() => setAttendanceModalTab('details')}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${attendanceModalTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  Dados Gerais
                </button>
                <button
                  onClick={() => setAttendanceModalTab('people')}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${attendanceModalTab === 'people' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  Lista de Presença ({newAttendance.beneficiaryIds?.length || 0})
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {attendanceModalTab === 'details' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Local</label>
                        <select
                          value={newAttendance.locationType}
                          onChange={e => setNewAttendance({ ...newAttendance, locationType: e.target.value as LocationType })}
                          className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                        >
                          <option value="Presídio">Presídio</option>
                          <option value="Comunidade">Comunidade</option>
                          <option value="Praça">Praça</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                        <input
                          type="date"
                          value={newAttendance.date || ''}
                          onChange={e => setNewAttendance({ ...newAttendance, date: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Local</label>
                      <input
                        placeholder="Ex: Praça da Sé, Presídio Central..."
                        value={newAttendance.locationName || ''}
                        onChange={e => setNewAttendance({ ...newAttendance, locationName: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                      <input
                        placeholder="Nome do responsável pela ação"
                        value={newAttendance.responsible || ''}
                        onChange={e => setNewAttendance({ ...newAttendance, responsible: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Atendimento</label>
                      <textarea
                        rows={3}
                        value={newAttendance.description || ''}
                        onChange={e => setNewAttendance({ ...newAttendance, description: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Pessoas (Estimativa)</label>
                        <input
                          type="number"
                          value={newAttendance.peopleServed || 0}
                          onChange={e => setNewAttendance({ ...newAttendance, peopleServed: parseInt(e.target.value) })}
                          className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          {(newAttendance.beneficiaryIds?.length || 0) > 0
                            ? 'Será atualizado automaticamente pela lista.'
                            : 'Preencha manualmente se não usar lista.'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                          value={newAttendance.status}
                          onChange={e => setNewAttendance({ ...newAttendance, status: e.target.value as any })}
                          className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                        >
                          <option value="Scheduled">Agendado</option>
                          <option value="Completed">Realizado</option>
                          <option value="Cancelled">Cancelado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Search / Add Existing */}
                    <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> Buscar ou Cadastrar Pessoa
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={personSearchQuery}
                            onChange={e => setPersonSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {personSearchQuery && (
                        <div className="bg-white border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                          {beneficiaries
                            .filter(b => b.name.toLowerCase().includes(personSearchQuery.toLowerCase()) && !newAttendance.beneficiaryIds?.includes(b.id))
                            .map(b => (
                              <div key={b.id} className="p-2 hover:bg-indigo-50 flex justify-between items-center cursor-pointer"
                                onClick={() => {
                                  setNewAttendance({
                                    ...newAttendance,
                                    beneficiaryIds: [...(newAttendance.beneficiaryIds || []), b.id]
                                  });
                                  setPersonSearchQuery('');
                                }}
                              >
                                <div>
                                  <div className="text-sm font-medium text-slate-700">{b.name}</div>
                                  <div className="text-xs text-slate-400">{b.document}</div>
                                </div>
                                <Plus className="w-4 h-4 text-indigo-600" />
                              </div>
                            ))}
                          {beneficiaries.filter(b => b.name.toLowerCase().includes(personSearchQuery.toLowerCase())).length === 0 && (
                            <div className="p-3 text-center">
                              <p className="text-sm text-slate-500 mb-2">Ninguém encontrado.</p>
                              <div className="space-y-2 bg-slate-50 p-3 rounded border border-slate-100">
                                <input
                                  placeholder="Nome completo"
                                  value={newPersonForm.name || personSearchQuery}
                                  onChange={e => setNewPersonForm({ ...newPersonForm, name: e.target.value })}
                                  className="w-full p-2 text-sm border rounded"
                                />
                                <input
                                  placeholder="Documento (CPF/RG)"
                                  value={newPersonForm.document || ''}
                                  onChange={e => setNewPersonForm({ ...newPersonForm, document: e.target.value })}
                                  className="w-full p-2 text-sm border rounded"
                                />
                                <input
                                  placeholder="Necessidades especiais / Obs"
                                  value={newPersonForm.needs || ''}
                                  onChange={e => setNewPersonForm({ ...newPersonForm, needs: e.target.value })}
                                  className="w-full p-2 text-sm border rounded"
                                />
                                <button
                                  onClick={createBeneficiary}
                                  className="w-full bg-indigo-600 text-white text-sm py-2 rounded font-medium hover:bg-indigo-700"
                                >
                                  Cadastrar e Adicionar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Current List */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pessoas na Lista ({newAttendance.beneficiaryIds?.length || 0})</h4>
                      <div className="space-y-2">
                        {newAttendance.beneficiaryIds?.map(bId => {
                          const person = beneficiaries.find(b => b.id === bId);
                          if (!person) return null;
                          return (
                            <div key={bId} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold">
                                  {person.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-800">{person.name}</div>
                                  {person.needs && <div className="text-xs text-orange-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {person.needs}</div>}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setNewAttendance({
                                    ...newAttendance,
                                    beneficiaryIds: newAttendance.beneficiaryIds?.filter(id => id !== bId)
                                  });
                                }}
                                className="text-slate-400 hover:text-red-500 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                        {(!newAttendance.beneficiaryIds || newAttendance.beneficiaryIds.length === 0) && (
                          <p className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            Nenhuma pessoa adicionada a este atendimento ainda.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-white">
                <button onClick={handleSaveAttendance} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                  Salvar Atendimento
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Main Beneficiary Modal (Used in the new Beneficiaries tab) */}
      {
        isBeneficiaryModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">{editingBeneficiary ? 'Editar Cadastro' : 'Novo Beneficiário'}</h3>
                <button onClick={() => { setIsBeneficiaryModalOpen(false); setEditingBeneficiary(null); setUploadedPhotoUrl(null); }}><X className="text-slate-400 hover:text-slate-600" /></button>
              </div>
              <form onSubmit={handleSaveMainBeneficiary} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="flex gap-4">
                  <div className="flex-none w-32">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Foto</label>
                    <div className="w-32 h-32 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 relative overflow-hidden">
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          <span className="text-[10px] text-indigo-600 font-medium">Enviando...</span>
                        </div>
                      ) : (uploadedPhotoUrl || editingBeneficiary?.photoUrl) ? (
                        <>
                          <img src={uploadedPhotoUrl || editingBeneficiary?.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedPhotoUrl(null);
                              if (editingBeneficiary) {
                                setEditingBeneficiary({ ...editingBeneficiary, photoUrl: '' });
                              }
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 shadow-md"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 mb-1" />
                          <span className="text-[10px]">Sem Foto</span>
                        </>
                      )}
                    </div>
                    {/* Camera and Gallery buttons */}
                    <div className="flex gap-1 mt-2">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                          <Camera className="w-3 h-3" />
                          Foto
                        </div>
                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageChange} />
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-300 transition-colors">
                          <FileText className="w-3 h-3" />
                          Galeria
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>
                    <input type="hidden" name="photoUrl" value={uploadedPhotoUrl || editingBeneficiary?.photoUrl || ''} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                      <input required name="name" defaultValue={editingBeneficiary?.name || ''} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Nome completo do beneficiário" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sexo Biológico</label>
                        <select name="biologicalSex" defaultValue={editingBeneficiary?.biologicalSex || ''} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                          <option value="">Selecione</option>
                          <option value="male">Masculino</option>
                          <option value="female">Feminino</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor / Raça</label>
                        <select name="color" defaultValue={editingBeneficiary?.color || ''} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                          <option value="">Selecione</option>
                          <option value="white">Branca</option>
                          <option value="black">Preta</option>
                          <option value="brown">Parda</option>
                          <option value="yellow">Amarela</option>
                          <option value="indigenous">Indígena</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Nasc.</label>
                    <input type="date" name="birthDate" defaultValue={editingBeneficiary?.birthDate || ''} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      onChange={(e) => {
                        const birthDate = new Date(e.target.value);
                        const today = new Date();
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const m = today.getMonth() - birthDate.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                          age--;
                        }
                        const ageInput = document.querySelector('input[name="age"]') as HTMLInputElement;
                        if (ageInput) ageInput.value = age.toString();
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Idade</label>
                    <input type="number" name="age" defaultValue={editingBeneficiary?.age || ''} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" readOnly />
                  </div>
                  <div>
                    {/* Spacer or extra field */}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF</label>
                    <input name="cpf" defaultValue={editingBeneficiary?.cpf || ''} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RG</label>
                    <input name="rg" defaultValue={editingBeneficiary?.rg || ''} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="00.000.000-0" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Necessidades Especiais / Observações</label>
                  <textarea name="needs" rows={3} defaultValue={editingBeneficiary?.needs || ''} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Ex: Diabético, Hipertenso, Cadeirante..."></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setIsBeneficiaryModalOpen(false); setEditingBeneficiary(null); }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">Salvar Cadastro</button>
                </div>
              </form>
            </div>
          </div>
        )
      }
      {
        isTriageModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50">
                <h3 className="font-bold text-amber-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Realizar Triagem
                </h3>
                <button
                  onClick={() => setIsTriageModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <p className="text-sm text-slate-500">Paciente</p>
                  <p className="font-bold text-slate-800 text-lg">{editingVisit?.beneficiaryName}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso (kg)</label>
                    <input
                      type="text"
                      value={triageForm?.weight || ''}
                      onChange={e => setTriageForm(prev => prev ? ({ ...prev, weight: e.target.value }) : null)}
                      className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="00.0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pressão</label>
                    <input
                      type="text"
                      value={triageForm?.bloodPressure || ''}
                      onChange={e => setTriageForm(prev => prev ? ({ ...prev, bloodPressure: e.target.value }) : null)}
                      className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="12/8"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Temp (°C)</label>
                    <input
                      type="text"
                      value={triageForm?.temperature || ''}
                      onChange={e => setTriageForm(prev => prev ? ({ ...prev, temperature: e.target.value }) : null)}
                      className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="36.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sintomas / Queixa Principal</label>
                  <textarea
                    rows={3}
                    value={triageForm?.symptoms || ''}
                    onChange={e => setTriageForm(prev => prev ? ({ ...prev, symptoms: e.target.value }) : null)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    placeholder="Descreva os sintomas relatados..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações da Enfermagem</label>
                  <textarea
                    rows={2}
                    value={triageForm?.notes || ''}
                    onChange={e => setTriageForm(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button
                  onClick={() => setIsTriageModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTriage}
                  className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-amber-100"
                >
                  Concluir Triagem
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        isConsultationModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50">
                <h3 className="font-bold text-blue-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Atendimento Médico
                </h3>
                <button
                  onClick={() => setIsConsultationModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Panel: Patient Info & History */}
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-2">Paciente</h4>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">
                          {editingVisit?.beneficiaryName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{editingVisit?.beneficiaryName}</p>
                          <p className="text-xs text-slate-500">Prontuário: {editingVisit?.beneficiaryId.substring(0, 8)}</p>
                        </div>
                      </div>

                      {/* Triage Data */}
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 text-sm space-y-2">
                        <p className="font-bold text-amber-800 flex items-center gap-2">
                          <ClipboardList className="w-3 h-3" /> Dados da Triagem
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-xs text-amber-600 block">Pressão</span>
                            <span className="font-semibold">{editingVisit?.triage?.bloodPressure || '-'}</span>
                          </div>
                          <div>
                            <span className="text-xs text-amber-600 block">Temperatura</span>
                            <span className="font-semibold">{editingVisit?.triage?.temperature || '-'}</span>
                          </div>
                          <div>
                            <span className="text-xs text-amber-600 block">Peso</span>
                            <span className="font-semibold">{editingVisit?.triage?.weight || '-'}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-amber-600 block">Sintomas</span>
                          <p className="text-slate-700 italic">{editingVisit?.triage?.symptoms}</p>
                        </div>
                      </div>
                    </div>

                    {/* Previous History Placeholder */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-60">
                      <h4 className="font-bold text-slate-400 mb-2">Histórico (Em Breve)</h4>
                      <p className="text-xs text-slate-400">Histórico de atendimentos anteriores.</p>
                    </div>

                    {/* Mission Medications Panel (names only) */}
                    {(() => {
                      const allMissionsModal = missions && missions.length > 0 ? missions : INITIAL_MISSIONS;
                      const allItemsModal = items && items.length > 0 ? items : INITIAL_ITEMS;
                      const allVolsModal = volunteers || [];
                      const myVolModal = allVolsModal.find(
                        v => v.email?.toLowerCase() === user?.email?.toLowerCase()
                      );
                      const myMissionsModal = allMissionsModal.filter(m =>
                        m.status !== 'cancelled' &&
                        myVolModal && (m.volunteerIds || []).includes(myVolModal.id)
                      );
                      const upcomingModal = myMissionsModal.length > 0
                        ? myMissionsModal
                        : allMissionsModal.filter(m => m.status === 'planned').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 1);

                      const medNames: string[] = [];
                      upcomingModal.forEach(mission => {
                        (mission.allocatedItems || []).forEach(alloc => {
                          const itm = allItemsModal.find(i => i.id === alloc.itemId);
                          if (itm && itm.category === 'Medicamentos' && !medNames.includes(itm.name)) {
                            medNames.push(itm.name);
                          }
                        });
                      });

                      if (medNames.length === 0) return null;

                      return (
                        <div className="bg-white rounded-xl border border-teal-100 shadow-sm overflow-hidden">
                          <div className="px-4 py-3 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
                            <Pill className="w-3.5 h-3.5 text-teal-600" />
                            <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">Medicamentos Disponíveis na Missão</span>
                          </div>
                          <ul className="divide-y divide-slate-50 max-h-44 overflow-y-auto">
                            {medNames.map((name, i) => (
                              <li key={i} className="px-4 py-2 flex items-center gap-2 hover:bg-teal-50/40 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                                <span className="text-sm text-slate-700 font-medium">{name}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-50 italic">
                            {upcomingModal[0]?.title}
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right Panel: Consultation Form */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Prontuário / Evolução
                      </h4>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Diagnóstico / Hipótese Diagnóstica</label>
                        <textarea
                          rows={4}
                          value={consultationForm?.diagnosis || ''}
                          onChange={e => setConsultationForm(prev => prev ? ({ ...prev, diagnosis: e.target.value }) : null)}
                          className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
                          placeholder="Descreva o atendimento e diagnóstico..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Prescrição Médica</label>
                        <textarea
                          rows={6}
                          value={consultationForm?.prescription || ''}
                          onChange={e => setConsultationForm(prev => prev ? ({ ...prev, prescription: e.target.value }) : null)}
                          className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-slate-50"
                          placeholder="Medicamentos e posologia..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Notas Internas (Opcional)</label>
                        <input
                          type="text"
                          value={consultationForm?.internalNotes || ''}
                          onChange={e => setConsultationForm(prev => prev ? ({ ...prev, internalNotes: e.target.value }) : null)}
                          className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Observações visíveis apenas para equipe..."
                        />
                      </div>
                    </div>

                    {/* === Medication Selector from Mission === */}
                    {(() => {
                      const allMissionsMs = missions && missions.length > 0 ? missions : INITIAL_MISSIONS;
                      const allItemsMs = items && items.length > 0 ? items : INITIAL_ITEMS;
                      const allVolsMs = volunteers || [];
                      const myVolMs = allVolsMs.find(v => v.email?.toLowerCase() === user?.email?.toLowerCase());
                      const myMissionsMs = allMissionsMs.filter(m =>
                        m.status !== 'cancelled' && myVolMs && (m.volunteerIds || []).includes(myVolMs.id)
                      );
                      const upcomingMs = myMissionsMs.length > 0
                        ? myMissionsMs
                        : allMissionsMs.filter(m => m.status === 'planned').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 1);

                      const medNamesMs: string[] = [];
                      upcomingMs.forEach(mission => {
                        (mission.allocatedItems || []).forEach(alloc => {
                          const itm = allItemsMs.find(i => i.id === alloc.itemId);
                          if (itm && itm.category === 'Medicamentos' && !medNamesMs.includes(itm.name)) {
                            medNamesMs.push(itm.name);
                          }
                        });
                      });

                      if (medNamesMs.length === 0) return null;

                      const selected = Array.isArray(consultationForm?.selectedMedications) ? consultationForm.selectedMedications : [];
                      const toggleMed = (name: string) => {
                        setConsultationForm(prev => {
                          const currentSelected = Array.isArray(prev?.selectedMedications) ? prev.selectedMedications : [];
                          const already = currentSelected.includes(name);
                          return {
                            ...prev!,
                            selectedMedications: already
                              ? currentSelected.filter(m => m !== name)
                              : [...currentSelected, name]
                          };
                        });
                      };

                      return (
                        <div className="bg-white rounded-xl border border-teal-100 shadow-sm overflow-hidden">
                          <div className="px-4 py-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Pill className="w-4 h-4 text-teal-600" />
                              <span className="text-sm font-bold text-teal-800">Medicamentos Disponíveis na Missão</span>
                            </div>
                            {selected.length > 0 && (
                              <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold">
                                {selected.length} selecionado{selected.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <p className="px-4 pt-2 pb-1 text-xs text-slate-500 italic">Selecione os medicamentos que serão encaminhados para a farmácia:</p>
                          <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                            {medNamesMs.map((name) => {
                              const isChecked = selected.includes(name);
                              return (
                                <label
                                  key={name}
                                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-all select-none ${isChecked
                                    ? 'bg-teal-50 border-teal-300 shadow-sm'
                                    : 'border-slate-100 hover:bg-slate-50'
                                    }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="accent-teal-600 w-4 h-4 shrink-0"
                                    checked={isChecked}
                                    onChange={() => toggleMed(name)}
                                  />
                                  <span className={`text-sm font-medium ${isChecked ? 'text-teal-800' : 'text-slate-700'}`}>{name}</span>
                                </label>
                              );
                            })}
                          </div>
                          {selected.length > 0 && (
                            <div className="px-4 py-2 border-t border-teal-50 bg-teal-50/60">
                              <p className="text-xs text-teal-700 font-semibold">Encaminhados para farmácia: {selected.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex gap-3 justify-end">
                <button
                  onClick={() => setIsConsultationModalOpen(false)}
                  className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveConsultation}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Finalizar e Encaminhar
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        isPharmacyModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl h-[85vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
                <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Farmácia - Dispensação
                </h3>
                <button onClick={() => setIsPharmacyModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 space-y-6">
                {/* Prescription View */}
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                  <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Prescrição / Posologia
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-lg font-mono text-sm text-slate-700 whitespace-pre-wrap border border-blue-100">
                    {editingVisit?.doctor?.prescription || 'Nenhuma prescrição registrada.'}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Médico: {editingVisit?.doctor?.doctorName || 'N/A'}
                  </div>
                </div>

                {/* Medicamentos selecionados pelo médico */}
                {editingVisit?.doctor?.selectedMedications && editingVisit.doctor.selectedMedications.length > 0 && (
                  <div className="bg-teal-50 rounded-xl border border-teal-200 shadow-sm p-4">
                    <h4 className="font-bold text-teal-800 mb-3 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-teal-600" />
                      Medicamentos Indicados pelo Médico
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {editingVisit.doctor.selectedMedications.map((med, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-sm bg-white border border-teal-300 text-teal-800 px-3 py-1.5 rounded-full font-semibold shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                          {med}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-teal-600 italic">Use a lista abaixo para registrar as quantidades dispensadas de cada medicamento.</p>
                  </div>
                )}

                {/* Dispensing Area */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Itens a Dispensar
                  </h4>

                  <div className="flex flex-wrap gap-2 mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <select id="pharmacyItemSelect" className="flex-1 p-2 border border-slate-300 rounded-lg text-sm min-w-[200px]">
                      <option value="">Selecione um medicamento/item...</option>
                      {(items || []).filter(i => i.quantity > 0).map(i => (
                        <option key={i.id} value={i.id}>{i.name} (Disp: {i.quantity} {i.unit})</option>
                      ))}
                    </select>
                    <input id="pharmacyQtyInput" type="number" placeholder="Qtd" className="w-24 p-2 border border-slate-300 rounded-lg text-sm" min="1" />
                    <button
                      onClick={() => {
                        const select = document.getElementById('pharmacyItemSelect') as HTMLSelectElement;
                        const input = document.getElementById('pharmacyQtyInput') as HTMLInputElement;
                        const itemId = select.value;
                        const qty = Number(input.value);

                        if (itemId && qty > 0) {
                          const item = items?.find(i => i.id === itemId);
                          if (item && item.quantity >= qty) {
                            // Add to list
                            const existing = pharmacyForm.dispensedItems.find(d => d.itemId === itemId);
                            if (existing) {
                              if (item.quantity < (existing.quantity + qty)) {
                                alert(`Estoque insuficiente! Total necessário: ${existing.quantity + qty}, Disponível: ${item.quantity}`);
                                return;
                              }
                              setPharmacyForm(prev => ({
                                ...prev,
                                dispensedItems: prev.dispensedItems.map(d => d.itemId === itemId ? { ...d, quantity: d.quantity + qty } : d)
                              }));
                            } else {
                              setPharmacyForm(prev => ({
                                ...prev,
                                dispensedItems: [...prev.dispensedItems, { itemId, name: item.name, quantity: qty }]
                              }));
                            }
                            input.value = '';
                            select.value = '';
                          } else {
                            alert('Estoque insuficiente ou item inválido.');
                          }
                        }
                      }}
                      className="px-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
                    >
                      Adicionar
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-2 mb-2">
                      <span>Item</span>
                      <span>Qtd</span>
                      <span>Ação</span>
                    </div>
                    {pharmacyForm.dispensedItems.length === 0 ? (
                      <p className="text-center text-slate-400 text-sm py-4 italic">Nenhum item adicionado para dispensação.</p>
                    ) : (
                      pharmacyForm.dispensedItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded-lg">
                          <span className="font-medium text-slate-700">{item.name}</span>
                          <span className="font-bold bg-slate-100 px-2 py-1 rounded">{item.quantity} un</span>
                          <button
                            onClick={() => setPharmacyForm(prev => ({
                              ...prev,
                              dispensedItems: prev.dispensedItems.filter((_, i) => i !== idx)
                            }))}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Notas do Farmacêutico</label>
                  <textarea
                    rows={2}
                    value={pharmacyForm.notes}
                    onChange={e => setPharmacyForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none resize-none"
                    placeholder="Orientações dadas ao paciente..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex gap-3 justify-end">
                <button onClick={() => setIsPharmacyModalOpen(false)} className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50">Cancelar</button>
                <button
                  onClick={handleSavePharmacy}
                  className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center gap-2"
                  disabled={pharmacyForm.dispensedItems.length === 0 && !pharmacyForm.notes} // Allow notes only? Ideally usually deliver items.
                >
                  <Pill className="w-4 h-4" />
                  Concluir Dispensação
                </button>
              </div>
            </div>
          </div>
        )
      }

      <VolunteerModal
        isOpen={isVolunteerModalOpen}
        onClose={() => setIsVolunteerModalOpen(false)}
        onSave={handleSaveVolunteer}
        initialData={editingVolunteer}
      />

      <StockMovementModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onConfirm={handleStockMovementConfirm}
        items={items}
      />

      <FinancialModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
        onSave={handleSaveTransaction}
        initialData={newTransaction}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div >
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);

// Check if setup mode is requested via URL
const urlParams = new URLSearchParams(window.location.search);
const isSetupMode = urlParams.get('setup') === 'admin';

class ErrorBoundary extends React.Component<{ children: any }, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 font-sans min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Algo deu errado (Tela Branca)</h1>
          <p className="mb-4">Ocorreu um erro crítico na aplicação. Por favor, envie o erro abaixo para o suporte.</p>
          <pre className="bg-white p-4 rounded border border-red-200 overflow-auto text-sm">
            {this.state.error?.toString()}
            {'\n\nStack Trace:\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

root.render(
  isSetupMode ? (
    <ErrorBoundary><SetupAdmin /></ErrorBoundary>
  ) : (
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  )
);
