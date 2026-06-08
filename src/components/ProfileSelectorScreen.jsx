import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowRight, Settings, Star } from 'lucide-react';
import {
    getAllProfiles,
    createProfile,
    deleteProfile,
    getProfileProgress,
} from '../utils/storage';
import { useModal } from '../contexts/ModalContext';

const AVATARS = [
    '🐶', '🐱', '🐸', '🦊', '🐼', '🐨', '🦁', '🐯',
    '🦋', '🌸', '🌈', '⭐', '🚀', '🎮', '🎨', '🎵',
    '🏆', '🍭', '🌟', '🎯',
];

const CARD_GRADIENTS = [
    { from: '#f472b6', to: '#ec4899', border: '#db2777' }, // pink
    { from: '#60a5fa', to: '#3b82f6', border: '#2563eb' }, // blue
    { from: '#34d399', to: '#10b981', border: '#059669' }, // green
    { from: '#fbbf24', to: '#f59e0b', border: '#d97706' }, // yellow/amber
    { from: '#a78bfa', to: '#8b5cf6', border: '#7c3aed' }, // purple
    { from: '#22d3ee', to: '#06b6d4', border: '#0891b2' }, // cyan
];

const ProfileSelectorScreen = ({ onSelectProfile, onOpenParent }) => {
    const [profiles, setProfiles] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const { showConfirm } = useModal();

    useEffect(() => {
        setProfiles(getAllProfiles());
    }, []);

    const refreshProfiles = () => setProfiles(getAllProfiles());

    const handleSelect = (profile) => {
        onSelectProfile(profile.id, profile.name);
    };

    const handleCreate = () => {
        if (!newName.trim()) return;
        const id = createProfile(newName.trim(), selectedAvatar);
        setShowAddForm(false);
        setNewName('');
        setSelectedAvatar(AVATARS[0]);
        onSelectProfile(id, newName.trim());
    };

    const handleDelete = (profile, e) => {
        e.stopPropagation();
        showConfirm({
            title: 'ลบโปรไฟล์?',
            message: `ต้องการลบโปรไฟล์ "${profile.name}" หรือไม่?\n⚠️ ดาวและความก้าวหน้าทั้งหมดจะหายไป`,
            variant: 'error',
            confirmText: 'ลบ',
            onConfirm: () => {
                deleteProfile(profile.id);
                refreshProfiles();
            },
        });
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
        setNewName('');
        setSelectedAvatar(AVATARS[0]);
    };

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            }}
        >
            {/* Decorative blobs */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            {/* Parent Settings Button */}
            <button
                onClick={onOpenParent}
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-all z-20 shadow"
                title="ผู้ปกครอง"
            >
                <Settings size={22} className="text-white" />
            </button>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 py-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10"
                >
                    <motion.div
                        animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="text-7xl mb-4 inline-block"
                    >
                        📚
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg font-mali mb-2">
                        ศัพท์หรรษา
                    </h1>
                    <p className="text-white/80 text-xl font-mali">
                        {profiles.length > 0 ? 'ใครกำลังเล่นอยู่?' : 'ยินดีต้อนรับ!'}
                    </p>
                </motion.div>

                <div className="w-full max-w-2xl">
                    {/* Profile Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                        <AnimatePresence>
                            {profiles.map((profile, idx) => {
                                const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                                const progress = getProfileProgress(profile.id);
                                return (
                                    <motion.div
                                        key={profile.id}
                                        initial={{ opacity: 0, scale: 0.7, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.7 }}
                                        transition={{ delay: idx * 0.07, type: 'spring', stiffness: 260, damping: 20 }}
                                        whileHover={{ scale: 1.06, y: -5, transition: { duration: 0.2 } }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => handleSelect(profile)}
                                        className="relative cursor-pointer rounded-3xl overflow-hidden shadow-2xl select-none"
                                        style={{
                                            background: `linear-gradient(145deg, ${gradient.from}, ${gradient.to})`,
                                            borderBottom: `6px solid ${gradient.border}`,
                                        }}
                                    >
                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => handleDelete(profile, e)}
                                            className="absolute top-2 right-2 w-7 h-7 bg-black/25 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors z-10 shadow"
                                        >
                                            <Trash2 size={12} className="text-white" />
                                        </button>

                                        {/* Card Content */}
                                        <div className="p-5 flex flex-col items-center gap-2">
                                            <motion.div
                                                whileHover={{ scale: 1.2, rotate: 10 }}
                                                className="text-5xl leading-none"
                                            >
                                                {profile.avatar}
                                            </motion.div>
                                            <div className="text-white font-black text-lg text-center drop-shadow font-mali leading-tight">
                                                {profile.name}
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full">
                                                <Star size={13} className="text-yellow-300" fill="currentColor" />
                                                <span className="text-yellow-200 font-bold text-sm">
                                                    {progress.totalStars} ดาว
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Add Profile Card (show only if form is hidden) */}
                        {!showAddForm && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: profiles.length * 0.07 }}
                                whileHover={{ scale: 1.06, y: -5 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setShowAddForm(true)}
                                className="cursor-pointer rounded-3xl overflow-hidden shadow-lg border-4 border-dashed border-white/40 bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center p-6 gap-3 min-h-[160px]"
                            >
                                <div className="w-14 h-14 bg-white/25 rounded-full flex items-center justify-center">
                                    <Plus size={30} className="text-white" />
                                </div>
                                <span className="text-white/80 font-bold text-center font-mali text-sm">
                                    เพิ่มผู้เล่นใหม่
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* Add Profile Form */}
                    <AnimatePresence>
                        {showAddForm && (
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                                className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl"
                            >
                                <h3 className="text-xl font-black text-gray-800 text-center mb-5 font-mali">
                                    🎉 สร้างโปรไฟล์ใหม่
                                </h3>

                                {/* Avatar Picker */}
                                <div className="mb-4">
                                    <p className="text-sm font-bold text-gray-500 mb-2 ml-1 font-mali">
                                        เลือกตัวละคร
                                    </p>
                                    <div className="grid grid-cols-10 gap-1 p-2 bg-gray-50 rounded-2xl">
                                        {AVATARS.map((av) => (
                                            <button
                                                key={av}
                                                onClick={() => setSelectedAvatar(av)}
                                                className={`text-xl sm:text-2xl p-1 rounded-xl transition-all
                                                    ${selectedAvatar === av
                                                        ? 'bg-indigo-500 scale-110 shadow-md'
                                                        : 'hover:bg-gray-200 active:scale-95'
                                                    }`}
                                            >
                                                {av}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Preview */}
                                    <div className="text-center mt-3">
                                        <span className="text-5xl">{selectedAvatar}</span>
                                    </div>
                                </div>

                                {/* Name Input */}
                                <div className="mb-5">
                                    <p className="text-sm font-bold text-gray-500 mb-2 ml-1 font-mali">
                                        ชื่อของหนู
                                    </p>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-xl font-bold text-center font-mali transition-colors"
                                        placeholder="เช่น น้องต้นกล้า"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreate();
                                        }}
                                        autoFocus
                                        maxLength={20}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCancelAdd}
                                        className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold font-mali hover:bg-gray-200 transition-colors active:scale-95"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!newName.trim()}
                                        className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold font-mali shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        เริ่มเลย! <ArrowRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* First-time hint */}
                    {profiles.length === 0 && !showAddForm && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-center text-white/70 font-mali text-lg mt-4"
                        >
                            👆 กดการ์ดเพิ่มผู้เล่นเพื่อเริ่มต้น!
                        </motion.p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileSelectorScreen;
