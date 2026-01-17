import React from 'react';
import { Check } from 'lucide-react';

const StepIndicator = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                index < currentStep
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : index === currentStep
                  ? 'border-blue-600 text-blue-600 bg-white ring-4 ring-blue-100'
                  : 'border-gray-300 text-gray-400 bg-white'
              }`}
            >
              {index < currentStep ? (
                <Check size={20} className="stroke-2" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>
            {/* Step Label */}
            <span
              className={`mt-2 text-xs font-medium text-center max-w-[80px] hidden md:block ${
                index === currentStep
                  ? 'text-blue-600'
                  : index < currentStep
                  ? 'text-gray-700'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 w-12 md:w-20 mx-2 transition-all duration-300 ${
                index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
