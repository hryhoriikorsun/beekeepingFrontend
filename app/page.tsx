import Link from 'next/link';
import { fetchProductsSafe } from '@/lib/api/server';
import { formatMoney } from '@/lib/format';
import { ProductPhoto } from '@/components/ui';

export default async function CataloguePage() {
  const products = await fetchProductsSafe();

  return (
    <>
      <section className="hero-band">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="relative max-w-[56ch]">
          <span className="tag tag-outline mb-3 inline-flex">Прямо з пасіки</span>
          <h1 className="my-2">Мед з власної пасіки</h1>
          <p className="m-0 opacity-90">
            Свіжий урожай, доставка Новою поштою. Для гуртових покупців діють окремі ціни —
            вони показуються після входу.
          </p>
        </div>
      </section>

      {products.length === 0 ? (
        <div className="card elev-sm text-center">
          <p className="text-neutral-700">Наразі товарів немає. Завітайте трохи пізніше.</p>
        </div>
      ) : (
        <ul className="pasika-grid">
          {products.map((product) => (
            <li key={product.id} className="flex">
              <Link href={`/products/${product.slug}`} className="card elev-sm product-card">
                <ProductPhoto title={product.title} />

                <div className="kicker">З власної пасіки</div>
                <h2 className="card-title">{product.title}</h2>
                {product.description && (
                  <p className="card-body m-0 line-clamp-2">{product.description}</p>
                )}

                <div className="mt-auto flex flex-col items-start gap-2 pt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="price-tag text-2xl">{formatMoney(product.unitPrice)}</span>
                    <span className="text-[13px] text-neutral-600">/ {product.unit}</span>
                  </div>

                  {product.stock > 0 ? (
                    <span className="tag tag-accent-2">
                      В наявності: {product.stock} {product.unit}
                    </span>
                  ) : (
                    <span className="tag tag-neutral">Немає в наявності</span>
                  )}

                  {product.nextTierAtQty && (
                    <span className="tag tag-accent">
                      Дешевше від {product.nextTierAtQty} {product.unit}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
