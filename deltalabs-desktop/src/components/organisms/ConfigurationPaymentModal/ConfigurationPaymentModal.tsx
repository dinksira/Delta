/**
 * ConfigurationPaymentModal
 * Atomic Level: Organism
 * 
 * Allows users to configure their question (anonymous, identity) and set bounties/payments.
 */

"use client";

import React, { useState } from 'react';
import type { ConfigurationPaymentModalProps, QuestionConfiguration } from './ConfigurationPaymentModal.types';
import { Dialog, Button, RadioGroup, Checkbox, Input } from '@/components/theme';

export const ConfigurationPaymentModal: React.FC<ConfigurationPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [config, setConfig] = useState<QuestionConfiguration>({
    isAnonymous: false,
    identity: 'person',
    isPaid: false,
    bountyAmount: 5,
  });

  const handleSubmit = () => {
    onSubmit(config);
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Question Configuration & Bounty"
      size="md"
    >
      <div className="p-6 space-y-6">
        
        {/* Privacy Section */}
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Privacy & Identity</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 text-sm text-text-primary cursor-pointer">
              <Checkbox 
                checked={config.isAnonymous}
                onChange={(e) => setConfig({ ...config, isAnonymous: e.target.checked })}
              />
              <span>Post anonymously</span>
            </label>
            
            {!config.isAnonymous && (
              <div className="pl-7 mt-2">
                <RadioGroup
                  name="identity"
                  value={config.identity}
                  onChange={(val) => setConfig({ ...config, identity: val as 'person' | 'school' })}
                  options={[
                    { value: 'person', label: 'Post as Person (Default)' },
                    { value: 'school', label: 'Post as School Representative' },
                  ]}
                />
              </div>
            )}
          </div>
        </section>

        {/* Bounty Section */}
        <section className="pt-4 border-t border-border-subtle">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Add a Bounty (Optional)</h3>
          <p className="text-sm text-text-secondary mb-4">
            Offer a reward for the best answer. Questions with bounties get 5x more visibility and faster responses.
          </p>
          
          <label className="flex items-center gap-2.5 text-sm text-text-primary cursor-pointer">
            <Checkbox 
              checked={config.isPaid}
              onChange={(e) => setConfig({ ...config, isPaid: e.target.checked })}
            />
            <span>Set a bounty for this question</span>
          </label>

          {config.isPaid && (
            <div className="mt-4 pl-7 flex items-center gap-3">
              <span className="text-text-primary font-medium">$</span>
              <Input 
                type="number"
                min={1}
                value={config.bountyAmount}
                onChange={(e) => setConfig({ ...config, bountyAmount: Number(e.target.value) })}
                className="w-24"
              />
              <span className="text-sm text-text-secondary">USD</span>
            </div>
          )}
        </section>

        <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
          <Button variant="ghost" onClick={onClose}>
            Back
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {config.isPaid ? 'Proceed to Payment' : 'Post Question'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

ConfigurationPaymentModal.displayName = 'ConfigurationPaymentModal';
