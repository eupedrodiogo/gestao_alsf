
export type Category = 'Medicamentos' | 'Brinquedos' | 'Alimentos' | 'Outros';
export type LocationType = 'Presídio' | 'Comunidade' | 'Praça' | 'Outros';

export interface Item {
    id: string;
    name: string;
    category: Category;
    quantity: number;
    unit: string;
    unitValue: number;
}

export interface AllocatedItem {
    itemId: string;
    quantity: number;
}

export interface Mission {
    id: string;
    title: string;
    date: string; // ISO Date string (YYYY-MM-DD)
    time?: string; // Horário no formato HH:MM
    description: string;
    status: 'planned' | 'completed' | 'cancelled';
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    presidentObservation?: string;
    allocatedItems: AllocatedItem[];
    // New fields for comprehensive event management
    volunteerIds?: string[];
    financial?: {
        budget: number;
        expenses: { id: string; description: string; value: number; category: string }[];
    };
    beneficiaryIds?: string[];
    report?: string; // Prestação de Contas
}

export interface Beneficiary {
    id: string;
    name: string;
    document: string; // CPF or RG (legacy)
    needs: string; // Observações/Necessidades
    // New fields
    biologicalSex?: 'male' | 'female';
    color?: 'white' | 'black' | 'brown' | 'yellow' | 'indigenous';
    birthDate?: string; // ISO Date String (YYYY-MM-DD)
    age?: number;
    cpf?: string;
    rg?: string;
    photoUrl?: string;
}

export interface Attendance {
    id: string;
    date: string;
    locationType: LocationType;
    locationName: string;
    description: string;
    peopleServed: number; // Can be manual count OR length of beneficiaryIds
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    responsible: string;
    beneficiaryIds: string[]; // List of specific people served
}

export interface NotificationLog {
    id: string;
    type: 'WHATSAPP' | 'EMAIL';
    recipient: 'Coordenador' | 'Financeiro' | 'Voluntários';
    message: string;
    timestamp: any;
    read: boolean;
}

export type UserRole = 'admin' | 'operador' | 'voluntario' | 'saude' | 'financeiro' | 'pdv' | 'arrecadacao' | 'medico' | 'farmacia' | 'enfermeiro' | 'dentista' | 'fisioterapeuta' | 'psicologo' | 'recepcao' | 'triagem' | 'estoque' | 'presidente';

export interface UserData {
    uid: string;
    email: string | null;
    role: UserRole;
    name?: string;
    allowedModules?: string[];
}

export interface Volunteer {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    availability: string;
    active: boolean;
    notes: string;
    crm?: string;
    religion?: string;
    volunteerFunction?: string;
}

export interface PatientVisit {
    id: string;
    beneficiaryId: string;
    beneficiaryName: string;
    date: string; // ISO string
    status: 'reception' | 'triage' | 'waiting_consultation' | 'in_consultation' | 'pharmacy' | 'completed';
    priority: 'normal' | 'preferencial' | 'emergencia';
    triage?: {
        bloodPressure: string;
        temperature: string;
        weight: string;
        symptoms: string;
        notes: string;
        nurseName: string;
    };
    doctor?: {
        doctorName: string;
        diagnosis: string;
        prescription: string; // Could be structured, text for now
        internalNotes: string;
        selectedMedications?: string[]; // Names of medications selected from mission stock
    };
    pharmacy?: {
        dispensedItems: { itemId: string; name: string; quantity: number }[];
        pharmacistName: string;
        notes: string;
    };
    createdAt: any; // Firestore timestamp
}

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string; // ISO date
    status: 'paid' | 'pending';
    paymentMethod: 'cash' | 'pix' | 'card' | 'transfer';
    person?: string; // Who paid or received
    docUrl?: string; // Receipt URL if any
    missionId?: string; // Link transaction to a specific mission
}

export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    action: string;
    module: string;
    recordId?: string;
    previousData?: any;
    newData?: any;
    timestamp: any; // Firestore timestamp
    ipAddress?: string; // If available, optional
}
