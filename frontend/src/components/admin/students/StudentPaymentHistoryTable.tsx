"use client";

import React from "react";
import { Payment } from "@/@types";

interface StudentPaymentHistoryTableProps {
  payments: Payment[];
}

const StudentPaymentHistoryTable = ({ payments }: StudentPaymentHistoryTableProps) => {

  return (
    <section className="bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[150px]">
                <div>Fee Title</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                <div>Amount</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                <div>Payment Method</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                <div>Date Paid</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[100px]">
                <div>Paid By</div>
              </th>
            </tr>
          </thead>

          <tbody>
            {payments?.length > 0 ? (
              payments.map((data: Payment, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    {data.feeTitle}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {data.feeAmount}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {data.paymentMethod}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {data.paidDate}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {data.paidBy}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                    <p className="text-lg font-medium">No payments found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Once payments are made, they will appear in this table.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default StudentPaymentHistoryTable;
