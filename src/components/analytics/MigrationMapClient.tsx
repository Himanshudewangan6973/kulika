"use client";

import dynamic from "next/dynamic";

const MigrationMap = dynamic(
  () => import("@/components/analytics/MigrationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400">
        Loading Migration Map...
      </div>
    ),
  }
);

export default function MigrationMapClient(props: any) {
  return <MigrationMap {...props} />;
}