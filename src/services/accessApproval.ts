import { supabase } from '../lib/supabase';

export type AccessApprovalStatus = 'pending' | 'approved' | 'denied' | 'error';
export type AccessRequestRow = {
  user_id: string;
  email: string | null;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  decided_at: string | null;
  note: string | null;
};

type AccessRow = {
  status: 'pending' | 'approved' | 'denied';
};

export async function ensureAndGetAccessStatus(userId: string, email?: string | null): Promise<AccessApprovalStatus> {
  if (!supabase) return 'error';

  const { data, error } = await supabase
    .from('user_access_requests')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle<AccessRow>();

  if (error) return 'error';
  if (data?.status) return data.status;

  const { error: insertError } = await supabase
    .from('user_access_requests')
    .insert({ user_id: userId, email: email ?? null, status: 'pending' });

  if (insertError) return 'error';
  return 'pending';
}

export async function isCurrentUserAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle<{ user_id: string }>();

  if (error) return false;
  return Boolean(data?.user_id);
}

export async function listAccessRequests(status?: 'pending' | 'approved' | 'denied'): Promise<AccessRequestRow[]> {
  if (!supabase) return [];

  let query = supabase
    .from('user_access_requests')
    .select('user_id, email, status, requested_at, decided_at, note')
    .order('requested_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AccessRequestRow[];
}

export async function setAccessRequestStatus(
  userId: string,
  status: 'approved' | 'denied' | 'pending',
  note?: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_access_requests')
    .update({
      status,
      decided_at: status === 'pending' ? null : new Date().toISOString(),
      note: note ?? null,
    })
    .eq('user_id', userId);

  return !error;
}
