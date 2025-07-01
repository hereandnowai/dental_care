
import { User, UserRole, Doctor, TimeSlot, Appointment, ChatMessage } from '../types';
import { DOCTOR_SPECIALTIES, AI_BOT_ID, AI_BOT_NAME } from '../constants';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const USERS_KEY = 'dental_app_users';
const APPOINTMENTS_KEY = 'dental_app_appointments';
const CHATS_KEY = 'dental_app_chats';
const LOGGED_IN_USER_KEY = 'dental_app_logged_in_user';

// --- Helper Functions ---
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  const storedValue = localStorage.getItem(key);
  try {
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error parsing JSON from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const generateId = (): string => Math.random().toString(36).substring(2, 15);

// --- Initialization ---
const initializeData = () => {
  let users = getFromStorage<User[]>(USERS_KEY, []);
  if (users.length === 0) {
    // Add some default doctors, making doc1 Dr. Prabhakaran
    const defaultDoctors: Doctor[] = [
      { id: 'doc1', name: 'Dr. Prabhakaran', email: 'prabhakaran@clinic.com', role: UserRole.Doctor, specialty: DOCTOR_SPECIALTIES[0], availability: [] }, 
      { id: 'doc2', name: 'Dr. Bob Johnson', email: 'bob@clinic.com', role: UserRole.Doctor, specialty: DOCTOR_SPECIALTIES[1], availability: [] },
      { id: 'doc3', name: 'Dr. Carol White', email: 'carol@clinic.com', role: UserRole.Doctor, specialty: DOCTOR_SPECIALTIES[2], availability: [] },
    ];
    // Add some initial availability for Dr. Prabhakaran for demo
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    
    const initialSlotsDoc1: TimeSlot[] = [
        { id: generateId(), doctorId: 'doc1', date: tomorrow.toISOString().split('T')[0], time: '09:00', isBooked: false },
        { id: generateId(), doctorId: 'doc1', date: tomorrow.toISOString().split('T')[0], time: '10:00', isBooked: false },
        { id: generateId(), doctorId: 'doc1', date: tomorrow.toISOString().split('T')[0], time: '11:00', isBooked: false },
        { id: generateId(), doctorId: 'doc1', date: dayAfterTomorrow.toISOString().split('T')[0], time: '14:00', isBooked: false },
        { id: generateId(), doctorId: 'doc1', date: dayAfterTomorrow.toISOString().split('T')[0], time: '15:00', isBooked: false },
    ];
    defaultDoctors[0].availability = initialSlotsDoc1; 

    users.push(...defaultDoctors);
    users.push({ id: AI_BOT_ID, name: AI_BOT_NAME, email: 'bot@dentalcare.com', role: UserRole.Bot }); // AI_BOT_NAME is "Caramel AI"
    saveToStorage(USERS_KEY, users);
  } else {
    // Ensure AI bot exists and has the correct name if data was already initialized
    const botIndex = users.findIndex(u => u.id === AI_BOT_ID);
    if (botIndex !== -1) {
        if(users[botIndex].name !== AI_BOT_NAME) {
            users[botIndex].name = AI_BOT_NAME; // Update to Caramel AI if different
            saveToStorage(USERS_KEY, users);
        }
    } else {
        users.push({ id: AI_BOT_ID, name: AI_BOT_NAME, email: 'bot@dentalcare.com', role: UserRole.Bot });
        saveToStorage(USERS_KEY, users);
    }
     // Ensure Dr. Prabhakaran exists and is correctly named if data was initialized, for consistency.
    const drPIndex = users.findIndex(u => u.id === 'doc1' && u.role === UserRole.Doctor);
    if (drPIndex !== -1) {
        if (users[drPIndex].name !== 'Dr. Prabhakaran') {
            users[drPIndex].name = 'Dr. Prabhakaran';
        }
        if (!(users[drPIndex] as Doctor).specialty) {
             (users[drPIndex] as Doctor).specialty = DOCTOR_SPECIALTIES[0]; // Ensure specialty
        }
        saveToStorage(USERS_KEY, users);
    } else { // If Dr. Prabhakaran (doc1) is missing entirely, add him.
         const drP: Doctor = { id: 'doc1', name: 'Dr. Prabhakaran', email: 'prabhakaran@clinic.com', role: UserRole.Doctor, specialty: DOCTOR_SPECIALTIES[0], availability: [] };
         // Add some initial availability for Dr. Prabhakaran for demo
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);
        drP.availability = [
            { id: generateId(), doctorId: 'doc1', date: tomorrow.toISOString().split('T')[0], time: '09:00', isBooked: false },
            { id: generateId(), doctorId: 'doc1', date: tomorrow.toISOString().split('T')[0], time: '10:00', isBooked: false },
        ];
        users.push(drP);
        saveToStorage(USERS_KEY, users);
    }
  }
  getFromStorage<Appointment[]>(APPOINTMENTS_KEY, []);
  getFromStorage<Record<string, ChatMessage[]>>(CHATS_KEY, {});
};

initializeData();


// --- User Management ---
export const signupUser = async (name: string, email: string, password_DO_NOT_USE: string, role: UserRole, specialty?: string): Promise<User | null> => {
  await new Promise(res => setTimeout(res, 500)); 
  let users = getFromStorage<User[]>(USERS_KEY, []);
  if (users.find(u => u.email === email)) {
    throw new Error('User with this email already exists.');
  }
  const newUserBase: User = { id: generateId(), name, email, role, password: password_DO_NOT_USE };
  
  let finalUser: User;
  if (role === UserRole.Doctor) {
    const doctorUser: Doctor = {
        ...newUserBase,
        role: UserRole.Doctor, 
        specialty: specialty || DOCTOR_SPECIALTIES[0],
        availability: []
    };
    finalUser = doctorUser;
  } else {
    finalUser = newUserBase;
  }

  users.push(finalUser);
  saveToStorage(USERS_KEY, users);
  saveToStorage(LOGGED_IN_USER_KEY, finalUser); 
  return finalUser;
};

export const loginUser = async (email: string, password_DO_NOT_USE: string): Promise<User | null> => {
  await new Promise(res => setTimeout(res, 500));
  const users = getFromStorage<User[]>(USERS_KEY, []);
  const user = users.find(u => u.email === email && 'password' in u && u.password === password_DO_NOT_USE); 
  if (user) {
    saveToStorage(LOGGED_IN_USER_KEY, user);
    return user;
  }
  return null;
};

export const logoutUser = async (): Promise<void> => {
  await new Promise(res => setTimeout(res, 200));
  localStorage.removeItem(LOGGED_IN_USER_KEY);
};

export const getCurrentUser = async (): Promise<User | null> => {
  await new Promise(res => setTimeout(res, 100)); 
  return getFromStorage<User | null>(LOGGED_IN_USER_KEY, null);
};

export const getUserById = async (userId: string): Promise<User | null> => {
  await new Promise(res => setTimeout(res, 100));
  const users = getFromStorage<User[]>(USERS_KEY, []);
  return users.find(u => u.id === userId) || null;
};

export const getAllDoctors = async (): Promise<Doctor[]> => {
  await new Promise(res => setTimeout(res, 300));
  const users = getFromStorage<User[]>(USERS_KEY, []);
  return users.filter(u => u.role === UserRole.Doctor) as Doctor[];
};


// --- Doctor Availability ---
export const getDoctorAvailability = async (doctorId: string): Promise<TimeSlot[]> => {
  await new Promise(res => setTimeout(res, 200));
  const users = getFromStorage<User[]>(USERS_KEY, []);
  const doctor = users.find(u => u.id === doctorId && u.role === UserRole.Doctor) as Doctor | undefined;
  return doctor ? doctor.availability : [];
};

export const addDoctorAvailability = async (doctorId: string, date: string, time: string): Promise<TimeSlot> => {
  await new Promise(res => setTimeout(res, 200));
  const users = getFromStorage<User[]>(USERS_KEY, []);
  const doctorIndex = users.findIndex(u => u.id === doctorId && u.role === UserRole.Doctor);
  if (doctorIndex === -1) throw new Error('Doctor not found.');
  
  const doctor = users[doctorIndex] as Doctor; 
  if (!doctor.availability) doctor.availability = []; 
  const newSlot: TimeSlot = { id: generateId(), doctorId, date, time, isBooked: false };
  doctor.availability.push(newSlot);
  saveToStorage(USERS_KEY, users);
  return newSlot;
};

export const removeDoctorAvailability = async (doctorId: string, slotId: string): Promise<void> => {
  await new Promise(res => setTimeout(res, 200));
  const users = getFromStorage<User[]>(USERS_KEY, []);
  const doctorIndex = users.findIndex(u => u.id === doctorId && u.role === UserRole.Doctor);
  if (doctorIndex === -1) throw new Error('Doctor not found.');

  const doctor = users[doctorIndex] as Doctor; 
  if (doctor.availability) {
    doctor.availability = doctor.availability.filter(slot => slot.id !== slotId);
  }
  saveToStorage(USERS_KEY, users);
};


// --- Appointments ---
export const bookAppointment = async (patientId: string, patientName: string, doctorId: string, doctorName: string, date: string, time: string, comments?: string): Promise<Appointment> => {
  await new Promise(res => setTimeout(res, 500));
  const appointments = getFromStorage<Appointment[]>(APPOINTMENTS_KEY, []);
  const users = getFromStorage<User[]>(USERS_KEY, []);

  const doctorIndex = users.findIndex(u => u.id === doctorId && u.role === UserRole.Doctor);
  if (doctorIndex === -1) throw new Error('Doctor not found.');
  const doctor = users[doctorIndex] as Doctor;

  if (!doctor.availability) throw new Error('Doctor has no availability setup.');
  
  const slotIndex = doctor.availability.findIndex(s => s.date === date && s.time === time);
  if (slotIndex === -1) throw new Error('Slot not found.');
  if (doctor.availability[slotIndex].isBooked) throw new Error('Slot already booked.');

  doctor.availability[slotIndex].isBooked = true;
  doctor.availability[slotIndex].patientId = patientId;
  saveToStorage(USERS_KEY, users); 

  const newAppointment: Appointment = { 
    id: generateId(), 
    patientId, 
    patientName,
    doctorId, 
    doctorName,
    date, 
    time, 
    status: 'booked',
    comments: comments // Store comments
  };
  appointments.push(newAppointment);
  saveToStorage(APPOINTMENTS_KEY, appointments);
  return newAppointment;
};

export const getAppointmentsForPatient = async (patientId: string): Promise<Appointment[]> => {
  await new Promise(res => setTimeout(res, 300));
  const appointments = getFromStorage<Appointment[]>(APPOINTMENTS_KEY, []);
  return appointments.filter(a => a.patientId === patientId);
};

export const getAppointmentsForDoctor = async (doctorId: string): Promise<Appointment[]> => {
  await new Promise(res => setTimeout(res, 300));
  const appointments = getFromStorage<Appointment[]>(APPOINTMENTS_KEY, []);
  return appointments.filter(a => a.doctorId === doctorId);
};

export const updateAppointmentStatus = async (appointmentId: string, status: Appointment['status']): Promise<Appointment | null> => {
  await new Promise(res => setTimeout(res, 300));
  const appointments = getFromStorage<Appointment[]>(APPOINTMENTS_KEY, []);
  const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);
  if (appointmentIndex === -1) return null;

  appointments[appointmentIndex].status = status;

  if (status === 'cancelled') {
    const appt = appointments[appointmentIndex];
    const users = getFromStorage<User[]>(USERS_KEY, []);
    const doctorIndex = users.findIndex(u => u.id === appt.doctorId && u.role === UserRole.Doctor);
    if (doctorIndex !== -1) {
      const doctor = users[doctorIndex] as Doctor;
      if (doctor.availability) {
        const slotIndex = doctor.availability.findIndex(s => s.date === appt.date && s.time === appt.time && s.patientId === appt.patientId);
        if (slotIndex !== -1) {
          doctor.availability[slotIndex].isBooked = false;
          delete doctor.availability[slotIndex].patientId; 
          saveToStorage(USERS_KEY, users);
        }
      }
    }
  }

  saveToStorage(APPOINTMENTS_KEY, appointments);
  return appointments[appointmentIndex];
};


// --- Chat ---
export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  await new Promise(res => setTimeout(res, 100));
  const chats = getFromStorage<Record<string, ChatMessage[]>>(CHATS_KEY, {});
  return chats[chatId] || [];
};

export const sendChatMessage = async (chatId: string, senderId: string, receiverId: string, text: string): Promise<ChatMessage> => {
  await new Promise(res => setTimeout(res, 100));
  const chats = getFromStorage<Record<string, ChatMessage[]>>(CHATS_KEY, {});
  if (!chats[chatId]) {
    chats[chatId] = [];
  }
  const newMessage: ChatMessage = {
    id: generateId(),
    chatId,
    senderId,
    receiverId,
    text,
    timestamp: Date.now(),
  };
  chats[chatId].push(newMessage);
  saveToStorage(CHATS_KEY, chats);
  return newMessage;
};

// --- AI Bot (Gemini) ---
export const getAIResponseFromBot = async (patientMessage: string, patientId: string): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY environment variable is not set.");
        return "I'm sorry, my AI services are currently unavailable due to a configuration issue.";
    }
    const ai = new GoogleGenAI({ apiKey });

    const doctors = await getAllDoctors();
    let availableSlotsContext = "Current available doctors and their upcoming unbooked slots (max 3 per doctor shown):\n";
    
    const drPrabhakaran = doctors.find(doc => doc.id === 'doc1');

    if (drPrabhakaran) {
        const slots = await getDoctorAvailability(drPrabhakaran.id);
        const now = new Date();
        const futureUnbookedSlots = slots
            .filter(slot => {
              const slotDateTime = new Date(`${slot.date}T${slot.time}`);
              return !slot.isBooked && slotDateTime > now;
            })
            .sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
            .slice(0, 5); // Show more slots for Dr. P

        if (futureUnbookedSlots.length > 0) {
            availableSlotsContext += `Dr. ${drPrabhakaran.name} (${drPrabhakaran.specialty}):\n`;
            futureUnbookedSlots.forEach(slot => {
              availableSlotsContext += `- ${new Date(slot.date).toLocaleDateString()} at ${slot.time}\n`;
            });
        } else {
            availableSlotsContext += `Dr. ${drPrabhakaran.name} (${drPrabhakaran.specialty}) has no upcoming unbooked slots at the moment.\n`;
        }
    } else {
        availableSlotsContext += "Dr. Prabhakaran's information is currently unavailable.\n";
    }
    
    // Optionally add info about other doctors if the new requirements don't strictly limit to Dr. P for AI context
    let otherDoctorsFoundSlots = false;
    for (const doctor of doctors) {
        if (doctor.id === 'doc1') continue; // Skip Dr. P as he's handled above
        const slots = await getDoctorAvailability(doctor.id);
        const now = new Date();
        const futureUnbookedSlots = slots
            .filter(slot => !slot.isBooked && new Date(`${slot.date}T${slot.time}`) > now)
            .sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
            .slice(0, 2); 

        if (futureUnbookedSlots.length > 0) {
            if (!otherDoctorsFoundSlots) availableSlotsContext += "\nOther available doctors:\n";
            otherDoctorsFoundSlots = true;
            availableSlotsContext += `Dr. ${doctor.name} (${doctor.specialty}):\n`;
            futureUnbookedSlots.forEach(slot => {
              availableSlotsContext += `- ${new Date(slot.date).toLocaleDateString()} at ${slot.time}\n`;
            });
        }
    }

    if (!drPrabhakaran && !otherDoctorsFoundSlots) {
         availableSlotsContext = "No upcoming unbooked slots found for any doctors. Please check back later or ask for general information.\n";
    }
    

    const contents = `${availableSlotsContext}\nPatient question: "${patientMessage}"`;
    const systemInstruction = `You are a friendly and helpful AI assistant for Dental Care Connect. Your name is ${AI_BOT_NAME}. 
Dr. Prabhakaran is our primary and highly recommended dentist.
Your goal is to help patients (current patient ID: ${patientId}) find information about our dental services, doctors, and help them identify suitable appointment slots based *only* on the list of available slots provided above.
When suggesting doctors or slots, if Dr. Prabhakaran has availability, please prioritize mentioning him and his slots.
If a patient asks about a specific doctor who has no slots, you can say something like, "Dr. [Doctor's Name] has no open slots at the moment. However, Dr. Prabhakaran may have availability, would you like to check?" or suggest another doctor if their slots are listed.
Do not suggest booking if no slots are listed for a doctor or if the list is empty. Instead, inform the patient that no slots are currently available or to check again later. Always emphasize checking for Dr. Prabhakaran if his slots are not immediately listed but he exists in the system.
If the patient asks to book an appointment, guide them to use the "Book New Appointment" feature in the app. You cannot book appointments directly.
Keep your responses concise, helpful, and polite. Do not make up information, services, or appointment slots not explicitly listed.
If asked about topics outside of dental care or appointment booking for this clinic, politely state that you can only assist with Dental Care Connect related queries.
Example common questions:
- "When’s Dr. Prabhakaran available?": Check the provided slots for Dr. Prabhakaran.
- "How much is consultation?": "Consultation fees can vary. For specific pricing, please contact our clinic directly or check the details when booking an appointment." (General answer as pricing is not in context).
- "Are you open on Saturdays?": "Our clinic's opening hours can be found on our main website or by contacting us. I can only provide information about available appointment slots listed above."
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    let errorMessage = "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
    if (error instanceof Error) {
        // You might want to check for specific error messages from Gemini API if needed
    }
    return errorMessage;
  }
};