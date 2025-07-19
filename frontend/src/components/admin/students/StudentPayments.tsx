"use client";

import React from "react";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import { BadgeVariant, Payment } from "@/@types";
import CustomButton from "@/components/Button";
import StudentPaymentHistoryTable from "./StudentPaymentHistoryTable";
import Badge from "@/components/common/Badge";
import { IconDownload } from "@tabler/icons-react";

interface StudentPaymentsProps {
  payments: Payment[];
  onPayNowButtonClick?: (item: Payment) => void;
  onExportReportButtonClick?: () => void;
}

const StudentPayments: React.FC<StudentPaymentsProps>  = ({payments, onPayNowButtonClick, onExportReportButtonClick}) => {

  return (
    <div className="pb-8">
      <h1 className="text-md font-semibold text-neutral-800 mb-4">Upcoming Payments</h1>
      <div>
        <div className="mb-10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="">
                <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
                  Fee Title
                </th>
                <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
                  Fee Amount
                </th>
                <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
                  Due Date
                </th>
                <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
                  Status
                </th>
                <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {
                payments?.length > 0 && payments.map((data, index) => (
                  <tr className="border-b border-solid border-b-gray-200" key={index + "12"}>
                    <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
                      {data.feeTitle}
                    </td>
                    <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
                      {data.feeAmount}
                    </td>
                    <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
                      {data.dueDate}
                    </td>
                    <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
                      <Badge 
                        text={data.status}
                        showDot={true} 
                        variant={data?.status?.toLowerCase() as BadgeVariant} />
                    </td>
                    <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
                      <CustomButton
                        text="Pay Now"
                        variant="outline"
                        className="bg-white"
                        onClick={() => {
                          if (onPayNowButtonClick) onPayNowButtonClick(data);
                        }}
                      />
                    </td>
                  </tr>
                )) 
              }
            </tbody>
          </table>
        </div>

        {payments?.length === 0 && (
          <NoAvailableEmptyState message="No payments available yet." />
        )}
      </div>

      <h1 className="text-md font-semibold text-neutral-800 mb-4">Payment History</h1>
        <CustomButton
          text="Export Report"
          icon={<IconDownload size={16} />}
          className="mb-4"
          onClick={() => {
            if (onExportReportButtonClick) onExportReportButtonClick();
          }}
        />
      <StudentPaymentHistoryTable payments={payments} />
    </div>
  );
}

export default StudentPayments