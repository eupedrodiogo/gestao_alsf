import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore } from './api/useFirestore';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './api/firebase';
import { PresentationDashboard } from './pages/PresentationDashboard';
import { createRoot } from 'react-dom/client';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import SetupAdmin from './pages/SetupAdmin';
import { MissionModePanel } from './pages/MissionModePanel';
import { PresidentDashboard } from './pages/PresidentDashboard';
import { MissionControl } from './pages/MissionControl';
import { isOfflineModeEnabled } from './hooks/offlineMode';
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
  ShieldAlert,
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

import { VolunteerModal } from './components/modals/VolunteerModal';
import { FinancialModal } from './components/modals/FinancialModal';

// --- Types ---

import { Category, LocationType, Item, AllocatedItem, Mission, Beneficiary, Attendance, NotificationLog, Volunteer, PatientVisit, Transaction } from './types/index';

// --- Instanciação de Utilitários e Mocks ---
import {
  INITIAL_ITEMS,
  INITIAL_BENEFICIARIES,
  INITIAL_MISSIONS,
  INITIAL_ATTENDANCES,
  MOCK_MONTHLY_STATS,
  MOCK_DEMAND_STATS,
  MOCK_PEOPLE_COST_STATS,
  MOCK_TRANSACTIONS
} from './utils/mocks';
import { formatCurrency, formatCompactNumber, exportToCSV } from './utils/index';

// --- Components ---
import { SimpleBarChart, DemandBarChart, PeopleCostChart } from './components/charts/DashboardCharts';
import { ToastContainer, Toast, ToastType } from './components/ui/Toast';
import { POSModule } from './modules/PDV/POSModule';
import { PharmacyModule } from './modules/Pharmacy/PharmacyModule';
import { FinancialModule } from './modules/Financial/FinancialModule';
import { VolunteersModule } from './modules/Volunteers/VolunteersModule';
import { BeneficiariesModule } from './modules/Beneficiaries/BeneficiariesModule';
import { InventoryModule } from './modules/Inventory/InventoryModule';
import { ClinicalModule } from './modules/Clinical/ClinicalModule';
import { CalendarModule } from './modules/Calendar/CalendarModule';
import { InstallPrompt } from './components/ui/InstallPrompt';
import { UserEditModal } from './components/modals/UserEditModal';
import { AuditModule } from './modules/Admin/AuditModule';





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
    admin: ['dashboard', 'reception', 'triage', 'consultation', 'pharmacy', 'volunteers', 'events', 'beneficiaries', 'inventory', 'financial', 'approvals', 'fundraising', 'pos', 'calendar', 'notifications', 'users', 'audit'],
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

  const allowedTabs = user?.allowedModules && user.allowedModules.length > 0
    ? user.allowedModules
    : (ROLE_TABS[user?.role || ''] || ['dashboard']);

  const defaultTab = DEFAULT_TAB[user?.role || ''] || 'dashboard';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'reception' | 'triage' | 'consultation' | 'pharmacy' | 'volunteers' | 'events' | 'beneficiaries' | 'inventory' | 'financial' | 'approvals' | 'fundraising' | 'pos' | 'calendar' | 'notifications' | 'users' | 'audit'>(() => {
    // Read saved tab from localStorage without role validation here,
    // because user?.role is still undefined at initialization time.
    // Role validation happens in the useEffect below once auth resolves.
    const savedTab = localStorage.getItem('activeTab');
    return (savedTab as any) || 'dashboard';
  });

  // When user role resolves, redirect to allowed tab if the saved one is not permitted
  useEffect(() => {
    if (user?.role) {
      const currentAllowed = user.allowedModules && user.allowedModules.length > 0
        ? user.allowedModules
        : (ROLE_TABS[user.role] || ['dashboard']);
      const currentDefault = DEFAULT_TAB[user.role] || 'dashboard';
      if (!currentAllowed.includes(activeTab)) {
        setActiveTab(currentDefault as any);
      }
    }
  }, [user]);

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

  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isBeneficiaryModalOpen, setIsBeneficiaryModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const [isMissionPanelOpen, setIsMissionPanelOpen] = useState(false);
  const offlineModeActive = isOfflineModeEnabled();




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

  const handleSaveTransaction = async (transactionData: Omit<Transaction, 'id'>, file?: File | null, transactionId?: string) => {
    try {
      let docUrl = transactionData.docUrl;

      if (file) {
        const storageRef = ref(storage, `transactions/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        docUrl = await getDownloadURL(snapshot.ref);
      }

      const dataToSave = { ...transactionData, docUrl };

      if (transactionId) {
        await updateTransactionFirestore(transactionId, dataToSave);
        showToast('Transação atualizada com sucesso', 'success');
      } else {
        await addTransactionFirestore(dataToSave);
        showToast('Transação registrada com sucesso', 'success');
      }
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
    <InventoryModule
      items={items || []}
      userRole={user?.role || ''}
      addItem={async (data) => {
        await addItemFirestore(data);
        addNotification('EMAIL', 'Coordenador', `Novo item cadastrado: ${data.name}`);
      }}
      updateItem={async (id, data) => {
        await updateItemFirestore(id, data);
        addNotification('EMAIL', 'Coordenador', `Item atualizado: ${data.name}`);
      }}
      handleStockMovement={handleStockMovementConfirm}
      showToast={showToast}
    />
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



  const renderBeneficiaries = () => (
    <BeneficiariesModule
      beneficiaries={beneficiaries || []}
      addBeneficiary={addBeneficiaryFirestore}
      updateBeneficiary={updateBeneficiaryFirestore}
      deleteBeneficiary={deleteBeneficiaryFirestore}
      userRole={user?.role || ''}
      showToast={showToast}
      openModal={(b) => {
        setEditingBeneficiary(b || null);
        setIsBeneficiaryModalOpen(true);
      }}
    />
  );






  const renderReception = () => (
    <ClinicalModule
      activeSubTab="reception"
      beneficiaries={beneficiaries || []}
      patientVisits={patientVisits || []}
      volunteers={volunteers || []}
      missions={missions || []}
      items={items || []}
      currentUser={user}
      addPatientVisit={addPatientVisitFirestore}
      updatePatientVisit={updatePatientVisitFirestore}
      openBeneficiaryModal={(b) => {
        setEditingBeneficiary(b || null);
        setIsBeneficiaryModalOpen(true);
      }}
      showToast={showToast}
    />
  );



  const renderTriage = () => (
    <ClinicalModule
      activeSubTab="triage"
      beneficiaries={beneficiaries || []}
      patientVisits={patientVisits || []}
      volunteers={volunteers || []}
      missions={missions || []}
      items={items || []}
      currentUser={user}
      addPatientVisit={addPatientVisitFirestore}
      updatePatientVisit={updatePatientVisitFirestore}
      openBeneficiaryModal={(b) => {
        setEditingBeneficiary(b || null);
        setIsBeneficiaryModalOpen(true);
      }}
      showToast={showToast}
    />
  );

  const renderConsultation = () => (
    <ClinicalModule
      activeSubTab="consultation"
      beneficiaries={beneficiaries || []}
      patientVisits={patientVisits || []}
      volunteers={volunteers || []}
      missions={missions || []}
      items={items || []}
      currentUser={user}
      addPatientVisit={addPatientVisitFirestore}
      updatePatientVisit={updatePatientVisitFirestore}
      openBeneficiaryModal={(b) => {
        setEditingBeneficiary(b || null);
        setIsBeneficiaryModalOpen(true);
      }}
      showToast={showToast}
    />
  );

  const renderPharmacy = () => {
    return (
      <PharmacyModule
        items={items || []}
        missions={missions || []}
        volunteers={volunteers || []}
        patientVisits={patientVisits || []}
        currentUserName={user?.name || 'Farmacêutico'}
        currentUserEmail={user?.email || ''}
        updateItem={updateItemFirestore}
        updatePatientVisit={updatePatientVisitFirestore}
        showToast={showToast}
      />
    );
  };


  const renderCalendar = () => {
    return (
      <CalendarModule
        missions={missions}
        onMissionClick={(m) => {
          setEditingMission(m);
          setIsMissionModalOpen(true);
        }}
        onAddMission={() => {
          setEditingMission(null);
          setIsMissionModalOpen(true);
        }}
      />
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
                  <td className="px-6 py-4 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setIsUserModalOpen(true);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-semibold text-xs flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" /> Editar Permissões
                    </button>
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
    return (
      <FinancialModule
        transactions={transactions || []}
        missions={missions || []}
        updateTransaction={updateTransactionFirestore}
        addTransaction={handleSaveTransaction}
        deleteTransaction={deleteTransactionFirestore}
        showToast={showToast}
        initialTab="financial"
      />
    );
  };

  const renderVolunteers = () => (
    <VolunteersModule
      volunteers={volunteers || []}
      addVolunteer={async (data) => {
        await addVolunteerFirestore(data);
        await addNotification('WHATSAPP', 'Coordenador', `Novo voluntário: ${data.name}`);
      }}
      updateVolunteer={async (id, data) => {
        await updateVolunteerFirestore(id, data);
        await addNotification('WHATSAPP', 'Coordenador', `Voluntário atualizado: ${data.name}`);
      }}
      deleteVolunteer={deleteVolunteerFirestore}
      showToast={showToast}
    />
  );

  const renderFundraising = () => {
    return (
      <FinancialModule
        transactions={transactions || []}
        missions={missions || []}
        updateTransaction={updateTransactionFirestore}
        addTransaction={handleSaveTransaction}
        deleteTransaction={deleteTransactionFirestore}
        showToast={showToast}
        initialTab="fundraising"
      />
    );
  };

  const renderPOS = () => {
    return (
      <POSModule
        items={items || []}
        transactions={transactions || []}
        addTransaction={addTransactionFirestore}
        updateItem={updateItemFirestore}
        deleteTransaction={deleteTransactionFirestore}
      />
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
                {allowedTabs.includes('calendar') && (
                  <button
                    onClick={() => handleTabChange('calendar')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'calendar' ? 'bg-indigo-600/10 text-indigo-400 border-l-[3px] border-indigo-400 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <CalendarIcon className="w-4 h-4 shrink-0 group-hover:text-indigo-400 transition-colors" /> Agenda
                  </button>
                )}
                {allowedTabs.includes('users') && (
                  <button
                    onClick={() => handleTabChange('users')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'users' ? 'bg-slate-700/50 text-white border-l-[3px] border-white pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <UserCheck className="w-4 h-4 shrink-0 group-hover:text-white transition-colors" /> Usuários
                  </button>
                )}
                {allowedTabs.includes('audit') && (
                  <button
                    onClick={() => handleTabChange('audit')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium group ${activeTab === 'audit' ? 'bg-red-900/40 text-red-400 border-l-[3px] border-red-500 pl-[13px]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-red-300'}`}
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 group-hover:text-red-400 transition-colors" /> Auditoria
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
                  {activeTab === 'audit' && 'Audit Trail (Logs Sistêmicos)'}
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
        {activeTab === 'audit' && user?.role === 'admin' && <AuditModule />}
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

      <UserEditModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        userToEdit={editingUser}
        onSave={async (id, updates) => {
          try {
            await updateDoc(doc(db, 'users', id), updates);
            setAppUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
            showToast('Permissões de usuário atualizadas com sucesso', 'success');
          } catch (e: any) {
            showToast(e.message, 'error');
          }
        }}
      />

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












      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div >
  );
};

export default App;
