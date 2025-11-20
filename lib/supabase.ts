import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fekiwfmrimfkkskjmldt.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZla2l3Zm1yaW1ma2tza2ptbGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzcwMzksImV4cCI6MjA3OTIxMzAzOX0.WReyPdElXe8jcHXPjZgD2hnohZsIYGQ5E0SXZIpSrsU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
