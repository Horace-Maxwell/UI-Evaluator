import { toast } from 'sonner';

export async function save(data: FormData) {
  try {
    await fetch('/api/save', { method: 'POST', body: data });
  } catch {
    toast.error('Something went wrong'); // expect: CPY-09
  }
}

export function FieldError() {
  return <p role="alert">Invalid</p>; // expect: CPY-09
}
