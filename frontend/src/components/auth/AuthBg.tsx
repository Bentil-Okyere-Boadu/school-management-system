import React from 'react'

const AuthBg = ({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) => {
  return (
    <main className="flex relative justify-center items-center w-full min-h-[100vh] py-2">
      <div className="authBg absolute top-0 left-0 size-full" />
      {children}
    </main>
  )
}

export default AuthBg;