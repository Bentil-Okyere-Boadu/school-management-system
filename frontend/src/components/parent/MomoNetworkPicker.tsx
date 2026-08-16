"use client";

import type { ParentPaymentChannel } from "@/hooks/parent";
import { IconCheck } from "@tabler/icons-react";
import React from "react";

const NETWORKS: Array<{
  value: ParentPaymentChannel;
  label: string;
  hint: string;
  logo: string;
}> = [
  { value: "mtn-gh", label: "MTN", hint: "MoMo", logo: "/networks/mtn.png" },
  {
    value: "vodafone-gh",
    label: "Telecel",
    hint: "Cash",
    logo: "/networks/telecel.png",
  },
  {
    value: "tigo-gh",
    label: "AirtelTigo",
    hint: "Money",
    logo: "/networks/airteltigo.png",
  },
];

interface MomoNetworkPickerProps {
  value: ParentPaymentChannel;
  onChange: (channel: ParentPaymentChannel) => void;
}

export const MomoNetworkPicker: React.FC<MomoNetworkPickerProps> = ({
  value,
  onChange,
}) => {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-600">Network</p>
      <div className="grid grid-cols-3 gap-2.5">
        {NETWORKS.map((network) => {
          const selected = value === network.value;
          return (
            <button
              key={network.value}
              type="button"
              onClick={() => onChange(network.value)}
              aria-pressed={selected}
              className={`relative flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 transition-all cursor-pointer ${
                selected
                  ? "border-teal-500 bg-teal-50 shadow-[0_0_0_3px_rgba(20,184,166,0.18)]"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {selected && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-white">
                  <IconCheck size={10} stroke={3} />
                </span>
              )}
              <img
                src={network.logo}
                alt={network.label}
                className="h-12 w-12 rounded-xl object-cover shadow-sm"
              />
              <span className="text-center">
                <span className="block text-xs font-semibold text-neutral-800">
                  {network.label}
                </span>
                <span className="block text-[10px] text-zinc-500">
                  {network.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
