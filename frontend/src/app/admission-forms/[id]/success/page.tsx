'use client';

import React from 'react';
import Image from 'next/image';
import AdmissionSuccessImg from '@/images/AdmissionSuccess.svg';

const AdmissionSuccessPage = () => {

  return (
    <div className='flex justify-center items-center p-5 min-h-[100vh]'>
      <div className='text-center sm:max-w-[500px]'>
        <Image
          src={AdmissionSuccessImg}
          alt='AdmissionImg'
          width={300}
          height={300}
          className='m-[auto]'
          priority
        />

        <h1 className='my-2 font-bold'>Application Submitted</h1>
        <p className='text-center'>
          &quot;Your application has been submitted successfully! You will be notified about the next steps via email.&quot;
        </p>
      </div>
    </div>
  );
};

export default AdmissionSuccessPage;
