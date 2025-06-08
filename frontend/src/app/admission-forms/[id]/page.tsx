"use client";
import React, { useRef, useState } from 'react'
import StudentInformationStep from '@/components/admission-forms/StudentInformationStep';
import FamilyInformationStep from '@/components/admission-forms/FamilyInformationStep';
import AdditionalInformationStep from '@/components/admission-forms/AdditionalInformationStep';
import PreviewStep from '@/components/admission-forms/PreviewStep';
import CustomButton from '@/components/Button';
import Stepper from '@/components/common/Stepper';
import { StudentInformation, Guardian, AdditionalInformation, ErrorResponse } from '@/@types/index';
import { Dialog } from '@/components/common/Dialog';
import { toast } from 'react-toastify';
import { useParams, useRouter } from 'next/navigation';
import { useGetAdmissionClassLevels, useSubmitAdmissionForm } from '@/hooks/school-admin';


const AdmissionFormsPage = () => {

  const {id: schoolId } = useParams();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isConfirmApplicationSubmissionDialogOpen, setIsConfirmApplicationSubmissionDialogOpen] = useState(false);

  const {classLevels} = useGetAdmissionClassLevels(schoolId as string);

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

  const validateStudentData = () => {
    if (
      !studentData.firstName.trim() ||
      !studentData.lastName.trim() ||
      !studentData.email.trim() ||
      !studentData.dateOfBirth ||
      !studentData.placeOfBirth.trim() ||
      !studentData.gender ||
      !studentData.nationality.trim() ||
      !studentData.birthCertificateFile ||
      !studentData.religion.trim() ||
      studentData.languagesSpoken.length === 0 ||
      !studentData.streetAddress.trim() ||
      !studentData.boxAddress.trim() ||
      !studentData.phone.trim() ||
      !studentData.academicYear ||
      !studentData.classFor ||
      !studentData.headshotFile
    ) {
      return false; // At least one required field is missing
    }

    return true;
  };


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

  const validateGuardians = (): boolean => {
    for (const guardian of guardians) {
      if (
        !guardian.firstName.trim() ||
        !guardian.lastName.trim() ||
        !guardian.relationship.trim() ||
        !guardian.email.trim() ||
        !guardian.nationality.trim() ||
        !guardian.occupation.trim() ||
        !guardian.company.trim() ||
        !guardian.streetAddress.trim() ||
        !guardian.boxAddress.trim() ||
        !guardian.phone.trim() ||
        !guardian.headshotFile
      ) {
        return false; // At least one required field is missing
      }
    }
    return true; // All guardians are valid
  };


  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInformation>({
    primaryHomeLanguage: "",
    studentPrimaryLanguage: "",
    hasAcademicHistory: "no",
    previousSchool: undefined,
  });

  const validateAdditionalInfo = () => {
    const { primaryHomeLanguage, studentPrimaryLanguage, hasAcademicHistory, previousSchool } = additionalInfo;

    if (!primaryHomeLanguage.trim() || !studentPrimaryLanguage.trim()) {
      return false;
    }

    if (hasAcademicHistory === "yes") {
      if (
        !previousSchool?.name.trim() ||
        // !previousSchool.url.trim() ||
        !previousSchool.street.trim() ||
        !previousSchool.city.trim() ||
        !previousSchool.state.trim() ||
        !previousSchool.country.trim() ||
        // !previousSchool.attendedFrom.trim() ||
        // !previousSchool.attendedTo.trim() ||
        !previousSchool.grade.trim() ||
        !previousSchool.reportCards ||
        previousSchool.reportCards.length < 1
      ) {
        return false;
      }
    }

    return true;
  };


  const handleStepMove = (direction: string) => {
    if(currentStep == 1 && direction == 'forward' && !validateStudentData() ){
      toast.error('Please ensure all required fields are filled.');
      return;
    }

    if(currentStep == 2 && direction == 'forward' && !validateGuardians() ){
      toast.error('Please ensure all required fields are filled.');
      return;
    }

    if(currentStep == 3 && direction == 'forward' && !validateAdditionalInfo()){
      toast.error('Please ensure all required fields are filled.');
      return;
    }

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
    if(num) return // remove this condition when validation for the stepper is clicked
    setCurrentStep(num)
  }

  const {mutate: submitMutation, isPending: pendingCreate} = useSubmitAdmissionForm();

  const handleAdmissionFormSubmit = () => {
    if (validateStudentData() && validateGuardians() && validateAdditionalInfo()) {
      submitMutation(
        {
          studentData,
          guardians,
          additionalInfo,
          schoolId: schoolId as string,
        },
        {
          onSuccess: () => {
            toast.success('Admission submitted successfully.');
            setIsConfirmApplicationSubmissionDialogOpen(false);
            setTimeout(() => {
              router.push(`/admission-forms/${schoolId}/success`);
            }, 200)
          },
          onError: (error: unknown) => {
            toast.error(
              JSON.stringify((error as ErrorResponse)?.response?.data?.message || 'Something went wrong.')
            );
          }
        }
      );
    }
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
              setData={setStudentData}
              classLevels={classLevels} />
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
        busy={pendingCreate}
        dialogTitle="Submit Application"
        saveButtonText="Submit Application"
        onClose={() => { setIsConfirmApplicationSubmissionDialogOpen(false)}} 
        onSave={handleAdmissionFormSubmit}
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