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

/// The API has no images yet. The frame keeps the 4:3 slot the design asks
/// for, so real photos drop in later without touching any layout.
export function ProductPhoto({ title, size = 64 }: { title: string; size?: number }) {
  return (
    <div className="photo-frame washed" role="img" aria-label={`Фото: ${title}`}>
      <HiveIcon size={size} />
    </div>
  );
}
