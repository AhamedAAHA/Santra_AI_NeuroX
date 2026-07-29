import { redirect } from "next/navigation";

/** Old /try/review links → single-page form */
export default function TryReviewRedirect() {
  redirect("/try?from=pitch");
}
