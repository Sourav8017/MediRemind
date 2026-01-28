'use client';

import { useState } from 'react';
import { X, Camera, Plus, Loader2, Check } from 'lucide-react';
import api from '@/lib/axios';
import CameraOCR, { ExtractedMedication } from './CameraOCR';

interface AddMedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (medication: MedicationFormData) => void;
}

export interface MedicationFormData {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    instructions: string;
    reminderTimes: string[];
}

const frequencyOptions = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Once weekly',
    'As needed',
];

export default function AddMedicationModal({ isOpen, onClose, onAdd }: AddMedicationModalProps) {
    const [showCamera, setShowCamera] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [extractedMeds, setExtractedMeds] = useState<ExtractedMedication[]>([]);
    const [selectedExtracted, setSelectedExtracted] = useState<number | null>(null);

    const [formData, setFormData] = useState<MedicationFormData>({
        name: '',
        dosage: '',
        frequency: 'Once daily',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        instructions: '',
        reminderTimes: ['08:00'],
    });

    const handleTextExtracted = (rawText: string, medications: ExtractedMedication[]) => {
        setShowCamera(false);
        setExtractedMeds(medications);

        // Auto-fill first medication if available
        if (medications.length > 0) {
            fillFromExtracted(medications[0]);
            setSelectedExtracted(0);
        }
    };

    const fillFromExtracted = (med: ExtractedMedication) => {
        setFormData(prev => ({
            ...prev,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            instructions: med.instructions,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                name: formData.name,
                dosage: formData.dosage,
                frequency: formData.frequency,
                instructions: formData.instructions,
                start_date: formData.startDate,
                end_date: formData.endDate || null,
                reminders: formData.reminderTimes
            };

            await api.post('/medications', payload);

            onAdd(formData); // Update parent state (optimistic or refresh needed)
            resetForm();
            onClose();
        } catch (error) {
            console.error('Failed to add medication:', error);
            // Optional: show error toast
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            dosage: '',
            frequency: 'Once daily',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            instructions: '',
            reminderTimes: ['08:00'],
        });
        setExtractedMeds([]);
        setSelectedExtracted(null);
    };

    const addReminderTime = () => {
        setFormData(prev => ({
            ...prev,
            reminderTimes: [...prev.reminderTimes, '12:00'],
        }));
    };

    const updateReminderTime = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            reminderTimes: prev.reminderTimes.map((t, i) => i === index ? value : t),
        }));
    };

    const removeReminderTime = (index: number) => {
        setFormData(prev => ({
            ...prev,
            reminderTimes: prev.reminderTimes.filter((_, i) => i !== index),
        }));
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="card w-full max-w-xl max-h-[90vh] overflow-hidden animate-fadeIn">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Add Medication</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                        >
                            <X size={20} className="text-[var(--text-muted)]" />
                        </button>
                    </div>

                    {/* Scan button */}
                    <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/5 to-[var(--accent)]/5">
                        <button
                            onClick={() => setShowCamera(true)}
                            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-[var(--primary)]/30 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all group"
                        >
                            <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white group-hover:scale-110 transition-transform">
                                <Camera size={20} />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-[var(--text-primary)]">Scan Prescription Label</p>
                                <p className="text-xs text-[var(--text-muted)]">Use AI to auto-fill medication details</p>
                            </div>
                        </button>

                        {/* Extracted medications chips */}
                        {extractedMeds.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-[var(--text-muted)] mb-2">Extracted medications (tap to fill):</p>
                                <div className="flex flex-wrap gap-2">
                                    {extractedMeds.map((med, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                fillFromExtracted(med);
                                                setSelectedExtracted(index);
                                            }}
                                            className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                        ${selectedExtracted === index
                                                    ? 'bg-[var(--primary)] text-white'
                                                    : 'bg-white border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--primary)]'
                                                }
                      `}
                                        >
                                            {selectedExtracted === index && <Check size={14} />}
                                            {med.name} {med.dosage}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[50vh]">
                        <div className="space-y-4">
                            {/* Name & Dosage */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                        Medication Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Lisinopril"
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                        Dosage *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.dosage}
                                        onChange={e => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                        placeholder="e.g., 10mg"
                                        className="input"
                                    />
                                </div>
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                    Frequency
                                </label>
                                <select
                                    value={formData.frequency}
                                    onChange={e => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                                    className="input"
                                >
                                    {frequencyOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                        End Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="input"
                                    />
                                </div>
                            </div>

                            {/* Reminder Times */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                    Reminder Times
                                </label>
                                <div className="space-y-2">
                                    {formData.reminderTimes.map((time, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="time"
                                                value={time}
                                                onChange={e => updateReminderTime(index, e.target.value)}
                                                className="input flex-1"
                                            />
                                            {formData.reminderTimes.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeReminderTime(index)}
                                                    className="p-3 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:border-[var(--danger)] transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addReminderTime}
                                        className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
                                    >
                                        <Plus size={16} />
                                        Add another time
                                    </button>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                    Special Instructions
                                </label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={e => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                                    placeholder="e.g., Take with food, avoid grapefruit..."
                                    rows={3}
                                    className="input resize-none"
                                />
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="flex gap-3 p-5 border-t border-[var(--border)] bg-[var(--background)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.name || !formData.dosage}
                            className="btn btn-primary flex-1"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Add Medication
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <CameraOCR
                    onTextExtracted={handleTextExtracted}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </>
    );
}
