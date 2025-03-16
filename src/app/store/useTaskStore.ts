import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'running-away';
export type FocusState = 'idle' | 'focus' | 'break' | 'distorted';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
  deadline?: Date;
  completedAt?: Date;
  lastWorkedOn?: Date;
  timeSpent: number; // in seconds
  importance: number; // 1-5
  procrastinationLevel: number; // 0-100, increases when task is avoided
  position: { x: number; y: number; z: number }; // 3D position for visualization
}

export interface FocusSession {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  distortionLevel: number; // 0-100, affects time visualization
}

export interface ProductivityStats {
  totalTasksCompleted: number;
  totalTimeSpent: number; // in seconds
  longestStreak: number; // in days
  currentStreak: number; // in days
  lastActiveDay?: Date;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt?: Date;
  isUnlocked: boolean;
}

interface TaskStore {
  tasks: Task[];
  focusSessions: FocusSession[];
  currentFocusState: FocusState;
  currentSession?: FocusSession;
  productivityStats: ProductivityStats;
  achievements: Achievement[];
  
  // Task management
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'timeSpent' | 'procrastinationLevel' | 'position'>) => void;
  updateTask: (id: string, taskUpdate: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  makeTaskRunAway: (id: string) => void;
  
  // Focus session management
  startFocusSession: (taskId: string) => void;
  endFocusSession: () => void;
  setDistortionLevel: (level: number) => void;
  setFocusState: (state: FocusState) => void;
}

const PREDEFINED_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-task',
    title: 'Baby Steps',
    description: 'Created your first task. Congratulations on the bare minimum!',
    isUnlocked: false
  },
  {
    id: 'five-tasks-completed',
    title: 'Productivity Padawan',
    description: 'Completed 5 tasks. The force of productivity is starting to flow through you.',
    isUnlocked: false
  },
  {
    id: 'procrastination-master',
    title: 'Procrastination Grand Master',
    description: 'Successfully avoided a task for so long it achieved sentience and ran away.',
    isUnlocked: false
  },
  {
    id: 'time-bender',
    title: 'Time Lord',
    description: 'Spent over 4 hours in the time distortion zone without going insane.',
    isUnlocked: false
  },
  {
    id: 'deadline-warrior',
    title: 'Deadline Warrior',
    description: 'Completed 3 tasks within 10 minutes of their deadlines. We call this "efficient".',
    isUnlocked: false
  }
];

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      focusSessions: [],
      currentFocusState: 'idle',
      productivityStats: {
        totalTasksCompleted: 0,
        totalTimeSpent: 0,
        longestStreak: 0,
        currentStreak: 0,
        achievements: []
      },
      achievements: PREDEFINED_ACHIEVEMENTS,

      addTask: (taskData) => {
        const newTask: Task = {
          id: uuidv4(),
          createdAt: new Date(),
          status: 'pending',
          timeSpent: 0,
          procrastinationLevel: 0,
          position: { x: Math.random() * 5 - 2.5, y: Math.random() * 2, z: Math.random() * 5 - 2.5 },
          ...taskData
        };
        
        set((state) => ({ 
          tasks: [...state.tasks, newTask] 
        }));
        
        // Check for first task achievement
        const { achievements } = get();
        const firstTaskAchievement = achievements.find(a => a.id === 'first-task');
        if (firstTaskAchievement && !firstTaskAchievement.isUnlocked) {
          get().updateAchievement('first-task');
        }
      },
      
      updateTask: (id, taskUpdate) => {
        set((state) => ({
          tasks: state.tasks.map(task =>
            task.id === id ? { ...task, ...taskUpdate } : task
          )
        }));
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter(task => task.id !== id)
        }));
      },
      
      completeTask: (id) => {
        const completedAt = new Date();
        set((state) => {
          const updatedTasks = state.tasks.map(task =>
            task.id === id ? { ...task, status: 'completed', completedAt } : task
          );
          
          const completedCount = updatedTasks.filter(t => t.status === 'completed').length;
          
          // Check for achievements
          if (completedCount >= 5) {
            const achievement = state.achievements.find(a => a.id === 'five-tasks-completed');
            if (achievement && !achievement.isUnlocked) {
              get().updateAchievement('five-tasks-completed');
            }
          }
          
          return {
            tasks: updatedTasks,
            productivityStats: {
              ...state.productivityStats,
              totalTasksCompleted: state.productivityStats.totalTasksCompleted + 1
            }
          };
        });
      },
      
      makeTaskRunAway: (id) => {
        set((state) => ({
          tasks: state.tasks.map(task =>
            task.id === id ? { ...task, status: 'running-away' } : task
          )
        }));
        
        // Unlock procrastination achievement
        get().updateAchievement('procrastination-master');
      },
      
      startFocusSession: (taskId) => {
        const newSession: FocusSession = {
          id: uuidv4(),
          taskId,
          startTime: new Date(),
          duration: 0,
          distortionLevel: 0
        };
        
        set((state) => ({
          currentSession: newSession,
          currentFocusState: 'focus'
        }));
      },
      
      endFocusSession: () => {
        const { currentSession, tasks } = get();
        
        if (!currentSession) return;
        
        const endTime = new Date();
        const duration = (endTime.getTime() - currentSession.startTime.getTime()) / 1000;
        
        const completedSession: FocusSession = {
          ...currentSession,
          endTime,
          duration
        };
        
        // Update task time spent
        const task = tasks.find(t => t.id === currentSession.taskId);
        if (task) {
          get().updateTask(task.id, { 
            timeSpent: task.timeSpent + duration,
            lastWorkedOn: endTime
          });
        }
        
        set((state) => ({
          focusSessions: [...state.focusSessions, completedSession],
          currentSession: undefined,
          currentFocusState: 'idle',
          productivityStats: {
            ...state.productivityStats,
            totalTimeSpent: state.productivityStats.totalTimeSpent + duration
          }
        }));
        
        // Check for time bender achievement
        if (currentSession.distortionLevel > 75 && duration > 14400) { // 4 hours
          get().updateAchievement('time-bender');
        }
      },
      
      setDistortionLevel: (level) => {
        const { currentSession } = get();
        if (currentSession) {
          set(() => ({
            currentSession: { ...currentSession, distortionLevel: level },
            currentFocusState: level > 50 ? 'distorted' : 'focus'
          }));
        }
      },
      
      setFocusState: (state: FocusState) => {
        set(() => ({ currentFocusState: state }));
      },
      
      updateAchievement: (achievementId: string) => {
        set((state) => ({
          achievements: state.achievements.map(achievement => 
            achievement.id === achievementId 
              ? { ...achievement, isUnlocked: true, unlockedAt: new Date() } 
              : achievement
          )
        }));
      }
    }),
    {
      name: 'timewarp-focus-storage',
      partialize: (state) => ({ 
        tasks: state.tasks,
        focusSessions: state.focusSessions,
        productivityStats: state.productivityStats,
        achievements: state.achievements
      })
    }
  )
); 