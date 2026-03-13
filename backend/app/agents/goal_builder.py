"""
Builds TinyFish goals with task-specific, schema-first instructions.
"""

from datetime import date

from app.models.task import Task


class GoalBuilder:
    @staticmethod
    def build_goal(task: Task, context: dict[str, str] | None = None) -> str:
        ctx = {
            "patient_name": "Unknown Patient",
            "patient_dob": "Unknown",
            "member_id": "Unknown",
            "insurance_plan": "Unknown",
            "npi": "Unknown",
            "procedure_code": task.procedure_code or "Unknown",
            "diagnosis_code": task.diagnosis_code or "Unknown",
            "procedure_description": "Requested medical service",
            "today": date.today().isoformat(),
            "date_of_service": date.today().isoformat(),
            "claim_number": None,
            "appeal_reason": "Please reconsider claim denial based on medical necessity.",
        }
        if context:
            ctx.update({k: (v if v is not None else "") for k, v in context.items()})

        if task.task_type == "prior_auth":
            return f"""
You are submitting a prior authorization request on behalf of a
medical provider. Complete the following workflow precisely:

1. Navigate to the prior authorization submission section
2. Log in if prompted using the credentials provided in your context
3. Select "New Prior Authorization Request"
4. Fill in the patient information:
   - Patient Name: {ctx['patient_name']}
   - Date of Birth: {ctx['patient_dob']}
   - Member ID: {ctx['member_id']}
   - Insurance Plan: {ctx['insurance_plan']}
5. Fill in the provider information:
   - NPI: {ctx['npi']}
6. Fill in the service information:
   - Procedure Code (CPT): {ctx['procedure_code']}
   - Diagnosis Code (ICD-10): {ctx['diagnosis_code']}
   - Service Description: {ctx['procedure_description']}
7. Upload or enter any required clinical notes if a field appears
8. Click Submit or Continue to complete the submission
9. On the confirmation page, locate and note the authorization
   tracking number or reference number

If a cookie banner or popup appears, close it first.
If MFA or additional verification is required, note it and stop.
If a field is not found, skip it and continue.
Do not click any billing or payment buttons.

Return as JSON with this exact structure:
{{
  "submission_status": "submitted" or "failed" or "pending_verification",
  "auth_tracking_number": "string or null",
  "confirmation_message": "string or null",
  "requires_action": "description of any required human action or null",
  "payer_response": "full text of any confirmation or error shown"
}}
""".strip()

        if task.task_type == "eligibility":
            return f"""
Check patient insurance eligibility on this payer portal.

1. Navigate to the eligibility verification section
2. Log in if prompted
3. Enter patient details:
   - Patient Name: {ctx['patient_name']}
   - Date of Birth: {ctx['patient_dob']}
   - Member ID: {ctx['member_id']}
4. Select service date as today: {ctx['today']}
5. Submit the eligibility check
6. Extract all coverage information shown

Return as JSON:
{{
  "coverage_active": true or false,
  "coverage_start_date": "YYYY-MM-DD or null",
  "coverage_end_date": "YYYY-MM-DD or null",
  "plan_name": "string or null",
  "deductible_total": number or null,
  "deductible_met": number or null,
  "out_of_pocket_max": number or null,
  "out_of_pocket_met": number or null,
  "copay": number or null,
  "coinsurance_percent": number or null,
  "requires_prior_auth": true or false,
  "payer_response": "full text shown on screen"
}}
""".strip()

        if task.task_type == "claim_status":
            return f"""
Check the status of a submitted insurance claim.

1. Navigate to claim status lookup section
2. Log in if prompted
3. Search for claim using:
   - Patient Name: {ctx['patient_name']}
   - Member ID: {ctx['member_id']}
   - Date of Service: {ctx['date_of_service']}
   - Procedure Code: {ctx['procedure_code']}
4. Locate the most recent matching claim
5. Extract all status information shown

Return as JSON:
{{
  "claim_number": "string or null",
  "claim_status": "approved" or "denied" or "in_review" or "pending" or "paid",
  "submitted_date": "YYYY-MM-DD or null",
  "processed_date": "YYYY-MM-DD or null",
  "amount_billed": number or null,
  "amount_allowed": number or null,
  "amount_paid": number or null,
  "denial_reason": "string or null",
  "payer_response": "full text shown on screen"
}}
""".strip()

        if task.task_type == "appeal":
            return f"""
Submit a denial appeal for a rejected insurance claim.

1. Navigate to the appeals or grievances section
2. Log in if prompted
3. Search for the denied claim:
   - Claim Number: {ctx['claim_number']}
   - Patient Name: {ctx['patient_name']}
   - Member ID: {ctx['member_id']}
4. Select "File Appeal" or equivalent option
5. Enter appeal reason: {ctx['appeal_reason']}
6. If a clinical notes field appears, enter:
   "Medical necessity supported by attached clinical documentation."
7. Submit the appeal
8. Note the appeal reference number from the confirmation page

Return as JSON:
{{
  "appeal_submitted": true or false,
  "appeal_reference_number": "string or null",
  "expected_response_date": "YYYY-MM-DD or null",
  "confirmation_message": "string or null",
  "payer_response": "full text shown"
}}
""".strip()

        raise ValueError(f"Unsupported task_type: {task.task_type}")
