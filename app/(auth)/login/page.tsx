import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-primary">
          Lebanese University — Branch 5
        </h1>
        <p className="mt-1 text-sm text-slate-500">Master&apos;s Academic Portal</p>
      </div>
      <LoginForm />
      <div className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">
        Accounts are created by the administration.
      </p>
    </div>
  );
}
