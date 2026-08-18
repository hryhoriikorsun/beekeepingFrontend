import Link from 'next/link';
import { fetchProductsSafe } from '@/lib/api/server';
import { formatMoney } from '@/lib/format';

export default async function CataloguePage() {
  const products = await fetchProductsSafe();

  return (
    <>
      <section className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Мед з власної пасіки</h1>
        <p className="mt-2 max-w-prose text-stone-600">
          Свіжий урожай, доставка Новою поштою. Для гуртових покупців діють окремі ціни —
          вони показуються після входу.
        </p>
      </section>

      {products.length === 0 ? (
        <p className="text-stone-600">Наразі товарів немає. Завітайте трохи пізніше.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                className="flex h-full flex-col rounded-xl border border-amber-200 bg-white p-5 transition hover:border-amber-400 hover:shadow-sm"
              >
                <h2 className="text-lg font-medium">{product.title}</h2>
                {product.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">{product.description}</p>
                )}

                <div className="mt-auto pt-4">
                  <p className="text-xl font-semibold">
                    {formatMoney(product.unitPrice)}
                    <span className="text-sm font-normal text-stone-500"> / {product.unit}</span>
                  </p>

                  {product.nextTierAtQty && (
                    <p className="mt-1 text-sm text-amber-700">
                      Дешевше від {product.nextTierAtQty} {product.unit}
                    </p>
                  )}

                  <p className="mt-1 text-sm text-stone-500">
                    {product.stock > 0 ? `В наявності: ${product.stock} ${product.unit}` : 'Немає в наявності'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
