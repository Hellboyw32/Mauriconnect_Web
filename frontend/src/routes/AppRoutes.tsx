import { Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AboutPage } from '../pages/AboutPage';
import { CarListingPage } from '../pages/CarListingPage';
import { ConfirmationPage } from '../pages/ConfirmationPage';
import { ContactPage } from '../pages/ContactPage';
import { CustomerDetailsPage } from '../pages/CustomerDetailsPage';
import { HomePage } from '../pages/HomePage';
import { CreditsPage, NotFoundPage, PrivacyPage, TermsPage } from '../pages/LegalPages';
import { ManageBookingPage } from '../pages/ManageBookingPage';
import { PaymentPage } from '../pages/PaymentPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="booking/cars" element={<CarListingPage />} />
        <Route path="booking/details" element={<CustomerDetailsPage />} />
        <Route path="booking/payment" element={<PaymentPage />} />
        <Route path="booking/confirmation/:reference" element={<ConfirmationPage />} />
        <Route path="manage-booking" element={<ManageBookingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="credits" element={<CreditsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
