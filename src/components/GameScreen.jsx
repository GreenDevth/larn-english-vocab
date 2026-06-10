import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ChevronRight, X, Sparkles, AlertCircle, Settings, Type, HelpCircle, Star } from 'lucide-react';
import { speak } from '../utils/tts';
import { playSound } from '../utils/sound';
import VoiceSettingsModal from './VoiceSettingsModal';
import { useModal } from '../contexts/ModalContext';
import { saveProgress } from '../utils/storage';

const isLetter = (char) => char >= 'A' && char <= 'Z';

const getInitialInput = (word) => {
    const initial = [];
    for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (isLetter(char)) {
            break;
        }
        initial.push(char);
    }
    return initial;
};

const GameScreen = ({ sessionData, onFinish, onExit, userData, onUpdateUserData }) => {
    const { showAlert, showConfirm } = useModal();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [score, setScore] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [activeKeys, setActiveKeys] = useState({});
    const [imageError, setImageError] = useState(false);
    const [revealHint, setRevealHint] = useState(false);
    const [hintPurchased, setHintPurchased] = useState(false);

    // ... (currentWord logic) ...
    const currentWord = sessionData[currentIndex];
    // Filter out any potential empty/header rows
    if (!currentWord) return <div className="p-10 text-center">Loading or Invalid Data...</div>;

    const targetWord = currentWord.en.trim().toUpperCase();
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    // ... (effects) ...
    useEffect(() => {
        setUserInput(getInitialInput(targetWord));
        setImageError(false);
        setRevealHint(false);
        setHintPurchased(false);
        const timeout = setTimeout(() => { speakWord(); }, 500);
        return () => clearTimeout(timeout);
    }, [currentIndex]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showSettings) return;
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
                return;
            }

            // รองรับ Spacebar จาก keyboard จริง
            if (e.key === ' ') {
                e.preventDefault();
                setActiveKeys(prev => ({ ...prev, SPACE: true }));
                setTimeout(() => {
                    setActiveKeys(prev => ({ ...prev, SPACE: false }));
                }, 150);
                handleKeyPress(' ');
                return;
            }

            const key = e.key.toUpperCase();
            if (key.length === 1 && key >= 'A' && key <= 'Z') {
                setActiveKeys(prev => ({ ...prev, [key]: true }));
                setTimeout(() => {
                    setActiveKeys(prev => ({ ...prev, [key]: false }));
                }, 150);
                handleKeyPress(key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [userInput, currentIndex, showSettings, feedback, score]);

    const speakWord = () => { speak(currentWord.en, 'en-US'); };
    const speakThai = () => { speak(currentWord.th, 'th-TH'); };

    const spellWord = async () => {
        window.speechSynthesis.cancel();
        const letters = currentWord.en.split('');
        for (let char of letters) {
            speak(char, 'en-US', false, 1.5);
            await new Promise(r => setTimeout(r, 30));
        }
        speak(currentWord.en, 'en-US', false, 1.1);
    };

    const handleKeyPress = async (char) => {
        if (feedback === 'correct') return;

        const nextIdx = userInput.length;
        const nextExpected = targetWord[nextIdx];

        // ถ้ากด space แต่ตัวถัดไปไม่ใช่ space → ไม่ทำอะไร (ไม่ penalty)
        if (char === ' ' && nextExpected !== ' ') return;

        if (char === nextExpected) {
            // ตัวอักษรถูก
            let newUserInput = [...userInput, char];

            // Auto-append ตัวอักษรที่ไม่ใช่ A-Z (เช่น space, -, ') ต่อท้ายทันที
            while (newUserInput.length < targetWord.length) {
                const nextChar = targetWord[newUserInput.length];
                if (isLetter(nextChar)) {
                    break;
                }
                newUserInput.push(nextChar);
            }

            setUserInput(newUserInput);
            playSound('click');

            if (newUserInput.length === targetWord.length) {
                const newScore = score + 10;
                setFeedback('correct');
                setScore(newScore);
                playSound('win');

                await speak('Excellent!', 'en-US');
                await new Promise(r => setTimeout(r, 1500));

                if (currentIndex + 1 < sessionData.length) {
                    setUserInput([]);
                    setFeedback(null);
                    setCurrentIndex(prev => prev + 1);
                } else {
                    onFinish(newScore);
                }
            }
        } else {
            // ตัวอักษรผิด
            setFeedback('wrong');
            playSound('wrong');
            speak('Try again', 'en-US');
            setScore(prev => Math.max(0, prev - 2));
            setTimeout(() => setFeedback(null), 800);
        }
    };

    const handleMysteryCardClick = () => {
        if (revealHint) {
            setRevealHint(false);
            return;
        }

        const showText = userData?.showVocabText !== false;
        const useStars = userData?.useStarsForVocab === true;
        const starCost = userData?.vocabStarCost ?? 10;

        if (showText) {
            setRevealHint(true);
        } else if (useStars) {
            if (hintPurchased) {
                setRevealHint(true);
            } else {
                showConfirm({
                    title: 'ใช้ดาวดูคำใบ้?',
                    message: `คุณต้องการใช้ดาวสะสม ${starCost} ดวง เพื่อดูคำใบ้คำศัพท์นี้ใช่หรือไม่?`,
                    confirmText: 'ใช้ดาว',
                    cancelText: 'ยกเลิก',
                    onConfirm: () => {
                        const currentStars = userData?.totalStars || 0;
                        if (currentStars >= starCost) {
                            const updated = {
                                ...userData,
                                totalStars: currentStars - starCost
                            };
                            saveProgress(updated);
                            if (onUpdateUserData) onUpdateUserData(updated);
                            setHintPurchased(true);
                            setRevealHint(true);
                            playSound('win');
                        } else {
                            showAlert({
                                title: 'ดาวไม่พอ!',
                                message: `ต้องใช้ดาวสะสม ${starCost} ดวง (คุณมี ${currentStars} ดวง)`,
                                variant: 'warning'
                            });
                        }
                    }
                });
            }
        } else {
            showAlert({
                title: 'คำใบ้ถูกปิดใช้งาน',
                message: 'ผู้ปกครองปิดการใช้งานคำใบ้ข้อความคำศัพท์ค่ะ',
                variant: 'info'
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-4 max-w-3xl mx-auto">
            {/* Settings Modal */}
            {showSettings && <VoiceSettingsModal onClose={() => setShowSettings(false)} />}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <button onClick={onExit} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                        <X size={24} className="text-gray-600" />
                    </button>
                    <button onClick={() => setShowSettings(true)} className="p-2 bg-blue-100 rounded-full hover:bg-blue-200">
                        <Settings size={24} className="text-blue-600" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-amber-100 px-4 py-1 rounded-xl text-amber-700 font-bold border-2 border-amber-200">
                        <Star size={18} className="text-amber-500 animate-pulse" fill="currentColor" />
                        <span>{userData?.totalStars || 0}</span>
                    </div>
                    <div className="bg-yellow-100 px-4 py-1 rounded-xl text-yellow-700 font-bold border-2 border-yellow-200">
                        Score: {score}
                    </div>
                    <div className="text-xl font-bold text-gray-400">
                        {currentIndex + 1} / {sessionData.length}
                    </div>
                </div>
            </div>

            {/* Main Card */}
            <motion.div
                key={currentWord.en}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className={`bg-white rounded-[3rem] shadow-2xl p-6 md:p-10 flex-1 flex flex-col items-center relative transition-colors duration-300 border-b-[12px]
          ${feedback === 'correct' ? 'border-green-400 bg-green-50' :
                        feedback === 'wrong' ? 'border-red-400 bg-red-50' : 'border-indigo-100'}
        `}
            >
                {/* Confetti/Icon Overlay for Feedback */}
                <AnimatePresence>
                    {feedback === 'correct' && (
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1.5 }} exit={{ scale: 0 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                        >
                            <Sparkles size={120} className="text-green-500 drop-shadow-lg" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Image or Mystery Card */}
                {(!currentWord.image || imageError) ? (
                    <motion.div
                        onClick={handleMysteryCardClick}
                        className="w-64 h-64 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-[2rem] shadow-xl border-4 border-white flex flex-col items-center justify-center p-4 cursor-pointer relative overflow-hidden mb-6 select-none"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        layout
                    >
                        {/* Decorative background circle overlays */}
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                        <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

                        <AnimatePresence mode="wait">
                            {!revealHint ? (
                                <motion.div
                                    key="mystery"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-col items-center gap-2 text-white text-center"
                                >
                                    <div className="bg-white/20 p-4 rounded-full mb-1">
                                        <HelpCircle size={48} className="text-white animate-pulse" />
                                    </div>
                                    <span className="text-xl font-black tracking-widest">? ? ?</span>
                                    <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold mt-1">คลิกเพื่อดูคำใบ้</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="hint"
                                    initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, rotateY: -180 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex flex-col items-center gap-2 text-white text-center"
                                >
                                    <div className="bg-white/20 p-4 rounded-full mb-1">
                                        <Sparkles size={48} className="text-yellow-200" />
                                    </div>
                                    <span className="text-3xl font-black tracking-wide font-sans">{targetWord}</span>
                                    <span className="text-xs bg-black/30 px-3 py-1 rounded-full font-bold mt-1">คลิกเพื่อปิดคำใบ้</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="w-64 h-64 bg-gray-100 rounded-[2rem] overflow-hidden mb-6 shadow-inner border-4 border-white">
                        <img
                            src={currentWord.image}
                            alt={currentWord.en}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                            onError={() => setImageError(true)}
                        />
                    </div>
                )}

                {/* Word Display & Sound Controls */}
                <div className="flex flex-col items-center gap-3 mb-8 w-full">
                    <h2 className="text-4xl font-black text-gray-800">{currentWord.th}</h2>

                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={speakWord}
                            className="flex items-center gap-2 px-5 py-3 bg-brand-yellow text-white rounded-2xl shadow-lg hover:scale-105 transition-transform active:scale-95 font-bold"
                        >
                            <Volume2 size={24} /> Listen
                        </button>
                        <button
                            onClick={speakThai}
                            className="flex items-center gap-2 px-5 py-3 bg-brand-green text-white rounded-2xl shadow-lg hover:scale-105 transition-transform active:scale-95 font-bold"
                        >
                            <Volume2 size={24} /> แปลไทย
                        </button>
                        <button
                            onClick={spellWord}
                            className="flex items-center gap-2 px-5 py-3 bg-brand-pink text-white rounded-2xl shadow-lg hover:scale-105 transition-transform active:scale-95 font-bold"
                        >
                            <Type size={24} /> Spell
                        </button>
                    </div>
                </div>

                {/* Spelling Slots */}
                <div className="flex flex-wrap justify-center gap-2 mb-8 min-h-[80px]">
                    {targetWord.split('').map((char, idx) => {
                        const isCharLetter = isLetter(char);
                        if (!isCharLetter) {
                            return (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-center text-4xl font-black text-gray-600 ${char === ' ' ? 'w-6 sm:w-8' : 'w-10 h-16 sm:w-12 sm:h-20'}`}
                                >
                                    {char}
                                </div>
                            );
                        }

                        return (
                            <motion.div
                                key={idx}
                                animate={idx < userInput.length ? { scale: [1, 1.2, 1] } : {}}
                                className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl flex items-center justify-center text-4xl font-black border-b-[6px] 
                    ${idx < userInput.length
                                        ? 'bg-brand-blue text-white border-blue-600 shadow-md'
                                        : 'bg-gray-100 text-gray-300 border-gray-200 dashed border-2'}
                  `}
                            >
                                {userInput[idx] || ''}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Virtual Keyboard */}
                <div className="w-full flex flex-col gap-2 mt-auto pb-4">
                    {[
                        "QWERTYUIOP".split(""),
                        "ASDFGHJKL".split(""),
                        "ZXCVBNM".split("")
                    ].map((row, rowIdx) => (
                        <div key={rowIdx} className="flex justify-center gap-1 sm:gap-2">
                            {row.map((char) => {
                                const isCharDisabled = userInput.includes(char) && targetWord.includes(char) && userInput.filter(c => c === char).length >= targetWord.split(char).length - 1;
                                const isActive = activeKeys[char];

                                return (
                                    <button
                                        key={char}
                                        onClick={() => handleKeyPress(char)}
                                        disabled={isCharDisabled}
                                        className={`w-8 h-10 sm:w-12 sm:h-14 border-2 rounded-lg sm:rounded-xl font-bold text-lg sm:text-xl shadow-sm transition-all flex items-center justify-center
                                            ${isActive
                                                ? 'border-brand-pink bg-pink-100 scale-95 text-brand-pink'
                                                : 'bg-white border-gray-100 hover:border-brand-pink hover:bg-pink-50 active:scale-95 text-gray-600'
                                            }
                                            ${isCharDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        {char}
                                    </button>
                                );
                            })}
                        </div>
                    ))}

                    {/* Spacebar — แสดงเฉพาะเมื่อคำมีช่องว่าง */}
                    {targetWord.includes(' ') && (
                        <div className="flex justify-center mt-1">
                            <button
                                onClick={() => handleKeyPress(' ')}
                                className={`h-10 sm:h-12 px-10 sm:px-16 border-2 rounded-lg sm:rounded-xl font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2
                                    ${activeKeys['SPACE']
                                        ? 'border-brand-pink bg-pink-100 scale-95 text-brand-pink'
                                        : 'bg-white border-gray-100 hover:border-brand-pink hover:bg-pink-50 active:scale-95 text-gray-500'
                                    }
                                `}
                            >
                                <span className="text-lg">⎵</span>
                                <span className="text-sm font-bold">SPACE</span>
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default GameScreen;
