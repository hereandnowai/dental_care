export enum UserRole {
  Patient = 'PATIENT',
  Doctor = 'DOCTOR',
  Bot = 'BOT',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string; // Only for signup, not stored directly with user object in frontend state after login
}

export interface Doctor extends User {
  specialty: string;
  availability: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (start time of 1-hour slot)
  isBooked: boolean;
  patientId?: string; 
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'booked' | 'cancelled' | 'completed';
  comments?: string; // Added field for appointment comments
}

export interface ChatMessage {
  id: string;
  chatId: string; // e.g., patientId_doctorId
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number; // Unix timestamp
  appointmentId?: string; // Optional: Link chat to a specific appointment
}