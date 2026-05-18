/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React, { useState } from "react";
import { QuestionCard } from "../molecules/QuestionCard";
import { AnswerCard } from "../molecules/AnswerCard";
import { AnswerEditor } from "../molecules/AnswerEditor";
import { Pagination } from "../molecules/Pagination";
import { Typography } from "@/components/theme";
import { QA_MOCK_QUESTIONS, QA_MOCK_ANSWERS } from "../../../data/qaMockData";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export interface QuestionListProps {
  onQuestionClick?: (id: string) => void;
  defaultExpandedAll?: boolean;
  isBookmarkedView?: boolean;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * QuestionList Organism
 * Renders the list of question cards with accordion expansion for answers.
 */
export const QuestionList: React.FC<QuestionListProps> = ({ 
  onQuestionClick,
  defaultExpandedAll = false,
  isBookmarkedView = false
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    if (defaultExpandedAll) return; // Disable toggle in "Always Expanded" mode if desired, or allow collapsing
    setExpandedId(prev => prev === id ? null : id);
    onQuestionClick?.(id);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col">
        {QA_MOCK_QUESTIONS.map((question, index) => {
          const isExpanded = defaultExpandedAll || expandedId === question.id;
          const answers = QA_MOCK_ANSWERS.filter(a => a.questionId === question.id);

          return (
            <div key={question.id} className="flex flex-col">
              {/* Question Card */}
              <div 
                onClick={() => handleToggle(question.id)}
                className="cursor-pointer"
              >
                <QuestionCard 
                  question={question} 
                  showDelete={index < 2} 
                  isBookmarked={isBookmarkedView}
                />
              </div>

              {/* Expanded Answers Section */}
              {isExpanded && (
                <div className="bg-surface-secondary/20 pl-8 pr-4 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3 py-4 border-b border-border-subtle/30">
                    <span className="text-sm font-black text-text-primary uppercase tracking-wider">
                      {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                    </span>
                  </div>
                  
                  {answers.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {answers.map(answer => (
                        <AnswerCard key={answer.id} answer={answer} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-white rounded-xl border border-dashed border-border-subtle">
                      <p className="text-sm text-text-tertiary">No answers yet. Be the first to answer!</p>
                    </div>
                  )}

                  {/* Answer Editor Section */}
                  <div className="pt-4">
                    <Typography className="text-sm font-bold text-text-primary mb-3">
                      Your Answer
                    </Typography>
                    <AnswerEditor />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Pagination />
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
