"use client";
import React, { useRef, useState } from 'react'
import StudentInformationStep from '@/components/admission-forms/StudentInformationStep';
import FamilyInformationStep from '@/components/admission-forms/FamilyInformationStep';
import AdditionalInformationStep from '@/components/admission-forms/AdditionalInformationStep';
import PreviewStep from '@/components/admission-forms/PreviewStep';
import CustomButton from '@/components/Button';
import Stepper from '@/components/common/Stepper';


const AdmissionFormsPage = () => {

  const [currentStep, setCurrentStep] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleStepMove = (direction: string) => {
    if(direction === 'forward'){
      setCurrentStep(currentStep + 1);
    } else if (direction === 'backward') {
      setCurrentStep(currentStep - 1);
    } 

    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  const onStepClick = (num: number) => {
    setCurrentStep(num)
  }

  return (
    <div className="min-h-screen bg-white w-full" ref={scrollRef}>
      <div className="lg:max-w-[54rem] mx-auto my-6 px-3">
        <h1 className="text-lg text-center py-6 font-bold">Student Admission</h1>

        <div className='mb-4'>
          <Stepper currentStep={currentStep} onStepClick={onStepClick} />

          {currentStep === 1 && (
            <StudentInformationStep />
          )}

          {currentStep === 2 && (
            <FamilyInformationStep />
          )}

          {currentStep === 3 && (
            <AdditionalInformationStep />
          )}

          {currentStep === 4 && (
            <PreviewStep />
          )}
        </div>

        <div className='flex justify-center gap-4'>
          { currentStep > 1 && <CustomButton variant="outline" className="!py-1" text="Previous" onClick={() => handleStepMove('backward')} />}
          <CustomButton className="!py-1" text="Save and Continue" onClick={() => handleStepMove('forward')} />
        </div>
      </div>
    </div>
  )
}

export default AdmissionFormsPage;