import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const icons = {
    info: <Info className="text-blue-500" size={32} />,
    success: <CheckCircle className="text-green-500" size={32} />,
    warning: <AlertTriangle className="text-orange-500" size={32} />,
    error: <AlertCircle className="text-red-500" size={32} />
};

const bgColors = {
    info: 'bg-blue-50',
    success: 'bg-green-50',
    warning: 'bg-orange-50',
    error: 'bg-red-50'
};

const BaseModal = ({ isOpen, onClose, title, message, children, variant = 'info' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        {/* Modal Card */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
                        >
                            {/* Header */}
                            <div className={`p-6 flex items-center gap-4 ${bgColors[variant]}`}>
                                <div className="bg-white p-2 rounded-full shadow-sm">
                                    {icons[variant]}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 flex-1">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-black/5 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                                    {message}
                                </p>
                            </div>

                            {/* Footer (Actions) */}
                            <div className="p-6 pt-0 flex gap-3 justify-end">
                                {children}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BaseModal;
