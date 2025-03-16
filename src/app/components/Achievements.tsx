import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore, Achievement } from '../store/useTaskStore';
import { formatDistance } from 'date-fns';

export default function Achievements() {
  const { achievements } = useTaskStore();
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked);
  
  // Check for newly unlocked achievements
  useEffect(() => {
    const checkNewAchievements = () => {
      const unlocked = achievements.filter(a => a.isUnlocked && a.unlockedAt);
      
      if (unlocked.length === 0) return;
      
      // Sort by most recently unlocked
      const sortedUnlocked = [...unlocked].sort((a, b) => {
        if (!a.unlockedAt || !b.unlockedAt) return 0;
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      });
      
      const mostRecent = sortedUnlocked[0];
      
      // If this achievement was unlocked in the last 5 seconds, show notification
      if (mostRecent.unlockedAt) {
        const unlockTime = new Date(mostRecent.unlockedAt).getTime();
        const now = Date.now();
        const secondsSinceUnlock = (now - unlockTime) / 1000;
        
        if (secondsSinceUnlock < 5) {
          setNewAchievement(mostRecent);
          setShowNotification(true);
          
          // Auto-hide after 5 seconds
          setTimeout(() => {
            setShowNotification(false);
          }, 5000);
        }
      }
    };
    
    checkNewAchievements();
    
    // Run this check periodically
    const interval = setInterval(checkNewAchievements, 2000);
    
    return () => clearInterval(interval);
  }, [achievements]);
  
  // Achievement notification component
  const AchievementNotification = ({ achievement }: { achievement: Achievement }) => {
    return (
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className="fixed top-4 right-4 max-w-sm bg-background border-2 border-primary rounded-lg shadow-lg p-4 z-50"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 bg-primary/20 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Achievement Unlocked!</p>
            <p className="mt-1 text-sm font-bold text-time-warp">{achievement.title}</p>
            <p className="mt-1 text-xs text-foreground/80">{achievement.description}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-background rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={() => setShowNotification(false)}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Achievement notification */}
      <AnimatePresence>
        {showNotification && newAchievement && (
          <AchievementNotification achievement={newAchievement} />
        )}
      </AnimatePresence>
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Achievements</h2>
        <p className="text-foreground/70">Unlock these ridiculous badges by being productive... or not.</p>
      </div>
      
      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-success">Unlocked Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedAchievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                whileHover={{ scale: 1.02 }}
                className="bg-background/80 backdrop-blur-sm rounded-lg shadow p-4 border border-success/20"
              >
                <div className="flex items-center mb-2">
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                    className="rounded-full bg-success/20 p-2 mr-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                  <h4 className="font-bold text-lg">{achievement.title}</h4>
                </div>
                <p className="text-sm mb-2">{achievement.description}</p>
                {achievement.unlockedAt && (
                  <p className="text-xs text-foreground/60">
                    Unlocked {formatDistance(new Date(achievement.unlockedAt), new Date(), { addSuffix: true })}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Locked Achievements */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-400">Locked Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lockedAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className="bg-background/40 backdrop-blur-sm rounded-lg shadow p-4 border border-gray-300/20"
            >
              <div className="flex items-center mb-2">
                <div className="rounded-full bg-gray-200 p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-bold text-lg text-gray-400">{achievement.title}</h4>
              </div>
              <p className="text-sm text-gray-400">{achievement.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Special Hidden Achievements - Displayed as Mystery Boxes */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4 text-time-warp">??? Mystery Achievements ???</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="bg-foreground/5 backdrop-blur-sm rounded-lg shadow p-4 border border-time-warp/20 aspect-square flex flex-col items-center justify-center text-center cursor-not-allowed"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl text-time-warp mb-2"
              >
                ?
              </motion.div>
              <p className="text-xs text-foreground/60">Unlock this mysterious achievement by doing something completely unexpected...</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* The "Self Esteem" Boost Section */}
      <motion.div 
        className="mt-12 p-6 bg-primary/10 rounded-xl"
        whileHover={{ scale: 1.01 }}
      >
        <h3 className="text-xl font-bold mb-2 text-center">Achievement Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
          <div 
            className="bg-primary h-4 rounded-full flex items-center justify-center text-xs text-white font-bold"
            style={{ width: `${(unlockedAchievements.length / achievements.length) * 100}%` }}
          >
            {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
          </div>
        </div>
        <p className="text-center mt-4 text-sm">
          {unlockedAchievements.length === 0 
            ? "You haven't unlocked any achievements yet. The bar is literally on the floor."
            : unlockedAchievements.length < 3
              ? "You've unlocked a few achievements. Your productivity level is 'technically exists'."
              : unlockedAchievements.length < 5
                ? "Making progress! Your productivity level is 'occasionally remembers to do things'."
                : "Wow, look at you go! Your productivity level is 'suspiciously competent'."
          }
        </p>
      </motion.div>
    </div>
  );
} 