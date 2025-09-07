import { onAuthenticateUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const AuthCallbackPage = async () => {
  try {
    const auth = await onAuthenticateUser();

    console.log("Auth callback result:", auth);

    if (auth.status === 200 || auth.status === 201) {
      console.log("Authentication successful, redirecting to /home");
      redirect("/home");
    } else if (
      auth.status === 403 ||
      auth.status === 500 ||
      auth.status === 400
    ) {
      console.log("Authentication failed, redirecting to /");
      redirect("/");
    }

    // Fallback redirect if status doesn't match expected values
    console.log("Unexpected auth status, redirecting to /");
    redirect("/");
  } catch (error) {
    console.error("Error in auth callback:", error);
    redirect("/");
  }
};

export default AuthCallbackPage;
