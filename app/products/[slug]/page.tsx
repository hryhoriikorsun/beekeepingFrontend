import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductPurchase } from '@/components/product-purchase';
import { PageNav, ProductPhoto } from '@/components/ui';
import { fetchProduct, fetchProductsSafe } from '@/lib/api/server';

interface Props {
  params: Promise<{ slug: string }>;
}

/// Pre-rendered at build time and revalidated: the catalogue is the only
/// free traffic channel this shop has, so its pages must be static and fast.
export async function generateStaticParams() {
  // An empty list is not a failure: pages are then generated on first request
  // and cached from there. A flaky API must not cost a deploy.
  const products = await fetchProductsSafe();
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) {
    return { title: 'Товар не знайдено' };
  }

  const description =
    product.description ?? `${product.title} з власної пасіки. Доставка Новою поштою.`;

  return {
    title: product.title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.title, description, type: 'website' },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <article>
      <PageNav current={product.title} />

      <div className="split-grid">
        <div className="relative">
          <div className="detail-blob" />

          <div className="relative z-1 mb-4">
            <ProductPhoto
              title={product.title}
              src={product.imageUrl}
              sizes="(max-width: 581px) 100vw, (max-width: 1080px) 50vw, 510px"
              eager
              size={96}
            />
          </div>

          <div className="relative z-1">
            <div className="kicker">З власної пасіки</div>
            <h1 className="mt-1 mb-2">{product.title}</h1>
            {product.description && (
              <p className="max-w-[55ch] text-neutral-700">{product.description}</p>
            )}
            <p className="mt-3">
              {product.stock > 0 ? (
                <span className="tag tag-accent-2">
                  В наявності: {product.stock} {product.unit}
                </span>
              ) : (
                <span className="tag tag-neutral">Наразі немає в наявності</span>
              )}
            </p>
          </div>
        </div>

        {/* Server-rendered price is the retail one, which is what a crawler and
            a first-time visitor should see. The island below re-asks the API
            with the visitor's token and quantity. */}
        <ProductPurchase initial={product} />
      </div>
    </article>
  );
}
