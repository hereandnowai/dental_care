
import React from 'react';
import { Appointment, UserRole } from '../types';
import Button from './ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as Api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface AppointmentCardProps {
  appointment: Appointment;
  onAction?: () => void; // Callback for when an action (cancel, complete) is taken
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onAction }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const handleChat = () => {
    const contactId = user?.role === UserRole.Patient ? appointment.doctorId : appointment.patientId;
    if (contactId) {
      navigate(`/${user?.role.toLowerCase()}/chat/${contactId}`);
    }
  };
  
  const handleCancelAppointment = async () => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await Api.updateAppointmentStatus(appointment.id, 'cancelled');
        addNotification('Appointment cancelled successfully.', 'success');
        onAction?.();
      } catch (error) {
        addNotification('Failed to cancel appointment.', 'error');
      }
    }
  };

  const handleCompleteAppointment = async () => {
     if (window.confirm('Mark this appointment as completed?')) {
      try {
        await Api.updateAppointmentStatus(appointment.id, 'completed');
        addNotification('Appointment marked as completed.', 'success');
        onAction?.();
      } catch (error) {
        addNotification('Failed to mark appointment as completed.', 'error');
      }
    }
  };


  const cardColor = appointment.status === 'cancelled' ? 'bg-red-50' : appointment.status === 'completed' ? 'bg-green-50' : 'bg-white';

  return (
    <div className={`p-4 rounded-lg shadow-md border ${cardColor} border-slate-200`}>
      <h3 className="text-lg font-semibold text-hnai-teal-dark mb-1">
        Appointment on {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
      </h3>
      {user?.role === UserRole.Patient && <p className="text-sm text-slate-600">With: Dr. {appointment.doctorName}</p>}
      {user?.role === UserRole.Doctor && <p className="text-sm text-slate-600">With: {appointment.patientName}</p>}
      <p className="text-sm text-slate-500 mt-1">Status: <span className={`font-medium ${
        appointment.status === 'booked' ? 'text-blue-600' : // Or use a HNAI color if desired
        appointment.status === 'cancelled' ? 'text-red-600' :
        'text-green-600' // Or use a HNAI color if desired for completed
      }`}>{appointment.status.toUpperCase()}</span></p>
      
      {appointment.comments && (
        <div className="mt-2 pt-2 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-700">Comments:</p>
          <p className="text-sm text-slate-600 italic whitespace-pre-wrap">{appointment.comments}</p>
        </div>
      )}
      
      <div className="mt-4 flex flex-wrap gap-2">
        {appointment.status === 'booked' && (
          <Button onClick={handleChat} variant="ghost" size="sm">
            Chat {user?.role === UserRole.Patient ? "with Doctor" : "with Patient"}
          </Button>
        )}
        {appointment.status === 'booked' && (
          <Button onClick={handleCancelAppointment} variant="danger" size="sm">
            Cancel 
          </Button>
        )}
        {user?.role === UserRole.Doctor && appointment.status === 'booked' && (
          <Button onClick={handleCompleteAppointment} variant="primary" size="sm">
            Mark as Completed
          </Button>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;