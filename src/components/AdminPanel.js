import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  ArrowLeft, 
  Search, 
  MoreVertical, 
  Edit3, 
  Trash2,
  Plus,
  Calendar,
  Clock,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addTask, getTasksByUser, startTimer, stopTimer, activeTimers } = useTask();
  
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    position: ''
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    assignedTo: ''
  });

  useEffect(() => {
    // Load employees from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('taskflow_users') || '[]');
    const employeeUsers = storedUsers.filter(u => u.role === 'employee');
    setEmployees(employeeUsers);
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    const users = JSON.parse(localStorage.getItem('taskflow_users') || '[]');
    
    // Check if employee already exists
    if (users.find(u => u.email === newEmployee.email)) {
      alert('Employee with this email already exists');
      return;
    }
    
    const employee = {
      id: Date.now().toString(),
      ...newEmployee,
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };
    
    users.push(employee);
    localStorage.setItem('taskflow_users', JSON.stringify(users));
    
    setEmployees(prev => [...prev, employee]);
    setNewEmployee({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      department: '',
      position: ''
    });
    setShowAddEmployee(false);
  };

  const handleAssignTask = (e) => {
    e.preventDefault();
    
    const taskData = {
      ...newTask,
      assignedBy: user.id,
      assignedByName: user.name
    };
    
    addTask(taskData);
    
    setNewTask({
      title: '',
      description: '',
      deadline: '',
      priority: 'medium',
      assignedTo: ''
    });
    setShowAssignTask(false);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      const users = JSON.parse(localStorage.getItem('taskflow_users') || '[]');
      const updatedUsers = users.filter(u => u.id !== employeeId);
      localStorage.setItem('taskflow_users', JSON.stringify(updatedUsers));
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    }
  };

  const handleTimerControl = (taskId, action) => {
    if (action === 'start') {
      startTimer(taskId);
    } else {
      stopTimer(taskId);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const EmployeeCard = ({ employee, index }) => {
    const [showActions, setShowActions] = useState(false);
    const employeeTasks = getTasksByUser(employee.id);
    const activeTasks = employeeTasks.filter(t => t.status === 'in-progress').length;
    const completedTasks = employeeTasks.filter(t => t.status === 'completed').length;

    return (
      <motion.div
        className="employee-card"
        initial={false}
        whileHover={{ scale: 1.01, y: -1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="employee-header">
          <div className="employee-avatar">
            <User size={24} />
          </div>
          <div className="employee-info">
            <h3>{employee.name}</h3>
            <p>{employee.position} - {employee.department}</p>
            <span className="employee-email">{employee.email}</span>
          </div>
          <button 
            className="employee-menu"
            onClick={() => setShowActions(!showActions)}
          >
            <MoreVertical size={16} />
          </button>
        </div>

        <div className="employee-stats">
          <div className="stat">
            <span className="stat-value">{employeeTasks.length}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
          <div className="stat">
            <span className="stat-value">{activeTasks}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat">
            <span className="stat-value">{completedTasks}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="employee-actions">
          <motion.button
            className="assign-task-btn"
            onClick={() => {
              setSelectedEmployee(employee);
              setNewTask({...newTask, assignedTo: employee.id});
              setShowAssignTask(true);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={16} />
            Assign Task
          </motion.button>
        </div>

        <AnimatePresence>
          {showActions && (
            <motion.div
              className="employee-actions-menu"
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
                  handleDeleteEmployee(employee.id);
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

  const TaskControlPanel = () => {
    const allTasks = employees.flatMap(emp => 
      getTasksByUser(emp.id).map(task => ({
        ...task,
        employeeName: employees.find(e => e.id === task.assignedTo)?.name || 'Unknown'
      }))
    );

    return (
      <div className="task-control-panel">
        <h3>Task Control Center</h3>
        <div className="tasks-grid">
          {allTasks.map(task => (
            <motion.div
              key={task.id}
              className={`task-control-card ${task.status}`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="task-control-header">
                <h4>{task.title}</h4>
                <span className="employee-name">{task.employeeName}</span>
              </div>
              <p className="task-control-description">{task.description}</p>
              <div className="task-control-meta">
                <span className="deadline">
                  <Calendar size={14} />
                  {new Date(task.deadline).toLocaleDateString()}
                </span>
                <span className="time-spent">
                  <Clock size={14} />
                  {Math.floor((task.timeSpent || 0) / 3600)}h {Math.floor(((task.timeSpent || 0) % 3600) / 60)}m
                </span>
              </div>
              {task.status !== 'completed' && (
                <div className="timer-controls">
                  <motion.button
                    className={`timer-control-btn ${activeTimers[task.id] ? 'stop' : 'start'}`}
                    onClick={() => handleTimerControl(task.id, activeTimers[task.id] ? 'stop' : 'start')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {activeTimers[task.id] ? 'Stop Timer' : 'Start Timer'}
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Only administrators can access this panel.</p>
          <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="admin-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="admin-header">
        <motion.button
          className="back-btn"
          onClick={() => navigate('/dashboard')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft size={20} />
        </motion.button>
        <h1>Admin Panel</h1>
        <motion.button
          className="add-employee-btn"
          onClick={() => setShowAddEmployee(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <UserPlus size={20} />
        </motion.button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <Users size={20} />
          Employees
        </button>
        <button 
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <Calendar size={20} />
          Task Control
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'employees' && (
          <>
            <div className="search-section">
              <div className="search-bar">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="employees-grid">
              {filteredEmployees.map((employee, index) => (
                <EmployeeCard key={employee.id} employee={employee} index={index} />
              ))}
              
              {filteredEmployees.length === 0 && (
                <motion.div 
                  className="empty-employees"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Users size={64} />
                  <h3>No employees found</h3>
                  <p>Add employees to get started</p>
                </motion.div>
              )}
            </div>
          </>
        )}

        {activeTab === 'tasks' && <TaskControlPanel />}
      </div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddEmployee && (
          <motion.div
            className="modal-overlay"
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
                <h2>Add New Employee</h2>
                <button onClick={() => setShowAddEmployee(false)}>×</button>
              </div>
              
              <form onSubmit={handleAddEmployee}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={newEmployee.department}
                      onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Position</label>
                    <input
                      type="text"
                      value={newEmployee.position}
                      onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowAddEmployee(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary">
                    Add Employee
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Task Modal */}
      <AnimatePresence>
        {showAssignTask && (
          <motion.div
            className="modal-overlay"
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
                <h2>Assign Task to {selectedEmployee?.name}</h2>
                <button onClick={() => setShowAssignTask(false)}>×</button>
              </div>
              
              <form onSubmit={handleAssignTask}>
                <div className="form-group">
                  <label>Task Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
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
                  <button type="button" onClick={() => setShowAssignTask(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary">
                    Assign Task
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

export default AdminPanel;
