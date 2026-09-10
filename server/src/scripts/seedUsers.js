import 'dotenv/config';

import bcrypt from 'bcryptjs';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

const seedUsers = async () => {
  try {
    if (!isSupabaseConfigured()) {
      console.error('Supabase is not configured. Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env');
      process.exit(1);
    }

    console.log('Connected to Supabase for seeding...');

    const users = [
      {
        name: 'Admin User',
        email: 'admin@verve.com',
        password: 'AdminPassword123!',
        role: 'ADMIN',
      },
      {
        name: 'Project Lead User',
        email: 'lead@verve.com',
        password: 'LeadPassword123!',
        role: 'PROJECT_LEAD',
      },
      {
        name: 'Member User',
        email: 'member@verve.com',
        password: 'MemberPassword123!',
        role: 'MEMBER',
      },
    ];

    for (const userData of users) {
      const cleanEmail = userData.email.toLowerCase().trim();
      const { data: existing, error: findError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (findError) {
        throw new Error(`Error checking user ${cleanEmail}: ${findError.message}`);
      }

      if (!existing) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const { error: insertError } = await supabase.from('users').insert({
          name: userData.name,
          email: cleanEmail,
          password: hashedPassword,
          role: userData.role,
          status: 'ACTIVE',
        });

        if (insertError) {
          throw new Error(`Error inserting user ${cleanEmail}: ${insertError.message}`);
        }

        console.log(`Created ${userData.role} user: ${cleanEmail}`);
      } else {
        console.log(`User already exists: ${cleanEmail}`);
      }
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedUsers();
