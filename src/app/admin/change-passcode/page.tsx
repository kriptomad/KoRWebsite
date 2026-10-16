import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRole, getCurrentStaffUser } from "@/lib/auth/current-role";
import { ChangePasscodeForm } from "@/components/admin/ChangePasscodeForm";

export default async function ChangePasscodePage() {
  const role = await getCurrentRole();
  if (!role) redirect("/admin/login");

  const staffUser = await getCurrentStaffUser();
  if (!staffUser) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-deep">Change Passcode</h1>
        <p className="mt-2 text-sm text-brand-ink/70">
          You&apos;re signed in with the Owner master passcode, which is managed on the{" "}
          <Link href="/admin/settings" className="font-semibold underline">
            Site Settings
          </Link>{" "}
          page instead.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">Change Passcode</h1>
      {staffUser.mustChangePasscode ? (
        <p className="mt-2 text-sm text-brand-ink/70">
          The Owner reset your passcode. Set a new one below to continue — you won&apos;t be able to use the admin
          area until you do.
        </p>
      ) : (
        <p className="mt-2 text-sm text-brand-ink/70">Update the passcode for your own staff account.</p>
      )}
      <div className="mt-8">
        <ChangePasscodeForm forced={staffUser.mustChangePasscode} />
      </div>
    </div>
  );
}
