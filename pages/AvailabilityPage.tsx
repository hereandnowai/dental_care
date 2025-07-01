

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as Api from '../services/api';
import { TimeSlot } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select'; // Added missing import
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';

const AvailabilityPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlotDate, setNewSlotDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newSlotTime, setNewSlotTime] = useState<string>('09:00'); // Default start time

  const workingHours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];


  const fetchAvailability = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const slots = await Api.getDoctorAvailability(user.id);
      // sort slots by date and time
      slots.sort((a,b) => {
        const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
        return dateTimeA - dateTimeB;
      });
      setAvailability(slots);
    } catch (error) {
      console.error("Error fetching availability:", error);
      addNotification('Failed to load availability.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addNotification]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSlotDate || !newSlotTime) return;

    // Check if slot already exists
    const slotExists = availability.some(slot => slot.date === newSlotDate && slot.time === newSlotTime);
    if (slotExists) {
        addNotification('This time slot already exists.', 'error');
        return;
    }
    // Check if slot is in the past
    const slotDateTime = new Date(`${newSlotDate}T${newSlotTime}`);
    if (slotDateTime < new Date()) {
        addNotification('Cannot add slots in the past.', 'error');
        return;
    }


    try {
      await Api.addDoctorAvailability(user.id, newSlotDate, newSlotTime);
      addNotification('Time slot added successfully!', 'success');
      fetchAvailability(); // Refresh list
      // setNewSlotDate(''); // Optionally reset form
      // setNewSlotTime('');
    } catch (error) {
      console.error("Error adding slot:", error);
      addNotification('Failed to add time slot.', 'error');
    }
  };
  
  const handleAddWorkingDaySlots = async () => {
    if (!user || !newSlotDate) {
        addNotification('Please select a date first.', 'error');
        return;
    }
    
    // Check if date is in the past
    if (new Date(newSlotDate) < new Date(new Date().toDateString())) { // Compare dates only
        addNotification('Cannot add slots for a past date.', 'error');
        return;
    }

    setLoading(true);
    try {
        let addedCount = 0;
        for (const time of workingHours) {
            const slotExists = availability.some(slot => slot.date === newSlotDate && slot.time === time);
            if (!slotExists) {
                 await Api.addDoctorAvailability(user.id, newSlotDate, time);
                 addedCount++;
            }
        }
        if (addedCount > 0) {
            addNotification(`Added ${addedCount} slots for ${newSlotDate}.`, 'success');
        } else {
            addNotification(`No new slots added. Slots for ${newSlotDate} might already exist or are all in the past.`, 'info');
        }
        fetchAvailability();
    } catch (error) {
        console.error("Error adding working day slots:", error);
        addNotification('Failed to add working day slots.', 'error');
    } finally {
        setLoading(false);
    }
  };


  const handleRemoveSlot = async (slotId: string) => {
    if (!user) return;
    const slotToRemove = availability.find(s => s.id === slotId);
    if (slotToRemove && slotToRemove.isBooked) {
        addNotification('Cannot remove a booked appointment slot. Please cancel the appointment first.', 'error');
        return;
    }
    if (window.confirm('Are you sure you want to remove this slot?')) {
      try {
        await Api.removeDoctorAvailability(user.id, slotId);
        addNotification('Time slot removed successfully!', 'success');
        fetchAvailability(); // Refresh list
      } catch (error) {
        console.error("Error removing slot:", error);
        addNotification('Failed to remove time slot.', 'error');
      }
    }
  };
  
  const groupedSlots = availability.reduce((acc, slot) => {
    const date = slot.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);


  if (loading && availability.length === 0) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner color="text-hnai-teal-dark"/></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-hnai-teal-dark">Manage Your Availability</h1>
      
      <form onSubmit={handleAddSlot} className="bg-white p-6 rounded-lg shadow space-y-4 md:flex md:space-y-0 md:space-x-4 md:items-end">
        <Input
          label="Date"
          type="date"
          id="newSlotDate"
          value={newSlotDate}
          onChange={(e) => setNewSlotDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]} // Prevent past dates
          required
          className="md:flex-1"
        />
        <Select
            label="Time (1-hour slots)"
            id="newSlotTime"
            value={newSlotTime}
            onChange={(e) => setNewSlotTime(e.target.value)}
            options={workingHours.map(wh => ({value: wh, label: wh}))}
            required
            className="md:flex-1"
        />
        <div className="flex space-x-2 pt-4 md:pt-0">
            <Button type="submit" className="flex-1 md:flex-none">Add Single Slot</Button>
            <Button type="button" variant="secondary" onClick={handleAddWorkingDaySlots} className="flex-1 md:flex-none">Add Full Day</Button>
        </div>
      </form>

      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Current Available Slots</h2>
        {loading && <div className="text-center text-slate-500 py-4">Refreshing slots...</div>}
        {!loading && Object.keys(groupedSlots).length === 0 ? (
          <p className="text-slate-500 bg-white p-6 rounded-lg shadow text-center">You have no available slots set up. Add some above!</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSlots).map(([date, slots]) => (
              <div key={date} className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-hnai-teal-dark mb-3">
                  {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {slots.map(slot => (
                    <div key={slot.id} className={`p-3 rounded-md border text-center ${slot.isBooked ? 'bg-amber-100 border-amber-300' : 'bg-green-50 border-green-300'}`}>
                      <p className="font-medium">{slot.time}</p>
                      {slot.isBooked ? (
                        <p className="text-xs text-amber-700">Booked</p>
                      ) : (
                        <button onClick={() => handleRemoveSlot(slot.id)} className="text-xs text-red-500 hover:text-red-700 mt-1">Remove</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityPage;