#!/usr/bin/env python3
"""Apply MediTime Supabase Auth email templates through the Management API.

Required environment variables:
- SUPABASE_ACCESS_TOKEN: personal access token from https://supabase.com/dashboard/account/tokens
- PROJECT_REF: Supabase project ref, or SUPABASE_URL to derive it from https://<ref>.supabase.co

Usage:
  python scripts/apply-supabase-email-templates.py --dry-run
  python scripts/apply-supabase-email-templates.py
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from html import escape
from urllib.parse import urlparse

API_BASE = "https://api.supabase.com/v1"
USER_AGENT = "MediTime-Supabase-Templates/1.0"

HEADER = """<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background-color: #007bff; padding: 16px; text-align: center;">
      <img src="https://meditime-app.com/icons/logo_white.png" alt="MediTime Logo" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
    </div>
    <div style="padding: 24px;">"""

FOOTER = """      <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 16px;">
        <a href="https://meditime-app.com/privacy" style="color: #888; text-decoration: none; margin: 0 8px;">Confidentialite</a>
        |
        <a href="https://meditime-app.com/terms" style="color: #888; text-decoration: none; margin: 0 8px;">Conditions d'utilisation</a>
      </div>
    </div>
  </div>
</div>"""


def paragraph(text: str) -> str:
    return f'      <p style="font-size: 16px; color: #555;">{text}</p>'


def action(label: str, href: str) -> str:
    return (
        '      <div style="margin: 32px 0; text-align: center;">\n'
        f'        <a href="{href}" style="background-color: #007bff; color: white; text-decoration: none; padding: 12px 20px; border-radius: 4px; display: inline-block;">{label}</a>\n'
        "      </div>"
    )


def link_fallback(href: str) -> str:
    return (
        '      <p style="font-size: 13px; color: #999;">\n'
        "        Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>\n"
        f'        <a href="{href}" style="color: #007bff;">{href}</a>\n'
        "      </p>"
    )


def code_block(token_expr: str = "{{ .Token }}") -> str:
    return (
        '      <div style="margin: 32px 0; text-align: center;">\n'
        f'        <span style="background-color: #f2f6ff; color: #007bff; font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 14px 18px; border-radius: 8px; display: inline-block;">{token_expr}</span>\n'
        "      </div>"
    )


def layout(title: str, parts: list[str]) -> str:
    body = "\n".join(parts)
    return f"""{HEADER}
      <h2 style="color: #333;">{escape(title)}</h2>
{body}
{FOOTER}"""


def linked_template(title: str, body: str, button: str, url_expr: str = "{{ .ConfirmationURL }}") -> str:
    return layout(
        title,
        [
            paragraph(body),
            action(button, url_expr),
            link_fallback(url_expr),
        ],
    )


def security_template(title: str, body: str) -> str:
    return layout(
        title,
        [
            paragraph(body),
            paragraph(
                "Si vous n'etes pas a l'origine de cette action, changez votre mot de passe et contactez le support MediTime."
            ),
        ],
    )


def build_payload() -> dict[str, object]:
    return {
        "site_url": "https://meditime-app.com",
        "uri_allow_list": "https://meditime-app.com/**,https://dev.meditime-app.com/**",
        "mailer_subjects_confirmation": "Confirmez votre inscription MediTime",
        "mailer_templates_confirmation_content": linked_template(
            "Confirmez votre inscription",
            "Bienvenue sur MediTime ! Veuillez confirmer votre adresse e-mail pour activer votre compte.",
            "Confirmer mon adresse e-mail",
        ),
        "mailer_subjects_magic_link": "Votre lien de connexion MediTime",
        "mailer_templates_magic_link_content": linked_template(
            "Connexion a MediTime",
            "Cliquez sur le bouton ci-dessous pour vous connecter a votre compte MediTime.",
            "Me connecter",
        ),
        "mailer_subjects_recovery": "Reinitialisation de votre mot de passe MediTime",
        "mailer_templates_recovery_content": linked_template(
            "Reinitialisez votre mot de passe",
            "Vous avez demande la reinitialisation de votre mot de passe MediTime.",
            "Reinitialiser mon mot de passe",
        ),
        "mailer_subjects_invite": "Invitation a rejoindre MediTime",
        "mailer_templates_invite_content": linked_template(
            "Vous etes invite sur MediTime",
            "Vous avez recu une invitation a creer un compte MediTime.",
            "Accepter l'invitation",
        ),
        "mailer_subjects_email_change": "Confirmez votre changement d'adresse e-mail",
        "mailer_templates_email_change_content": layout(
            "Confirmez votre changement d'adresse e-mail",
            [
                paragraph(
                    "Confirmez la modification de votre adresse e-mail MediTime vers {{ .NewEmail }}."
                ),
                action("Confirmer le changement", "{{ .ConfirmationURL }}"),
                link_fallback("{{ .ConfirmationURL }}"),
            ],
        ),
        "mailer_subjects_reauthentication": "Code de verification MediTime",
        "mailer_templates_reauthentication_content": layout(
            "Confirmez votre identite",
            [
                paragraph("Saisissez ce code dans MediTime pour confirmer cette action sensible."),
                code_block(),
                paragraph("Ce code est temporaire. Ne le partagez avec personne."),
            ],
        ),
        "mailer_notifications_password_changed_enabled": True,
        "mailer_subjects_password_changed_notification": "Votre mot de passe MediTime a ete modifie",
        "mailer_templates_password_changed_notification_content": security_template(
            "Mot de passe modifie",
            "Le mot de passe du compte {{ .Email }} vient d'etre modifie.",
        ),
        "mailer_notifications_email_changed_enabled": True,
        "mailer_subjects_email_changed_notification": "Votre adresse e-mail MediTime a ete modifiee",
        "mailer_templates_email_changed_notification_content": security_template(
            "Adresse e-mail modifiee",
            "L'adresse e-mail de votre compte a ete modifiee de {{ .OldEmail }} vers {{ .Email }}.",
        ),
        "mailer_notifications_phone_changed_enabled": True,
        "mailer_subjects_phone_changed_notification": "Votre numero de telephone MediTime a ete modifie",
        "mailer_templates_phone_changed_notification_content": security_template(
            "Numero de telephone modifie",
            "Le numero de telephone du compte {{ .Email }} a ete modifie de {{ .OldPhone }} vers {{ .Phone }}.",
        ),
        "mailer_notifications_mfa_factor_enrolled_enabled": True,
        "mailer_subjects_mfa_factor_enrolled_notification": "Nouvelle methode MFA ajoutee sur MediTime",
        "mailer_templates_mfa_factor_enrolled_notification_content": security_template(
            "Nouvelle methode MFA ajoutee",
            "Une nouvelle methode MFA ({{ .FactorType }}) a ete ajoutee au compte {{ .Email }}.",
        ),
        "mailer_notifications_mfa_factor_unenrolled_enabled": True,
        "mailer_subjects_mfa_factor_unenrolled_notification": "Methode MFA retiree sur MediTime",
        "mailer_templates_mfa_factor_unenrolled_notification_content": security_template(
            "Methode MFA retiree",
            "Une methode MFA ({{ .FactorType }}) a ete retiree du compte {{ .Email }}.",
        ),
        "mailer_notifications_identity_linked_enabled": True,
        "mailer_subjects_identity_linked_notification": "Nouvelle identite liee a votre compte MediTime",
        "mailer_templates_identity_linked_notification_content": security_template(
            "Nouvelle identite liee",
            "Une nouvelle identite {{ .Provider }} a ete liee au compte {{ .Email }}.",
        ),
        "mailer_notifications_identity_unlinked_enabled": True,
        "mailer_subjects_identity_unlinked_notification": "Identite retiree de votre compte MediTime",
        "mailer_templates_identity_unlinked_notification_content": security_template(
            "Identite retiree",
            "Une identite {{ .Provider }} a ete retiree du compte {{ .Email }}.",
        ),
    }


def derive_project_ref(supabase_url: str | None) -> str | None:
    if not supabase_url:
        return None
    hostname = urlparse(supabase_url).hostname or ""
    if hostname.endswith(".supabase.co"):
        return hostname.split(".", 1)[0]
    return None


def auth_headers(access_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "User-Agent": USER_AGENT,
    }


def fetch_auth_config(project_ref: str, access_token: str) -> dict[str, object]:
    request = urllib.request.Request(
        f"{API_BASE}/projects/{project_ref}/config/auth",
        headers=auth_headers(access_token),
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase API returned {error.code}: {body}") from error


def apply_templates(project_ref: str, access_token: str, payload: dict[str, object]) -> None:
    headers = auth_headers(access_token)
    headers["Content-Type"] = "application/json"
    request = urllib.request.Request(
        f"{API_BASE}/projects/{project_ref}/config/auth",
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response.read()
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase API returned {error.code}: {body}") from error

    current_config = fetch_auth_config(project_ref, access_token)
    mismatches = [
        key
        for key, expected_value in payload.items()
        if current_config.get(key) != expected_value
    ]
    if mismatches:
        raise RuntimeError(
            "Supabase verification failed for keys: " + ", ".join(sorted(mismatches))
        )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Print the payload instead of applying it.")
    parser.add_argument("--project-ref", default=os.getenv("PROJECT_REF"))
    parser.add_argument("--access-token", default=os.getenv("SUPABASE_ACCESS_TOKEN"))
    args = parser.parse_args()

    project_ref = args.project_ref or derive_project_ref(os.getenv("SUPABASE_URL"))
    payload = build_payload()

    if args.dry_run:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    if not project_ref:
        print("Missing PROJECT_REF or SUPABASE_URL.", file=sys.stderr)
        return 2
    if not args.access_token:
        print("Missing SUPABASE_ACCESS_TOKEN.", file=sys.stderr)
        return 2

    apply_templates(project_ref, args.access_token, payload)
    print(
        f"Applied and verified {len(payload)} Supabase auth email template settings "
        f"to project {project_ref}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
