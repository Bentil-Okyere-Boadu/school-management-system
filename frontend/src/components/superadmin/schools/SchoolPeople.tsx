import { BadgeVariant, User } from '@/@types'
import Badge from '@/components/common/Badge'
import { capitalizeFirstLetter, getInitials } from '@/utils/helpers'
import React from 'react'

interface SchoolPeopleProps {
    users: User[]
}

const SchoolPeople: React.FC<SchoolPeopleProps> = ({users}) => {
  return (
    <section className="bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-60 max-w-[340px]">
                      <div>Name</div>
                    </th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                      <div>Role</div>
                    </th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                      <div>Status</div>
                    </th>
                    <th className="pr-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-right max-md:px-5 underline cursor-pointer"></th>
                  </tr>
                </thead>
                <tbody>
                  {users?.length > 0 ? (users.map((user: User) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div className="flex flex-1 items-center">
                          <div className="mr-2.5 w-10 h-10 text-base text-violet-500 bg-purple-50 rounded-full flex items-center justify-center">
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base text-zinc-800">{user.firstName} {user.lastName}</span>
                            <span className="text-sm text-neutral-500">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                        {user.role.name}
                      </td>
                      <td
                        className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5`}
                      >
                        <div className="flex items-center justity-start">
                          <Badge 
                            text={capitalizeFirstLetter(user.status)}
                            showDot={true} 
                            variant={user.status as BadgeVariant} />
                        </div>
                      </td>
                        <td
                          className="border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)]"
                        >
                          <div className="flex items-center justify-end pr-6">
                            {/* <Menu shadow="md" width={200}>
                              <Menu.Target>
                                <IconDots className="cursor-pointer" />
                              </Menu.Target>
                              <Menu.Dropdown className="!-ml-12 !-mt-2">
                                <Menu.Item 
                                  onClick={() => onResendInvitationMenuItemClick(user)} 
                                  disabled={user.status !== 'pending'}
                                  leftSection={<IconSend2 size={18} color="#AB58E7" />}>
                                  Resend Invitation
                                </Menu.Item>
                                <Menu.Item 
                                  onClick={() => onArchiveUserMenuItemClick(user)} 
                                  leftSection={<IconSquareArrowDownFilled size={18} color="#AB58E7" />}>
                                  Archive User
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu> */}
                          </div>
                        </td>
                    </tr>
                  ))
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                          <p className="text-lg font-medium">No users found</p>
                          <p className="text-sm text-gray-400 mt-1">Once users are added, they will appear in this table.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
  )
}

export default SchoolPeople