"""Topic battle service — creation and listing logic."""

from __future__ import annotations

import hashlib
import re
import statistics
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from app.core.config import get_settings as _settings
from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError
from app.domain.competitions.grading import grade_stored_question
from app.domain.competitions.repository import Repository
from app.domain.competitions.schemas import (
    AchievementResponse,
    ChampionshipCreateRequest,
    ChampionshipNextSeasonResponse,
    ChampionshipResponse,
    ChampionshipSeasonResponse,
    ChampionshipStageResponse,
    ChampionshipStandingResponse,
    CodingQuestionSchema,
    CompetitionGameResponse,
    CompetitionGamesResponse,
    CompetitionHubResponse,
    CompetitionModeResponse,
    DesignPayloadSchema,
    IntegrityEventRequest,
    IntegrityEventResponse,
    MarkdownPayloadSchema,
    TopicBattleAnswerRequest,
    TopicBattleAnswerResponse,
    TopicBattleCreateRequest,
    TopicBattleLeaderboardEntry,
    TopicBattleLeaderboardResponse,
    TopicBattleListResponse,
    TopicBattleResponse,
    UserStatusResponse,
)
from app.domain.competitions.wallet import WalletRepository
from app.domain.management_table.schemas import (
    ManagementTableInstanceBundleResponse,
    ManagementTableRowCellsPatchInput,
    ManagementTableRowListResponse,
    ManagementTableRowPublic,
)
from app.domain.management_table.service import ManagementTableService

# ################################ CONSTANTS ################################

# Proctoring signals that count toward the auto-flag threshold. Client-reported
# and therefore forgeable, which is why `record_integrity_event` only ever opens
# a review entry. `answer_pasted` is listed because pasting a pre-written or
# model-generated answer is the clearest single signal of an unattended attempt.
INTEGRITY_VIOLATION_TYPES: frozenset[str] = frozenset(
    {
        "tab_hidden",
        "window_blur",
        "fullscreen_exit",
        "answer_pasted",
        "copy_attempt",
    },
)

# Answers needed before a latency baseline is meaningful. With one or two samples
# there is no spread, so any variance rule would fire on pure noise.
MIN_LATENCY_BASELINE_SAMPLES = 4
# Server-side source of truth for the hub's game-mode cards.
DEFAULT_GAME_MODES: list[dict[str, object]] = [
    {
        "id": "topic-battles",
        "title": "Topic Battles",
        "description": (
            "Compete in structured challenges built around a single subject "
            "— from one topic to the podium."
        ),
        "action_label": "Enter Battle",
    },
    {
        "id": "championship",
        "title": "Championship",
        "description": ("Season-long knockout tournament. Climb the bracket and claim the crown."),
        "action_label": "Join Tournament",
    },
    {
        "id": "live-duels",
        "title": "Live Duels",
        "description": (
            "Real-time one-on-one battles against a live opponent. Fast, intense, instant results."
        ),
        "action_label": "Quick Match",
    },
]

_POINTS_PER_LEVEL = 100

_DIFFICULTY_POINTS: dict[str, int] = {
    "Easy": 10,
    "Intermediate": 25,
    "Hard": 50,
}

_HOST_POINTS = 10

_RANK_TIERS: list[tuple[int, str]] = [
    (1, "Bronze"),
    (5, "Silver"),
    (10, "Gold"),
    (15, "Platinum"),
    (20, "Diamond"),
    (25, "Champion"),
]

_ROMAN_NUMERALS = ["I", "II", "III", "IV", "V"]

# ── Demo topic-battle seeding (local dev only) ────────────────────────────
# Deterministic `_id`s so seeding is idempotent across restarts. Owners are
# resolved by email so the battles stay tied to real identity records.
_DEMO_OWNER_EMAIL = "demo@deltalabs.dev"
_OTHER_OWNER_EMAIL = "dink@gmail.com"

# Synthetic owners for battles the local dev user can join. These are not real
# accounts, so no login is created; they only give joinable battles a distinct
# host identity in the UI.
_DEMO_JOINABLE_OWNERS: dict[str, str] = {
    "Elena Okafor": "e0000000-0000-0000-0000-000000000001",
    "Tesfaye Mulu": "e0000000-0000-0000-0000-000000000002",
    "Aisha Bello": "e0000000-0000-0000-0000-000000000003",
    "Juan Rivera": "e0000000-0000-0000-0000-000000000004",
    "Sara Hailu": "e0000000-0000-0000-0000-000000000005",
    "Omar Farouk": "e0000000-0000-0000-0000-000000000006",
    "Lina Petrova": "e0000000-0000-0000-0000-000000000007",
    "Ken Nakamura": "e0000000-0000-0000-0000-000000000008",
    "Grace Adeyemi": "e0000000-0000-0000-0000-000000000009",
}


def _test_case(
    *,
    test_input: str,
    expected_output: str,
    explanation: str = "",
    is_sample: bool = False,
    is_hidden: bool = False,
) -> dict[str, object]:
    return {
        "input": test_input,
        "expected_output": expected_output,
        "explanation": explanation,
        "is_sample": is_sample,
        "is_hidden": is_hidden,
    }


def _coding_question(
    *,
    qid: str,
    title: str,
    description: str,
    code_template: str,
    language: str,
    difficulty: str,
    time_limit_minutes: int,
    points: float,
    hint_text: str,
    test_cases: list[dict[str, object]],
) -> dict[str, object]:
    return {
        "id": qid,
        "title": title,
        "description": description,
        "code_template": code_template,
        "language": language,
        "difficulty": difficulty,
        "time_limit_minutes": time_limit_minutes,
        "points": points,
        "hint_enabled": bool(hint_text),
        "hint_text": hint_text,
        "test_cases": test_cases,
    }


# ── Rich demo-battle catalog ──────────────────────────────────────────────
# `owner` is "self" (resolved to _OTHER_OWNER_EMAIL), "demo" (resolved to
# _DEMO_OWNER_EMAIL), or a synthetic owner id from _DEMO_JOINABLE_OWNERS.
# `countdown_minutes` (optional) makes the card timer tick. `joined_by_self`
# marks a battle the local user has already joined (hasJoined = true).
_DEMO_BATTLE_SEEDS: list[dict[str, Any]] = [
    {
        "id": "tb_demo_seed_owned",
        "title": "Logic Gates Throwdown",
        "subject": "Computer Science",
        "difficulty": "Intermediate",
        "status": "filling",
        "countdown_minutes": 50,
        "creator_name": "You",
        "owner": "demo",
        "prize_pool": "500 ETB",
        "entry_fee": "Free",
        "players_max": 4,
        "questions": [
            _coding_question(
                qid="q_seed_nand",
                title="Implement a NAND gate",
                description="Return the NAND of two booleans.",
                code_template=("function nandGate(a, b) {\n  // your code here\n}"),
                language="JavaScript",
                difficulty="Intermediate",
                time_limit_minutes=15,
                points=25.0,
                hint_text="NAND is NOT AND.",
                test_cases=[
                    _test_case(
                        test_input="false, false",
                        expected_output="true",
                        explanation="NAND is NOT AND.",
                        is_sample=True,
                    ),
                    _test_case(test_input="true, true", expected_output="false", is_hidden=True),
                ],
            ),
            _coding_question(
                qid="q_seed_fizzbuzz",
                title="FizzBuzz",
                description=(
                    "Return 'Fizz' for multiples of 3, 'Buzz' for multiples of 5, "
                    "'FizzBuzz' for both, else the number."
                ),
                code_template=("function fizzBuzz(n) {\n  // your code here\n}"),
                language="JavaScript",
                difficulty="Easy",
                time_limit_minutes=10,
                points=10.0,
                hint_text="Check divisibility by 15 first.",
                test_cases=[
                    _test_case(
                        test_input="3",
                        expected_output="Fizz",
                        explanation="3 is divisible by 3.",
                        is_sample=True,
                    ),
                    _test_case(test_input="15", expected_output="FizzBuzz"),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_seed_other",
        "title": "Linear Algebra Sprint",
        "subject": "Mathematics",
        "difficulty": "Easy",
        "status": "filling",
        "countdown_minutes": 90,
        "creator_name": "You",
        "owner": "self",
        "prize_pool": "750 ETB",
        "entry_fee": "Free",
        "players_max": 4,
        "questions": [
            _coding_question(
                qid="q_seed_det",
                title="Matrix determinant (2x2)",
                description="Return the determinant of a 2x2 matrix given as a list of lists.",
                code_template=("def determinant(matrix):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Easy",
                time_limit_minutes=15,
                points=15.0,
                hint_text="ad - bc.",
                test_cases=[
                    _test_case(
                        test_input="[[1, 2], [3, 4]]",
                        expected_output="-2",
                        explanation="1*4 - 2*3 = -2.",
                        is_sample=True,
                    ),
                ],
            ),
            _coding_question(
                qid="q_seed_dot",
                title="Vector dot product",
                description="Return the dot product of two equal-length integer vectors.",
                code_template=("def dot(a, b):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Intermediate",
                time_limit_minutes=15,
                points=20.0,
                hint_text="Sum of pairwise products.",
                test_cases=[
                    _test_case(
                        test_input="[1, 2], [3, 4]",
                        expected_output="11",
                        explanation="1*3 + 2*4 = 11.",
                        is_sample=True,
                    ),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_math_olympiad",
        "title": "National Math Olympiad Warm-up",
        "subject": "Mathematics",
        "difficulty": "Intermediate",
        "status": "filling",
        "countdown_minutes": 45,
        "creator_name": "You",
        "owner": "self",
        "prize_pool": "2,500 ETB",
        "entry_fee": "Free",
        "players_max": 8,
        "questions": [
            _coding_question(
                qid="q_oly_prime",
                title="Prime checker",
                description="Return True when n is a prime number, else False.",
                code_template=("def is_prime(n):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Easy",
                time_limit_minutes=15,
                points=15.0,
                hint_text="Check divisors up to sqrt(n).",
                test_cases=[
                    _test_case(
                        test_input="2",
                        expected_output="True",
                        explanation="2 is prime.",
                        is_sample=True,
                    ),
                    _test_case(
                        test_input="15",
                        expected_output="False",
                        explanation="15 = 3 * 5.",
                        is_hidden=True,
                    ),
                ],
            ),
            _coding_question(
                qid="q_oly_fact",
                title="Factorial (recursive)",
                description="Return n! using recursion.",
                code_template=("def factorial(n):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Easy",
                time_limit_minutes=15,
                points=10.0,
                hint_text="factorial(n) = n * factorial(n - 1).",
                test_cases=[
                    _test_case(
                        test_input="5",
                        expected_output="120",
                        explanation="5! = 120.",
                        is_sample=True,
                    ),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_ml_club",
        "title": "ML Club Hack: Trees vs Forests",
        "subject": "Computer Science",
        "difficulty": "Hard",
        "status": "live",
        "countdown_minutes": None,
        "creator_name": "You",
        "owner": "self",
        "prize_pool": "5,000 ETB",
        "entry_fee": "50 ETB",
        "players_max": 8,
        "questions": [
            _coding_question(
                qid="q_ml_gini",
                title="Gini impurity",
                description="Return the Gini impurity of a class label list, rounded to 4 digits.",
                code_template=("def gini(labels):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Hard",
                time_limit_minutes=25,
                points=50.0,
                hint_text="1 - sum(p^2) over class proportions.",
                test_cases=[
                    _test_case(
                        test_input="['a','a','b']",
                        expected_output="0.4444",
                        explanation="1 - (4/9 + 1/9).",
                        is_sample=True,
                    ),
                    _test_case(
                        test_input="['a','a']",
                        expected_output="0.0",
                        explanation="Pure node.",
                        is_hidden=True,
                    ),
                ],
            ),
            _coding_question(
                qid="q_ml_entropy",
                title="Binary entropy",
                description="Return the Shannon entropy (bits) of a binary label list.",
                code_template=("def entropy(labels):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Hard",
                time_limit_minutes=25,
                points=50.0,
                hint_text="-sum(p * log2(p)).",
                test_cases=[
                    _test_case(
                        test_input="['a','a','b','b']",
                        expected_output="1.0",
                        explanation="Two equally likely classes.",
                        is_sample=True,
                    ),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_chem_quiz",
        "title": "Acids & Bases Rapid Fire",
        "subject": "Chemistry",
        "difficulty": "Easy",
        "status": "scheduled",
        "countdown_minutes": 300,
        "creator_name": "You",
        "owner": "self",
        "prize_pool": "800 ETB",
        "entry_fee": "10 ETB",
        "players_max": 6,
        "questions": [
            _coding_question(
                qid="q_chem_ph",
                title="pH category",
                description="Return 'acid', 'neutral' or 'base' for a given pH value.",
                code_template=("def ph_category(ph):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Easy",
                time_limit_minutes=10,
                points=10.0,
                hint_text="pH 7 is neutral; lower is acidic, higher is basic.",
                test_cases=[
                    _test_case(
                        test_input="3",
                        expected_output="acid",
                        explanation="Below 7.",
                        is_sample=True,
                    ),
                    _test_case(test_input="7", expected_output="neutral"),
                    _test_case(test_input="12", expected_output="base", is_hidden=True),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_js_basics",
        "title": "JavaScript Basics Bootcamp",
        "subject": "Computer Science",
        "difficulty": "Easy",
        "status": "filling",
        "countdown_minutes": 60,
        "creator_name": "Elena Okafor",
        "owner": "e0000000-0000-0000-0000-000000000001",
        "prize_pool": "500 ETB",
        "entry_fee": "Free",
        "players_max": 4,
        "questions": [
            _coding_question(
                qid="q_js_nand",
                title="Implement a NAND gate",
                description="Return the NAND of two booleans.",
                code_template=("function nandGate(a, b) {\n  // your code here\n}"),
                language="JavaScript",
                difficulty="Easy",
                time_limit_minutes=15,
                points=10.0,
                hint_text="NAND is NOT AND.",
                test_cases=[
                    _test_case(
                        test_input="false, false",
                        expected_output="true",
                        explanation="NAND is NOT AND.",
                        is_sample=True,
                    ),
                    _test_case(test_input="true, true", expected_output="false", is_hidden=True),
                ],
            ),
            _coding_question(
                qid="q_js_fizzbuzz",
                title="FizzBuzz",
                description="Return the FizzBuzz value for a number n.",
                code_template=("function fizzBuzz(n) {\n  // your code here\n}"),
                language="JavaScript",
                difficulty="Easy",
                time_limit_minutes=10,
                points=10.0,
                hint_text="Check divisibility by 15 first.",
                test_cases=[
                    _test_case(
                        test_input="3",
                        expected_output="Fizz",
                        explanation="3 is divisible by 3.",
                        is_sample=True,
                    ),
                    _test_case(test_input="15", expected_output="FizzBuzz"),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_phy_relativity",
        "title": "Special Relativity Starter",
        "subject": "Physics",
        "difficulty": "Intermediate",
        "status": "filling",
        "countdown_minutes": 20,
        "creator_name": "Elena Okafor",
        "owner": "e0000000-0000-0000-0000-000000000001",
        "prize_pool": "1,200 ETB",
        "entry_fee": "Free",
        "players_max": 4,
        "questions": [
            _coding_question(
                qid="q_rel_lorentz",
                title="Lorentz factor",
                description="Return gamma = 1 / sqrt(1 - v^2/c^2), rounded to 4 decimals.",
                code_template=(
                    "import math\ndef lorentz_factor(v, c=1.0):\n    # your code here\n    pass\n"
                ),
                language="Python",
                difficulty="Intermediate",
                time_limit_minutes=20,
                points=25.0,
                hint_text="gamma = 1 / sqrt(1 - (v/c)**2).",
                test_cases=[
                    _test_case(
                        test_input="0, 1",
                        expected_output="1.0",
                        explanation="Stationary frame.",
                        is_sample=True,
                    ),
                    _test_case(
                        test_input="0.6, 1",
                        expected_output="1.25",
                        explanation="1 / sqrt(0.64).",
                        is_hidden=True,
                    ),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_alg_fib",
        "title": "Fibonacci & Friends",
        "subject": "Computer Science",
        "difficulty": "Easy",
        "status": "filling",
        "countdown_minutes": 60,
        "creator_name": "Tesfaye Mulu",
        "owner": "e0000000-0000-0000-0000-000000000002",
        "prize_pool": "600 ETB",
        "entry_fee": "Free",
        "players_max": 4,
        "joined_by_self": True,
        "questions": [
            _coding_question(
                qid="q_fib_rec",
                title="Nth Fibonacci (recursive)",
                description="Return the n-th Fibonacci number (0-indexed).",
                code_template=("def fib(n):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Easy",
                time_limit_minutes=15,
                points=10.0,
                hint_text="fib(0) = 0, fib(1) = 1.",
                test_cases=[
                    _test_case(
                        test_input="0",
                        expected_output="0",
                        explanation="Base case.",
                        is_sample=True,
                    ),
                    _test_case(test_input="10", expected_output="55", is_hidden=True),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_bio_cells",
        "title": "Cell Biology Scramble",
        "subject": "Biology",
        "difficulty": "Easy",
        "status": "filling",
        "countdown_minutes": 15,
        "creator_name": "Aisha Bello",
        "owner": "e0000000-0000-0000-0000-000000000003",
        "prize_pool": "900 ETB",
        "entry_fee": "Free",
        "players_max": 6,
        "questions": [
            _coding_question(
                qid="q_cell_organelle",
                title="Organelle detector",
                description="Return the organelle that matches the given function hint.",
                code_template=("def organelle(hint):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Easy",
                time_limit_minutes=10,
                points=10.0,
                hint_text="Map 'powerhouse' and 'protein factory'.",
                test_cases=[
                    _test_case(
                        test_input="powerhouse",
                        expected_output="mitochondria",
                        explanation="Site of ATP production.",
                        is_sample=True,
                    ),
                    _test_case(
                        test_input="protein factory", expected_output="ribosome", is_hidden=True
                    ),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_hist_ww2",
        "title": "World War II Timeline",
        "subject": "History",
        "difficulty": "Easy",
        "status": "filling",
        "countdown_minutes": 90,
        "creator_name": "Juan Rivera",
        "owner": "e0000000-0000-0000-0000-000000000004",
        "prize_pool": "750 ETB",
        "entry_fee": "Free",
        "players_max": 4,
        "questions": [
            _coding_question(
                qid="q_hist_decade",
                title="Decade of a year",
                description="Return the decade label for a year, e.g. '1930s'.",
                code_template=("def decade(year):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Easy",
                time_limit_minutes=10,
                points=10.0,
                hint_text="Floor the year to the nearest decade.",
                test_cases=[
                    _test_case(
                        test_input="1939",
                        expected_output="1930s",
                        explanation="WWII began in 1939.",
                        is_sample=True,
                    ),
                    _test_case(test_input="2000", expected_output="2000s", is_hidden=True),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_geo_rivers",
        "title": "World Rivers & Basins",
        "subject": "Geography",
        "difficulty": "Intermediate",
        "status": "filling",
        "countdown_minutes": 30,
        "creator_name": "Sara Hailu",
        "owner": "e0000000-0000-0000-0000-000000000005",
        "prize_pool": "1,000 ETB",
        "entry_fee": "15 ETB",
        "players_max": 8,
        "questions": [
            _coding_question(
                qid="q_geo_haversine",
                title="Haversine distance (km)",
                description="Return the great-circle distance in km rounded to 1 decimal.",
                code_template=(
                    "import math\n"
                    "def distance_km(lat1, lon1, lat2, lon2):\n"
                    "    # your code here\n"
                    "    pass\n"
                ),
                language="Python",
                difficulty="Intermediate",
                time_limit_minutes=25,
                points=25.0,
                hint_text="Use R = 6371 km and radians.",
                test_cases=[
                    _test_case(
                        test_input="0, 0, 0, 90",
                        expected_output="10007.5",
                        explanation="Quarter meridian arc.",
                        is_sample=True,
                    ),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_econ_supply",
        "title": "Supply & Demand Shifts",
        "subject": "Economics",
        "difficulty": "Intermediate",
        "status": "filling",
        "countdown_minutes": 40,
        "creator_name": "Omar Farouk",
        "owner": "e0000000-0000-0000-0000-000000000006",
        "prize_pool": "1,400 ETB",
        "entry_fee": "20 ETB",
        "players_max": 4,
        "questions": [
            _coding_question(
                qid="q_econ_elasticity",
                title="Price elasticity of demand",
                description="Return %dQ / %dP rounded to 1 decimal.",
                code_template=(
                    "def elasticity(pct_change_qty, pct_change_price):\n"
                    "    # your code here\n"
                    "    pass\n"
                ),
                language="Python",
                difficulty="Intermediate",
                time_limit_minutes=15,
                points=25.0,
                hint_text="Elasticity = pct_qty / pct_price.",
                test_cases=[
                    _test_case(
                        test_input="10, 5",
                        expected_output="2.0",
                        explanation="Elastic demand.",
                        is_sample=True,
                    ),
                    _test_case(test_input="8, 4", expected_output="2.0", is_hidden=True),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_ast_planets",
        "title": "Exoplanet Hunter",
        "subject": "Astronomy",
        "difficulty": "Hard",
        "status": "filling",
        "countdown_minutes": 75,
        "creator_name": "Lina Petrova",
        "owner": "e0000000-0000-0000-0000-000000000007",
        "prize_pool": "3,200 ETB",
        "entry_fee": "Free",
        "players_max": 4,
        "questions": [
            _coding_question(
                qid="q_ast_kepler",
                title="Kepler's third law",
                description="Return the orbital period in years for semi-major axis a (AU).",
                code_template=(
                    "import math\ndef orbital_period_years(a):\n    # your code here\n    pass\n"
                ),
                language="Python",
                difficulty="Hard",
                time_limit_minutes=20,
                points=50.0,
                hint_text="T = sqrt(a^3).",
                test_cases=[
                    _test_case(
                        test_input="1",
                        expected_output="1.0",
                        explanation="Earth's orbit.",
                        is_sample=True,
                    ),
                    _test_case(
                        test_input="4",
                        expected_output="8.0",
                        explanation="T^2 = a^3.",
                        is_hidden=True,
                    ),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_ast_scheduled",
        "title": "Solar System Scavenger",
        "subject": "Astronomy",
        "difficulty": "Intermediate",
        "status": "scheduled",
        "countdown_minutes": 240,
        "creator_name": "Lina Petrova",
        "owner": "e0000000-0000-0000-0000-000000000007",
        "prize_pool": "1,600 ETB",
        "entry_fee": "Free",
        "players_max": 4,
        "questions": [
            _coding_question(
                qid="q_ast_au",
                title="AU to km converter",
                description="Return AU * 149.6 rounded to 1 decimal.",
                code_template=("def au_to_km(au):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Intermediate",
                time_limit_minutes=10,
                points=25.0,
                hint_text="1 AU = 149.6 million km.",
                test_cases=[
                    _test_case(
                        test_input="1",
                        expected_output="149.6",
                        explanation="1 AU in million km.",
                        is_sample=True,
                    ),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_alg_sorting",
        "title": "Sorting Algorithms Duel",
        "subject": "Computer Science",
        "difficulty": "Intermediate",
        "status": "filling",
        "countdown_minutes": 25,
        "creator_name": "Ken Nakamura",
        "owner": "e0000000-0000-0000-0000-000000000008",
        "prize_pool": "1,800 ETB",
        "entry_fee": "25 ETB",
        "players_max": 8,
        "questions": [
            _coding_question(
                qid="q_sort_bubble",
                title="Bubble sort",
                description="Return the array sorted in ascending order.",
                code_template=("function bubbleSort(arr) {\n  // your code here\n}"),
                language="JavaScript",
                difficulty="Intermediate",
                time_limit_minutes=20,
                points=25.0,
                hint_text="Swap adjacent out-of-order pairs.",
                test_cases=[
                    _test_case(
                        test_input="[3, 1, 2]",
                        expected_output="[1, 2, 3]",
                        explanation="Sorted ascending.",
                        is_sample=True,
                    ),
                ],
            ),
            _coding_question(
                qid="q_sort_merge",
                title="Merge two sorted lists",
                description="Return the merge of two ascending integer lists.",
                code_template=("def merge(a, b):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Intermediate",
                time_limit_minutes=15,
                points=25.0,
                hint_text="Walk both lists with two pointers.",
                test_cases=[
                    _test_case(
                        test_input="[1, 3], [2, 4]",
                        expected_output="[1, 2, 3, 4]",
                        explanation="Merged.",
                        is_sample=True,
                    ),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_lit_poetry",
        "title": "Poetry Meter Challenge",
        "subject": "Literature",
        "difficulty": "Easy",
        "status": "scheduled",
        "countdown_minutes": 180,
        "creator_name": "Grace Adeyemi",
        "owner": "e0000000-0000-0000-0000-000000000009",
        "prize_pool": "500 ETB",
        "entry_fee": "Free",
        "players_max": 4,
        "questions": [
            _coding_question(
                qid="q_lit_syllables",
                title="Syllable counter",
                description="Return a simple vowel-group syllable count for a word.",
                code_template=("def count_syllables(word):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Easy",
                time_limit_minutes=10,
                points=10.0,
                hint_text="Count runs of vowels.",
                test_cases=[
                    _test_case(
                        test_input="poetry",
                        expected_output="3",
                        explanation="po-e-try.",
                        is_sample=True,
                    ),
                    _test_case(test_input="cat", expected_output="1", is_hidden=True),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_phy_full",
        "title": "Thermodynamics Gauntlet",
        "subject": "Physics",
        "difficulty": "Hard",
        "status": "filling",
        "countdown_minutes": None,
        "creator_name": "Elena Okafor",
        "owner": "e0000000-0000-0000-0000-000000000001",
        "prize_pool": "4,000 ETB",
        "entry_fee": "75 ETB",
        "players_max": 8,
        "questions": [
            _coding_question(
                qid="q_thermo_carnot",
                title="Carnot efficiency",
                description="Return 1 - T_cold / T_hot rounded to 4 decimals.",
                code_template=(
                    "def carnot_efficiency(t_hot, t_cold):\n    # your code here\n    pass\n"
                ),
                language="Python",
                difficulty="Hard",
                time_limit_minutes=20,
                points=50.0,
                hint_text="efficiency = 1 - T_cold / T_hot.",
                test_cases=[
                    _test_case(
                        test_input="600, 300",
                        expected_output="0.5",
                        explanation="Carnot limit.",
                        is_sample=True,
                    ),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_alg_live",
        "title": "Recursion Race",
        "subject": "Computer Science",
        "difficulty": "Hard",
        "status": "live",
        "countdown_minutes": None,
        "creator_name": "Ken Nakamura",
        "owner": "e0000000-0000-0000-0000-000000000008",
        "prize_pool": "2,700 ETB",
        "entry_fee": "Free",
        "players_max": 8,
        "questions": [
            _coding_question(
                qid="q_rec_hanoi",
                title="Tower of Hanoi moves",
                description="Return the minimum moves to solve Hanoi for n disks.",
                code_template=("def hanoi_moves(n):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Hard",
                time_limit_minutes=15,
                points=50.0,
                hint_text="moves = 2^n - 1.",
                test_cases=[
                    _test_case(
                        test_input="3", expected_output="7", explanation="2^3 - 1.", is_sample=True
                    ),
                    _test_case(test_input="5", expected_output="31", is_hidden=True),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_bio_finished",
        "title": "DNA Replication Retro",
        "subject": "Biology",
        "difficulty": "Easy",
        "status": "finished",
        "countdown_minutes": None,
        "creator_name": "Aisha Bello",
        "owner": "e0000000-0000-0000-0000-000000000003",
        "prize_pool": "1,100 ETB",
        "entry_fee": "Free",
        "players_max": 4,
        "questions": [
            _coding_question(
                qid="q_dna_comp",
                title="DNA complement",
                description="Return the complement of a DNA sequence (A<->T, C<->G).",
                code_template=("def dna_complement(sequence):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Easy",
                time_limit_minutes=15,
                points=10.0,
                hint_text="Map each base to its pair.",
                test_cases=[
                    _test_case(
                        test_input="ATCG",
                        expected_output="TAGC",
                        explanation="Base pairing.",
                        is_sample=True,
                    ),
                ],
            ),
        ],
    },
    {
        "id": "tb_demo_math_finished",
        "title": "Calculus Basics Bash",
        "subject": "Mathematics",
        "difficulty": "Intermediate",
        "status": "finished",
        "countdown_minutes": None,
        "creator_name": "Tesfaye Mulu",
        "owner": "e0000000-0000-0000-0000-000000000002",
        "prize_pool": "1,500 ETB",
        "entry_fee": "Free",
        "players_max": 4,
        "questions": [
            _coding_question(
                qid="q_calc_deriv",
                title="Derivative of x^n",
                description="Return the derivative 'nx^(n-1)' for a power function.",
                code_template=("def derivative(n):\n    # your code here\n    pass\n"),
                language="Python",
                difficulty="Intermediate",
                time_limit_minutes=10,
                points=25.0,
                hint_text="d/dx x^n = n*x^(n-1).",
                test_cases=[
                    _test_case(
                        test_input="3",
                        expected_output="3x^2",
                        explanation="n * x^(n-1).",
                        is_sample=True,
                    ),
                ],
            ),
        ],
    },
]

# ── Demo championship (local dev) ─────────────────────────────────────────
# Deterministic "Season 3" snapshot. The active stage is `unlocked`; finishing
# it and the remaining stages completes the season and unlocks Season 4.
# `player_rank` / `total_players` are placeholders: `get_championship` always
# overwrites them with the real ladder computed from stored user stats.
_DEMO_CHAMPIONSHIP_SEASON: dict[str, object] = {
    "id": "season_demo_3",
    "number": 3,
    "title": "Rise of the Titans",
    "status": "active",
    "starts_at": "2026-09-01T00:00:00Z",
    "ends_at": "2026-11-30T23:59:59Z",
    "total_stages": 5,
    "completed_stages": 2,
    "current_stage_order": 3,
    "points_earned": 500,
    "total_points": 1000,
    "player_rank": 0,
    "total_players": 0,
}

_DEMO_CHAMPIONSHIP_STAGES: list[dict[str, object]] = [
    {
        "id": "stage_3_r1",
        "order": 1,
        "name": "Qualifier Round",
        "short_label": "R1",
        "status": "completed",
        "starts_at": "2026-09-01T00:00:00Z",
        "points_to_earn": 200,
        "points_earned": 200,
        "battle_id": "tb_demo_math_olympiad",
        "entry_fee": "Free",
        "prize_pool": "ETB 12",
        "prize_etb": 12,
    },
    {
        "id": "stage_3_r2",
        "order": 2,
        "name": "Round of 32",
        "short_label": "R32",
        "status": "completed",
        "starts_at": "2026-09-15T00:00:00Z",
        "points_to_earn": 300,
        "points_earned": 300,
        "battle_id": "tb_demo_ml_club",
        "entry_fee": "Free",
        "prize_pool": "ETB 25",
        "prize_etb": 25,
    },
    {
        "id": "stage_3_r3",
        "order": 3,
        "name": "Round of 16",
        "short_label": "R16",
        "status": "unlocked",
        "starts_at": "2026-09-28T00:00:00Z",
        "points_to_earn": 200,
        "points_earned": 0,
        "is_current": True,
        "battle_id": "tb_demo_bio_cells",
        "entry_fee": "Free",
        "prize_pool": "ETB 50",
        "prize_etb": 50,
    },
    {
        "id": "stage_3_qf",
        "order": 4,
        "name": "Quarterfinals",
        "short_label": "QF",
        "status": "locked",
        "starts_at": "2026-10-12T00:00:00Z",
        "points_to_earn": 200,
        "points_earned": 0,
        "battle_id": "tb_demo_ast_planets",
        "entry_fee": "Free",
        "prize_pool": "ETB 100",
        "prize_etb": 100,
    },
    {
        "id": "stage_3_sf",
        "order": 5,
        "name": "Semifinals & Grand Final",
        "short_label": "F",
        "status": "locked",
        "starts_at": "2026-10-26T00:00:00Z",
        "points_to_earn": 100,
        "points_earned": 0,
        "battle_id": "tb_demo_alg_sorting",
        "entry_fee": "Free",
        "prize_pool": "ETB 250",
        "prize_etb": 250,
    },
]

_DEMO_CHAMPIONSHIP_NEXT_SEASON: dict[str, object] = {
    "number": 4,
    "title": "Crown of the Delta",
    "is_unlocked": False,
    "unlock_hint": "Complete Season 3 to unlock Season 4 and claim your points.",
}

# ── Hosted championship wizard ─────────────────────────────────────────────
# Stage run templates for the "Create new tournament" flow. Every stage maps
# to a real seeded battle so the hosted season is immediately playable.
_CHAMPIONSHIP_STAGE_RUNS: dict[int, list[tuple[str, str]]] = {
    3: [
        ("Qualifier Round", "R1"),
        ("Semifinals", "SF"),
        ("Grand Final", "F"),
    ],
    5: [
        ("Qualifier Round", "R1"),
        ("Round of 32", "R32"),
        ("Round of 16", "R16"),
        ("Quarterfinals", "QF"),
        ("Semifinals & Grand Final", "F"),
    ],
    8: [
        ("Qualifier Round", "R1"),
        ("Round of 64", "R64"),
        ("Round of 32", "R32"),
        ("Round of 16", "R16"),
        ("Quarterfinals", "QF"),
        ("Semifinals", "SF"),
        ("Finals", "F"),
        ("Grand Final", "GF"),
    ],
}

# Stages within a hosted season unlock on a weekly cadence from round 1.
_CHAMPIONSHIP_STAGE_SPACING_DAYS = 7

# Total points a full hosted season pays across its stages (matches demo).
_CHAMPIONSHIP_TOTAL_STAGE_POINTS = 1000


def _championship_stage_runs(stage_count: int) -> list[tuple[str, str]]:
    """Returns the (name, short label) runs for the wizard's stage count."""
    return _CHAMPIONSHIP_STAGE_RUNS.get(stage_count, _CHAMPIONSHIP_STAGE_RUNS[5])


def _iso_utc(dt: datetime) -> str:
    """Formats a datetime as the demo-style UTC ISO string (``...Z``)."""
    return dt.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")

# ── Demo Games lobby (local dev) ──────────────────────────────────────────
# `battle_id` points at a real seeded topic battle so that clicking "Play"
# drops the user straight into the duel engine and earns points on completion.
# Live player counts are refreshed from the battle documents at request time.
_DEMO_GAMES_CATALOG: list[dict[str, Any]] = [
    {
        "id": "game_championship_rise",
        "title": "Rise of the Titans",
        "genre": "Knockout Tournament",
        "description": "Season-long knockout. Win stages, collect points, and claim the crown.",
        "difficulty": "All Levels",
        "tone": "primary",
        "is_championship": True,
        "status": "open",
        "points_to_earn": 1000,
        "battle_id": "tb_demo_math_olympiad",
    },
    {
        "id": "game_logic_gates",
        "title": "Logic Gates Throwdown",
        "genre": "Code Battle",
        "description": "Wire up logic gates in JavaScript and beat the clock.",
        "difficulty": "Intermediate",
        "tone": "emerald",
        "status": "open",
        "points_to_earn": 250,
        "battle_id": "tb_demo_alg_fib",
    },
    {
        "id": "game_linear_algebra",
        "title": "Linear Algebra Sprint",
        "genre": "Code Battle",
        "description": "Determinants and dot products — fast and clean.",
        "difficulty": "Beginner",
        "tone": "cyan",
        "status": "open",
        "points_to_earn": 180,
        "battle_id": "tb_demo_seed_other",
    },
    {
        "id": "game_ml_cup",
        "title": "ML Club: Trees vs Forests",
        "genre": "Data Battle",
        "description": "Tune Gini impurity, build trees, and beat the forest.",
        "difficulty": "Advanced",
        "tone": "violet",
        "status": "open",
        "points_to_earn": 500,
        "battle_id": "tb_demo_ml_club",
    },
    {
        "id": "game_chem_quiz",
        "title": "Chemistry Pitstop",
        "genre": "Quiz Sprint",
        "description": "Rapid-fire chemistry rounds. Know your bonds before they break.",
        "difficulty": "Intermediate",
        "tone": "amber",
        "status": "open",
        "points_to_earn": 220,
        "battle_id": "tb_demo_chem_quiz",
    },
    {
        "id": "game_js_basics",
        "title": "JS Fundamentals Dash",
        "genre": "Quiz Sprint",
        "description": "Scopes, closures, and promises at full speed.",
        "difficulty": "Beginner",
        "tone": "rose",
        "status": "open",
        "points_to_earn": 150,
        "battle_id": "tb_demo_js_basics",
    },
    {
        "id": "game_bio_cells",
        "title": "Cell Biology Scramble",
        "genre": "Quiz Sprint",
        "description": "Organelles, membranes, and cycles — scramble them all.",
        "difficulty": "Beginner",
        "tone": "teal",
        "status": "open",
        "points_to_earn": 160,
        "battle_id": "tb_demo_bio_cells",
    },
    {
        "id": "game_ast_planets",
        "title": "Planetary Quest",
        "genre": "Quiz Sprint",
        "description": "Cross the solar system answering orbital trivia.",
        "difficulty": "Intermediate",
        "tone": "indigo",
        "status": "open",
        "points_to_earn": 240,
        "battle_id": "tb_demo_ast_planets",
    },
    {
        "id": "game_alg_sorting",
        "title": "Algo Sorting Dojo",
        "genre": "Code Battle",
        "description": "Implement mergesort, heaps, and friends under pressure.",
        "difficulty": "Intermediate",
        "tone": "orange",
        "status": "open",
        "points_to_earn": 300,
        "battle_id": "tb_demo_alg_sorting",
    },
    {
        "id": "game_midnight_league",
        "title": "Midnight League — Elite",
        "genre": "Invitational",
        "description": "An invite-only gauntlet for the sharpest competitors.",
        "difficulty": "Advanced",
        "tone": "slate",
        "status": "locked",
        "points_to_earn": 2000,
        "battle_id": None,
        "unlock_hint": "Reach Level 5 to unlock the Midnight League.",
    },
    {
        "id": "game_crypto_gp",
        "title": "Crypto Grand Prix 2027",
        "genre": "Season Event",
        "description": "The year's biggest season event. Entry opens soon.",
        "difficulty": "All Levels",
        "tone": "fuchsia",
        "status": "coming-soon",
        "points_to_earn": 1500,
        "battle_id": None,
    },
]

# 3-stage unlock ladder recycled for every non-championship game. Each stage
# maps to a real seeded battle in `_GAME_BATTLE_POOL` (existing demo battles).
# NOTE: every id here must exist in the DB, otherwise stage duels 404.
_GAME_STAGE_TEMPLATES: list[tuple[str, str]] = [
    ("Warm-up Round", "W1"),
    ("Seeded Round", "W2"),
    ("Winner's Round", "W3"),
]
_GAME_STAGE_PRIZE_ETB: list[int] = [15, 30, 60]
_GAME_BATTLE_POOL: list[str] = [
    "tb_demo_math_olympiad",
    "tb_demo_ml_club",
    "tb_demo_chem_quiz",
    "tb_demo_js_basics",
    "tb_demo_bio_cells",
    "tb_demo_ast_planets",
    "tb_demo_alg_sorting",
    "tb_demo_alg_fib",
    "tb_demo_seed_other",
]

# ################################ /CONSTANTS ################################


# ################################ HELPERS ################################
def _points_for_difficulty(difficulty: str) -> int:
    return _DIFFICULTY_POINTS.get(difficulty, 25)


def _rank_for_level(level: int) -> str:
    tier = "Bronze"
    for threshold, name in _RANK_TIERS:
        if level >= threshold:
            tier = name
    if tier == "Champion":
        return tier
    return f"{tier} {_ROMAN_NUMERALS[(level - 1) % 5]}"


def _achievement_rules() -> list[dict[str, Any]]:
    """Unlock rules, each carrying the ETB reward paid on first unlock.

    ``reward_etb`` is money out of the competition prize pool, credited to the
    participant's ledger exactly once (see ``Service.list_achievements``), so
    these amounts are product commitments, not display values — changing one
    only affects future unlocks.
    """
    return [
        {
            "id": "first-battle",
            "title": "First Steps",
            "description": "Joined your first competition",
            "reward_etb": 10,
            "unlocked_when": lambda s: s["joined"] >= 1,
        },
        {
            "id": "showrunner",
            "title": "Showrunner",
            "description": "Hosted your first competition",
            "reward_etb": 15,
            "unlocked_when": lambda s: s["hosted"] >= 1,
        },
        {
            "id": "regular-10",
            "title": "Regular",
            "description": "Joined 10 competitions",
            "reward_etb": 40,
            "unlocked_when": lambda s: s["joined"] >= 10,
        },
        {
            "id": "champion",
            "title": "Champion",
            "description": "Won your first competition",
            "reward_etb": 100,
            "unlocked_when": lambda s: s["won"] >= 1,
        },
    ]


# ################################ /HELPERS ################################


def _question_schema_to_dict(q: CodingQuestionSchema) -> dict:
    return {
        "id": q.id or f"q_{uuid4().hex}",
        "title": q.title,
        "description": q.description,
        "constraints": q.constraints,
        "code_template": q.code_template,
        "language": q.language,
        "difficulty": q.difficulty,
        "time_limit_minutes": q.time_limit_minutes,
        "points": q.points,
        "hint_enabled": q.hint_enabled,
        "hint_text": q.hint_text,
        "test_cases": [t.model_dump() for t in q.test_cases],
        "kind": q.kind,
        "mcq_options": [o.model_dump() for o in q.mcq_options],
        "mcq_correct_id": q.mcq_correct_id,
        "tf_answer": q.tf_answer,
        "fill_expected": q.fill_expected,
        "fill_answers": q.fill_answers,
        "matching_answers": [a.model_dump() for a in q.matching_answers],
        "matching_pairs": [p.model_dump() for p in q.matching_pairs],
        "ordering_items": [o.model_dump() for o in q.ordering_items],
        "markdown": _markdown_payload_dict(q.markdown),
        "design": _design_payload_dict(q.design),
    }


def _markdown_payload_dict(payload: MarkdownPayloadSchema) -> dict:
    return {
        "source": payload.source,
        "rubric": payload.rubric,
    }


def _design_payload_dict(payload: DesignPayloadSchema) -> dict:
    return {
        "brief": payload.brief,
        "cover": payload.cover.model_dump() if payload.cover else None,
        "canvas_width": payload.canvas_width,
        "canvas_height": payload.canvas_height,
        "deliverables": payload.deliverables,
        "rubric": payload.rubric,
    }


# ========================================================================
# Battle management-table columns (drives the per-battle management table)
# ========================================================================

_MT_ORG_ID = "delta-labs"
_MT_BATTLE_WORKSPACE_PREFIX = "comp_battle_"
_MT_BATTLE_TABLE_TITLE = "Battle Management"

_MT_BATTLE_STATUS_OPTIONS = [
    {"id": "filling", "label": "Filling"},
    {"id": "scheduled", "label": "Scheduled"},
    {"id": "live", "label": "Live"},
    {"id": "finished", "label": "Finished"},
]
_MT_DIFFICULTY_OPTIONS = [
    {"id": "Easy", "label": "Easy"},
    {"id": "Intermediate", "label": "Intermediate"},
    {"id": "Hard", "label": "Hard"},
]
_MT_FORMAT_OPTIONS = [
    {"id": "1v1", "label": "1v1"},
    {"id": "mini", "label": "Mini"},
    {"id": "t8", "label": "Top 8"},
    {"id": "t16", "label": "Top 16"},
    {"id": "t32", "label": "Top 32"},
]
_MT_VISIBILITY_OPTIONS = [
    {"id": "public", "label": "Public"},
    {"id": "private", "label": "Private"},
]
_MT_TIMING_OPTIONS = [
    {"id": "instant", "label": "Instant"},
    {"id": "schedule", "label": "Schedule"},
]
_MT_POOL_OPTIONS = [
    {"id": "auto", "label": "Auto"},
    {"id": "custom", "label": "Custom"},
]

# Editable cell title -> battle document field. Columns absent here are
# rendered read-only (Joined, Questions, Link).
_MT_BATTLE_FIELD_BY_TITLE: dict[str, str] = {
    "Title": "title",
    "Subject": "subject",
    "Difficulty": "difficulty",
    "Status": "status",
    "Entry Fee": "entry_fee",
    "Prize Pool": "prize_pool",
    "Players": "players_max",
    "Format": "format",
    "Visibility": "visibility",
    "Timing": "timing",
    "Schedule Date": "schedule_date",
    "Schedule Time": "schedule_time",
    "Schedule Timezone": "schedule_timezone",
    "Duration (min)": "duration_minutes",
    "Question Pool": "question_pool_mode",
    "Easy %": "easy_pct",
    "Medium %": "medium_pct",
    "Hard %": "hard_pct",
}

# Read-only cells derived from the battle document on every sync.
_MT_BATTLE_DERIVED_CELLS: dict[str, str] = {
    "Joined": "players_joined",
    "Questions": "_questions_count",
    "Link": "_link",
}

_MT_VALIDATED_CHOICES: dict[str, list[str]] = {
    "difficulty": ["Easy", "Intermediate", "Hard"],
    "status": ["filling", "scheduled", "live", "finished"],
    "format": ["1v1", "mini", "t8", "t16", "t32"],
    "visibility": ["public", "private"],
    "timing": ["instant", "schedule"],
    "question_pool_mode": ["auto", "custom"],
}

_MT_NUMBER_FIELDS: set[str] = {
    "players_max", "duration_minutes", "easy_pct", "medium_pct", "hard_pct",
}


def _mt_starter_columns() -> list[dict[str, Any]]:
    """Starter columns for a per-battle management table."""
    cols = [
        ("Title", "text", {}),
        ("Subject", "text", {}),
        ("Difficulty", "status", {"options": _MT_DIFFICULTY_OPTIONS}),
        ("Status", "status", {"options": _MT_BATTLE_STATUS_OPTIONS}),
        ("Entry Fee", "text", {}),
        ("Prize Pool", "text", {}),
        ("Players", "number", {}),
        ("Joined", "number", {}),
        ("Format", "dropdown", {"options": _MT_FORMAT_OPTIONS}),
        ("Visibility", "dropdown", {"options": _MT_VISIBILITY_OPTIONS}),
        ("Timing", "dropdown", {"options": _MT_TIMING_OPTIONS}),
        ("Schedule Date", "date", {}),
        ("Schedule Time", "text", {}),
        ("Schedule Timezone", "text", {}),
        ("Duration (min)", "number", {}),
        ("Question Pool", "dropdown", {"options": _MT_POOL_OPTIONS}),
        ("Easy %", "number", {}),
        ("Medium %", "number", {}),
        ("Hard %", "number", {}),
        ("Questions", "number", {}),
        ("Link", "link", {}),
    ]
    return [
        {"id": f"col_{uuid4().hex}", "title": title, "type": col_type, "order": idx, "settings": settings}
        for idx, (title, col_type, settings) in enumerate(cols)
    ]


def _mt_cell_columns(columns: list[Any]) -> list[dict[str, Any]]:
    """Shrink definition columns to the ``{id, title}`` shape helpers need."""
    return [{"id": c.id, "title": c.title} for c in columns]


def _mt_battle_cells(columns: list[dict[str, Any]], doc: dict[str, Any]) -> dict[str, Any]:
    """Project a battle document onto management-table cells by column title."""
    battle_id = str(doc["_id"])
    questions = list(doc.get("questions") or [])
    cells: dict[str, Any] = {}
    for column in columns:
        title = str(column.get("title", ""))
        col_id = str(column.get("id", ""))
        field = _MT_BATTLE_FIELD_BY_TITLE.get(title)
        derived = _MT_BATTLE_DERIVED_CELLS.get(title)
        if field is not None:
            cells[col_id] = doc.get(field, "")
        elif derived == "players_joined":
            cells[col_id] = len(list(doc.get("participants", [])))
        elif derived == "_questions_count":
            cells[col_id] = len(questions)
        elif derived == "_link":
            cells[col_id] = f"/features/competitions/{battle_id}"
        else:
            cells[col_id] = ""
    return cells


def _battle_to_row_cells(
    columns: list[dict[str, Any]], battle: dict[str, Any], battle_id: str,
) -> dict[str, Any]:
    """Map a battle document onto row cells by matching column title."""
    cells: dict[str, Any] = {}
    for col in columns:
        title = str(col.get("title", "")).strip()
        col_id = str(col.get("id", ""))
        value: Any = ""
        if title in ("Name", "Title"):
            value = str(battle.get("title", ""))
        elif title == "Status":
            value = str(battle.get("status", "filling"))
        elif title == "Start Date":
            value = str(battle.get("schedule_date", ""))
        elif title == "End Date":
            ends = battle.get("countdown_ends_at")
            value = str(ends) if ends else ""
        elif title == "Prize Pool":
            value = str(battle.get("prize_pool", "0 ETB"))
        elif title == "Entry Fee":
            value = str(battle.get("entry_fee", "Free"))
        elif title == "Players":
            value = int(battle.get("players_max", 0))
        elif title == "Difficulty":
            value = str(battle.get("difficulty", ""))
        elif title == "Link":
            value = f"/features/competitions/{battle_id}"
        if value != "":
            cells[col_id] = value
    return cells


def _mt_cells_to_battle_fields(
    columns: list[dict[str, Any]], cells: dict[str, Any],
) -> dict[str, Any]:
    """Map edited cells back to validated battle-document fields."""
    by_id = {str(c.get("id", "")): c for c in columns}
    updates: dict[str, Any] = {}
    for col_id, raw in cells.items():
        column = by_id.get(str(col_id))
        if column is None:
            continue
        field = _MT_BATTLE_FIELD_BY_TITLE.get(str(column.get("title", "")))
        if field is None:
            continue
        if field in _MT_NUMBER_FIELDS:
            if raw is None or raw == "":
                continue
            try:
                value = int(raw)
            except (TypeError, ValueError):
                continue
        else:
            if raw is None:
                continue
            value = str(raw).strip()
            if not value:
                continue
        allowed = _MT_VALIDATED_CHOICES.get(field)
        if allowed is not None and value not in allowed:
            continue
        updates[field] = value
    return updates


class Service:
    def __init__(
        self,
        repository: Repository,
        management_table_service: ManagementTableService | None = None,
        wallet_repository: WalletRepository | None = None,
    ) -> None:
        self._repository = repository
        self._management_table_service = management_table_service
        # Built from the competitions database so existing call sites keep
        # working unchanged; tests inject a fake instead of standing up MongoDB.
        self._wallet = wallet_repository or WalletRepository(repository.db)

    async def bootstrap(self) -> None:
        await self._repository.ensure_indexes()
        await self._wallet.ensure_indexes()
        await self._seed_default_modes()

    async def _seed_default_modes(self) -> None:
        for position, mode in enumerate(DEFAULT_GAME_MODES):
            await self._repository.upsert_mode({**mode, "position": position})

    async def seed_demo_battles(self) -> None:
        """Ensure a rich catalog of joinable/owned demo topic battles exists.

        - Battles owned by the dev user (``_OTHER_OWNER_EMAIL``) appear in "My
          battles" and let the owner manage and track them.
        - Battles owned by synthetic accounts are joinable, so the full join
          flow can be exercised.
        - A battle owned by the demo account (``_DEMO_OWNER_EMAIL``) is seeded
          only when that account exists.

        Deterministic ``_id``\\ s keep seeding idempotent. Battles are refreshed
        on startup so join counts reset between test runs.

        No-ops unless ``ENV=local``. The seeds reference two fixed email
        addresses and are the ids that championship stages, the game ladder,
        and ``_GAME_BATTLE_POOL`` all point at, so letting them run against
        staging or production puts fabricated battles — and fabricated owners —
        in front of real users.
        """
        from app.core.config import get_settings

        if get_settings().env != "local":
            return

        await self.bootstrap()
        now = datetime.now(UTC)

        demo_owner_id = await self._repository.find_user_id_by_email(_DEMO_OWNER_EMAIL)
        self_owner_id = await self._repository.find_user_id_by_email(_OTHER_OWNER_EMAIL)

        for seed in _DEMO_BATTLE_SEEDS:
            owner_key = seed["owner"]
            if owner_key == "self":
                if self_owner_id is None:
                    continue
                owner_user_id = self_owner_id
            elif owner_key == "demo":
                if demo_owner_id is None:
                    continue
                owner_user_id = demo_owner_id
            else:
                owner_user_id = str(owner_key)

            countdown_ends_at = None
            countdown_minutes = seed.get("countdown_minutes")
            if countdown_minutes:
                countdown_ends_at = now + timedelta(minutes=int(countdown_minutes))

            participants: list[str] = []
            if bool(seed.get("joined_by_self")) and self_owner_id is not None:
                participants = [self_owner_id]

            await self._repository.upsert_topic_battle(
                {
                    "_id": seed["id"],
                    "title": seed["title"],
                    "subject": seed["subject"],
                    "difficulty": seed["difficulty"],
                    "status": seed["status"],
                    "countdown_ends_at": countdown_ends_at,
                    "creator": {"name": seed["creator_name"]},
                    "prize_pool": seed["prize_pool"],
                    "entry_fee": seed["entry_fee"],
                    "players_joined": len(participants),
                    "players_max": int(seed["players_max"]),
                    "owner_user_id": owner_user_id,
                    "participants": participants,
                    "questions": list(seed["questions"]),
                    "created_at": now,
                    "updated_at": now,
                }
            )

    # ========================================================================
    # Hub: game modes, user status, achievements
    # ========================================================================

    async def list_modes(self) -> list[CompetitionModeResponse]:
        # Indexes and the default mode catalogue are seeded once at startup
        # (see `main.py` lifespan); re-bootstrapping here cost ~20 remote
        # round-trips on every hub read.
        docs = await self._repository.find_all_modes()
        return [CompetitionModeResponse(**doc) for doc in docs]

    async def get_user_status(self, *, user_id: str | None) -> UserStatusResponse:
        if user_id is None:
            stats = None
        else:
            stats = await self._repository.get_user_stats(user_id)

        points = int(stats.get("points", 0)) if stats else 0
        won = int(stats.get("won", 0)) if stats else 0
        # Earned money is whatever the wallet ledger says the participant is
        # owed, never a counter on the stats document.
        balance_etb = (
            0 if user_id is None else await self._wallet.get_participant_balance_etb(user_id)
        )

        level = 1 + points // _POINTS_PER_LEVEL
        band = points % _POINTS_PER_LEVEL

        return UserStatusResponse(
            level=level,
            rank=_rank_for_level(level),
            progress_label="Progress",
            progress_value=float(band),
            progress_text=f"{band}/{_POINTS_PER_LEVEL} PTS",
            earnings=f"{balance_etb:,} ETB",
            won=won,
        )

    async def list_achievements(self, *, user_id: str | None) -> list[AchievementResponse]:
        """Evaluate the rules and settle any reward that just became payable.

        Reading this list is also the settlement pass. The first time an
        unlocked rule has no reward record, its ETB is credited to the
        participant's wallet ledger (idempotency key derived from user +
        rule, so a re-read or a race can never pay twice) and only then
        stamped onto the stats document. Wallet-first ordering mirrors the
        stage-prize settlement: a crash between the two writes replays into a
        no-op credit, never a stamp for money that was never owed.

        Guests get the rule catalogue with nothing written. ``unlocked_at``
        and ``rewarded_at`` both read from that stamp, so they always agree.
        """
        if user_id is None:
            stats: dict[str, object] = {
                "joined": 0,
                "hosted": 0,
                "won": 0,
            }
        else:
            doc = await self._repository.get_user_stats(user_id)
            stats = doc or {"joined": 0, "hosted": 0, "won": 0}

        responses: list[AchievementResponse] = []
        for rule in _achievement_rules():
            rule_id = str(rule["id"])
            reward_etb = int(rule.get("reward_etb", 0))
            unlocked = bool(rule["unlocked_when"](stats))
            rewards = stats.get("achievement_rewards")
            record = rewards.get(rule_id) if isinstance(rewards, dict) else None

            if unlocked and user_id is not None and record is None:
                await self._wallet.credit_achievement_reward(
                    user_id=user_id,
                    rule_id=rule_id,
                    amount_etb=reward_etb,
                    metadata={"title": str(rule["title"])},
                )
                refreshed = await self._repository.record_achievement_reward(
                    user_id,
                    rule_id,
                    amount_etb=reward_etb,
                )
                if refreshed is not None:
                    stats = refreshed
                    rewards = stats.get("achievement_rewards")
                    record = rewards.get(rule_id) if isinstance(rewards, dict) else None

            credited_at = record.get("credited_at") if isinstance(record, dict) else None
            responses.append(
                AchievementResponse(
                    id=rule_id,
                    title=str(rule["title"]),
                    description=str(rule["description"]),
                    unlocked=unlocked,
                    unlocked_at=str(credited_at) if credited_at else None,
                    reward_etb=reward_etb,
                    rewarded=record is not None,
                    rewarded_at=str(credited_at) if credited_at else None,
                )
            )
        return responses

    async def get_hub(self, *, user_id: str | None) -> CompetitionHubResponse:
        modes = await self.list_modes()
        # Achievements settle before the status read: a reward unlocked by
        # this very request must already be in the earnings figure below.
        achievements = await self.list_achievements(user_id=user_id)
        user_status = await self.get_user_status(user_id=user_id)

        my_battles: list[TopicBattleResponse] = []
        if user_id is not None:
            docs = await self._repository.find_all_topic_battles_by_owner(user_id)
            my_battles = [
                self._repository.doc_to_response(doc, viewer_user_id=user_id) for doc in docs
            ]

        return CompetitionHubResponse(
            modes=modes,
            user_status=user_status,
            achievements=achievements,
            my_battles=my_battles,
        )

    # ========================================================================
    # Championship (season-long knockout tournament)
    # ========================================================================

    async def get_championship(self, *, user_id: str | None) -> ChampionshipResponse:
        """Snapshots the current Championship season for the requesting user.

        Stage statuses reflect the user's own unlock progression: completed
        stages stay earned with their prize, exactly one stage is unlocked and
        current, and everything after stays locked. Uses the persisted hosted
        season when one exists, otherwise falls back to the deterministic demo
        season (anonymous or pre-launch users).

        Standings and the season's rank badge are always derived from real
        stored user stats — an empty ladder returns an empty (or self-only)
        board rather than a canned list of names.
        """
        player_points = 0
        completed: list[int] = []
        stats: dict[str, Any] | None = None
        if user_id is not None:
            stats = await self._repository.get_user_stats(user_id)
        if stats:
            player_points = int(stats.get("championship_points", 0) or 0)
            raw = stats.get("championship_completed", [])
            completed = [int(o) for o in raw if isinstance(o, (int, float))]
        completed_set = set(completed)
        has_progress = bool(completed)

        stored = await self._repository.get_active_championship()
        if stored is not None:
            season = dict(stored["season"])
            stages_source: list[dict[str, Any]] = [
                dict(s) for s in stored["stages"]
            ]
            next_season = dict(stored["next_season"])
        else:
            season = dict(_DEMO_CHAMPIONSHIP_SEASON)
            stages_source = [dict(s) for s in _DEMO_CHAMPIONSHIP_STAGES]
            next_season = dict(_DEMO_CHAMPIONSHIP_NEXT_SEASON)
        # Always the real ladder: users who actually earned championship
        # points, never a canned list of names. Without a hosted season there
        # are no completions, so this reads empty rather than inventing rows.
        db_standings = await self._repository.championship_standings()

        ordered = sorted(stages_source, key=lambda s: int(s["order"]))
        next_unlocked = next(
            (int(s["order"]) for s in ordered if int(s["order"]) not in completed_set),
            None,
        )

        stages: list[ChampionshipStageResponse] = []
        for stage in ordered:
            if not has_progress:
                stages.append(ChampionshipStageResponse.model_validate(stage))
                continue
            order = int(stage["order"])
            is_done = order in completed_set
            candidate = dict(stage)
            candidate["status"] = (
                "completed"
                if is_done
                else ("unlocked" if order == next_unlocked else "locked")
            )
            candidate["is_current"] = order == next_unlocked
            candidate["points_earned"] = (
                int(stage.get("points_to_earn", 0) or 0) if is_done else 0
            )
            stages.append(ChampionshipStageResponse.model_validate(candidate))

        season_data = dict(season)
        if has_progress:
            season_data["completed_stages"] = len(completed)
            season_data["current_stage_order"] = next_unlocked
            season_data["points_earned"] = player_points
        # The season's rank badge is computed live from the real ladder, so a
        # demo or freshly created season can never claim a place it has not
        # earned ("Rank #4 of 128" with nobody on the board).
        player_rank, total_players = await self._repository.championship_rank_and_total(
            player_points
        )
        season_data["player_rank"] = player_rank
        season_data["total_players"] = total_players

        if db_standings:
            standings: list[ChampionshipStandingResponse] = []
            inserted_you = False
            for entry in db_standings:
                if entry["user_id"] == user_id:
                    continue
                if (
                    not inserted_you
                    and user_id is not None
                    and player_points >= int(entry.get("points", 0) or 0)
                ):
                    standings.append(
                        ChampionshipStandingResponse(
                            rank=len(standings) + 1,
                            name="You",
                            points=player_points,
                            is_current_user=True,
                        )
                    )
                    inserted_you = True
                standings.append(
                    ChampionshipStandingResponse(
                        rank=len(standings) + 1,
                        name=str(entry.get("name", "Player")),
                        points=int(entry.get("points", 0) or 0),
                    )
                )
            if not inserted_you and user_id is not None:
                standings.append(
                    ChampionshipStandingResponse(
                        rank=len(standings) + 1,
                        name="You",
                        points=player_points,
                        is_current_user=True,
                    )
                )
        elif user_id is not None:
            # Nobody on the ladder yet — the requesting user's own row is the
            # only entry that actually exists.
            standings = [
                ChampionshipStandingResponse(
                    rank=1,
                    name="You",
                    points=player_points,
                    is_current_user=True,
                )
            ]
        else:
            standings = []

        return ChampionshipResponse(
            season=ChampionshipSeasonResponse.model_validate(season_data),
            stages=stages,
            standings=standings,
            next_season=ChampionshipNextSeasonResponse.model_validate(next_season),
        )

    async def complete_championship_stage(
        self,
        *,
        user_id: str,
        stage_order: int,
    ) -> ChampionshipResponse:
        """Completes the currently unlocked stage, crediting its stage points
        and ETB prize, then re-snapshots the season so the next stage unlocks.

        Idempotent per stage: a stage can only be credited once.
        """
        stored = await self._repository.get_active_championship()
        if stored is not None:
            ordered = sorted(
                (dict(s) for s in stored["stages"]),
                key=lambda s: int(s["order"]),
            )
        else:
            ordered = sorted(_DEMO_CHAMPIONSHIP_STAGES, key=lambda s: int(s["order"]))
        stage = next((s for s in ordered if int(s["order"]) == stage_order), None)
        if stage is None:
            raise NotFoundError(f"Stage {stage_order} not found in the current season")

        stats = await self._repository.get_user_stats(user_id)
        raw_completed = (stats or {}).get("championship_completed", [])
        completed_set = {
            int(o) for o in raw_completed if isinstance(o, (int, float))
        }
        if stage_order in completed_set:
            return await self.get_championship(user_id=user_id)

        next_unlocked = next(
            (int(s["order"]) for s in ordered if int(s["order"]) not in completed_set),
            None,
        )
        if next_unlocked is None or stage_order != next_unlocked:
            raise ConflictError("This stage is not unlocked yet")

        season_number = int(((stored or {}).get("season") or {}).get("number", 0) or 0)
        # The wallet is credited first. If the progress write below then fails,
        # the retry loses the ledger's idempotency race and moves no money, so
        # the two writes converge. The reverse order could leave points credited
        # against a prize that was never owed.
        await self._wallet.credit_stage_prize(
            user_id=user_id,
            amount_etb=int(stage.get("prize_etb", 0) or 0),
            idempotency_key=f"championship_stage:{season_number}:{stage_order}",
            source={
                "type": "championship_stage",
                "id": str(season_number),
                "order": stage_order,
            },
            metadata={"season": season_number, "stage_order": stage_order},
        )
        await self._repository.complete_championship_stage_stats(
            user_id=user_id,
            stage_order=stage_order,
            points=int(stage.get("points_to_earn", 0) or 0),
        )
        return await self.get_championship(user_id=user_id)

    async def create_championship(
        self,
        *,
        payload: ChampionshipCreateRequest,
        user_id: str | None = None,
    ) -> ChampionshipResponse:
        """Hosts and launches a brand-new Championship season.

        Builds an escalating stage ladder (each stage tied to a real seeded
        battle so it is instantly playable), persists it as the active season,
        resets everyone's season progression, and snapshots the fresh season
        for the host.
        """
        stored = await self._repository.get_active_championship()
        if stored is not None:
            prev_number = int((stored.get("season") or {}).get("number", 3) or 3)
        else:
            prev_number = 3
        number = prev_number + 1
        now = datetime.now(UTC)

        _, launch_dt = self._build_launch_state(
            payload.timing,
            payload.schedule_date or "",
            payload.schedule_time or "",
            payload.schedule_timezone or "",
        )
        if payload.timing != "schedule" or launch_dt is None:
            launch_dt = now

        runs = _championship_stage_runs(payload.stage_count)
        count = len(runs)
        base = max(1, int(payload.prize_base_etb))
        per_stage = max(1, _CHAMPIONSHIP_TOTAL_STAGE_POINTS // count)
        pool_size = len(_GAME_BATTLE_POOL)

        stages: list[dict[str, object]] = []
        for index, (name, label) in enumerate(runs):
            order = index + 1
            prize = base * (2**index)
            if index == count - 1:
                prize += base * count
            points = (
                per_stage
                if index < count - 1
                else _CHAMPIONSHIP_TOTAL_STAGE_POINTS - per_stage * (count - 1)
            )
            start = launch_dt + timedelta(days=_CHAMPIONSHIP_STAGE_SPACING_DAYS * index)

            custom_questions = (
                payload.stage_questions[index]
                if index < len(payload.stage_questions)
                else []
            )
            if custom_questions:
                battle_id = await self._compile_stage_battle(
                    label=label,
                    payload=payload,
                    prize=prize,
                    questions=custom_questions,
                    user_id=user_id,
                )
            else:
                battle_id = _GAME_BATTLE_POOL[(number + index) % pool_size]

            stages.append(
                {
                    "id": f"stage_{number}_{index + 1}",
                    "order": order,
                    "name": name,
                    "short_label": label,
                    "status": "locked",
                    "starts_at": _iso_utc(start),
                    "points_to_earn": points,
                    "points_earned": 0,
                    "is_current": order == 1,
                    "battle_id": battle_id,
                    "entry_fee": payload.entry_fee or "Free",
                    "prize_pool": f"ETB {prize}",
                    "prize_etb": prize,
                }
            )
        stages[0]["status"] = "unlocked"

        season: dict[str, object] = {
            "id": f"season_{number}",
            "number": number,
            "title": payload.title,
            "status": "active",
            "starts_at": _iso_utc(launch_dt),
            "ends_at": _iso_utc(
                launch_dt
                + timedelta(days=_CHAMPIONSHIP_STAGE_SPACING_DAYS * (count - 1) + 7)
            ),
            "total_stages": count,
            "completed_stages": 0,
            "current_stage_order": 1,
            "points_earned": 0,
            "total_points": _CHAMPIONSHIP_TOTAL_STAGE_POINTS,
            # Placeholders: `get_championship` recomputes both from the real
            # ladder on every read.
            "player_rank": 0,
            "total_players": 0,
        }

        next_season: dict[str, object] = {
            "number": number + 1,
            "title": f"Season {number + 1}",
            "is_unlocked": False,
            "unlock_hint": (
                f"Complete {payload.title} to unlock the next season "
                "and claim your points."
            ),
        }

        doc: dict[str, Any] = {
            "_id": "active",
            "season": season,
            "stages": stages,
            "next_season": next_season,
            "title": payload.title,
            "description": payload.description,
            "entry_fee": payload.entry_fee,
            "prize_base_etb": base,
            "timing": payload.timing,
            "schedule_date": payload.schedule_date,
            "schedule_time": payload.schedule_time,
            "schedule_timezone": payload.schedule_timezone,
            "created_by": user_id,
            "created_at": now,
            "updated_at": now,
        }
        await self._repository.upsert_active_championship(doc)
        await self._repository.reset_championship_progress()
        return await self.get_championship(user_id=user_id)

    async def _compile_stage_battle(
        self,
        *,
        label: str,
        payload: ChampionshipCreateRequest,
        prize: int,
        questions: list[CodingQuestionSchema],
        user_id: str | None,
    ) -> str:
        """Compiles a stage's custom question set into a real topic battle.

        Built exactly like ``create_topic_battle`` so the stage duel runs the
        standard battle flow with the host's authored questions. Returns the
        new battle id.
        """
        battle_id = f"tb_{uuid4().hex}"
        now = datetime.now(UTC)
        status, countdown_ends_at = self._build_launch_state(
            payload.timing,
            payload.schedule_date or "",
            payload.schedule_time or "",
            payload.schedule_timezone or "",
        )

        doc: dict[str, Any] = {
            "_id": battle_id,
            "title": f"{payload.title} · {label}",
            "subject": (payload.title or "Championship")[:100],
            "difficulty": "Custom",
            "status": status,
            "countdown_ends_at": countdown_ends_at,
            "creator": {
                "name": payload.creator_name or "You",
            },
            "prize_pool": f"ETB {prize}",
            "entry_fee": payload.entry_fee or "Free",
            "players_joined": 0,
            "players_max": 1000,
            "format": "mini",
            "duration_minutes": 10,
            "visibility": "public",
            "timing": payload.timing,
            "prize_rule": "winner-takes-all",
            "schedule_date": payload.schedule_date or "",
            "schedule_time": payload.schedule_time or "",
            "schedule_timezone": payload.schedule_timezone or "UTC",
            "question_pool_mode": "custom",
            "easy_pct": 0,
            "medium_pct": 0,
            "hard_pct": 0,
            "owner_user_id": user_id,
            "participants": [],
            "questions": [_question_schema_to_dict(q) for q in questions],
            "created_at": now,
            "updated_at": now,
        }
        await self._repository.insert_topic_battle(doc)
        return battle_id

    # ========================================================================
    # Games lobby (playable game catalog)
    # ========================================================================

    @staticmethod
    def _build_game_stages(
        game_index: int,
        points: int,
        completed: list[int],
    ) -> list[dict[str, object]]:
        """Builds a 3-stage unlock ladder for a non-championship game.

        Each stage maps to a real seeded battle, so completing a stage runs a
        real duel and win credits points + ETB prize, unlocking the next one.
        """
        total = max(1, int(points or 0))
        count = len(_GAME_STAGE_TEMPLATES)
        base = max(1, total // count)
        pool_size = len(_GAME_BATTLE_POOL)
        completed_set = set(completed)
        next_unlocked = next(
            (order for order in range(1, count + 1) if order not in completed_set),
            None,
        )
        stages: list[dict[str, object]] = []
        for order in range(1, count + 1):
            name, label = _GAME_STAGE_TEMPLATES[order - 1]
            stage_points = base if order < count else total - base * (count - 1)
            is_done = order in completed_set
            prize_etb = _GAME_STAGE_PRIZE_ETB[order - 1]
            stages.append(
                {
                    "id": f"gst_{game_index}_{order}",
                    "order": order,
                    "name": name,
                    "short_label": label,
                    "status": (
                        "completed"
                        if is_done
                        else ("unlocked" if order == next_unlocked else "locked")
                    ),
                    "starts_at": "2026-09-01T00:00:00Z",
                    "points_to_earn": stage_points,
                    "points_earned": stage_points if is_done else 0,
                    "is_current": order == next_unlocked,
                    "battle_id": _GAME_BATTLE_POOL[(game_index + order - 1) % pool_size],
                    "entry_fee": "Free",
                    "prize_pool": f"ETB {prize_etb}",
                    "prize_etb": prize_etb,
                },
            )
        return stages

    async def list_games(self, *, user_id: str | None) -> CompetitionGamesResponse:
        """Lists the Games lobby, refreshing live player counts from battles.

        Every ``open`` game carries a staged ladder ("Warm-up", "Seeded
        Round", "Winner's Round") — each stage is a real battled duel whose
        completion credits points + ETB prize and unlocks the next stage.
        """
        raw_game_stages: dict[str, list[int]] = {}
        if user_id is not None:
            stats = await self._repository.get_user_stats(user_id)
            if stats:
                nested = stats.get("game_stages")
                if isinstance(nested, dict):
                    raw_game_stages = {
                        str(key): [int(order) for order in value if isinstance(order, (int, float))]
                        for key, value in nested.items()
                        if isinstance(value, list)
                    }

        games: list[CompetitionGameResponse] = []
        for index, game in enumerate(_DEMO_GAMES_CATALOG):
            live: dict[str, object] = {}
            battle_id = game.get("battle_id")
            if isinstance(battle_id, str):
                doc = await self._repository.find_topic_battle_by_id(battle_id)
                if doc is not None:
                    live["players_count"] = len(doc.get("participants", []))
                    live["players_max"] = int(doc.get("players_max", 0))
            game_dict = {**game, **live}
            if game.get("status") == "open":
                completed = raw_game_stages.get(str(game.get("id")), [])
                game_index = int(index)
                game_dict["stages"] = self._build_game_stages(
                    game_index,
                    int(game.get("points_to_earn", 0) or 0),
                    completed,
                )
            games.append(CompetitionGameResponse.model_validate(game_dict))
        open_count = sum(1 for game in games if game.status == "open")
        return CompetitionGamesResponse(games=games, total=len(games), open_count=open_count)

    async def complete_game_stage(
        self,
        *,
        user_id: str,
        game_id: str,
        stage_order: int,
    ) -> CompetitionGamesResponse:
        """Completes the currently unlocked stage of a game ladder, crediting
        its points + ETB prize, then re-snapshots the lobby so the next stage
        unlocks. Idempotent per stage.
        """
        index = next(
            (i for i, game in enumerate(_DEMO_GAMES_CATALOG) if game.get("id") == game_id),
            None,
        )
        if index is None:
            raise NotFoundError("Game not found")
        game = _DEMO_GAMES_CATALOG[index]
        if game.get("status") != "open":
            raise ConflictError("This game is not open yet")

        stats = await self._repository.get_user_stats(user_id)
        nested = (stats or {}).get("game_stages")
        completed = (
            [int(order) for order in nested.get(game_id, []) if isinstance(order, (int, float))]
            if isinstance(nested, dict)
            else []
        )
        if stage_order in completed:
            return await self.list_games(user_id=user_id)

        count = len(_GAME_STAGE_TEMPLATES)
        next_unlocked = next(
            (order for order in range(1, count + 1) if order not in set(completed)),
            None,
        )
        if next_unlocked is None or stage_order != next_unlocked:
            raise ConflictError("This stage is not unlocked yet")

        total = max(1, int(game.get("points_to_earn", 0) or 0))
        base = max(1, total // count)
        stage_points = base if stage_order < count else total - base * (count - 1)
        # Wallet before points, for the same convergence reason as the
        # championship ladder above.
        await self._wallet.credit_stage_prize(
            user_id=user_id,
            amount_etb=_GAME_STAGE_PRIZE_ETB[stage_order - 1],
            idempotency_key=f"game_stage:{game_id}:{stage_order}",
            source={"type": "game_stage", "id": game_id, "order": stage_order},
            metadata={"game_id": game_id, "stage_order": stage_order},
        )
        await self._repository.complete_game_stage_stats(
            user_id=user_id,
            game_id=game_id,
            stage_order=stage_order,
            points=stage_points,
        )
        return await self.list_games(user_id=user_id)

    # ========================================================================
    # Topic Battle CRUD
    # ========================================================================

    async def create_topic_battle(
        self,
        *,
        payload: TopicBattleCreateRequest,
        user_id: str | None = None,
    ) -> TopicBattleResponse:
        await self.bootstrap()

        battle_id = f"tb_{uuid4().hex}"
        now = datetime.now(UTC)

        questions = [_question_schema_to_dict(q) for q in payload.questions]

        status, countdown_ends_at = self._build_launch_state(
            payload.timing,
            payload.schedule_date,
            payload.schedule_time,
            payload.schedule_timezone,
        )

        doc = {
            "_id": battle_id,
            "title": payload.title,
            "subject": payload.subject,
            "difficulty": payload.difficulty,
            "status": status,
            "countdown_ends_at": countdown_ends_at,
            "creator": {
                "name": payload.creator_name,
            },
            "prize_pool": payload.prize_pool,
            "entry_fee": payload.entry_fee,
            "players_joined": 0,
            "players_max": payload.players_max,
            "format": payload.format,
            "duration_minutes": payload.duration_minutes,
            "visibility": payload.visibility,
            "timing": payload.timing,
            "prize_rule": payload.prize_rule,
            "schedule_date": payload.schedule_date,
            "schedule_time": payload.schedule_time,
            "schedule_timezone": payload.schedule_timezone,
            "question_pool_mode": payload.question_pool_mode,
            "easy_pct": payload.easy_pct,
            "medium_pct": payload.medium_pct,
            "hard_pct": payload.hard_pct,
            "owner_user_id": user_id,
            "participants": [],
            "questions": questions,
            "created_at": now,
            "updated_at": now,
        }

        await self._repository.insert_topic_battle(doc)
        if user_id is not None:
            await self._repository.increment_user_stats(
                user_id,
                {"hosted": 1, "points": _HOST_POINTS},
            )
        await self._record_event(
            entity_type="topic_battle",
            entity_id=battle_id,
            event_type="create",
            actor_user_id=user_id,
            detail={
                "status": status,
                "difficulty": payload.difficulty,
                "players_max": payload.players_max,
                "question_count": len(questions),
            },
        )
        return self._repository.doc_to_response(doc)

    def _build_launch_state(
        self,
        timing: str,
        schedule_date: str,
        schedule_time: str,
        schedule_timezone: str,
    ) -> tuple[str, datetime | None]:
        """Derive launch status and countdown from the wizard's timing + schedule."""
        if timing != "schedule" or not schedule_date or not schedule_time:
            return "filling", None

        offset_hours = 3
        match = re.search(r"UTC([+-])(\d+)(?::(\d+))?", schedule_timezone or "")
        if match:
            sign = -1 if match.group(1) == "-" else 1
            offset_hours = sign * int(match.group(2))

        try:
            local_dt = datetime.fromisoformat(f"{schedule_date}T{schedule_time}")
            utc_dt = local_dt - timedelta(hours=offset_hours)
            return "scheduled", utc_dt.replace(tzinfo=UTC)
        except ValueError:
            return "scheduled", None

    async def list_topic_battles(
        self,
        *,
        user_id: str | None = None,
    ) -> TopicBattleListResponse:
        docs = await self._repository.find_all_topic_battles()
        battles = [self._repository.doc_to_response(doc, viewer_user_id=user_id) for doc in docs]
        return TopicBattleListResponse(battles=battles, total=len(battles))

    async def launch_due_scheduled_battles(self) -> int:
        """Flip scheduled battles past their launch time to joinable (`filling`).

        Runs on a lightweight asyncio loop in the app lifespan; keeps the lobby
        honest without blocking request handling.
        """
        now = datetime.now(UTC)
        due = await self._repository.find_due_scheduled_battles(now)
        launched = 0
        for doc in due:
            battle_id = str(doc.get("_id"))
            if not battle_id:
                continue
            await self._repository.patch_topic_battle(
                battle_id,
                {"status": "filling", "countdown_ends_at": None},
            )
            await self._record_event(
                entity_type="topic_battle",
                entity_id=battle_id,
                event_type="scheduled_launch",
                actor_user_id=str(doc.get("owner_user_id") or ""),
                detail={"previous_status": "scheduled", "launched_at": now.isoformat()},
            )
            launched += 1
        return launched

    async def get_topic_battle(
        self,
        *,
        battle_id: str,
        user_id: str | None = None,
    ) -> TopicBattleResponse:
        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        return self._repository.doc_to_response(doc, viewer_user_id=user_id)

    # ========================================================================
    # Server-authoritative answering + integrity signals
    # ========================================================================

    def _battle_deadline(self, doc: dict[str, Any], user_id: str) -> datetime:
        """When this participant's clock runs out.

        Anchored to the participant's own join when available, so a late joiner
        gets their full duration instead of inheriting time already spent before
        they arrived. The grace window absorbs network latency and clock skew so
        a participant who genuinely finished in time is not punished by an
        in-flight request.
        """
        grace = timedelta(seconds=_settings().competition_answer_grace_seconds)
        joined_at = (doc.get("participant_started_at") or {}).get(user_id)
        if isinstance(joined_at, datetime):
            start = joined_at
        elif isinstance(doc.get("countdown_ends_at"), datetime):
            start = doc["countdown_ends_at"]
        else:
            created = doc.get("created_at")
            start = created if isinstance(created, datetime) else datetime.now(UTC)
        return start + timedelta(minutes=int(doc.get("duration_minutes") or 10)) + grace

    def _hash_client_ip(self, client_ip: str | None) -> str | None:
        """Salted digest of the client IP, or None when unconfigured.

        The raw address is never stored: it is personal data with no analytical
        value here beyond "same participant, same network". The salt keeps the
        digest from being reversed against a list of known addresses.
        """
        secret = _settings().competition_ip_hash_secret
        if not secret or not client_ip or client_ip == "unknown":
            return None
        return hashlib.sha256(f"{secret}:{client_ip}".encode()).hexdigest()[:32]

    async def _flag_if_implausibly_fast(
        self,
        *,
        battle_id: str,
        user_id: str,
        question_id: str,
        latency_ms: int,
    ) -> None:
        """Flag an answer far below the participant's own latency baseline.

        Measured against the participant's own median rather than a global
        constant, because a fast reader on a slow connection is suspicious
        *relative to their own history* while looking unremarkable in absolute
        terms. Two guards keep this from firing on noise: too few samples means
        there is no baseline to compare against, and a perfectly flat history has
        no spread to reason about.
        """
        settings = _settings()
        if latency_ms < settings.competition_min_answer_seconds * 1000:
            return

        latencies = await self._repository.find_user_latencies(
            battle_id=battle_id,
            user_id=user_id,
            exclude_question_id=question_id,
        )
        if len(latencies) < MIN_LATENCY_BASELINE_SAMPLES:
            return

        median = statistics.median(latencies)
        measured_deviation = statistics.pstdev(latencies) if len(latencies) > 1 else 0.0
        noise_floor = settings.competition_min_answer_seconds * 1000

        # A perfectly steady history has zero spread, which would put the floor
        # exactly at the median and flag every faster-than-median answer. Rather
        # than skip the check entirely (which would also hide a real outlier from
        # a consistently fast participant), fall back to the noise floor as the
        # spread estimate so the threshold stays meaningfully wide.
        deviation = max(measured_deviation, noise_floor)
        if median <= 0:
            return

        floor = median - settings.competition_latency_variance_sigma * deviation
        if latency_ms < floor:
            await self._repository.insert_integrity_flag(
                battle_id=battle_id,
                user_id=user_id,
                reason="latency_variance",
                detail={
                    "question_id": question_id,
                    "latency_ms": latency_ms,
                    "median_ms": round(median, 1),
                    # Both the measured spread and the one actually applied, so a
                    # reviewer can tell a genuinely flat history from a clamped
                    # one instead of seeing a spread that was never observed.
                    "stdev_ms": round(measured_deviation, 1),
                    "effective_stdev_ms": round(deviation, 1),
                    "noise_floor_ms": round(noise_floor, 1),
                    "threshold_ms": round(floor, 1),
                    "sample_count": len(latencies),
                },
            )

    async def _answer_summary(
        self,
        *,
        battle_id: str,
        user_id: str,
        question_id: str,
        correct: bool | None,
        earned_points: int,
        past_deadline: bool,
    ) -> TopicBattleAnswerResponse:
        """Verdict for one answer plus this participant's running totals.

        Totals are recomputed from stored submissions rather than incremented, so
        a retried or raced request cannot inflate them.
        """
        submissions = await self._repository.find_user_submissions(
            battle_id=battle_id,
            user_id=user_id,
        )
        graded = [s for s in submissions if s.get("correct") is not None]
        pending_review = [
            s
            for s in submissions
            if s.get("correct") is None and not s.get("past_deadline")
        ]

        return TopicBattleAnswerResponse(
            question_id=question_id,
            correct=correct,
            earned_points=earned_points,
            total_points=sum(int(s.get("earned_points") or 0) for s in submissions),
            correct_count=sum(1 for s in graded if s.get("correct") is True),
            answered_count=len(submissions),
            pending_review=bool(pending_review),
            past_deadline=past_deadline,
        )

    async def submit_topic_battle_answer(
        self,
        *,
        battle_id: str,
        user_id: str,
        payload: "TopicBattleAnswerRequest",
        client_ip: str | None = None,
    ) -> TopicBattleAnswerResponse:
        """Grade one answer on the server and persist it as the only evidence.

        This replaces a client-side verdict. The participant's browser used to
        receive the whole answer key and decide "correct" itself, which meant a
        paid competition's result was decided by the client that wanted to win.
        Grading server-side is also what makes completion auditable: the score is
        now derived from stored submissions instead of whatever number arrived
        with the finish request.

        Idempotent per question. A retried POST replays the original verdict
        rather than grading again, so points cannot be double-awarded.
        """
        await self.bootstrap()

        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")

        if str(doc.get("owner_user_id") or "") == user_id:
            raise PermissionDeniedError(
                "You cannot answer a battle you created.",
                code="host_cannot_answer",
            )
        if user_id not in [str(uid) for uid in doc.get("participants", [])]:
            raise PermissionDeniedError(
                "Join the battle before answering.",
                code="battle_not_joined",
            )

        questions = doc.get("questions", [])
        question = next(
            (q for q in questions if str(q.get("id", "")) == payload.question_id),
            None,
        )
        if question is None:
            raise NotFoundError(
                "Question not found in this battle.",
                code="battle_question_not_found",
            )

        existing = await self._repository.find_submission(
            battle_id=battle_id,
            user_id=user_id,
            question_id=payload.question_id,
        )
        if existing is not None:
            return await self._answer_summary(
                battle_id=battle_id,
                user_id=user_id,
                question_id=payload.question_id,
                correct=existing.get("correct"),
                earned_points=int(existing.get("earned_points") or 0),
                past_deadline=bool(existing.get("past_deadline")),
            )

        past_deadline = datetime.now(UTC) > self._battle_deadline(doc, user_id)

        # A late answer is recorded as evidence but scores nothing. Dropping it
        # would let a participant retry the same question for free.
        if past_deadline:
            correct: bool | None = None
            earned = 0
        else:
            correct = grade_stored_question(question, payload.answer)
            earned = int(float(question.get("points") or 0)) if correct is True else 0

        inserted = await self._repository.insert_submission(
            battle_id=battle_id,
            user_id=user_id,
            question_id=payload.question_id,
            answer=payload.answer,
            correct=correct,
            earned_points=earned,
            ip_hash=self._hash_client_ip(client_ip),
            latency_ms=payload.latency_ms,
            question_count=len(questions),
            past_deadline=past_deadline,
        )

        if not inserted:
            # Lost a race with a concurrent retry; replay the stored verdict.
            replay = await self._repository.find_submission(
                battle_id=battle_id,
                user_id=user_id,
                question_id=payload.question_id,
            )
            replay = replay or {}
            return await self._answer_summary(
                battle_id=battle_id,
                user_id=user_id,
                question_id=payload.question_id,
                correct=replay.get("correct"),
                earned_points=int(replay.get("earned_points") or 0),
                past_deadline=bool(replay.get("past_deadline")),
            )

        if not past_deadline and payload.latency_ms is not None:
            await self._flag_if_implausibly_fast(
                battle_id=battle_id,
                user_id=user_id,
                question_id=payload.question_id,
                latency_ms=payload.latency_ms,
            )

        return await self._answer_summary(
            battle_id=battle_id,
            user_id=user_id,
            question_id=payload.question_id,
            correct=correct,
            earned_points=earned,
            past_deadline=past_deadline,
        )

    async def record_integrity_event(
        self,
        *,
        battle_id: str,
        user_id: str,
        payload: "IntegrityEventRequest",
    ) -> IntegrityEventResponse:
        """Log a client-reported proctoring signal and flag past the threshold.

        `violation` is derived server-side from the event type rather than read
        from the payload, so a caller cannot relabel a tab-switch as harmless.
        These signals are advisory and never alter a score; every one of them is
        individually forgeable by a determined participant, which is why the
        outcome is a human review queue entry rather than a disqualification.
        """
        await self.bootstrap()

        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        if user_id not in [str(uid) for uid in doc.get("participants", [])]:
            raise PermissionDeniedError(
                "Only participants can report integrity events.",
                code="battle_not_joined",
            )

        violation = payload.event_type in INTEGRITY_VIOLATION_TYPES
        await self._repository.insert_integrity_event(
            battle_id=battle_id,
            user_id=user_id,
            event_type=payload.event_type.value,
            question_id=payload.question_id,
            violation=violation,
            detail=payload.detail,
        )

        violation_count = 0
        auto_flagged = False
        if violation:
            violation_count = await self._repository.count_integrity_violations(
                battle_id=battle_id,
                user_id=user_id,
            )
            threshold = _settings().competition_max_integrity_violations
            auto_flagged = violation_count >= threshold
            if auto_flagged:
                await self._repository.insert_integrity_flag(
                    battle_id=battle_id,
                    user_id=user_id,
                    reason="proctoring_violations",
                    detail={
                        "violation_count": violation_count,
                        "threshold": threshold,
                    },
                )

        return IntegrityEventResponse(
            recorded=True,
            violation_count=violation_count,
            auto_flagged=auto_flagged,
        )

    async def join_topic_battle(
        self,
        *,
        battle_id: str,
        user_id: str,
    ) -> TopicBattleResponse:
        await self.bootstrap()
        from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError

        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")

        owner_user_id = doc.get("owner_user_id")
        if owner_user_id is not None and user_id == owner_user_id:
            raise PermissionDeniedError(
                "You cannot join a battle you created. Manage or track it instead.",
                code="cannot_join_own_battle",
            )

        participants = list(doc.get("participants", []))
        if user_id in participants:
            return self._repository.doc_to_response(doc, viewer_user_id=user_id)

        points = _points_for_difficulty(str(doc.get("difficulty", "Intermediate")))

        updated, seated = await self._repository.join_topic_battle_with_stats(
            battle_id,
            user_id,
            increments={"joined": 1, "points": points},
        )
        if updated is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        if not seated:
            participants = set(updated.get("participants", []))
            if user_id in participants:
                return self._repository.doc_to_response(updated, viewer_user_id=user_id)
            raise ConflictError(
                "This battle is full.",
                code="topic_battle_full",
            )
        await self._record_event(
            entity_type="topic_battle",
            entity_id=battle_id,
            event_type="join",
            actor_user_id=user_id,
            detail={"points": points, "difficulty": updated.get("difficulty")},
        )
        await self._sync_battle_row_after_change(battle_id, user_id)
        return self._repository.doc_to_response(updated, viewer_user_id=user_id)

    async def get_topic_battle_leaderboard(
        self,
        *,
        battle_id: str,
    ) -> TopicBattleLeaderboardResponse:
        """Server-derived standings for a battle.

        Ranks come from persisted completion records and the difficulty points
        already credited at join time — never from anything the client sends.
        This replaces the synthetic leaderboard the duel view used to build
        locally, which invented opponents and scores that no user ever earned.

        Ties share a rank (dense ranking, so ranks stay contiguous) and are ordered
        by who finished first, so a later finisher cannot displace an earlier
        one purely by re-reading the board.
        """
        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")

        owner_user_id = str(doc.get("owner_user_id") or "")
        completed = [str(uid) for uid in doc.get("completed_user_ids", [])]
        if not completed:
            return TopicBattleLeaderboardResponse(
                battle_id=battle_id,
                entries=[],
                total_completed=0,
            )

        difficulty = str(doc.get("difficulty", "Intermediate"))
        points_per_player = _points_for_difficulty(difficulty)

        # De-duplicate while preserving completion order, then let the identity
        # lookup resolve display names in one round trip.
        ordered_ids: list[str] = []
        seen: set[str] = set()
        for uid in completed:
            if uid not in seen:
                seen.add(uid)
                ordered_ids.append(uid)

        profiles = await self._repository.find_user_profiles(ordered_ids)

        # Rank on points actually earned, summed from stored graded submissions,
        # so a perfect run outranks a guess and a wrong answer costs something.
        # The flat difficulty value is only a fallback for battles finished before
        # submissions were recorded; it is skipped entirely once the battle has
        # any submission at all, otherwise scoring a new battle by participation
        # alone would hand out equal points to everyone who just joined and left.
        earned: dict[str, int] = {}
        has_submissions = False
        for uid in ordered_ids:
            submissions = await self._repository.find_user_submissions(
                battle_id=battle_id,
                user_id=uid,
            )
            if submissions:
                has_submissions = True
            earned[uid] = sum(int(s.get("earned_points") or 0) for s in submissions)

        entries: list[TopicBattleLeaderboardEntry] = []
        for finish_index, uid in enumerate(ordered_ids):
            profile = profiles.get(uid, {})
            points = earned[uid] if has_submissions else points_per_player
            entries.append(
                TopicBattleLeaderboardEntry(
                    rank=0,
                    user_id=uid,
                    name=str(profile.get("name") or "Player"),
                    avatar_url=profile.get("avatar_url"),
                    points=points,
                    is_owner=bool(owner_user_id) and uid == owner_user_id,
                    finish_order=finish_index,
                )
            )

        # Highest score first; equal scores keep the order they finished in, so a
        # later finisher cannot displace an earlier one just by re-reading the
        # board.
        entries.sort(key=lambda row: (-row.points, row.finish_order))

        # Dense ranking: tied players share a rank, and the next distinct score
        # takes the very next number (1, 1, 2, 2, 3). Ranks stay contiguous, so
        # "rank 2" is never empty and a tie never consumes a place.
        previous_points: int | None = None
        rank = 0
        for row in entries:
            if row.points != previous_points:
                rank += 1
                previous_points = row.points
            row.rank = rank

        return TopicBattleLeaderboardResponse(
            battle_id=battle_id,
            entries=entries,
            total_completed=len(entries),
        )

    async def cancel_topic_battle(
        self,
        *,
        battle_id: str,
        user_id: str,
    ) -> TopicBattleResponse:
        """Owner cancels a battle that has not launched yet (scheduled only).

        A cancelled battle disappears from active play (scheduled and filling
        lobbies filter it) but stays in the management table so hosts can see
        what they called off.
        """
        await self.bootstrap()
        from app.core.exceptions import ConflictError

        doc = await self._require_battle_owner(battle_id, user_id)
        if doc.get("status") != "scheduled":
            raise ConflictError(
                "Only scheduled battles can be cancelled.",
                code="topic_battle_not_scheduled",
            )
        updated = await self._repository.patch_topic_battle(battle_id, {"status": "cancelled"})
        await self._record_event(
            entity_type="topic_battle",
            entity_id=battle_id,
            event_type="cancel",
            actor_user_id=user_id,
            detail={"previous_status": "scheduled"},
        )
        await self._sync_battle_row_after_change(battle_id, user_id)
        return self._repository.doc_to_response(updated, viewer_user_id=user_id)

    async def complete_topic_battle(
        self,
        *,
        battle_id: str,
        user_id: str,
    ) -> TopicBattleResponse:
        """Mark the user as having finished a battle they joined.

        A battle can only be completed once per user; later calls are
        idempotent and return the current state (no re-take, no re-award).

        Completion requires at least one persisted submission. Previously this
        endpoint only checked seat membership, so finishing was a free action
        that could be called without answering anything - it now means "finished
        an attempt that was actually graded", which is what the leaderboard and
        prize payouts assume it means.
        """
        await self.bootstrap()
        from app.core.exceptions import NotFoundError, PermissionDeniedError

        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")

        participants = list(doc.get("participants", []))
        completed_user_ids = list(doc.get("completed_user_ids", []))
        if user_id not in participants:
            raise PermissionDeniedError(
                "Join the battle before finishing it.",
                code="battle_not_joined",
            )
        if user_id in completed_user_ids:
            return self._repository.doc_to_response(doc, viewer_user_id=user_id)

        answered = await self._repository.count_user_submissions(
            battle_id=battle_id,
            user_id=user_id,
        )
        if answered == 0:
            raise ConflictError(
                "Submit at least one answer before finishing the battle.",
                code="no_submissions",
            )

        updated = await self._repository.mark_topic_battle_completed(battle_id, user_id)
        if updated is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        await self._record_event(
            entity_type="topic_battle",
            entity_id=battle_id,
            event_type="complete",
            actor_user_id=user_id,
            detail={"participants": len(participants) + 1},
        )
        await self._sync_battle_row_after_change(battle_id, user_id)
        return self._repository.doc_to_response(updated, viewer_user_id=user_id)

    # ========================================================================
    # Battle management table (per-battle, owner-only)
    # ========================================================================

    async def bootstrap_topic_battle_management_table(
        self, *, battle_id: str, user_id: str,
    ) -> ManagementTableInstanceBundleResponse:
        """Bootstrap (or load) the management table for one hosted battle.

        Idempotent: reuses the existing instance for ``comp_battle_{battle_id}``
        and refreshes the battle row from the current document.
        """
        await self.bootstrap()
        doc = await self._require_battle_owner(battle_id, user_id)
        mgt = self._management_table_service
        if mgt is None:
            raise PermissionDeniedError(
                "Management tables are unavailable.",
                code="management_table_unavailable",
            )
        workspace_item_id = f"{_MT_BATTLE_WORKSPACE_PREFIX}{battle_id}"
        bundle = await mgt.comp_bootstrap_scoped(
            org_id=_MT_ORG_ID, user_id=user_id,
            workspace_item_id=workspace_item_id,
            title=_MT_BATTLE_TABLE_TITLE,
            columns=_mt_starter_columns(),
        )
        await self._sync_battle_row_to_table(
            battle_id=battle_id, user_id=user_id, doc=doc, instance_id=bundle.instance.id
        )
        return bundle

    async def get_topic_battle_management_table(
        self, *, battle_id: str, user_id: str,
    ) -> ManagementTableInstanceBundleResponse:
        """Load the management-table bundle for a hosted battle."""
        inst = await self._get_battle_management_instance(battle_id, user_id)
        mgt = self._management_table_service
        assert mgt is not None
        return await mgt.comp_get_instance_bundle(
            org_id=_MT_ORG_ID, user_id=user_id, instance_id=str(inst["_id"]),
        )

    async def list_topic_battle_management_rows(
        self, *, battle_id: str, user_id: str,
        group_id: str | None, page: int, page_size: int,
    ) -> ManagementTableRowListResponse:
        """List rows of a hosted battle's management table."""
        inst = await self._get_battle_management_instance(battle_id, user_id)
        mgt = self._management_table_service
        assert mgt is not None
        return await mgt.comp_list_rows(
            org_id=_MT_ORG_ID, user_id=user_id, instance_id=str(inst["_id"]),
            group_id=group_id, page=page, page_size=page_size,
        )

    async def patch_topic_battle_management_row(
        self, *, battle_id: str, user_id: str, row_id: str,
        payload: ManagementTableRowCellsPatchInput,
    ) -> ManagementTableRowPublic:
        """Patch a management-table row and sync editable cells to the battle."""
        await self.bootstrap()
        await self._require_battle_owner(battle_id, user_id)
        inst = await self._get_battle_management_instance(battle_id, user_id)
        instance_id = str(inst["_id"])
        mgt = self._management_table_service
        assert mgt is not None
        bundle = await mgt.comp_get_instance_bundle(
            org_id=_MT_ORG_ID, user_id=user_id, instance_id=instance_id,
        )
        row = await mgt.comp_patch_row(
            org_id=_MT_ORG_ID, user_id=user_id,
            instance_id=instance_id, row_id=row_id, payload=payload,
        )
        columns = _mt_cell_columns(bundle.definition.columns)
        updates = _mt_cells_to_battle_fields(columns, row.cells)
        if updates:
            updated_doc = await self._repository.patch_topic_battle(battle_id, updates)
            if updated_doc is not None:
                cells = _mt_battle_cells(columns, updated_doc)
                await mgt.comp_upsert_first_row(
                    org_id=_MT_ORG_ID, user_id=user_id,
                    instance_id=instance_id, cells=cells,
                )
        return row

    async def _require_battle_owner(self, battle_id: str, user_id: str) -> dict[str, Any]:
        """Load a battle and enforce that ``user_id`` hosts it."""
        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        if not user_id or str(doc.get("owner_user_id") or "") != user_id:
            raise PermissionDeniedError(
                "You can only manage battles you host.",
                code="cannot_manage_battle",
            )
        return doc

    async def _get_battle_management_instance(
        self, battle_id: str, user_id: str,
    ) -> dict[str, Any]:
        """Load the management-table instance for a battle (owner-only)."""
        await self._require_battle_owner(battle_id, user_id)
        mgt = self._management_table_service
        if mgt is None:
            raise PermissionDeniedError(
                "Management tables are unavailable.",
                code="management_table_unavailable",
            )
        inst = await mgt.comp_find_instance_by_workspace_item(
            org_id=_MT_ORG_ID, user_id=user_id,
            workspace_item_id=f"{_MT_BATTLE_WORKSPACE_PREFIX}{battle_id}",
        )
        if inst is None:
            raise NotFoundError(
                "Battle management table not found. Open it first.",
                code="management_table_instance_not_found",
            )
        return inst

    async def _sync_battle_row_to_table(
        self, *, battle_id: str, user_id: str, doc: dict[str, Any], instance_id: str,
    ) -> None:
        """Project the battle document onto the table's first row."""
        mgt = self._management_table_service
        assert mgt is not None
        bundle = await mgt.comp_get_instance_bundle(
            org_id=_MT_ORG_ID, user_id=user_id, instance_id=instance_id,
        )
        columns = _mt_cell_columns(bundle.definition.columns)
        await mgt.comp_upsert_first_row(
            org_id=_MT_ORG_ID, user_id=user_id,
            instance_id=instance_id, cells=_mt_battle_cells(columns, doc),
        )

    async def sweep_stale_filling_battles(self, older_than: datetime) -> int:
        """Cancel `filling` battles idle since `older_than`; returns the count.

        Kept on the service (not the launcher) so the audit row is written in
        the same place as every other state change. A cancelled no-show looks
        identical to an owner-initiated cancel without it.
        """
        stale = await self._repository.find_stale_filling_battles(older_than)
        for doc in stale:
            battle_id = str(doc.get("_id"))
            if not battle_id:
                continue
            await self._repository.patch_topic_battle(battle_id, {"status": "cancelled"})
            await self._record_event(
                entity_type="topic_battle",
                entity_id=battle_id,
                event_type="cancel",
                actor_user_id="system:stale-sweep",
                detail={"previous_status": "filling", "reason": "idle_timeout"},
            )
        return len(stale)

    async def record_event(
        self,
        *,
        entity_type: str,
        entity_id: str,
        event_type: str,
        actor_user_id: str | None,
        detail: dict[str, Any] | None = None,
    ) -> None:
        """Public audit hook for background jobs that change competition state."""
        await self._record_event(
            entity_type=entity_type,
            entity_id=entity_id,
            event_type=event_type,
            actor_user_id=actor_user_id,
            detail=detail,
        )

    async def _record_event(
        self,
        *,
        entity_type: str,
        entity_id: str,
        event_type: str,
        actor_user_id: str | None,
        detail: dict[str, Any] | None = None,
    ) -> None:
        """Append an audit row for a state-changing competition action.

        `topic_battles.updated_at` was previously the only forensic trace, which
        cannot distinguish "cancelled by the owner" from "swept after 24h idle".
        The repository swallows its own failures so this can be called inline
        without wrapping every call site in a try/except.
        """
        await self._repository.insert_competition_event(
            entity_type=entity_type,
            entity_id=entity_id,
            event_type=event_type,
            actor_user_id=actor_user_id,
            detail=detail,
        )

    async def _sync_battle_row_after_change(self, battle_id: str, user_id: str) -> None:
        """Best-effort refresh of the owner's battle row (join/complete flows).

        Runs with the battle owner's identity so participant joins/completions
        still update the row the host sees. Never breaks the calling flow.
        """
        if not user_id or self._management_table_service is None:
            return
        try:
            doc = await self._repository.find_topic_battle_by_id(battle_id)
            if doc is None:
                return
            owner_id = str(doc.get("owner_user_id") or "")
            if not owner_id:
                return
            inst = await self._get_battle_management_instance(battle_id, owner_id)
            await self._sync_battle_row_to_table(
                battle_id=battle_id, user_id=owner_id,
                doc=doc, instance_id=str(inst["_id"]),
            )
        except Exception:
            # Table sync is non-critical: never break join/complete on it.
            pass

    async def autofill_competition_management_table(
        self, *, org_id: str, user_id: str,
    ) -> ManagementTableInstanceBundleResponse:
        """Bootstrap (or load) the per-user "My Competitions" blank table.

        The table starts with no columns/rows; the owner composes them from the
        UI. This returns the empty bundle so the view can render a fresh grid.
        """
        mgt = self._management_table_service
        if mgt is None:
            raise PermissionDeniedError(
                "Management tables are unavailable.",
                code="management_table_unavailable",
            )
        return await mgt.bootstrap_competition_management_table(
            org_id=org_id, user_id=user_id,
        )

    async def populate_row_from_battle(
        self, *, org_id: str, user_id: str, instance_id: str, row_id: str, battle_id: str,
    ) -> ManagementTableRowPublic:
        """Fill a management-table row with a hosted battle's data.

        Maps the battle document onto the table's columns by matching column
        title (Name/Status/Start Date/End Date/Prize Pool/Link/Players, etc.).
        Only fills cells whose column is editable; the caller must own both the
        table and the battle.
        """
        mgt = self._management_table_service
        if mgt is None:
            raise PermissionDeniedError(
                "Management tables are unavailable.",
                code="management_table_unavailable",
            )
        battle = await self._repository.find_topic_battle_by_id(battle_id)
        if battle is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        owner_id = str(battle.get("owner_user_id") or "")
        if not owner_id or owner_id != user_id:
            raise PermissionDeniedError(
                "You can only link competitions you host.",
                code="cannot_manage_battle",
            )
        bundle = await mgt.comp_get_instance_bundle(org_id=org_id, user_id=user_id, instance_id=instance_id)
        cells = _battle_to_row_cells(
            [
                {"id": c.id, "title": str(c.title), "type": str(c.type)}
                for c in bundle.definition.columns
            ],
            dict(battle),
            battle_id,
        )
        row = await mgt.comp_patch_row(
            org_id=org_id, user_id=user_id, instance_id=instance_id,
            row_id=row_id, payload=ManagementTableRowCellsPatchInput(cells=cells),
        )
        await mgt.comp_set_row_linked_battle(
            org_id=org_id, user_id=user_id, instance_id=instance_id,
            row_id=row_id, linked_battle_id=battle_id,
        )
        return row

    async def resync_linked_competition_rows(
        self, *, org_id: str, user_id: str, instance_id: str,
    ) -> int:
        """Fill newly added columns on linked rows from their linked battles.

        Called after the column set changes so an already-linked row keeps its
        data current without the owner re-linking.
        """
        mgt = self._management_table_service
        if mgt is None:
            return 0

        async def populate(row_id: str, battle_id: str) -> dict[str, Any]:
            battle = await self._repository.find_topic_battle_by_id(battle_id)
            if battle is None:
                return {}
            bundle = await mgt.comp_get_instance_bundle(
                org_id=org_id, user_id=user_id, instance_id=instance_id,
            )
            return _battle_to_row_cells(
                [
                    {"id": c.id, "title": str(c.title), "type": str(c.type)}
                    for c in bundle.definition.columns
                ],
                dict(battle),
                battle_id,
            )

        return await mgt.comp_resync_linked_rows(
            org_id=org_id, user_id=user_id, instance_id=instance_id,
            populate=populate,
        )
