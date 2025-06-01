import { createClient } from "@/utils/supabase/server";
import AcceptInvitePage from "./accept";

export default async function Page() {
    const supabase = await createClient();

    const { data: {user}, error } = await supabase.auth.getUser();
    if (error || !user) {
        throw new Error("User not found")
    }
  return (
    <AcceptInvitePage userId={user.id}/>
  )
}