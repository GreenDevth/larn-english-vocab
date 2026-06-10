import React, { useState, useEffect, useRef } from 'react';
import { Home, Lock, FileText, RefreshCw, Trash2, CheckCircle, Smartphone, Plus, List, FolderOpen, User, Download, Upload, Shield, Star, Unlock, Minus, HelpCircle } from 'lucide-react';
import { getVocabData, saveVocabData, resetAllData, resetActiveProfileData, getParentPin, setParentPin, saveProgress, loadProgress, exportAllData, importAllData, getAllProfiles, getProfileProgress, saveProfileProgress, getActiveProfileId } from '../utils/storage';
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

    const [childNameInput, setChildNameInput] = useState('');
    const importFileRef = useRef(null);

    // States สำหรับจัดการความก้าวหน้าโปรไฟล์เด็ก
    const [profiles, setProfiles] = useState([]);
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [selectedProfileProgress, setSelectedProfileProgress] = useState(null);
    const [starsInput, setStarsInput] = useState('');

    // รายการด่านทั้งหมดที่มีอยู่ในระบบ
    const availableSessions = (() => {
        const vocab = getVocabData() || [];
        const unique = [...new Set(vocab.map(item => item.session))].sort((a, b) => a - b);
        return unique.length > 0 ? unique : [1, 2, 3, 4, 5, 6, 7, 8];
    })();

    // ดึงโปรไฟล์ทั้งหมดเมื่อเข้าสู่ระบบ
    useEffect(() => {
        if (isAuthenticated) {
            const all = getAllProfiles();
            setProfiles(all);
            
            const activeId = getActiveProfileId();
            if (activeId && all.some(p => p.id === activeId)) {
                setSelectedProfileId(activeId);
                const prog = getProfileProgress(activeId);
                setSelectedProfileProgress(prog);
                setStarsInput(String(prog.totalStars || 0));
            } else if (all.length > 0) {
                setSelectedProfileId(all[0].id);
                const prog = getProfileProgress(all[0].id);
                setSelectedProfileProgress(prog);
                setStarsInput(String(prog.totalStars || 0));
            }
        }
    }, [isAuthenticated]);

    const handleProfileChange = (profileId) => {
        setSelectedProfileId(profileId);
        const prog = getProfileProgress(profileId);
        setSelectedProfileProgress(prog);
        setStarsInput(String(prog.totalStars || 0));
    };

    // ฟังก์ชันจัดการดาว
    const handleAddStars = (amount) => {
        if (!selectedProfileId || !selectedProfileProgress) return;
        const currentStars = parseInt(selectedProfileProgress.totalStars || 0, 10);
        const newStars = Math.max(0, currentStars + amount);
        const updated = {
            ...selectedProfileProgress,
            totalStars: newStars
        };
        setSelectedProfileProgress(updated);
        setStarsInput(String(newStars));
        saveProfileProgress(selectedProfileId, updated);
    };

    const handleStarsInputChange = (val) => {
        setStarsInput(val);
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed >= 0) {
            const updated = {
                ...selectedProfileProgress,
                totalStars: parsed
            };
            setSelectedProfileProgress(updated);
            saveProfileProgress(selectedProfileId, updated);
        }
    };

    // ฟังก์ชันจัดการด่าน (ปลดล็อค / ล็อค)
    const handleToggleSession = (sessionId) => {
        if (!selectedProfileId || !selectedProfileProgress) return;
        if (sessionId === 1) {
            showAlert({ title: 'ข้อแนะนำ', message: 'ด่านที่ 1 เป็นด่านเริ่มต้น ไม่สามารถล็อคได้ค่ะ', variant: 'warning' });
            return;
        }
        
        let newUnlocked = selectedProfileProgress.unlockedSessions || [1];
        if (newUnlocked.includes(sessionId)) {
            newUnlocked = newUnlocked.filter(id => id !== sessionId);
        } else {
            newUnlocked = [...newUnlocked, sessionId];
        }

        const updated = {
            ...selectedProfileProgress,
            unlockedSessions: newUnlocked
        };
        setSelectedProfileProgress(updated);
        saveProfileProgress(selectedProfileId, updated);
    };

    const handleUnlockAll = () => {
        if (!selectedProfileId || !selectedProfileProgress) return;
        const updated = {
            ...selectedProfileProgress,
            unlockedSessions: [...availableSessions]
        };
        setSelectedProfileProgress(updated);
        saveProfileProgress(selectedProfileId, updated);
        showAlert({ title: 'สำเร็จ', message: '🔓 ปลดล็อคด่านทั้งหมดเรียบร้อยแล้วค่ะ', variant: 'success' });
    };

    const handleLockAllExceptOne = () => {
        if (!selectedProfileId || !selectedProfileProgress) return;
        const updated = {
            ...selectedProfileProgress,
            unlockedSessions: [1]
        };
        setSelectedProfileProgress(updated);
        saveProfileProgress(selectedProfileId, updated);
        showAlert({ title: 'สำเร็จ', message: '🔒 ล็อคด่านทั้งหมด (ยกเว้นด่าน 1) เรียบร้อยแล้วค่ะ', variant: 'success' });
    };

    const handleToggleShowVocabText = () => {
        if (!selectedProfileId || !selectedProfileProgress) return;
        const currentShow = selectedProfileProgress.showVocabText !== false;
        const updated = {
            ...selectedProfileProgress,
            showVocabText: !currentShow
        };
        if (updated.showVocabText) {
            updated.useStarsForVocab = false;
        }
        setSelectedProfileProgress(updated);
        saveProfileProgress(selectedProfileId, updated);
    };

    const handleToggleUseStarsForVocab = () => {
        if (!selectedProfileId || !selectedProfileProgress) return;
        const currentUseStars = selectedProfileProgress.useStarsForVocab === true;
        const updated = {
            ...selectedProfileProgress,
            useStarsForVocab: !currentUseStars
        };
        setSelectedProfileProgress(updated);
        saveProfileProgress(selectedProfileId, updated);
    };

    const handleVocabStarCostChange = (val) => {
        if (!selectedProfileId || !selectedProfileProgress) return;
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed >= 0) {
            const updated = {
                ...selectedProfileProgress,
                vocabStarCost: parsed
            };
            setSelectedProfileProgress(updated);
            saveProfileProgress(selectedProfileId, updated);
        }
    };


    useEffect(() => {
        const savedPin = getParentPin();
        if (savedPin) setCurrentPin(savedPin);

        const progress = loadProgress();
        if (progress && progress.childName) {
            setChildNameInput(progress.childName);
        }
    }, [isAuthenticated]);

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
            title: 'รีเซ็ตข้อมูลน้อง?',
            message: '⚠️ ดาวและความก้าวหน้าของโปรไฟล์นี้จะถูกล้าง\n(โปรไฟล์ยังคงอยู่)\nต้องการดำเนินการต่อหรือไม่?',
            variant: 'error',
            confirmText: 'รีเซ็ต',
            onConfirm: () => {
                resetActiveProfileData();
                showAlert({
                    title: 'สำเร็จ',
                    message: '✅ รีเซ็ตข้อมูลของน้องเรียบร้อยแล้วค่ะ',
                    variant: 'success',
                });
            },
        });
    };

    const handleFactoryReset = () => {
        showConfirm({
            title: 'Factory Reset?',
            message: '⚠️ ข้อมูลทั้งหมด (ทุกโปรไฟล์, คำศัพท์, และการตั้งค่า) จะหายไป!\nคุณต้องการดำเนินการต่อหรือไม่?',
            variant: 'error',
            confirmText: 'ลบทั้งหมด',
            onConfirm: () => resetAllData(),
        });
    };

    // ── Export / Import ─────────────────────────────────────────────────────────

    const handleExport = () => {
        try {
            const data = exportAllData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const dateStr = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `larnvocab_backup_${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showAlert({
                title: 'Export สำเร็จ!',
                message: `✅ บันทึกไฟล์ backup เรียบร้อยแล้วค่ะ\n(larnvocab_backup_${dateStr}.json)`,
                variant: 'success',
            });
        } catch (err) {
            showAlert({ title: 'ผิดพลาด', message: `❌ Export ไม่สำเร็จ: ${err.message}`, variant: 'error' });
        }
    };

    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Reset input เผื่อเลือกไฟล์เดิมซ้ำ
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                const profileCount = Array.isArray(jsonData.profiles) ? jsonData.profiles.length : 0;
                const exportDate = jsonData.exportedAt
                    ? new Date(jsonData.exportedAt).toLocaleString('th-TH')
                    : 'ไม่ทราบ';

                showConfirm({
                    title: 'ยืนยันการ Import',
                    message: `📦 ไฟล์: ${file.name}\n📅 วันที่ backup: ${exportDate}\n👤 โปรไฟล์ทั้งหมด: ${profileCount} คน\n\n⚠️ ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลจาก backup\nต้องการดำเนินการต่อหรือไม่?`,
                    variant: 'warning',
                    confirmText: 'Import',
                    onConfirm: () => {
                        try {
                            importAllData(jsonData);
                            showAlert({
                                title: 'Import สำเร็จ!',
                                message: `✅ นำเข้าข้อมูล ${profileCount} โปรไฟล์เรียบร้อยแล้ว\nกำลัง reload...`,
                                variant: 'success',
                                onConfirm: () => window.location.reload(),
                            });
                        } catch (importErr) {
                            showAlert({ title: 'Import ล้มเหลว', message: `❌ ${importErr.message}`, variant: 'error' });
                        }
                    },
                });
            } catch {
                showAlert({ title: 'ผิดพลาด', message: '❌ ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบว่าเป็นไฟล์ JSON ที่ถูกต้องค่ะ', variant: 'error' });
            }
        };
        reader.readAsText(file, 'UTF-8');
    };

    const handleSaveChildName = () => {
        if (!childNameInput.trim()) {
            showAlert({ title: 'ผิดพลาด', message: 'กรุณากรอกชื่อของน้องก่อนค่ะ', variant: 'warning' });
            return;
        }
        const progress = loadProgress();
        const updatedProgress = { ...progress, childName: childNameInput.trim() };
        saveProgress(updatedProgress);
        showAlert({ title: 'สำเร็จ', message: 'บันทึกชื่อของน้องเรียบร้อยแล้วค่ะ', variant: 'success' });
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
                    <button onClick={() => setActiveTab('sync')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'sync' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <RefreshCw size={20} /> Cloud Sync
                    </button>
                    <button onClick={() => setActiveTab('progress')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'progress' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <Star size={20} /> จัดการดาว & ด่าน
                    </button>
                    <button onClick={() => setActiveTab('backup')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'backup' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <Shield size={20} /> Backup
                    </button>
                    <button onClick={() => setActiveTab('data')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <Smartphone size={20} /> Data
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <Lock size={20} /> Settings
                    </button>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    {activeTab === 'progress' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="text-center mb-6">
                                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Star className="text-amber-500" size={32} fill="currentColor" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 font-mali">จัดการดาว & ด่านของเด็กๆ</h2>
                                <p className="text-gray-500 mt-2 font-mali">ปรับปรุงคะแนนดาวสะสม หรือสลับสถานะล็อค/ปลดล็อคบทเรียนของน้องๆ ได้ที่นี่</p>
                            </div>

                            {profiles.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <User className="text-gray-400" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-700 font-mali">ยังไม่มีโปรไฟล์น้องๆ</h3>
                                    <p className="text-gray-500 mt-2 font-mali">กรุณากลับไปสร้างโปรไฟล์ที่หน้าหลักก่อนนะคะ</p>
                                </div>
                            ) : (
                                <div>
                                    {/* เลือกโปรไฟล์ */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 font-mali">👤 โปรไฟล์เด็กที่ต้องการแก้ไข</label>
                                        <select
                                            value={selectedProfileId}
                                            onChange={(e) => handleProfileChange(e.target.value)}
                                            className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-white focus:border-brand-blue focus:outline-none transition-all font-bold text-gray-700 text-lg font-mali"
                                        >
                                            {profiles.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.avatar} {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedProfileProgress && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {/* ส่วนจัดการดาว */}
                                            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-yellow-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2 font-mali">
                                                        <Star size={20} className="text-amber-500" fill="currentColor" />
                                                        จัดการดาวสะสม
                                                    </h3>
                                                    
                                                    {/* แสดงดาวปัจจุบัน */}
                                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-yellow-100/50 mb-4 shadow-sm">
                                                        <div className="text-xs font-bold text-amber-600/80 uppercase tracking-wider mb-1 font-mali">ดาวของน้องในปัจจุบัน</div>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Star size={28} className="text-amber-400 animate-pulse" fill="currentColor" />
                                                            <span className="text-4xl font-black text-amber-600 font-mali">
                                                                {selectedProfileProgress.totalStars || 0}
                                                            </span>
                                                            <span className="text-gray-500 font-bold text-lg font-mali">ดวง</span>
                                                        </div>
                                                    </div>

                                                    {/* ปุ่มจัดการด่วน */}
                                                    <div className="mb-4">
                                                        <div className="text-xs font-bold text-gray-500 mb-2 font-mali">ปุ่มจัดการด่วน:</div>
                                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                                            <button
                                                                onClick={() => handleAddStars(10)}
                                                                className="py-2.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-green-100"
                                                            >
                                                                +10 ดาว
                                                            </button>
                                                            <button
                                                                onClick={() => handleAddStars(50)}
                                                                className="py-2.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-green-100"
                                                            >
                                                                +50 ดาว
                                                            </button>
                                                            <button
                                                                onClick={() => handleAddStars(100)}
                                                                className="py-2.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-green-100"
                                                            >
                                                                +100 ดาว
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <button
                                                                onClick={() => handleAddStars(-10)}
                                                                className="py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-100"
                                                            >
                                                                -10 ดาว
                                                            </button>
                                                            <button
                                                                onClick={() => handleAddStars(-50)}
                                                                className="py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-100"
                                                            >
                                                                -50 ดาว
                                                            </button>
                                                            <button
                                                                onClick={() => handleAddStars(-100)}
                                                                className="py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-100"
                                                            >
                                                                -100 ดาว
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ช่องกรอกข้อมูล */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 font-mali">ระบุจำนวนดาวที่ต้องการกำหนดเอง:</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={starsInput}
                                                        onChange={(e) => handleStarsInputChange(e.target.value)}
                                                        className="w-full p-3 border-2 border-yellow-200 rounded-xl focus:border-amber-400 focus:outline-none text-center text-xl font-bold font-mali text-gray-700 bg-white"
                                                        placeholder="ตัวอย่าง 250"
                                                    />
                                                </div>
                                            </div>

                                            {/* ส่วนจัดการด่าน */}
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2 font-mali">
                                                        <Unlock size={20} className="text-brand-blue" />
                                                        จัดการการปลดล็อคด่าน
                                                    </h3>

                                                    {/* ปุ่มลัดปลดล็อค/ล็อคทั้งหมด */}
                                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                                        <button
                                                            onClick={handleUnlockAll}
                                                            className="flex items-center justify-center gap-1.5 py-2.5 bg-brand-blue hover:bg-blue-600 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-100 font-mali"
                                                        >
                                                            <Unlock size={14} /> ปลดล็อคทุกด่าน
                                                        </button>
                                                        <button
                                                            onClick={handleLockAllExceptOne}
                                                            className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-600 hover:bg-gray-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-gray-200 font-mali"
                                                        >
                                                            <Lock size={14} /> ล็อคหมดยกเว้นด่าน 1
                                                        </button>
                                                    </div>

                                                    <div className="text-xs font-bold text-gray-500 mb-2 font-mali">คลิกที่แต่ละด่านเพื่อสลับสถานะ:</div>
                                                    
                                                    {/* รายชื่อด่าน */}
                                                    <div className="grid grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1">
                                                        {availableSessions.map(sessionId => {
                                                            const isUnlocked = selectedProfileProgress.unlockedSessions?.includes(sessionId);
                                                            return (
                                                                <button
                                                                    key={sessionId}
                                                                    onClick={() => handleToggleSession(sessionId)}
                                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all active:scale-95 font-mali font-bold text-sm ${
                                                                        isUnlocked
                                                                            ? 'bg-green-500 text-white border-green-600 shadow-sm shadow-green-100 hover:bg-green-600'
                                                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                                    }`}
                                                                >
                                                                    <span>ด่านที่ {sessionId}</span>
                                                                    {isUnlocked ? <Unlock size={14} /> : <Lock size={14} className="text-gray-400" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <p className="text-xs text-gray-400 mt-4 leading-relaxed font-mali">
                                                    * ด่านสีเขียวคือปลดล็อคแล้ว น้องๆ สามารถคลิกเข้าไปเล่นได้ทันทีโดยไม่ต้องจ่ายดาวสะสม
                                                </p>
                                            </div>

                                            {/* ส่วนตั้งค่าคำใบ้คำศัพท์ */}
                                            <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-1">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2 font-mali">
                                                        <HelpCircle size={20} className="text-brand-pink" />
                                                        ตั้งค่าคำใบ้คำศัพท์ (ไม่มีรูป)
                                                    </h3>

                                                    {/* Toggle 1: เปิด/ปิดการแสดงคำศัพท์ */}
                                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-rose-100/50 mb-4 shadow-sm flex justify-between items-center">
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-700 font-mali">แสดงคำใบ้คำศัพท์</div>
                                                            <div className="text-xs text-gray-400 font-mali">แสดงตัวสะกดภาษาอังกฤษทันที</div>
                                                        </div>
                                                        <button
                                                            onClick={handleToggleShowVocabText}
                                                            className={`w-14 h-8 rounded-full transition-colors relative flex items-center p-1 ${
                                                                (selectedProfileProgress.showVocabText !== false) ? 'bg-green-500' : 'bg-gray-300'
                                                            }`}
                                                        >
                                                            <div
                                                                className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                                                                    (selectedProfileProgress.showVocabText !== false) ? 'translate-x-6' : 'translate-x-0'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>

                                                    {/* Toggle 2: เปิด/ปิดการใช้ดาว */}
                                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-rose-100/50 mb-4 shadow-sm flex justify-between items-center">
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-700 font-mali">ใช้ดาวแลกคำใบ้</div>
                                                            <div className="text-xs text-gray-400 font-mali">ต้องใช้ดาวแลกจึงจะแสดงคำใบ้</div>
                                                        </div>
                                                        <button
                                                            disabled={selectedProfileProgress.showVocabText !== false}
                                                            onClick={handleToggleUseStarsForVocab}
                                                            className={`w-14 h-8 rounded-full transition-colors relative flex items-center p-1 ${
                                                                selectedProfileProgress.showVocabText !== false 
                                                                    ? 'bg-gray-100 cursor-not-allowed' 
                                                                    : (selectedProfileProgress.useStarsForVocab === true ? 'bg-brand-pink' : 'bg-gray-300')
                                                            }`}
                                                        >
                                                            <div
                                                                className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                                                                    selectedProfileProgress.showVocabText !== false
                                                                        ? 'translate-x-0 bg-gray-200'
                                                                        : (selectedProfileProgress.useStarsForVocab === true ? 'translate-x-6' : 'translate-x-0')
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>

                                                    {/* ตั้งค่าจำนวนดาวที่ต้องใช้ */}
                                                    <div className={`transition-all duration-300 ${
                                                        selectedProfileProgress.showVocabText !== false || selectedProfileProgress.useStarsForVocab !== true
                                                            ? 'opacity-40 pointer-events-none'
                                                            : 'opacity-100'
                                                    }`}>
                                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 font-mali">ระบุจำนวนดาวที่ต้องใช้:</label>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                disabled={selectedProfileProgress.showVocabText !== false || selectedProfileProgress.useStarsForVocab !== true}
                                                                onClick={() => handleVocabStarCostChange(Math.max(0, (selectedProfileProgress.vocabStarCost ?? 10) - 5))}
                                                                className="w-10 h-10 bg-white hover:bg-rose-50 active:scale-95 text-gray-600 font-bold rounded-xl flex items-center justify-center transition-all border border-rose-100 font-mali"
                                                            >
                                                                -5
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                disabled={selectedProfileProgress.showVocabText !== false || selectedProfileProgress.useStarsForVocab !== true}
                                                                value={selectedProfileProgress.vocabStarCost ?? 10}
                                                                onChange={(e) => handleVocabStarCostChange(e.target.value)}
                                                                className="flex-1 p-2 border-2 border-rose-100 rounded-xl focus:border-rose-400 focus:outline-none text-center font-bold font-mali text-gray-700 bg-white"
                                                            />
                                                            <button
                                                                disabled={selectedProfileProgress.showVocabText !== false || selectedProfileProgress.useStarsForVocab !== true}
                                                                onClick={() => handleVocabStarCostChange((selectedProfileProgress.vocabStarCost ?? 10) + 5)}
                                                                className="w-10 h-10 bg-white hover:bg-rose-50 active:scale-95 text-gray-600 font-bold rounded-xl flex items-center justify-center transition-all border border-rose-100 font-mali"
                                                            >
                                                                +5
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-4 leading-relaxed font-mali">
                                                    * การเปิด "ใช้ดาวแลกคำใบ้" จะใช้งานได้ก็ต่อเมื่อปิดการแสดงคำใบ้ปกติ
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="max-w-xl mx-auto">
                            <div className="text-center mb-8">
                                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="text-indigo-600" size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Backup & Restore</h2>
                                <p className="text-gray-500 mt-2">Export ข้อมูลทั้งหมดเป็นไฟล์ JSON เพื่อสำรองข้อมูล</p>
                            </div>

                            {/* Export Section */}
                            <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-green-100 p-3 rounded-xl flex-shrink-0">
                                        <Download className="text-green-600" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-lg mb-1">Export Backup</h3>
                                        <p className="text-gray-500 text-sm mb-4">
                                            บันทึกข้อมูลทั้งหมด (ทุกโปรไฟล์, คำศัพท์, การตั้งค่า) ลงเป็นไฟล์ <code className="bg-gray-100 px-1 rounded text-xs">.json</code>
                                        </p>
                                        <button
                                            onClick={handleExport}
                                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-green-100 transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            <Download size={18} /> Export JSON
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Import Section */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                                        <Upload className="text-blue-600" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-lg mb-1">Import Backup</h3>
                                        <p className="text-gray-500 text-sm mb-4">
                                            โหลดข้อมูลจากไฟล์ backup — <span className="text-orange-500 font-semibold">ข้อมูลปัจจุบันจะถูกแทนที่</span>
                                        </p>
                                        {/* Hidden file input */}
                                        <input
                                            ref={importFileRef}
                                            type="file"
                                            accept=".json,application/json"
                                            className="hidden"
                                            onChange={handleImportFile}
                                        />
                                        <button
                                            onClick={() => importFileRef.current && importFileRef.current.click()}
                                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            <Upload size={18} /> เลือกไฟล์ Backup
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Info box */}
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-500">
                                <p className="font-bold text-gray-700 mb-2">📋 ข้อมูลใน backup file:</p>
                                <ul className="space-y-1 list-disc list-inside">
                                    <li>โปรไฟล์เด็กทั้งหมด (ชื่อ, avatar, ดาว, ด่านที่ผ่าน)</li>
                                    <li>คำศัพท์ที่กำหนดเอง (Custom Vocab)</li>
                                    <li>การตั้งค่า Google Sheets URL</li>
                                    <li>รหัส PIN ผู้ปกครอง</li>
                                </ul>
                            </div>
                        </div>
                    )}

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
                        <div className="text-center py-8 max-w-md mx-auto space-y-6">
                            <div>
                                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <RefreshCw className="text-yellow-500" size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">รีเซ็ตโปรไฟล์นี้</h3>
                                <p className="text-gray-500 mb-4">ล้างดาวและความก้าวหน้าของน้องคนนี้ (โปรไฟล์ยังคงอยู่)</p>
                                <button onClick={handleReset} className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-yellow-200 transition-all w-full">
                                    รีเซ็ตโปรไฟล์นี้
                                </button>
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="text-red-500" size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Factory Reset</h3>
                                <p className="text-gray-500 mb-4">ลบทุกอย่าง: ทุกโปรไฟล์, คำศัพท์, และการตั้งค่าทั้งหมด</p>
                                <button onClick={handleFactoryReset} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-red-200 transition-all w-full">
                                    Factory Reset (ลบทั้งระบบ)
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-sm mx-auto py-4 space-y-8">
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-center text-gray-700 flex items-center justify-center gap-2">
                                    <User size={20} className="text-brand-pink" /> แก้ไขชื่อของน้อง
                                </h3>
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="text"
                                        className="border-2 p-3 rounded-xl text-center text-xl font-bold focus:border-brand-blue focus:outline-none text-gray-700 font-mali"
                                        placeholder="ชื่อของน้อง"
                                        value={childNameInput}
                                        onChange={(e) => setChildNameInput(e.target.value)}
                                    />
                                    <button
                                        onClick={handleSaveChildName}
                                        className="bg-brand-blue hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 font-mali"
                                    >
                                        บันทึกชื่อใหม่
                                    </button>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <h3 className="text-xl font-bold mb-4 text-center text-gray-700 flex items-center justify-center gap-2">
                                    <Lock size={20} className="text-brand-yellow" /> เปลี่ยนรหัสผ่าน (PIN)
                                </h3>
                                <PinChangeForm onSave={handleChangePin} />
                            </div>
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
