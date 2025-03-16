import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTaskStore } from '../store/useTaskStore';
import { formatDistance, format, addSeconds } from 'date-fns';

// Funny encouraging (or roasting) messages for different stats
const MESSAGES = {
  noTasks: [
    "You haven't created any tasks yet. Is your life really that simple?",
    "No tasks? Either you're incredibly efficient or masterfully avoiding work.",
    "The void of tasks stares back at you. It's judging you silently."
  ],
  fewTasks: [
    "A few tasks on your plate. Dipping your toes in productivity, I see.",
    "Look at you being all 'organized' with these tasks. Adorable.",
    "You've created some tasks! The bar was on the floor, but you stepped over it."
  ],
  manyTasks: [
    "Wow, that's a lot of tasks. Overcompensating for something?",
    "Your task list is longer than a CVS receipt. Impressive or concerning?",
    "With this many tasks, you might need to add 'take a break' to your list."
  ],
  noCompleted: [
    "Zero completed tasks. Even my expectations were low, but wow.",
    "Have you tried, you know, actually doing the tasks instead of just creating them?",
    "Achievement Unlocked: Created a to-do list and then completely ignored it."
  ],
  someCompleted: [
    "You've completed a few tasks. Bare minimum achievement unlocked!",
    "Some tasks completed. Your productivity is technically measurable.",
    "You're finishing tasks at the pace of a sleepy turtle. But hey, forward motion!"
  ],
  highCompletionRate: [
    "Impressive completion rate! Are you secretly a productivity robot?",
    "Wow, you're actually getting things done. Who are you and what have you done with the real user?",
    "You're on fire! Metaphorically. Please don't actually set anything on fire."
  ],
  longFocusTime: [
    "That's a lot of focus time. Remember to blink occasionally.",
    "You've spent a concerning amount of time focusing. Have you tried touching grass?",
    "Your chair probably has a permanent impression of your body at this point."
  ],
  shortFocusTime: [
    "Your focus sessions are shorter than my attention span. That's saying something.",
    "You've barely spent any time focusing. Is that a butterfly? Oh, sorry, got distracted.",
    "Focus time measured in seconds. At least you're consistent."
  ],
  manyRunaways: [
    "You have an impressive number of tasks running away. They're forming a support group.",
    "Your procrastination has reached supervillain levels. Tasks are fleeing in terror.",
    "Task exodus in progress. They're seeking asylum from your procrastination."
  ]
};

// Helper to get random message
const getRandomMessage = (category: keyof typeof MESSAGES) => {
  const messages = MESSAGES[category];
  return messages[Math.floor(Math.random() * messages.length)];
};

export default function ProductivityStats() {
  const { tasks, focusSessions, productivityStats } = useTaskStore();
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [aiPersonality, setAiPersonality] = useState<number>(0);
  
  // Calculate derived stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const runawayTasks = tasks.filter(t => t.status === 'running-away').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length;
  
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const procrastinationRate = totalTasks > 0 ? (runawayTasks / totalTasks) * 100 : 0;
  
  const totalFocusTime = focusSessions.reduce((total, session) => total + session.duration, 0);
  const averageFocusDuration = focusSessions.length > 0 ? totalFocusTime / focusSessions.length : 0;
  
  // Format focus time as a readable string
  const formatFocusTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };
  
  // Generate AI personality and messages on mount and when stats change
  useEffect(() => {
    const generatePersonality = () => {
      // 0 = supportive, 1 = sarcastic, 2 = unhinged
      return Math.floor(Math.random() * 3);
    };
    
    const generateMessages = () => {
      const newMessages: Record<string, string> = {};
      
      // Task count message
      if (totalTasks === 0) {
        newMessages.taskCount = getRandomMessage('noTasks');
      } else if (totalTasks < 5) {
        newMessages.taskCount = getRandomMessage('fewTasks');
      } else {
        newMessages.taskCount = getRandomMessage('manyTasks');
      }
      
      // Completion rate message
      if (completedTasks === 0) {
        newMessages.completionRate = getRandomMessage('noCompleted');
      } else if (completionRate < 50) {
        newMessages.completionRate = getRandomMessage('someCompleted');
      } else {
        newMessages.completionRate = getRandomMessage('highCompletionRate');
      }
      
      // Focus time message
      if (totalFocusTime > 7200) { // 2 hours
        newMessages.focusTime = getRandomMessage('longFocusTime');
      } else {
        newMessages.focusTime = getRandomMessage('shortFocusTime');
      }
      
      // Runaway tasks message
      if (runawayTasks > 2) {
        newMessages.runawayTasks = getRandomMessage('manyRunaways');
      }
      
      return newMessages;
    };
    
    setAiPersonality(generatePersonality());
    setMessages(generateMessages());
  }, [totalTasks, completedTasks, completionRate, totalFocusTime, runawayTasks]);
  
  // AI personality names and styles
  const aiPersonalities = [
    { name: "SupportBot", className: "text-success", emoji: "🙂" },
    { name: "SarcastiBot", className: "text-accent", emoji: "😏" },
    { name: "ChaosAnalyzer 9000", className: "text-time-warp", emoji: "🤪" }
  ];
  
  const currentAi = aiPersonalities[aiPersonality];
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Productivity Stats</h2>
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`flex items-center gap-2 px-3 py-1 rounded-full ${currentAi.className} border border-current`}
        >
          <span className="text-xl">{currentAi.emoji}</span>
          <span className="font-bold">{currentAi.name}</span>
        </motion.div>
      </div>
      
      {/* AI Message Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-8 p-4 bg-background/80 backdrop-blur-sm rounded-xl shadow-lg border border-${currentAi.className}/20`}
      >
        <div className="flex items-start gap-3">
          <div className={`text-3xl ${currentAi.className}`}>{currentAi.emoji}</div>
          <div>
            <p className="text-sm italic mb-2">
              {aiPersonality === 0 && "I'm here to help with your productivity journey!"}
              {aiPersonality === 1 && "Let me analyze your so-called 'productivity'..."}
              {aiPersonality === 2 && "PROCESSING HUMAN INEFFICIENCY PATTERNS... BEEP BOOP!"}
            </p>
            <p className="font-medium">
              {messages.taskCount}
            </p>
            {completedTasks > 0 && (
              <p className="mt-2">
                {messages.completionRate}
              </p>
            )}
            {totalFocusTime > 0 && (
              <p className="mt-2">
                {messages.focusTime}
              </p>
            )}
            {runawayTasks > 0 && (
              <p className="mt-2">
                {messages.runawayTasks}
              </p>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Tasks */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="p-4 bg-background/60 backdrop-blur-sm rounded-lg shadow border border-primary/20"
        >
          <h3 className="text-sm text-foreground/70 mb-1">Total Tasks</h3>
          <p className="text-3xl font-bold">{totalTasks}</p>
        </motion.div>
        
        {/* Completion Rate */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="p-4 bg-background/60 backdrop-blur-sm rounded-lg shadow border border-success/20"
        >
          <h3 className="text-sm text-foreground/70 mb-1">Completion Rate</h3>
          <p className="text-3xl font-bold">{Math.round(completionRate)}%</p>
        </motion.div>
        
        {/* Procrastination Rate */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="p-4 bg-background/60 backdrop-blur-sm rounded-lg shadow border border-error/20"
        >
          <h3 className="text-sm text-foreground/70 mb-1">Procrastination Index</h3>
          <p className="text-3xl font-bold">{Math.round(procrastinationRate)}%</p>
        </motion.div>
        
        {/* Current Streak */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="p-4 bg-background/60 backdrop-blur-sm rounded-lg shadow border border-accent/20"
        >
          <h3 className="text-sm text-foreground/70 mb-1">Current Streak</h3>
          <p className="text-3xl font-bold">{productivityStats.currentStreak} day{productivityStats.currentStreak !== 1 ? 's' : ''}</p>
        </motion.div>
      </div>
      
      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Focus Time */}
        <div className="p-4 bg-background/60 backdrop-blur-sm rounded-lg shadow border border-primary/20">
          <h3 className="font-bold text-lg mb-3">Focus Time</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Total Focus Time</span>
              <span className="font-medium">{formatFocusTime(totalFocusTime)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Focus Sessions</span>
              <span className="font-medium">{focusSessions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Average Session</span>
              <span className="font-medium">{formatFocusTime(averageFocusDuration)}</span>
            </div>
          </div>
          
          {/* Funny projection */}
          <div className="mt-4 bg-primary/10 p-3 rounded-lg">
            <p className="text-sm font-medium">At this rate, you'll achieve inbox zero in:</p>
            <p className="text-2xl font-bold mt-1">
              {pendingTasks === 0 ? (
                "Already there! 🎉"
              ) : completionRate === 0 ? (
                "∞ (literally never)"
              ) : (
                format(
                  addSeconds(new Date(), (pendingTasks / (completedTasks || 1)) * totalFocusTime),
                  "MMM d, yyyy"
                )
              )}
            </p>
            <p className="text-xs text-foreground/70 mt-1 italic">
              {pendingTasks === 0 
                ? "Wait, is that even possible? Should we be concerned?" 
                : completionRate === 0
                  ? "Maybe try completing at least one task? Just a thought."
                  : "This prediction is 100% scientifically accurate and not at all made up."}
            </p>
          </div>
        </div>
        
        {/* Task Breakdown */}
        <div className="p-4 bg-background/60 backdrop-blur-sm rounded-lg shadow border border-primary/20">
          <h3 className="font-bold text-lg mb-3">Task Breakdown</h3>
          
          <div className="mb-4 space-y-3">
            {/* Pending Tasks */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Pending Tasks</span>
                <span className="font-medium">{pendingTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full" 
                  style={{ width: `${pendingTasks / Math.max(1, totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Completed Tasks */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Completed Tasks</span>
                <span className="font-medium">{completedTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-success h-2 rounded-full" 
                  style={{ width: `${completedTasks / Math.max(1, totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Runaway Tasks */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Runaway Tasks</span>
                <span className="font-medium">{runawayTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-error h-2 rounded-full" 
                  style={{ width: `${runawayTasks / Math.max(1, totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Funny stats */}
          <div className="mt-4 bg-primary/10 p-3 rounded-lg">
            <p className="text-sm font-medium">Your Productivity Percentile:</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-2xl font-bold">
                {Math.round(
                  55 + 
                  (completionRate * 0.3) - 
                  (procrastinationRate * 0.2) + 
                  (Math.min(10, totalFocusTime / 3600) * 2)
                )}%
              </p>
              <p className="text-sm text-foreground/70 mb-1">
                {/* Random comparison */}
                {(() => {
                  const comparisons = [
                    "of coffee mugs",
                    "of office plants",
                    "of sleepy cats",
                    "of middle managers",
                    "of professional procrastinators"
                  ];
                  return `(better than ${comparisons[Math.floor(Math.random() * comparisons.length)]})`;
                })()}
              </p>
            </div>
            <p className="text-xs text-foreground/70 mt-1 italic">
              Calculated using our proprietary "Making Numbers Up" algorithm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 