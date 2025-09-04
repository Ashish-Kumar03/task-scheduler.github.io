import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const TaskContext = createContext();

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [activeTimers, setActiveTimers] = useState({});

  useEffect(() => {
    // Load tasks from localStorage
    const storedTasks = localStorage.getItem('taskflow_tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  }, []);

  useEffect(() => {
    // Save tasks to localStorage whenever tasks change
    localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (taskData) => {
    const newTask = {
      id: uuidv4(),
      ...taskData,
      status: 'pending',
      timeSpent: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (taskId, updates) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    // Stop timer if running
    if (activeTimers[taskId]) {
      stopTimer(taskId);
    }
  };

  const startTimer = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Update task status and start time
    updateTask(taskId, { 
      status: 'in-progress',
      startedAt: task.startedAt || new Date().toISOString()
    });

    // Start interval timer - update every 30 seconds to prevent fast changes
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, timeSpent: (task.timeSpent || 0) + elapsed }
          : task
      ));
    }, 30000); // Update every 30 seconds instead of every second

    setActiveTimers(prev => ({
      ...prev,
      [taskId]: { interval, startTime }
    }));
  };

  const stopTimer = (taskId) => {
    const timer = activeTimers[taskId];
    if (timer) {
      clearInterval(timer.interval);
      const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
      
      updateTask(taskId, { 
        timeSpent: (tasks.find(t => t.id === taskId)?.timeSpent || 0) + elapsed,
        status: 'paused'
      });

      setActiveTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[taskId];
        return newTimers;
      });
    }
  };

  const completeTask = (taskId) => {
    // Stop timer if running
    if (activeTimers[taskId]) {
      stopTimer(taskId);
    }
    
    updateTask(taskId, { 
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  };

  const getTasksByUser = (userId) => {
    return tasks.filter(task => task.assignedTo === userId);
  };

  const getTaskStats = (userId) => {
    const userTasks = getTasksByUser(userId);
    return {
      total: userTasks.length,
      pending: userTasks.filter(t => t.status === 'pending').length,
      inProgress: userTasks.filter(t => t.status === 'in-progress').length,
      completed: userTasks.filter(t => t.status === 'completed').length,
      overdue: userTasks.filter(t => 
        t.status !== 'completed' && 
        new Date(t.deadline) < new Date()
      ).length
    };
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;
    
    if (diff <= 0) {
      return 'Overdue';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const value = {
    tasks,
    activeTimers,
    addTask,
    updateTask,
    deleteTask,
    startTimer,
    stopTimer,
    completeTask,
    getTasksByUser,
    getTaskStats,
    getTimeRemaining
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
