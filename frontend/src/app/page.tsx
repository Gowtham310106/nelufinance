// Root page — redirects to locale-prefixed login
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/en/login");
}
