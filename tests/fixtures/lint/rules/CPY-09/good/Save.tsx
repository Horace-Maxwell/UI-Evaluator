import { toast } from 'sonner';

export async function save(data: FormData) {
  try {
    await fetch('/api/save', { method: 'POST', body: data });
  } catch {
    toast.error('Your changes were not saved because the connection dropped. Reconnect, then choose Save again.');
  }
}
