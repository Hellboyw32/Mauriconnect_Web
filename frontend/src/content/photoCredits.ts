/*
  Car photos from Wikimedia Commons, used under their free licences.
  Modified for this site: background removed, number plates blanked, resized.
  Modified versions of CC BY-SA photos are shared under the same licence.
  Credits are shown on the /credits page, as the licences require. Replace with your own photos at any time.
*/
export interface PhotoCredit {
  file: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  source: string;
}

export const photoCredits: PhotoCredit[] = [
  {
    file: "/cars/suzuki-s-presso.webp",
    title: "Suzuki S-presso 1.0 GLX 2020 (49848495562).jpg",
    author: "RL GNZLZ from Chile",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Suzuki_S-presso_1.0_GLX_2020_(49848495562).jpg"
  },
  {
    file: "/cars/hyundai-grand-i10.webp",
    title: "Hyundai Grand i10 1.2 Front.jpg",
    author: "Areaseven",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:Hyundai_Grand_i10_1.2_Front.jpg"
  },
  {
    file: "/cars/nissan-march.webp",
    title: "‘22 Nissan March — Front.jpg",
    author: "Bull-Doser",
    license: "Public domain",
    licenseUrl: null,
    source: "https://commons.wikimedia.org/wiki/File:%E2%80%9822_Nissan_March_%E2%80%94_Front.jpg"
  },
  {
    file: "/cars/toyota-vitz.webp",
    title: "Toyota Vitz GR SPORT (DBA-NCP131-AHXVK) & 1.3F (DBA-NSP130-AHXNB) front.jpg",
    author: "Tokumeigakarinoaoshima",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Toyota_Vitz_GR_SPORT_(DBA-NCP131-AHXVK)_%26_1.3F_(DBA-NSP130-AHXNB)_front.jpg"
  },
  {
    file: "/cars/suzuki-swift.webp",
    title: "2018 Suzuki Swift SZ5 Boosterjet SHVS 1.0 Front.jpg",
    author: "Vauxford",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:2018_Suzuki_Swift_SZ5_Boosterjet_SHVS_1.0_Front.jpg"
  },
  {
    file: "/cars/hyundai-accent.webp",
    title: "2018 Hyundai Accent 1.6L front 7.28.18.jpg",
    author: "Kevauto",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:2018_Hyundai_Accent_1.6L_front_7.28.18.jpg"
  },
  {
    file: "/cars/nissan-almera.webp",
    title: "2020 Nissan Almera 1.2L MT in Alpine White, front left.jpg",
    author: "Ethan Llamas",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:2020_Nissan_Almera_1.2L_MT_in_Alpine_White,_front_left.jpg"
  },
  {
    file: "/cars/suzuki-ciaz.webp",
    title: "Suzuki Ciaz.jpg",
    author: "Jason Lawrence from New York",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Suzuki_Ciaz.jpg"
  },
  {
    file: "/cars/suzuki-ertiga.webp",
    title: "2019 Suzuki Ertiga GX (Indonesia) front view.jpg",
    author: "Andra Febrian",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:2019_Suzuki_Ertiga_GX_(Indonesia)_front_view.jpg"
  },
  {
    file: "/cars/toyota-rush.webp",
    title: "2024 Toyota Rush GR Sport (Indonesia) front view.jpg",
    author: "Andra Febrian",
    license: "CC0",
    licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    source: "https://commons.wikimedia.org/wiki/File:2024_Toyota_Rush_GR_Sport_(Indonesia)_front_view.jpg"
  },
  {
    file: "/cars/hyundai-creta.webp",
    title: "2021 Hyundai Creta 1.5 Trend (SU2id, Indonesia) front view 01.jpg",
    author: "Andra Febrian",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:2021_Hyundai_Creta_1.5_Trend_(SU2id,_Indonesia)_front_view_01.jpg"
  }
];
