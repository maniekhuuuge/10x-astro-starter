import { defineMiddleware } from 'astro:middleware';

import { supabaseClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware((context: { locals: { supabase?: any } }, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});