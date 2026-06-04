import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://xuvgbevgfevgjmrymodm.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1dmdiZXZnZmV2Z2ptcnltb2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzkyNDEsImV4cCI6MjA5NjE1NTI0MX0.woQumDyXBzFpwomi-uszV40V53vGPAhwPmVE-uUekyo"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
