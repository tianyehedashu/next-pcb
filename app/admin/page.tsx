import React from "react";

export default function AdminDashboard() {
  return (
    <div className="w-full max-w-screen-xl mx-auto space-y-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 mb-8 text-center tracking-tight drop-shadow-sm">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <div className="text-2xl font-semibold text-blue-700">Orders</div>
          <div className="text-4xl font-bold mt-2 mb-1">--</div>
          <div className="text-gray-500">Total Orders</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <div className="text-2xl font-semibold text-blue-700">Users</div>
          <div className="text-4xl font-bold mt-2 mb-1">--</div>
          <div className="text-gray-500">Total Users</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <div className="text-2xl font-semibold text-blue-700">Site</div>
          <div className="text-4xl font-bold mt-2 mb-1">--</div>
          <div className="text-gray-500">Site Notices</div>
        </div>
      </div>
      <div className="mt-10 text-gray-400 text-sm text-center">Welcome to the NextPCB Admin Panel. Select a section from the sidebar to get started.</div>
    </div>
  );
} 