import React, { useState, useEffect } from 'react';
import Navigation from '../../components/common/Navigation';
import { CheckSquare, Plus, Calendar, User, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isCaregiverUser } from '../../types/user';
import type { PatientUser } from '../../types/user';
import type { Task, TaskCategory, TaskPriority } from '../../types/task';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './CaregiverTasks.css';

const Tasks: React.FC = () => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [patients, setPatients] = useState<PatientUser[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        patientId: '',
        category: 'medication' as TaskCategory,
        priority: 'medium' as TaskPriority,
        points: 50,
        dueDate: ''
    });

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const loadData = async () => {
        if (!currentUser || !isCaregiverUser(currentUser)) return;

        try {
            // Load connected patients
            const patientIds = currentUser.patients || [];

            if (patientIds.length === 0) {
                setPatients([]);
                setTasks([]);
                return;
            }

            // Fetch patient details
            const patientsData: PatientUser[] = [];
            for (const patientId of patientIds) {
                const patientDoc = await getDoc(doc(db, 'users', patientId));
                if (patientDoc.exists() && patientDoc.data().role === 'patient') {
                    patientsData.push({
                        id: patientDoc.id,
                        ...patientDoc.data(),
                        createdAt: patientDoc.data().createdAt?.toDate() || new Date(),
                        updatedAt: patientDoc.data().updatedAt?.toDate() || new Date(),
                        lastVisit: patientDoc.data().lastVisit?.toDate()
                    } as PatientUser);
                }
            }
            setPatients(patientsData);

            // Set default patient selection
            if (patientsData.length > 0 && !newTask.patientId) {
                setNewTask(prev => ({ ...prev, patientId: patientsData[0].id }));
            }

            // Load tasks for all patients
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('caregiverId', '==', currentUser.id)
            );

            const tasksSnapshot = await getDocs(tasksQuery);
            const tasksData: Task[] = [];

            tasksSnapshot.forEach((doc) => {
                const data = doc.data();
                const patient = patientsData.find(p => p.id === data.patientId);
                tasksData.push({
                    id: doc.id,
                    ...data,
                    patientName: patient?.name || 'Unknown Patient',
                    dueDate: data.dueDate?.toDate() || new Date(),
                    completedAt: data.completedAt?.toDate(),
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date()
                } as Task);
            });

            // Sort by due date
            tasksData.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
            setTasks(tasksData);

        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleAssignTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !isCaregiverUser(currentUser)) return;

        setIsLoading(true);

        try {
            const patient = patients.find(p => p.id === newTask.patientId);

            // Create task in Firestore
            await addDoc(collection(db, 'tasks'), {
                title: newTask.title,
                description: newTask.description,
                patientId: newTask.patientId,
                patientName: patient?.name || 'Unknown',
                caregiverId: currentUser.id,
                category: newTask.category,
                priority: newTask.priority,
                points: Number(newTask.points),
                dueDate: new Date(newTask.dueDate),
                completed: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Refresh task list
            await loadData();

            setShowAssignModal(false);

            // Reset form but keep patient selection
            setNewTask(prev => ({
                ...prev,
                title: '',
                description: '',
                points: 50,
                dueDate: ''
            }));

        } catch (error) {
            console.error('Error assigning task:', error);
            alert('Failed to assign task. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getCategoryIcon = (category: TaskCategory) => {
        switch (category) {
            case 'medication': return '💊';
            case 'exercise': return '🏃';
            case 'mental': return '🧠';
            case 'social': return '👥';
            case 'diet': return '🥗';
            default: return '📋';
        }
    };

    return (
        <div className="page-wrapper">
            <Navigation userRole="caregiver" />

            <div className="page-container">
                <div className="tasks-header">
                    <div>
                        <h1 className="page-title">Task Management</h1>
                        <p className="page-subtitle">Assign and track patient tasks</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAssignModal(true)}
                        disabled={patients.length === 0}
                    >
                        <Plus size={20} />
                        Assign New Task
                    </button>
                </div>

                {patients.length === 0 ? (
                    <div className="empty-state">
                        <User size={48} />
                        <h3>No patients connected</h3>
                        <p>Connect with patients first to assign tasks.</p>
                    </div>
                ) : (
                    <>
                        {/* Tasks List */}
                        <div className="tasks-list-container">
                            {tasks.length === 0 ? (
                                <div className="empty-state">
                                    <CheckSquare size={48} />
                                    <h3>No tasks assigned yet</h3>
                                    <p>Click the button above to assign a task to a patient.</p>
                                </div>
                            ) : (
                                <div className="tasks-table-card card">
                                    <table className="tasks-table">
                                        <thead>
                                            <tr>
                                                <th>Task</th>
                                                <th>Patient</th>
                                                <th>Category</th>
                                                <th>Priority</th>
                                                <th>Due Date</th>
                                                <th>Points</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map((task) => (
                                                <tr key={task.id}>
                                                    <td>
                                                        <div className="task-title-cell">
                                                            <strong>{task.title}</strong>
                                                            <p className="task-description">{task.description}</p>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="patient-cell">
                                                            <User size={16} />
                                                            {task.patientName}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="category-badge">
                                                            {getCategoryIcon(task.category)} {task.category}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className="priority-badge"
                                                            style={{
                                                                backgroundColor: getPriorityColor(task.priority) + '20',
                                                                color: getPriorityColor(task.priority)
                                                            }}
                                                        >
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="date-cell">
                                                            <Calendar size={16} />
                                                            {task.dueDate.toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="points-badge">
                                                            {task.points} pts
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {task.completed ? (
                                                            <span className="status-badge completed">
                                                                ✓ Completed
                                                            </span>
                                                        ) : (
                                                            <span className="status-badge pending">
                                                                ⏳ Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Assign Task Modal */}
                {showAssignModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Assign New Task</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowAssignModal(false)}
                                    disabled={isLoading}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAssignTask} className="task-form">
                                <div className="form-group">
                                    <label htmlFor="patient">Assign To</label>
                                    <select
                                        id="patient"
                                        value={newTask.patientId}
                                        onChange={(e) => setNewTask({ ...newTask, patientId: e.target.value })}
                                        required
                                        disabled={isLoading}
                                    >
                                        {patients.map(patient => (
                                            <option key={patient.id} value={patient.id}>
                                                {patient.name} ({patient.age} years, {patient.condition})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="title">Task Title</label>
                                    <input
                                        type="text"
                                        id="title"
                                        placeholder="e.g., Morning Walk"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        placeholder="Describe the task..."
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        rows={3}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="category">Category</label>
                                        <select
                                            id="category"
                                            value={newTask.category}
                                            onChange={(e) => setNewTask({ ...newTask, category: e.target.value as TaskCategory })}
                                            required
                                            disabled={isLoading}
                                        >
                                            <option value="medication">💊 Medication</option>
                                            <option value="exercise">🏃 Exercise</option>
                                            <option value="mental">🧠 Mental</option>
                                            <option value="social">👥 Social</option>
                                            <option value="diet">🥗 Diet</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="priority">Priority</label>
                                        <select
                                            id="priority"
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                                            required
                                            disabled={isLoading}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="dueDate">Due Date</label>
                                        <input
                                            type="datetime-local"
                                            id="dueDate"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="points">Points Reward</label>
                                        <input
                                            type="number"
                                            id="points"
                                            min="10"
                                            max="500"
                                            step="10"
                                            value={newTask.points}
                                            onChange={(e) => setNewTask({ ...newTask, points: parseInt(e.target.value) })}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowAssignModal(false)}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Assigning...' : 'Assign Task'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tasks;
