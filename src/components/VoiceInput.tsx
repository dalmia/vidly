import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';

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
  const { openVoiceModal, isModalOpen } = useVoice();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if this specific button triggered the modal
  const isThisButtonActive = useRef<boolean>(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDisabled) return;

    isThisButtonActive.current = true;
    openVoiceModal(onTranscript);
  };

  // Determine button styles based on modal state
  const buttonHighlightClass = isModalOpen && isThisButtonActive.current
    ? "ring-2 ring-primary ring-offset-2 bg-primary/20 animate-pulse"
    : "";

  // Reset the active state when the modal closes
  React.useEffect(() => {
    if (!isModalOpen) {
      isThisButtonActive.current = false;
    }
  }, [isModalOpen]);

  return (
    <Button
      ref={buttonRef}
      type="button"
      size="icon"
      variant={isModalOpen && isThisButtonActive.current ? "default" : variant}
      onClick={handleClick}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      disabled={isDisabled}
      title={isModalOpen && isThisButtonActive.current ? "Recording in progress" : "Speak your question"}
      className={`rounded-full aspect-square transition-all duration-300 ${buttonHighlightClass}`}
      style={{ borderRadius: '9999px' }}
    >
      <Mic className={`h-5 w-5 ${isModalOpen && isThisButtonActive.current ? 'text-primary' : ''}`} />
    </Button>
  );
};

export default VoiceInput;
