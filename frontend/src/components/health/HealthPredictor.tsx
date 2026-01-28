'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    Activity,
    Scale,
    Cigarette,
    AlertTriangle,
    Phone,
    Loader2,
    CheckCircle2,
    ChevronRight,
    Stethoscope
} from 'lucide-react';
import api from '@/lib/axios'; // Moved to top

interface HealthFormData {
    age: number;
    gender: string;
    systolicBP: number;
    diastolicBP: number;
    heartRate: number;
    weight: number;
    height: number;
    smokingStatus: string;
    diabetesStatus: string;
    familyHistory: string[];
    currentMedications: string[];
    recentSymptoms: string[];
}

interface RiskResult {
    riskScore: number;
    riskCategory: 'LOW' | 'MODERATE' | 'HIGH';
    contributingFactors: string[];
    recommendations: string[];
    nlemContext?: string;
    disclaimer?: string;
}

// Animated Gauge Chart Component
function GaugeChart({ score, category }: { score: number; category: string }) {
    const radius = 80;
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * Math.PI; // Half circle
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const getColor = () => {
        if (category === 'LOW') return '#06D6A0';
        if (category === 'MODERATE') return '#FFB703';
        return '#E63946';
    };

    const getGradientId = () => {
        if (category === 'LOW') return 'gaugeGradientLow';
        if (category === 'MODERATE') return 'gaugeGradientMod';
        return 'gaugeGradientHigh';
    };

    return (
        <div className="relative flex flex-col items-center">
            <svg width={radius * 2} height={radius + 20} className="overflow-visible">
                <defs>
                    <linearGradient id="gaugeGradientLow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06D6A0" />
                        <stop offset="100%" stopColor="#00B4D8" />
                    </linearGradient>
                    <linearGradient id="gaugeGradientMod" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFB703" />
                        <stop offset="100%" stopColor="#FB8500" />
                    </linearGradient>
                    <linearGradient id="gaugeGradientHigh" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#E63946" />
                        <stop offset="100%" stopColor="#9D0208" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background arc */}
                <path
                    d={`M ${strokeWidth / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth / 2} ${radius}`}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Animated progress arc */}
                <motion.path
                    d={`M ${strokeWidth / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth / 2} ${radius}`}
                    fill="none"
                    stroke={`url(#${getGradientId()})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    filter="url(#glow)"
                />
            </svg>

            {/* Score display */}
            <motion.div
                className="absolute top-12 flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
            >
                <motion.span
                    className="text-4xl font-bold"
                    style={{ color: getColor() }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    {Math.round(score)}%
                </motion.span>
                <span className="text-sm text-[var(--text-muted)]">Risk Score</span>
            </motion.div>
        </div>
    );
}

// Family history options
const familyHistoryOptions = [
    'Heart Disease',
    'Stroke',
    'Diabetes',
    'High Blood Pressure',
    'Cancer',
    'None'
];

// Symptom options
const symptomOptions = [
    'Chest Pain',
    'Shortness of Breath',
    'Dizziness',
    'Fatigue',
    'Headaches',
    'Palpitations',
    'None'
];

export default function HealthPredictor() {
    const [formData, setFormData] = useState<HealthFormData>({
        age: 45,
        gender: 'Male',
        systolicBP: 120,
        diastolicBP: 80,
        heartRate: 72,
        weight: 75,
        height: 170,
        smokingStatus: 'Never',
        diabetesStatus: 'No',
        familyHistory: [],
        currentMedications: [],
        recentSymptoms: []
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<RiskResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [medicationInput, setMedicationInput] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setResult(null);

        try {
            const response = await api.post('/predict-risk', formData);
            setResult(response.data);

        } catch (err) {
            setError('Failed to analyze health data. Please try again.');
            console.error('Risk prediction error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleArrayItem = (field: 'familyHistory' | 'recentSymptoms', item: string) => {
        setFormData(prev => {
            const arr = prev[field];
            if (item === 'None') {
                return { ...prev, [field]: arr.includes('None') ? [] : ['None'] };
            }
            const newArr = arr.filter(i => i !== 'None');
            if (newArr.includes(item)) {
                return { ...prev, [field]: newArr.filter(i => i !== item) };
            }
            return { ...prev, [field]: [...newArr, item] };
        });
    };

    const addMedication = () => {
        if (medicationInput.trim()) {
            setFormData(prev => ({
                ...prev,
                currentMedications: [...prev.currentMedications, medicationInput.trim()]
            }));
            setMedicationInput('');
        }
    };

    const removeMedication = (index: number) => {
        setFormData(prev => ({
            ...prev,
            currentMedications: prev.currentMedications.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Card */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)]">
                            <Stethoscope className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Health Assessment</h2>
                            <p className="text-sm text-[var(--text-muted)]">Enter your health data for AI analysis</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                    Age
                                </label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={e => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                                    className="input"
                                    min={1}
                                    max={120}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                    Gender
                                </label>
                                <select
                                    value={formData.gender}
                                    onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                    className="input"
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Vitals */}
                        <div className="p-4 rounded-xl bg-[var(--background)]">
                            <h3 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <Heart size={16} className="text-[var(--danger)]" />
                                Vital Signs
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs text-[var(--text-muted)] mb-1">Systolic BP</label>
                                    <input
                                        type="number"
                                        value={formData.systolicBP}
                                        onChange={e => setFormData(prev => ({ ...prev, systolicBP: parseInt(e.target.value) || 0 }))}
                                        className="input text-sm"
                                        placeholder="120"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--text-muted)] mb-1">Diastolic BP</label>
                                    <input
                                        type="number"
                                        value={formData.diastolicBP}
                                        onChange={e => setFormData(prev => ({ ...prev, diastolicBP: parseInt(e.target.value) || 0 }))}
                                        className="input text-sm"
                                        placeholder="80"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--text-muted)] mb-1">Heart Rate</label>
                                    <input
                                        type="number"
                                        value={formData.heartRate}
                                        onChange={e => setFormData(prev => ({ ...prev, heartRate: parseInt(e.target.value) || 0 }))}
                                        className="input text-sm"
                                        placeholder="72"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Body Metrics */}
                        <div className="p-4 rounded-xl bg-[var(--background)]">
                            <h3 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <Scale size={16} className="text-[var(--primary)]" />
                                Body Metrics
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[var(--text-muted)] mb-1">Weight (kg)</label>
                                    <input
                                        type="number"
                                        value={formData.weight}
                                        onChange={e => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                                        className="input text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--text-muted)] mb-1">Height (cm)</label>
                                    <input
                                        type="number"
                                        value={formData.height}
                                        onChange={e => setFormData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                                        className="input text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lifestyle */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-2">
                                    <Cigarette size={14} />
                                    Smoking Status
                                </label>
                                <select
                                    value={formData.smokingStatus}
                                    onChange={e => setFormData(prev => ({ ...prev, smokingStatus: e.target.value }))}
                                    className="input"
                                >
                                    <option>Never</option>
                                    <option>Former</option>
                                    <option>Current</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-2">
                                    <Activity size={14} />
                                    Diabetes
                                </label>
                                <select
                                    value={formData.diabetesStatus}
                                    onChange={e => setFormData(prev => ({ ...prev, diabetesStatus: e.target.value }))}
                                    className="input"
                                >
                                    <option>No</option>
                                    <option>Pre-diabetic</option>
                                    <option>Type 1</option>
                                    <option>Type 2</option>
                                </select>
                            </div>
                        </div>

                        {/* Family History */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Family History
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {familyHistoryOptions.map(option => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => toggleArrayItem('familyHistory', option)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${formData.familyHistory.includes(option)
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Symptoms */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Recent Symptoms
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {symptomOptions.map(option => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => toggleArrayItem('recentSymptoms', option)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${formData.recentSymptoms.includes(option)
                                            ? 'bg-[var(--warning)] text-white'
                                            : 'bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Current Medications */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                Current Medications
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={medicationInput}
                                    onChange={e => setMedicationInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                                    placeholder="Type medication name..."
                                    className="input flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={addMedication}
                                    className="btn btn-secondary"
                                >
                                    Add
                                </button>
                            </div>
                            {formData.currentMedications.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.currentMedications.map((med, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--background)] text-sm"
                                        >
                                            {med}
                                            <button
                                                type="button"
                                                onClick={() => removeMedication(i)}
                                                className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-[var(--danger)] text-sm flex items-center gap-2">
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Activity size={18} />
                                    Analyze Health Risk
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Results Card */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Risk Assessment Results</h2>

                    <AnimatePresence mode="wait">
                        {!result && !isSubmitting && (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-12 text-center"
                            >
                                <Activity size={48} className="text-[var(--border)] mb-4" />
                                <p className="text-[var(--text-muted)]">
                                    Fill in your health data and click "Analyze" to see your risk assessment
                                </p>
                            </motion.div>
                        )}

                        {isSubmitting && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-12"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <Activity size={48} className="text-[var(--primary)]" />
                                </motion.div>
                                <p className="mt-4 text-[var(--text-secondary)]">Analyzing your health data with AI...</p>
                            </motion.div>
                        )}

                        {result && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                {/* Gauge */}
                                <div className="flex justify-center py-4">
                                    <GaugeChart score={result.riskScore} category={result.riskCategory} />
                                </div>

                                {/* Category Badge */}
                                <div className="flex justify-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.8, type: "spring" }}
                                        className={`badge text-base px-4 py-2 ${result.riskCategory === 'LOW' ? 'badge-success' :
                                            result.riskCategory === 'MODERATE' ? 'badge-warning' :
                                                'badge-danger'
                                            }`}
                                    >
                                        {result.riskCategory === 'LOW' && <CheckCircle2 size={16} className="mr-1" />}
                                        {result.riskCategory === 'MODERATE' && <AlertTriangle size={16} className="mr-1" />}
                                        {result.riskCategory === 'HIGH' && <AlertTriangle size={16} className="mr-1" />}
                                        {result.riskCategory} RISK
                                    </motion.div>
                                </div>

                                {/* Contributing Factors */}
                                <div>
                                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">Contributing Factors</h3>
                                    <ul className="space-y-2">
                                        {result.contributingFactors.map((factor, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 1 + i * 0.1 }}
                                                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                                            >
                                                <ChevronRight size={16} className="text-[var(--warning)] mt-0.5 flex-shrink-0" />
                                                {factor}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Recommendations */}
                                <div>
                                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">Recommendations</h3>
                                    <ul className="space-y-2">
                                        {result.recommendations.map((rec, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 1.5 + i * 0.1 }}
                                                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                                            >
                                                <CheckCircle2 size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" />
                                                {rec}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Consult Doctor Button - Pulsing Red for High Risk */}
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        ...(result.riskCategory === 'HIGH' && {
                                            boxShadow: ['0 0 0 0 rgba(230, 57, 70, 0.4)', '0 0 0 20px rgba(230, 57, 70, 0)', '0 0 0 0 rgba(230, 57, 70, 0)']
                                        })
                                    }}
                                    transition={{
                                        delay: 2,
                                        ...(result.riskCategory === 'HIGH' && {
                                            boxShadow: { duration: 1.5, repeat: Infinity }
                                        })
                                    }}
                                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${result.riskCategory === 'HIGH'
                                        ? 'bg-[var(--danger)] text-white animate-pulse'
                                        : 'btn btn-secondary'
                                        }`}
                                >
                                    <Phone size={20} />
                                    {result.riskCategory === 'HIGH' ? 'Consult a Doctor Immediately' : 'Schedule a Checkup'}
                                </motion.button>

                                {/* NLEM Context (RAG Evidence) */}
                                {result.nlemContext && (
                                    <div className="text-xs text-[var(--text-muted)] p-3 bg-gray-50 rounded-lg border border-gray-100 mt-4">
                                        <div className="font-semibold mb-1">Source (NLEM 2022 Grounding):</div>
                                        <div className="italic line-clamp-3">{result.nlemContext}</div>
                                    </div>
                                )}

                                {/* Disclaimer */}
                                <p className="text-xs text-[var(--text-muted)] text-center mt-2 whitespace-pre-line">
                                    {result.disclaimer || `⚠️ This is an AI-generated assessment for educational purposes only.
                                    Always consult a healthcare professional for medical advice.`}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
