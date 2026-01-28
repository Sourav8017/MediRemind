'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Image, X, Sparkles, Loader2, FlipHorizontal2 } from 'lucide-react';
import api from '@/lib/axios'; // NEW

interface CameraOCRProps {
    onTextExtracted: (text: string, medications: ExtractedMedication[]) => void;
    onClose: () => void;
}

export interface ExtractedMedication {
    name: string;
    dosage: string;
    frequency: string;
    instructions: string;
}

export default function CameraOCR({ onTextExtracted, onClose }: CameraOCRProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    // Start camera stream
    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
            }
        } catch (err) {
            setError('Unable to access camera. Please ensure camera permissions are granted.');
            console.error('Camera error:', err);
        }
    }, [facingMode]);

    // Stop camera stream
    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsStreaming(false);
        }
    }, []);

    // Switch camera
    const switchCamera = () => {
        stopCamera();
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    // Capture photo
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(imageData);
                stopCamera();
            }
        }
    };

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCapturedImage(event.target?.result as string);
                stopCamera();
            };
            reader.readAsDataURL(file);
        }
    };

    // Process image with Gemini OCR
    const processWithGemini = async () => {
        if (!capturedImage) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Use configured axios instance
            const response = await api.post('/process-medication', { image: capturedImage });

            // Axios throws on non-2xx status, so if we get here, it's success.
            const data = response.data;

            // The backend returns a single medication object
            const medication: ExtractedMedication = {
                name: data.name,
                dosage: data.dosage,
                frequency: data.frequency,
                instructions: data.instructions,
            };

            onTextExtracted("Extracted from image", [medication]);

        } catch (err) {
            setError('Failed to process image. Please try again.');
            console.error('OCR error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    // Retake photo
    const retakePhoto = () => {
        setCapturedImage(null);
        startCamera();
    };

    // Start camera on mount
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    // Restart camera when facing mode changes
    useEffect(() => {
        if (isStreaming) {
            startCamera();
        }
    }, [facingMode, startCamera, isStreaming]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-lg overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)]">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--text-primary)]">Scan Prescription</h3>
                            <p className="text-xs text-[var(--text-muted)]">Powered by Gemini AI</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                    >
                        <X size={20} className="text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Camera / Image Area */}
                <div className="relative aspect-[4/3] bg-black">
                    {!capturedImage ? (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Camera overlay guides */}
                            <div className="absolute inset-4 border-2 border-white/30 rounded-xl pointer-events-none">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
                            </div>

                            {/* Camera controls */}
                            {isStreaming && (
                                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                                    <button
                                        onClick={switchCamera}
                                        className="p-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                                    >
                                        <FlipHorizontal2 size={20} />
                                    </button>
                                    <button
                                        onClick={capturePhoto}
                                        className="p-4 rounded-full bg-white text-[var(--primary)] hover:scale-105 transition-transform shadow-lg"
                                    >
                                        <Camera size={28} />
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                                    >
                                        <Image size={20} />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <img
                                src={capturedImage}
                                alt="Captured prescription"
                                className="w-full h-full object-cover"
                            />

                            {/* Processing overlay */}
                            {isProcessing && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                                    <Loader2 size={48} className="text-white animate-spin mb-4" />
                                    <p className="text-white font-medium">Analyzing with Gemini...</p>
                                    <p className="text-white/70 text-sm">Extracting medication details</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Error state */}
                    {error && !capturedImage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)] text-center p-6">
                            <Camera size={48} className="text-[var(--text-muted)] mb-4" />
                            <p className="text-[var(--text-secondary)] mb-4">{error}</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="btn btn-primary"
                            >
                                <Image size={18} />
                                Upload Image Instead
                            </button>
                        </div>
                    )}
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                />

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Actions */}
                <div className="p-4 border-t border-[var(--border)]">
                    {capturedImage ? (
                        <div className="flex gap-3">
                            <button
                                onClick={retakePhoto}
                                className="btn btn-secondary flex-1"
                                disabled={isProcessing}
                            >
                                Retake
                            </button>
                            <button
                                onClick={processWithGemini}
                                className="btn btn-primary flex-1"
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Extract with Gemini
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-[var(--text-muted)]">
                            Position your prescription label within the frame and tap to capture
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
