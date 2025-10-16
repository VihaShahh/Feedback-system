from .activity import router as activity
from .auth import router as auth
from .cycles import router as cycles
from .feedback import router as feedback
from .goals import router as goals
from .health import router as health
from .people import router as people

routers = [health, auth, people, feedback, activity, cycles, goals]
