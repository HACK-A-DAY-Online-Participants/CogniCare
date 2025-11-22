import React, { useState, useEffect } from 'react';
import Navigation from '../../components/common/Navigation';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isPatientUser } from '../../types/user';
import type { Task } from '../../types/task';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './Tasks.css';

const Tasks: React.FC = () => {
    const { currentUser } = useAuth();
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [points, setPoints] = useState(0);

    useEffect(() => {
        loadTasks();
    }, [currentUser]);

    const loadTasks = async () => {
        if (!currentUser || !isPatientUser(currentUser)) return;

        try {
            // Load tasks assigned to this patient
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('patientId', '==', currentUser.id)
            );

            const tasksSnapshot = await getDocs(tasksQuery);
            const tasksData: Task[] = [];

            tasksSnapshot.forEach((doc) => {
                const data = doc.data();
                tasksData.push({
                    id: doc.id,
                    ...data,
                    dueDate: data.dueDate?.toDate() || new Date(),
                    completedAt: data.completedAt?.toDate(),
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date()
                } as Task);
            });

            // Sort by due date
            tasksData.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
            setTasks(tasksData);

            // Calculate total points from completed tasks
            const totalPoints = tasksData
                .filter(t => t.completed)
                .reduce((acc, t) => acc + t.points, 0);
            setPoints(totalPoints);

        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };


    const toggleTask = async (taskId: string) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task || !currentUser) return;

            const taskRef = doc(db, 'tasks', taskId);
            const newCompletedStatus = !task.completed;

            await updateDoc(taskRef, {
                completed: newCompletedStatus,
                completedAt: newCompletedStatus ? serverTimestamp() : null,
                updatedAt: serverTimestamp()
            });

            // Log activity for AI analysis
            if (newCompletedStatus && isPatientUser(currentUser)) {
                const { aiService } = await import('../../services/aiService');
                await aiService.logActivity(currentUser.id, 'task_completed', {
                    taskId: task.id,
                    points: task.points,
                    category: task.category,
                    onTime: new Date() <= task.dueDate
                });
            }

            // Update local state
            setTasks(tasks.map(t =>
                t.id === taskId
                    ? { ...t, completed: newCompletedStatus, completedAt: newCompletedStatus ? new Date() : undefined }
                    : t
            ));

            // Update points
            if (newCompletedStatus) {
                setPoints(points + task.points);
            } else {
                setPoints(points - task.points);
            }

        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'pending') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getCategoryIcon = (category: string) => {
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
            <Navigation userRole="patient" />

            <div className="page-container">
                <div className="tasks-header">
                    <div>
                        <h1 className="page-title">My Tasks</h1>
                        <p className="page-subtitle">Keep up the great work! You've earned {points} points.</p>
                    </div>

                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Tasks
                        </button>
                        <button
                            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            Pending
                        </button>
                        <button
                            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
                            onClick={() => setFilter('completed')}
                        >
                            Completed
                        </button>
                    </div>
                </div>

                <div className="tasks-list">
                    {filteredTasks.length === 0 ? (
                        <div className="empty-state">
                            <CheckCircle size={48} />
                            <h3>No tasks found</h3>
                            <p>
                                {filter === 'all' && "Your caregiver hasn't assigned any tasks yet."}
                                {filter === 'pending' && "You're all caught up!"}
                                {filter === 'completed' && "No completed tasks yet. Start completing tasks to earn points!"}
                            </p>
                        </div>
                    ) : (
                        filteredTasks.map((task) => (
                            <div key={task.id} className={`task-card card ${task.completed ? 'completed' : ''}`}>
                                <button
                                    className={`status-toggle ${task.completed ? 'checked' : ''}`}
                                    onClick={() => toggleTask(task.id)}
                                >
                                    {task.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                                </button>

                                <div className="task-content">
                                    <div className="task-header-row">
                                        <span className="task-category">
                                            {getCategoryIcon(task.category)} {task.category}
                                        </span>
                                        <span
                                            className="task-priority"
                                            style={{ color: getPriorityColor(task.priority) }}
                                        >
                                            <AlertCircle size={14} />
                                            {task.priority} Priority
                                        </span>
                                    </div>

                                    <h3 className="task-title">{task.title}</h3>
                                    <p className="task-description">{task.description}</p>

                                    <div className="task-footer">
                                        <div className="task-meta">
                                            <Clock size={16} />
                                            <span>
                                                Due: {task.dueDate.toLocaleDateString()} at {task.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <span className="task-points">+{task.points} pts</span>
                                    </div>

                                    {task.completed && task.completedAt && (
                                        <div className="completed-badge">
                                            ✓ Completed on {task.completedAt.toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tasks;
