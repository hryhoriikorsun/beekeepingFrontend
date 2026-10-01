import type { CSSProperties } from 'react';
import Link from 'next/link';
import { fetchProductsSafe } from '@/lib/api/server';
import { formatMoney } from '@/lib/format';
import { ProductPhoto } from '@/components/ui';
import { HomeHero, ScrollDownLink } from '@/components/home-hero';
import { ArrowRightIcon, HiveIcon, TagIcon, TruckIcon } from '@/components/icons';

export default async function CataloguePage() {
  const products = await fetchProductsSafe();

  return (
    <>
      <HomeHero>
        <span className="tag tag-outline">Свіжий урожай</span>
        <h1 className="hero-title">Літо в кожній ложці</h1>
        <p className="hero-lead">Мед, стільники та воскові свічки — від вулика до вашого столу.</p>
        <ul className="hero-facts">
          <li>
            <HiveIcon size={16} />
            Власна пасіка
          </li>
          <li>
            <TruckIcon />
            Доставка Новою поштою
          </li>
          <li>
            <TagIcon />
            Гуртом — дешевше
          </li>
        </ul>
        <ScrollDownLink targetId="catalogue">Обрати мед</ScrollDownLink>
      </HomeHero>

      <section id="catalogue" tabIndex={-1} aria-labelledby="catalogue-title" className="catalogue">
        <div className="page-head">
          <h2 id="catalogue-title" className="m-0">
            Що є на пасіці
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="card elev-sm text-center">
            <p className="text-neutral-700">Наразі товарів немає. Завітайте трохи пізніше.</p>
          </div>
        ) : (
          <ul className="pasika-grid">
            {products.map((product, index) => (
              <li key={product.id} className="flex">
                {/* --i staggers the greeting the hero's button sets off. */}
                <Link
                  href={`/products/${product.slug}`}
                  className="card elev-sm product-card"
                  style={{ '--i': index } as CSSProperties}
                >
                  {/* sizes follows .pasika-grid: one column on a phone, two on
                      a tablet, three of ~340px at the 1080px page width. */}
                  <ProductPhoto
                    title={product.title}
                    src={product.imageUrl}
                    sizes="(max-width: 572px) 100vw, (max-width: 850px) 50vw, 340px"
                  />

                  <div className="kicker">З власної пасіки</div>
                  <h3 className="card-title">{product.title}</h3>
                  {product.description && (
                    <p className="card-body m-0 line-clamp-2">{product.description}</p>
                  )}

                  <div className="mt-auto flex flex-col items-start gap-2 pt-2">
                    <div className="flex items-baseline gap-1.5 self-stretch">
                      <span className="price-tag text-2xl">{formatMoney(product.unitPrice)}</span>
                      <span className="text-[13px] text-neutral-600">/ {product.unit}</span>
                      {/* The whole card is the link already; this only says so. */}
                      <span className="card-more" aria-hidden="true">
                        Детальніше
                        <ArrowRightIcon />
                      </span>
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
      </section>
    </>
  );
}
