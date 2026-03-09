'use client';

import React from 'react';
import { useCompanion } from '@/context/CompanionContext';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import SignInScreen from '@/components/companion/SignInScreen';
import CompanionLayout from '@/components/companion/CompanionLayout';

export default function AppGate() {
    const { authChecked, userId } = useCompanion();

    if (!authChecked) {
        // Your existing loading UI can go here if you have one
        return (
            <div className="fixed inset-0 bg-[#F2ECE7]">
                <div className="flex flex-col h-full w-[90%] max-w-3xl mx-auto p-4">
                    <div className="h-28 flex-shrink-0" />
                    <div className="w-full max-w-md mx-auto">
                        <div className="bg-[#F7F5F0] border border-[#8B9276] rounded-[15px_25px_15px_20px] texture-grain overflow-hidden p-7">
                            <div className="text-neutral-800 leading-relaxed font-serif">
                                Hi! I’m {BRAND.assistantName}.
                                <br />
                                One sec — checking your sign-in…
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!userId) {
        return <SignInScreen />;
    }

    return <CompanionLayout />;
}