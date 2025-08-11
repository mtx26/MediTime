from .. import api
from app.services.calendar import verify_calendar_share
from ..medicines_common import register_medicine_routes

ERROR_CALENDAR_NOT_FOUND = "calendrier non trouvé"

register_medicine_routes(
    api,
    "/shared/users/calendars/<calendar_id>",
    verify_calendar_share,
    ERROR_CALENDAR_NOT_FOUND,
)
