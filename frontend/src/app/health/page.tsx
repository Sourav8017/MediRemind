import Header from '@/components/ui/Header';
import HealthPredictor from '@/components/health/HealthPredictor';

export default function HealthPage() {
    return (
        <div className="p-6 lg:p-8">
            <Header
                title="Health Risk Predictor"
                subtitle="AI-powered health assessment based on your vitals and lifestyle"
            />
            <HealthPredictor />
        </div>
    );
}
