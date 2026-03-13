"""
Normalizes TinyFish output into ClearClaim task result shape.
"""

from typing import Any


class ResultParser:
    @staticmethod
    def parse(task_type: str, raw_result: dict[str, Any]) -> dict[str, Any]:
        raw_result = raw_result or {}

        # Handle explicit failure signals across providers
        global_status = str(
            raw_result.get("status")
            or raw_result.get("run_status")
            or raw_result.get("submission_status")
            or ""
        ).lower()
        if global_status in {"failure", "failed", "error", "cancelled", "canceled"}:
            return {
                "task_status": "requires_human",
                "status": "failure",
                "payer_response": raw_result.get("payer_response")
                or raw_result.get("error")
                or "TinyFish run reported failure",
                "raw_result": raw_result,
            }

        if task_type == "prior_auth":
            payer_response = (
                raw_result.get("payer_response")
                or raw_result.get("confirmation_message")
                or ""
            )
            norm = {
                "status": raw_result.get("submission_status")
                or raw_result.get("status")
                or "submitted",
                "auth_number": raw_result.get("auth_tracking_number")
                or raw_result.get("authorization_number")
                or raw_result.get("reference_number"),
                "confirmation_message": raw_result.get("confirmation_message"),
                "requires_action": raw_result.get("requires_action"),
                "payer_response": payer_response,
                "raw_result": raw_result,
            }
            response_l = str(payer_response).lower()
            if "denied" in response_l:
                norm["task_status"] = "requires_human"
            else:
                norm["task_status"] = "completed"
            return norm

        if task_type == "eligibility":
            return {
                "status": "completed",
                "task_status": "completed",
                "coverage_active": raw_result.get("coverage_active"),
                "coverage_start_date": raw_result.get("coverage_start_date"),
                "coverage_end_date": raw_result.get("coverage_end_date"),
                "plan_name": raw_result.get("plan_name") or raw_result.get("insurance_plan"),
                "deductible_total": raw_result.get("deductible_total"),
                "deductible_met": raw_result.get("deductible_met"),
                "out_of_pocket_max": raw_result.get("out_of_pocket_max"),
                "out_of_pocket_met": raw_result.get("out_of_pocket_met"),
                "copay": raw_result.get("copay"),
                "coinsurance_percent": raw_result.get("coinsurance_percent"),
                "requires_prior_auth": raw_result.get("requires_prior_auth"),
                "payer_response": raw_result.get("payer_response") or "",
                "raw_result": raw_result,
            }

        if task_type == "claim_status":
            return {
                "status": raw_result.get("claim_status") or "pending",
                "task_status": "completed",
                "claim_number": raw_result.get("claim_number")
                or raw_result.get("reference_number"),
                "submitted_date": raw_result.get("submitted_date"),
                "processed_date": raw_result.get("processed_date"),
                "amount_billed": raw_result.get("amount_billed"),
                "amount_allowed": raw_result.get("amount_allowed"),
                "amount_paid": raw_result.get("amount_paid"),
                "denial_reason": raw_result.get("denial_reason"),
                "payer_response": raw_result.get("payer_response") or "",
                "raw_result": raw_result,
            }

        if task_type == "appeal":
            return {
                "status": "submitted" if raw_result.get("appeal_submitted") else "pending",
                "task_status": "completed" if raw_result.get("appeal_submitted") else "requires_human",
                "appeal_reference": raw_result.get("appeal_reference_number")
                or raw_result.get("reference_number"),
                "expected_response_date": raw_result.get("expected_response_date"),
                "confirmation_message": raw_result.get("confirmation_message"),
                "payer_response": raw_result.get("payer_response") or "",
                "raw_result": raw_result,
            }

        return {
            "status": "completed",
            "task_status": "completed",
            "payer_response": raw_result.get("payer_response") or "",
            "raw_result": raw_result,
        }
