'use client'
import { Dialog } from '@/components/common/Dialog'
import InputField from '@/components/InputField'
import { useCreateSchool, useGetAdminDashboardStats, useGetSchoolAdminInfo, useGetSchoolUsers } from '@/hooks/school-admin'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ErrorResponse } from '@/@types'
import { DashboardTable } from '@/components/admin/dashboard/DashboardTable'
import CustomBarChart from '@/components/admin/dashboard/CustomBarChart'
import StatCard from '@/components/admin/dashboard/StatCard'
import { SearchBar } from '@/components/common/SearchBar'
import { useDebouncer } from "@/hooks/generalHooks";
import Link from 'next/link'

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
  calendlyUrl: z.string().url({
    message: 'Please enter a valid URL.', 
  })
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
      calendlyUrl: ''
    },
  });

  const [ address, email, schoolName, phone, calendlyUrl ] = watch(['address', 'email', 'schoolName', 'phone', 'calendlyUrl'])

  const [isCreateSchoolDialogOpen, setIsCreateSchoolDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

      const { dashboardStats } = useGetAdminDashboardStats();

    const stats = [
      {
        value: dashboardStats?.totalTeachers || 0,
        label: "Total Teachers",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/36a067b5f7f8490f5bc5c8962136645a32f17f39?placeholderIfAbsent=true",
        iconAlt: "School Icon",
        valueColor: "#597AE8",
      },
      {
        value: dashboardStats?.totalStudents || 0,
        label: "Total Students",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true",
        iconAlt: "Teacher Icon",
        valueColor: "#BD7CEB",
      },
      {
        value: dashboardStats?.totalApplications || 0,
        label: "Total Applications",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/2c8ec1dbb54a09a6027cd0a05fdb19c1c60805d1?placeholderIfAbsent=true",
        iconAlt: "Student Icon",
        valueColor: "#F081AE",
      },
      {
        value: (dashboardStats?.averageAttendanceRate ?? 0) + "%",
        label: "Average Attendance Rate",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/ba656832819e22052f838d66aeb1b30662f1df92?placeholderIfAbsent=true",
        iconAlt: "Attendance Icon",
        valueColor: "#64DB9E",
      },
    ];

  const { schoolAdminInfo, isLoading } = useGetSchoolAdminInfo();

  useEffect(() => {
    if(schoolAdminInfo?.school?.id || isLoading) {
      setIsCreateSchoolDialogOpen(false);
    } else {
      setIsCreateSchoolDialogOpen(true);
    }
  }, [schoolAdminInfo, isLoading])


  const {isPending, mutate} = useCreateSchool()
  const createSchool = () => {
    mutate({ 
      name: schoolName, 
      address: address, 
      phone: phone, 
      email: email,
      calendlyUrl: calendlyUrl
    }, {
      onSuccess: () => {
        closeDialog();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }
  const closeDialog = () => {
    setIsCreateSchoolDialogOpen(false);
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const { schoolUsers, refetch } = useGetSchoolUsers(currentPage, useDebouncer(searchQuery), "", "", "", 6);

  return (
    <div>

      <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full mx-0.5" />

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 py-6 px-0.5">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            value={stat.value}
            label={stat.label}
            iconUrl={stat.iconUrl}
            iconAlt={stat.iconAlt}
            valueColor={stat.valueColor}
          />
        ))}
      </section>

      <CustomBarChart />

      <div className="mt-10 p-6 bg-white rounded-lg">
        <DashboardTable schoolUsers={schoolUsers} refetch={refetch}  />
      </div>

      {/* Create School Dialog */}
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
          <div>
            <InputField
              className="mb-1 !py-0"
              label="Calendly URL"
              isTransulent={isPending}
              {...register('calendlyUrl')}
            />
            {<p className="text-sm">Click <Link href="https://calendly.com/scheduling" target="_blank" className="text-sm text-purple-600 hover:underline">
              here 
            </Link> to set up your meeting scheduling link on Calendly.</p>}
          </div>
        </form>
      </Dialog>
    </div>
  )
}

export default AdminDashboard