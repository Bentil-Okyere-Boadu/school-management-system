"use client"
import React from 'react'
import { Payment } from '@/@types';
import StudentPayments from '@/components/admin/students/StudentPayments';


const StudentPaymentsView = () => {
  const payments = [
    {
      feeTitle: "Tuition Fee - Term 1",
      feeAmount: 1200,
      dueDate: "2025-08-15",
      status: "Pending",
      paymentMethod: "Bank Transfer",
      paidDate: "2025-08-10",
      paidBy: "Samuel Johnson"
    },
    {
      feeTitle: "Library Fee",
      feeAmount: 150,
      dueDate: "2025-09-01",
      status: "Pending",
      paymentMethod: "Mobile Money",
      paidDate: "2025-09-01",
      paidBy: "Ama Boateng"
    },
    {
      feeTitle: "Sports Contribution",
      feeAmount: 200,
      dueDate: "2025-08-20",
      status: "Pending",
      paymentMethod: "Mobile Money",
      paidDate: "2025-08-18",
      paidBy: "Anita Mensah"
    },
    {
      feeTitle: "Laboratory Fee",
      feeAmount: 300,
      dueDate: "2025-08-25",
      status: "Pending",
      paymentMethod: "Credit Card",
      paidDate: "2025-08-30",
      paidBy: "George Tetteh"
    },
    {
      feeTitle: "Uniform Fee",
      feeAmount: 100,
      dueDate: "2025-08-05",
      status: "Pending",
      paymentMethod: "Cash",
      paidDate: "2025-08-04",
      paidBy: "Kwame Nkrumah"
    },
    {
      feeTitle: "Exam Fee - Midterm",
      feeAmount: 250,
      dueDate: "2025-09-10",
      status: "Pending",
      paymentMethod: "Bank Transfer",
      paidDate: "2025-09-09",
      paidBy: "Josephine Owusu"
    }
  ];


  const onPayNowButtonClick = (item: Payment) => {
    console.log("Payment for:", item);
  };

  const onExportReportButtonClick = () => {
    console.log("Exporting report...");
  };
      
  return (
    <div>
      <StudentPayments
        payments={payments as Payment[]}
        onPayNowButtonClick={onPayNowButtonClick}
        onExportReportButtonClick={onExportReportButtonClick} />
    </div>
  )
}

export default StudentPaymentsView;