'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, Producto, Modulo, Subcategoria } from '@/lib/supabase';
import { formatCurrency, WHATSAPP_ADMIN, DEPARTAMENTOS_BOLIVIA } from '@/lib/constants';
import { useCart } from '@/components/cart-context';
import { Button } from '@/components/ui/button';

const DEV_WHATSAPP = '59169710825';

function DevCredit() {
  return (
    <div className="mt-8 w-full max-w-xs">
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Sistema desarrollado por:</p>
        <img src="/logoCipherMoon.png" alt="CipherMoon" className="h-24 w-auto mx-auto mb-4 object-contain" />
        <Button
          size="lg"
          className="bg-green-500 hover:bg-green-600 text-white gap-2 px-6"
          render={
            <a href={`https://wa.me/${DEV_WHATSAPP}`} target="_blank" rel="noopener noreferrer" />
          }
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          Contactar
        </Button>
      </div>
    </div>
  );
}

export default function CarritoPage() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart, totalItems } = useCart();
  const [productos, setProductos] = useState<(Producto & { cantidad?: number; modulo_nombre?: string; subcategoria_nombre?: string })[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    celular: '',
    departamento: '',
    provincia: '',
    notas: '',
  });

  useEffect(() => {
    loadProductos();
  }, [items.length]);

  async function loadProductos() {
    if (items.length === 0) {
      setProductos([]);
      setModulos([]);
      setSubcategorias([]);
      setLoading(false);
      return;
    }

    const productoIds = items.map(item => item.productoId);
    
    const productosRes = await supabase
      .from('productos')
      .select('*')
      .in('id', productoIds)
      .eq('activo', true);

    if (!productosRes.data || productosRes.data.length === 0) {
      setLoading(false);
      return;
    }

    const moduloIds = [...new Set(productosRes.data.map(p => p.modulo_id))];
    const subcategoriaIds = [...new Set(
      productosRes.data
        .filter(p => p.subcategoria_id)
        .map(p => p.subcategoria_id as string)
    )];

    const [modulosRes, subcategoriasRes] = await Promise.all([
      supabase.from('modulos').select('*').in('id', moduloIds),
      subcategoriaIds.length > 0
        ? supabase.from('subcategorias').select('*').in('id', subcategoriaIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (modulosRes.data && subcategoriasRes.data) {
      const productosConCantidad = productosRes.data.map(p => {
        const item = items.find(i => i.productoId === p.id);
        const cantidadOriginal = item?.cantidad || 0;
        const cantidadAjustada = Math.min(cantidadOriginal, p.stock);
        
        if (cantidadAjustada < cantidadOriginal) {
          updateQuantity(p.id, cantidadAjustada);
        }
        
        const modulo = modulosRes.data.find(m => m.id === p.modulo_id);
        const subcategoria = subcategoriasRes.data.find(s => s.id === p.subcategoria_id);
        
        return { 
          ...p, 
          cantidad: cantidadAjustada,
          modulo_nombre: modulo?.nombre || '',
          subcategoria_nombre: subcategoria?.nombre || '',
        };
      });
      setProductos(productosConCantidad);
      setModulos(modulosRes.data);
      setSubcategorias(subcategoriasRes.data);
    }
    setLoading(false);
  }

  const updateItemQuantity = (productId: string, delta: number) => {
    const item = items.find(i => i.productoId === productId);
    if (item) {
      updateQuantity(productId, item.cantidad + delta);
    }
  };

  function roundToTwoDecimals(value: number): number {
      return Math.round(value * 100) / 100;
    }

    function roundTotalGeneral(total: number): number {
      const cents = Math.round((total * 100) % 100);
      const validCents = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
      
      let rounded: number;
      
      if (validCents.includes(cents)) {
        rounded = total;
      } else {
        rounded = Math.ceil(total * 10) / 10;
      }
      
      return roundToTwoDecimals(rounded);
    }

    const getSubtotal = () => {
      const total = productos.reduce((sum, p) => {
        const cantidad = items.find(i => i.productoId === p.id)?.cantidad || 0;
        const precio = p.precio_descuento || p.precio;
        const subtotal = roundToTwoDecimals(precio * cantidad);
        return sum + subtotal;
      }, 0);
      return roundToTwoDecimals(total);
    };

    const getTotalOriginal = () => {
      return productos.reduce((sum, p) => {
        const cantidad = items.find(i => i.productoId === p.id)?.cantidad || 0;
        const precio = p.precio_descuento || p.precio;
        return sum + (precio * cantidad);
      }, 0);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Abrir la ventana en blanco ANTES de cualquier await, para que el navegador
    // lo reconozca como resultado directo del click y no lo bloquee como popup.
    const ventanaWhatsapp = window.open('', '_blank');

    setSubmitting(true);

    const productosCotizacion = productos.map(p => ({
      producto_id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      precio: p.precio_descuento || p.precio,
      cantidad: items.find(i => i.productoId === p.id)?.cantidad || 0,
      modulo_id: p.modulo_id,
      subcategoria_id: p.subcategoria_id,
    }));

    const productoIds = productosCotizacion.map(p => p.producto_id);
    const { data: stockActual } = await supabase
      .from('productos')
      .select('id, stock')
      .in('id', productoIds);

    const stockPorId = new Map((stockActual || []).map(p => [p.id, p.stock]));

    for (const prod of productosCotizacion) {
      const stockDisponible = stockPorId.get(prod.producto_id);
      if (stockDisponible === undefined || stockDisponible < prod.cantidad) {
        ventanaWhatsapp?.close();
        alert(`Stock insuficiente para ${prod.codigo}. Stock disponible: ${stockDisponible || 0}`);
        setSubmitting(false);
        return;
      }
    }

    await Promise.all(
      productosCotizacion.map(prod =>
        supabase
          .from('productos')
          .update({ stock: (stockPorId.get(prod.producto_id) || 0) - prod.cantidad })
          .eq('id', prod.producto_id)
      )
    );

    const { error } = await supabase.from('cotizaciones').insert({
      cliente_nombre: formData.nombre,
      cliente_celular: formData.celular,
      cliente_departamento: formData.departamento,
      cliente_provincia: formData.provincia,
      cliente_notas: formData.notas,
      productos: productosCotizacion,
      estado: 'PENDIENTE',
    });

    if (error) {
      ventanaWhatsapp?.close();
      alert('Error al guardar cotización');
      setSubmitting(false);
      return;
    }

    const total = getSubtotal();
    const totalOriginal = getTotalOriginal();
    
    const groupedByModulo = productos.reduce((acc, p) => {
      const moduloKey = p.modulo_id;
      if (!acc[moduloKey]) {
        acc[moduloKey] = {
          nombre: p.modulo_nombre || 'Sin módulo',
          productos: [],
          subtotal: 0,
        };
      }
      const cantidad = items.find(i => i.productoId === p.id)?.cantidad || 0;
      const precio = p.precio_descuento || p.precio;
      const subtotalProducto = roundToTwoDecimals(precio * cantidad);
      acc[moduloKey].productos.push({
        codigo: p.codigo,
        cantidad,
        subtotal: subtotalProducto,
        subcategoria: p.subcategoria_nombre || 'Sin subcategoría',
      });
      acc[moduloKey].subtotal += subtotalProducto;
      return acc;
    }, {} as Record<string, { nombre: string; productos: { codigo: string; cantidad: number; subtotal: number; subcategoria: string }[]; subtotal: number }>);

    const totalRounded = roundTotalGeneral(totalOriginal);

    const formatPrecio = (precio: number) => `${precio.toFixed(2)} Bs`;

    let mensajeTexto = `━━━━━━━━━━━━━━━━
 JOYERÍA CATALINA - COTIZACIÓN
━━━━━━━━━━━━━━━━
 DATOS DEL CLIENTE
━━━━━━━━━━━━━━━━
 Nombre:    ${formData.nombre}
 Celular:   ${formData.celular}
 Ubicación: ${formData.departamento} - ${formData.provincia}
 Notas:     
━━━━━━━━━━━━━━━━
 PRODUCTOS
━━━━━━━━━━━━━━━━`;

    Object.values(groupedByModulo).forEach((modulo) => {
      const subcatText = modulo.productos.length > 0 && modulo.productos[0].subcategoria !== 'Sin subcategoría' 
        ? ` (${modulo.productos[0].subcategoria})` 
        : '';
      mensajeTexto += `\n📿 ${modulo.nombre.toUpperCase()}${subcatText}`;
      modulo.productos.forEach(p => {
        mensajeTexto += `\n     ${p.codigo}    x${p.cantidad}    ${formatPrecio(p.subtotal)}`;
      });
      mensajeTexto += `\n     ▸ Subtotal: ${formatPrecio(modulo.subtotal)}`;
    });

    mensajeTexto += `
━━━━━━━━━━━━━━━━
        💰 TOTAL: ${formatPrecio(totalRounded)}
━━━━━━━━━━━━━━━━
⏰ IMPORTANTE: Esta cotización tiene validez de 15 Minutos.
Después de este tiempo, los artículos vuelven a estar disponibles.
━━━━━━━━━━━━━━━━`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const UMBRAL_COTIZACION_EXTENSA = 40;
    const esCotizacionExtensa = productosCotizacion.length > UMBRAL_COTIZACION_EXTENSA;

    let whatsappUrl: string;
    let mensajeCopiado = false;

    if (esCotizacionExtensa) {
      try {
        await navigator.clipboard.writeText(mensajeTexto);
        mensajeCopiado = true;
      } catch {
        mensajeCopiado = false;
      }
    }

    if (mensajeCopiado) {
      whatsappUrl = isMobile
        ? `https://api.whatsapp.com/send?phone=${WHATSAPP_ADMIN}`
        : `https://wa.me/${WHATSAPP_ADMIN}`;
    } else {
      whatsappUrl = isMobile
        ? `https://api.whatsapp.com/send?phone=${WHATSAPP_ADMIN}&text=${encodeURIComponent(mensajeTexto)}`
        : `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(mensajeTexto)}`;
    }

    if (ventanaWhatsapp) {
      ventanaWhatsapp.location.href = whatsappUrl;
    } else {
      const link = document.createElement('a');
      link.href = whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    if (mensajeCopiado) {
      alert('La cotización es muy extensa: el mensaje se copió al portapapeles. Pégalo en el chat de WhatsApp que se abrió (mantén presionado el campo de texto y selecciona "Pegar").');
    }

    clearCart();
    setSubmitted(true);
  };

  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      const formElement = document.getElementById('form-cotizacion');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const provincias = formData.departamento
    ? DEPARTAMENTOS_BOLIVIA.find(d => d.nombre === formData.departamento)?.provincias || []
    : [];

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-negro">Cargando carrito...</div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-negro mb-3">¡Cotización Enviada!</h1>
        <p className="text-gray-500 mb-2 text-center">Tu mensaje se ha abierto en WhatsApp</p>
        <p className="text-gray-400 text-sm mb-8 text-center">Envía el mensaje para completar tu solicitud</p>
        <Link href="/" className="px-8 py-3 bg-vino text-white rounded-full font-semibold hover:bg-vino-dark transition">
          Volver al inicio
        </Link>

        <DevCredit />
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-negro mb-3">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8 text-center">Explora nuestras categorías para agregar productos</p>
        <Link href="/" className="px-8 py-3 bg-vino text-white rounded-full font-semibold hover:bg-vino-dark transition">
          Explorar categorías
        </Link>

        <DevCredit />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold uppercase rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Continuar Comprando</span>
          </Link>
          <span className="bg-vino text-white px-4 py-2 rounded-full font-semibold text-sm">
            {totalItems} producto{totalItems !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-negro">Carrito de Compras</h1>
          <button onClick={clearCart} className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors">
            Vaciar carrito
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {productos.map(producto => {
            const cantidad = items.find(i => i.productoId === producto.id)?.cantidad || 0;
            const precio = producto.precio_descuento || producto.precio;
            const subtotal = roundToTwoDecimals(precio * cantidad);

            return (
              <div key={producto.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <span className="text-negro font-semibold text-sm uppercase">{producto.modulo_nombre}{producto.subcategoria_nombre ? ` (${producto.subcategoria_nombre})` : ''}</span>
                  <span className="text-vino font-bold text-sm block mt-1">{producto.codigo}</span>
                  <div className="flex items-center gap-3 mt-2">
                    {producto.precio_descuento ? (
                      <>
                        <span className="text-gray-400 line-through text-sm">{formatCurrency(producto.precio)}</span>
                        <span className="text-vino font-bold">{formatCurrency(producto.precio_descuento)}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-negro">{formatCurrency(producto.precio)}</span>
                    )}
                    <span className="text-gray-400 text-sm">c/u</span>
                  </div>
                </div>
                <span className="font-bold text-xl text-negro">x{cantidad}</span>
                <div className="text-right min-w-[100px]">
                  <span className="text-xl font-bold text-negro">{formatCurrency(subtotal)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-negro">Total:</span>
            <span className="text-3xl font-bold text-negro">{formatCurrency(roundTotalGeneral(getTotalOriginal()))}</span>
          </div>
        </div>

        {!showForm ? (
          <button
            onClick={scrollToForm}
            disabled={productos.length === 0}
            className="w-full py-4 text-lg font-semibold rounded-xl transition shadow-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed bg-vino hover:bg-vino-dark text-white"
          >
            {productos.length === 0 ? 'Agrega productos al carrito' : 'Completar Cotización'}
          </button>
        ) : (
          <form id="form-cotizacion" onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-center">
                <span className="text-red-600 font-bold uppercase">IMPORTANTE:</span>
                <span className="text-black font-semibold uppercase"> (PARA ASEGURAR EL APARTADO DEBE REALIZAR UN ADELANTO MINIMO DE 50BS)</span>
              </p>
            </div>

            <h2 className="text-xl font-bold text-negro mb-6">Datos de Envío</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-negro mb-2">Nombre completo *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-vino focus:border-vino transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-negro mb-2">Celular (WhatsApp) *</label>
                <input
                  type="tel"
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-vino focus:border-vino transition"
                  placeholder="Ej: 71123456"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-negro mb-2">Departamento *</label>
                  <select
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-vino focus:border-vino transition"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {DEPARTAMENTOS_BOLIVIA.map(d => (
                      <option key={d.id} value={d.nombre}>{d.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-negro mb-2">Destino *</label>
                  <input
                    type="text"
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-vino focus:border-vino transition"
                    placeholder="Ej: Ciudad, Zona, Barrio..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-negro mb-2">Notas (opcional)</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 h-24 focus:ring-2 focus:ring-vino focus:border-vino transition"
                  placeholder="Indica la dirección exacta o cualquier otra indicación..."
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-white transition shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Cotización por WhatsApp'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-full border border-gray-200 py-3 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
