/// The photos that ship in public/images/products. The API stores only the
/// path of the one chosen for a product; this list is what the admin chooses
/// from, so a new file needs a line here to become pickable.
export const PRODUCT_IMAGES: readonly { src: string; label: string }[] = [
  { src: '/images/products/med-lypovyi.webp', label: 'Мед липовий' },
  { src: '/images/products/med-akatsiievyi.webp', label: 'Мед акацієвий' },
  { src: '/images/products/med-soniashnykovyi.webp', label: 'Мед соняшниковий' },
  { src: '/images/products/med-riznotravia.webp', label: 'Мед різнотрав’я' },
  { src: '/images/products/med-hrechanyi.webp', label: 'Мед гречаний' },
  { src: '/images/products/stilnyky-lypovi.webp', label: 'Стільники липові' },
  { src: '/images/products/stilnyky-soniashnykovi.webp', label: 'Стільники соняшникові' },
  { src: '/images/products/stilnyky-hrechani.webp', label: 'Стільники гречані' },
  { src: '/images/products/pylok-zolotystyi.webp', label: 'Пилок золотистий' },
  { src: '/images/products/pylok-riznokolorovyi.webp', label: 'Пилок різнокольоровий' },
  { src: '/images/products/svichka-tonka.webp', label: 'Свічка тонка' },
  { src: '/images/products/svichky-tonki-nabir.webp', label: 'Свічки тонкі, набір' },
  { src: '/images/products/svichka-kruchena.webp', label: 'Свічка кручена' },
  { src: '/images/products/svichka-kvadratna.webp', label: 'Свічка квадратна' },
  { src: '/images/products/svichka-yaitse-vizerunok.webp', label: 'Свічка-яйце з візерунком' },
  { src: '/images/products/svichka-yaitse-na-pidstavtsi.webp', label: 'Свічка-яйце на підставці' },
];
