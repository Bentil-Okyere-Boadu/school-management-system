import Image from "next/image";
import { useParams } from "next/navigation";
import NoProfileImg from "@/images/ProfilePic.jpg";
import React, { useEffect, useState } from "react";
import InputField from "@/components/InputField";
import { Parent, Student } from "@/@types";
import CustomButton from "@/components/Button";
import Guardian from "./Guardian";
import CustomUnderlinedButton from "@/components/common/CustomUnderlinedButton";
import { Dialog } from "@/components/common/Dialog";
import { useCreateGuardian, useUpdateStudentProfile } from "@/hooks/student";
import { toast } from "react-toastify";

interface StudentProfileProps {
  studentData: Student;
  viewMode: boolean;
  refetch: () => void;
}

const StudentProfile = ({studentData, viewMode, refetch} : StudentProfileProps) => {
  const { id } = useParams();
  const guardianObj: Parent = { 
    firstName: '',
    lastName: '',
    occupation: '',
    email: '',
    address: '',
    phone: '',
    relationship: ''
  }
  const { mutate: createGuardian } = useCreateGuardian(id? id as string : studentData?.id);
  const { mutate: editStudent } = useUpdateStudentProfile();

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newGuardian, setNewGuardian] = useState<Parent>(guardianObj);
  const [student, setStudent] = useState<Student>(studentData);

  useEffect(() => {
    setStudent(studentData);
  }, [studentData]);

  const saveStudentData = () => {
    editStudent( student, {
      onSuccess: () => {
        toast.success('Student data updated successfully.');
        refetch();
      },
      onError: () => {}
    })
  }

  const saveNewGuardian = () => {
    createGuardian(newGuardian as Parent, {
      onSuccess: () => {
        toast.success('Guardian added successfully.')
        refetch();
        setNewGuardian(guardianObj)
        setDialogOpen(false);
      },
      onError: (error: Error) => {
        toast.error('Error occured while adding guardian.')
        console.log(error);
      }
    })
  }

  return (
    <div>
      <div>
        <div className="flex justify-between flex-row">
          {/* Personal Information */}
          <div className="flex flex-col justify-center">
            <h3 className="font-bold mb-3">Personal Information</h3>
            <Image
              src={
                student?.profile
                  ? (student.profile as string)
                  : NoProfileImg.src
              }
              width={160}
              height={130}
              alt="studentProfilePic"
              className="rounded-[8px]"
            />
          </div>
          {id ? (
            <></>
          ) : (
            <div>
              <CustomButton text="Save changes" onClick={saveStudentData} />
            </div>
          )}
        </div>
        {/* Bio Data */}
        <div className="mt-15 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InputField
            className="!py-0"
            label="First Name"
            isTransulent={viewMode}
            value={student?.firstName}
            onChange={(e) => setStudent({...student, firstName: e.target.value})}
          />
          <InputField
            className="!py-0"
            label="Last Name"
            value={student?.lastName}
            isTransulent={viewMode}
            onChange={(e) => setStudent({...student, lastName: e.target.value})}
          />

          <InputField
            className="!py-0"
            label="Other Names"
            isTransulent={viewMode}
          />
          <InputField className="!py-0" label="Gender" isTransulent={true} />
          <InputField
            className="!py-0"
            label="Date of Birth"
            type="Date"
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Place of Birth"
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Email"
            type="Email"
            isTransulent={true}
            value={student?.email}
            onChange={(e) => setStudent({...student, email: e.target.value})}
          />
        </div>

        {/* Academic Information */}
        <div className="mt-15">
          <h3 className="font-bold mb-3">Academic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <InputField className="!py-0" label="Grade" isTransulent={true} />
            <InputField
              className="!py-0"
              label="Student ID"
              value={student?.studentId as string}
              isTransulent={true}
            />
          </div>
        </div>

        {/* Parent/Guardian Information */}
        <div className="mt-15 mb-10">
          <div className="flex justify-between items-center">
            <h3 className="font-bold mb-3">Parent/Guardian Information</h3>
            <CustomUnderlinedButton
              text="Add New"
              textColor="text-purple-500"
              onClick={() => setDialogOpen(true)}
              showIcon={false}
            />
          </div>
          {student?.parents.map((parent, index) => {
            return <Guardian key={index} parent={parent} viewMode={true} count={index+1} refetchStudentData={refetch}/>
          })}

          <Dialog
            isOpen={dialogOpen}
            dialogTitle="Add Guardian"
            onClose={() => setDialogOpen(false)}
            onSave={saveNewGuardian}
          >
            <div className="flex flex-col mt-3">
              <InputField className="!py-0" label="First Name" value={newGuardian?.firstName} onChange={(e) => setNewGuardian({...newGuardian, firstName: e.target.value as string})}/>
              <InputField className="!py-0" label="Last Name" value={newGuardian?.lastName} onChange={(e) => setNewGuardian({...newGuardian, lastName: e.target.value as string})}/>
              <InputField className="!py-0" label="Relationship with student" value={newGuardian?.relationship} onChange={(e) => setNewGuardian({...newGuardian, relationship: e.target.value as string})}/>
              <InputField className="!py-0" label="Occupation" value={newGuardian?.occupation} onChange={(e) => setNewGuardian({...newGuardian, occupation: e.target.value as string})}/>
              <InputField className="!py-0" label="Email" value={newGuardian?.email} onChange={(e) => setNewGuardian({...newGuardian, email: e.target.value as string})}/>
              <InputField className="!py-0" label="Street Address" value={newGuardian?.address} onChange={(e) => setNewGuardian({...newGuardian, address: e.target.value as string})}/>
              <InputField className="!py-0" label="Box Address"/>
              <InputField className="!py-0" label="Phone" value={newGuardian?.phone} onChange={(e) => setNewGuardian({...newGuardian, phone: e.target.value as string})}/>
            </div>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
