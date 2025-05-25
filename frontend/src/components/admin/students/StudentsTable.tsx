"use client"
import { Menu } from '@mantine/core'
import { IconArchiveFilled, IconDots, IconEyeFilled, IconSend, IconTrashFilled } from '@tabler/icons-react'
import React from 'react'

const StudentsTable = () => {
  return (
    <section className='bg-white'>
        <div className='overflow-x-auto'>
            <table className='w-full border-collapse min-w-[500px]'>
                <thead>
                    <tr className="bg-gray-50">
                        <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[150px]">
                            <div>ID</div>
                        </th>
                        <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                            <div>First Name</div>
                        </th>
                        <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                            <div>Last Name</div>
                        </th>
                        <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                            <div>Other Names</div>
                        </th>
                        <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[100px]">
                            <div>Class/Grade</div>
                        </th>
                        <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                            <div>Date of Birth</div>
                        </th>
                        <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[50px]">
                            
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>
                            <div className="flex items-center justify-end pr-6">
                                <Menu shadow='md' width={200}>
                                    <Menu.Target>
                                        <IconDots className='cursor-pointer' />
                                    </Menu.Target>
                                    <Menu.Dropdown className="!-ml-12 !-mt-2">
                                        <Menu.Item leftSection={<IconEyeFilled size={18} color='#AB58E7'/>}>Full View</Menu.Item>
                                        <Menu.Item leftSection={<IconSend size={18} color='#AB58E7'/>}>Transfer Records</Menu.Item>
                                        <Menu.Item leftSection={<IconArchiveFilled size={18} color='#AB58E7'/>}>Archive Records</Menu.Item>
                                        <Menu.Item leftSection={<IconTrashFilled size={18} color='#AB58E7'/>}>Delete Records</Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
  )
}

export default StudentsTable;