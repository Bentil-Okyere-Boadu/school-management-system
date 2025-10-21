import { Subject } from '@/@types'
import CustomButton from '@/components/Button'
import { Dialog } from '@/components/common/Dialog'
import { SearchBar } from '@/components/common/SearchBar'
import InputField from '@/components/InputField'
import { useCreateSubject, useDeleteSubject, useGetAllSubjects, useUpdateSubject } from '@/hooks/school-admin'
import { Menu } from '@mantine/core'
import { IconDots, IconTrashFilled, IconEdit } from '@tabler/icons-react'
import React, { useState } from 'react'
import { HashLoader } from 'react-spinners'
import { toast } from 'react-toastify'

const Subjects = () => {
  const [isCreate, setIsCreate] = useState(false);
  const [isDialogOpen, setisDialogOpen] = useState(false);
  const [subject, setSubject] = useState<Subject>({name: "", description: "", id: ""});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedId, setSelectedId] = useState('')

  const { subjects, refetch, isLoading } = useGetAllSubjects();
  const { mutate: createSubject} = useCreateSubject();
  const { mutate: editSubject } = useUpdateSubject();
  const { mutate: deleteSubject} = useDeleteSubject();

  const onCreateSubjectClick = () => {
    setIsCreate(true);
    setSubject({name: "", description: "", id: ""})
    setisDialogOpen(true);
  }

  const onCloseDialog = () => {
    setSubject({name: "", description: "", id: ""})
    setisDialogOpen(false)
  }

  const saveSubject = () => {
    if(isCreate) {
      createSubject({name: subject.name, description: subject.description}, {
        onSuccess: () => {
          toast.success('Subject added successfully');
          onCloseDialog();
          setIsCreate(false);
          refetch();
        },
        onError: () => {
          toast.error('Subject creation failed.');
          onCloseDialog();
          setIsCreate(false);
        }
      })
    } else {
      editSubject( subject, {
        onSuccess: () => {
          toast.success('Subject added successfully');
          onCloseDialog();
          setIsCreate(false);
          refetch();
        },
        onError: () => {
          toast.error('Subject creation failed.');
          onCloseDialog();
          setIsCreate(false);
        }
      })
    }
  }

  const onDeleteSubject = () => {
    deleteSubject(selectedId, {
      onSuccess: () => {
          toast.success('Subject deleted successfully');
          onCloseDialog();
          setIsCreate(false);
          setSelectedId("");
          setConfirmDelete(false)
          refetch();
        },
        onError: () => {
          toast.error('Subject deletion failed.');
          onCloseDialog();
          setSelectedId("");
          setConfirmDelete(false)
          setIsCreate(false);
        }
    })
  }

  return (
    <div>
        <div className='w-full flex justify-between'>
            <SearchBar/>
            <CustomButton text='Create Subject' onClick={onCreateSubjectClick}/>
        </div>

        <section className="bg-white mt-5">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className='bg-blue-50'>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                    <div>Name</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                    <div>Description</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Loader state
                  if (isLoading) {
                    return (
                      <tr>
                        <td colSpan={8}>
                          <div className="relative py-20 bg-white">
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
                              <HashLoader color="#AB58E7" size={40} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Empty state
                  if (!subjects?.length) {
                    return (
                      <tr>
                        <td colSpan={8}>
                          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <p className="text-lg font-medium">No subjects added</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Added subjects will appear here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Data loaded state
                  return subjects.map((subject, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{subject.name}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{subject.description}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div className="flex items-center justify-end pr-6">
                          <Menu shadow="md" width={200}>
                            <Menu.Target>
                              <IconDots className="cursor-pointer" />
                            </Menu.Target>
                            <Menu.Dropdown className="!-ml-12 !-mt-2">
                              <Menu.Item
                                onClick={() => {
                                  setSubject(subject);
                                  setIsCreate(false);
                                  setisDialogOpen(true);
                                }}
                                leftSection={<IconEdit size={18} color="#AB58E7" />}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => {
                                  setConfirmDelete(true);
                                  setSelectedId(subject.id as string);
                                }}
                                leftSection={<IconTrashFilled size={18} color="red" />}
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </section>

        <Dialog
          isOpen={isDialogOpen}
          dialogTitle={isCreate? 'Create Subject': 'Edit Subject'}
          onClose={onCloseDialog}
          onSave={saveSubject}
        >
          <form className='mt-7'>
            <InputField 
              className='!py-0'
              label='Name'
              min={1}
              placeholder='Eg. Mathematics'
              onChange={(e) => setSubject({...subject, name: e.target.value})}
              value={subject.name}
            />

            <InputField
              className='!py-0'
              label='Description'
              min={1}
              onChange={(e) => setSubject({...subject, description: e.target.value})}
              value={subject.description}
            />
          </form>
        </Dialog>
        <Dialog
          dialogTitle='Delete confirmation'
          saveButtonText='Delete Subject'
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false) }
          onSave={() => {
            onDeleteSubject();
          }}
        >
          <div className='mt-4'>
            <p>Are you sure you want to delete this subject? The subject will be removed from the system permanently</p>
          </div>
        </Dialog>
    </div>
  )
}

export default Subjects