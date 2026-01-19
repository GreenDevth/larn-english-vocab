import React, { useState, useEffect } from 'react';
import { X, Volume2 } from 'lucide-react';
import { getVoices, getVoicePreference, setVoicePreference, speak } from '../utils/tts';

const VoiceSettingsModal = ({ onClose }) => {
    const [voices, setVoices] = useState([]);
    const [enVoice, setEnVoice] = useState('');
    const [thVoice, setThVoice] = useState('');

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const allVoices = await getVoices();
        setVoices(allVoices);

        const prefEn = getVoicePreference('en');
        const prefTh = getVoicePreference('th');

        // Set initial selection logic
        const defaultEn = allVoices.find(v => v.lang.startsWith('en-US'))?.voiceURI || allVoices.find(v => v.lang.startsWith('en'))?.voiceURI || '';
        const defaultTh = allVoices.find(v => v.lang === 'th-TH')?.voiceURI || '';

        setEnVoice(prefEn || defaultEn);
        setThVoice(prefTh || defaultTh);
    };

    const handleSave = () => {
        setVoicePreference('en', enVoice);
        setVoicePreference('th', thVoice);
        onClose();
    };

    const enVoicesList = voices.filter(v => v.lang.startsWith('en'));
    const thVoicesList = voices.filter(v => v.lang.startsWith('th'));

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white px-8 py-6 rounded-3xl w-full max-w-md shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Volume2 className="text-brand-blue" /> ตั้งค่าเสียง
                </h2>

                <div className="space-y-6">
                    {/* English Voice */}
                    <div>
                        <label className="block text-gray-600 font-bold mb-2">เสียงภาษาอังกฤษ (English)</label>
                        <div className="flex gap-2">
                            <select
                                value={enVoice}
                                onChange={(e) => setEnVoice(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-brand-blue outline-none"
                            >
                                {enVoicesList.map(v => (
                                    <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => {
                                    setVoicePreference('en', enVoice);
                                    speak("Hello, friend!", 'en-US');
                                }}
                                className="p-3 bg-blue-100 text-blue-600 rounded-xl"
                            >
                                <Volume2 size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Thai Voice */}
                    <div>
                        <label className="block text-gray-600 font-bold mb-2">เสียงภาษาไทย (Thai)</label>
                        <div className="flex gap-2">
                            <select
                                value={thVoice}
                                onChange={(e) => setThVoice(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-brand-blue outline-none"
                            >
                                {thVoicesList.length > 0 ? (
                                    thVoicesList.map(v => (
                                        <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                                    ))
                                ) : (
                                    <option value="">ไม่พบเสียงภาษาไทยในเครื่องนี้</option>
                                )}
                            </select>
                            <button
                                onClick={() => {
                                    setVoicePreference('th', thVoice);
                                    speak("สวัสดีครับเพื่อนๆ", 'th-TH');
                                }}
                                className="p-3 bg-blue-100 text-blue-600 rounded-xl"
                            >
                                <Volume2 size={24} />
                            </button>
                        </div>
                        {thVoicesList.length === 0 && (
                            <p className="text-xs text-red-400 mt-2">* อุปกรณ์นี้อาจไม่มีเสียงภาษาไทยติดตั้งอยู่</p>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full mt-8 bg-brand-green text-white py-3 rounded-2xl font-bold text-lg shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                    บันทึก
                </button>
            </div>
        </div>
    );
};

export default VoiceSettingsModal;
