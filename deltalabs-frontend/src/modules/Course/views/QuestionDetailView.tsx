/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Typography, Button } from "@/components/theme";
import { AnswerCard } from "../components/qa/molecules/AnswerCard";
import { Badge } from "../components/qa/atoms/Badge";
import { Avatar } from "../components/qa/atoms/Avatar";
import { QA_MOCK_QUESTIONS, QA_MOCK_ANSWERS } from "../data/qaMockData";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export interface QuestionDetailViewProps {
  questionId: string;
  onBack: () => void;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * QuestionDetailView
 * Displays the full content of a question and its associated answers.
 */
export const QuestionDetailView: React.FC<QuestionDetailViewProps> = ({ 
  questionId, 
  onBack 
}) => {
  const question = QA_MOCK_QUESTIONS.find(q => q.id === questionId);
  const answers = QA_MOCK_ANSWERS.filter(a => a.questionId === questionId);

  if (!question) return null;

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1000px] mx-auto">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors group w-fit"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold uppercase tracking-widest">Back to Questions</span>
      </button>

      {/* 1. Full Question Section */}
      <div className="space-y-6">
        <div className="space-y-4">
          <Typography variant="h1" className="text-[32px] !font-black !text-text-primary tracking-tight leading-tight">
            {question.title}
          </Typography>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {question.isOpenEnded && <Badge variant="teal">Open-ended</Badge>}
              {question.tags.map(tag => (
                <Badge key={tag} variant="filled">{tag}</Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <Avatar initials={question.author.initials} size="sm" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text-primary leading-none">{question.author.name}</span>
                <span className="text-[11px] text-text-tertiary">Asked {question.askedAt}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="py-6 border-y border-border-subtle/50">
          <Typography className="text-[17px] leading-relaxed text-text-secondary">
            {question.description}
            {/* Expanded content placeholder */}
            {" "}In this detailed analysis, we look at the mathematical derivations and practical implications of these physical principles in real-world scenarios.
          </Typography>
        </div>
      </div>

      {/* 2. Answers Section Header */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary-600" />
          <Typography className="text-xl font-black text-text-primary">
            {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
          </Typography>
        </div>
        
        <Button className="h-10 px-5 rounded-xl !bg-white !text-primary-800 border border-border-subtle font-bold text-sm hover:bg-surface-secondary">
          Filter by Date
        </Button>
      </div>

      {/* 3. Answers List */}
      <div className="flex flex-col gap-6">
        {answers.map((answer) => (
          <AnswerCard key={answer.id} answer={answer} />
        ))}
      </div>

      {/* 4. Reply Area Placeholder */}
      <div className="pt-10 pb-20">
        <div className="bg-surface-secondary rounded-2xl p-8 border border-border-subtle text-center space-y-4">
          <Typography className="text-lg font-bold text-text-primary">Have an answer?</Typography>
          <Typography className="text-sm text-text-secondary max-w-md mx-auto">
            Help the community by sharing your knowledge. Your contribution makes a difference!
          </Typography>
          <Button className="h-12 px-10 rounded-xl !bg-primary-900 !text-white border-none font-bold shadow-xl shadow-primary-900/10">
            Write your answer
          </Button>
        </div>
      </div>
    </div>
  );
};
