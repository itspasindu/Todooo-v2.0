import { supabase } from '../supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function initializeDatabase() {
  try {
    // Execute schema creation statements directly
    const { error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);

    if (tasksError?.code === '42P01') {
      // Table doesn't exist, create schema
      const { error: createError } = await supabase
        .from('_schema_migrations')
        .insert([
          {
            name: 'initial',
            executed_at: new Date().toISOString()
          }
        ]);

      if (createError && createError.code !== '23505') { // Ignore duplicate key error
        console.error('Error creating schema:', createError);
        throw createError;
      }
    }

    // Set up RLS policies
    await setupRLS();

  } catch (error) {
    console.error('Database initialization error:', error);
    // Continue execution even if there's an error
    // The Supabase dashboard should be used for initial setup
  }
}

async function setupRLS() {
  try {
    // Enable RLS
    await supabase.rpc('enable_rls', {
      table_name: 'tasks'
    });
    await supabase.rpc('enable_rls', {
      table_name: 'todo_lists'
    });

    // Create policies
    await createPolicies();
  } catch (error) {
    console.error('Error setting up RLS:', error);
  }
}

async function createPolicies() {
  const policies = [
    {
      name: 'Users can only see their own tasks',
      table: 'tasks',
      definition: 'auth.uid() = user_id'
    },
    {
      name: 'Users can only see their own lists',
      table: 'todo_lists',
      definition: 'auth.uid() = user_id'
    }
  ];

  for (const policy of policies) {
    try {
      await supabase.rpc('create_policy', {
        policy_name: policy.name,
        table_name: policy.table,
        using_expression: policy.definition
      });
    } catch (error) {
      // Policy might already exist, continue
      console.log(`Policy ${policy.name} might already exist`);
    }
  }
}