import Image from 'next/image';
import { HiveIcon } from '../icons';
import { PRODUCT_IMAGES } from '@/lib/product-images';

/// Thumbnails instead of a path to type: a typo would only surface as a broken
/// photo on the live storefront. An empty value means "no photo".
export function ImagePicker({
  name,
  defaultValue = null,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  // A path set straight through the API stays selectable, so saving the form
  // never drops a photo the list does not know about.
  const options =
    defaultValue && !PRODUCT_IMAGES.some((image) => image.src === defaultValue)
      ? [...PRODUCT_IMAGES, { src: defaultValue, label: defaultValue }]
      : PRODUCT_IMAGES;

  return (
    <fieldset className="sm:col-span-2">
      <legend className="text-sm font-medium">Фото</legend>
      <div className="image-picker mt-1">
        <label className="image-choice">
          <input
            type="radio"
            name={name}
            value=""
            defaultChecked={!defaultValue}
            className="sr-only"
          />
          <span className="photo-frame">
            <HiveIcon size={28} />
          </span>
          Без фото
        </label>
        {options.map((image) => (
          <label key={image.src} className="image-choice">
            <input
              type="radio"
              name={name}
              value={image.src}
              defaultChecked={image.src === defaultValue}
              className="sr-only"
            />
            <span className="photo-frame">
              <Image src={image.src} alt="" fill sizes="160px" />
            </span>
            {image.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
