"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThreeCanvas from "./three/ThreeCanvas";
import ProductivityLandscape from "./three/ProductivityLandscape";
import TaskManager from "./components/TaskManager";
import FocusTimer from "./components/FocusTimer";
import Achievements from "./components/Achievements";
import ProductivityStats from "./components/ProductivityStats";
import { useTaskStore } from "./store/useTaskStore";

// Tabs for different sections of the app
const TABS = [
  { id: "tasks", label: "Tasks", emoji: "✅" },
  { id: "focus", label: "Focus", emoji: "⏱️" },
  { id: "stats", label: "Stats", emoji: "📊" },
  { id: "achievements", label: "Achievements", emoji: "🏆" },
  { id: "landscape", label: "Landscape", emoji: "🌄" }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const { tasks, focusSessions, productivityStats } = useTaskStore();
  
  // Handle task selection for focus timer
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveTab("focus");
  };
  
  // Floating UI elements
  const FloatingTitle = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-6 left-1/2 transform -translate-x-1/2 z-10"
    >
      <motion.h1
        animate={{
          rotate: [0, 1, 0, -1, 0],
          scale: [1, 1.01, 1, 1.01, 1]
        }}
        transition={{ duration: 5, repeat: Infinity }}
        className="text-3xl md:text-4xl font-bold text-center text-foreground bg-background/60 backdrop-blur-lg px-6 py-2 rounded-full shadow-lg border border-time-warp/30"
      >
        <span className="text-primary">TimeWarp</span> <span className="text-time-warp">Focus</span>
      </motion.h1>
    </motion.div>
  );
  
  // Show intro message if no tasks yet
  const IntroMessage = () => {
    if (tasks.length > 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full bg-background/90 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-primary/20 z-10"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Welcome to TimeWarp Focus!</h2>
        <p className="mb-4">
          This is a productivity app that will literally bend space-time to help you get things done.
          (Or at least it will pretend to.)
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li>Create tasks that can actually run away from you if you procrastinate</li>
          <li>Use the focus timer with reality-distorting options</li>
          <li>Track your productivity with AI personalities that range from supportive to unhinged</li>
          <li>Unlock ridiculous achievements</li>
          <li>Explore your 3D productivity landscape</li>
        </ul>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("tasks")}
          className="w-full py-3 bg-primary text-white rounded-lg font-bold"
        >
          Get Started
        </motion.button>
      </motion.div>
    );
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Three.js Background */}
      <ThreeCanvas showStats={false} backgroundColor={activeTab === "landscape" ? "transparent" : "#050505"}>
        {activeTab === "landscape" ? (
          <ProductivityLandscape 
            tasks={tasks} 
            stats={productivityStats} 
            onTaskClick={handleTaskSelect}
          />
        ) : (
          /* Simple 3D elements for the background */
          <>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={0.5} />
            <mesh position={[0, 0, -10]}>
              <sphereGeometry args={[7, 32, 32]} />
              <meshStandardMaterial color="#6d28d9" opacity={0.2} transparent={true} />
            </mesh>
          </>
        )}
      </ThreeCanvas>
      
      {/* Floating Title */}
      <FloatingTitle />
      
      {/* Intro Message */}
      <IntroMessage />
      
      {/* Main Content Container */}
      <div className="relative z-10 pt-24 pb-24 min-h-screen">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-background/50 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-primary/10"
            >
              {activeTab === "tasks" && <TaskManager />}
              {activeTab === "focus" && <FocusTimer taskId={selectedTaskId} />}
              {activeTab === "stats" && <ProductivityStats />}
              {activeTab === "achievements" && <Achievements />}
              {activeTab === "landscape" && (
                <div className="h-[70vh] flex items-center justify-center">
                  <p className="text-center text-foreground/70 max-w-md">
                    Navigate the 3D landscape with your mouse. Interact with tasks by clicking on them.
                    <br /><br />
                    The landscape changes based on your productivity metrics. Complete tasks to grow the Focus Mountain!
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-primary/20 py-2 px-4 z-20">
        <div className="container mx-auto">
          <nav className="flex justify-between items-center">
            {TABS.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg text-sm ${
                  activeTab === tab.id 
                    ? "bg-primary/10 text-primary" 
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <span className="text-xl mb-1">{tab.emoji}</span>
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
