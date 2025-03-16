import React, { useState } from 'react';
import { useTaskStore, Task } from '../store/useTaskStore';
import { motion } from 'framer-motion';
import { formatDistance, isPast, isToday, isTomorrow } from 'date-fns';

export default function TaskManager() {
  const { tasks, addTask, updateTask, deleteTask, completeTask, makeTaskRunAway } = useTaskStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    importance: 3,
    deadline: ''
  });
  
  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      importance: 3,
      deadline: ''
    });
    setShowForm(false);
    setSelectedTask(null);
  };
  
  // Add or update task
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTask) {
      // Update existing task
      updateTask(selectedTask.id, {
        title: formData.title,
        description: formData.description,
        importance: formData.importance,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined
      });
    } else {
      // Add new task
      addTask({
        title: formData.title,
        description: formData.description,
        importance: formData.importance,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined
      });
    }
    
    resetForm();
  };
  
  // Edit task
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      importance: task.importance,
      deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
    });
    setShowForm(true);
  };
  
  // Get hilarious procrastination message based on task status and deadline
  const getProcrastinationMessage = (task: Task) => {
    if (!task.deadline) return "No deadline, no pressure, no problem? Ha!";
    
    const now = new Date();
    const deadline = new Date(task.deadline);
    const daysDiff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (task.status === 'completed') {
      return "You actually completed this? Impressive!";
    }
    
    if (task.status === 'running-away') {
      return "This task has achieved sentience and is actively fleeing from you.";
    }
    
    if (isPast(deadline)) {
      return "OVERDUE! This task is now legally allowed to mock you.";
    }
    
    if (isToday(deadline)) {
      return "Due TODAY. No pressure, just everyone judging you silently.";
    }
    
    if (isTomorrow(deadline)) {
      return "Due TOMORROW. Have you considered panicking yet?";
    }
    
    if (daysDiff <= 3) {
      return `Due in ${daysDiff} days. Your future self already resents you.`;
    }
    
    if (daysDiff <= 7) {
      return `Due in ${daysDiff} days. Plenty of time to procrastinate!`;
    }
    
    return `Due in ${daysDiff} days. Let's be honest, you'll start this the night before.`;
  };
  
  // Increase procrastination level and make task run away if it gets too high
  const handleProcrastinate = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newProcrastinationLevel = Math.min(100, task.procrastinationLevel + 20);
    
    if (newProcrastinationLevel >= 100) {
      makeTaskRunAway(taskId);
    } else {
      updateTask(taskId, { procrastinationLevel: newProcrastinationLevel });
    }
  };
  
  // Group tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const runawayTasks = tasks.filter(t => t.status === 'running-away');
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Task Manager</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          {showForm ? 'Cancel' : 'Add Task'}
        </motion.button>
      </div>
      
      {/* Task Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-background/90 backdrop-blur-sm rounded-xl shadow-lg border border-primary/20"
        >
          <h3 className="text-xl font-bold mb-4">{selectedTask ? 'Edit Task' : 'Add New Task'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Task Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium">Deadline (Optional)</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Importance Level: {formData.importance}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.importance}
                  onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Meh</span>
                  <span>Important</span>
                  <span>CRITICAL</span>
                </div>
              </div>
              
              <div className="flex items-end justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg"
                >
                  {selectedTask ? 'Update Task' : 'Add Task'}
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      )}
      
      {/* Task Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="inline-block w-3 h-3 bg-accent rounded-full mr-2"></span>
            Pending Tasks
          </h3>
          
          {pendingTasks.length === 0 ? (
            <p className="text-gray-500 italic">No pending tasks. Suspicious.</p>
          ) : (
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-background/80 backdrop-blur-sm rounded-lg shadow border border-accent/20"
                >
                  <div className="flex justify-between">
                    <h4 className="font-bold text-lg">{task.title}</h4>
                    <span className="text-sm text-accent font-medium">
                      {task.importance === 5 ? '!!!CRITICAL!!!' : 
                       task.importance === 4 ? 'Very Important' :
                       task.importance === 3 ? 'Important' :
                       task.importance === 2 ? 'Somewhat Important' : 'Meh'}
                    </span>
                  </div>
                  
                  <p className="text-sm mt-2">{task.description}</p>
                  
                  <div className="mt-2 text-sm italic text-gray-500">
                    {task.deadline ? (
                      <p>{getProcrastinationMessage(task)}</p>
                    ) : (
                      <p>No deadline. Living dangerously, I see.</p>
                    )}
                  </div>
                  
                  {task.procrastinationLevel > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-error">
                        Procrastination Level: {task.procrastinationLevel}%
                      </p>
                      <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                        <div 
                          className="h-full bg-error rounded-full" 
                          style={{ 
                            width: `${task.procrastinationLevel}%`,
                            opacity: 0.3 + (task.procrastinationLevel / 150)  
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => completeTask(task.id)}
                      className="px-3 py-1 bg-success text-white text-sm rounded"
                    >
                      Complete
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditTask(task)}
                      className="px-3 py-1 bg-primary text-white text-sm rounded"
                    >
                      Edit
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleProcrastinate(task.id)}
                      className="px-3 py-1 bg-error text-white text-sm rounded"
                    >
                      Procrastinate
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deleteTask(task.id)}
                      className="px-3 py-1 bg-gray-700 text-white text-sm rounded"
                    >
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Completed and Runaway Tasks */}
        <div className="space-y-6">
          {/* Completed Tasks */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-success rounded-full mr-2"></span>
              Completed Tasks
            </h3>
            
            {completedTasks.length === 0 ? (
              <p className="text-gray-500 italic">No completed tasks yet. Get to work!</p>
            ) : (
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-background/60 backdrop-blur-sm rounded-lg shadow border border-success/20"
                  >
                    <div className="flex justify-between">
                      <h4 className="font-bold">{task.title}</h4>
                      <span className="text-xs text-success">
                        {task.completedAt ? 
                          `Completed ${formatDistance(new Date(task.completedAt), new Date(), { addSuffix: true })}` : 
                          'Completed'}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deleteTask(task.id)}
                        className="text-xs text-error"
                      >
                        Remove
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          {/* Runaway Tasks */}
          {runawayTasks.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="inline-block w-3 h-3 bg-error animate-pulse rounded-full mr-2"></span>
                Tasks That Ran Away
              </h3>
              
              <div className="space-y-3">
                {runawayTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-background/60 backdrop-blur-sm rounded-lg shadow border border-error/20"
                  >
                    <div className="flex justify-between">
                      <h4 className="font-bold">{task.title}</h4>
                      <span className="text-xs text-error animate-pulse">
                        Fled from reality
                      </span>
                    </div>
                    
                    <p className="text-xs italic mt-1">
                      This task was ignored for so long it became self-aware and ran away.
                      It might return when you least expect it.
                    </p>
                    
                    <div className="mt-2 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deleteTask(task.id)}
                        className="text-xs text-error"
                      >
                        Accept Loss
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 