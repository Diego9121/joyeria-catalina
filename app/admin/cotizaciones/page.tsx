'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Cotizacion, CotizacionProducto, Modulo, Subcategoria } from '@/lib/supabase';
import { formatCurrency, WHATSAPP_ADMIN } from '@/lib/constants';
import { AdminProtected } from '@/components/admin-protected';

interface ProductoStock {
  id: string;
  codigo: string;
  nombre: string;
  stock: number;
}

export default function CotizacionesAdmin() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [productosStock, setProductosStock] = useState<ProductoStock[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [cotizacionesRes, productosRes, modulosRes, subcategoriasRes] = await Promise.all([
      supabase.from('cotizaciones').select('*').order('created_at', { ascending: false }),
      supabase.from('productos').select('id, codigo, nombre, stock'),
      fetch('/api/admin/modulos?tipo=modulos').then(r => r.json()),
      fetch('/api/admin/modulos?tipo=subcategorias').then(r => r.json()),
    ]);

    if (cotizacionesRes.data) setCotizaciones(cotizacionesRes.data);
    if (productosRes.data) setProductosStock(productosRes.data);
    if (modulosRes.data) setModulos(modulosRes.data);
    if (subcategoriasRes.data) setSubcategorias(subcategoriasRes.data);
    setLoading(false);
  }

  const agruparPorModulo = (productos: CotizacionProducto[]) => {
    const grupos: { key: string; encabezado: string; productos: CotizacionProducto[]; subtotal: number }[] = [];
    const indices: Record<string, number> = {};

    for (const prod of productos) {
      const key = `${prod.modulo_id || ''}__${prod.subcategoria_id || ''}`;

      if (indices[key] === undefined) {
        const modulo = modulos.find(m => m.id === prod.modulo_id);
        const subcategoria = subcategorias.find(s => s.id === prod.subcategoria_id);
        const encabezado = modulo
          ? (subcategoria ? `${modulo.nombre} (${subcategoria.nombre})` : modulo.nombre)
          : 'Sin módulo';

        indices[key] = grupos.length;
        grupos.push({ key, encabezado, productos: [], subtotal: 0 });
      }

      const grupo = grupos[indices[key]];
      grupo.productos.push(prod);
      grupo.subtotal += prod.precio * prod.cantidad;
    }

    return grupos;
  };

  const filteredCotizaciones = cotizaciones.filter(c => {
    const matchesEstado = !filterEstado || c.estado === filterEstado;
    const matchesSearch = c.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.cliente_celular.includes(searchTerm);
    return matchesEstado && matchesSearch;
  });

  const getStockProducto = (productoId: string): number => {
    const producto = productosStock.find(p => p.id === productoId);
    return producto?.stock || 0;
  };

  const tieneStockInsuficiente = (productos: CotizacionProducto[]): boolean => {
    return productos.some(p => p.cantidad > getStockProducto(p.producto_id));
  };

  const updateEstado = async (id: string, nuevoEstado: string) => {
    const cotizacion = cotizaciones.find(c => c.id === id);
    if (!cotizacion) return;

    if (nuevoEstado === 'RECHAZADO') {
      const productoIds = cotizacion.productos.map(p => p.producto_id);
      const { data: productosActuales } = await supabase
        .from('productos')
        .select('id, stock')
        .in('id', productoIds);

      const stockPorId = new Map((productosActuales || []).map(p => [p.id, p.stock]));

      await Promise.all(
        cotizacion.productos
          .filter(prod => stockPorId.has(prod.producto_id))
          .map(prod =>
            supabase
              .from('productos')
              .update({ stock: (stockPorId.get(prod.producto_id) || 0) + prod.cantidad })
              .eq('id', prod.producto_id)
          )
      );
    }

    await supabase
      .from('cotizaciones')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', id);

    const { data: productosData } = await supabase.from('productos').select('id, codigo, nombre, stock');
    if (productosData) setProductosStock(productosData);
    loadData();
  };

  const deleteCotizacion = async (id: string) => {
    if (!confirm('¿Eliminar esta cotización?')) return;

    await supabase.from('cotizaciones').delete().eq('id', id);
    
    const { data: productosData } = await supabase.from('productos').select('id, codigo, nombre, stock');
    if (productosData) setProductosStock(productosData);
    loadData();
  };

  const getTotal = (productos: CotizacionProducto[]) => {
    return productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const contactByWhatsApp = (celular: string) => {
    const link = document.createElement('a');
    link.href = `https://wa.me/${celular.replace(/\s/g, '')}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="min-h-screen bg-rosado flex items-center justify-center text-xl text-vino">Cargando...</div>;
  }

  return (
    <AdminProtected>
      <div className="min-h-screen bg-rosado">
      <header className="bg-gradient-to-r from-vino to-vino-dark text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">Cotizaciones en Curso</h1>
          <div className="flex gap-2">
            <Link href="/admin/dashboard" className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition text-sm">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg px-4 py-2 flex-1 min-w-[200px]"
          />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            
            <option value="APROBADO">Aprobado</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredCotizaciones.map(cotizacion => {
            const productos = cotizacion.productos;
            const total = getTotal(productos);
            const stockInsuficiente = tieneStockInsuficiente(productos);
            const estadoBadgeColor = cotizacion.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' :
                                   cotizacion.estado === 'APROBADO' ? 'bg-green-100 text-green-700' :
                                   'bg-red-100 text-red-700';

            return (
              <div key={cotizacion.id} className={`bg-white rounded-xl shadow-md overflow-hidden ${stockInsuficiente && cotizacion.estado === 'PENDIENTE' ? 'ring-2 ring-red-400' : ''}`}>
                <div className="bg-gray-50 p-4 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-negro">{cotizacion.cliente_nombre}</h3>
                    <p className="text-gray-600">{cotizacion.cliente_celular}</p>
                    <p className="text-sm text-gray-500">
                      {cotizacion.cliente_departamento} - {cotizacion.cliente_provincia}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${estadoBadgeColor}`}>
                      {cotizacion.estado}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(cotizacion.created_at)}</p>
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="font-semibold text-negro mb-3">Productos:</h4>
                  <div className="space-y-4">
                    {agruparPorModulo(productos).map((grupo) => (
                      <div key={grupo.key}>
                        <h5 className="text-sm font-semibold text-cafe-medio mb-2">{grupo.encabezado}</h5>
                        <div className="space-y-2">
                          {grupo.productos.map((prod, idx) => {
                            const stockDisp = getStockProducto(prod.producto_id);
                            const sinStock = prod.cantidad > stockDisp;
                            return (
                              <div key={idx} className={`flex justify-between items-center border-b border-gray-100 pb-2 ${sinStock ? 'bg-red-50 px-2 py-1 rounded' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-vino">{prod.codigo}</span>
                                  <span className="text-gray-600">{prod.nombre}</span>
                                  {sinStock && (
                                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                      Stock: {stockDisp}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="text-sm text-gray-500">x{prod.cantidad}</span>
                                  <span className="ml-4 font-semibold">{formatCurrency(prod.precio * prod.cantidad)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-right text-sm text-gray-500 mt-1">
                          ▸ Subtotal {grupo.encabezado}: {formatCurrency(grupo.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t-2 border-vino flex justify-between items-center">
                    <span className="text-lg font-bold text-negro">Total:</span>
                    <span className="text-2xl font-bold text-vino">{formatCurrency(total)}</span>
                  </div>

                  {cotizacion.cliente_notas && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{cotizacion.cliente_notas}</span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-3 sm:p-4">
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:gap-2 sm:justify-end">
                    <button
                      onClick={() => contactByWhatsApp(cotizacion.cliente_celular)}
                      className="bg-green-500 text-white px-2 py-2 rounded-lg hover:bg-green-600 transition text-xs sm:text-sm sm:px-4 sm:py-2 text-center"
                    >
                      Contactar
                    </button>
                    
                    {cotizacion.estado === 'PENDIENTE' && (
                      <>
                        <button
                          onClick={() => updateEstado(cotizacion.id, 'APROBADO')}
                          className="bg-green-500 text-white px-2 py-2 rounded-lg hover:bg-green-600 transition text-xs sm:text-sm sm:px-4 sm:py-2 text-center"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => updateEstado(cotizacion.id, 'RECHAZADO')}
                          className="bg-red-500 text-white px-2 py-2 rounded-lg hover:bg-red-600 transition text-xs sm:text-sm sm:px-4 sm:py-2 text-center"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {(cotizacion.estado === 'APROBADO' || cotizacion.estado === 'RECHAZADO') && (
                      <button
                        onClick={() => deleteCotizacion(cotizacion.id)}
                        className="border border-red-500 text-red-500 bg-white px-2 py-2 rounded-lg hover:bg-red-50 transition text-xs sm:text-sm sm:px-4 sm:py-2 text-center"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCotizaciones.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay cotizaciones que mostrar
            </div>
          )}
        </div>
      </main>
    </div>
    </AdminProtected>
  );
}
