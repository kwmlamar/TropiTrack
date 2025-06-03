import { getProfile } from "@/lib/data/data";
import { supabase } from "@/lib/supabaseClient"

export async function fetchPayroll(userId: string) {
    const profile = await getProfile(userId);

    const { data, error} = await supabase
    .from("payroll")
    .select("*")
    .eq("company_id", profile.company_id)

    if (error) {
        throw new Error("Error fetching Payroll:", error)
    }

    return data;
}