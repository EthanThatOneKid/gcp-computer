import React from 'react';
import DashboardStartBtn from '@/components/DashboardStartBtn';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#0b0f17] p-8 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          GCP Computer
        </h1>
        <p className="leading-relaxed text-gray-400">
          Create an isolated code sandbox session on Compute Engine. Run bash commands, edit files,
          and attach persistent cloud storage buckets programmatically.
        </p>
        <div className="flex justify-center pt-2">
          <DashboardStartBtn />
        </div>
      </div>
    </div>
  );
}
