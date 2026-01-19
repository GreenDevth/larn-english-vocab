import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Certificate = ({ childName, score, totalQuestions, onClose }) => {
    const certRef = useRef(null);

    const handleDownload = async () => {
        if (!certRef.current) return;

        try {
            const canvas = await html2canvas(certRef.current, {
                scale: 2, // High resolution
                backgroundColor: null,
                useCORS: true
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `certificate_${childName}.png`;
            link.click();
        } catch (err) {
            console.error("Failed to generate certificate", err);
            alert("บันทึกรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        }
    };

    const dateStr = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-4 max-w-4xl w-full relative"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 z-50"
                >
                    <X size={24} />
                </button>

                {/* Certificate Area */}
                <div
                    ref={certRef}
                    className="aspect-[1.414/1] bg-white border-[12px] border-double border-brand-yellow p-8 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-inner"
                    style={{
                        backgroundImage: 'radial-gradient(circle at center, #FFFAF0 0%, #FFFFFF 100%)'
                    }}
                >
                    {/* Decorators */}
                    <div className="absolute top-0 left-0 w-32 h-32 border-t-[20px] border-l-[20px] border-brand-blue rounded-tl-3xl opacity-50"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 border-t-[20px] border-r-[20px] border-brand-blue rounded-tr-3xl opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 border-b-[20px] border-l-[20px] border-brand-blue rounded-bl-3xl opacity-50"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 border-b-[20px] border-r-[20px] border-brand-blue rounded-br-3xl opacity-50"></div>

                    {/* Content */}
                    <div className="relative z-10 w-full">
                        <h1 className="text-5xl md:text-6xl font-black text-brand-blue mb-2 font-mali drop-shadow-sm tracking-wide">
                            ประกาศนียบัตร
                        </h1>
                        <p className="text-2xl md:text-3xl font-bold text-gray-500 mb-8 font-mali">
                            ขอมอบให้ไว้เพื่อแสดงว่า
                        </p>

                        <div className="relative inline-block mb-6">
                            <h2 className="text-6xl md:text-7xl font-black text-brand-pink border-b-4 border-gray-200 pb-2 px-10 font-mali">
                                {childName}
                            </h2>
                            <div className="absolute -right-8 -top-8 text-yellow-400 animate-pulse">
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </div>
                        </div>

                        <p className="text-xl md:text-2xl font-bold text-gray-600 mb-4 font-mali">
                            ได้ผ่านการทดสอบคำศัพท์ภาษาอังกฤษ
                        </p>

                        <div className="bg-yellow-50 inline-block px-8 py-4 rounded-2xl border-2 border-yellow-200 mb-8">
                            <p className="text-xl font-bold text-gray-500">คะแนนที่ได้</p>
                            <p className="text-5xl font-black text-brand-green">
                                {score} / {totalQuestions * 10}
                            </p>
                        </div>

                        <p className="text-lg text-gray-400 font-mali">
                            ให้ไว้ ณ วันที่ {dateStr}
                        </p>

                        <div className="mt-8 flex justify-center gap-12">
                            <div className="text-center">
                                <div className="w-32 border-b-2 border-gray-300 mb-2"></div>
                                <p className="text-sm text-gray-400">ผู้ปกครอง</p>
                            </div>
                            <div className="text-center">
                                <div className="w-32 border-b-2 border-gray-300 mb-2"></div>
                                <p className="text-sm text-gray-400">ครูผู้สอน</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-brand-blue text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Download size={24} />
                        บันทึกรูปภาพ
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-600 px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-300 transition-all active:scale-95"
                    >
                        ปิด
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Certificate;
