import { Suspense } from "react";
import LoginPage from "@/components/auth/LoginPage";

export const metadata = { title: "Sign in — Pocket Jane" };

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
