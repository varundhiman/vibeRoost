// Minimal test function with no dependencies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve((req: Request) => {
  console.log('Minimal test function called')
  
  return new Response(JSON.stringify({
    message: 'Minimal test working',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  })
})