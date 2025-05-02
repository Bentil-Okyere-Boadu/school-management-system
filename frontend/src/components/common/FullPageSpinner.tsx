'use client'
import React from 'react'
import { HashLoader } from "react-spinners";
import '@/app/global.css';

const FullPageSpinner = () => {

  return  (
        <div className='fullPageSpinner'>
            <HashLoader color='#AB58E7' size={40} />
        </div>
    );
    
  
}

export default FullPageSpinner