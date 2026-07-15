import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generarSiguienteCodigo } from '@/lib/productCode';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Faltan variables de entorno de Supabase');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function regenerarCodigo(supabaseAdmin: SupabaseClient, moduloId: string, subcategoriaId?: string | null): Promise<string> {
  const { data: modulo } = await supabaseAdmin
    .from('modulos')
    .select('prefijo_codigo')
    .eq('id', moduloId)
    .single();

  if (!modulo) throw new Error('Módulo no encontrado');

  let prefijo = modulo.prefijo_codigo;

  if (subcategoriaId) {
    const { data: subcategoria } = await supabaseAdmin
      .from('subcategorias')
      .select('prefijo_codigo')
      .eq('id', subcategoriaId)
      .single();

    if (subcategoria?.prefijo_codigo) {
      prefijo = prefijo + subcategoria.prefijo_codigo;
    }
  }

  const { data: existentes } = await supabaseAdmin
    .from('productos')
    .select('codigo')
    .like('codigo', `${prefijo}%`);

  const codigos = (existentes || []).map(p => p.codigo);
  return generarSiguienteCodigo(codigos, prefijo);
}

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const filterAgotados = searchParams.get('agotados') === 'true';
    const filterModulo = searchParams.get('modulo') || '';
    const filterSubcategoria = searchParams.get('subcategoria') || '';

    // Búsqueda por ID específico
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('productos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      return NextResponse.json({ producto: data });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('productos')
      .select('*', { count: 'exact' })
      .order('modulo_id', { ascending: true })
      .order('codigo', { ascending: true })
      .range(from, to);

    if (filterAgotados) {
      query = query.eq('stock', 0);
    }
    if (filterModulo) {
      query = query.eq('modulo_id', filterModulo);
    }
    if (filterSubcategoria) {
      query = query.eq('subcategoria_id', filterSubcategoria);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ productos: data, total: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    
    // Detectar si es bulk insert (array) o insert individual (object)
    const isBulk = Array.isArray(body);
    
    if (isBulk) {
      // Bulk insert para importación CSV
      const { data, error } = await supabaseAdmin
        .from('productos')
        .insert(body)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, productos: data, count: data?.length || 0 });
    } else {
      // Insert individual, con reintento ante colisión de código único (23505)
      const maxIntentos = 5;
      let intento = 0;
      let datosInsert = { ...body };

      while (intento < maxIntentos) {
        const { data, error } = await supabaseAdmin
          .from('productos')
          .insert(datosInsert)
          .select()
          .single();

        if (!error) {
          return NextResponse.json({ success: true, producto: data });
        }

        if (error.code === '23505' && intento < maxIntentos - 1) {
          const nuevoCodigo = await regenerarCodigo(supabaseAdmin, datosInsert.modulo_id, datosInsert.subcategoria_id);
          datosInsert = { ...datosInsert, codigo: nuevoCodigo };
          intento++;
          continue;
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ error: 'No se pudo generar un código único' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id, ...data } = await request.json();

    const { error } = await supabaseAdmin
      .from('productos')
      .update(data)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}