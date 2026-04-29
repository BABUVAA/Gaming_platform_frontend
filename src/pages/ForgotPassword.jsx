import { Form, redirect } from "react-router-dom";
import { AuthShell, Button, Input } from "../components";
import useNavigateHook from "../hooks/useNavigateHook";
import { FiMail, FiRefreshCw } from "react-icons/fi";

const ForgotPassword = () => {
  const { goToLogin } = useNavigateHook();

  return (
    <AuthShell
      eyebrow="Recovery"
      title="Reset access without losing momentum."
      description="Enter the email attached to your player account and we’ll start the password reset flow."
      badges={["Secure Recovery", "Email Verification", "Account Protection"]}
      asideTitle="Why this matters"
      asideCopy="Your account controls tournament entry, wallet history, linked games, and verification requests, so recovery needs to stay deliberate."
      asideStats={[
        { label: "Protected Areas", value: "Wallet, clans, matches" },
        { label: "Reset Method", value: "Email-based recovery" },
        { label: "Next Step", value: "Return and sign back in" },
      ]}
      footer={
        <button
          type="button"
          onClick={goToLogin}
          className="font-semibold text-cyan-300 transition hover:text-cyan-200"
        >
          Back to login
        </button>
      }
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
          <FiRefreshCw className="text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Password reset</h2>
          <p className="mt-1 text-sm text-slate-400">
            We&apos;ll send the next recovery step to your email.
          </p>
        </div>
      </div>
      <Form method="POST" className="space-y-3">
        <Input
          type="email"
          placeholder="registered@email.com"
          name="email"
          label="Email address"
          iconStart={<FiMail />}
        />
        <Button
          type="submit"
          className="h-14 w-full rounded-2xl bg-cyan-300 text-sm font-black uppercase tracking-[0.16em] text-slate-950 hover:bg-cyan-200"
        >
          Send Reset Link
        </Button>
      </Form>
    </AuthShell>
  );
};

export async function forgotPassword(data) {
  const formData = await data.request.formData();
  const logData = Object.fromEntries(formData);
  console.log(logData); // This will log the user data to the console
  return redirect("/"); // Redirect after logging
}

export default ForgotPassword;
