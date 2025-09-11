import React from "react";
import { redirect } from "next/navigation";
import { onAuthenticateUser } from "@/actions/auth";
import { getAllProductsFromStripe } from "@/actions/stripe";
import { Sidebar } from "lucide-react";
import Header from "@/components/ReusableComponents/LayoutComponents/Header";

type Props = {
  children: React.ReactNode;
};

const layout = async ({ children }: Props) => {
  const userAuth = await onAuthenticateUser();

  if (!userAuth.user) {
    redirect("/sign-in");
  }

  const stripeProducts = await getAllProductsFromStripe();

  return (
    <div className="flex w-full min-h-screen bg-background">
      <div className="hidden md:flex">
        <Sidebar className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col w-full h-screen overflow-auto px-4 scrollbar-hide container mx-auto">
        <Header
          user={userAuth.user}
          stripeProducts={stripeProducts.products || []}
        />
        <main className="flex-1 py-10">{children}</main>
      </div>
    </div>
  );
};

export default layout;
