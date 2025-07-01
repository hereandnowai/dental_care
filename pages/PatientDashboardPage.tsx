
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as Api from '../services/api';
import { Appointment, Doctor } from '../types';
import Button from '../components/ui/Button';
import AppointmentCard from '../components/AppointmentCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { AI_BOT_ID, AI_BOT_NAME } from '../constants'; // Import AI_BOT_ID and AI_BOT_NAME

const PatientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentDoctors, setRecentDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [appointments] = await Promise.all([
        Api.getAppointmentsForPatient(user.id),
      ]);
      const now = new Date();
      const upcoming = appointments
        .filter(appt => new Date(appt.date) >= now && appt.status === 'booked')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3); 
      
      setUpcomingAppointments(upcoming);

      const doctorIds = [...new Set(appointments.map(a => a.doctorId))];
      const doctorsPromises = doctorIds.map(id => Api.getUserById(id) as Promise<Doctor | null>);
      const resolvedDoctors = (await Promise.all(doctorsPromises)).filter(d => d !== null) as Doctor[];
      setRecentDoctors(resolvedDoctors.slice(0,3));

    } catch (error) {
      console.error("Error fetching patient dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner color="text-hnai-teal-dark" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-hnai-teal-dark">Welcome, {user?.name}!</h1>
        <p className="text-slate-600 mt-1">Manage your dental health with ease.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button to="/patient/book-appointment" className="w-full justify-start text-left">
              Book New Appointment
            </Button>
            <Button to="/patient/appointments" variant="secondary" className="w-full justify-start text-left">
              View All My Appointments
            </Button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Your Doctors</h2>
          {recentDoctors.length > 0 ? (
            <ul className="space-y-3">
              {recentDoctors.map(doc => (
                <li key={doc.id} className="p-3 bg-slate-50 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-700">Dr. {doc.name}</p>
                    <p className="text-sm text-slate-500">{doc.specialty}</p>
                  </div>
                  <Button to={`/patient/chat/${doc.id}`} size="sm" variant="ghost">Chat</Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No recent doctors. Book an appointment to connect!</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow md:col-span-2 lg:col-span-1">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">{AI_BOT_NAME}</h2>
          <p className="text-slate-600 mb-3">Have questions or need help finding a slot? Chat with our AI assistant.</p>
          <Button to={`/patient/chat/${AI_BOT_ID}`} className="w-full">
            Chat with {AI_BOT_NAME}
          </Button>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Upcoming Appointments</h2>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-4">
            {upcomingAppointments.map(appt => (
              <AppointmentCard key={appt.id} appointment={appt} onAction={fetchDashboardData} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-slate-500">You have no upcoming appointments.</p>
            <Button to="/patient/book-appointment" className="mt-4">
              Book One Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboardPage;