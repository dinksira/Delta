import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Lightbulb, Play, Send, ChevronDown, ChevronUp, Zap } from "lucide-react";

import { fetchTopicBattle } from "@/modules/Competition/api";
import type { BattleQuestion } from "@/modules/Competition/types/topicBattles";
import type { DuelLeaderboardEntry } from "@/modules/Competition/types/duelQuiz";
import type { CodeEditorLanguage } from "@/modules/Competition/types/host";
import { BattleResultsModal } from "@/components/organisms/BattleResultsModal/BattleResultsModal";
import { CodeEditorField } from "@/components/atoms/CodeEditorField/CodeEditorField";

export interface DuelScreenPageProps {
  battleId: string;
}

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

type UiLanguage = { display: string; code: CodeEditorLanguage };
const LANGUAGES: UiLanguage[] = [
  { display: 'HTML', code: 'html' },
  { display: 'CSS', code: 'css' },
  { display: 'JavaScript', code: 'javascript' },
  { display: 'TypeScript', code: 'typescript' },
  { display: 'Python', code: 'python' },
  { display: 'Java', code: 'java' },
  { display: 'C++', code: 'cpp' },
  { display: 'C#', code: 'csharp' },
  { display: 'Go', code: 'go' },
  { display: 'Rust', code: 'rust' },
  { display: 'SQL', code: 'sql' },
  { display: 'PHP', code: 'php' },
  { display: 'Ruby', code: 'ruby' },
  { display: 'Swift', code: 'swift' },
  { display: 'Kotlin', code: 'kotlin' },
];

const displayToCodeLang = (display: string): CodeEditorLanguage => {
  const found = LANGUAGES.find((l) => l.display === display);
  return found ? found.code : 'javascript';
};

const codeToDisplayLang = (code: string): string => {
  const found = LANGUAGES.find((l) => l.code === code);
  return found ? found.display : 'JavaScript';
};

export function DuelScreenPage({ battleId }: Readonly<DuelScreenPageProps>) {
  const [battle, setBattle] = useState<{ title: string; questions: BattleQuestion[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResultsModal, setShowResultsModal] = useState(false);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const leaderboard: DuelLeaderboardEntry[] = useMemo(() => [
    { rank: 1, name: "You", points: score, isCurrentUser: true },
  ], [score]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchTopicBattle(battleId);
        if (!cancelled) {
          setBattle({ title: data.title, questions: data.questions || [] });
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setBattle(null);
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [battleId]);

  const question = battle?.questions[currentIndex];

  useEffect(() => {
    if (question) {
      setCode(question.codeTemplate || "");
      const raw = question.language || "Python";
      setLanguage(codeToDisplayLang(String(raw || "").toLowerCase()));
      setOutput("");
      setTestResults(null);
      setSubmitted(false);
      setShowOutput(false);
      setShowHint(false);
      setRemainingSeconds(question.timeLimitMinutes * 60);
    }
  }, [question]);

  useEffect(() => {
    if (remainingSeconds <= 0 || submitted || !question) return;
    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIndex, submitted, question]);

  const handleBack = useCallback(() => {
    window.location.hash = "/features/competitions/topic-battles";
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fallbackSample = [{ input: "sample input", expectedOutput: "expected output" }];
  const fallbackHidden = [
    { input: "hidden edge 1", expectedOutput: "result 1" },
    { input: "hidden edge 2", expectedOutput: "result 2" },
  ];
  const allTestCases = question?.testCases ?? [];
  const sampleCases = allTestCases.filter((tc) => tc.isSample || tc.isHidden !== true);
  const hiddenCases = allTestCases.filter((tc) => tc.isHidden === true);

  const simulateRun = useCallback(() => {
    if (!question) return;
    setIsRunning(true);
    setShowOutput(true);
    const activeSamples = question.testCases?.filter((tc) => tc.isSample || tc.isHidden !== true) ?? [];
    const cases = activeSamples.length > 0 ? activeSamples : fallbackSample;
    setTimeout(() => {
      const results: TestResult[] = cases.map((tc) => ({
        input: tc.input || "—",
        expectedOutput: tc.expectedOutput || "—",
        actualOutput: tc.expectedOutput || "—",
        passed: true,
      }));
      setTestResults(results);
      setOutput(`Sample Run — Program executed successfully.\n${results.filter(r => r.passed).length}/${results.length} sample tests passed.`);
      setIsRunning(false);
    }, 800);
  }, [question]);

  const simulateSubmit = useCallback(() => {
    if (!question) return;
    setIsSubmitting(true);
    setShowOutput(true);
    const activeSamples = question.testCases?.filter((tc) => tc.isSample || tc.isHidden !== true) ?? [];
    const activeHidden = question.testCases?.filter((tc) => tc.isHidden === true) ?? [];
    const allCases = (activeSamples.length > 0 || activeHidden.length > 0)
      ? [...(activeSamples.length > 0 ? activeSamples : fallbackSample), ...(activeHidden.length > 0 ? activeHidden : fallbackHidden)]
      : fallbackHidden;
    setTimeout(() => {
      const allPassed = Math.random() > 0.3;
      const results: TestResult[] = allCases.map((tc, i) => {
        const passed = allPassed ? true : i !== 1;
        return {
          input: tc.input || "—",
          expectedOutput: tc.expectedOutput || "—",
          actualOutput: passed ? (tc.expectedOutput || "—") : "wrong output",
          passed,
        };
      });
      setTestResults(results);
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      const hiddenTotal = activeHidden.length > 0 ? activeHidden.length : fallbackHidden.length;
      const sampleTotal = activeSamples.length > 0 ? activeSamples.length : fallbackSample.length;
      const allOk = passed === total;
      setSubmitted(true);
      if (allOk) {
        setScore((prev) => prev + Math.round(question.points * 100));
        setCorrectCount((prev) => prev + 1);
      }
      setOutput(allOk
        ? `✅ All ${total} test cases passed! (${sampleTotal} sample + ${hiddenTotal} hidden) +${Math.round(question.points * 100)} points`
        : `❌ ${passed}/${total} test cases passed. (${sampleTotal} sample + ${hiddenTotal} hidden) Keep trying!`
      );
      setIsSubmitting(false);
    }, 1200);
  }, [question]);

  const handleNext = useCallback(() => {
    if (currentIndex < (battle?.questions.length ?? 1) - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowResultsModal(true);
    }
  }, [currentIndex, battle]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-canvas text-sm text-text-secondary">
        Loading battle...
      </div>
    );
  }

  if (!battle || !question) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-canvas text-sm text-text-secondary">
        {battle ? "No questions in this battle." : "Battle not found."}
      </div>
    );
  }

  const isCritical = remainingSeconds > 0 && remainingSeconds <= 60;
  const passedTests = testResults ? testResults.filter(r => r.passed).length : 0;

  return (
    <>
      <div className="flex h-full flex-col bg-surface-canvas text-text-primary">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-primary px-4 py-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleBack} className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
              <ArrowLeft className="size-4" /> Back
            </button>
            <span className="text-sm font-bold text-text-primary">{battle.title}</span>
            <span className="rounded bg-surface-secondary px-2 py-0.5 text-[10px] font-bold text-text-secondary">Q{currentIndex + 1}/{battle.questions.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 text-sm font-bold tabular-nums ${isCritical ? 'text-error-500' : 'text-text-primary'}`}>
              <Clock className="size-4" />
              {formatTime(remainingSeconds)}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-amber-500">
              <Zap className="size-4" /> {score}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — Problem Description */}
          <div className="flex w-1/2 min-w-0 flex-col overflow-y-auto border-r border-border-subtle bg-surface-canvas p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{question.title || `Question ${currentIndex + 1}`}</h2>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ${
                    question.difficulty === 'EASY' ? 'bg-success-600' :
                    question.difficulty === 'MEDIUM' ? 'bg-warning-600' : 'bg-error-600'
                  }`}>
                    {question.difficulty}
                  </span>
                  <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-[10px] font-bold text-text-secondary">
                    {question.language}
                  </span>
                  <span className="text-[11px] font-semibold text-text-tertiary">{question.points * 100} pts</span>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Problem Description</p>
              <div className="rounded-lg bg-surface-primary p-4 text-sm text-text-primary leading-relaxed whitespace-pre-wrap border border-border-subtle">
                {question.description || "No description provided."}
              </div>
            </div>

            {((question.testCases && question.testCases.length > 0) || sampleCases.length > 0) && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Examples (Sample Test Cases)</p>
                  {hiddenCases.length > 0 && (
                    <span className="rounded-full bg-warning-50 border border-warning-500/40 px-2 py-0.5 text-[10px] font-bold text-warning-600 dark:bg-warning-900/30 dark:border-warning-700/40 dark:text-warning-400">
                      +{hiddenCases.length} hidden judge tests
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {(sampleCases.length > 0 ? sampleCases : (question.testCases ?? [])).map((tc, i) => (
                    <div key={i} className="rounded-lg bg-surface-primary p-3 font-mono text-xs border border-border-subtle">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-surface-secondary px-1.5 py-0.5 text-[9px] font-bold text-text-secondary">Example {i + 1}</span>
                        {tc.isSample && (
                          <span className="rounded bg-success-50 px-1.5 py-0.5 text-[9px] font-bold text-success-600 dark:bg-success-900/40 dark:text-success-400">Sample</span>
                        )}
                      </div>
                      <div className="text-text-secondary">Input: <span className="text-warning-600 dark:text-warning-400">{tc.input || "—"}</span></div>
                      <div className="text-text-secondary">Output: <span className="text-success-600 dark:text-success-400">{tc.expectedOutput || "—"}</span></div>
                      {tc.explanation && (
                        <div className="mt-1 border-t border-border-subtle pt-1 text-text-secondary">
                          Explanation: <span className="text-text-primary">{tc.explanation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {question.hintEnabled && question.hintText && (
              <div className="mb-5">
                <button type="button" onClick={() => setShowHint((p) => !p)} className="flex items-center gap-1.5 text-xs font-semibold text-warning-600 hover:text-warning-500 dark:text-amber-400 dark:hover:text-amber-300 mb-1">
                  <Lightbulb className="size-3.5" /> {showHint ? 'Hide Hint' : 'Show Hint'}
                  {showHint ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
                {showHint && (
                  <div className="rounded-lg bg-warning-50 border border-warning-500/30 p-3 text-xs text-warning-600 dark:bg-warning-900/20 dark:border-warning-700/30 dark:text-warning-400">
                    {question.hintText}
                  </div>
                )}
              </div>
            )}

            {/* Progress dots */}
            <div className="mt-auto flex gap-1.5 pt-4">
              {battle.questions.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${
                  i === currentIndex ? 'bg-primary-500' :
                  i < currentIndex ? 'bg-success-500' : 'bg-surface-secondary'
                }`} />
              ))}
            </div>
          </div>

          {/* Right — Code Editor + Output */}
          <div className="flex w-1/2 min-w-0 flex-col bg-surface-canvas">
            {/* Language selector + action buttons */}
            <div className="flex items-center justify-between border-b border-border-subtle bg-surface-primary px-4 py-2">
              <div className="flex items-center gap-2">
                <select
                  value={codeToDisplayLang(language.toLowerCase())}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-text-primary outline-none border border-border-subtle"
                >
                  {LANGUAGES.map((l) => <option key={l.code} value={l.display}>{l.display}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={simulateRun}
                  disabled={isRunning || submitted}
                  className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-secondary px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-border-default disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="size-3.5" /> Run
                </button>
                <button
                  type="button"
                  onClick={simulateSubmit}
                  disabled={isSubmitting || submitted}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="size-3.5" /> {isSubmitting ? 'Judging...' : 'Submit'}
                </button>
              </div>
            </div>

            {/* Code editor */}
            <div className="flex-1 overflow-hidden p-0">
              <div className="h-full w-full">
                <CodeEditorField
                  value={code}
                  onChange={setCode}
                  language={displayToCodeLang(language)}
                  placeholder="# Write your code here..."
                  className="h-full min-h-full rounded-none border-0"
                />
                {submitted && (
                  <div className="pointer-events-none absolute inset-0 bg-surface-canvas/50" />
                )}
              </div>
            </div>

            {/* Output panel */}
            {(showOutput || submitted) && (
              <div className="border-t border-border-subtle bg-surface-primary">
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
                  <span className="text-xs font-bold text-text-secondary">
                    {isRunning ? 'Running...' : isSubmitting ? 'Judging...' : testResults ? `Test Results (${passedTests}/${testResults.length})` : 'Output'}
                  </span>
                  <button type="button" onClick={() => setShowOutput(false)} className="text-[10px] text-text-tertiary hover:text-text-primary">Close</button>
                </div>
                <div className="max-h-[180px] overflow-y-auto p-3 font-mono text-xs">
                  {isRunning || isSubmitting ? (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <div className="size-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                      Processing...
                    </div>
                  ) : testResults ? (
                    <div className="flex flex-col gap-1.5">
                      {testResults.map((r, i) => (
                        <div key={i} className={`flex items-start gap-2 rounded p-2 ${r.passed ? 'bg-success-50 dark:bg-success-900/20' : 'bg-error-50 dark:bg-error-900/20'}`}>
                          {r.passed
                            ? <CheckCircle2 className="size-3.5 text-success-500 shrink-0 mt-0.5" />
                            : <XCircle className="size-3.5 text-error-500 shrink-0 mt-0.5" />
                          }
                          <div>
                            <p className="text-[11px] font-semibold text-text-primary">Test {i + 1}</p>
                            <p className="text-[10px] text-text-secondary">Input: {r.input}</p>
                            <p className="text-[10px] text-text-secondary">Expected: {r.expectedOutput}</p>
                            {!r.passed && <p className="text-[10px] text-error-500">Got: {r.actualOutput}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-secondary">{output}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="flex items-center justify-between border-t border-border-subtle bg-surface-primary px-4 py-3">
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><CheckCircle2 className="size-3.5 text-success-500" /> {correctCount} Solved</span>
            <span className="flex items-center gap-1"><XCircle className="size-3.5 text-error-500" /> {currentIndex - correctCount} Skipped</span>
          </div>
          <div className="flex items-center gap-2">
            {!submitted && (
              <button
                type="button"
                onClick={() => {
                  setSubmitted(true);
                  handleNext();
                }}
                className="rounded-lg border border-border-subtle px-4 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors"
              >
                Skip
              </button>
            )}
            {submitted && (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-primary-900 px-5 py-1.5 text-xs font-semibold text-white hover:bg-primary-800 transition-colors"
              >
                {currentIndex < battle.questions.length - 1 ? 'Next Question' : 'View Results'}
              </button>
            )}
          </div>
        </div>
      </div>

      <BattleResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        winner={{ name: leaderboard[0]?.name || 'You', prize: '100 ETB' }}
        stats={{
          score,
          accuracy: `${battle.questions.length > 0 ? Math.round((correctCount / battle.questions.length) * 100) : 0}%`,
          speed: "-",
          streak: correctCount,
        }}
        leaderboard={leaderboard.map((e, i) => ({
          id: `p${i}`,
          name: e.name,
          initials: e.name.charAt(0),
          points: e.points,
          isCurrentUser: e.isCurrentUser,
          isWinner: e.rank === 1,
        }))}
        onExit={handleBack}
        onPlayAgain={() => {
          setCurrentIndex(0);
          setScore(0);
          setCorrectCount(0);
          setShowResultsModal(false);
        }}
      />
    </>
  );
}

export default DuelScreenPage;
