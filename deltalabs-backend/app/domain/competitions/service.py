"""Topic battle service — creation and listing logic."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
import re
from typing import Any
from uuid import uuid4

from app.domain.competitions.repository import Repository
from app.domain.competitions.schemas import (
    AchievementResponse,
    CodingQuestionSchema,
    CompetitionHubResponse,
    CompetitionModeResponse,
    QuestionCreateRequest,
    QuestionResponse,
    QuestionUpdateRequest,
    TopicBattleCreateRequest,
    TopicBattleListResponse,
    TopicBattleResponse,
    UserStatusResponse,
)

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
        "matching_pairs": [p.model_dump() for p in q.matching_pairs],
        "ordering_items": [o.model_dump() for o in q.ordering_items],
    }


def _create_request_to_question_dict(q: QuestionCreateRequest) -> dict:
    return {
        "id": f"q_{uuid4().hex}",
        "title": q.title,
        "description": q.description,
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
        "matching_pairs": [p.model_dump() for p in q.matching_pairs],
        "ordering_items": [o.model_dump() for o in q.ordering_items],
    }


class Service:
    def __init__(self, repository: Repository) -> None:
        self._repository = repository

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
        return self._repository.doc_to_response(updated, viewer_user_id=user_id)

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
