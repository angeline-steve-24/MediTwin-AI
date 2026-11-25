# MediTwin AI — Personalized Medication Safety & Polypharmacy Intelligence

> **“Your Medications. One Intelligent Twin.”**  
> *AI-powered medication intelligence that helps patients and healthcare professionals organize, analyze, simulate, and securely share medication information.*

🔗 **GitHub Repository:** https://github.com/Nivethitha-A/MediTwin-AI  
🎥 **Video Demonstration:** https://drive.google.com/file/d/1vzoX-qeQ_tszBqvVGpLdGWwgnxEoyoea/view?usp=sharing

---

## 1. Problem Statement: The Medication Safety Gap

Managing multiple medications can become difficult when prescriptions, allergies, chronic conditions, and medication records are scattered across different sources.

This creates several challenges:

1. **Medication Information Fragmentation:** Patients may not have a single, updated view of their active medications, allergies, and medical conditions.
2. **Prescription Complexity:** Prescription details can be difficult to manually enter and maintain, especially when managing multiple medications.
3. **Hidden Safety Risks:** Duplicate medications, allergy conflicts, interactions, and patient-specific risks may not be immediately visible.
4. **Uncertain Medication Changes:** Patients and healthcare professionals need a way to understand how adding, removing, or changing a medication could affect the existing medication profile.
5. **Limited Emergency Access:** Important medication information may not be immediately available during emergencies.

**Core Problem Objective:**  
Build an intelligent medication safety platform that creates a centralized Medication Twin, analyzes potential safety concerns, allows users to simulate medication changes, and provides controlled emergency information sharing.

---

## 2. Solution Alignment: How MediTwin AI Solves the Problem

| **Medication Safety Challenge** | **MediTwin AI Feature** | **Impact** |
|---|---|---|
| Scattered medication information | **Medication Twin** | Creates a centralized profile containing medications, allergies, conditions, and patient information. |
| Manual prescription entry | **AI Prescription Extraction** | Extracts medication details from prescription images for user review and confirmation. |
| Hidden safety risks | **Medication Safety Engine** | Identifies potential allergy conflicts, duplicates, interactions, and supported patient-specific risks. |
| Uncertainty around medication changes | **What-If Simulator** | Compares current and proposed medication profiles to show new, resolved, and remaining findings. |
| Need for professional review | **Patient–Doctor Connection** | Allows patients to control which doctors can access their permitted medication information. |
| Emergency information access | **Emergency Medication Passport** | Provides selected medication information through a controlled read-only link or QR code. |

---

## 3. Medication Intelligence Workflow

### Core Workflow

```text
Patient / Doctor Login
          ↓
     Medication Twin
          ↓
Prescription Upload
          ↓
   AI Extraction & Review
          ↓
   Safety Analysis
          ↓
   What-If Simulation
          ↓
 Doctor Access / Review
          ↓
 Emergency Passport & QR
          ↓
     Secure Sharing
```

**Build → Extract → Analyze → Simulate → Review → Share**

### How It Works

- **Medication Twin:** Patients maintain a centralized profile containing medicines, allergies, and chronic conditions.
- **AI Extraction:** Prescription images are processed to extract medication names, strengths, dosage, and frequency.
- **User Verification:** Extracted information is reviewed and confirmed before being added to the patient's profile.
- **Safety Analysis:** The system evaluates the medication profile for potential safety concerns.
- **What-If Simulation:** Proposed medication changes can be tested without modifying the actual medication profile.
- **Doctor Review:** Patients can connect with doctors and explicitly grant or revoke access.
- **Emergency Passport:** Selected medication information can be securely shared through a read-only QR-based passport.

---

## 4. Key Features

1. **Medication Twin:** Centralized medication, allergy, chronic-condition, and patient information management.

2. **AI Prescription Extraction:** Uses AI-assisted image processing to extract medication details from uploaded prescriptions, followed by user verification.

3. **Medication Safety Engine:** Detects potential medication-allergy conflicts, duplicate medications, interactions, and supported patient-specific risks.

4. **Medication Safety Score:** Provides a prototype safety score to help users understand the overall medication-risk picture.

5. **What-If Simulator:** Allows users to add, remove, or modify proposed medications and compare safety findings between the current and proposed profiles.

6. **Patient–Doctor Access Control:** Patients can generate connection codes, approve doctor requests, control access, and revoke permissions.

7. **Emergency Medication Passport:** Generates a read-only emergency profile containing selected patient information, medications, allergies, and relevant safety findings.

8. **QR-Based Sharing:** Provides controlled access to the emergency passport through a QR code, with expiration and revocation support.

9. **Reports:** Generates medication and safety reports containing patient information, active medications, findings, explanations, and relevant sources where available.

---

## 5. Technology Stack

- **Frontend & UI:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **AI:** Google Gemini / GenAI
- **Authentication:** Firebase Authentication
- **Database:** Firebase Firestore
- **Security:** Firestore Security Rules and authorization checks
- **Reports:** jsPDF
- **QR Sharing:** QRCode

---

## 6. Security & Privacy

MediTwin AI follows a patient-controlled access model:

- Authentication for protected application access
- Role-based Patient and Doctor workflows
- Patient-controlled doctor connections
- Explicit permission before doctor access
- Authorization checks for protected data
- Revocable doctor and sharing permissions
- Read-only emergency passport access
- Expiration and revocation controls
- Firestore security rules
- Security and authorization verification tests

Patient information is not intended to be exposed through unrestricted public access.

---

## 7. Testing & Verification

The project includes verification for core safety and access workflows, including:

- Medication safety analysis
- What-If medication simulation
- Emergency Medication Passport
- QR-based sharing
- Patient and Doctor Settings
- Authorization scenarios
- Access control and permission handling

---

## 8. Accessibility & User Experience

- Clean, structured patient and doctor workflows
- Clear medication and safety information
- Review-and-confirm flow for AI-extracted prescriptions
- Simple What-If medication simulation
- Readable safety findings and explanations
- Controlled sharing designed to minimize unnecessary exposure of patient information

---

## 9. Evaluation Alignment

| **Evaluation Criteria** | **MediTwin AI Implementation** |
|---|---|
| **Smart Assistant** | AI-assisted prescription extraction and medication safety intelligence |
| **Context-Aware Decisions** | Medication analysis considers the patient's medication profile, allergies, and conditions |
| **Real-World Usability** | Medication Twin, What-If Simulator, doctor access, and emergency passport |
| **Security** | Authentication, authorization, permissions, revocation, and Firestore rules |
| **Testing** | Feature, simulation, and authorization verification |
| **Accessibility** | Structured and patient-focused workflows |
| **Problem Alignment** | Directly addresses medication management and polypharmacy safety |

### Organize. Analyze. Simulate. Share.
