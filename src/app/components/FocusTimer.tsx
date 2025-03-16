import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { formatDuration } from 'date-fns';
import { useTaskStore } from '../store/useTaskStore';

interface FocusTimerProps {
  taskId?: string;
  onComplete?: () => void;
}

const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  DISTORTED: 'distorted'
};

type TimerState = typeof TIMER_STATES[keyof typeof TIMER_STATES];

// Characters that will randomly replace digits when time is distorted
const GLITCH_CHARS = ['?', '!', '@', '#', '$', '%', '&', '*', '>', '<', '∞', '∑', '∆', 'π', 'Ω', '≈'];

export default function FocusTimer({ taskId, onComplete }: FocusTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes by default
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [timerState, setTimerState] = useState<TimerState>(TIMER_STATES.IDLE);
  const [distortionLevel, setDistortionLevel] = useState(0); // 0-100
  const lastTickTime = useRef<number | null>(null);
  const animationControls = useAnimation();
  
  const { 
    tasks,
    startFocusSession, 
    endFocusSession, 
    setDistortionLevel: setGlobalDistortionLevel,
    setFocusState
  } = useTaskStore();
  
  const task = taskId ? tasks.find(t => t.id === taskId) : undefined;
  
  // Reset timer when task changes
  useEffect(() => {
    setTimeRemaining(25 * 60);
    setInitialTime(25 * 60);
    setTimerState(TIMER_STATES.IDLE);
    setDistortionLevel(0);
  }, [taskId]);
  
  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.DISTORTED) {
      timer = setInterval(() => {
        const now = Date.now();
        
        if (lastTickTime.current === null) {
          lastTickTime.current = now;
          return;
        }
        
        // Calculate elapsed time since last tick
        const elapsed = (now - lastTickTime.current) / 1000;
        lastTickTime.current = now;
        
        // Apply time distortion
        let timeMultiplier = 1;
        if (timerState === TIMER_STATES.DISTORTED) {
          // Time can flow faster or slower, even backwards at extreme levels
          if (distortionLevel < 30) {
            // Slow down time slightly (0.5x - 1x)
            timeMultiplier = 0.5 + (distortionLevel / 60);
          } else if (distortionLevel < 60) {
            // Accelerate time (1x - 2x)
            timeMultiplier = 1 + (distortionLevel - 30) / 30;
          } else if (distortionLevel < 80) {
            // Dramatic acceleration (2x - 3x)
            timeMultiplier = 2 + (distortionLevel - 60) / 20;
          } else if (distortionLevel < 95) {
            // Extremely fast (3x - 5x)
            timeMultiplier = 3 + (distortionLevel - 80) / 7.5;
          } else {
            // Time flows backward!
            timeMultiplier = -1;
          }
        }
        
        // Update time remaining
        setTimeRemaining(prev => {
          const newValue = Math.max(0, prev - elapsed * timeMultiplier);
          
          if (newValue <= 0 && prev > 0) {
            // Timer completed
            setTimerState(TIMER_STATES.COMPLETED);
            if (onComplete) onComplete();
            endFocusSession();
          }
          
          return newValue;
        });
      }, 50); // Update frequently for smooth distortion
    }
    
    return () => clearInterval(timer);
  }, [timerState, distortionLevel, onComplete, endFocusSession]);
  
  // Update global distortion level when our distortion level changes
  useEffect(() => {
    setGlobalDistortionLevel(distortionLevel);
  }, [distortionLevel, setGlobalDistortionLevel]);
  
  // Update focus state based on timer state
  useEffect(() => {
    if (timerState === TIMER_STATES.RUNNING) {
      setFocusState('focus');
    } else if (timerState === TIMER_STATES.DISTORTED) {
      setFocusState('distorted');
    } else if (timerState === TIMER_STATES.COMPLETED) {
      setFocusState('break');
    } else {
      setFocusState('idle');
    }
  }, [timerState, setFocusState]);
  
  // Start timer function
  const startTimer = () => {
    setTimerState(TIMER_STATES.RUNNING);
    lastTickTime.current = Date.now();
    if (taskId) {
      startFocusSession(taskId);
    }
    animationControls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.5 }
    });
  };
  
  // Pause timer function
  const pauseTimer = () => {
    setTimerState(TIMER_STATES.PAUSED);
    lastTickTime.current = null;
  };
  
  // Resume timer function
  const resumeTimer = () => {
    setTimerState(TIMER_STATES.RUNNING);
    lastTickTime.current = Date.now();
  };
  
  // Reset timer function
  const resetTimer = () => {
    setTimerState(TIMER_STATES.IDLE);
    setTimeRemaining(initialTime);
    setDistortionLevel(0);
    lastTickTime.current = null;
    endFocusSession();
  };
  
  // Toggle time distortion
  const toggleTimeDistortion = () => {
    if (timerState === TIMER_STATES.RUNNING) {
      setTimerState(TIMER_STATES.DISTORTED);
      animationControls.start({
        rotate: [0, 5, -5, 3, -3, 0],
        transition: { duration: 1, repeat: Infinity }
      });
    } else if (timerState === TIMER_STATES.DISTORTED) {
      setTimerState(TIMER_STATES.RUNNING);
      animationControls.stop();
      animationControls.set({ rotate: 0 });
    }
  };
  
  // Increase distortion level
  const increaseDistortion = () => {
    if (timerState === TIMER_STATES.DISTORTED) {
      setDistortionLevel(prev => Math.min(100, prev + 10));
    }
  };
  
  // Decrease distortion level
  const decreaseDistortion = () => {
    if (timerState === TIMER_STATES.DISTORTED) {
      setDistortionLevel(prev => Math.max(0, prev - 10));
    }
  };
  
  // Format time remaining function
  const formatTimeRemaining = () => {
    if (timerState === TIMER_STATES.DISTORTED && distortionLevel > 50) {
      // For high distortion levels, randomly replace some digits with symbols
      const normal = formatDuration({
        minutes: Math.floor(timeRemaining / 60),
        seconds: Math.floor(timeRemaining % 60)
      }, { format: ['minutes', 'seconds'] });
      
      return normal.split('').map((char, i) => {
        if (/\d/.test(char) && Math.random() < distortionLevel / 200) {
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }
        return char;
      }).join('');
    }
    
    return formatDuration({
      minutes: Math.floor(timeRemaining / 60),
      seconds: Math.floor(timeRemaining % 60)
    }, { format: ['minutes', 'seconds'] });
  };
  
  // Get appropriate button text
  const getStartButtonText = () => {
    switch (timerState) {
      case TIMER_STATES.IDLE:
        return 'Start';
      case TIMER_STATES.PAUSED:
        return 'Resume';
      case TIMER_STATES.RUNNING:
      case TIMER_STATES.DISTORTED:
        return 'Pause';
      case TIMER_STATES.COMPLETED:
        return 'Restart';
      default:
        return 'Start';
    }
  };
  
  // Get text for time distortion button
  const getDistortButtonText = () => {
    if (timerState === TIMER_STATES.DISTORTED) {
      return 'Reality is Broken';
    }
    return 'Distort Time';
  };
  
  // Get appropriate message for the timer
  const getTimerMessage = () => {
    if (timerState === TIMER_STATES.IDLE) {
      return "Ready to focus?";
    } else if (timerState === TIMER_STATES.COMPLETED) {
      return "Great job! Time for a break.";
    } else if (timerState === TIMER_STATES.DISTORTED) {
      if (distortionLevel < 30) {
        return "Time is slowing down...";
      } else if (distortionLevel < 60) {
        return "Time is accelerating!";
      } else if (distortionLevel < 80) {
        return "Time is WARPING!!";
      } else if (distortionLevel < 95) {
        return "TIME IS BREAKING!!!";
      } else {
        return "T̸̙͕I̵̖M̶͎E̴̺͐ ̴̲̏I̷͉̐S̵̪̊ ̸̬̄B̷͆ͅŔ̴͕O̵̞͗K̸̥͘E̵͗͜Ǹ̸ͅ";
      }
    } else {
      return task ? `Focus Mode: ${task.title}` : "Focus Mode";
    }
  };
  
  // Set timer duration
  const setTimerDuration = (duration: number) => {
    if (timerState === TIMER_STATES.IDLE) {
      setInitialTime(duration);
      setTimeRemaining(duration);
    }
  };
  
  // Get color based on distortion level
  const getColorStyle = () => {
    if (timerState !== TIMER_STATES.DISTORTED) {
      return {};
    }
    
    // Calculate hue based on distortion level
    const hue = (distortionLevel / 100) * 360;
    return {
      filter: `hue-rotate(${hue}deg)`,
      textShadow: `0 0 ${distortionLevel / 10}px rgba(255, 0, 255, ${distortionLevel / 100})`
    };
  };
  
  return (
    <motion.div 
      className="flex flex-col items-center justify-center p-6 bg-background/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/20 w-full max-w-md mx-auto"
      animate={animationControls}
    >
      <motion.h2 
        className="text-xl font-bold mb-4"
        style={getColorStyle()}
        animate={timerState === TIMER_STATES.DISTORTED ? {
          opacity: [1, 0.7, 1],
          transition: { duration: 1, repeat: Infinity }
        } : {}}
      >
        {getTimerMessage()}
      </motion.h2>
      
      {/* Time Display */}
      <motion.div 
        className="text-6xl font-mono font-bold py-8"
        style={getColorStyle()}
        animate={timerState === TIMER_STATES.DISTORTED ? {
          scale: [1, 1 + (distortionLevel / 100), 1],
          transition: { duration: 2, repeat: Infinity }
        } : {}}
      >
        {formatTimeRemaining()}
      </motion.div>
      
      {/* Timer Controls */}
      <div className="flex gap-4 mb-4">
        {/* Duration Presets (only visible when idle) */}
        {timerState === TIMER_STATES.IDLE && (
          <div className="flex gap-2">
            <button
              onClick={() => setTimerDuration(5 * 60)}
              className="px-3 py-1 bg-primary-light text-white rounded-full text-sm hover:bg-primary transition-colors"
            >
              5m
            </button>
            <button
              onClick={() => setTimerDuration(25 * 60)}
              className="px-3 py-1 bg-primary-light text-white rounded-full text-sm hover:bg-primary transition-colors"
            >
              25m
            </button>
            <button
              onClick={() => setTimerDuration(50 * 60)}
              className="px-3 py-1 bg-primary-light text-white rounded-full text-sm hover:bg-primary transition-colors"
            >
              50m
            </button>
          </div>
        )}
      </div>
      
      {/* Main Timer Controls */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.DISTORTED ? pauseTimer 
                 : timerState === TIMER_STATES.PAUSED ? resumeTimer 
                 : timerState === TIMER_STATES.COMPLETED ? resetTimer : startTimer}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
        >
          {getStartButtonText()}
        </button>
        
        {(timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.DISTORTED) && (
          <button
            onClick={resetTimer}
            className="px-6 py-2 bg-error text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Reset
          </button>
        )}
      </div>
      
      {/* Time Distortion Controls */}
      {(timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.DISTORTED) && (
        <div className="mt-4 w-full">
          <motion.button
            onClick={toggleTimeDistortion}
            className={`w-full py-2 rounded-lg text-white transition-colors ${
              timerState === TIMER_STATES.DISTORTED 
                ? 'bg-time-warp animate-pulse' 
                : 'bg-secondary hover:bg-secondary/80'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {getDistortButtonText()}
          </motion.button>
          
          {timerState === TIMER_STATES.DISTORTED && (
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={decreaseDistortion}
                  className="px-4 py-1 bg-primary/80 text-white rounded-lg disabled:opacity-50"
                  disabled={distortionLevel <= 0}
                >
                  Less Distortion
                </button>
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-time-warp rounded-full" 
                    style={{ width: `${distortionLevel}%` }}
                  ></div>
                </div>
                <button
                  onClick={increaseDistortion}
                  className="px-4 py-1 bg-time-warp text-white rounded-lg disabled:opacity-50"
                  disabled={distortionLevel >= 100}
                >
                  More Madness
                </button>
              </div>
              
              <motion.p 
                className="text-sm italic text-center"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  transition: { duration: 2, repeat: Infinity }
                }}
              >
                {distortionLevel < 30 && "Reality is stable... for now."}
                {distortionLevel >= 30 && distortionLevel < 60 && "Time is bending to your will!"}
                {distortionLevel >= 60 && distortionLevel < 80 && "WARNING: Temporal anomalies detected!"}
                {distortionLevel >= 80 && distortionLevel < 95 && "DANGER: Reality fabric tearing!"}
                {distortionLevel >= 95 && "CRITICAL ERROR: THE LAWS OF PHYSICS HAVE LEFT THE CHAT"}
              </motion.p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
} 