from . import api
from flask import request, g
from app.utils.auth import require_auth
from app.utils.responses import success_response, error_response, warning_response
from app.config import Config
import requests
import time

@api.route("/auth/invite", methods=["POST"])
@require_auth
def handle_invite_user():
    try:
        t_0 = time.time()
        email = request.get_json(force=True).get("email")
        if not email:
            return warning_response(
                message="email manquant",
                code="EMAIL_REQUIRED",
                status_code=400,
                uid=g.uid,
                origin="AUTH_INVITE",
            )

        url = f"{Config.SUPABASE_PROJECT_URL}/auth/v1/admin/invite"
        headers = {
            "apikey": Config.SUPABASE_SERVICE_ROLE_KEY or "",
            "Authorization": f"Bearer {Config.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "email": email,
            "redirect_to": f"{Config.FRONTEND_URL}/auth/callback",
        }
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        if res.status_code >= 400:
            error_message = res.json().get("msg", res.text)
            return error_response(
                message="erreur lors de l'envoi de l'invitation",
                code="INVITE_USER_ERROR",
                status_code=res.status_code,
                uid=g.uid,
                origin="AUTH_INVITE",
                error=error_message,
                log_extra={"email": email},
            )

        t_1 = time.time()
        return success_response(
            message="invitation envoyée",
            code="INVITE_USER_SUCCESS",
            uid=g.uid,
            origin="AUTH_INVITE",
            log_extra={"email": email, "time": t_1 - t_0},
        )
    except Exception as e:
        return error_response(
            message="erreur lors de l'envoi de l'invitation",
            code="INVITE_USER_ERROR",
            status_code=500,
            uid=g.uid,
            origin="AUTH_INVITE",
            error=str(e),
            log_extra={"email": email if 'email' in locals() else None},
        )

