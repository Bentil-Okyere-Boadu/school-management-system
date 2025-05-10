import Link from 'next/link'
import React from 'react'

const HomePage = () => {
  return (
    <div className='w-[100%] h-[100%] flex flex-col justify-center items-center'>
        <h3>Log in as</h3>
        <ul>
          <li>
            <Link href={'/auth/login'}>Super Admin</Link>
          </li>
          <li>
            <Link href={'/auth/school-admin/login'}>School Admin</Link>
          </li>
          <li>
            <Link href={'/auth/teacher/login'}>Teacher</Link>
          </li>
        </ul>
      </div>
  )
}

export default HomePage