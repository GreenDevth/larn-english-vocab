import React, { useState, useEffect } from 'react';
import { Home, Lock, FileText, RefreshCw, Trash2, CheckCircle, Smartphone } from 'lucide-react';
import { getVocabData, saveVocabData, resetAllData, getParentPin, setParentPin, saveProgress, loadProgress } from '../utils/storage';
import { fetchVocabFromSheet } from '../utils/googleSheet';

const ParentDashboard = ({ onExit }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [activeTab, setActiveTab] = useState('sync');
    const [message, setMessage] = useState('');
    const [currentPin, setCurrentPin] = useState('1234');

    // Sync State
    const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('larnvocab_sheet_url') || '');
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(localStorage.getItem('larnvocab_last_sync') || '-');

    useEffect(() => {
        const savedPin = getParentPin();
        if (savedPin) setCurrentPin(savedPin);
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (pinInput === currentPin) {
            setIsAuthenticated(true);
        } else {
            alert('รหัสผ่านไม่ถูกต้อง (Default: 1234)');
        }
    };

    const handleSync = async () => {
        if (!sheetUrl) return;
        setIsSyncing(true);
        setMessage('');
        try {
            const data = await fetchVocabFromSheet(sheetUrl);
            saveVocabData(data);
            localStorage.setItem('larnvocab_sheet_url', sheetUrl);
            const time = new Date().toLocaleString();
            localStorage.setItem('larnvocab_last_sync', time);
            setLastSyncTime(time);
            setMessage(`✅ Sync สำเร็จ! โหลดคำศัพท์มาทั้งหมด ${data.length} คำ`);
        } catch (error) {
            setMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleReset = () => {
        if (confirm('⚠️ คำเตือน: ข้อมูลความก้าวหน้าทั้งหมด จะหายไป!')) {
            resetAllData();
        }
    };

    const handleChangePin = (newPin) => {
        setParentPin(newPin);
        setCurrentPin(newPin);
        alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
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
                            <div className="text-center mb-8">
                                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="text-green-600" size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Google Sheets Sync</h2>
                                <p className="text-gray-500 mt-2">เชื่อมต่อฐานข้อมูลคำศัพท์จาก Cloud</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Google Apps Script URL</label>
                                <input
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-500 focus:outline-none transition-colors"
                                    placeholder="https://script.google.com/..."
                                    value={sheetUrl}
                                    onChange={e => setSheetUrl(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleSync}
                                disabled={isSyncing || !sheetUrl}
                                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-3 transition-all
                                    ${isSyncing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600 hover:scale-[1.02]'}
                                `}
                            >
                                {isSyncing ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
                                {isSyncing ? 'กำลังดึงข้อมูล...' : 'Sync ข้อมูลเดี๋ยวนี้'}
                            </button>

                            {message && (
                                <div className={`mt-6 p-4 rounded-xl text-center font-bold border ${message.includes('สำเร็จ') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {message}
                                </div>
                            )}

                            <p className="text-center text-gray-400 text-sm mt-8">
                                Sync ล่าสุด: {lastSyncTime}
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
                onClick={() => newPin.length === 4 ? onSave(newPin) : alert('กรุณากรอก 4 หลัก')}
                className="bg-brand-pink hover:bg-pink-600 text-white py-3 rounded-xl font-bold transition-colors"
            >
                บันทึกรหัสใหม่
            </button>
        </div>
    );
};

export default ParentDashboard;
