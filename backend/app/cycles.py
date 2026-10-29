from datetime import date

from .errors import fail
from .models import Cycle


def require_open_cycle(db, cycle_id):
    if cycle_id is None:
        return
    cycle = db.get(Cycle, cycle_id)
    today = date.today().isoformat()
    if not cycle or cycle.state != "open" or not cycle.starts_on <= today <= cycle.ends_on:
        fail(409, "This review cycle is not open for feedback today")
