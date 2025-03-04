import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css'

function AnimatedDigit({ digit, prevDigit }: { digit: string; prevDigit?: string }) {
  const direction = prevDigit === undefined ? 1 : (digit >= prevDigit ? 1 : -1);
  const fromY = direction > 0 ? 1 : -1;

  return (
    <div className="inline-block relative overflow-hidden w-[0.6em] h-8">
      <motion.div
        key={`digit-${digit}`}
        initial={{ y: `${fromY * 100}%` }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.5 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {digit}
      </motion.div>
    </div>
  );
}

function AnimatedCounter({ value, unit }: { value: string | number; unit?: string }) {
  const [prevValue, setPrevValue] = useState<string | number | null>(null);

  useEffect(() => {
    if (value !== '--' && !isNaN(Number(value))) {
      setPrevValue(value);
    }
  }, [value]);

  if (value === '--') {
    return (
      <div className="inline-flex items-center justify-center">
        <motion.span
          key="placeholder"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {value}
        </motion.span>
      </div>
    );
  }

  const valueStr = String(value).padStart(3, ' ');
  const prevValueStr = prevValue ? String(prevValue).padStart(3, ' ') : null;

  return (
    <div className="inline-flex items-center justify-center">
      <div className="flex items-center space-x-[0.1em]">
        {valueStr.split('').map((digit, index) => {
          if (digit === ' ') {
            return <div key={`space-${index}`} className="w-[0.2em]"></div>;
          }

          const prevDigit = prevValueStr ? prevValueStr[index] : undefined;

          return (
            <AnimatedDigit
              key={`pos-${index}`}
              digit={digit}
              prevDigit={prevDigit === ' ' ? undefined : prevDigit}
            />
          );
        })}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, progress = null }: {
  label: string;
  value: string | number;
  unit?: string;
  progress?: number | null
}) {
  return (
    <motion.div className="text-center p-4 bg-slate-900/50 border border-slate-700/50 relative overflow-hidden">
      {progress !== null && (
        <motion.div
          className="absolute bottom-0 left-0 bg-green-900/30 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      )}
      <div className="relative z-10">
        <div className="text-sm text-slate-400 mb-1">{label}</div>
        <div className="font-bold text-2xl h-8 flex items-center justify-center">
          {progress === 100 ? (
            <motion.span
              className="text-green-400"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              Completed
            </motion.span>
          ) : (
            <AnimatedCounter value={value} unit={unit} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

type AnimationConfig = {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit: Record<string, any>;
  transition: (delay?: number) => Record<string, any>;
};

const fadeIn: AnimationConfig = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: (delay = 0) => ({ duration: 0.3, delay }),
};

const slideUp: AnimationConfig = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
  transition: (delay = 0) => ({ duration: 0.25, delay, ease: "easeOut" }),
};

function withAnimation(props: Record<string, any>, animation: AnimationConfig, customDelay = 0) {
  const { transition, ...animProps } = animation;
  return {
    ...props,
    ...animProps,
    transition: transition(customDelay),
  };
}

interface TypingTestState {
  text: string;
  input: string;
  status: 'waiting' | 'typing' | 'finished';
  currentIndex: number;
  isLoading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  resetTest: () => void;
  calculateWPM: () => number;
  calculateAccuracy: () => number;
  calculateProgress: () => number;
  animatedWPM: number;
  animatedAccuracy: number;
}

function useTypingTest(): TypingTestState {
  const [text, setText] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [prevInput, setPrevInput] = useState<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [errors, setErrors] = useState<number>(0);
  const [status, setStatus] = useState<'waiting' | 'typing' | 'finished'>('waiting');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [animatedWPM, setAnimatedWPM] = useState<number>(0);
  const [animatedAccuracy, setAnimatedAccuracy] = useState<number>(100);
  const lastUpdateTimeRef = useRef<number>(0);

  async function fetchQuote(): Promise<void> {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.kanye.rest/text');
      const quoteText = await response.text();
      setText(quoteText);
    } catch (error) {
      console.error('Error fetching quote:', error);
      setText('The quick brown fox jumps over the lazy dog.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    const value = e.target.value;

    if (status === 'waiting' && value.length > 0) {
      setStartTime(Date.now());
      setStatus('typing');
      setAnimatedWPM(0);
      setAnimatedAccuracy(100);
    }

    const validInput = value.length >= prevInput.length
      ? prevInput + value.slice(prevInput.length)
      : value.length < prevInput.length
        ? prevInput.slice(0, value.length)
        : value;

    setPrevInput(validInput);
    setInput(validInput);
    setCurrentIndex(validInput.length);

    if (validInput.length > prevInput.length) {
      const lastCharIndex = validInput.length - 1;
      const isLastCharCorrect = validInput[lastCharIndex] === text[lastCharIndex];

      if (!isLastCharCorrect) {
        setErrors(errors + 1);
      }
    } else if (validInput.length < prevInput.length) {
      const removedChar = prevInput[prevInput.length - 1];
      const expectedChar = text[prevInput.length - 1];

      if (removedChar !== expectedChar) {
        setErrors(Math.max(0, errors - 1));
      }
    }

    if (status === 'typing') {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current >= 300) {
        updateAnimatedValues();
        lastUpdateTimeRef.current = now;
      }
    }

    if (validInput.length === text.length) {
      setEndTime(Date.now());
      setStatus('finished');
      updateAnimatedValues();
    }
  }

  function updateAnimatedValues(): void {
    setAnimatedWPM(calculateWPM());
    setAnimatedAccuracy(calculateAccuracy());
  }

  function resetTest(): void {
    setInput('');
    setPrevInput('');
    setStartTime(null);
    setEndTime(null);
    setCurrentIndex(0);
    setErrors(0);
    setStatus('waiting');
    fetchQuote();
  }

  function calculateWPM(): number {
    if (!startTime) return 0;
    const endTimeCalc = endTime || Date.now();
    const minutes = (endTimeCalc - startTime) / 60000;
    const words = input.length / 5;
    if (minutes < 0.01) return 0;
    return Math.round(words / minutes);
  }

  function calculateAccuracy(): number {
    if (input.length === 0) return 100;
    return Math.round(((input.length - errors) / input.length) * 100);
  }

  function calculateProgress(): number {
    return Math.round((currentIndex / (text.length || 1)) * 100);
  }

  useEffect(() => {
    let intervalId: number;
    if (status === 'typing') {
      intervalId = setInterval(updateAnimatedValues, 750);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, input, startTime]);

  useEffect(() => {
    fetchQuote();
  }, []);

  return {
    text,
    input,
    status,
    currentIndex,
    isLoading,
    handleInputChange,
    resetTest,
    calculateWPM,
    calculateAccuracy,
    calculateProgress,
    animatedWPM,
    animatedAccuracy
  };
}

function useFocusManagement(inputRef: React.RefObject<HTMLTextAreaElement | null>, status: 'waiting' | 'typing' | 'finished'): void {
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (status !== 'finished' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (status !== 'finished' && inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('click', handleGlobalClick);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [status, inputRef]);
}

function CharacterSpan({ char, className, index }: { char: string; className: string; index: number }) {
  const staggerDelay = 0.01 * Math.min(index, 30);

  return (
    <motion.span
      className={`${className} font-serif`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: staggerDelay,
        ease: "easeOut"
      }}
    >
      {char}
    </motion.span>
  );
}

function TextCharacter({ char, index, currentIndex, input }: {
  char: string;
  index: number;
  currentIndex: number;
  input: string
}) {
  let className = '';
  let displayChar = char;

  if (index < currentIndex) {
    className = input[index] === char ? 'text-green-400' : 'text-red-400';

    if (char === ' ' && input[index] !== char) {
      displayChar = '␣';
      className += ' bg-red-900/30';
    }
  } else if (index === currentIndex) {
    className = 'bg-slate-700 text-slate-300';
  } else {
    className = 'text-slate-400';
  }

  if (char === '\n') {
    return (
      <React.Fragment key={index}>
        <CharacterSpan
          char="↵"
          className={`${className} text-slate-500 font-serif`}
          index={index}
        />
        <br />
      </React.Fragment>
    );
  }

  return <CharacterSpan char={displayChar} className={className} index={index} />;
}

function TypingTest() {
  const {
    text,
    input,
    status,
    currentIndex,
    isLoading,
    handleInputChange,
    resetTest,
    calculateProgress,
    animatedWPM,
    animatedAccuracy
  } = useTypingTest();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  useFocusManagement(inputRef, status);

  function renderText() {
    return Array.from(text).map((char, index) => (
      <TextCharacter
        key={index}
        char={char}
        index={index}
        currentIndex={currentIndex}
        input={input}
      />
    ));
  }

  function renderStatsCards() {
    interface StatData {
      label: string;
      value: string | number;
      unit: string;
      progress?: number;
    }

    const statsData: StatData[] = [
      {
        label: status === 'finished' ? "Final Speed" : "Speed",
        value: status === 'typing' || status === 'finished' ? animatedWPM : '--',
        unit: "WPM"
      },
      {
        label: status === 'finished' ? "Final Accuracy" : "Accuracy",
        value: status !== 'waiting' ? animatedAccuracy : '--',
        unit: "%"
      },
      {
        label: "Progress",
        value: calculateProgress(),
        unit: "%",
        progress: calculateProgress()
      }
    ];

    return (
      <motion.div
        className="grid grid-cols-3 gap-4 mb-6"
        {...withAnimation({}, slideUp, 0.25)}
      >
        {statsData.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            progress={stat.progress}
          />
        ))}
      </motion.div>
    );
  }

  const headerItems: { content: string; className: string; delay: number }[] = [
    { content: "Smart", className: "", delay: 0.15 },
    { content: "Typing", className: "text-slate-400 font-serif italic", delay: 0.2 }
  ];

  function handleReset(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    resetTest();
  }

  return (
    <motion.div
      className="min-h-screen bg-slate-900 text-white p-8 relative"
      {...withAnimation({}, fadeIn)}
    >
      <motion.div
        className="max-w-4xl mx-auto mt-16"
        {...withAnimation({}, slideUp)}
      >
        <motion.header
          className="mb-12"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h2 className="text-4xl font-bold mb-4">
            {headerItems.map((item, index) => (
              <motion.span
                key={index}
                className={item.className}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: item.delay }}
              >
                {index > 0 ? ' ' : ''}{item.content}
              </motion.span>
            ))}
          </h2>
          <motion.p
            className="text-slate-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.25 }}
          >
            Test your typing speed and accuracy
          </motion.p>
        </motion.header>

        <motion.div
          className="bg-slate-800/30 p-6 backdrop-blur-sm border border-slate-700/30 mb-8"
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <motion.div
            className="mb-6 p-4 bg-slate-900/50 border border-slate-700/50 font-serif text-lg leading-relaxed whitespace-pre-wrap relative"
            {...withAnimation({}, slideUp, 0.15)}
            key={text}
          >
            {isLoading ? (
              <motion.div
                className="text-slate-400 text-center"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                Loading quote...
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`text-${text.substring(0, 10)}`}
                  {...withAnimation({}, fadeIn)}
                >
                  {renderText()}
                </motion.div>
              </AnimatePresence>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              disabled={status === 'finished' || isLoading}
              className="absolute opacity-0 top-0 left-0 w-full h-full resize-none overflow-hidden outline-none"
              style={{ caretColor: 'transparent', color: 'transparent' }}
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                  'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onSelect={(e: React.SyntheticEvent<HTMLTextAreaElement>) => {
                const target = e.target as HTMLTextAreaElement;
                const length = target.value.length;
                target.setSelectionRange(length, length);
              }}
            />
          </motion.div>

          <motion.div
            className="mb-6 text-center text-slate-400 text-sm"
            {...withAnimation({}, fadeIn, 0.2)}
          >
            Click anywhere on the text to focus and start typing
          </motion.div>

          <AnimatePresence>
            {(status !== 'finished' || status === 'finished') && renderStatsCards()}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={handleReset}
            className="w-full p-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600/50 transition-colors duration-200 cursor-pointer"
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.1 }}
          >
            {status === 'finished' ? 'Try Again' : 'Reset'}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TypingTest />
  </StrictMode>,
);

export default TypingTest;
