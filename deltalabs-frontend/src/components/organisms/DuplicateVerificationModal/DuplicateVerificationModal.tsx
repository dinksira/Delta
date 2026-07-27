/**
 * DuplicateVerificationModal
 * Atomic Level: Organism
 * 
 * Verifies if a user's new question is a duplicate of existing questions.
 */

"use client";

import React from 'react';
import type { DuplicateVerificationModalProps } from './DuplicateVerificationModal.types';
import { Dialog, Button } from '@/components/theme';
import { QuestionCard } from '@/components/molecules/QuestionCard';

export const DuplicateVerificationModal: React.FC<DuplicateVerificationModalProps> = ({
  isOpen,
  onClose,
  onConfirmUnique,
  similarQuestions,
}) => {
  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Similar Questions Found"
      size="lg"
    >
      <div className="p-6">
        <p className="text-text-secondary mb-6">
          Before you post, we found some similar questions that might already have your answer. 
          Please review them to avoid duplicate posts.
        </p>

        <div className="flex flex-col gap-4 mb-8 max-h-[400px] overflow-y-auto pr-2">
          {similarQuestions.map((q) => (
            <QuestionCard 
              key={q.id} 
              {...q} 
              className="bg-surface-muted hover:bg-surface-default"
            />
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirmUnique}>
            My question is unique, continue
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

DuplicateVerificationModal.displayName = 'DuplicateVerificationModal';
