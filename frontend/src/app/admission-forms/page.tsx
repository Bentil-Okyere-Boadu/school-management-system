"use client";
import React, { useRef, useState } from 'react'
import StudentInformationStep from '@/components/admission-forms/StudentInformationStep';
import FamilyInformationStep from '@/components/admission-forms/FamilyInformationStep';
import AdditionalInformationStep from '@/components/admission-forms/AdditionalInformationStep';
import PreviewStep from '@/components/admission-forms/PreviewStep';
import CustomButton from '@/components/Button';
import Stepper from '@/components/common/Stepper';
import { StudentInformation, Guardian, AdditionalInformation } from '@/@types/index';
import { Dialog } from '@/components/common/Dialog';


const AdmissionFormsPage = () => {

  const [currentStep, setCurrentStep] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isConfirmApplicationSubmissionDialogOpen, setIsConfirmApplicationSubmissionDialogOpen] = useState(false);

  const [studentData, setStudentData] = useState<StudentInformation>({
    firstName: '',
    lastName: '',
    otherNames: '',
    email: '',
    dateOfBirth: '',
    placeOfBirth: '',
    gender: '',
    nationality: '',
    birthCertificateFile: undefined,
    religion: '',
    languagesSpoken: [],
    streetAddress: '',
    boxAddress: '',
    phone: '',
    academicYear: '',
    classFor: '',
    headshotFile: undefined,
  });

  const [guardians, setGuardians] = useState<Guardian[]>([{
    firstName: "",
    lastName: "",
    relationship: "",
    email: "",
    nationality: "",
    occupation: "",
    company: "",
    streetAddress: "",
    boxAddress: "",
    phone: "",
    optionalPhone: "",
    headshotFile: undefined,
  }]);

  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInformation>({
    primaryHomeLanguage: "",
    studentPrimaryLanguage: "",
    hasAcademicHistory: "no",
    previousSchool: undefined,
  });

  const handleStepMove = (direction: string) => {
    if(direction === 'forward'){
      setCurrentStep(currentStep + 1);
    } else if (direction === 'backward') {
      setCurrentStep(currentStep - 1);
    } 

    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    handleSubmit()
  }

  const onStepClick = (num: number) => {
    setCurrentStep(num)
  }

  const handleSubmit = () => {
    console.log('Submitting form:', studentData);
    console.log('Submitting form:', guardians);
    console.log('Submitting form:', additionalInfo);
  };

  return (
    <div className="min-h-screen bg-white w-full" ref={scrollRef}>
      <div className="lg:max-w-[54rem] mx-auto my-6 px-3">
        <h1 className="text-lg text-center py-6 font-bold">Student Admission</h1>

        <div className='mb-4'>
          <Stepper currentStep={currentStep} onStepClick={onStepClick} />

          {currentStep === 1 && (
            <StudentInformationStep   
              data={studentData}
              setData={setStudentData} />
          )}

          {currentStep === 2 && (
            <FamilyInformationStep     
              guardians={guardians}
              setGuardians={setGuardians} />
          )}

          {currentStep === 3 && (
            <AdditionalInformationStep     
              additionalInfo={additionalInfo}
              setAdditionalInfo={setAdditionalInfo} />
          )}

          {currentStep === 4 && (
            <>
              <div className="mt-14 flex justify-end">
                <CustomButton text="Submit Application" onClick={() => {setIsConfirmApplicationSubmissionDialogOpen(true)}} />
              </div>
              
              <PreviewStep   
                formData={{
                  studentData,
                  guardians,
                  additionalInfo
                }} />
            </>
          )}
        </div>

        <div className='flex justify-center gap-4'>
          { currentStep > 1 && <CustomButton variant="outline" text="Previous" onClick={() => handleStepMove('backward')} />}
          { currentStep < 4 && <CustomButton text="Continue" onClick={() => handleStepMove('forward')} /> }
          { currentStep === 4 && <CustomButton text="Submit Application" onClick={() => {setIsConfirmApplicationSubmissionDialogOpen(true)}} /> }
        </div>
      </div>

      {/* Confirm Application Submission Dialog */}
      <Dialog 
        isOpen={isConfirmApplicationSubmissionDialogOpen}
        busy={false}
        dialogTitle="Submit Application"
        saveButtonText="Submit Application"
        onClose={() => { setIsConfirmApplicationSubmissionDialogOpen(false)}} 
        onSave={() => {}}
      >
        <div className="my-6 flex flex-col gap-4 text-center">
          <p>
            Are you sure you want to submit your application? After this step, you won’t be able to make any changes. Please review your details before proceeding.
          </p>
        </div>
      </Dialog>
    </div>
  )
}

export default AdmissionFormsPage;