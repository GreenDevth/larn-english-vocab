import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export const ModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: 'alert', // 'alert' | 'confirm' | 'custom'
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        confirmText: 'ตกลง',
        cancelText: 'ยกเลิก',
        variant: 'info', // 'info' | 'success' | 'warning' | 'error'
    });

    const close = useCallback(() => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const showAlert = useCallback(({ title, message, variant = 'info', onConfirm, confirmText = 'ตกลง' }) => {
        setModalState({
            isOpen: true,
            type: 'alert',
            title,
            message,
            variant,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                close();
            },
            confirmText,
        });
    }, [close]);

    const showConfirm = useCallback(({ title, message, variant = 'warning', onConfirm, onCancel, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก' }) => {
        setModalState({
            isOpen: true,
            type: 'confirm',
            title,
            message,
            variant,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                close();
            },
            onCancel: () => {
                if (onCancel) onCancel();
                close();
            },
            confirmText,
            cancelText,
        });
    }, [close]);

    return (
        <ModalContext.Provider value={{ modalState, close, showAlert, showConfirm }}>
            {children}
        </ModalContext.Provider>
    );
};
