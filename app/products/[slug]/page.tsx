import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductPurchase } from '@/components/product-purchase';
import { fetchProduct, fetchProducts } from '@/lib/api/server';

interface Props {
  params: Promise<{ slug: string }>;
}

/// Pre-rendered at build time and revalidated: the catalogue is the only
/// free traffic channel this shop has, so its pages must be static and fast.
export async function generateStaticParams() {
  const products = await fetchProducts();
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
    <article className="grid gap-8 md:grid-cols-2">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{product.title}</h1>
        {product.description && <p className="mt-3 text-stone-600">{product.description}</p>}
        <p className="mt-4 text-sm text-stone-500">
          {product.stock > 0
            ? `В наявності: ${product.stock} ${product.unit}`
            : 'Наразі немає в наявності'}
        </p>
      </div>

      {/* Server-rendered price is the retail one, which is what a crawler and
          a first-time visitor should see. The island below re-asks the API
          with the visitor's token and quantity. */}
      <ProductPurchase initial={product} />
    </article>
  );
}
