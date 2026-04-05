/*
  Run this SQL in Supabase to create the notifications table:

  CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_notifications_read ON notifications(read);
  CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
*/

import supabase from '../lib/supabase.js';
import { validateRequest } from '../lib/api-auth.js';

export default async function handler(req, res) {
  const auth = validateRequest(req);
  if (!auth.valid) return res.status(401).json({ error: auth.error });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[notifications] fetch error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data: data || [] });
  }

  if (req.method === 'POST') {
    const { action, id } = req.body || {};

    if (action === 'mark_read' && id) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === 'mark_all_read') {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action. Use mark_read or mark_all_read' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
