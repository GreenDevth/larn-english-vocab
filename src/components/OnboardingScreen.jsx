import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight } from 'lucide-react';
import { setChildName } from '../utils/storage';

const OnboardingScreen = ({ onComplete }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Please enter your name / กรุณากรอกชื่อน้อง');
            return;
        }
        setChildName(name.trim());
        onComplete(name.trim());
    };

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] shadow-xl p-8 max-w-md w-full text-center"
            >
                <div className="w-24 h-24 bg-brand-blue rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <User size={48} className="text-white" />
                </div>

                <h1 className="text-3xl font-black text-gray-800 mb-2 font-mali">ยินดีต้อนรับ!</h1>
                <p className="text-gray-500 mb-8 font-mali text-lg">บอกชื่อให้น้องฮูกรู้จักหน่อยครับ</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="text-left">
                        <label className="block text-gray-700 font-bold mb-2 ml-2">ชื่อของหนู (Nickname)</label>
                        <input
                            type="text"
                            className="w-full px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-brand-pink focus:outline-none text-xl font-bold text-center"
                            placeholder="เช่น น้องต้นกล้า"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                        />
                        {error && <p className="text-red-500 text-sm mt-2 ml-2">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        className="mt-4 bg-brand-yellow text-white text-xl font-bold py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        เริ่มเรียนรู้เลย! <ArrowRight size={24} />
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default OnboardingScreen;
