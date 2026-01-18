import React from "react";
import { CheckIcon } from "@mantine/core";

interface Step {
  label: string;
}

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}



export default function Stepper({ currentStep, onStepClick }: StepperProps) {
  const steps: Step[] = [
    { label: "Student Information" },
    { label: "Family Information" },
    { label: "Additional Information" },
    { label: "Preview" },
  ];

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Step circles and lines */}
      <div className="flex items-center justify-between w-full min-w-[348px] max-w-xl relative">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step Circle with label absolutely positioned below */}
            <div className="relative flex flex-col items-center cursor-pointer"
              onClick={() => onStepClick(index + 1)}
            >
              <div
                className={`z-10 flex items-center justify-center w-8 h-8 rounded-full border-1 text-lg font-bold
                  ${
                    currentStep === index + 1
                      ? "bg-purple-500 border-purple-500 text-white"
                      : currentStep > index + 1
                      ? "text-purple-500"
                      : "text-purple-500 bg-white"
                  }
                `}
              >
                {currentStep > index + 1 ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Label (absolutely positioned below circle) */}
                <span
                className={`
                    absolute top-10 md:text-center text-xs w-[90px] sm:w-[140px]
                    left-0 translate-x-0 font-bold
                    md:left-1/2 md:-translate-x-1/2
                    ${currentStep === index + 1 ? "text-purple-500" : "text-gray-400"}
                `}
                >
                {step.label}
                </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-purple-300 mx-1 mt-0.5" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
