"""
Predictions router - handles AI-powered OCR and health risk prediction.
Includes rate limiting and input validation for security.
"""
import os
import base64
import io
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from PIL import Image
import google.generativeai as genai
from slowapi import Limiter
from slowapi.util import get_remote_address

import models
from auth import get_current_user
from dependencies import get_medical_collection
from logging_config import get_api_logger
from schemas import (
    ImageRequest,
    MedicationResponse,
    HealthDataRequest
)

logger = get_api_logger()
router = APIRouter(tags=["AI Predictions"])

# Rate limiter instance (uses the same key function as main app)
limiter = Limiter(key_func=get_remote_address)

# Configure Gemini
API_KEY = os.getenv("GOOGLE_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

# CDSCO Mandatory Disclaimer
CDSCO_DISCLAIMER = "\n\n---\n⚖️ **CDSCO Disclaimer**: This is an AI-generated suggestion for clinical review only. Final authority rests with a Registered Medical Practitioner (RMP)."


# --- RESPONSE SCHEMAS ---
from pydantic import BaseModel

class RiskPredictionResponse(BaseModel):
    riskScore: float
    riskCategory: str
    contributingFactors: list[str]
    recommendations: list[str]
    nlemContext: str = ""
    disclaimer: str = CDSCO_DISCLAIMER


# --- ENDPOINTS ---
@router.post("/process-medication", response_model=MedicationResponse)
@limiter.limit("10/minute")  # 10 OCR requests per minute per IP
async def process_medication(
    request: Request,  # Required for rate limiter
    image_request: ImageRequest,
    current_user: models.User = Depends(get_current_user)
):
    """
    OCR medication from image. Requires authentication.
    
    Rate limited: 10 requests/minute per IP
    Image validation: Max 5MB, JPEG/PNG/WebP only
    """
    try:
        # Image already validated by Pydantic schema
        image_data = image_request.image.split(",")[-1] if "," in image_request.image else image_request.image
        
        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

        prompt = """
        Analyze this medication image (prescription label or pill bottle).
        Extract the following information and return it in JSON format:
        1. Medication Name
        2. Dosage
        3. Frequency
        4. Instructions
        Return ONLY raw JSON with keys: name, dosage, frequency, instructions.
        """
        response = model.generate_content([prompt, image])
        
        try:
            text_response = response.text.replace("```json", "").replace("```", "").strip()
            data = json.loads(text_response)
            logger.info(f"OCR successful for user {current_user.email}: {data.get('name', 'Unknown')}")
            return MedicationResponse(
                name=data.get("name", "Unknown"),
                dosage=data.get("dosage", "Unknown"),
                frequency=data.get("frequency", "As directed"),
                instructions=data.get("instructions", "Take as directed")
            )
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing medication: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-risk", response_model=RiskPredictionResponse)
@limiter.limit("5/minute")  # 5 risk predictions per minute per IP (protects Gemini quota)
async def predict_risk(
    request: Request,  # Required for rate limiter
    data: HealthDataRequest,
    current_user: models.User = Depends(get_current_user),
    collection = Depends(get_medical_collection)
):
    """
    Health risk prediction with RAG from NLEM 2022.
    
    Rate limited: 5 requests/minute per IP (protects Gemini API quota)
    - Requires JWT Authentication
    - Uses Modular ChromaDB Dependency
    - Enforces Top-2 Retrieval & Strict Grounding
    """
    try:
        height_m = data.height / 100
        bmi = data.weight / (height_m ** 2)
        
        # Build query from symptoms for RAG
        symptoms_query = ", ".join(data.recentSymptoms) if data.recentSymptoms else "general checkup"
        
        # --- RAG: Query ChromaDB for NLEM context (Top-2) ---
        nlem_context = ""
        if collection:
            try:
                results = collection.query(
                    query_texts=[symptoms_query],
                    n_results=2  # Top 2 matches
                )
                if results and results['documents']:
                    nlem_context = "\n".join(results['documents'][0])
            except Exception as e:
                logger.warning(f"ChromaDB query error: {e}")
        
        health_profile = f"""
        Age: {data.age}, Gender: {data.gender}, BP: {data.systolicBP}/{data.diastolicBP}, 
        HR: {data.heartRate}, BMI: {bmi:.1f}, Smoking: {data.smokingStatus}, 
        Diabetes: {data.diabetesStatus}, History: {data.familyHistory}, 
        Meds: {data.currentMedications}, Symptoms: {data.recentSymptoms}
        """
        
        # --- Grounded Prompt with NLEM Data ---
        system_instruction = """You are a clinical decision support AI grounded in Indian pharmaceutical regulations (NLEM 2022).
        
CRITICAL COMPLIANCE RULES:
1. Use ONLY the provided NLEM 2022 data for drug recommendations. Do not hallucinate outside this context.
2. If a recommended drug is Schedule H or Schedule H1, you MUST explicitly state: "This medication requires an RMP prescription (Schedule H/H1)."
3. Append the CDSCO disclaimer to your clinical suggestions.
4. If the NLEM data is insufficient for the condition, state that clearly and recommend a physical consultation.
"""

        prompt = f"""{system_instruction}

--- RAG Context (NLEM 2022) ---
{nlem_context if nlem_context else "No specific NLEM data available."}
--- End Context ---

Patient Profile:
{health_profile}

Task:
Provide a JSON response with:
- riskScore (0-100)
- riskCategory (LOW/MODERATE/HIGH)
- contributingFactors (list)
- recommendations (list of clinical actions/drugs)

Ensure all drug recommendations cite the NLEM status if available in context.
Return ONLY valid JSON.
"""

        try:
            response = model.generate_content(prompt)
            text_response = response.text.replace("```json", "").replace("```", "").strip()
            result = json.loads(text_response)
            logger.info(f"Risk prediction for user {current_user.email}: {result.get('riskCategory', 'N/A')}")
        except Exception as e:
            logger.warning(f"AI generation failed ({e}), using rule-based fallback")
            # Fallback logic if AI fails
            base_score = 30
            factors = []
            if bmi > 25:
                base_score += 20
                factors.append("High BMI")
            if data.systolicBP > 130:
                base_score += 20
                factors.append("Elevated Blood Pressure")
            if data.smokingStatus in ["Current", "Former"]:
                base_score += 15
                factors.append("Smoking History")
            
            result = {
                "riskScore": min(base_score, 95),
                "riskCategory": "HIGH" if base_score > 70 else "MODERATE" if base_score > 40 else "LOW",
                "contributingFactors": factors,
                "recommendations": ["Consult a general physician (AI Unavailable)", "Maintain healthy diet"]
            }
        
        return RiskPredictionResponse(
            riskScore=float(result.get("riskScore", 50)),
            riskCategory=result.get("riskCategory", "MODERATE"),
            contributingFactors=result.get("contributingFactors", []),
            recommendations=result.get("recommendations", []),
            nlemContext=nlem_context[:500] if nlem_context else "",
            disclaimer=CDSCO_DISCLAIMER
        )
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting risk: {e}")
        raise HTTPException(status_code=500, detail=str(e))
