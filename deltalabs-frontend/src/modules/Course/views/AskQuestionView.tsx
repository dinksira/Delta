"use client";

import React, { useState } from 'react';
import { CourseDashboardLayout } from '@/components/templates/CourseDashboardLayout';
import { ProgressStepper } from '@/components/molecules/ProgressStepper';
import { RichTextInput } from '@/components/atoms/RichTextInput';
import { DuplicateVerificationModal } from '@/components/organisms/DuplicateVerificationModal';
import { ConfigurationPaymentModal, QuestionConfiguration } from '@/components/organisms/ConfigurationPaymentModal';
import { Button, Input } from '@/components/theme';

const STEPS = [
  { id: 'draft', label: 'Draft Question' },
  { id: 'verify', label: 'Verify Uniqueness' },
  { id: 'configure', label: 'Configure & Post' },
];

export const AskQuestionView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<string>('draft');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const handleNextStep = () => {
    if (currentStep === 'draft') {
      setIsVerifyModalOpen(true);
    } else if (currentStep === 'verify') {
      setIsConfigModalOpen(true);
    }
  };

  const handleConfirmUnique = () => {
    setIsVerifyModalOpen(false);
    setCurrentStep('verify');
    // Automatically move to configure
    setIsConfigModalOpen(true);
  };

  const handleFinalSubmit = (config: QuestionConfiguration) => {
    setIsConfigModalOpen(false);
    setCurrentStep('configure');
    console.log('Submitting question with config:', { title, body, tags, config });
    // Navigate away or show success
  };

  return (
    <CourseDashboardLayout
      header={
        <div className="flex justify-between items-center px-8 py-4 bg-surface-primary border-b border-border-default">
          <h1 className="text-2xl font-semibold text-text-primary">Ask a Question</h1>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-12">
          <ProgressStepper 
            steps={STEPS} 
            currentStepId={currentStep} 
          />
        </div>

        <div className="bg-surface-primary border border-border-default rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Question Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Title
              </label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How do I configure Tailwind with Next.js?"
              />
              <p className="text-xs text-text-secondary mt-1">Be specific and imagine you're asking a question to another person.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Body
              </label>
              <RichTextInput 
                value={body}
                onChangeText={setBody}
                placeholder="Include all the information someone would need to answer your question..."
                minHeight="250px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Tags
              </label>
              <Input 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. react, typescript, tailwind (comma separated)"
              />
            </div>

            <div className="pt-6 border-t border-border-subtle flex justify-end">
              <Button 
                variant="primary" 
                size="lg"
                onClick={handleNextStep}
                disabled={!title.trim() || !body.trim()}
              >
                Review & Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals for multi-step flow */}
      <DuplicateVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onConfirmUnique={handleConfirmUnique}
        similarQuestions={[
          {
            id: 'q1',
            title: 'How to install Tailwind CSS in Next.js 13 app router?',
            excerpt: 'I am trying to set up Tailwind with the new app router but the styles are not applying...',
            author: { name: 'John Doe' },
            tags: ['nextjs', 'tailwind'],
            upvotes: 42,
            answersCount: 3,
            createdAt: '2 days ago',
            isResolved: true
          }
        ]}
      />

      <ConfigurationPaymentModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSubmit={handleFinalSubmit}
      />
    </CourseDashboardLayout>
  );
};
