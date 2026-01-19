import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ChevronRight, X, Sparkles, AlertCircle, Settings, Type } from 'lucide-react';
import { speak } from '../utils/tts';
import { playSound } from '../utils/sound';
import VoiceSettingsModal from './VoiceSettingsModal';

const GameScreen = ({ sessionData, onFinish, onExit }) => {
    // ... (state) ...
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [score, setScore] = useState(0);
    const [showSettings, setShowSettings] = useState(false);

    // ... (currentWord logic) ...
    const currentWord = sessionData[currentIndex];
    // Filter out any potential empty/header rows
    if (!currentWord) return <div className="p-10 text-center">Loading or Invalid Data...</div>;

    const targetWord = currentWord.en.trim().toUpperCase();
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    // ... (effects) ...
    useEffect(() => {
        const timeout = setTimeout(() => { speakWord(); }, 500);
        return () => clearTimeout(timeout);
    }, [currentIndex]);

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
        if (char === targetWord[nextIdx]) {
            // Correct letter
            const newUserInput = [...userInput, char];
            setUserInput(newUserInput);

            // Sound Effect instead of Speak
            playSound('click');

            if (newUserInput.length === targetWord.length) {
                // Word Complete
                setFeedback('correct');
                setScore(s => s + 10);
                playSound('win');

                // Wait for speech to finish BEFORE transitioning
                await speak(`Excellent!`, 'en-US');

                // Add extra delay for user to appreciate the victory
                await new Promise(r => setTimeout(r, 1500));

                if (currentIndex + 1 < sessionData.length) {
                    setUserInput([]);
                    setFeedback(null);
                    setCurrentIndex(prev => prev + 1);
                } else {
                    onFinish(score + 10);
                }
            }
        } else {
            // Wrong letter
            setFeedback('wrong');
            playSound('wrong');
            speak(`Try again`, 'en-US');

            setScore(prev => Math.max(0, prev - 2));

            setTimeout(() => setFeedback(null), 800);
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

                {/* Image */}
                <div className="w-64 h-64 bg-gray-100 rounded-[2rem] overflow-hidden mb-6 shadow-inner border-4 border-white">
                    <img
                        src={currentWord.image}
                        alt={currentWord.en}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                            // Fallback image
                            e.target.src = `https://placehold.co/400x400/png?text=${currentWord.en}`;
                        }}
                    />
                </div>

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
                    {targetWord.split('').map((char, idx) => (
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
                    ))}
                </div>

                {/* Virtual Keyboard */}
                <div className="w-full flex flex-col gap-2 mt-auto pb-4">
                    {[
                        "QWERTYUIOP".split(""),
                        "ASDFGHJKL".split(""),
                        "ZXCVBNM".split("")
                    ].map((row, rowIdx) => (
                        <div key={rowIdx} className="flex justify-center gap-1 sm:gap-2">
                            {row.map((char) => (
                                <button
                                    key={char}
                                    onClick={() => handleKeyPress(char)}
                                    disabled={userInput.includes(char) && targetWord.includes(char) && userInput.filter(c => c === char).length >= targetWord.split(char).length - 1}
                                    className="w-8 h-10 sm:w-12 sm:h-14 bg-white border-2 border-gray-100 hover:border-brand-pink hover:bg-pink-50 rounded-lg sm:rounded-xl font-bold text-lg sm:text-xl text-gray-600 shadow-sm active:scale-95 transition-all flex items-center justify-center"
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default GameScreen;
