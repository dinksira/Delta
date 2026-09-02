"""Topic battle service — creation and listing logic."""

from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.domain.competitions.repository import Repository
from app.domain.competitions.schemas import (
    AchievementResponse,
    CodingQuestionSchema,
    CompetitionHubResponse,
    CompetitionModeResponse,
    DesignPayloadSchema,
    MarkdownPayloadSchema,
    QuestionCreateRequest,
    QuestionResponse,
    QuestionUpdateRequest,
    TopicBattleCreateRequest,
    TopicBattleListResponse,
    TopicBattleResponse,
    UserStatusResponse,
)
from app.domain.management_table.schemas import (
    ManagementTableInstanceBundleResponse,
    ManagementTableRowCellsPatchInput,
    ManagementTableRowListResponse,
    ManagementTableRowPublic,
)
from app.domain.management_table.service import ManagementTableService

# ################################ CONSTANTS ################################
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
        "players_joined": 1,
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
        "players_joined": 1,
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
        "players_joined": 3,
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
        "players_joined": 6,
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
        "players_joined": 2,
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
        "players_joined": 1,
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
        "players_joined": 2,
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
        "players_joined": 2,
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
        "players_joined": 3,
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
        "players_joined": 1,
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
        "players_joined": 4,
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
        "players_joined": 2,
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
        "players_joined": 1,
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
        "players_joined": 3,
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
        "players_joined": 5,
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
        "players_joined": 2,
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
        "players_joined": 8,
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
        "players_joined": 7,
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
        "players_joined": 4,
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
        "players_joined": 3,
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


def _achievement_rules() -> list[dict[str, object]]:
    return [
        {
            "id": "first-battle",
            "title": "First Steps",
            "description": "Joined your first competition",
            "unlocked_when": lambda s: s["joined"] >= 1,
        },
        {
            "id": "showrunner",
            "title": "Showrunner",
            "description": "Hosted your first competition",
            "unlocked_when": lambda s: s["hosted"] >= 1,
        },
        {
            "id": "regular-10",
            "title": "Regular",
            "description": "Joined 10 competitions",
            "unlocked_when": lambda s: s["joined"] >= 10,
        },
        {
            "id": "champion",
            "title": "Champion",
            "description": "Won your first competition",
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


def _create_request_to_question_dict(q: QuestionCreateRequest) -> dict:
    return {
        "id": f"q_{uuid4().hex}",
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
            cells[col_id] = int(doc.get("players_joined", 0))
        elif derived == "_questions_count":
            cells[col_id] = len(questions)
        elif derived == "_link":
            cells[col_id] = f"/features/competitions/{battle_id}"
        else:
            cells[col_id] = ""
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
    ) -> None:
        self._repository = repository
        self._management_table_service = management_table_service

    async def bootstrap(self) -> None:
        await self._repository.ensure_indexes()
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
        """
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
                    "players_joined": int(seed["players_joined"]),
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
        await self.bootstrap()
        docs = await self._repository.find_all_modes()
        return [CompetitionModeResponse(**doc) for doc in docs]

    async def get_user_status(self, *, user_id: str | None) -> UserStatusResponse:
        if user_id is None:
            stats = None
        else:
            stats = await self._repository.get_user_stats(user_id)

        points = int(stats.get("points", 0)) if stats else 0
        earnings_etb = int(stats.get("earnings_etb", 0)) if stats else 0
        won = int(stats.get("won", 0)) if stats else 0

        level = 1 + points // _POINTS_PER_LEVEL
        band = points % _POINTS_PER_LEVEL

        return UserStatusResponse(
            level=level,
            rank=_rank_for_level(level),
            progress_label="Progress",
            progress_value=float(band),
            progress_text=f"{band}/{_POINTS_PER_LEVEL} PTS",
            earnings=f"{earnings_etb:,} ETB",
            won=won,
        )

    async def list_achievements(self, *, user_id: str | None) -> list[AchievementResponse]:
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
            unlocked = bool(rule["unlocked_when"](stats))
            unlocked_at = stats.get("unlocked_at")
            responses.append(
                AchievementResponse(
                    id=str(rule["id"]),
                    title=str(rule["title"]),
                    description=str(rule["description"]),
                    unlocked=unlocked,
                    unlocked_at=str(unlocked_at) if unlocked_at else None,
                )
            )
        return responses

    async def get_hub(self, *, user_id: str | None) -> CompetitionHubResponse:
        modes = await self.list_modes()
        user_status = await self.get_user_status(user_id=user_id)
        achievements = await self.list_achievements(user_id=user_id)

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
        await self.bootstrap()
        docs = await self._repository.find_all_topic_battles()
        battles = [self._repository.doc_to_response(doc, viewer_user_id=user_id) for doc in docs]
        return TopicBattleListResponse(battles=battles, total=len(battles))

    async def get_topic_battle(
        self,
        *,
        battle_id: str,
        user_id: str | None = None,
    ) -> TopicBattleResponse:
        await self.bootstrap()
        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        return self._repository.doc_to_response(doc, viewer_user_id=user_id)

    async def join_topic_battle(
        self,
        *,
        battle_id: str,
        user_id: str | None = None,
    ) -> TopicBattleResponse:
        await self.bootstrap()
        from app.core.exceptions import NotFoundError, PermissionDeniedError

        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")

        owner_user_id = doc.get("owner_user_id")
        if user_id is not None and owner_user_id is not None and user_id == owner_user_id:
            raise PermissionDeniedError(
                "You cannot join a battle you created. Manage or track it instead.",
                code="cannot_join_own_battle",
            )

        participants = list(doc.get("participants", []))
        if user_id is not None and user_id in participants:
            return self._repository.doc_to_response(doc, viewer_user_id=user_id)

        updated = await self._repository.join_topic_battle(battle_id, user_id)
        if updated is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        if user_id is not None:
            points = _points_for_difficulty(
                str(updated.get("difficulty", "Intermediate")),
            )
            await self._repository.increment_user_stats(
                user_id,
                {"joined": 1, "points": points},
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

        updated = await self._repository.mark_topic_battle_completed(battle_id, user_id)
        if updated is None:
            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
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
        await self.bootstrap()
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
        await self.bootstrap()
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
        """Bootstrap the per-user "My Competitions" table and fill one row per
        battle the user hosts.

        Idempotent: existing rows are matched by their ``Link`` cell and patched,
        so re-opening the tab never duplicates a battle.
        """
        mgt = self._management_table_service
        if mgt is None:
            raise PermissionDeniedError(
                "Management tables are unavailable.",
                code="management_table_unavailable",
            )
        bundle = await mgt.bootstrap_competition_management_table(org_id=org_id, user_id=user_id)
        col_by_title = {str(c.title).strip(): str(c.id) for c in bundle.definition.columns}

        await mgt.comp_ensure_status_options(
            org_id=org_id, user_id=user_id,
            definition_id=bundle.definition.id,
            battle_statuses=[
                {"id": "filling", "label": "Filling"},
                {"id": "scheduled", "label": "Scheduled"},
                {"id": "live", "label": "Live"},
                {"id": "finished", "label": "Finished"},
            ],
        )

        def _cells(doc: dict[str, Any]) -> dict[str, Any]:
            cells: dict[str, Any] = {}

            def put(title: str, value: Any) -> None:
                cid = col_by_title.get(title)
                if cid:
                    cells[cid] = value

            ends = doc.get("countdown_ends_at")
            put("Name", str(doc.get("title", "")))
            put("Status", str(doc.get("status", "filling")))
            put("Start Date", str(doc.get("schedule_date", "")))
            put("End Date", str(ends) if ends else "")
            put("Prize Pool", str(doc.get("prize_pool", "0 ETB")))
            put("Link", f"/features/competitions/{doc['_id']}")
            return cells

        docs = await self._repository.find_all_topic_battles_by_owner(user_id)
        rows = [
            {"key": f"/features/competitions/{doc['_id']}", "cells": _cells(doc)}
            for doc in docs
        ]
        if rows:
            await mgt.comp_sync_owned_rows(
                org_id=org_id, user_id=user_id,
                instance_id=bundle.instance.id, battle_rows=rows,
            )
        return bundle

    # ========================================================================
    # Question CRUD (embedded in battle document)
    # ========================================================================

    async def add_question(
        self,
        *,
        battle_id: str,
        payload: QuestionCreateRequest,
    ) -> QuestionResponse:
        await self.bootstrap()
        question_dict = _create_request_to_question_dict(payload)
        doc = await self._repository.push_question(battle_id, question_dict)
        if doc is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        questions = doc.get("questions", [])
        q = next((q for q in questions if q["id"] == question_dict["id"]), None)
        if q is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Question not found after insert.", code="question_not_found")
        return self._repository.question_doc_to_response(q)

    async def get_question(
        self,
        *,
        battle_id: str,
        question_id: str,
    ) -> QuestionResponse:
        await self.bootstrap()
        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        questions = doc.get("questions", [])
        q = next((q for q in questions if q["id"] == question_id), None)
        if q is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Question not found.", code="question_not_found")
        return self._repository.question_doc_to_response(q)

    async def list_questions(
        self,
        *,
        battle_id: str,
    ) -> list[QuestionResponse]:
        await self.bootstrap()
        doc = await self._repository.find_topic_battle_by_id(battle_id)
        if doc is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Topic battle not found.", code="topic_battle_not_found")
        questions = doc.get("questions", [])
        return [self._repository.question_doc_to_response(q) for q in questions]

    async def update_question(
        self,
        *,
        battle_id: str,
        question_id: str,
        payload: QuestionUpdateRequest,
    ) -> QuestionResponse:
        await self.bootstrap()
        update_fields = payload.model_dump(exclude_none=True, exclude={"test_cases"})
        if payload.test_cases is not None:
            update_fields["test_cases"] = [t.model_dump() for t in payload.test_cases]

        if not update_fields:
            from app.core.exceptions import ValidationError

            raise ValidationError("No fields to update.", code="no_update_fields")

        doc = await self._repository.update_question(
            battle_id=battle_id,
            question_id=question_id,
            update_fields=update_fields,
        )
        if doc is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Topic battle or question not found.", code="question_not_found")
        questions = doc.get("questions", [])
        q = next((q for q in questions if q["id"] == question_id), None)
        if q is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Question not found after update.", code="question_not_found")
        return self._repository.question_doc_to_response(q)

    async def delete_question(
        self,
        *,
        battle_id: str,
        question_id: str,
    ) -> None:
        await self.bootstrap()
        result = await self._repository.pull_question(battle_id, question_id)
        if result is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Topic battle or question not found.", code="question_not_found")
