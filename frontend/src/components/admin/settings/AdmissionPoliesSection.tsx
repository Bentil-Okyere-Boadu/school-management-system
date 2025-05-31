"use client";
import { Dialog } from "@/components/common/Dialog";
import { IconUpload } from "@tabler/icons-react";
import React, { useState } from "react";
import CustomUnderlinedButton from "../CustomUnderlinedButton";
import InputField from "@/components/InputField";
import { AdmissionPolicy, ErrorResponse } from "@/@types";
import { useCreateAdmissionPolicy, useDeleteAdmissionPolicy, useGetAdmissionPolicies } from "@/hooks/school-admin";
import { toast } from "react-toastify";
import FileUploadArea from "@/components/common/FileUploadArea";
import DocumentItem from "@/components/common/DocumentItem";

export const AdmissionPoliciesSection: React.FC = () => {
  const [isConfirmDeleteAdmissionPolicyDialogOpen, setIsConfirmDeleteAdmissionPolicyDialogOpen] = useState(false);
  const [isAdmissionPolicyDialogOpen, setIsAdmissionPolicyDialogOpen] = useState(false);
  const [admissionPolicyName, setAdmissionPolicyName] = useState('');
  const [admissionPolicyId, setAdmissionPolicyId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { admissionPolicies, refetch } = useGetAdmissionPolicies();
  const { mutate: deleteMutation, isPending: pendingDelete } = useDeleteAdmissionPolicy();
  const { mutate: createMutation, isPending: pendingCreate } = useCreateAdmissionPolicy();


  const createAdmissionPolicy = () => {
    createMutation({ name: admissionPolicyName, file: selectedFiles[0]}, {
      onSuccess: () => {
        toast.success('Successfully created admission policy.')
        setAdmissionPolicyName('');
        setSelectedFiles([]);
        setIsAdmissionPolicyDialogOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

    const handleFileSelect = (files: File[]) => {
      setSelectedFiles(files);
    };

  const deleteAdmissionPolicy = () => {
    deleteMutation(admissionPolicyId, {
      onSuccess: () => {
        toast.success('Deleted successfully.');
        setIsConfirmDeleteAdmissionPolicyDialogOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const onDeleteButtonClick = (sId: string) => {
    setIsConfirmDeleteAdmissionPolicyDialogOpen(true);
    setAdmissionPolicyId(sId);
  }

  const onAddNewAdmissionPolicy = () => {
    setIsAdmissionPolicyDialogOpen(true)
    setAdmissionPolicyName('');
    setAdmissionPolicyId('');
  }

  const onHandleDocumentClick = (doc: AdmissionPolicy) => {
    const link = document.createElement("a");
    link.href = doc.documentUrl;
    link.download = doc.name;
    link.target = "_blank"; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
  <>
    <h1 className="text-md font-semibold text-neutral-800">
        Admission Policies
    </h1>
    <CustomUnderlinedButton
      text="Upload Document"
      textColor="text-purple-500"
      onClick={() => {onAddNewAdmissionPolicy()}}
      icon={<IconUpload size={10} />}
      showIcon={true}
    />
    <section className="flex flex-wrap gap-5 items-center text-base tracking-normal text-gray-800 mt-4">
      {admissionPolicies?.map((doc) => (
        <DocumentItem
          key={doc.id}
          name={doc.name}
          onCardClick={() => {onHandleDocumentClick(doc)}}
          onClose={() => {onDeleteButtonClick(doc.id)}}
        />
      ))}
    </section>

    {/* Creating/Editing AdmissionPolicy Dialog */}
    <Dialog 
      isOpen={isAdmissionPolicyDialogOpen}
      busy={pendingCreate}
      dialogTitle={'Admission Policy'}
      saveButtonText="Save"
      onClose={() => setIsAdmissionPolicyDialogOpen(false)} 
      onSave={createAdmissionPolicy }
    >
      <div className="my-3 flex flex-col gap-4">
        <InputField
          className="!py-0"
          placeholder=""
          label="Name"
          value={admissionPolicyName}
          onChange={(e) => { setAdmissionPolicyName(e.target.value)}}
          isTransulent={false}
        />
        
        <div>
            <p className="text-xs mb-1 text-[#52525c]">File Upload</p>
            <div className="flex flex-col gap-4 mb-5">
                <FileUploadArea onFileSelect={handleFileSelect} accept=".pdf,.doc,.docx,.xls,.xlsx" />
                {selectedFiles.length > 0 && (
                <div className="text-sm text-gray-700">
                    Selected: <strong>{selectedFiles.map(f => f.name).join(', ')}</strong>
                </div>
                )}
            </div>
        </div>
      </div>
    </Dialog>

    {/* Confirm Delete Admission Policy Dialog */}
    <Dialog 
      isOpen={isConfirmDeleteAdmissionPolicyDialogOpen}
      busy={pendingDelete}
      dialogTitle="Confirm Delete"
      saveButtonText="Delete"
      onClose={() => { setIsConfirmDeleteAdmissionPolicyDialogOpen(false)}} 
      onSave={deleteAdmissionPolicy}
    >
      <div className="my-3 flex flex-col gap-4">
        <p>
          Are you sure you want to delete this admission policy? You will loose all related information
        </p>
      </div>
    </Dialog>
  </>
  );
};
 