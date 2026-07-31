import { useState } from "react";
import { FiArrowLeft, FiKey, FiLock } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Button, Input } from "../components";
import { ROUTES } from "../routes/routeConstants";
import { useAccountStore } from "../store/useStore";

const createInitialFields = () => ({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const validateFields = (fields) => {
  const errors = {};

  if (!fields.currentPassword) {
    errors.currentPassword = "Enter your current password.";
  }

  if (
    fields.newPassword.length < 8 ||
    !/[a-z]/.test(fields.newPassword) ||
    !/[A-Z]/.test(fields.newPassword) ||
    !/\d/.test(fields.newPassword) ||
    !/[^A-Za-z0-9]/.test(fields.newPassword)
  ) {
    errors.newPassword =
      "Use 8+ characters with uppercase, lowercase, number, and symbol.";
  }

  if (fields.confirmPassword !== fields.newPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
};

const ChangePassword = () => {
  const [fields, setFields] = useState(createInitialFields);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updatePassword } = useAccountStore();

  const updateField = (event) => {
    const { name, value } = event.target;

    // Passwords remain local component state and are discarded when this page
    // unmounts; Redux receives them only as the short-lived request argument.
    setFields((currentFields) => ({
      ...currentFields,
      [name]: value,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
    setFormError("");
  };

  const submitPasswordChange = async (event) => {
    event.preventDefault();

    const validationErrors = validateFields(fields);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await updatePassword({
        currentPassword: fields.currentPassword,
        newPassword: fields.newPassword,
      }).unwrap();
      // The successful thunk invalidates auth state, and the player route
      // redirects to login after the backend closes the Redis session.
    } catch (error) {
      setFieldErrors(error?.fieldErrors || {});
      setFormError(error?.message || "Unable to change your password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <Link
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-cyan-300"
        to={ROUTES.ACCOUNT_SETTINGS}
      >
        <FiArrowLeft aria-hidden="true" />
        Account settings
      </Link>

      <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-[0_18px_44px_rgba(2,8,23,0.2)]">
        <header className="border-b border-slate-700 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-cyan-300/10 p-2.5 text-cyan-300">
              <FiKey aria-hidden="true" className="text-xl" />
            </span>
            <div>
              <h1 className="text-xl font-black text-white">Change password</h1>
              <p className="mt-1 text-sm text-slate-400">
                You will sign in again after changing it.
              </p>
            </div>
          </div>
        </header>

        <form className="space-y-1 p-5 sm:p-6" onSubmit={submitPasswordChange}>
          <Input
            autoComplete="current-password"
            error={fieldErrors.currentPassword}
            iconStart={<FiLock aria-hidden="true" />}
            id="currentPassword"
            label="Current password"
            name="currentPassword"
            onChange={updateField}
            placeholder="Enter current password"
            type="password"
            value={fields.currentPassword}
          />
          <Input
            autoComplete="new-password"
            error={fieldErrors.newPassword}
            iconStart={<FiKey aria-hidden="true" />}
            id="newPassword"
            label="New password"
            name="newPassword"
            onChange={updateField}
            placeholder="Create a new password"
            type="password"
            value={fields.newPassword}
          />
          <Input
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            iconStart={<FiKey aria-hidden="true" />}
            id="confirmPassword"
            label="Confirm new password"
            name="confirmPassword"
            onChange={updateField}
            placeholder="Enter the new password again"
            type="password"
            value={fields.confirmPassword}
          />

          {formError ? (
            <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-600 bg-slate-700 px-5 text-xs font-black uppercase tracking-[0.12em] text-slate-200 transition hover:border-slate-500 hover:text-white"
              to={ROUTES.ACCOUNT_SETTINGS}
            >
              Cancel
            </Link>
            <Button
              disabled={isSubmitting}
              isLoading={isSubmitting}
              size="small"
              type="submit"
            >
              Change password
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ChangePassword;
