import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '30d';

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Calculer les dates selon la période
    const now = new Date();
    let startDate = new Date();
    let dateFormat = 'day';
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        dateFormat = 'day';
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        dateFormat = 'day';
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        dateFormat = 'week';
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        dateFormat = 'month';
        break;
    }

    // Récupérer les commandes
    const { data: orders } = await supabase
      .from('orders')
      .select('amount, created_at, resources!inner(author_id)')
      .eq('resources.author_id', userId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Grouper les données par période
    const chartData: { [key: string]: { revenue: number; sales: number } } = {};
    
    // Initialiser toutes les dates de la période
    const current = new Date(startDate);
    while (current <= now) {
      let key: string;
      
      if (dateFormat === 'day') {
        key = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
      } else if (dateFormat === 'week') {
        key = getWeekKey(current);
        current.setDate(current.getDate() + 7);
      } else {
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
      }
      
      chartData[key] = { revenue: 0, sales: 0 };
    }

    // Remplir avec les données réelles
    orders?.forEach(order => {
      const orderDate = new Date(order.created_at);
      let key: string;
      
      if (dateFormat === 'day') {
        key = orderDate.toISOString().split('T')[0];
      } else if (dateFormat === 'week') {
        key = getWeekKey(orderDate);
      } else {
        key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (chartData[key]) {
        chartData[key].revenue += order.amount;
        chartData[key].sales += 1;
      }
    });

    // Convertir en tableau trié
    const result = Object.entries(chartData)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        sales: data.sales
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erreur lors du chargement du graphique:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

function getWeekKey(date: Date): string {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lundi
  startOfWeek.setDate(diff);
  return startOfWeek.toISOString().split('T')[0];
}
