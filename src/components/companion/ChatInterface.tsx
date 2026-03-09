'use client';

import React, { useState } from 'react';
import { useCompanion } from '@/context/CompanionContext';
import { AnimatePresence } from 'framer-motion';
import { Toast, ToastType } from '@/components/ui/Toast';
import ChatInputOverlay from './ChatInputOverlay';

export default function ChatInterface() {
    const { isProcessing, isLoading } = useCompanion();
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    return (
        <>
            {/* Input Overlay handled by dedicated component to properly show image previews */}
            <ChatInputOverlay />

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
