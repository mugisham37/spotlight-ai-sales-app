import { onAuthenticateUser } from "@/actions/auth";
import Header from "@/components/ReusableComponents/LayoutComponents/Header";
import Sidebar from "@/components/ReusableComponents/LayoutComponents/Sidebar";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  children: React.ReactNode;
};
const Layout = async ({ children }: Props) => {
  try {
    // Only run full authentication in production
    // In development, rely on Clerk middleware for protection
    if (process.env.NODE_ENV === "production") {
      const userExists = await onAuthenticateUser();

      if (!userExists.user) {
        redirect("/sign-in");
      }
    }
  } catch (error) {
    console.error("Error in protected layout:", error);
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
