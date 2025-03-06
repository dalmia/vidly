import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import VoiceModal from './VoiceModal';

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  isDisabled?: boolean;
  variant?: 'default' | 'secondary' | 'outline';
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  isDisabled = false,
  variant = 'secondary'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [buttonPosition, setButtonPosition] = useState<{ top: number; left: number; width: number } | undefined>(undefined);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpenModal = () => {
    if (!isDisabled && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width
      });
      setModalKey(prev => prev + 1); // Increment key to force re-mount
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        size="icon"
        variant={variant}
        onClick={handleOpenModal}
        disabled={isDisabled}
        title="Speak your question"
        className="rounded-full aspect-square"
        style={{ borderRadius: '9999px' }} // Ensure it's fully rounded
      >
        <Mic className="h-5 w-5" />
      </Button>

      <VoiceModal
        key={modalKey}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onTranscript={onTranscript}
        buttonPosition={buttonPosition}
      />
    </>
  );
};

export default VoiceInput;
