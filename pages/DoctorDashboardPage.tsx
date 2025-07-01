

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Keep Link for Button component's internal use if needed
import { useAuth } from '../contexts/AuthContext';
import * as Api from '../services/api';
import { Appointment, User } from '../types';
import Button from '../components/ui/Button';
import AppointmentCard from '../components/AppointmentCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const DoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const appointments = await Api.getAppointmentsForDoctor(user.id);
      const now = new Date();
      const upcoming = appointments
        .filter(appt => new Date(appt.date) >= now && appt.status === 'booked')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5); // Show top 5 upcoming
      
      setUpcomingAppointments(upcoming);

      // Extract unique patient IDs from all appointments to show as "Recent Patients"
      const patientIds = [...new Set(appointments.map(a => a.patientId))];
      const patientsPromises = patientIds.map(id => Api.getUserById(id));
      const resolvedPatients = (await Promise.all(patientsPromises)).filter(p => p !== null) as User[];
      setRecentPatients(resolvedPatients.slice(0,3)); // Show top 3 recent patients


    } catch (error) {
      console.error("Error fetching doctor dashboard data:", error);
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
        <h1 className="text-3xl font-bold text-hnai-teal-dark">Welcome, Dr. {user?.name}!</h1>
        <p className="text-slate-600 mt-1">Manage your appointments and patient interactions.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button to="/doctor/availability" className="w-full justify-start text-left">
              Manage My Availability
            </Button>
            <Button to="/doctor/appointments" variant="secondary" className="w-full justify-start text-left">
              View All Appointments
            </Button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Recent Patients</h2>
          {recentPatients.length > 0 ? (
             <ul className="space-y-3">
              {recentPatients.map(patient => (
                <li key={patient.id} className="p-3 bg-slate-50 rounded-md flex justify-between items-center">
                  <p className="font-medium text-slate-700">{patient.name}</p>
                  <Button to={`/doctor/chat/${patient.id}`} size="sm" variant="ghost">Chat</Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No recent patients interactions.</p>
          )}
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Today's & Upcoming Appointments</h2>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-4">
            {upcomingAppointments.map(appt => (
              <AppointmentCard key={appt.id} appointment={appt} onAction={fetchDashboardData} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-slate-500">You have no upcoming appointments booked.</p>
            <Button to="/doctor/availability" className="mt-4">
              Update Your Availability
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboardPage;