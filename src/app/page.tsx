import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  // Check if user is authenticated
  const user = await currentUser();
  
  // If authenticated, redirect to home dashboard
  if (user) {
    redirect("/home");
  }

  // If not authenticated, show landing page
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Spotlight AI Sales
          </h1>
          <p className="text-muted-foreground mb-8">
            Your AI-powered sales platform for webinars and pipeline management.
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/sign-in"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium flex items-center justify-center"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up"
              className="w-full border border-border hover:bg-muted h-10 px-4 py-2 rounded-md font-medium flex items-center justify-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
