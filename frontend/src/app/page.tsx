'use client';

import { useState } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import Header from '@/components/ui/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import TodayReminders from '@/components/dashboard/TodayReminders';
import RiskScoreWidget from '@/components/dashboard/RiskScoreWidget';
import AddMedicationModal from '@/components/medications/AddMedicationModal';

// Type for reminder status
type ReminderStatus = 'PENDING' | 'TAKEN' | 'SKIPPED';

interface Reminder {
  id: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  status: ReminderStatus;
}

// Mock data
const mockReminders: Reminder[] = [
  { id: '1', medicationName: 'Lisinopril', dosage: '10mg tablet', scheduledTime: '08:00', status: 'TAKEN' },
  { id: '2', medicationName: 'Metformin', dosage: '500mg tablet', scheduledTime: '08:00', status: 'TAKEN' },
  { id: '3', medicationName: 'Atorvastatin', dosage: '20mg tablet', scheduledTime: '12:00', status: 'PENDING' },
  { id: '4', medicationName: 'Metformin', dosage: '500mg tablet', scheduledTime: '18:00', status: 'PENDING' },
  { id: '5', medicationName: 'Amlodipine', dosage: '5mg tablet', scheduledTime: '21:00', status: 'PENDING' },
];

export default function Dashboard() {
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [showAddMedication, setShowAddMedication] = useState(false);

  const handleMarkTaken = (id: string) => {
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'TAKEN' as ReminderStatus } : r
    ));
  };

  const handleMarkSkipped = (id: string) => {
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'SKIPPED' as ReminderStatus } : r
    ));
  };

  const handleAddMedication = (medication: any) => {
    console.log('New medication:', medication);
    // In production, this would call the API
  };

  return (
    <div className="p-6 lg:p-8">
      <Header
        title="Welcome back, Jane 👋"
        subtitle="Here's your health summary for today"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Active Medications"
          value={5}
          subtitle="3 prescriptions"
          icon="medications"
        />
        <StatsCard
          title="Weekly Adherence"
          value="92%"
          icon="adherence"
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Current Streak"
          value="12 days"
          subtitle="Best: 28 days"
          icon="streak"
        />
        <StatsCard
          title="Next Reminder"
          value="12:00 PM"
          subtitle="Atorvastatin 20mg"
          icon="next"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Reminders - spans 2 cols */}
        <div className="lg:col-span-2">
          <TodayReminders
            reminders={reminders}
            onMarkTaken={handleMarkTaken}
            onMarkSkipped={handleMarkSkipped}
          />
        </div>

        {/* Risk Score Widget */}
        <div>
          <RiskScoreWidget
            score={32}
            category="LOW"
            factors={[
              'Good medication adherence',
              'Blood pressure in range',
              'Regular health logging'
            ]}
          />

          {/* Quick Actions */}
          <div className="card p-4 mt-4">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowAddMedication(true)}
                className="btn btn-primary w-full justify-start"
              >
                <Plus size={18} />
                Add New Medication
              </button>
              <button className="btn btn-secondary w-full justify-start">
                <MessageCircle size={18} />
                Chat with Health Assistant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Medication Modal */}
      <AddMedicationModal
        isOpen={showAddMedication}
        onClose={() => setShowAddMedication(false)}
        onAdd={handleAddMedication}
      />
    </div>
  );
}
