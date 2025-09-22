"use client";

import React from "react";
import { BarChart } from '@mantine/charts';

interface CustomBarChatProps {
  dataList: DataList[]
}

interface DataList {
  name: string
  "Attendence-Level": number
}

const CustomBarChart: React.FC<CustomBarChatProps> = ({dataList}) => {

  return (
    <div className="bg-[#fff] p-4 rounded-lg relative pt-16">
        <p className="top-2 lg:top-4 absolute font-semibold"> Attendance Across Different Grades</p>
        <BarChart
            h={320}
            data={dataList}
            dataKey="name"
            series={[
                { name: 'Attendence-Level', color: 'rgba(237, 148, 146, 0.7)' },
            ]}
            tickLine="x"
        />
    </div>
  );
};

export default CustomBarChart;
