/**
 * Business details shared by the web app, the API (emails, ICS invites) and
 * structured data. Change them here and every surface follows.
 *
 * NOTE: the phone, WhatsApp and address values are placeholders and must be
 * replaced with the real showroom details before launch.
 */
export const SITE = {
  name: "Dealership",
  legalName: "Dealership Sdn Bhd",
  registrationNo: "202301012345 (1501234-X)",
  tagline: "Authorised new-car dealership in Malaysia.",
  email: "hello@dealership.my",
  salesEmail: "sales@dealership.my",
  serviceEmail: "service@dealership.my",
  phone: {
    display: "+60 3 7801 2345",
    href: "tel:+60378012345",
  },
  whatsappUrl: "https://wa.me/60378012345",
  address: {
    street: "Lot 12, Jalan Sultan Ismail",
    postcode: "50250",
    city: "Petaling Jaya",
    state: "Selangor",
    country: "Malaysia",
    /** Single-line form for emails and calendar invites. */
    oneLine: "Lot 12, Jalan Sultan Ismail, 50250 Petaling Jaya, Selangor",
  },
  mapsUrl: "https://maps.google.com/?q=Petaling+Jaya+Selangor",
  hours: [
    { days: "Monday – Saturday", time: "9:00 am – 7:00 pm" },
    { days: "Sunday & public holidays", time: "Closed" },
  ],
  /** Short form used in the footer. */
  hoursShort: "Mon–Sat 9:00–19:00",
  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/",
  },
} as const;

export type Site = typeof SITE;
