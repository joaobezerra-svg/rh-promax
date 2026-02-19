import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gxytdvabjigkangghqtc.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4Vfz-YFvENyuiU_Fh6WnwA_aoeFBR10'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
