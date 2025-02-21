import React, { StrictMode, useState, useEffect, useRef } from 'react';
import { Plus, Equal } from 'lucide-react';
import { motion } from 'framer-motion';
import { createRoot } from 'react-dom/client'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

type ImageDisplayProps = {
  imageSrc: string | null;
  index: number;
  onImageSelect: (index: number, imageSrc: string) => void;
  onDownload?: () => void;
  isDownloadable?: boolean;
  isProcessing?: boolean;
  hasError?: boolean;
};

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageSrc,
  index,
  onImageSelect,
  onDownload,
  isDownloadable = false,
  isProcessing = false
}) => {
  const [presetOpen, setPresetOpen] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);



  useEffect(() => {
    if (!isSelected || isDownloadable) return;

    const handlePaste = async (e: ClipboardEvent) => {
      e.preventDefault();

      // Handle pasted image file
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

  const setCanvasImage = (path: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      img.onload = function() {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          resolve(blob!);
        }, 'image/png');
      };
      img.src = path;
    });
  };

  async function handleCopyImage() {
    if (!imageSrc) return;

    try {
      const pngBlob = await setCanvasImage(imageSrc);
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': pngBlob
        })
      ]);
      setCopyStatus('copied');
    } catch (err) {
      console.error('Failed to copy image:', err);
      setCopyStatus('error');
    }
  }
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.2 }}
        className={`bg-slate-800 rounded-xl overflow-hidden shadow-md w-full 
          ${isSelected && !isDownloadable ? 'ring-2 ring-sky-500' : ''}`}
        onClick={() => setIsSelected(true)}
        onBlur={() => setIsSelected(false)}
        tabIndex={isDownloadable ? undefined : 0}
      >
        <div className="aspect-square bg-slate-700 flex items-center justify-center">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Selected image"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-400 text-center p-4">
              {isDownloadable ? (
                isProcessing ? "Processing..." : "Face swap result"
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
            <button
              onClick={onDownload}
              disabled={!imageSrc || isProcessing}
              className="bg-indigo-500 text-white py-3 px-4 rounded-lg hover:bg-indigo-600 
                transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed 
                flex items-center justify-center"
            >
              Download
            </button>
            <button
              onClick={handleCopyImage}
              disabled={!imageSrc || isProcessing}
              className="bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 
                transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed 
                flex items-center justify-center"
            >
              {copyStatus === 'copied' ? (
                'Copied'
              ) : copyStatus === 'error' ? (
                'Failed to copy'
              ) : (
                <>
                  Copy
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            <button
              onClick={() => setPresetOpen(true)}
              className="bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 
                transition-colors flex items-center justify-center"
            >
              Preset
            </button>
            <label
              htmlFor={`upload${index}`}
              className="bg-sky-500 text-white py-3 px-4 rounded-lg hover:bg-sky-600 
                transition-colors flex items-center justify-center cursor-pointer"
            >
              Upload
            </label>
            <input
              id={`upload${index}`}
              type="file"
              className="hidden"
              onChange={onFileUpload}
            />
          </div>
        )}
      </motion.div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {presetOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setPresetOpen(false)}
        >
          <div
            className="bg-slate-800 p-6 rounded-xl shadow-2xl grid grid-cols-2 gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {[0, 1, 2, 3].map(x => {
              const imgPath = `/face${x}.webp`;
              return (
                <img
                  key={x}
                  src={imgPath}
                  alt={`Preset ${x + 1}`}
                  className="w-40 h-40 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => onPresetSelection(imgPath)}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

function App() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [destImage, setDestImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Keep track of the latest request to handle race conditions
  const latestRequestRef = useRef<number>(0);

  // Handle orientation changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: portrait)");
    setIsPortrait(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsPortrait(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Improved face swap effect with race condition handling
  useEffect(() => {
    async function performFaceSwap() {
      if (sourceImage && destImage) {
        setIsProcessing(true);
        const thisRequest = ++latestRequestRef.current;

        try {
          const blob0 = await fetch(sourceImage).then(r => r.blob());
          const blob1 = await fetch(destImage).then(r => r.blob());

          // Check if this is still the latest request
          if (thisRequest !== latestRequestRef.current) {
            return; // Abandon outdated requests
          }

          const data = new FormData();
          data.append('source_image', blob0);
          data.append('target_image', blob1);

          const response = await fetch('https://faceswap.smartfellas.us/api/swap-face', {
            method: 'POST',
            body: data,
          });

          // Check again before updating state
          if (thisRequest === latestRequestRef.current) {
            if (!response.ok) {
              throw new Error(`Server returned ${response.status}`);
            }
            const url = URL.createObjectURL(await response.blob());
            setResultImage(url);
            setHasError(false);
          }
        } catch (error) {
          console.error('Face swap failed:', error);
          if (thisRequest === latestRequestRef.current) {
            setHasError(true);
            setResultImage(null);
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
    if (index === 0) {
      setSourceImage(imageSrc);
    } else if (index === 1) {
      setDestImage(imageSrc);
    }
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
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="max-w-4xl w-full mx-auto p-6 flex-grow">
        <h1 className="text-4xl font-bold text-center text-white mb-8 flex items-center justify-center">
          <span className="mr-2">脸幻</span>
          <span className="text-xl text-slate-400">(jiāohuàn) Face</span>
        </h1>

        <div className={`flex ${isPortrait ? 'flex-col' : 'flex-row'} gap-6 items-center justify-center`}>
          {/* Source image - always visible */}
          <div className="w-full md:w-1/3">
            <ImageDisplay
              key="source-display"
              imageSrc={sourceImage}
              index={0}
              onImageSelect={handleImageSelect}
            />
          </div>

          {/* Arrow and destination image */}
          {sourceImage && (
            <>
              <motion.div
                key="plus"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Plus className="mx-4 text-slate-400" size={32} />
              </motion.div>

              <div className="w-full md:w-1/3">
                <ImageDisplay
                  key="dest-display"
                  imageSrc={destImage}
                  index={1}
                  onImageSelect={handleImageSelect}
                />
              </div>
            </>
          )}

          {/* Arrow and result image */}
          {sourceImage && destImage && (
            <>
              <motion.div
                key="equals"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Equal className="mx-4 text-slate-400" size={32} />
              </motion.div>

              <div className="w-full md:w-1/3">
                <ImageDisplay
                  key="result-display"
                  onImageSelect={(_a, _b) => { }}
                  imageSrc={isProcessing ? null : resultImage}
                  index={2}
                  onDownload={downloadImage}
                  isDownloadable
                  isProcessing={isProcessing}
                  hasError={hasError}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-8 bg-slate-800 p-4 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-2">About Us</h2>
          <p className="text-slate-300">
            Face Swap is a website built with React TypeScript and a Python FastAPI backend,
            created as part of our "website a week" challenge. It leverages a custom machine
            learning model trained on the SMU DGX SuperPod.
            <span className="block mt-2 text-sm text-slate-400">#OpenToWork</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
