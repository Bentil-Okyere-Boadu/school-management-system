"use client";

import React from "react";
import type { PerformanceCluster } from "@/@types";
import { CLUSTER_STYLES } from "./performanceClusters";

interface ClusterBadgeProps {
  cluster: PerformanceCluster | null;
  className?: string;
}

/** Solid, filled pill used in the performance tables and student summary card. */
export const ClusterBadge: React.FC<ClusterBadgeProps> = ({
  cluster,
  className = "",
}) => {
  if (!cluster) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const style = CLUSTER_STYLES[cluster];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${style.solidClass} ${className}`}
    >
      {cluster}
    </span>
  );
};

export default ClusterBadge;
