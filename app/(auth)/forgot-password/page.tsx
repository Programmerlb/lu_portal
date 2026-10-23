import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-primary">Reset password</h1>
      <p className="mt-3 text-sm text-slate-600">
        Password reset is handled by the administration. Please contact the
        program coordinator with your registered university email.
      </p>
      <Link href="/login" className="mt-6 inline-block text-sm text-primary hover:underline">
        ← Back to sign in
      </Link>
    </div>
  );
}
