/*
  Business content. Source: mauriconnect.com (home, About Us, FAQs and rental terms pages),
  reviewed 2026-10-30. Keep in sync with backend/src/config/company.ts.
*/

export const company = {
  name: 'MauriConnect',
  fullName: 'MauriConnect Car Rental',
  legalName: 'Mauriconnect Ltd',
  founder: 'Mr. H. Greedhur',
  yearsInBusiness: 20,
  address: "L'escalier Road, Plaine Magnien, Mauritius",
  phone: '+230 5255 1144',
  phoneHref: 'tel:+23052551144',
  whatsappUrl: 'https://wa.me/23052551144',
  email: 'info@mauriconnect.com',
  officeHours: 'Monday to Saturday, 08:00 – 18:00',
  support: '24/7 support by phone and WhatsApp',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=L%27escalier+Road%2C+Plaine+Magnien%2C+Mauritius',
} as const;

export const features = [
  { icon: 'support', title: 'Outstanding service', text: 'We look after you from the moment you book until you hand back the keys.' },
  { icon: 'brands', title: 'Variety of brands', text: 'Well-kept cars from leading international brands, from city cars to seven-seaters.' },
  { icon: 'mileage', title: 'Unlimited mileage', text: 'Explore the whole island. There is no charge for the distance you drive.' },
  { icon: 'calendar', title: 'Flexible rental periods', text: 'From a few days to a long holiday or a long-term rental.' },
  { icon: 'delivery', title: 'Free delivery', text: 'We deliver and collect at the airport, your hotel, your home or another address on the island.' },
  { icon: 'clock', title: '24 hours support', text: 'Our team is on hand day and night by phone and WhatsApp.' },
] as const;

export interface Faq {
  question: string;
  answer: string;
}

export const faqGroups: { title: string; items: Faq[] }[] = [
  {
    title: 'Driving in Mauritius',
    items: [
      { question: 'What is the legal age to rent a car in Mauritius?', answer: 'Drivers must be at least 18 years old and have held a driving licence for at least one year.' },
      { question: 'Do I need an international driving licence?', answer: 'No. A valid driving licence from your home country is enough.' },
      { question: 'Which side of the road do we drive on?', answer: 'Traffic in Mauritius drives on the left, and cars have right-hand steering.' },
      { question: 'Is fuel expensive in Mauritius?', answer: 'Fuel prices are reasonable and set by the government, so every petrol station charges the same price.' },
      {
        question: 'Is it easy to park?',
        answer:
          'Free parking is common in small towns, at hypermarkets, tourist sites and public beaches. Some larger towns have paid street parking, using coupons sold at petrol stations.',
      },
    ],
  },
  {
    title: 'Reservation',
    items: [
      { question: 'Do I have to make a reservation?', answer: 'We recommend it: cars can be hard to find in peak season. Book online in a few minutes to secure your car.' },
      {
        question: 'What is the minimum rental duration?',
        answer: 'The minimum rental is three days. For a shorter rental, send us a quote request and we will do our best depending on availability.',
      },
      {
        question: 'Where is the car provided?',
        answer: 'We can deliver the car to the airport, your hotel or any address on the island. Just tell us the address when you book.',
      },
    ],
  },
  {
    title: 'Payment',
    items: [
      {
        question: 'How do I pay for my rental?',
        answer:
          'Online bookings are paid securely with PayPal, using a PayPal account or a debit or credit card. If you would prefer another method, contact us and we will arrange it.',
      },
      { question: 'Do I have to pay a deposit?', answer: 'Yes. A security deposit is taken when you collect the car. The amount depends on the car and the insurance option you choose.' },
    ],
  },
];

/** Rental terms published on mauriconnect.com/terms-conditions-rental/. */
export const rentalTerms: { title: string; points: string[] }[] = [
  {
    title: 'Authorised drivers',
    points: [
      'Only authorised drivers whose names are on the rental contract are covered by the insurance.',
      'The insurance does not cover driving after drinking alcohol. The renter is responsible for all costs arising from it.',
    ],
  },
  {
    title: 'Fuel',
    points: [
      'The renter must use the appropriate fuel for the vehicle.',
      'The vehicle must be returned with the same fuel level it had on delivery. Unused or extra fuel is not refunded.',
    ],
  },
  {
    title: 'Payments on the spot',
    points: [
      'Payments made on the spot can be in cash (euros or Mauritian rupees) or by credit card.',
      'Rupee payments use the prevailing exchange rate, or the rate stated on your quote.',
    ],
  },
  {
    title: 'Refunds and vehicle swaps',
    points: [
      'Once the rental has started and the contract is signed, unused days are not refunded.',
      'A vehicle swap depends on availability and is at the company’s sole discretion.',
    ],
  },
  {
    title: 'Accidents',
    points: [
      'You must notify us immediately after any accident. The vehicle may not be used again without our approval.',
      'If responsibility for an accident is difficult to establish, the company may charge the full deposit and refund it later where appropriate. Any costs of that refund are borne by the client.',
    ],
  },
  {
    title: 'Theft of parts and accessories',
    points: [
      'For theft of vehicle parts or accessories (such as wheels, jack and tools, antenna, wipers, mirrors, wheel covers or keys), the client pays the full insurance deposit or the cost of repair. The excess does not apply.',
    ],
  },
  {
    title: 'Not covered by the insurance waiver (SCDW)',
    points: [
      'Lost keys, property left in the car, damage caused by mishandling the exterior mirrors or the radio, flat or damaged tyres, and stolen personal belongings.',
    ],
  },
  {
    title: 'Vehicle condition and repairs',
    points: [
      'Cars are rented in good condition. If a mechanical problem occurs or a warning light appears on the dashboard, stop immediately and contact us.',
      'The renter may not replace parts or repair the car without our permission.',
    ],
  },
];
