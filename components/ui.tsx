import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeftIcon, HiveIcon } from './icons';

/// Breadcrumbs on the left, "back to catalogue" on the right - the same row
/// on every inner page, per the design handoff.
export function PageNav({ current }: { current: string }) {
  return (
    <div className="page-head">
      <div className="breadcrumbs">
        <Link href="/">Каталог</Link>
        <span>/</span>
        <span className="current">{current}</span>
      </div>
      <Link href="/" className="back-btn">
        <ArrowLeftIcon />
        До каталогу
      </Link>
    </div>
  );
}

/// The frame keeps the 4:3 slot the design asks for whether or not the
/// product has a photo, so adding or removing one never moves the layout.
export function ProductPhoto({
  title,
  src,
  sizes,
  eager = false,
  size = 64,
}: {
  title: string;
  src?: string | null;
  /// How wide the frame is drawn, so a phone is not sent the 1200px file.
  sizes: string;
  /// Above the fold the photo is what the visitor waits for; lazy loading
  /// would only hold it back.
  eager?: boolean;
  size?: number;
}) {
  if (!src) {
    return (
      <div className="photo-frame washed" role="img" aria-label={`Фото: ${title}`}>
        <HiveIcon size={size} />
      </div>
    );
  }

  return (
    <div className="photo-frame washed">
      <Image
        src={src}
        alt={`Фото: ${title}`}
        fill
        sizes={sizes}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
      />
    </div>
  );
}
