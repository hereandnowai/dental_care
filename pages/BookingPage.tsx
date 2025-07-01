

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as Api from '../services/api';
import { Doctor, TimeSlot } from '../types';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select'; 
import Input from '../components/ui/Input'; // Added for comments
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const DR_PRABHAKARAN_ID = 'doc1'; // Define Dr. Prabhakaran's ID

const BookingPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [appointmentComments, setAppointmentComments] = useState<string>('');
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const fetchedDoctors = await Api.getAllDoctors();
        setDoctors(fetchedDoctors);
        const drP = fetchedDoctors.find(doc => doc.id === DR_PRABHAKARAN_ID);
        if (drP) {
          setSelectedDoctorId(drP.id); // Pre-select Dr. Prabhakaran
          setSelectedDoctor(drP);
        } else if (fetchedDoctors.length > 0) {
          // setSelectedDoctorId(fetchedDoctors[0].id); // Fallback: select first doctor if Dr. P not found
          // setSelectedDoctor(fetchedDoctors[0]);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
        addNotification('Failed to load doctors.', 'error');
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [addNotification]);

  useEffect(() => {
    if (selectedDoctorId) {
      const currentDoctor = doctors.find(doc => doc.id === selectedDoctorId);
      setSelectedDoctor(currentDoctor || null);

      const fetchSlots = async () => {
        setLoadingSlots(true);
        setAvailableSlots([]); 
        try {
          const slots = await Api.getDoctorAvailability(selectedDoctorId);
          const now = new Date();
          const futureSlots = slots.filter(slot => {
            const slotDateTime = new Date(`${slot.date}T${slot.time}`);
            return !slot.isBooked && slotDateTime > now;
          }).sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
          setAvailableSlots(futureSlots);

        } catch (error) {
          console.error("Error fetching availability:", error);
          addNotification('Failed to load availability for this doctor.', 'error');
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
      setSelectedDoctor(null);
    }
  }, [selectedDoctorId, doctors, addNotification]);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !user || !selectedDoctorId || !selectedDoctor) return;
    setBookingInProgress(true);
    try {
      await Api.bookAppointment(user.id, user.name, selectedDoctorId, selectedDoctor.name, selectedSlot.date, selectedSlot.time, appointmentComments);
      addNotification('Appointment booked successfully!', 'success');
      setIsConfirmModalOpen(false);
      setSelectedSlot(null);
      setAppointmentComments(''); // Clear comments
      
      if (selectedDoctorId) {
        const slots = await Api.getDoctorAvailability(selectedDoctorId);
        const now = new Date();
        const futureSlots = slots.filter(slot => !slot.isBooked && new Date(`${slot.date}T${slot.time}`) > now)
                                .sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
        setAvailableSlots(futureSlots);
      }
      navigate('/patient/appointments');
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      addNotification(error.message || 'Failed to book appointment. The slot might have been taken.', 'error');
    } finally {
      setBookingInProgress(false);
    }
  };
  
  const doctorOptions = doctors.map(doc => ({ value: doc.id, label: `Dr. ${doc.name} - ${doc.specialty}` }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-hnai-teal-dark">Book an Appointment</h1>
      
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <Select
            label="Choose a Doctor"
            id="doctor"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            options={doctorOptions}
            disabled={loadingDoctors || doctors.length === 0}
            placeholder={loadingDoctors ? "Loading doctors..." : (doctors.length === 0 ? "No doctors available" : "Select a doctor")}
          />
        </div>

        {selectedDoctor && (
          <div className="p-3 bg-hnai-teal-dark/10 rounded-md border border-hnai-teal-dark/30">
            <h3 className="text-lg font-semibold text-hnai-teal-dark">Dr. {selectedDoctor.name}</h3>
            <p className="text-sm text-hnai-teal-focus">{selectedDoctor.specialty}</p>
          </div>
        )}

        {loadingSlots && <div className="flex justify-center py-4"><LoadingSpinner color="text-hnai-teal-dark" /> <span className="ml-2 text-slate-500">Finding available slots...</span></div>}
        
        {!loadingSlots && selectedDoctorId && availableSlots.length === 0 && (
          <p className="text-slate-500 text-center py-4">No available slots for Dr. {selectedDoctor?.name || 'the selected doctor'}. Please try another or check back later.</p>
        )}

        {!loadingSlots && availableSlots.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-3">Available Slots for Dr. {selectedDoctor?.name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {availableSlots.map(slot => (
                <Button
                  key={slot.id}
                  onClick={() => handleSlotSelect(slot)}
                  variant="ghost"
                  className="w-full flex-col items-center !text-hnai-teal-dark hover:!bg-hnai-gold/30 !border-hnai-teal-dark/50"
                >
                  <span className="font-medium">{new Date(slot.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="text-sm">{slot.time}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedDoctorId && availableSlots.length > 0 && (
            <div className="pt-4">
                <Input
                    label="Comments (Optional)"
                    id="comments"
                    type="text"
                    value={appointmentComments}
                    onChange={(e) => setAppointmentComments(e.target.value)}
                    placeholder="Any specific notes for the doctor?"
                />
            </div>
        )}
      </div>

      {selectedSlot && selectedDoctor && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Confirm Your Appointment"
        >
          <div className="space-y-3 text-slate-700">
            <p>You are about to book an appointment with:</p>
            <p className="font-semibold text-hnai-teal-dark">Dr. {selectedDoctor.name} ({selectedDoctor.specialty})</p>
            <p>On: <span className="font-semibold">{new Date(selectedSlot.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
            <p>At: <span className="font-semibold">{selectedSlot.time}</span></p>
            {appointmentComments && <p>Comments: <span className="font-normal italic">{appointmentComments}</span></p>}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)} disabled={bookingInProgress}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBooking} isLoading={bookingInProgress} disabled={bookingInProgress}>
              Confirm Booking
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BookingPage;