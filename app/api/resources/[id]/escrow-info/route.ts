import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Créer le client Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.error('Erreur lors de la définition du cookie:', error);
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              console.error('Erreur lors de la suppression du cookie:', error);
            }
          },
        },
      }
    );

    // Récupérer les informations escrow de la ressource
    const { data: escrowInfo, error: escrowError } = await supabase
      .from('resource_escrow_info')
      .select('requires_cfx_id, requires_email, requires_username, delivery_instructions')
      .eq('resource_id', id)
      .single();

    if (escrowError) {
      if (escrowError.code === 'PGRST116') {
        // Aucune information escrow trouvée
        return NextResponse.json({
          requires_cfx_id: false,
          requires_email: false,
          requires_username: false,
          delivery_instructions: null
        });
      }
      console.error('Erreur récupération escrow info:', escrowError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des informations escrow' }, { status: 500 });
    }

    return NextResponse.json(escrowInfo);

  } catch (error) {
    console.error('Erreur API escrow info:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
