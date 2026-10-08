"""Sandboxed code execution via the Judge0 CE API.

Judge0 CE is a multi-language execution API used here as the code judge
backend. `run` compiles+executes a single snippet with optional stdin;
`submit` grades the authored test cases by running the program once per case
and comparing trimmed stdout to the expected output. Compile/run errors are
surfaced with stdout/stderr/compile_output and a best-effort 1-based error line
parsed from common compiler/runtime traces.

The base URL comes from the `JUDGE0_API_BASE` setting and defaults to the public
Judge0 CE instance. That public endpoint is rate-limited and shared with every
other consumer, so a single burst here degrades grading for all of them — set
`JUDGE0_API_BASE` (and `JUDGE0_API_KEY`, for self-hosted instances) to a
dedicated deployment before serving real traffic.
"""

from __future__ import annotations

import base64
import re

import httpx

from app.core.config import get_settings
from app.core.exceptions import ValidationError
from app.domain.competitions.schemas import (
    CodeExecuteRequest,
    CodeExecuteResponse,
    CodeRunResultSchema,
    CodeRunTestCaseSchema,
    CodeSubmitRequest,
    CodeSubmitResponse,
)

# ################################ CONSTANTS ################################

# UI language label -> Judge0 language id + file extension.
LANGUAGE_IDS: dict[str, tuple[int, str]] = {
    "Python": (71, "py"),            # Python 3.8.1
    "JavaScript": (93, "js"),        # Node.js 18.15.0
    "TypeScript": (94, "ts"),        # TypeScript 5.0.3
    "Java": (62, "java"),            # OpenJDK 13.0.1
    "C": (48, "c"),                  # GCC 7.4.0
    "C++": (52, "cpp"),              # GCC 7.4.0
    "C#": (51, "cs"),                # Mono 6.6.0.161
    "Go": (106, "go"),               # Go 1.22.0
    "Rust": (73, "rs"),              # Rust 1.40.0
    "PHP": (68, "php"),              # PHP 7.4.1
    "SQL": (82, "sql"),              # SQLite 3.27.2
}

EXECUTION_TIMEOUT_SECONDS = 10.0

# Judge0 submission status ids (see /statuses).
STATUS_ACCEPTED = 3
STATUS_COMPILATION_ERROR = 6
STATUS_RUNTIME_ERROR_IDS = {7, 8, 9, 10, 11, 12, 13}


# ################################ HELPERS ################################


def _to_judge0(language: str) -> tuple[int, str]:
    """Map a UI language label to a (language_id, extension); raise on unknown."""
    normalized = language.strip()
    entry = LANGUAGE_IDS.get(normalized)
    if entry is None:
        raise ValidationError(
            f"Unsupported language '{normalized}' for code execution.",
            code="unsupported_language",
        )
    return entry


def _error_line_from(output: str) -> int | None:
    """Best-effort parse of a 1-based error line from compiler/runtime traces.

    Handles common formats:
      File "main.py", line 3
      main.c:3:5: error:
      Solution.java:5: error:
      line 3: ...
    """
    if not output:
        return None
    patterns = (
        r"(?:line )?(\d+)\s*[,:]?\s*$",  # trailing "line 3"
        r'["\']?[\w./]+\.\w+"?,\s*line\s+(\d+)',
        r"[\w./]+\.\w+:(\d+)(?::\d+)?\s*:",
        r"[\w./]+\.\w+:(\d+)\)",  # Java "at Main.main(Main.java:4)"
        r"^\s*(\d+)\s*[|]",
    )
    for pattern in patterns:
        match = re.search(pattern, output, re.MULTILINE)
        if match:
            try:
                return max(1, int(match.group(1)))
            except (TypeError, ValueError):
                continue
    return None


def _first_error_message(output: str) -> str:
    """First non-empty line of stderr/compile output, truncated for display."""
    for line in output.splitlines():
        stripped = line.strip()
        if stripped:
            return stripped[:300]
    return ""


# ################################ EXECUTOR ################################


class CodeExecutor:
    """Thin client for the Judge0 CE execution API."""

    def __init__(
        self,
        client: httpx.AsyncClient | None = None,
        api_base: str | None = None,
        api_key: str | None = None,
    ) -> None:
        settings = get_settings()
        base = api_base if api_base is not None else settings.judge0_api_base
        self._client = client
        self._api_base = base.rstrip("/")
        self._api_key = api_key if api_key is not None else settings.judge0_api_key

    def _headers(self) -> dict[str, str]:
        """Judge0 ignores the auth header when it is not configured."""
        if not self._api_key:
            return {}
        return {"X-Auth-Token": self._api_key}

    async def _execute(
        self,
        *,
        language_id: int,
        code: str,
        stdin: str = "",
    ) -> CodeRunResultSchema:
        payload = {
            "source_code": base64.b64encode(code.encode("utf-8")).decode("ascii"),
            "language_id": language_id,
            "stdin": base64.b64encode(stdin.encode("utf-8")).decode("ascii"),
            "cpu_time_limit": 3,
            "memory_limit": 128000,
            # Participant code is untrusted and runs in a sandbox we do not own:
            # without this a submission could phone home to a colluding host.
            # Judge0 ignores unknown fields on older builds, and the compose
            # stack blocks egress at the container network level regardless, so
            # this is defence in depth rather than the only control.
            "enable_network": False,
        }

        async def _call(client: httpx.AsyncClient) -> dict[str, object]:
            response = await client.post(
                f"{self._api_base}/submissions/",
                params={"base64_encoded": "true", "wait": "true"},
                json=payload,
                headers=self._headers(),
                timeout=EXECUTION_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, dict):
                raise RuntimeError("Judge0 returned a non-object response.")
            return data

        if self._client is not None:
            data = await _call(self._client)
        else:
            async with httpx.AsyncClient() as client:
                data = await _call(client)

        def _b64(value: object) -> str:
            if value is None:
                return ""
            text = str(value)
            try:
                return base64.b64decode(text).decode("utf-8", errors="replace")
            except Exception:
                return text

        status = data.get("status")
        status_data = status if isinstance(status, dict) else {}
        status_id = int(status_data.get("id", 0) or 0)

        stdout = _b64(data.get("stdout"))
        stderr = _b64(data.get("stderr"))
        compile_output = _b64(data.get("compile_output"))

        accepted = status_id == STATUS_ACCEPTED
        compile_error = status_id == STATUS_COMPILATION_ERROR
        runtime_error = status_id in STATUS_RUNTIME_ERROR_IDS

        exit_code = 0 if accepted else 1
        combined_error = "\n".join(part for part in (compile_output, stderr) if part)

        return CodeRunResultSchema(
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            compile_output=compile_output,
            error_line=_error_line_from(combined_error),
            error_message=_first_error_message(
                combined_error
                or (status_data.get("description") or "")
                or (
                    "Compilation error"
                    if compile_error
                    else "Runtime error"
                    if runtime_error
                    else ""
                )
            ),
        )

    async def run(self, payload: CodeExecuteRequest) -> CodeExecuteResponse:
        language_id, _extension = _to_judge0(payload.language)
        try:
            run = await self._execute(
                language_id=language_id,
                code=payload.code,
                stdin=payload.stdin,
            )
        except httpx.HTTPError as exc:
            raise ValidationError(
                f"Code execution service unavailable ({exc.__class__.__name__}).",
                code="judge_unavailable",
            ) from exc
        except ValueError as exc:
            raise ValidationError(
                f"Judge0 returned an invalid response: {exc}",
                code="judge_invalid_response",
            ) from exc

        return CodeExecuteResponse(run=run, runtime=payload.language, runtime_version="")

    async def submit(self, payload: CodeSubmitRequest) -> CodeSubmitResponse:
        """Grade authored test cases: one execution per case, compare stdout."""
        language_id, _extension = _to_judge0(payload.language)
        results: list[CodeRunTestCaseSchema] = []

        for index, case in enumerate(payload.test_cases):
            try:
                run = await self._execute(
                    language_id=language_id,
                    code=payload.code,
                    stdin=case.input,
                )
            except httpx.HTTPError as exc:
                raise ValidationError(
                    f"Code execution service unavailable ({exc.__class__.__name__}).",
                    code="judge_unavailable",
                ) from exc

            actual = run.stdout.strip()
            expected = case.expected_output.strip()
            passed = run.exit_code == 0 and actual == expected

            results.append(
                CodeRunTestCaseSchema(
                    index=index,
                    input=case.input,
                    expected_output=case.expected_output,
                    is_sample=case.is_sample,
                    passed=passed,
                    actual_output=run.stdout,
                    stderr=run.stderr,
                    exit_code=run.exit_code,
                    compile_output=run.compile_output,
                    error_line=run.error_line,
                    error_message=run.error_message,
                )
            )

        passed_count = sum(1 for result in results if result.passed)
        total_count = len(results)
        return CodeSubmitResponse(
            results=results,
            passed_count=passed_count,
            total_count=total_count,
            all_passed=total_count > 0 and passed_count == total_count,
        )
