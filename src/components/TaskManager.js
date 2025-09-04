import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Play, 
  Pause, 
  Check, 
  X, 
  Clock, 
  Calendar,
  User,
  ArrowLeft,
  Filter,
  Search,
  MoreVertical,
  Trash2,
  Edit3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { formatDistanceToNow } from 'date-fns';
import './TaskManager.css';

const TaskManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    tasks, 
    activeTimers, 
    addTask, 
    updateTask, 
    deleteTask, 
    startTimer, 
    stopTimer, 
    completeTask,
    getTimeRemaining,
    getTasksByUser 
  } = useTask();

  const [showAddTask, setShowAddTask] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userTasks, setUserTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    assignedTo: user?.id
  });

  useEffect(() => {
    if (user) {
      const tasks = getTasksByUser(user.id);
      setUserTasks(tasks);
    }
  }, [user, tasks, getTasksByUser]);

  const filteredTasks = userTasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.title.trim()) {
      addTask(newTask);
      setNewTask({
        title: '',
        description: '',
        deadline: '',
        priority: 'medium',
        assignedTo: user?.id
      });
      setShowAddTask(false);
    }
  };

  const handleSwipeComplete = (taskId) => {
    completeTask(taskId);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const TaskCard = ({ task, index }) => {
    const [showActions, setShowActions] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const isTimerActive = activeTimers[task.id];

    const handleDragStart = () => {
      setIsDragging(true);
    };

    const handleDrag = (event, info) => {
      if (task.status !== 'completed') {
        setSwipeOffset(info.offset.x);
      }
    };

    const handleDragEnd = (event, info) => {
      setIsDragging(false);
      if (info.offset.x > 150 && task.status !== 'completed') {
        handleSwipeComplete(task.id);
      }
      setSwipeOffset(0);
    };

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'low': return '#10b981';
        default: return '#6b7280';
      }
    };

    const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';

    return (
      <motion.div
        className={`task-card ${task.status} ${isOverdue ? 'overdue' : ''}`}
        layout
        initial={false}
        animate={{ 
          x: swipeOffset
        }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 300 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          background: swipeOffset > 100 ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.2))' : undefined
        }}
      >
        <div className="task-header">
          <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }} />
          <h3>{task.title}</h3>
          {user?.role === 'admin' && (
            <button 
              className="task-menu"
              onClick={() => setShowActions(!showActions)}
            >
              <MoreVertical size={16} />
            </button>
          )}
        </div>

        <div className="task-meta">
          <div className="task-deadline">
            <Calendar size={14} />
            <span className={isOverdue ? 'overdue-text' : ''}>
              {getTimeRemaining(task.deadline)}
            </span>
          </div>
          <div className="task-time">
            <Clock size={14} />
            <span>{formatTime(task.timeSpent || 0)}</span>
          </div>
        </div>

        <div className="task-actions">
          {task.status !== 'completed' && (
            <>
              {user?.role === 'admin' ? (
                <motion.button
                  className={`timer-btn ${isTimerActive ? 'active' : ''}`}
                  onClick={() => isTimerActive ? stopTimer(task.id) : startTimer(task.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isTimerActive ? <Pause size={16} /> : <Play size={16} />}
                  {isTimerActive ? 'Pause' : 'Start'}
                </motion.button>
              ) : (
                <div className="timer-status">
                  <Clock size={16} />
                  {isTimerActive ? 'Timer Running' : 'Timer Stopped'}
                </div>
              )}
              
              <motion.button
                className="complete-btn"
                onClick={() => handleSwipeComplete(task.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check size={16} />
                Complete
              </motion.button>
            </>
          )}
        </div>

        {swipeOffset > 50 && (
          <motion.div 
            className="swipe-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Check size={24} />
            <span>Release to complete</span>
          </motion.div>
        )}

        <AnimatePresence>
          {showActions && user?.role === 'admin' && (
            <motion.div
              className="task-actions-menu"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <button onClick={() => setShowActions(false)}>
                <Edit3 size={16} />
                Edit
              </button>
              <button 
                onClick={() => {
                  deleteTask(task.id);
                  setShowActions(false);
                }}
                className="delete-btn"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div 
      className="task-manager"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="task-manager-header">
        <motion.button
          className="back-btn"
          onClick={() => navigate('/dashboard')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft size={20} />
        </motion.button>
        <h1>Task Manager</h1>
        {user?.role === 'admin' && (
          <motion.button
            className="add-task-btn"
            onClick={() => setShowAddTask(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Plus size={20} />
          </motion.button>
        )}
      </div>

      <div className="task-filters">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          {['all', 'pending', 'in-progress', 'completed'].map(filterType => (
            <motion.button
              key={filterType}
              className={`filter-btn ${filter === filterType ? 'active' : ''}`}
              onClick={() => setFilter(filterType)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1).replace('-', ' ')}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="tasks-container">
        {filteredTasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} />
        ))}
        
        {filteredTasks.length === 0 && (
          <motion.div 
            className="empty-tasks"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Calendar size={64} />
            <h3>No tasks found</h3>
            <p>Create a new task or adjust your filters</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showAddTask && (
          <motion.div
            className="add-task-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <div className="modal-header">
                <h2>Add New Task</h2>
                <button onClick={() => setShowAddTask(false)}>
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAddTask}>
                <div className="form-group">
                  <label>Task Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Enter task title..."
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Enter task description..."
                    rows={3}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Deadline</label>
                    <input
                      type="datetime-local"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowAddTask(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary">
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskManager;
