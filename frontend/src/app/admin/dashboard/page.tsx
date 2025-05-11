'use client'
import { Dialog } from '@/components/common/Dialog'
import InputField from '@/components/InputField'
import { useAppContext } from '@/context/AppContext'
import { useCreateSchool } from '@/hooks/school-admin'
import { AxiosError } from 'axios'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Define validation schema with Zod
const formSchema = z.object({
  schoolName: z.string().min(2, {
    message: 'School name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().min(10, {
    message: 'Phone number must be at least 10 digits.',
  }).regex(/^[0-9]+$/, {
    message: 'Phone number must contain only digits.',
  }),
  address: z.string().min(5, {
    message: 'Address must be at least 5 characters.',
  }),
});

const AdminDashboard = () => {

   const {
        register,
        handleSubmit,
        formState: {},
        watch
      } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schoolName: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  const [ address, email, schoolName, phone ] = watch(['address', 'email', 'schoolName', 'phone'])

  const [isCreateSchoolDialogOpen, setIsCreateSchoolDialogOpen] = useState(true);

  const { loggedInUser } = useAppContext();

  useEffect(() => {
    if(loggedInUser?.school.id) {
      setIsCreateSchoolDialogOpen(false);
    }
  }, [loggedInUser])


  const {isPending, mutate} = useCreateSchool()
  const createSchool = () => {
    mutate({ 
      name: schoolName, 
      address: address, 
      phone: phone, 
      email: email
    }, {
      onSuccess: () => {
        closeDialog();
      },
      onError: (error) => {
        toast.error((error as AxiosError).message);
      }
    })
  }
  const closeDialog = () => {
    setIsCreateSchoolDialogOpen(false);
  }

  return (
    <div>
      <Dialog
        isOpen={isCreateSchoolDialogOpen}
        dialogTitle="Create School"
        saveButtonText="Save Changes"
        onClose={() => {}} 
        busy={isPending}
        onSave={handleSubmit(createSchool)}
      >
        <form onSubmit={handleSubmit(createSchool)} method='POST' className="my-3 flex flex-col gap-4">
          <InputField
            className="!py-0"
            label="School Name"
            isTransulent={isPending}
            {...register('schoolName')}
          />
          <InputField
            className="!py-0"
            label="Address"
            isTransulent={isPending}
            {...register('address')}
          />
          <InputField
            className="!py-0"
            label="Email"
            isTransulent={isPending}
            {...register('email')}
          />
          <InputField
            className="!py-0"
            label="Phone"
            isTransulent={isPending}
            {...register('phone')}
          />
        </form>
      </Dialog>
    </div>
  )
}

export default AdminDashboard