import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: number;
  title: string;
  shortTitle?: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 1-indexed
  onStepClick?: (stepIndex: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <nav aria-label="Wizard Progress" className="w-full">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isClickable = onStepClick && stepNumber <= currentStep;

          return (
            <li
              key={step.id}
              className={`relative flex flex-col items-center flex-1 ${
                idx !== steps.length - 1 ? 'after:content-[""] after:w-full after:h-0.5 after:top-4 after:left-1/2 after:absolute after:z-0' : ''
              } ${isCompleted ? 'after:bg-[#4B2A7B]' : 'after:bg-[#4B2A7B]/15'}`}
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(stepNumber)}
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all select-none ${
                  isCompleted
                    ? 'bg-[#4B2A7B] text-white shadow-sm cursor-pointer'
                    : isCurrent
                    ? 'bg-white border-2 border-[#4B2A7B] text-[#4B2A7B] shadow-md ring-4 ring-[#4B2A7B]/15'
                    : 'bg-[#F3EEF8] text-[#5C5765] border border-[#4B2A7B]/20 cursor-default'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : stepNumber}
              </button>

              <span
                className={`mt-2 text-xs font-medium text-center hidden sm:block whitespace-nowrap ${
                  isCurrent ? 'text-[#4B2A7B] font-semibold' : isCompleted ? 'text-[#1E1B24]' : 'text-[#5C5765]'
                }`}
              >
                {step.shortTitle || step.title}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
