import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://lujdnxyfwmaegszcwcqq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1amRueHlmd21hZWdzemN3Y3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjMwMTQsImV4cCI6MjA5Njc5OTAxNH0.6CBgp9JI9SGb2uXAFd6qg1aSF8ltTamG3np2phYXJwE'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
