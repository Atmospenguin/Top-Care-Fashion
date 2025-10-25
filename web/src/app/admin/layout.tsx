import React from "react";
import AdminGuard from "@/components/admin/AdminGuard";

export const metadata = {
  title: "Admin • TOP",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout px-4 md:px-6 py-4">
      <AdminGuard>
        {children}
      </AdminGuard>
    </div>
  );
}
