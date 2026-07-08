import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

async function main() {
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  const { data: gifts, error } = await client.from('gifts').select('*')
  console.log("Error:", error)
  console.log("Total gifts:", gifts?.length)
  console.log("All gifts:", gifts)
}
main()
