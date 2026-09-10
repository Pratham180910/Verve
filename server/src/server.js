import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { isSupabaseConfigured } from './config/supabase.js';

const PORT = process.env.PORT || 5000;

if (isSupabaseConfigured()) {
  console.log('Supabase client initialized with provided credentials');
} else {
  console.log('Supabase client initialized (pending SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env)');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
