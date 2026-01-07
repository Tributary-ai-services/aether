import React, { useState } from 'react';
import Modal from '../ui/Modal';
import StepIndicator from './StepIndicator';
import WelcomeStep from './steps/WelcomeStep';
import NotebookIntroStep from './steps/NotebookIntroStep';
import FeaturesStep from './steps/FeaturesStep';
import CompleteStep from './steps/CompleteStep';

const OnboardingModal = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const steps = [
    { label: 'Welcome', component: WelcomeStep },
    { label: 'Notebook', component: NotebookIntroStep },
    { label: 'Features', component: FeaturesStep },
    { label: 'Complete', component: CompleteStep }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Prevent multiple simultaneous completion attempts
    if (isCompleting) return;

    setIsCompleting(true);

    try {
      // Mark onboarding as complete using the hook
      if (onComplete) {
        await onComplete();
      }

      // Wait longer to ensure state has fully propagated through React and API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reset to first step for next time
      setCurrentStep(0);

      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to mark onboarding complete:', error);
      // Still close the modal even if the API call fails
      setCurrentStep(0);
      onClose();
    } finally {
      setIsCompleting(false);
    }
  };

  const handleClose = () => {
    // Allow closing the modal, but don't mark as complete
    // Reset to first step
    setCurrentStep(0);
    onClose();
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="xlarge"
    >
      <div className="px-6 py-4">
        {/* Step Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} />

        {/* Step Content */}
        <div className="mt-6">
          <CurrentStepComponent
            onNext={handleNext}
            onBack={handleBack}
            onComplete={handleComplete}
            onClose={onClose}
            isCompleting={isCompleting}
          />
        </div>
      </div>
    </Modal>
  );
};

export default OnboardingModal;
