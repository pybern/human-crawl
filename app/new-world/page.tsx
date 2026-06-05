import { redirect } from "next/navigation";

// The cinematic now lives at the site root ("/"). Keep this path working for
// any existing links/bookmarks by redirecting to the new home.
export default function NewWorldRedirect() {
  redirect("/");
}
