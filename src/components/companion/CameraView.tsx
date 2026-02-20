'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { useCompanion } from '@/context/CompanionContext';

export default function CameraView() {
    const { cameraVideoRef } = useCompanion();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<{ name: string, message: string } | null>(null);

    const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let ignore = false;

        const startCamera = async () => {
            try {
                // Request camera access - simplified constraints
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: true, // Accept any video source
                    audio: false
                });

                if (ignore) {
                    newStream.getTracks().forEach(track => track.stop());
                    return;
                }

                stream = newStream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.error("Play error:", e));

                    // Sync with context ref for frame capture
                    if (cameraVideoRef) {
                        cameraVideoRef.current = videoRef.current;
                    }
                }
                setError(null);
            } catch (err: any) {
                if (ignore) return;
                console.error("Camera access error:", err);

                // Diagnostic: List devices
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    if (!ignore) {
                        setAvailableDevices(devices);
                        console.table(devices);
                    }
                } catch (e) {
                    console.error("Error enumerating devices:", e);
                }

                setError({
                    name: err.name || 'UnknownError',
                    message: err.message || 'An unknown error occurred accessing the camera.'
                });
            }
        };

        startCamera();

        // Cleanup function to stop tracks when component unmounts
        return () => {
            ignore = true;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Simulation Mode if no camera found
    const isNotFoundError = error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError';

    if (isNotFoundError) {
        return (
            <div className="absolute inset-0 z-0 bg-gray-900 flex flex-col items-center justify-center">
                <div className="text-nature-green opacity-50 mb-4 animate-pulse">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M23 19C23 19 23 20 22 21C21 22 20 22 20 22H4C4 22 3 22 2 21C1 20 1 19 1 19V8C1 8 1 7 2 6C3 5 4 5 4 5H7L9 3H15L17 5H20C20 5 21 5 22 6C23 7 23 8 23 8V19Z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                </div>
                <p className="text-white font-medium">Camera Simulation Mode</p>
                <p className="text-gray-400 text-sm mt-2 max-w-xs text-center">
                    No physical camera detected. This placeholder allows you to test the UI flow.
                </p>
                {/* Simulated content could go here, e.g. a static image of a plant */}
                <div className="mt-8 w-64 h-48 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                    <span className="text-gray-500">Live Feed Placeholder</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-black text-white p-4 text-center z-50 absolute inset-0 overflow-y-auto">
                <p className="text-red-400 font-bold mb-2">Camera Error: {error.name}</p>
                <p className="text-sm text-gray-300 mb-4">{error.message}</p>

                <div className="text-left bg-gray-900 p-4 rounded max-w-md w-full">
                    <p className="text-xs text-gray-400 mb-2 font-mono">DEBUG: Available Devices ({availableDevices.length})</p>
                    <ul className="text-xs space-y-1">
                        {availableDevices.map((d, i) => (
                            <li key={i} className={d.kind === 'videoinput' ? 'text-green-400' : 'text-gray-600'}>
                                {d.kind}: {d.label || '(unnamed)'}
                            </li>
                        ))}
                    </ul>
                    {availableDevices.length === 0 && <p className="text-xs text-red-500">No devices found.</p>}
                </div>

                <p className="text-xs text-gray-500 mt-4">If no 'videoinput' is listed above, your browser does not see a camera.</p>
            </div>
        );
    }

    return (
        <motion.div
            className="absolute inset-0 z-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
            />
        </motion.div>
    );
}
