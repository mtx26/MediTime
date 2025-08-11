from .. import api
from app.services.calendar import verify_calendar
from ..medicines_common import register_medicine_routes

ERROR_UNAUTHORIZED_ACCESS = "accès refusé"

register_medicine_routes(
    api,
    "/calendars/<calendar_id>",
    verify_calendar,
    ERROR_UNAUTHORIZED_ACCESS,
)
