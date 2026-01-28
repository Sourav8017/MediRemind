# System Design: Medication Reminder + Health Risk Predictor

## 1. Architecture Overview
The system follows a modern client-server architecture with a separate frontend and backend to allow for flexibility and scalability. The backend handles business logic, data persistence, and the health risk prediction model. The frontend provides a responsive user interface for patients.

### Tech Stack
- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Lucide React (Icons), TypeScript
- **Backend**: Python (FastAPI) - Chosen for its speed and excellent support for data science/ML libraries needed for risk prediction.
- **Database**: SQLite (Development) / PostgreSQL (Production) - Relational database for structured patient and medication data.
- **AI/ML**: Scikit-learn or TensorFlow (for risk prediction models), OpenAI API (for natural language medication queries).

## 2. Database Schema

### Users
Stores user account and profile information.
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `password_hash`: String
- `full_name`: String
- `date_of_birth`: Date
- `gender`: String
- `created_at`: Datetime

### Medications
Stores details about the medications a user is taking.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> Users.id)
- `name`: String (e.g., "Lisinopril")
- `dosage`: String (e.g., "10mg")
- `frequency`: String (e.g., "Daily", "Twice daily")
- `start_date`: Date
- `end_date`: Date (Optional)
- `instructions`: Text (e.g., "Take with food")

### Reminders
Specific instances when a medication should be taken.
- `id`: UUID (Primary Key)
- `medication_id`: UUID (Foreign Key -> Medications.id)
- `scheduled_time`: Time
- `status`: Enum (PENDING, TAKEN, SKIPPED)
- `taken_at`: Datetime (Nullable)

### HealthLogs
Tracks vitals and symptoms for risk prediction.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> Users.id)
- `type`: Enum (BLOOD_PRESSURE, HEART_RATE, WEIGHT, GLUCOSE, SYMPTOM)
- `value`: String/JSON (e.g., "120/80" for BP, or "Headache" for symptom)
- `recorded_at`: Datetime

### RiskPredictions
Stores the output of the health risk predictor.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> Users.id)
- `risk_score`: Float (0-100)
- `risk_category`: Enum (LOW, MODERATE, HIGH)
- `contributing_factors`: JSON (Explainability)
- `generated_at`: Datetime

## 3. API Architecture

### Authentication
- `POST /auth/register`: Create a new user account.
- `POST /auth/login`: Authenticate and receive JWT.

### Medications
- `GET /medications`: List all medications for the logged-in user.
- `POST /medications`: Add a new medication.
- `GET /medications/{id}`: Get details of a specific medication.
- `PUT /medications/{id}`: Update medication details.
- `DELETE /medications/{id}`: Remove a medication.

### Reminders
- `GET /reminders/today`: Get all reminders for the current day.
- `POST /reminders/{id}/track`: Mark a reminder as taken or skipped.

### Health & Risk
- `POST /health-logs`: Log a new vital sign or symptom.
- `GET /health-logs`: Retrieve history of health logs.
- `POST /predict-risk`: Trigger a risk assessment based on recent logs.
- `GET /risk-history`: View past risk assessments.

## 4. Agent Hand-off Points & AI Integration

The system utilizes AI agents to enhance user experience and safety. "Hand-off" refers to the point where the AI escalates to a human or a specialized system, or transitions control back to the structured application flow.

### Scenario A: Symptom Analysis -> Medical Professional Hand-off
1.  **User Input**: User reports "I'm feeling dizzy and have a headache" via the chat interface.
2.  **Agent Action**: The AI analyzes the symptoms against the user's current medication list (checking for side effects).
3.  **Risk Assessment**:
    *   *Low Risk*: Agent suggests hydration and rest.
    *   *High Risk*: Agent detects potential drug interaction or hypertensive crisis.
4.  **Hand-off**:
    *   **System Alert**: The agent triggers a "High Risk" alert in the application.
    *   **External Hand-off**: The user is explicitly advised: "This could be serious. I am not a doctor. Please contact your healthcare provider or emergency services immediately." The app displays a one-tap "Call Emergency Contact" button.

### Scenario B: Adherence Coaching -> Human Caregiver Hand-off
1.  **Trigger**: User has missed medications for 3 consecutive days.
2.  **Agent Action**: An "Adherence Agent" initiates a gentle check-in: "I noticed you've missed your meds lately. Is there a reason? Side effects? Cost?"
3.  **User Response**: "I keep forgetting." -> Agent suggests changing the reminder sound or time.
4.  **Hand-off**:
    *   **Caregiver Alert**: If the user responds "I'm confused about which pills to take," the Agent logs this and sends a notification to the designated caregiver/family member: "User X is reporting confusion with medication. Please assist."

### Scenario C: Complex Medical Queries -> Pharmacist Verification
1.  **User Input**: "Can I take ibuprofen with my heart medication?"
2.  **Agent Action**: Queries medical interaction database.
3.  **Response**: "Ibuprofen may interact with heart medications like X reducing their effect."
4.  **Hand-off**: The response includes a mandatory disclaimer and a prompt: "Would you like to save this question for your next doctor's visit?" or "Consult your pharmacist before combining these."

