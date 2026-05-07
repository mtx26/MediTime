import traceback
from typing import Iterable

import requests

from app.services.notifications.messaging.send_fcm import delete_fcm_token
from app.utils.logging import log_backend


EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
MAX_EXPO_BATCH_SIZE = 100


def is_expo_push_token(token: str) -> bool:
    return token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken[")


def _chunk_tokens(tokens: list[str], chunk_size: int) -> Iterable[list[str]]:
    for index in range(0, len(tokens), chunk_size):
        yield tokens[index:index + chunk_size]


def _create_expo_message(token: str, title: str, body: str, context: dict) -> dict:
    return {
        "to": token,
        "title": title,
        "body": body,
        "sound": "default",
        "channelId": "default",
        "data": {
            "link": context.get("link") or "/notifications",
            "notificationType": context.get("notification_type"),
            "calendarId": context.get("calendar_id"),
            "sharedCalendarId": context.get("shared_calendar_id"),
            "medicationId": context.get("medication_id"),
        },
    }


def send_expo_notification(tokens: list[str], title: str, body: str, context: dict):
    if not tokens:
        return

    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
    }

    for token_batch in _chunk_tokens(tokens, MAX_EXPO_BATCH_SIZE):
        payload = [_create_expo_message(token, title, body, context) for token in token_batch]

        try:
            response = requests.post(EXPO_PUSH_URL, headers=headers, json=payload, timeout=15)
            data = response.json()
        except Exception:
            log_backend.error(
                "Erreur send_expo_notification",
                {
                    "origin": "EXPO_PUSH",
                    "code": "EXPO_PUSH_SEND_ERROR",
                    "error": traceback.format_exc(),
                },
            )
            continue

        tickets = data.get("data") if isinstance(data, dict) else None
        if response.status_code != 200 or not isinstance(tickets, list):
            log_backend.error(
                "Erreur Expo Push HTTP",
                {
                    "origin": "EXPO_PUSH",
                    "code": "EXPO_PUSH_HTTP_ERROR",
                    "status_code": response.status_code,
                    "error": data,
                },
            )
            continue

        for token, ticket in zip(token_batch, tickets):
            status = ticket.get("status") if isinstance(ticket, dict) else None
            details = ticket.get("details") if isinstance(ticket, dict) else None
            error_code = details.get("error") if isinstance(details, dict) else None

            if status == "ok":
                log_backend.info(
                    "Notification Expo envoyee avec succes",
                    {
                        "origin": "EXPO_PUSH",
                        "code": "EXPO_PUSH_SEND_SUCCESS",
                        "token": token,
                    },
                )
                continue

            if error_code == "DeviceNotRegistered":
                delete_fcm_token(token)
                log_backend.info(
                    "Token Expo supprime car le device n est plus enregistre",
                    {
                        "origin": "EXPO_PUSH",
                        "code": "EXPO_PUSH_TOKEN_DELETED",
                        "token": token,
                    },
                )
                continue

            log_backend.error(
                "Erreur Expo Push sur ticket",
                {
                    "origin": "EXPO_PUSH",
                    "code": "EXPO_PUSH_TICKET_ERROR",
                    "token": token,
                    "error": ticket,
                },
            )