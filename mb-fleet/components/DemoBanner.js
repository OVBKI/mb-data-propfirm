import { isSupabaseConfigured } from "../lib/supabase";

export default function DemoBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-800">
      <strong>Mode démo</strong> — données d'exemple. Configure Supabase (voir <code>.env.example</code> et <code>supabase-schema.sql</code>) pour passer en production.
    </div>
  );
}
