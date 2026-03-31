from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.certification import router as certification_router
from app.api.v1.chatroom import router as chatroom_router
from app.api.v1.competitions import router as competitions_router
from app.api.v1.course_support import router as course_support_router
from app.api.v1.courses import router as courses_router
from app.api.v1.enrollments import router as enrollments_router
from app.api.v1.feed import router as feed_router
from app.api.v1.help_support import router as help_support_router
from app.api.v1.library import router as library_router
from app.api.v1.planner import router as planner_router
from app.api.v1.rent_lab import router as rent_lab_router
from app.api.v1.research import router as research_router
from app.api.v1.schools import router as schools_router
from app.api.v1.specialization import router as specialization_router
from app.api.v1.system import router as system_router
from app.api.v1.tutorials import router as tutorials_router

api_router = APIRouter()
api_router.include_router(system_router)
api_router.include_router(auth_router)
api_router.include_router(feed_router)
api_router.include_router(schools_router)
api_router.include_router(courses_router)
api_router.include_router(enrollments_router)
api_router.include_router(planner_router)
api_router.include_router(certification_router)
api_router.include_router(chatroom_router)
api_router.include_router(tutorials_router)
api_router.include_router(research_router)
api_router.include_router(competitions_router)
api_router.include_router(specialization_router)
api_router.include_router(library_router)
api_router.include_router(course_support_router)
api_router.include_router(rent_lab_router)
api_router.include_router(help_support_router)
