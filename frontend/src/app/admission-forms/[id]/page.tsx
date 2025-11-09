"use client";
import React, { useRef, useState } from 'react'
import StudentInformationStep from '@/components/admission-forms/StudentInformationStep';
import FamilyInformationStep from '@/components/admission-forms/FamilyInformationStep';
import AdditionalInformationStep from '@/components/admission-forms/AdditionalInformationStep';
import PreviewStep from '@/components/admission-forms/PreviewStep';
import CustomButton from '@/components/Button';
import Stepper from '@/components/common/Stepper';
import { StudentInformation, Guardian, AdditionalInformation, ErrorResponse, NotificationType } from '@/@types/index';
import { Dialog } from '@/components/common/Dialog';
import { toast } from 'react-toastify';
import { useParams, useRouter } from 'next/navigation';
import { useCreateNotification, useGetAdmissionClassLevels, useSubmitAdmissionForm } from '@/hooks/school-admin';


const AdmissionFormsPage = () => {

  const {id} = useParams();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isConfirmApplicationSubmissionDialogOpen, setIsConfirmApplicationSubmissionDialogOpen] = useState(false);

  const {classLevels} = useGetAdmissionClassLevels(id as string);

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
      studentData.languagesSpoken.length === 0 ||
      !studentData.streetAddress.trim() ||
      !studentData.boxAddress.trim() ||
      !studentData.phone.trim() ||
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

  // Helpers to list missing required fields for better error toasts
  const getMissingStudentFields = (): string[] => {
    const missing: string[] = [];
    if (!studentData.headshotFile) missing.push('Headshot photo');
    if (!studentData.firstName.trim()) missing.push('First name');
    if (!studentData.lastName.trim()) missing.push('Last name');
    if (!studentData.email.trim()) missing.push('Email');
    if (!studentData.dateOfBirth) missing.push('Date of birth');
    if (!studentData.placeOfBirth.trim()) missing.push('Place of birth');
    if (!studentData.gender) missing.push('Gender');
    if (!studentData.nationality.trim()) missing.push('Nationality');
    if (!studentData.birthCertificateFile) missing.push('Birth certificate');
    if (studentData.languagesSpoken.length === 0) missing.push('Languages spoken');
    if (!studentData.streetAddress.trim()) missing.push('Street address');
    if (!studentData.boxAddress.trim()) missing.push('Box address');
    if (!studentData.phone.trim()) missing.push('Phone');
    if (!studentData.classFor) missing.push('Class');
    return missing;
  };

  const getMissingGuardianFields = (): string[] => {
    const missing: string[] = [];
    for (let idx = 0; idx < guardians.length; idx++) {
      const g = guardians[idx];
      const label = `Guardian ${idx + 1}`;
      if (!g.firstName.trim()) missing.push(`${label}: First name`);
      if (!g.lastName.trim()) missing.push(`${label}: Last name`);
      if (!g.relationship.trim()) missing.push(`${label}: Relationship`);
      if (!g.email.trim()) missing.push(`${label}: Email`);
      if (!g.nationality.trim()) missing.push(`${label}: Nationality`);
      if (!g.occupation.trim()) missing.push(`${label}: Occupation`);
      if (!g.streetAddress.trim()) missing.push(`${label}: Street address`);
      if (!g.boxAddress.trim()) missing.push(`${label}: Box address`);
      if (!g.phone.trim()) missing.push(`${label}: Phone`);
      if (!g.headshotFile) missing.push(`${label}: Headshot photo`);
    }
    return missing;
  };

  const getMissingAdditionalInfoFields = (): string[] => {
    const missing: string[] = [];
    if (!additionalInfo.primaryHomeLanguage.trim()) missing.push('Primary home language');
    if (!additionalInfo.studentPrimaryLanguage.trim()) missing.push('Student primary language');
    if (additionalInfo.hasAcademicHistory === 'yes') {
      const ps = additionalInfo.previousSchool;
      if (!ps?.name.trim()) missing.push('Previous school name');
      if (!ps?.street.trim()) missing.push('Previous school street');
      if (!ps?.city.trim()) missing.push('Previous school city');
      if (!ps?.state.trim()) missing.push('Previous school state');
      if (!ps?.country.trim()) missing.push('Previous school country');
      if (!ps?.grade.trim()) missing.push('Previous school grade/class');
      if (!ps?.reportCards || ps.reportCards.length < 1) missing.push('Previous school report cards (min 1)');
    }
    return missing;
  };


  const handleStepMove = (direction: string) => {
    if(currentStep == 1 && direction == 'forward' && !validateStudentData() ){
      const missing = getMissingStudentFields();
      toast.error(`Please fill: ${missing.join(', ')}`);
      return;
    }

    if(currentStep == 2 && direction == 'forward' && !validateGuardians() ){
      const missing = getMissingGuardianFields();
      toast.error(`Please fill: ${missing.join(', ')}`);
      return;
    }

    if(currentStep == 3 && direction == 'forward' && !validateAdditionalInfo()){
      const missing = getMissingAdditionalInfoFields();
      toast.error(`Please fill: ${missing.join(', ')}`);
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
  const {mutate: createNotification} = useCreateNotification();

  const createNotificationForAdmission = () => {
    createNotification({
      title: "New Admission Application",
      message: `${studentData.firstName} ${studentData.lastName} has submitted an admission application.`,
      type: NotificationType.Admission,
      schoolId: id as string,
    }, {
      onError: (error: unknown) => {
        console.error("Failed to create notification:", error);
      } 
    });
  }

  const handleAdmissionFormSubmit = () => {
    const missingAll = [
      ...getMissingStudentFields(),
      ...getMissingGuardianFields(),
      ...getMissingAdditionalInfoFields(),
    ];

    if (missingAll.length > 0) {
      toast.error(`Please fill: ${missingAll.join(', ')}`);
      return;
    }

    if (validateStudentData() && validateGuardians() && validateAdditionalInfo()) {
      submitMutation(
        {
          studentData,
          guardians,
          additionalInfo,
          schoolId: id as string,
        },
        {
          onSuccess: () => {
            toast.success('Admission submitted successfully.');
            setIsConfirmApplicationSubmissionDialogOpen(false);
            createNotificationForAdmission();
            // Redirect to success page after a short delay
            setTimeout(() => {
              router.push(`/admission-forms/${id}/success`);
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
                  additionalInfo,
                  classLevels,
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