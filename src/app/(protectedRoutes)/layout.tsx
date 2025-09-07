import { onAuthenticateUser } from "@/actions/auth";
import Header from "@/components/ReusableComponents/LayoutComponents/Header";
import { Sidebar } from "@/components/ReusableComponents/LayoutComponents/Sidebar";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  children: React.ReactNode;
};
const Layout = async ({ children }: Props) => {
  try {
    const userExists = await onAuthenticateUser();

    if (!userExists.user) {
      console.log("User not authenticated, redirecting to sign-in");
      redirect("/sign-in");
    }

    console.log("User authenticated, rendering protected layout");
  } catch (error) {
    console.error("Error in protected layout:", error);
    redirect("/sign-in");
  }
  return (
    <div className="flex w-full min-h-screen">
      {/* <Sidebar /> */}
      <Sidebar />
      <div className="flex flex-col w-full h-screen overflow-auto px-4 scrollbar-hide container mx-auto">
        {/* <Header /> */}
        <Header />
        {children}
      </div>
    </div>
  );
};

export default Layout;
