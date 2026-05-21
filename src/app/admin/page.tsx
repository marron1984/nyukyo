import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  if (!isAdminAuthed()) {
    redirect("/admin/login");
  }
  return <AdminClient />;
}
