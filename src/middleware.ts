import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
  "/live-webinar(.*)",
  "/",
  "/callback(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    if (!isPublicRoute(req)) {
      console.log(`Protecting route: ${req.nextUrl.pathname}`);
      await auth.protect();
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);

    // If authentication fails, redirect to sign-in
    if (req.nextUrl.pathname !== "/sign-in") {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
