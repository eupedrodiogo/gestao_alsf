import React, { useState, ChangeEvent } from 'react';
import { db, storage } from '../../api/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { Upload, X, FileText, CheckCircle, AlertTriangle, PlusCircle, Package } from 'lucide-react';
import { Item, Category } from '../../types/index';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (item: Item, quantity: number, isEntry: boolean, fileUrl?: string, fileName?: string) => Promise<void>;
    items: Item[];
}

interface DetectedItem {
    extractedName: string;
    matchedItemId: string | null;
    quantity: number;
    confidence: string;
    reasoning: string;
    unit: string;
    unitValue: number;
    category: string;
    newDetails?: {
        name: string;
        category: Category;
        unit: string;
        unitValue: number;
    };
    // UI state per detected item
    selectedItemId: string;
    confirmedQuantity: number;
    registered: boolean;
    confirmed: boolean;
}

export const StockMovementModal = ({ isOpen, onClose, onConfirm, items }: StockMovementModalProps) => {
    const [type, setType] = useState<'entry' | 'exit'>('entry');
    const [mode, setMode] = useState<'manual' | 'upload'>('manual');
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(0);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // AI processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
    const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);

    if (!isOpen) return null;

    const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const base64Data = base64String.split(',')[1];
                resolve({
                    inlineData: {
                        data: base64Data,
                        mimeType: file.type
                    },
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const processFileWithGemini = async (file: File) => {
        const rawKey = import.meta.env.VITE_GEMINI_API_KEY || "";
        const apiKey = rawKey.trim();

        console.log("Gemini API Key Status:", apiKey ? "Present" : "Missing", apiKey ? `Length: ${apiKey.length}` : "");

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
            console.warn("Gemini API Key missing or placeholder. Using mock data.");
            setTimeout(() => {
                setIsProcessing(false);
                setDetectedItems([{
                    extractedName: "Item Simulado 1",
                    matchedItemId: items.length > 0 ? items[0].id : null,
                    quantity: 15,
                    unit: 'un',
                    unitValue: 5.50,
                    category: 'Outros',
                    confidence: "low",
                    reasoning: "Modo de demonstração",
                    selectedItemId: items.length > 0 ? items[0].id : '',
                    confirmedQuantity: 15,
                    registered: false,
                    confirmed: false,
                }]);
                setAnalysisSummary("Modo de demonstração (Sem API Key). Dados simulados.");
            }, 1500);
            return;
        }

        try {
            console.log("Initializing Gemini with key:", apiKey.substring(0, 5) + "...");
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const filePart = await fileToGenerativePart(file);

            const itemsList = items.map(i => ({ id: i.id, name: i.name, unit: i.unit })).slice(0, 50);
            const itemsContext = JSON.stringify(itemsList);

            const prompt = `
            Você é um assistente de gestão de estoque. Analise este documento (Nota Fiscal ou Requisição).
            Identifique TODOS os itens/produtos listados no documento, com suas respectivas quantidades e valores.
            
            Tente corresponder cada item encontrado com a seguinte lista de itens do sistema:
            ${itemsContext}

            Se não encontrar correspondência exata para um item, ESTIME os detalhes do novo item.
            Categoria deve ser uma destas: 'Medicamentos', 'Brinquedos', 'Alimentos', 'Outros'.

            Retorne APENAS um objeto JSON (sem markdown) com o seguinte formato:
            {
                "items": [
                    {
                        "matchedItemId": "id_do_item_se_encontrado_ou_null",
                        "extractedName": "nome_do_item_no_documento",
                        "quantity": 0,
                        "unit": "un",
                        "unitValue": 0.00,
                        "category": "Outros",
                        "confidence": "high/medium/low",
                        "reasoning": "breve explicação",
                        "newDetails": {
                            "name": "Nome sugerido para cadastro",
                            "category": "Outros",
                            "unit": "un",
                            "unitValue": 0.00
                        }
                    }
                ],
                "totalItems": 0,
                "documentType": "Nota Fiscal / Requisição / Outro"
            }
            
            IMPORTANTE:
            - Retorne TODOS os itens encontrados no documento, não apenas o primeiro.
            - O campo "newDetails" deve ser preenchido APENAS se "matchedItemId" for null.
            - SEMPRE preencha "unit" (ex: un, kg, cx, L), "unitValue" (valor unitário em R$) e "category" para TODOS os itens, mesmo quando matchedItemId não for null.
            - Extraia o valor unitário do documento. Se não estiver disponível, estime com 0.00.
            `;

            console.log("Sending request to Gemini...");
            const result = await model.generateContent([prompt, filePart]);
            console.log("Response received from Gemini");
            const response = await result.response;
            const text = response.text();
            console.log("Raw response text:", text);

            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            const detected: DetectedItem[] = (data.items || []).map((item: any) => ({
                extractedName: item.extractedName,
                matchedItemId: item.matchedItemId || null,
                quantity: item.quantity || 0,
                unit: item.unit || item.newDetails?.unit || 'un',
                unitValue: item.unitValue ?? item.newDetails?.unitValue ?? 0,
                category: item.category || item.newDetails?.category || 'Outros',
                confidence: item.confidence || 'low',
                reasoning: item.reasoning || '',
                newDetails: !item.matchedItemId ? item.newDetails : undefined,
                selectedItemId: item.matchedItemId || '',
                confirmedQuantity: item.quantity || 0,
                registered: false,
                confirmed: false,
            }));

            setDetectedItems(detected);
            setAnalysisSummary(
                `${detected.length} item(ns) encontrado(s) no documento (${data.documentType || 'Documento'}).`
            );

        } catch (error) {
            console.error("Erro CRÍTICO ao processar com Gemini:", error);

            let errorMsg = "Erro desconhecido";
            if (error instanceof Error) {
                errorMsg = error.message;
                console.error("Stack trace:", error.stack);
            }
            else if (typeof error === 'string') errorMsg = error;

            const keySuffix = apiKey ? apiKey.slice(-4) : "MISSING";

            setDetectedItems([{
                extractedName: "Item Simulado (Erro IA)",
                matchedItemId: items.length > 0 ? items[0].id : null,
                quantity: 1,
                unit: 'un',
                unitValue: 0,
                category: 'Outros',
                confidence: 'low',
                reasoning: `Erro: ${errorMsg}`,
                selectedItemId: items.length > 0 ? items[0].id : '',
                confirmedQuantity: 1,
                registered: false,
                confirmed: false,
            }]);
            setAnalysisSummary(`⚠️ Erro IA (Key ...${keySuffix}): ${errorMsg}. Dados simulados.`);

            setUploadError(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setUploadError(null);
            setDetectedItems([]);
            setAnalysisSummary(null);

            if (mode === 'upload') {
                setIsProcessing(true);
                processFileWithGemini(selectedFile);
            }
        }
    };

    const updateDetectedItem = (index: number, updates: Partial<DetectedItem>) => {
        setDetectedItems(prev => prev.map((item, i) =>
            i === index ? { ...item, ...updates } : item
        ));
    };

    const handleAutoRegister = async (index: number) => {
        const detected = detectedItems[index];
        if (!detected?.newDetails) return;

        try {
            const newItem: Omit<Item, 'id'> = {
                name: detected.newDetails.name,
                category: detected.newDetails.category as Category,
                quantity: 0,
                unit: detected.newDetails.unit,
                unitValue: detected.newDetails.unitValue
            };

            const docRef = await addDoc(collection(db, 'items'), newItem);

            updateDetectedItem(index, {
                selectedItemId: docRef.id,
                matchedItemId: docRef.id,
                registered: true,
                newDetails: undefined,
            });

        } catch (error) {
            console.error("Erro ao cadastrar item automaticamente:", error);
            setUploadError("Erro ao cadastrar item. Tente manualmente.");
        }
    };

    const handleConfirmItem = async (index: number) => {
        const detected = detectedItems[index];
        if (!detected.selectedItemId || detected.confirmedQuantity <= 0) {
            alert("Selecione um item e informe a quantidade.");
            return;
        }

        let fileUrl = '';
        let fileName = '';

        if (file) {
            try {
                setUploading(true);
                const storageRef = ref(storage, `stock_documents/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                fileUrl = await getDownloadURL(snapshot.ref);
                fileName = file.name;
            } catch (error: any) {
                console.error("Upload failed", error);
                setUploadError("Falha no upload do arquivo.");
                setUploading(false);
                return;
            }
        }

        const item = items.find(i => i.id === detected.selectedItemId);
        if (item) {
            await onConfirm(item, detected.confirmedQuantity, type === 'entry', fileUrl, fileName);
            updateDetectedItem(index, { confirmed: true });
        }
        setUploading(false);
    };

    const handleConfirmAllItems = async () => {
        const unconfirmed = detectedItems.filter(d => !d.confirmed && d.selectedItemId && d.confirmedQuantity > 0);
        if (unconfirmed.length === 0) {
            alert("Nenhum item válido para confirmar.");
            return;
        }

        let fileUrl = '';
        let fileName = '';

        if (file) {
            try {
                setUploading(true);
                const storageRef = ref(storage, `stock_documents/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                fileUrl = await getDownloadURL(snapshot.ref);
                fileName = file.name;
            } catch (error: any) {
                console.error("Upload failed", error);
                setUploadError("Falha no upload do arquivo.");
                setUploading(false);
                return;
            }
        }

        for (let i = 0; i < detectedItems.length; i++) {
            const detected = detectedItems[i];
            if (detected.confirmed || !detected.selectedItemId || detected.confirmedQuantity <= 0) continue;

            const item = items.find(it => it.id === detected.selectedItemId);
            if (item) {
                await onConfirm(item, detected.confirmedQuantity, type === 'entry', fileUrl, fileName);
                updateDetectedItem(i, { confirmed: true });
            }
        }

        setUploading(false);
        onClose();
        setFile(null);
        setDetectedItems([]);
        setAnalysisSummary(null);
    };

    const handleManualSubmit = async () => {
        if (!selectedItemId) {
            alert("Selecione um item.");
            return;
        }
        if (quantity <= 0) {
            alert("A quantidade deve ser maior que zero.");
            return;
        }

        let fileUrl = '';
        let fileName = '';

        if (mode === 'upload' && file) {
            try {
                setUploading(true);
                const storageRef = ref(storage, `stock_documents/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                fileUrl = await getDownloadURL(snapshot.ref);
                fileName = file.name;
                setUploading(false);
            } catch (error: any) {
                console.error("Upload failed", error);
                setUploadError("Falha no upload do arquivo. Tente novamente.");
                setUploading(false);
                return;
            }
        } else if (mode === 'upload' && !file) {
            alert("Por favor, selecione um arquivo.");
            return;
        }

        const item = items.find(i => i.id === selectedItemId);
        if (item) {
            await onConfirm(item, quantity, type === 'entry', fileUrl, fileName);
            onClose();
            setFile(null);
            setQuantity(0);
            setSelectedItemId('');
            setDetectedItems([]);
            setAnalysisSummary(null);
        }
    };

    const allConfirmed = detectedItems.length > 0 && detectedItems.every(d => d.confirmed);
    const confirmedCount = detectedItems.filter(d => d.confirmed).length;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-bold text-slate-800">Nova Movimentação de Estoque</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Type Selection */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setType('entry')}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'entry' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Entrada (Nota Fiscal)
                        </button>
                        <button
                            onClick={() => setType('exit')}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'exit' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Saída (Requisição Tasy)
                        </button>
                    </div>

                    {/* Mode Selection */}
                    <div className="flex gap-4 border-b border-slate-100 pb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="mode"
                                checked={mode === 'upload'}
                                onChange={() => setMode('upload')}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Upload de Arquivo {type === 'entry' ? '(NF)' : '(Requisição)'}
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="mode"
                                checked={mode === 'manual'}
                                onChange={() => setMode('manual')}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Manual</span>
                        </label>
                    </div>

                    {/* Upload Section */}
                    {mode === 'upload' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.png,.jpeg"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">
                                        {file ? file.name : "Clique para selecionar ou arraste o arquivo"}
                                    </p>
                                    <p className="text-xs text-slate-400">PDF, JPG ou PNG</p>
                                </div>
                            </div>

                            {isProcessing && (
                                <div className="flex items-center gap-2 text-blue-600 text-sm bg-blue-50 p-3 rounded-lg">
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    Processando documento com IA...
                                </div>
                            )}

                            {/* Analysis Summary */}
                            {analysisSummary && (
                                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
                                    <p className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        {analysisSummary}
                                    </p>
                                    {detectedItems.length > 1 && (
                                        <p className="text-xs text-indigo-600 mt-1 ml-6">
                                            {confirmedCount}/{detectedItems.length} confirmado(s)
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Detected Items List */}
                            {detectedItems.map((detected, index) => (
                                <div
                                    key={index}
                                    className={`border rounded-lg p-4 space-y-3 transition-all ${detected.confirmed
                                        ? 'bg-emerald-50 border-emerald-200 opacity-70'
                                        : detected.newDetails
                                            ? 'bg-amber-50 border-amber-200'
                                            : 'bg-white border-slate-200'
                                        }`}
                                >
                                    {/* Item Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-2">
                                            <Package className={`w-4 h-4 mt-0.5 shrink-0 ${detected.confirmed ? 'text-emerald-600' : 'text-slate-500'}`} />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {detected.extractedName}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {detected.matchedItemId || detected.registered
                                                        ? 'Correspondido no sistema'
                                                        : 'Item não encontrado no sistema'}
                                                </p>
                                                {/* Info badges: quantity, unit value, unit */}
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    <span className="inline-flex items-center text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-100">
                                                        Qtd: {detected.quantity} {detected.unit}
                                                    </span>
                                                    {detected.unitValue > 0 && (
                                                        <span className="inline-flex items-center text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium border border-green-100">
                                                            Valor Unit.: R$ {detected.unitValue.toFixed(2)}
                                                        </span>
                                                    )}
                                                    {detected.unitValue > 0 && detected.quantity > 0 && (
                                                        <span className="inline-flex items-center text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium border border-purple-100">
                                                            Total: R$ {(detected.unitValue * detected.quantity).toFixed(2)}
                                                        </span>
                                                    )}
                                                    {detected.category && (
                                                        <span className="inline-flex items-center text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">
                                                            {detected.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {detected.confirmed && (
                                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                                Confirmado
                                            </span>
                                        )}
                                    </div>

                                    {/* Auto Register Button */}
                                    {detected.newDetails && !detected.registered && !detected.confirmed && (
                                        <div className="ml-6">
                                            <button
                                                onClick={() => handleAutoRegister(index)}
                                                disabled={uploading}
                                                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-md font-semibold transition-colors flex items-center gap-2 border border-amber-200"
                                            >
                                                <PlusCircle className="w-3 h-3" />
                                                Cadastrar "{detected.newDetails.name}" Automaticamente
                                            </button>
                                            <p className="text-[10px] text-amber-600/80 mt-1 ml-1">
                                                Categoria: {detected.newDetails.category} | Unidade: {detected.newDetails.unit} | Valor Est.: R$ {detected.newDetails.unitValue?.toFixed(2)}
                                            </p>
                                        </div>
                                    )}

                                    {detected.registered && (
                                        <p className="text-xs text-emerald-600 ml-6 font-medium">
                                            Item cadastrado com sucesso
                                        </p>
                                    )}

                                    {/* Item Selection & Quantity */}
                                    {!detected.confirmed && (
                                        <div className="grid grid-cols-3 gap-2 ml-6">
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Item</label>
                                                <select
                                                    value={detected.selectedItemId}
                                                    onChange={(e) => updateDetectedItem(index, { selectedItemId: e.target.value })}
                                                    className="w-full p-1.5 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                                                >
                                                    <option value="">Selecione...</option>
                                                    {items.map(i => (
                                                        <option key={i.id} value={i.id}>{i.name} ({i.unit}) - Est: {i.quantity}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Qtd</label>
                                                <input
                                                    type="number"
                                                    value={detected.confirmedQuantity}
                                                    onChange={(e) => updateDetectedItem(index, { confirmedQuantity: Number(e.target.value) })}
                                                    className="w-full p-1.5 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Manual Mode Fields */}
                    {mode === 'manual' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Selecione o Item</label>
                                <select
                                    value={selectedItemId}
                                    onChange={(e) => setSelectedItemId(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                >
                                    <option value="">Selecione...</option>
                                    {items.map(i => (
                                        <option key={i.id} value={i.id}>{i.name} ({i.unit}) - Estoque: {i.quantity}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Quantidade</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                    placeholder="Digite a quantidade..."
                                />
                            </div>
                        </div>
                    )}

                    {uploadError && (
                        <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                            {uploadError}
                        </div>
                    )}

                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>

                    {mode === 'upload' && detectedItems.length > 0 ? (
                        <button
                            onClick={handleConfirmAllItems}
                            disabled={uploading || isProcessing || allConfirmed}
                            className={`px-6 py-2 text-white font-medium rounded-lg transition-all flex items-center gap-2
                                ${type === 'entry' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
                                ${(uploading || isProcessing || allConfirmed) ? 'opacity-70 cursor-not-allowed' : ''}
                            `}
                        >
                            {uploading
                                ? 'Enviando...'
                                : allConfirmed
                                    ? 'Todos Confirmados ✓'
                                    : `Confirmar ${detectedItems.length > 1 ? `Todos (${detectedItems.length - confirmedCount})` : 'Movimentação'}`
                            }
                        </button>
                    ) : (
                        <button
                            onClick={handleManualSubmit}
                            disabled={uploading || isProcessing}
                            className={`px-6 py-2 text-white font-medium rounded-lg transition-all flex items-center gap-2
                                ${type === 'entry' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
                                ${(uploading || isProcessing) ? 'opacity-70 cursor-not-allowed' : ''}
                            `}
                        >
                            {uploading ? 'Enviando...' : 'Confirmar Movimentação'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
