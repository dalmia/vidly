import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, X, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Define missing SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
}

interface SpeechRecognitionResultList {
    [index: number]: {
        [index: number]: SpeechRecognitionResult;
        isFinal: boolean;
    };
    length: number;
}

interface SpeechRecognitionError extends Event {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionError) => void) | null;
    onend: (() => void) | null;
}

// Add type definition for the SpeechRecognition constructor
interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
}

interface VoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTranscript: (transcript: string) => void;
    buttonPosition?: { top: number; left: number; width: number };
}

// Add missing type definitions
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

// Extend the SpeechRecognition interface to include the onstart property
interface ExtendedSpeechRecognition extends SpeechRecognition {
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, onTranscript, buttonPosition }) => {
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [waveformData, setWaveformData] = useState<number[]>(Array(48).fill(3));
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Initialize speech recognition and start listening when modal opens
    useEffect(() => {
        if (isOpen) {
            setTranscript('');
            setInterimTranscript('');
            setWaveformData(Array(48).fill(3));
            setIsProcessing(false);

            // Check if browser supports SpeechRecognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert('Your browser does not support speech recognition. Please try Chrome or Edge.');
                return;
            }

            // Initialize audio context for visualization
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;

                const bufferLength = analyserRef.current.frequencyBinCount;
                dataArrayRef.current = new Uint8Array(bufferLength);

                // Get microphone input
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        const source = audioContextRef.current!.createMediaStreamSource(stream);
                        source.connect(analyserRef.current!);

                        // Start visualization
                        updateWaveform();

                        // Start speech recognition
                        const recognition = new SpeechRecognition() as ExtendedSpeechRecognition;
                        recognition.continuous = true;
                        recognition.interimResults = true;
                        recognition.lang = 'en-US';

                        recognition.onstart = () => {
                            setIsListening(true);
                        };

                        recognition.onresult = (event: SpeechRecognitionEvent) => {
                            let interimTranscript = '';
                            let finalTranscript = '';

                            for (let i = event.resultIndex; i < event.results.length; i++) {
                                const transcript = event.results[i][0].transcript;
                                if (event.results[i].isFinal) {
                                    finalTranscript += transcript;
                                } else {
                                    interimTranscript += transcript;
                                }
                            }

                            if (finalTranscript) {
                                // Update the transcript state with the new final transcript
                                const newTranscript = (transcript + ' ' + finalTranscript).trim();
                                setTranscript(newTranscript);

                                // Send the final transcript to the parent component in real-time
                                // This ensures transcription is sent as it's recognized
                                console.log("Sending transcript to parent:", newTranscript);
                                onTranscript(newTranscript);
                            }

                            setInterimTranscript(interimTranscript);
                        };

                        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                            console.error('Speech recognition error', event.error);
                            setIsListening(false);
                            setIsProcessing(false);
                        };

                        recognition.onend = () => {
                            setIsListening(false);
                            // Don't close the modal here - we'll handle that in handleDone
                        };

                        recognitionRef.current = recognition;
                        recognition.start();
                    })
                    .catch(err => {
                        console.error('Error accessing microphone:', err);
                        alert('Unable to access microphone. Please check your permissions.');
                    });
            } catch (err) {
                console.error('Error initializing audio context:', err);
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }

            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try {
                    audioContextRef.current.close();
                } catch (error) {
                    console.error('Error closing audio context:', error);
                }
            }

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            setWaveformData(Array(48).fill(3));
            recognitionRef.current = null;
            analyserRef.current = null;
            dataArrayRef.current = null;
        };
    }, [isOpen, onTranscript]);

    const updateWaveform = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        animationFrameRef.current = requestAnimationFrame(updateWaveform);

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Create a more responsive waveform with more bars
        const newWaveformData = Array(48).fill(0).map((_, i) => {
            // Sample from different parts of the frequency spectrum
            const startIndex = Math.floor(i * (dataArrayRef.current!.length / 48));
            const endIndex = Math.floor((i + 1) * (dataArrayRef.current!.length / 48));

            // Calculate average value for this frequency range
            let sum = 0;
            for (let j = startIndex; j < endIndex; j++) {
                sum += dataArrayRef.current![j];
            }
            const average = sum / (endIndex - startIndex);

            // Apply very subtle scaling for a flatter appearance like in the image
            // Base height of 3 with small variations
            const height = 3 + Math.pow(average / 255, 2) * 5;

            return Math.min(10, height);
        });

        setWaveformData(newWaveformData);
    };

    const handleDone = () => {
        if (recognitionRef.current) {
            setIsProcessing(true);

            // If we're still listening, stop recognition
            if (isListening) {
                recognitionRef.current.stop();
            }

            // Wait for any final transcription to complete
            setTimeout(() => {
                // Send the final transcript back to the parent component
                if (transcript.trim()) {
                    console.log("Sending final transcript on done:", transcript.trim());
                    onTranscript(transcript.trim());
                }

                setIsProcessing(false);
                onClose();
            }, 800); // Slightly longer delay to ensure processing completes
        } else {
            // If recognition hasn't started yet, just close
            onClose();
        }
    };

    // Calculate position based on button location
    const getModalPosition = () => {
        if (!buttonPosition) return {};

        return {
            position: 'absolute',
            bottom: `calc(100% - ${buttonPosition.top}px + 10px)`,
            left: `${buttonPosition.left + (buttonPosition.width / 2)}px`,
            transform: 'translateX(-50%)'
        } as React.CSSProperties;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50"
                    onClick={handleDone}
                >
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-black rounded-full px-4 py-2 shadow-lg flex items-center space-x-2 max-w-xs"
                        style={getModalPosition()}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDone}
                            className="h-8 w-8 rounded-full bg-black/80 text-white hover:bg-black/60 flex-shrink-0"
                            disabled={isProcessing}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        {/* Waveform visualization */}
                        <div className="h-6 flex-1 flex items-center justify-center">
                            <div className="flex items-center h-full w-full space-x-[2px]">
                                {waveformData.map((height, index) => (
                                    <motion.div
                                        key={index}
                                        className="bg-white rounded-full w-[2px]"
                                        initial={{ height: 2 }}
                                        animate={{ height: Math.max(2, height) }}
                                        transition={{ duration: 0.05 }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Stop button with spinner when processing */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDone}
                            className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex-shrink-0"
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Square className="h-4 w-4 fill-white" />
                            )}
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VoiceModal;

// Update global Window interface
declare global {
    interface Window {
        webkitSpeechRecognition: SpeechRecognitionConstructor;
        SpeechRecognition: SpeechRecognitionConstructor;
        webkitAudioContext: typeof AudioContext;
    }
} 