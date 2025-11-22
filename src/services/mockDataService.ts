import { v4 as uuidv4 } from 'uuid';

// ------------------- Types -------------------

export type UserRole = 'patient' | 'caregiver';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Patient extends User {
  caregiverId?: string;
  age: number;
  condition: string;
  cognitiveScore: number;
  lastVisit: string;
  status?: 'active' | 'inactive' | 'needs-attention';
}

export interface Caregiver extends User { }

export interface ConnectionRequest {
  id: string;
  caregiverId: string;
  caregiverName: string;
  patientId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  patientId: string;
  category: 'medication' | 'exercise' | 'mental' | 'social' | 'diet';
  priority: 'low' | 'medium' | 'high';
  points: number;
  dueDate: string;
  completed: boolean;
  assignedBy: string;
}

// ------------------ DataService ------------------

export class DataService {
  private patients: Patient[] = [];
  private caregivers: Caregiver[] = [];
  private connectionRequests: ConnectionRequest[] = [];
  private tasks: Task[] = [];

  constructor() {
    this.loadAll();
  }

  // ------------ Local Storage Helpers ----------------

  private loadAll() {
    const savedPatients = localStorage.getItem('patients');
    const savedCaregivers = localStorage.getItem('caregivers');
    const savedRequests = localStorage.getItem('connectionRequests');
    const savedTasks = localStorage.getItem('tasks');

    this.patients = savedPatients ? JSON.parse(savedPatients) : [];
    this.caregivers = savedCaregivers ? JSON.parse(savedCaregivers) : [];
    this.connectionRequests = savedRequests ? JSON.parse(savedRequests) : [];
    this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
  }

  private savePatients() {
    localStorage.setItem('patients', JSON.stringify(this.patients));
  }

  private saveCaregivers() {
    localStorage.setItem('caregivers', JSON.stringify(this.caregivers));
  }

  private saveRequests() {
    localStorage.setItem('connectionRequests', JSON.stringify(this.connectionRequests));
  }

  private saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  // ------------ USERS ----------------

  addPatient(patient: Patient): Patient {
    this.patients.push(patient);
    this.savePatients();
    return patient;
  }

  addCaregiver(caregiver: Caregiver): Caregiver {
    this.caregivers.push(caregiver);
    this.saveCaregivers();
    return caregiver;
  }

  getPatients() {
    return this.patients;
  }

  getCaregivers() {
    return this.caregivers;
  }

  getPendingRequestsForPatient(patientId: string) {
    return this.connectionRequests.filter((r) => r.patientId === patientId && r.status === 'pending');
  }

  getPendingRequestsForCaregiver(caregiverId: string) {
    return this.connectionRequests.filter((r) => r.caregiverId === caregiverId && r.status === 'pending');
  }

  // ------------ Connection by Code ----------------

  sendConnectionRequest(
    caregiverId: string,
    caregiverName: string,
    connectionCode: string
  ): { success: boolean; message: string } {
    const patient = this.patients.find((p) => p.id === connectionCode);

    if (!patient) {
      return { success: false, message: 'Invalid connection code.' };
    }

    if (patient.caregiverId === caregiverId) {
      return { success: false, message: 'You are already connected.' };
    }

    const existingRequest = this.connectionRequests.find(
      (r) => r.caregiverId === caregiverId && r.patientId === patient.id && r.status === 'pending'
    );

    if (existingRequest) {
      return { success: false, message: 'Request already pending.' };
    }

    const newRequest: ConnectionRequest = {
      id: uuidv4(),
      caregiverId,
      caregiverName,
      patientId: patient.id,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    this.connectionRequests.push(newRequest);
    this.saveRequests();

    return { success: true, message: 'Connection request sent successfully.' };
  }

  // ------------ Connection by Email ----------------

  findPatientByEmail(email: string): Patient | undefined {
    return this.patients.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }

  sendConnectionRequestByEmail(
    caregiverId: string,
    caregiverName: string,
    patientEmail: string
  ): { success: boolean; message: string } {
    const patient = this.findPatientByEmail(patientEmail);

    if (!patient) {
      return { success: false, message: 'No patient found with that email.' };
    }

    if (patient.caregiverId === caregiverId) {
      return { success: false, message: 'You are already connected to this patient.' };
    }

    const existingRequest = this.connectionRequests.find(
      (r) => r.caregiverId === caregiverId && r.patientId === patient.id && r.status === 'pending'
    );

    if (existingRequest) {
      return { success: false, message: 'A request is already pending.' };
    }

    const newRequest: ConnectionRequest = {
      id: uuidv4(),
      caregiverId,
      caregiverName,
      patientId: patient.id,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    this.connectionRequests.push(newRequest);
    this.saveRequests();

    return { success: true, message: `Request sent to ${patient.name}.` };
  }

  // ------------ Accept / Reject Requests ----------------

  updateRequestStatus(requestId: string, status: 'accepted' | 'rejected') {
    const request = this.connectionRequests.find((r) => r.id === requestId);

    if (request) {
      request.status = status;
      this.saveRequests();

      if (status === 'accepted') {
        const patient = this.patients.find((p) => p.id === request.patientId);
        if (patient) {
          patient.caregiverId = request.caregiverId;
          this.savePatients();
        }
      }
    }
  }

  // ------------ TASKS ----------------

  assignTask(taskData: Omit<Task, 'id'>): Task {
    const newTask: Task = {
      id: uuidv4(),
      ...taskData
    };
    this.tasks.push(newTask);
    this.saveTasks();
    return newTask;
  }

  getTasksForPatient(patientId: string): Task[] {
    return this.tasks.filter(t => t.patientId === patientId);
  }

  completeTask(taskId: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = true;
      this.saveTasks();
    }
  }

  toggleTaskCompletion(taskId: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
    }
  }

  // ------------ HELPER METHODS ----------------

  getPatientsForCaregiver(caregiverId: string): Patient[] {
    return this.patients.filter(p => p.caregiverId === caregiverId);
  }

  getPatientDashboardStats(patientId: string) {
    const tasks = this.getTasksForPatient(patientId);
    const completedTasks = tasks.filter(t => t.completed);
    const totalPoints = completedTasks.reduce((sum, t) => sum + t.points, 0);
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    return {
      points: totalPoints,
      totalPoints: totalPoints,
      level: Math.floor(totalPoints / 500) + 1,
      streak: 3, // Mock value
      completionRate
    };
  }

  getPendingRequests(patientId: string): ConnectionRequest[] {
    return this.getPendingRequestsForPatient(patientId);
  }

  respondToRequest(requestId: string, accept: boolean) {
    this.updateRequestStatus(requestId, accept ? 'accepted' : 'rejected');
  }

  getCaregiverDashboardStats(caregiverId: string) {
    const patients = this.getPatientsForCaregiver(caregiverId);
    const allTasks = patients.flatMap(p => this.getTasksForPatient(p.id));
    const completedTasks = allTasks.filter(t => t.completed);
    const activeTasks = allTasks.filter(t => !t.completed);

    const avgCognitiveScore = patients.length > 0
      ? Math.round(patients.reduce((sum, p) => sum + p.cognitiveScore, 0) / patients.length)
      : 0;

    const completionRate = allTasks.length > 0
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0;

    return {
      totalPatients: patients.length,
      activeTasks: activeTasks.length,
      completionRate,
      avgCognitiveScore
    };
  }

  getRecentActivities(caregiverId: string) {
    // Mock recent activities - in a real app, this would fetch from a database
    const patients = this.getPatientsForCaregiver(caregiverId);
    const activities: any[] = [];

    // Get recent completed tasks
    patients.forEach(patient => {
      const tasks = this.getTasksForPatient(patient.id);
      const completedTasks = tasks.filter(t => t.completed).slice(0, 2);

      completedTasks.forEach(task => {
        activities.push({
          id: uuidv4(),
          type: 'task',
          title: `${patient.name} completed "${task.title}"`,
          score: task.points,
          timestamp: new Date().toISOString()
        });
      });
    });

    return activities.slice(0, 5); // Return latest 5 activities
  }

  getPatientActivities(patientId: string) {
    // Mock patient activities - would fetch from database in real app
    const tasks = this.getTasksForPatient(patientId);
    const completedTasks = tasks.filter(t => t.completed);

    return completedTasks.map(task => ({
      id: task.id,
      type: 'task',
      title: `Completed "${task.title}"`,
      score: task.points,
      timestamp: new Date().toISOString()
    }));
  }

  saveGameResult(patientId: string, score: number, gameName: string) {
    // Mock saving game result - would save to database in real app
    console.log(`Game result saved: Patient ${patientId} scored ${score} in ${gameName}`);
    // In a real app, this would save to a gameResults collection
  }
}

// Export a singleton instance
export const dataService = new DataService();
