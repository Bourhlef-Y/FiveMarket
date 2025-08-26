import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function AuthStatus() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div className="text-sm text-gray-500">
      {session ? (
        <p>Connecté en tant que: {session.user.email}</p>
      ) : (
        <p>Non connecté</p>
      )}
    </div>
  );
} 