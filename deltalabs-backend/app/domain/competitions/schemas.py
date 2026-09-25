"""Competitions domain schemas for topic battle CRUD.

NOTE: Every `serialization_alias=` on a snake_case field must also have a
matching `validation_alias=`. Pydantic v2 treats `serialization_alias` as
OUTPUT-only, so camelCase fields from the frontend (e.g. "isSample", "testCases")
would NOT populate the Python attributes without a validation alias.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DomainEntity(BaseModel):
    id: str


def _alias(name: str) -> dict[str, str]:
    """Return both validation_alias and serialization_alias for a camelCase name."""
    return {"validation_alias": name, "serialization_alias": name}


class TestCaseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    input: str = Field(default="")
    expected_output: str = Field(default="", **_alias("expectedOutput"))
    explanation: str = Field(default="")
    is_sample: bool = Field(default=False, **_alias("isSample"))
    is_hidden: bool = Field(default=False, **_alias("isHidden"))


class McqOptionSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(default="")
    label: str = Field(default="")
    text: str = Field(default="")


class MatchingAnswerSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(default="")
    text: str = Field(default="")


class MatchPairSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(default="")
    prompt: str = Field(default="")
    answer_id: str = Field(default="", **_alias("answerId"))


class OrderItemSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(default="")
    text: str = Field(default="")


class MediaAssetSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(default="")
    url: str = Field(default="")
    kind: str = Field(default="image")


class MarkdownPayloadSchema(BaseModel):
    """Payload authored by the Markdown Pad workspace module (kind "markdown")."""

    model_config = ConfigDict(populate_by_name=True)

    source: str = Field(default="", max_length=100_000)
    rubric: str = Field(default="")


class DesignPayloadSchema(BaseModel):
    """Payload authored by the Design Canvas workspace module (kind "design")."""

    model_config = ConfigDict(populate_by_name=True)

    brief: str = Field(default="", max_length=100_000)
    cover: MediaAssetSchema | None = Field(default=None)
    canvas_width: int = Field(
        default=1080, ge=64, le=4096, **_alias("canvasWidth"),
    )
    canvas_height: int = Field(
        default=1080, ge=64, le=4096, **_alias("canvasHeight"),
    )
    deliverables: list[str] = Field(default_factory=list)
    rubric: str = Field(default="")


class CodingQuestionSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(default="")
    title: str = Field(default="", max_length=200)
    description: str = Field(default="")
    constraints: str = Field(default="", max_length=4000)
    code_template: str = Field(default="", **_alias("codeTemplate"))
    language: str = Field(default="HTML", max_length=50)
    difficulty: str = Field(default="EASY", max_length=20)
    time_limit_minutes: int = Field(
        default=10, ge=1, le=180, **_alias("timeLimitMinutes"),
    )
    points: float = Field(default=1.0, ge=0)
    hint_enabled: bool = Field(default=True, **_alias("hintEnabled"))
    hint_text: str = Field(default="", **_alias("hintText"))
    test_cases: list[TestCaseSchema] = Field(
        default_factory=list, **_alias("testCases"),
    )
    kind: str = Field(default="coding", max_length=30)
    mcq_options: list[McqOptionSchema] = Field(
        default_factory=list, **_alias("mcqOptions"),
    )
    mcq_correct_id: str = Field(default="", **_alias("mcqCorrectId"))
    tf_answer: bool = Field(default=True, **_alias("tfAnswer"))
    fill_expected: str = Field(default="", **_alias("fillExpected"))
    fill_answers: list[str] = Field(
        default_factory=list, **_alias("fillAnswers"),
    )
    matching_answers: list[MatchingAnswerSchema] = Field(
        default_factory=list, **_alias("matchingAnswers"),
    )
    matching_pairs: list[MatchPairSchema] = Field(
        default_factory=list, **_alias("matchingPairs"),
    )
    ordering_items: list[OrderItemSchema] = Field(
        default_factory=list, **_alias("orderingItems"),
    )
    markdown: MarkdownPayloadSchema = Field(
        default_factory=MarkdownPayloadSchema,
    )
    design: DesignPayloadSchema = Field(
        default_factory=DesignPayloadSchema,
    )


class TopicBattleCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    subject: str = Field(min_length=1, max_length=100)
    difficulty: str = Field(default="Mixed", max_length=50)
    entry_fee: str = Field(default="Free", max_length=50, **_alias("entryFee"))
    prize_pool: str = Field(default="0 ETB", max_length=50, **_alias("prizePool"))
    players_max: int = Field(default=2, ge=2, le=1000, **_alias("playersMax"))
    creator_name: str = Field(default="You", max_length=100, **_alias("creatorName"))
    schedule_date: str = Field(default="", max_length=20, **_alias("scheduleDate"))
    schedule_time: str = Field(default="", max_length=10, **_alias("scheduleTime"))
    schedule_timezone: str = Field(default="UTC", max_length=50, **_alias("scheduleTimezone"))
    format: str = Field(default="mini", max_length=30)
    duration_minutes: int = Field(default=10, ge=1, le=1440, **_alias("durationMinutes"))
    visibility: str = Field(default="public", max_length=20)
    timing: str = Field(default="instant", max_length=20)
    prize_rule: str = Field(default="winner-takes-all", max_length=40, **_alias("prizeRule"))
    question_pool_mode: str = Field(default="auto", max_length=20, **_alias("questionPoolMode"))
    easy_pct: int = Field(default=0, ge=0, le=100, **_alias("easyPct"))
    medium_pct: int = Field(default=100, ge=0, le=100, **_alias("mediumPct"))
    hard_pct: int = Field(default=0, ge=0, le=100, **_alias("hardPct"))
    questions: list[CodingQuestionSchema] = Field(default_factory=list)


class TopicBattleResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    subject: str
    difficulty: str
    status: str
    countdown_ends_at: str | None = Field(default=None, **_alias("countdownEndsAt"))
    creator: dict[str, Any] = Field(**_alias("creator"))
    owner_user_id: str | None = Field(default=None, **_alias("ownerUserId"))
    is_owner: bool = Field(default=False, **_alias("isOwner"))
    has_joined: bool = Field(default=False, **_alias("hasJoined"))
    has_completed: bool = Field(default=False, **_alias("hasCompleted"))
    prize_pool: str = Field(**_alias("prizePool"))
    entry_fee: str = Field(**_alias("entryFee"))
    players_joined: int = Field(**_alias("playersJoined"))
    players_max: int = Field(**_alias("playersMax"))
    format: str = Field(default="mini", **_alias("format"))
    duration_minutes: int = Field(default=10, **_alias("durationMinutes"))
    visibility: str = Field(default="public", **_alias("visibility"))
    timing: str = Field(default="instant", **_alias("timing"))
    prize_rule: str = Field(default="winner-takes-all", **_alias("prizeRule"))
    question_pool_mode: str = Field(default="auto", **_alias("questionPoolMode"))
    schedule_date: str = Field(default="", **_alias("scheduleDate"))
    schedule_time: str = Field(default="", **_alias("scheduleTime"))
    schedule_timezone: str = Field(default="UTC", **_alias("scheduleTimezone"))
    easy_pct: int = Field(default=0, **_alias("easyPct"))
    medium_pct: int = Field(default=100, **_alias("mediumPct"))
    hard_pct: int = Field(default=0, **_alias("hardPct"))
    created_at: datetime = Field(**_alias("createdAt"))
    questions: list[QuestionResponse] = Field(default_factory=list)


class TopicBattleListResponse(BaseModel):
    battles: list[TopicBattleResponse]
    total: int


class CompetitionModeResponse(BaseModel):
    """A competition game mode card shown on the hub."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    description: str
    action_label: str = Field(**_alias("actionLabel"))


class UserStatusResponse(BaseModel):
    """The current user's competition profile summary."""

    model_config = ConfigDict(populate_by_name=True)

    level: int
    rank: str
    progress_label: str = Field(**_alias("progressLabel"))
    progress_value: float = Field(**_alias("progressValue"))
    progress_text: str = Field(**_alias("progressText"))
    earnings: str
    won: int


class AchievementResponse(BaseModel):
    """A single user achievement with its unlock state."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    description: str
    unlocked: bool = False
    unlocked_at: str | None = Field(default=None, **_alias("unlockedAt"))


class CompetitionHubResponse(BaseModel):
    """Aggregate payload for the competition hub page."""

    model_config = ConfigDict(populate_by_name=True)

    modes: list[CompetitionModeResponse]
    user_status: UserStatusResponse = Field(**_alias("userStatus"))
    achievements: list[AchievementResponse]
    my_battles: list[TopicBattleResponse] = Field(**_alias("myBattles"))


class ChampionshipStageResponse(BaseModel):
    """A single stage of a championship season."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    order: int
    name: str
    short_label: str = Field(**_alias("shortLabel"))
    status: str = Field(default="locked")
    starts_at: str = Field(default="", **_alias("startsAt"))
    points_to_earn: int = Field(default=0, **_alias("pointsToEarn"))
    points_earned: int = Field(default=0, **_alias("pointsEarned"))
    is_current: bool = Field(default=False, **_alias("isCurrent"))
    battle_id: str | None = Field(default=None, **_alias("battleId"))
    entry_fee: str = Field(default="Free", **_alias("entryFee"))
    prize_pool: str = Field(default="", **_alias("prizePool"))


class ChampionshipStandingResponse(BaseModel):
    """A ranked entry in the season leaderboard."""

    model_config = ConfigDict(populate_by_name=True)

    rank: int
    name: str
    avatar_url: str | None = Field(default=None, **_alias("avatarUrl"))
    points: int
    is_current_user: bool = Field(default=False, **_alias("isCurrentUser"))


class ChampionshipSeasonResponse(BaseModel):
    """Season summary shown in the Championship hero panel."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    number: int
    title: str
    status: str = Field(default="active")
    starts_at: str = Field(default="", **_alias("startsAt"))
    ends_at: str = Field(default="", **_alias("endsAt"))
    total_stages: int = Field(**_alias("totalStages"))
    completed_stages: int = Field(**_alias("completedStages"))
    current_stage_order: int | None = Field(default=None, **_alias("currentStageOrder"))
    points_earned: int = Field(**_alias("pointsEarned"))
    total_points: int = Field(**_alias("totalPoints"))
    player_rank: int = Field(**_alias("playerRank"))
    total_players: int = Field(**_alias("totalPlayers"))


class ChampionshipNextSeasonResponse(BaseModel):
    """Info about the following season and whether it is unlocked."""

    model_config = ConfigDict(populate_by_name=True)

    number: int
    title: str
    is_unlocked: bool = Field(**_alias("isUnlocked"))
    unlock_hint: str = Field(**_alias("unlockHint"))


class ChampionshipResponse(BaseModel):
    """Aggregate payload for the Championship game mode."""

    model_config = ConfigDict(populate_by_name=True)

    season: ChampionshipSeasonResponse
    stages: list[ChampionshipStageResponse]
    standings: list[ChampionshipStandingResponse]
    next_season: ChampionshipNextSeasonResponse = Field(**_alias("nextSeason"))


class ChampionshipCreateRequest(BaseModel):
    """Payload for hosting a brand-new Championship season.

    The wizard picks a title, stage count, entry fee and escalating prize
    base, then either launches instantly or schedules the first round.
    """

    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=3, max_length=80)
    description: str = Field(default="", max_length=500)
    stage_count: int = Field(default=5, ge=3, le=8, **_alias("stageCount"))
    entry_fee: str = Field(default="Free", max_length=40, **_alias("entryFee"))
    prize_base_etb: int = Field(default=12, ge=1, le=10_000, **_alias("prizeBaseEtb"))
    timing: str = Field(default="instant", pattern="^(instant|schedule)$")
    schedule_date: str | None = Field(default=None, **_alias("scheduleDate"))
    schedule_time: str | None = Field(default=None, **_alias("scheduleTime"))
    schedule_timezone: str | None = Field(default=None, **_alias("scheduleTimezone"))
    creator_name: str | None = Field(default=None, max_length=120, **_alias("creatorName"))
    stage_questions: list[list[CodingQuestionSchema]] = Field(
        default_factory=list, **_alias("stageQuestions"),
    )


class CompetitionGameStageResponse(BaseModel):
    """One unlockable stage of a game's ladder — win to unlock the next."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    order: int
    name: str
    short_label: str = Field(**_alias("shortLabel"))
    status: str = Field(default="locked")
    starts_at: str = Field(default="", **_alias("startsAt"))
    points_to_earn: int = Field(default=0, **_alias("pointsToEarn"))
    points_earned: int = Field(default=0, **_alias("pointsEarned"))
    is_current: bool = Field(default=False, **_alias("isCurrent"))
    battle_id: str | None = Field(default=None, **_alias("battleId"))
    entry_fee: str = Field(default="Free", **_alias("entryFee"))
    prize_pool: str = Field(default="", **_alias("prizePool"))


class CompetitionGameResponse(BaseModel):
    """A single playable/upcoming game listed in the Games lobby."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    genre: str
    description: str
    difficulty: str
    tone: str = Field(default="primary")
    is_championship: bool = Field(default=False, **_alias("isChampionship"))
    status: str = Field(default="open")
    points_to_earn: int = Field(default=0, **_alias("pointsToEarn"))
    players_count: int = Field(default=0, **_alias("playersCount"))
    players_max: int | None = Field(default=None, **_alias("playersMax"))
    battle_id: str | None = Field(default=None, **_alias("battleId"))
    unlock_hint: str | None = Field(default=None, **_alias("unlockHint"))
    stages: list[CompetitionGameStageResponse] = Field(default_factory=list)


class CompetitionGamesResponse(BaseModel):
    """Aggregate payload for the Games lobby."""

    model_config = ConfigDict(populate_by_name=True)

    games: list[CompetitionGameResponse]
    total: int
    open_count: int = Field(**_alias("openCount"))


class QuestionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    description: str
    constraints: str = Field(default="")
    code_template: str = Field(**_alias("codeTemplate"))
    language: str
    difficulty: str
    time_limit_minutes: int = Field(**_alias("timeLimitMinutes"))
    points: float
    hint_enabled: bool = Field(**_alias("hintEnabled"))
    hint_text: str = Field(**_alias("hintText"))
    test_cases: list[TestCaseSchema] = Field(**_alias("testCases"))
    kind: str = Field(**_alias("kind"))
    mcq_options: list[McqOptionSchema] = Field(**_alias("mcqOptions"))
    mcq_correct_id: str = Field(**_alias("mcqCorrectId"))
    tf_answer: bool = Field(**_alias("tfAnswer"))
    fill_expected: str = Field(**_alias("fillExpected"))
    fill_answers: list[str] = Field(**_alias("fillAnswers"))
    matching_answers: list[MatchingAnswerSchema] = Field(**_alias("matchingAnswers"))
    matching_pairs: list[MatchPairSchema] = Field(**_alias("matchingPairs"))
    ordering_items: list[OrderItemSchema] = Field(**_alias("orderingItems"))
    markdown: MarkdownPayloadSchema = Field(**_alias("markdown"))
    design: DesignPayloadSchema = Field(**_alias("design"))


# ============================================================================
# Code execution (judge) — request/response for the Judge0-backed sandbox
# ============================================================================


class CodeExecuteRequest(BaseModel):
    """Run a single snippet through the Judge0-backed sandbox."""

    model_config = ConfigDict(populate_by_name=True)

    # UI language label (e.g. "Python", "C++") — mapped to a Judge0 runtime.
    language: str = Field(min_length=1, max_length=50)
    # Source code to compile/run.
    code: str = Field(default="", max_length=100_000)
    # Program stdin (used for `Run` with a single case and for grading each test).
    stdin: str = Field(default="", max_length=50_000)


class CodeRunResultSchema(BaseModel):
    """stdout/stderr/exit code from a single program execution."""

    model_config = ConfigDict(populate_by_name=True)

    stdout: str = Field(default="")
    stderr: str = Field(default="")
    exit_code: int = Field(default=0, **_alias("exitCode"))
    compile_output: str = Field(default="", **_alias("compileOutput"))
    """Best-effort first error line parsed from stderr/compile output (1-based)."""
    error_line: int | None = Field(default=None, **_alias("errorLine"))
    error_message: str = Field(default="", **_alias("errorMessage"))


class CodeExecuteResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    run: CodeRunResultSchema
    """Judge0 language label used (for display)."""
    runtime: str = Field(default="")
    runtime_version: str = Field(default="", **_alias("runtimeVersion"))


class CodeRunTestCaseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    index: int
    input: str = Field(default="")
    expected_output: str = Field(default="", **_alias("expectedOutput"))
    is_sample: bool = Field(default=False, **_alias("isSample"))
    passed: bool
    actual_output: str = Field(default="", **_alias("actualOutput"))
    stderr: str = Field(default="")
    exit_code: int = Field(default=0, **_alias("exitCode"))
    compile_output: str = Field(default="", **_alias("compileOutput"))
    error_line: int | None = Field(default=None, **_alias("errorLine"))
    error_message: str = Field(default="", **_alias("errorMessage"))


class CodeSubmitRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    language: str = Field(min_length=1, max_length=50)
    code: str = Field(default="", max_length=100_000)
    test_cases: list[TestCaseSchema] = Field(default_factory=list, **_alias("testCases"))


class CodeSubmitResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    results: list[CodeRunTestCaseSchema]
    passed_count: int = Field(**_alias("passedCount"))
    total_count: int = Field(**_alias("totalCount"))
    all_passed: bool = Field(**_alias("allPassed"))
