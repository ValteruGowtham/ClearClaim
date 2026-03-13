"""
Payer registry for TinyFish portal automation.
"""

from dataclasses import dataclass
import re


@dataclass(frozen=True)
class PayerProfile:
    payer_id: str
    display_name: str
    portal_url: str
    browser_profile: str = "stealth"
    notes: str = ""


class PayerRegistry:
    REGISTRY: dict[str, PayerProfile] = {
        "uhc": PayerProfile(
            payer_id="uhc",
            display_name="UnitedHealthcare",
            portal_url="https://provider.uhc.com",
            browser_profile="stealth",
            notes="Requires NPI login, has MFA",
        ),
        "bcbs": PayerProfile(
            payer_id="bcbs",
            display_name="Blue Cross Blue Shield",
            portal_url="https://www.bcbs.com/provider",
            browser_profile="stealth",
            notes="Multiple regional portals",
        ),
        "aetna": PayerProfile(
            payer_id="aetna",
            display_name="Aetna",
            portal_url="https://www.aetna.com/provider",
            browser_profile="stealth",
            notes="",
        ),
        "cigna": PayerProfile(
            payer_id="cigna",
            display_name="Cigna",
            portal_url="https://cignaforhcp.cigna.com",
            browser_profile="stealth",
            notes="",
        ),
        "humana": PayerProfile(
            payer_id="humana",
            display_name="Humana",
            portal_url="https://provider.humana.com",
            browser_profile="stealth",
            notes="",
        ),
        "availity": PayerProfile(
            payer_id="availity",
            display_name="Availity (Multi-Payer)",
            portal_url="https://apps.availity.com",
            browser_profile="stealth",
            notes="Multi-payer hub — handles BCBS, many regional payers",
        ),
    }

    @staticmethod
    def get_by_name(payer_name: str) -> PayerProfile:
        raw = (payer_name or "").strip()
        normalized = re.sub(r"[^a-z0-9]+", " ", raw.lower()).strip()

        # Alias-first matching
        aliases: dict[str, tuple[str, ...]] = {
            "uhc": ("uhc", "united", "unitedhealthcare", "united healthcare"),
            "bcbs": (
                "bcbs",
                "blue cross",
                "blue shield",
                "blue cross blue shield",
            ),
            "aetna": ("aetna",),
            "cigna": ("cigna",),
            "humana": ("humana",),
            "availity": ("availity",),
        }

        for payer_id, terms in aliases.items():
            if any(term in normalized for term in terms):
                return PayerRegistry.REGISTRY[payer_id]

        # Fallback generic profile
        slug = re.sub(r"[^a-z0-9]", "", normalized) or "payer"
        title = raw or "Unknown Payer"
        return PayerProfile(
            payer_id=slug,
            display_name=title,
            portal_url=f"https://www.{slug}.com/provider",
            browser_profile="stealth",
            notes="Auto-generated payer profile",
        )
