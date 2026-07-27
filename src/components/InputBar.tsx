import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Sparkles, Mic, MicOff, HardDrive, Upload, Camera, Plus } from 'lucide-react';
import { CapabilityChip } from './CapabilityChip.js';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  onRunCapability: (capabilityId: string) => void;
  onUploadClick: () => void;
  onOpenDriveModal: () => void;
  onOpenCameraModal: () => void;
  disabled?: boolean;
  suggestedCapabilities?: string[];
}

export const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  onRunCapability,
  onUploadClick,
  onOpenDriveModal,
  onOpenCameraModal,
  disabled = false,
  suggestedCapabilities = ['SUMMARIZE', 'EXTRACT_FACTS', 'VERDICT', 'BREAKDOWN', 'NEXT_ACTIONS', 'GENERATE'],
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showAttachPopover, setShowAttachPopover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Click outside listener for attachment popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowAttachPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Voice-to-text setup using Web Speech API
  const toggleVoiceToText = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please type your query manually.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSendMessage(text.trim());
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="w-full bg-[var(--ol-panel)] border-t border-[var(--ol-border)] p-3 sm:p-4 flex flex-col gap-2.5 shrink-0 relative">
      {/* Docked Capability Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-mono uppercase text-[var(--ol-muted)] tracking-wider shrink-0 flex items-center gap-1 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[var(--ol-accent)]" />
          Execute:
        </span>
        {suggestedCapabilities.map((capId) => (
          <CapabilityChip
            key={capId}
            id={capId}
            disabled={disabled}
            onClick={(id) => onRunCapability(id)}
          />
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="flex items-center gap-2.5 bg-[var(--ol-surface)] p-2 rounded-xl border border-[var(--ol-border)] focus-within:border-[var(--ol-accent)] transition-all">
        {/* Attachment Popover Button */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setShowAttachPopover((prev) => !prev)}
            title="Add File, Drive Document, or Camera Photo"
            aria-label="Add a file, Drive document, or camera photo"
            aria-expanded={showAttachPopover}
            className={`p-2 rounded-lg text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-panel)] hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer ${
              showAttachPopover ? 'bg-[var(--ol-panel)] text-[var(--ol-accent)] font-bold' : ''
            }`}
          >
            <Plus className={`w-4 h-4 transition-transform duration-200 ${showAttachPopover ? 'rotate-45' : ''}`} />
          </button>

          {/* Floating Attachment Popover Menu */}
          {showAttachPopover && (
            <div className="absolute bottom-12 left-0 w-44 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 p-1.5 font-body text-white animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setShowAttachPopover(false);
                  onOpenDriveModal();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-3 text-xs font-medium cursor-pointer group hover:translate-x-1"
              >
                <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-blue-500/20 text-blue-400 transition-colors">
                  <HardDrive className="w-4 h-4" />
                </div>
                <span className="font-semibold text-zinc-100">Drive</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAttachPopover(false);
                  onUploadClick();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-3 text-xs font-medium cursor-pointer group hover:translate-x-1"
              >
                <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-emerald-500/20 text-emerald-400 transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="font-semibold text-zinc-100">Upload Files</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAttachPopover(false);
                  onOpenCameraModal();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-3 text-xs font-medium cursor-pointer group hover:translate-x-1"
              >
                <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-purple-500/20 text-purple-400 transition-colors">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="font-semibold text-zinc-100">Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          aria-label="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            isListening
              ? 'Listening to speech… speak clearly…'
              : disabled
              ? 'Upload a document to start understanding…'
              : 'Query capability engine… (Enter to send)'
          }
          className={`flex-1 bg-transparent border-none text-xs sm:text-sm text-[var(--ol-brand)] placeholder:text-[var(--ol-muted)] focus:outline-hidden resize-none max-h-32 py-1 font-body transition-colors ${
            isListening ? 'placeholder:text-red-400 placeholder:animate-pulse' : ''
          }`}
        />

        {/* Voice-to-Text Microphone Button */}
        <button
          type="button"
          onClick={toggleVoiceToText}
          title={isListening ? 'Stop listening' : 'Voice-to-Text Input'}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          aria-pressed={isListening}
          className={`p-2 rounded-lg transition-all shrink-0 cursor-pointer ${
            isListening
              ? 'bg-red-500 text-white animate-pulse shadow-md ring-2 ring-red-400/50'
              : 'text-[var(--ol-muted)] hover:text-[var(--ol-brand)] hover:bg-[var(--ol-panel)] hover:scale-105 active:scale-95'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Send / Execute Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="h-9 sm:h-10 px-4 sm:px-5 bg-[var(--ol-accent)] hover:opacity-90 active:scale-98 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shrink-0 shadow-xs hover:shadow-md"
        >
          <span>Execute</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
