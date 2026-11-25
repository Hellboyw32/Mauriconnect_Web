// Business details shown on vouchers and emails (source: mauriconnect.com, reviewed 2026-10-30).
export const company = {
  name: 'MauriConnect Car Rental',
  legalName: 'Mauriconnect Ltd',
  address: "L'escalier Road, Plaine Magnien, Mauritius",
  phone: '+230 5255 1144',
  whatsapp: '+230 5255 1144',
  whatsappUrl: 'https://wa.me/23052551144',
  email: 'info@mauriconnect.com',
  website: 'https://mauriconnect.com',
  officeHours: 'Mon–Sat 08:00–18:00 (Mauritius time)',
  emergency: '24/7 support: +230 5255 1144 (phone and WhatsApp)',
} as const;

// Rental instructions printed on the voucher, from the published FAQs and terms.
export const rentalInstructions = [
  'Bring this voucher, your passport or ID card and your driving licence (held for at least 1 year).',
  'The main driver must be at least 18 years old. Only drivers named on the contract are insured.',
  'A security deposit is taken at pickup. Its amount depends on the car and the insurance chosen.',
  'Fuel policy: same to same. Return the car with the fuel level it had at pickup.',
  'Unlimited mileage is included. Vehicles drive on the left in Mauritius.',
  'In case of an accident, breakdown or warning light, stop the car and call us immediately.',
] as const;

export const keyTerms = [
  'Unused rental days are not refunded once the rental contract has started.',
  'Insurance does not cover drink driving, lost keys, tyres, mirrors, radio or personal belongings.',
  'Theft of car parts or accessories is charged up to the full insurance deposit.',
  'The renter may not repair the car or change parts without our permission.',
  'Full terms: https://mauriconnect.com/terms-conditions-rental/',
] as const;
