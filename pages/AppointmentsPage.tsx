
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as Api from '../services/api';
import { Appointment, UserRole } from '../types';
import AppointmentCard from '../components/AppointmentCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('upcoming');

  const fetchAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedAppointments = user.role === UserRole.Patient
        ? await Api.getAppointmentsForPatient(user.id)
        : await Api.getAppointmentsForDoctor(user.id);
      
      // Sort by date, most recent first for past, earliest first for upcoming
      fetchedAppointments.sort((a,b) => {
        const dateA = new Date(`${a.date}T${a.time}`).getTime();
        const dateB = new Date(`${b.date}T${b.time}`).getTime();
        return filter === 'past' ? dateB - dateA : dateA - dateB;
      });
      setAppointments(fetchedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);


  const filteredAppointments = appointments.filter(appt => {
    const apptDate = new Date(`${appt.date}T${appt.time}`);
    const now = new Date();
    if (filter === 'upcoming') return apptDate >= now && appt.status === 'booked';
    if (filter === 'past') return apptDate < now || appt.status === 'completed';
    if (filter === 'cancelled') return appt.status === 'cancelled';
    return true; // 'all'
  });

  if (loading && appointments.length === 0) { // Show spinner only on initial load
    return <div className="flex justify-center items-center h-64"><LoadingSpinner color="text-hnai-teal-dark"/></div>;
  }

  const FilterButton: React.FC<{ value: typeof filter, label: string }> = ({ value, label }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
        ${filter === value ? 'bg-hnai-teal-dark text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-hnai-teal-dark">My Appointments</h1>
      
      <div className="flex space-x-2 mb-6 p-3 bg-white rounded-lg shadow-sm">
        <FilterButton value="upcoming" label="Upcoming" />
        <FilterButton value="past" label="Past & Completed" />
        <FilterButton value="cancelled" label="Cancelled" />
        <FilterButton value="all" label="All" />
      </div>

      {loading && <div className="text-center text-slate-500">Refreshing...</div>}
      
      {!loading && filteredAppointments.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-slate-500 text-xl">No appointments found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map(appt => (
            <AppointmentCard key={appt.id} appointment={appt} onAction={fetchAppointments} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;