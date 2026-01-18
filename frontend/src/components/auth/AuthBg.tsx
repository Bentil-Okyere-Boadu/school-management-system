import React from 'react'

const AuthBg = ({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) => {
  return (
    <main className=" flex relative justify-center items-center w-full min-h-[100vh] py-2 authBg">
      <section className="absolute top-0 left-0 size-full flex justify-center items-center">
        {children}
      </section>
    </main>
  )
}

export default AuthBg;