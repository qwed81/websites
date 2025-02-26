import React, { StrictMode, useState, useEffect, useRef } from 'react';
import { ArrowUpDown, ArrowLeftRight, Plus, Equal } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'file';
  onFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Button({ children, variant = 'default', onFileSelect, className = '', disabled, ...props }: ButtonProps) {
  const baseStyles = "bg-slate-400 text-slate-900 py-3 px-4 hover:bg-slate-300 flex items-center justify-center disabled:bg-slate-700 disabled:cursor-not-allowed disabled:hover:bg-slate-700";

  if (variant === 'file') {
    return (
      <label className={`${baseStyles} cursor-pointer ${disabled ? 'pointer-events-none' : ''} ${className}`}>
        {children}
        <input type="file" className="hidden" onChange={onFileSelect} disabled={disabled} />
      </label>
    );
  }

  return (
    <button
      className={`${baseStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

interface ImageDisplayProps {
  imageSrc: string | null;
  index: number;
  onImageSelect: (index: number, imageSrc: string) => void;
  onDownload?: () => void;
  isDownloadable?: boolean;
  isProcessing?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

function SwapButton({ isPortrait, onClick }: { isPortrait: boolean; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      title="Swap images"
      className="p-2 bg-slate-800/30 hover:bg-slate-700/30 mb-2 backdrop-blur-sm border border-slate-700/30"
    >
      {isPortrait ? (
        <ArrowUpDown className="text-slate-200" size={24} />
      ) : (
        <ArrowLeftRight className="text-slate-200" size={24} />
      )}
    </Button>
  );
}

function PresetModal({ onClose, onPresetSelection }: { onClose: () => void, onPresetSelection: (imageSrc: string) => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800/30 p-6 backdrop-blur-sm border border-slate-700/30 grid grid-cols-2 gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {[0, 1, 2, 3].map(x => (
          <img
            key={x}
            src={`/face${x}.webp`}
            alt={`Preset ${x + 1}`}
            className="w-40 h-40 object-cover cursor-pointer hover:scale-105 transition"
            onClick={() => onPresetSelection(`/face${x}.webp`)}
          />
        ))}
      </div>
    </div>
  );
}

function ImageDisplay({
  imageSrc,
  index,
  onImageSelect,
  onDownload,
  isDownloadable = false,
  isProcessing = false,
  hasError = false,
  errorMessage
}: ImageDisplayProps) {
  const [presetOpen, setPresetOpen] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isSelected || isDownloadable) return;

    const handlePaste = async (e: ClipboardEvent) => {
      e.preventDefault();
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const imageSrc = URL.createObjectURL(file);
            onImageSelect(index, imageSrc);
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isSelected, isDownloadable, index, onImageSelect]);

  useEffect(() => {
    if (copyStatus !== 'idle') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  function onFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const imageSrc = URL.createObjectURL(file);
      onImageSelect(index, imageSrc);
    }
  }

  function onPresetSelection(imageSrc: string) {
    setPresetOpen(false);
    onImageSelect(index, imageSrc);
  }

  async function handleCopyImage() {
    if (!imageSrc) return;

    try {
      const img = new Image();
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      img.onload = async () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob(blob => resolve(blob!), 'image/png')
        );

        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopyStatus('copied');
      };
      img.src = imageSrc;
    } catch (err) {
      console.error('Failed to copy image:', err);
      setCopyStatus('error');
    }
  }

  const containerClasses = `
    bg-slate-800/30 overflow-hidden backdrop-blur-sm border border-slate-700/30 w-full 
    ${isSelected && !isDownloadable ? 'ring-2 ring-slate-400' : ''}
  `;

  return (
    <>
      <motion.div
        className={containerClasses}
        onClick={() => setIsSelected(true)}
        onBlur={() => setIsSelected(false)}
        tabIndex={isDownloadable ? undefined : 0}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="aspect-square bg-slate-800/30 flex items-center justify-center">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Selected image"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-400 text-center p-4">
              {isDownloadable ? (
                isProcessing ? (
                  <div className="animate-pulse">Processing...</div>
                ) : hasError ? (
                  <div className="text-red-400">
                    <p className="font-semibold mb-2">Face swap failed</p>
                    <p className="text-sm">{errorMessage || "An unexpected error occurred"}</p>
                  </div>
                ) : "Face swap result"
              ) : (
                <>
                  <p>No image selected</p>
                  {isSelected && !isDownloadable && (
                    <p className="text-sm mt-2 text-slate-500">You can paste an image here (Ctrl+V)</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {isDownloadable ? (
          <div className="grid grid-cols-2 gap-2 p-2">
            <Button
              onClick={onDownload}
              disabled={!imageSrc || isProcessing}
              className=""
            >
              Download
            </Button>
            <Button
              onClick={handleCopyImage}
              disabled={!imageSrc || isProcessing}
              className=""
            >
              {copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Failed to copy' : 'Copy'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            <Button onClick={() => setPresetOpen(true)}>
              Preset
            </Button>
            <Button
              variant="file"
              onFileSelect={onFileUpload}
            >
              Upload
            </Button>
          </div>
        )}
      </motion.div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {presetOpen && (
        <PresetModal
          onClose={() => setPresetOpen(false)}
          onPresetSelection={onPresetSelection}
        />
      )}
    </>
  );
}

function AboutSection() {
  return (
    <motion.div
      className="mt-8 bg-slate-800/30 p-6 backdrop-blur-sm border border-slate-700/30"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold text-white mb-2">About Us</h2>
      <p className="text-slate-300">
        Face Swap is a website built with React TypeScript and a Python FastAPI backend,
        created as part of our "website a week" challenge. It leverages a custom machine
        learning model trained on DGX SuperPod.
        <span className="block mt-2 text-sm text-slate-400">#OpenToWork</span>
      </p>
    </motion.div>
  );
}

function App() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [destImage, setDestImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const latestRequestRef = useRef<number>(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: portrait)");
    setIsPortrait(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    async function performFaceSwap() {
      if (sourceImage && destImage) {
        setIsProcessing(true);
        const thisRequest = ++latestRequestRef.current;

        try {
          const [blob0, blob1] = await Promise.all([
            fetch(sourceImage).then(r => r.blob()),
            fetch(destImage).then(r => r.blob())
          ]);

          if (thisRequest !== latestRequestRef.current) return;

          const data = new FormData();
          data.append('source_image', blob0);
          data.append('target_image', blob1);

          const response = await fetch('https://faceswap.smartfellas.us/api/swap-face', {
            method: 'POST',
            body: data,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `Server returned ${response.status}`);
          }

          if (thisRequest === latestRequestRef.current) {
            const url = URL.createObjectURL(await response.blob());
            setResultImage(url);
            setHasError(false);
            setErrorMessage(undefined);
          }
        } catch (error) {
          console.error('Face swap failed:', error);
          if (thisRequest === latestRequestRef.current) {
            setHasError(true);
            setResultImage(null);
            setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
          }
        } finally {
          if (thisRequest === latestRequestRef.current) {
            setIsProcessing(false);
          }
        }
      }
    }

    performFaceSwap();
  }, [sourceImage, destImage]);

  function handleImageSelect(index: number, imageSrc: string) {
    if (index === 0) setSourceImage(imageSrc);
    else if (index === 1) setDestImage(imageSrc);
  }

  function handleSwapImages() {
    const tempSource = sourceImage;
    setSourceImage(destImage);
    setDestImage(tempSource);
  }

  function downloadImage() {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'face-swapped-image.png';
      link.click();
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl w-full mx-auto">
        <motion.h1
          className="text-4xl font-bold text-center mb-8 flex items-center justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xl text-slate-400">Face Swap</span>
        </motion.h1>

        <div className={`flex ${isPortrait ? 'flex-col' : 'flex-row'} gap-6 items-center justify-center relative`}>
          <div className="w-full md:w-1/3">
            <ImageDisplay
              imageSrc={sourceImage}
              index={0}
              onImageSelect={handleImageSelect}
            />
          </div>

          <AnimatePresence>
            {sourceImage && (
              <>
                <motion.div
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  {sourceImage && destImage && (
                    <SwapButton isPortrait={isPortrait} onClick={handleSwapImages} />
                  )}
                  <Plus className="text-slate-400" size={32} />
                </motion.div>

                <div className="w-full md:w-1/3">
                  <ImageDisplay
                    imageSrc={destImage}
                    index={1}
                    onImageSelect={handleImageSelect}
                  />
                </div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {sourceImage && destImage && (
              <>
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Equal className="text-slate-400" size={32} />
                </motion.div>

                <div className="w-full md:w-1/3">
                  <ImageDisplay
                    onImageSelect={() => { }}
                    imageSrc={isProcessing ? null : resultImage}
                    index={2}
                    onDownload={downloadImage}
                    isDownloadable
                    isProcessing={isProcessing}
                    hasError={hasError}
                    errorMessage={errorMessage}
                  />
                </div>
              </>
            )}
          </AnimatePresence>
        </div>

        <AboutSection />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

export default App;
