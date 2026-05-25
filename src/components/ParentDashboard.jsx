import React, { useState, useEffect } from 'react';
import { Home, Lock, FileText, RefreshCw, Trash2, CheckCircle, Smartphone, Plus, List, FolderOpen } from 'lucide-react';
import { getVocabData, saveVocabData, resetAllData, getParentPin, setParentPin, saveProgress, loadProgress } from '../utils/storage';
import { fetchVocabFromSheet, updateSheetData, fetchSheetsList } from '../utils/googleSheet';
import { useModal } from '../contexts/ModalContext';

const ParentDashboard = ({ onExit }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [activeTab, setActiveTab] = useState('sync');
    const [message, setMessage] = useState('');
    const [currentPin, setCurrentPin] = useState('1234');
    const { showAlert, showConfirm } = useModal();

    // Sync State
    const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('larnvocab_sheet_url') || '');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(localStorage.getItem('larnvocab_last_sync') || '-');

    // States สำหรับจัดการหลายแผ่นงาน
    const [selectedSheet, setSelectedSheet] = useState(localStorage.getItem('larnvocab_selected_sheet') || 'VocabData');
    const [sheetList, setSheetList] = useState([]);
    const [isFetchingSheets, setIsFetchingSheets] = useState(false);
    const [customSheetName, setCustomSheetName] = useState('');
    const [isCustomSheet, setIsCustomSheet] = useState(false);

    useEffect(() => {
        const savedPin = getParentPin();
        if (savedPin) setCurrentPin(savedPin);
    }, []);

    // ✅ Helper function to clear old URL
    const handleResetUrl = () => {
        showConfirm({
            title: 'ยืนยันการล้าง URL เก่า',
            message: 'ต้องการลบ URL ของ Google Apps Script เก่าหรือไม่? (เพื่อให้ใส่ URL ใหม่)',
            onConfirm: () => {
                localStorage.removeItem('larnvocab_sheet_url');
                localStorage.removeItem('larnvocab_last_sync');
                setSheetUrl('');
                setLastSyncTime('-');
                setSheetList([]);
                showAlert({ 
                    title: 'สำเร็จ', 
                    message: 'ล้าง URL เรียบร้อยแล้ว กรุณาใส่ URL ใหม่ค่ะ', 
                    variant: 'success' 
                });
            }
        });
    };

    // โหลดรายชื่อชีตอัตโนมัติเมื่อเข้าสู่ระบบสำเร็จและมี URL แล้ว
    useEffect(() => {
        if (!sheetUrl || !isAuthenticated) return;
        
        let isMounted = true; // ✅ Prevent state update on unmounted component
        const controller = new AbortController();
        
        const loadSheets = async () => {
            setIsFetchingSheets(true);
            try {
                // Set timeout (5 seconds)
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const list = await fetchSheetsList(sheetUrl);
                clearTimeout(timeoutId);
                
                if (!isMounted) return; // ✅ Check before state update
                
                if (Array.isArray(list)) {
                    const validList = list.filter(item => typeof item === 'string');
                    setSheetList(validList);
                    
                    if (validList.length > 0) {
                        const savedSheet = localStorage.getItem('larnvocab_selected_sheet') || 'VocabData';
                        if (validList.includes(savedSheet)) {
                            setSelectedSheet(savedSheet);
                        } else {
                            setSelectedSheet(validList[0]);
                        }
                    }
                }
            } catch (err) {
                if (!isMounted) return; // ✅ Check before state update
                console.error("Initial fetch sheets error:", err);
                // Silently fail on initial load - user can manually sync if needed
                setSheetList([]);
            } finally {
                if (isMounted) {
                    setIsFetchingSheets(false);
                }
            }
        };
        
        loadSheets();
        
        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [isAuthenticated, sheetUrl]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (pinInput === currentPin) {
            setIsAuthenticated(true);
        } else {
            showAlert({ title: 'เข้าสู่ระบบไม่สำเร็จ', message: 'รหัสผ่านไม่ถูกต้อง (Default: 1234)', variant: 'error' });
        }
    };

    // ฟังก์ชันโหลดรายชื่อแผ่นงานทั้งหมดจาก Cloud
    const handleFetchSheetsList = async (showSuccessAlert = true) => {
        if (!sheetUrl) {
            if (showSuccessAlert) {
                showAlert({ title: 'ผิดพลาด', message: 'กรุณาใส่ URL ของ Google Apps Script ก่อนค่ะ', variant: 'warning' });
            }
            return;
        }

        // ✅ Validate URL format
        if (!sheetUrl.includes('script.google.com')) {
            if (showSuccessAlert) {
                showAlert({ title: 'ผิดพลาด', message: 'URL ไม่ถูกต้อง กรุณาตรวจสอบ URL ของ Google Apps Script ค่ะ', variant: 'error' });
            }
            return;
        }

        setIsFetchingSheets(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const list = await fetchSheetsList(sheetUrl);
            clearTimeout(timeoutId);
            
            // 🛡️ ป้องกันระบบพัง (CORS/React Error #31): กรองเฉพาะรายการที่เป็น String เท่านั้น 
            if (Array.isArray(list) && list.length > 0) {
                const validList = list.filter(item => typeof item === 'string');
                setSheetList(validList);
                
                if (validList.length > 0) {
                    const savedSheet = localStorage.getItem('larnvocab_selected_sheet') || 'VocabData';
                    if (validList.includes(savedSheet)) {
                        setSelectedSheet(savedSheet);
                    } else {
                        setSelectedSheet(validList[0]);
                    }
                    
                    if (showSuccessAlert) {
                        showAlert({ title: 'สำเร็จ', message: `🔍 โหลดรายชื่อแผ่นงานสำเร็จ! พบทั้งหมด ${validList.length} รายการค่ะ`, variant: 'success' });
                    }
                }
            } else {
                setSheetList([]);
                if (showSuccessAlert) {
                    showAlert({ title: 'ไม่มีแผ่นงาน', message: 'ไม่พบแผ่นงานในสคริปต์นี้ค่ะ', variant: 'warning' });
                }
            }
        } catch (error) {
            setSheetList([]); // ✅ Reset to default state
            if (showSuccessAlert) {
                let errorMsg = error.message;
                if (error.name === 'AbortError') {
                    errorMsg = 'หมดเวลารอ (Timeout) - โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMsg = 'ไม่สามารถเชื่อมต่อได้ - URL อาจเก่าเกินไปหรือผิดพลาด (ลองล้าง URL แล้วใส่ URL ใหม่)';
                }
                showAlert({ title: 'โหลดแผ่นงานล้มเหลว', message: `${errorMsg}
หาก AppScript เพิ่ง deploy ใหม่ ให้ล้าง URL เก่าและใส่ URL ใหม่`, variant: 'error' });
            }
            console.error("Fetch sheets error:", error);
        } finally {
            setIsFetchingSheets(false);
        }
    };

    const handleSync = async () => {
        if (!sheetUrl) return;
        setIsSyncing(true);
        setMessage('');

        const targetSheet = isCustomSheet ? customSheetName.trim() : selectedSheet;
        if (!targetSheet) {
            showAlert({ title: 'ผิดพลาด', message: 'กรุณาเลือกหรือป้อนชื่อแผ่นงานก่อนทำการ Sync นะคะ', variant: 'warning' });
            setIsSyncing(false);
            return;
        }

        try {
            const data = await fetchVocabFromSheet(sheetUrl, targetSheet);
            saveVocabData(data);
            localStorage.setItem('larnvocab_sheet_url', sheetUrl);
            localStorage.setItem('larnvocab_selected_sheet', targetSheet);

            const time = new Date().toLocaleString();
            localStorage.setItem('larnvocab_last_sync', time);
            setLastSyncTime(time);

            showAlert({ 
                title: 'สำเร็จ', 
                message: `✅ Sync สำเร็จ! โหลดคำศัพท์จากแผ่นงาน "${targetSheet}" มาทั้งหมด ${data.length} คำเรียบร้อยแล้วค่ะ`, 
                variant: 'success' 
            });

            // อัปเดตรายชื่อชีตเผื่อมีความเปลี่ยนแปลง
            await handleFetchSheetsList(false);
        } catch (error) {
            showAlert({ title: 'ผิดพลาด', message: `❌ เกิดข้อผิดพลาด: ${error.message}`, variant: 'error' });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleUpload = async () => {
        if (!sheetUrl) return;
        setIsUploading(true);
        setMessage('');

        const targetSheet = isCustomSheet ? customSheetName.trim() : selectedSheet;
        if (!targetSheet) {
            showAlert({ title: 'ผิดพลาด', message: 'กรุณาเลือกหรือป้อนชื่อแผ่นงานก่อนทำการอัปโหลดนะคะ', variant: 'warning' });
            setIsUploading(false);
            return;
        }

        try {
            const currentVocab = getVocabData() || [];
            const result = await updateSheetData(sheetUrl, currentVocab, targetSheet);

            if (result.status === 'success') {
                const time = new Date().toLocaleString();
                setLastSyncTime(time);
                localStorage.setItem('larnvocab_sheet_url', sheetUrl);
                localStorage.setItem('larnvocab_selected_sheet', targetSheet);

                let successMsg = `☁️ อัปโหลดไปยังแผ่นงาน "${targetSheet}" สำเร็จ! จำนวน ${result.count} รายการค่ะ`;
                if (result.isNewSheet) {
                    successMsg = `✨ สร้างแผ่นงานใหม่ "${targetSheet}" และอัปโหลดสำเร็จแล้วค่ะ! จำนวน ${result.count} รายการ`;
                }

                showAlert({ title: 'สำเร็จ', message: successMsg, variant: 'success' });

                // หากเป็นการสร้างชีตใหม่ ให้สลับกลับมาโหมดเลือกชีตปกติ
                setIsCustomSheet(false);
                setCustomSheetName('');

                // โหลดรายชื่อแผ่นงานใหม่เพื่อแสดงผลใน dropdown ทันที
                await handleFetchSheetsList(false);
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            showAlert({ title: 'ผิดพลาด', message: `❌ อัปโหลดไม่สำเร็จ: ${error.message}`, variant: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleReset = () => {
        showConfirm({
            title: 'ยืนยันการล้างข้อมูล',
            message: '⚠️ ข้อมูลความก้าวหน้าทั้งหมดจะหายไป!\nคุณต้องการดำเนินการต่อหรือไม่?',
            variant: 'error',
            confirmText: 'ลบข้อมูล',
            onConfirm: () => resetAllData()
        });
    };

    const handleChangePin = (newPin) => {
        setParentPin(newPin);
        setCurrentPin(newPin);
        showAlert({ title: 'สำเร็จ', message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', variant: 'success' });
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-blue-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-700">ผู้ปกครองเท่านั้น</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            className="w-full text-center text-3xl font-bold tracking-widest border-2 border-gray-200 rounded-xl p-3 mb-4"
                            placeholder="PIN"
                            maxLength={4}
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-brand-blue text-white font-bold py-3 rounded-xl hover:bg-blue-600">
                                เข้าสู่ระบบ
                            </button>
                            <button type="button" onClick={onExit} className="px-4 py-3 bg-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-300">
                                กลับ
                            </button>
                        </div>
                    </form>
                    <p className="text-gray-400 text-sm mt-4">รหัสเริ่มต้น: 1234</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={24} />
                    Parent Dashboard
                </h1>
                <button onClick={onExit} className="flex items-center gap-2 text-gray-600 hover:text-brand-blue font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <Home size={20} /> กลับไปหน้าเกม
                </button>
            </header>

            <main className="max-w-4xl mx-auto p-6">
                <div className="flex gap-4 mb-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('sync')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'sync' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <RefreshCw size={20} /> Cloud Sync
                    </button>
                    <button onClick={() => setActiveTab('data')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'data' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <Smartphone size={20} /> Data
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'settings' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <Lock size={20} /> Settings
                    </button>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    {activeTab === 'sync' && (
                        <div className="max-w-xl mx-auto">
                            <div className="text-center mb-6">
                                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="text-green-600" size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Google Sheets Sync</h2>
                                <p className="text-gray-500 mt-2">เชื่อมต่อฐานข้อมูลคำศัพท์จาก Cloud</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Google Apps Script URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        id="sheetUrlInput"
                                        name="sheetUrl"
                                        autoComplete="off"
                                        className="flex-1 p-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-500 focus:outline-none transition-colors"
                                        placeholder="https://script.google.com/..."
                                        value={sheetUrl}
                                        onChange={e => setSheetUrl(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleFetchSheetsList(true)}
                                        disabled={isFetchingSheets || !sheetUrl}
                                        className={`px-4 rounded-xl font-bold text-sm text-white shadow flex items-center justify-center gap-1 transition-all ${
                                            isFetchingSheets ? 'bg-gray-400' : 'bg-gray-700 hover:bg-gray-800'
                                        }`}
                                    >
                                        {isFetchingSheets ? <RefreshCw className="animate-spin" size={16} /> : <List size={16} />}
                                        {isFetchingSheets ? 'กำลังโหลด...' : 'ค้นหาแผ่นงาน'}
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleResetUrl}
                                        disabled={!sheetUrl}
                                        className="px-4 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
                                    >
                                        ล้าง URL เก่า
                                    </button>
                                    <span className="text-xs text-gray-500">ถ้า URL เปลี่ยนเมื่อ deploy ใหม่ ให้ล้างแล้วใส่ใหม่</span>
                                </div>
                            </div>

                            {sheetUrl && (
                                <div className="mb-6 p-5 bg-green-50/50 border border-green-100 rounded-2xl">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-bold text-gray-700">📦 การเลือกแผ่นงานคำศัพท์ (Sheets)</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomSheet(!isCustomSheet);
                                                setCustomSheetName('');
                                            }}
                                            className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
                                        >
                                            {isCustomSheet ? (
                                                <>
                                                    <FolderOpen size={14} /> เลือกแผ่นงานที่มีอยู่
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={14} /> สร้างแผ่นงานใหม่
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {isCustomSheet ? (
                                        <div>
                                            <input
                                                type="text"
                                                className="w-full p-3 border-2 border-green-200 rounded-xl bg-white focus:border-green-500 focus:outline-none transition-colors font-medium text-gray-700"
                                                placeholder="พิมพ์ชื่อแผ่นงานใหม่ (เช่น Space, Food, Animals)"
                                                value={customSheetName}
                                                onChange={e => setCustomSheetName(e.target.value)}
                                            />
                                            <p className="text-xs text-gray-400 mt-1.5">
                                                💡 เมื่อคุณกด "ส่งข้อมูลขึ้น" ระบบจะสร้างแผ่นงานใหม่นี้บน Google Sheet ให้คุณโดยอัตโนมัติค่ะ
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            {sheetList.length > 0 ? (
                                                <select
                                                    value={selectedSheet}
                                                    onChange={e => setSelectedSheet(e.target.value)}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-green-500 focus:outline-none transition-colors font-medium text-gray-700"
                                                >
                                                    {sheetList.map(name => (
                                                        <option key={name} value={name}>
                                                            📄 {name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="text-center py-2 text-sm text-gray-400 font-medium">
                                                    {isFetchingSheets ? 'กำลังตรวจสอบ...' : 'ไม่พบแผ่นงานหรือยังไม่ได้กดค้นหาแผ่นงานค่ะ (คลิก "ค้นหาแผ่นงาน")'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing || isUploading || !sheetUrl || (isCustomSheet && !customSheetName)}
                                    className={`py-4 rounded-xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-3 transition-all
                                        ${isSyncing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600 hover:scale-[1.02]'}
                                    `}
                                >
                                    {isSyncing ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
                                    {isSyncing ? 'กำลังดึง...' : 'ดึงข้อมูลลง'}
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={isSyncing || isUploading || !sheetUrl || (isCustomSheet && !customSheetName)}
                                    className={`py-4 rounded-xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-3 transition-all
                                        ${isUploading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600 hover:scale-[1.02]'}
                                    `}
                                >
                                    {isUploading ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
                                    {isUploading ? 'กำลังส่ง...' : 'ส่งข้อมูลขึ้น'}
                                </button>
                            </div>

                            {message && (
                                <div className={`mt-6 p-4 rounded-xl text-center font-bold border ${message.includes('สำเร็จ') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {message}
                                </div>
                            )}

                            <p className="text-center text-gray-400 text-sm mt-8">
                                Sync ล่าสุด: {lastSyncTime} <br />
                                <span className="text-xs text-gray-300">v1.3 (Dynamic Sheets Supported)</span>
                            </p>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="text-center py-8 max-w-md mx-auto">
                            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Factory Reset</h3>
                            <p className="text-gray-500 mb-6">เริ่มเกมใหม่ทั้งหมด (ลบดาว, ชื่อ, และด่านที่ผ่าน)</p>
                            <button onClick={handleReset} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-red-200 transition-all w-full">
                                ล้างข้อมูลทั้งหมด
                            </button>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-sm mx-auto py-4">
                            <h3 className="text-xl font-bold mb-6 text-center">เปลี่ยนรหัสผ่าน (PIN)</h3>
                            <PinChangeForm onSave={handleChangePin} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const PinChangeForm = ({ onSave }) => {
    const [newPin, setNewPin] = useState('');
    const { showAlert } = useModal();
    return (
        <div className="flex flex-col gap-3">
            <input
                type="password"
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                maxLength={4}
                className="border-2 p-3 rounded-xl text-center text-3xl font-bold tracking-widest focus:border-brand-blue focus:outline-none"
                placeholder="New PIN"
            />
            <button
                onClick={() => newPin.length === 4 ? onSave(newPin) : showAlert({ title: 'ผิดพลาด', message: 'กรุณากรอก 4 หลัก', variant: 'warning' })}
                className="bg-brand-pink hover:bg-pink-600 text-white py-3 rounded-xl font-bold transition-colors"
            >
                บันทึกรหัสใหม่
            </button>
        </div>
    );
};

export default ParentDashboard;
