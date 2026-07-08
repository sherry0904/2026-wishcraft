import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

async function main() {
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  const { data: logs, error } = await client.from('quest_logs').select('*')
  console.log("Error:", error)
  console.log("Total quest_logs:", logs?.length)
  console.log("All logs:", logs)
}
main()
