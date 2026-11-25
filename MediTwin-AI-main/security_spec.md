# Security Specification: MEDiTWIN AI Firestore Security

## 1. Data Invariants
1. **User Identity & Role Invariance**: A user can only write their own user profile document matching `request.auth.uid`. A user cannot elevate their role or alter another user's identity.
2. **Patient Medical Record Privacy**: `patientProfiles` can only be viewed and updated by the owning patient, or by an actively authorized doctor who has an `ACTIVE` relationship record with the patient.
3. **Doctor Profile Integrity**: Only authenticated clinicians can publish and update their own `doctorProfiles/{userId}`.
4. **Relational Sync**: A `doctorPatientRelationships` document can only be created by a doctor targeting a valid patient with `status: 'PENDING'`. Only the assigned patient can transition the status to `ACTIVE` or `DECLINED`. Both patient and doctor can revoke an active connection.
5. **Medication Regimen Integrity**: Medications belong strictly to the patient (`patientId == request.auth.uid` or an actively connected doctor). Medication records cannot be tampered with by unrelated third parties.
6. **Prescription Data Quarantine**: Prescriptions uploaded by a patient can only be accessed by that patient or their actively connected doctor.
7. **Default Deny Catch-All**: All unmapped collections or malformed requests are unconditionally rejected.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Tests)

1. **Payload 1: Unauthenticated User Profile Creation**
   - Attempt: Unauthenticated client creates `/users/attacker_uid`.
   - Expected Result: `PERMISSION_DENIED` (auth required).

2. **Payload 2: Identity Impersonation in Users Collection**
   - Attempt: Auth user `uid_bob` writes to `/users/uid_alice`.
   - Expected Result: `PERMISSION_DENIED` (`request.auth.uid != userId`).

3. **Payload 3: Arbitrary Role Escalation in Users Collection**
   - Attempt: Patient attempts to mutate `role: 'ADMIN'` or inject unauthorized privilege flags.
   - Expected Result: `PERMISSION_DENIED` (Strict schema and allowed roles `PATIENT` or `DOCTOR`).

4. **Payload 4: Unauthorized Reading of Patient Health Profile**
   - Attempt: Doctor `uid_carol` (no connection) attempts to read `/patientProfiles/uid_alice`.
   - Expected Result: `PERMISSION_DENIED` (No active doctor-patient relationship).

5. **Payload 5: Patient Profile Hijacking**
   - Attempt: User `uid_mallory` updates `/patientProfiles/uid_alice`.
   - Expected Result: `PERMISSION_DENIED` (`request.auth.uid != userId`).

6. **Payload 6: Doctor Profile Impersonation**
   - Attempt: User writes to `/doctorProfiles/uid_other_doc`.
   - Expected Result: `PERMISSION_DENIED` (`request.auth.uid != userId`).

7. **Payload 7: Self-Authorizing Relationship Request**
   - Attempt: Doctor creates relationship document with pre-set `status: 'ACTIVE'` bypassing patient consent.
   - Expected Result: `PERMISSION_DENIED` (New relationships must have `status: 'PENDING'`).

8. **Payload 8: Third-Party Relationship Tampering**
   - Attempt: Random user `uid_stranger` attempts to alter `/doctorPatientRelationships/rel_123`.
   - Expected Result: `PERMISSION_DENIED` (User is neither the doctor nor the patient in the relationship).

9. **Payload 9: Injection of Medication Record into Another Patient's Profile**
   - Attempt: User `uid_mallory` inserts a medication with `patientId: 'uid_alice'`.
   - Expected Result: `PERMISSION_DENIED` (`incoming().patientId != request.auth.uid`).

10. **Payload 10: Unauthorized Modification of Active Medication by Unconnected Doctor**
    - Attempt: Unconnected physician updates dosage or active flag on `/medications/med_999`.
    - Expected Result: `PERMISSION_DENIED` (Requires active authorization).

11. **Payload 11: Tampering with Emergency Passport by Non-Owner**
    - Attempt: Stranger writes to `/emergencyPassports/uid_alice`.
    - Expected Result: `PERMISSION_DENIED` (`request.auth.uid != userId`).

12. **Payload 12: Junk/Denial of Wallet Attack with Oversized Payload**
    - Attempt: Authenticated user writes 2MB oversized garbage string to `name` or ID with malicious characters.
    - Expected Result: `PERMISSION_DENIED` (Validation helper enforces `.size() <= 120` and `isValidId()`).

---

## 3. Test Runner Specification
The test suite validates these 12 invariants using Firestore rules evaluation assertions.
