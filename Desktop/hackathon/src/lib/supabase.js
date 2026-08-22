const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Using Service Role Key to easily bypass Row Level Security (RLS) during the hackathon
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;