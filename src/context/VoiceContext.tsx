import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VoiceContextType {
    isModalOpen: boolean;
    openVoiceModal: (callback: (transcript: string) => void) => void;
    closeVoiceModal: () => void;
    currentCallback: ((transcript: string) => void) | null;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCallback, setCurrentCallback] = useState<((transcript: string) => void) | null>(null);

    const openVoiceModal = (callback: (transcript: string) => void) => {
        setCurrentCallback(() => callback);
        setIsModalOpen(true);
    };

    const closeVoiceModal = () => {
        setIsModalOpen(false);
    };

    return (
        <VoiceContext.Provider value={{ isModalOpen, openVoiceModal, closeVoiceModal, currentCallback }}>
            {children}
        </VoiceContext.Provider>
    );
};

export const useVoice = (): VoiceContextType => {
    const context = useContext(VoiceContext);
    if (context === undefined) {
        throw new Error('useVoice must be used within a VoiceProvider');
    }
    return context;
}; 