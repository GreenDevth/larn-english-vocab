import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCcw, Home } from 'lucide-react';

const ScoreBoard = ({ score, totalQuestions, onRetry, onHome }) => {
    useEffect(() => {
        // Fire confetti on mount
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#60A5FA', '#FBBF24', '#F472B6', '#34D399']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#60A5FA', '#FBBF24', '#F472B6', '#34D399']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white max-w-lg w-full rounded-[3rem] shadow-2xl p-8 text-center border-8 border-brand-yellow relative overflow-visible"
            >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-brand-yellow p-6 rounded-full border-8 border-white shadow-lg">
                    <Trophy size={64} className="text-white" />
                </div>

                <h2 className="text-4xl font-black text-gray-800 mt-12 mb-2">สุดยอดมาก!</h2>
                <p className="text-gray-500 text-xl font-medium mb-8">เรียนจบแล้ว เก่งจริงๆ เลย</p>

                <div className="bg-indigo-50 rounded-3xl p-8 mb-8">
                    <p className="text-brand-blue font-bold text-lg">คะแนนที่ได้</p>
                    <p className="text-6xl font-black text-brand-blue mb-2">{score}</p>
                    <p className="text-gray-400">เต็ม {totalQuestions * 10} คะแนน</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={onRetry}
                        className="w-full bg-brand-green text-white py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-green-400 transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <RefreshCcw /> เล่นอีกครั้ง
                    </button>
                    <button
                        onClick={onHome}
                        className="w-full bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold text-xl hover:bg-gray-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Home /> กลับหน้าหลัก
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ScoreBoard;
