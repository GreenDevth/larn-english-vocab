import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star, Lock, User, Settings } from 'lucide-react';

const WelcomeScreen = ({ sessions, onStartSession, onUnlockSession, onOpenParent, userData }) => {
    const { totalStars, childName, unlockedSessions = [1] } = userData;

    return (
        <div className="min-h-screen p-4 pb-20 bg-blue-50">
            <header className="text-center mb-10 pt-8">
                {/* Child Profile Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                    <div className="w-8 h-8 bg-brand-pink rounded-full flex items-center justify-center text-white">
                        <User size={16} />
                    </div>
                    <span className="font-bold text-gray-600 font-mali">{childName}</span>
                </div>

                <div className="absolute top-4 right-4">
                    <button onClick={onOpenParent} className="p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white shadow-sm transition-all border border-gray-100">
                        <Settings size={24} className="text-gray-400 hover:text-brand-pink" />
                    </button>
                </div>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-block bg-white p-4 rounded-full shadow-lg mb-4"
                >
                    <BookOpen size={48} className="text-brand-blue" />
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 drop-shadow-sm font-mali">
                    ศัพท์หรรษา
                </h1>
                <p className="text-gray-500 text-xl font-medium font-mali">สนุกกับภาษาอังกฤษวันละคำ!</p>

                <div className="mt-6 flex justify-center">
                    <div className="bg-yellow-100 text-yellow-700 px-6 py-2 rounded-full font-bold text-xl flex items-center gap-2 shadow-inner border-2 border-yellow-200">
                        <Star size={24} fill="currentColor" />
                        <span>สะสมดาว: {totalStars} ดวง</span>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {Object.keys(sessions).map((sessionIdString, index) => {
                    const sessionId = parseInt(sessionIdString);
                    const isUnlocked = unlockedSessions.includes(sessionId);
                    const isCompleted = userData.completedSessions?.includes(sessionId);

                    return (
                        <motion.div
                            key={sessionId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={isUnlocked ? { scale: 1.05, rotate: -1 } : {}}
                            whileTap={isUnlocked ? { scale: 0.95 } : {}}
                            onClick={() => {
                                if (isUnlocked) {
                                    onStartSession(sessionId);
                                } else {
                                    // Lock click handler
                                    if (confirm(`ด่านนี้ล็อคอยู่! ต้องการใช้ 50 ดาวแลกไหม?`)) {
                                        onUnlockSession(sessionId);
                                    }
                                }
                            }}
                            className={`rounded-3xl overflow-hidden shadow-xl border-b-8 cursor-pointer relative
                                ${isUnlocked
                                    ? 'bg-white border-brand-blue'
                                    : 'bg-gray-200 border-gray-400 opacity-80'
                                }
                            `}
                        >
                            {/* Lock Overlay */}
                            {!isUnlocked && (
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-10">
                                    <div className="bg-white p-4 rounded-full shadow-2xl">
                                        <Lock size={40} className="text-gray-500" />
                                    </div>
                                </div>
                            )}

                            {/* Completed Badge */}
                            {isCompleted && (
                                <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow z-10">
                                    ผ่านแล้ว
                                </div>
                            )}

                            <div className={`${isUnlocked ? 'bg-brand-blue' : 'bg-gray-400'} p-8 flex items-center justify-center transition-colors`}>
                                <span className="text-6xl font-black text-white drop-shadow-md font-mali">
                                    {sessionId}
                                </span>
                            </div>
                            <div className="p-6 text-center">
                                <h3 className="text-2xl font-bold text-gray-700 mb-2 font-mali">บทที่ {sessionId}</h3>
                                <p className="text-gray-400 font-medium mb-4 font-mali">{sessions[sessionId].length} คำศัพท์</p>
                                <button
                                    className={`w-full py-3 rounded-xl font-bold text-lg shadow-md transition-colors font-mali
                                        ${isUnlocked
                                            ? 'bg-brand-yellow text-white hover:bg-yellow-400'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {isUnlocked ? 'เริ่มเลย!' : 'ล็อค'}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default WelcomeScreen;
