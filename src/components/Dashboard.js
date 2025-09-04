import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Plus, 
  Settings, 
  LogOut, 
  User,
  Eye,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getTasksByUser, getTaskStats } = useTask();
  const [stats, setStats] = useState({});
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    if (user) {
      const userStats = getTaskStats(user.id);
      const userTasks = getTasksByUser(user.id);
      setStats(userStats);
      setRecentTasks(userTasks.slice(-5).reverse());
    }
  }, [user, getTasksByUser, getTaskStats]);

  const handleLogout = () => {
    logout();
  };

  const StatCard = ({ icon: Icon, title, value, color, delay }) => (
    <motion.div
      className={`stat-card ${color}`}
      initial={false}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </motion.div>
  );

  const TaskItem = ({ task, index }) => (
    <motion.div
      className="task-item"
      initial={false}
      whileHover={{ x: 3 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className={`task-status ${task.status}`}>
        {task.status === 'completed' ? (
          <CheckCircle size={16} />
        ) : task.status === 'in-progress' ? (
          <Clock size={16} />
        ) : (
          <AlertCircle size={16} />
        )}
      </div>
      <div className="task-details">
        <h4>{task.title}</h4>
        <p>{task.description}</p>
        <span className="task-deadline">
          Due: {new Date(task.deadline).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="dashboard-header">
        <motion.div 
          className="header-content"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="user-info">
            <div className="user-avatar">
              <User size={24} />
            </div>
            <div>
              <h1>Welcome back, {user?.name}!</h1>
              <p>Ready to tackle your tasks today?</p>
            </div>
          </div>
          <div className="header-actions">
            <motion.button
              className="settings-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Settings size={20} />
            </motion.button>
            <motion.button
              className="logout-btn"
              onClick={handleLogout}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <LogOut size={20} />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <StatCard
            icon={Calendar}
            title="Total Tasks"
            value={stats.total || 0}
            color="blue"
            delay={0.1}
          />
          <StatCard
            icon={Clock}
            title="In Progress"
            value={stats.inProgress || 0}
            color="orange"
            delay={0.2}
          />
          <StatCard
            icon={CheckCircle}
            title="Completed"
            value={stats.completed || 0}
            color="green"
            delay={0.3}
          />
          <StatCard
            icon={AlertCircle}
            title="Overdue"
            value={stats.overdue || 0}
            color="red"
            delay={0.4}
          />
        </div>

        <div className="dashboard-sections">
          <motion.div 
            className="section recent-tasks"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="section-header">
              <h2>Recent Tasks</h2>
              <motion.button
                className="view-all-btn"
                onClick={() => navigate('/tasks')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View All
              </motion.button>
            </div>
            <div className="tasks-list">
              {recentTasks.length > 0 ? (
                recentTasks.map((task, index) => (
                  <TaskItem key={task.id} task={task} index={index} />
                ))
              ) : (
                <motion.div 
                  className="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Calendar size={48} />
                  <h3>No tasks yet</h3>
                  <p>Create your first task to get started!</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div 
            className="section quick-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              {user?.role === 'admin' ? (
                <motion.button
                  className="action-btn primary"
                  onClick={() => navigate('/admin')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={20} />
                  Manage Tasks
                </motion.button>
              ) : (
                <motion.button
                  className="action-btn primary"
                  onClick={() => navigate('/tasks')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Eye size={20} />
                  View Tasks
                </motion.button>
              )}
              <motion.button
                className="action-btn secondary"
                onClick={() => navigate('/tasks')}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrendingUp size={20} />
                View Progress
              </motion.button>
              {user?.role === 'admin' && (
                <motion.button
                  className="action-btn admin"
                  onClick={() => navigate('/admin')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User size={20} />
                  Admin Panel
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
