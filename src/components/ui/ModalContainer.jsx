import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import BaseModal from './BaseModal';

const ModalContainer = () => {
    const { modalState, close } = useModal();
    const { isOpen, type, title, message, variant, onConfirm, onCancel, confirmText, cancelText } = modalState;

    if (!isOpen) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={close}
            title={title}
            message={message}
            variant={variant}
        >
            {type === 'alert' && (
                <button
                    onClick={onConfirm || close}
                    className="bg-brand-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    {confirmText}
                </button>
            )}

            {type === 'confirm' && (
                <>
                    <button
                        onClick={onCancel || close}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-bold transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${variant === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' :
                                variant === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' :
                                    'bg-brand-blue hover:bg-blue-600 shadow-blue-200'
                            }`}
                    >
                        {confirmText}
                    </button>
                </>
            )}
        </BaseModal>
    );
};

export default ModalContainer;
