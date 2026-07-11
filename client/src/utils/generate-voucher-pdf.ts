import { format } from 'date-fns';
import jsPDF from 'jspdf';
import type { Booking } from '@libs/types';

export const generateVoucherPDF = async (booking: Booking): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Load and add logo
  const logoUrl = '/assets/mauriconnectIcon.jpg';
  try {
    const img = new Image();
    img.src = logoUrl;
    doc.addImage(img, 'JPEG', margin, 10, 25, 18);
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  // Header - Title (moved to accommodate logo)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Mauriconnect', margin + 30, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('CAR RENTAL & TOURISM', margin + 30, 22);

  // Confirmation Number and Date (positioned higher and to the right)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Car Rental Provider Confirmation No:', pageWidth - margin - 30, 12, { align: 'right' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const confirmationNo =
    booking.ReferenceNo || `MC${booking.BookingId.toString().padStart(7, '0')}`;
  doc.text(confirmationNo, pageWidth - margin, 18, {
    align: 'right'
  });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Date Prepared:', pageWidth - margin - 30, 24, { align: 'right' });
  doc.text(format(new Date(), 'yyyy/MM/dd'), pageWidth - margin, 24, { align: 'right' });

  // Meeting Point
  let yPos = 35;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MEETING POINT:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const meetingText = doc.splitTextToSize(
    'Meet & Greet basis our company representative will wait for you by gate 5 & 6 with your name on a board.',
    contentWidth - 45
  );
  doc.text(meetingText, margin + 45, yPos);

  // Car rental details table
  yPos += 15;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Car rental details', pageWidth / 2, yPos + 5, { align: 'center' });

  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  // Driver's details
  doc.text(`Driver's name: `, margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.CustomerName || 'N/A', margin + 35, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Contact Details:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.ContactDetails || 'N/A', margin + 35, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Rental Days:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.NumberOfDays?.toString() || 'N/A', margin + 35, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Flight No:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.FlightNumber || 'N/A', margin + 35, yPos);

  // Pickup, Return, Car Details columns
  yPos += 8;
  const colWidth = contentWidth / 3;

  doc.setFont('helvetica', 'bold');
  doc.text('Pickup Details:', margin, yPos);
  doc.text('Return Details:', margin + colWidth, yPos);
  doc.text('Car Details:', margin + 2 * colWidth, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Pickup Date: ${format(new Date(booking.PickUpDate), 'yyyy/MM/dd HH:mm')}`,
    margin,
    yPos
  );
  doc.text(
    `Return Date: ${format(new Date(booking.DropOffDate), 'yyyy/MM/dd HH:mm')}`,
    margin + colWidth,
    yPos
  );
  doc.text(
    `Car Category: ${booking.Car?.CarCategory?.Category || 'N/A'}`,
    margin + 2 * colWidth,
    yPos
  );

  yPos += 5;
  doc.text('Mauritius Airport', margin, yPos);
  doc.text('Mauritius Airport', margin + colWidth, yPos);

  const carCategoryName = booking.Car?.CarCategory?.Category || 'N/A';
  const carModel = booking.Car?.Model || 'N/A';
  const carCategoryDescription = booking.Car?.CarCategory?.Description;
  const carDetails = carCategoryDescription
    ? `${carCategoryName}, ${carModel} or similar, ${carCategoryDescription}`
    : `${carCategoryName}, ${carModel} or similar`;
  const splitDetails = doc.splitTextToSize(carDetails, colWidth - 5);
  doc.text(splitDetails, margin + 2 * colWidth, yPos);

  // Important section
  yPos += 25;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Important', pageWidth / 2, yPos + 5, { align: 'center' });

  yPos += 12;
  doc.setFont('helvetica', 'normal');
  doc.text('Excess: EUR 600 for damages and theft', margin, yPos);
  yPos += 5;
  doc.text('Guarantee: (N/A)', margin, yPos);
  yPos += 5;
  doc.text('Minimum Driver age for this car is: 21', margin, yPos);
  yPos += 5;
  const fuelPolicy = doc.splitTextToSize(
    'Fair Fuel Policy: Please return the car with the same amount of fuelas when picked up. The car rental company will charge you for every missing quarter of a tank.',
    contentWidth
  );
  doc.text(fuelPolicy, margin, yPos);

  // Your Rental Includes
  yPos += 15;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Your Rental Includes', pageWidth / 2, yPos + 5, { align: 'center' });

  yPos += 12;
  doc.setFont('helvetica', 'normal');
  doc.text('Chosen Package: None', margin, yPos);
  yPos += 5;
  doc.text('Guarantee: (N/A)', margin, yPos);
  yPos += 5;
  const equipment = doc.splitTextToSize(
    'Special equipment(prices will be charged for these equipment(s): GPS Navigation system, Baby seat (up to 1 year of age), Child seat (2-4 years of age), Booster seat(4 - 10 years of age).',
    contentWidth
  );
  doc.text(equipment, margin, yPos);

  // Payable section
  yPos += 20;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Payable at rental desk ${booking.Currency || 'EUR'} ${booking.Price || '270'}`,
    pageWidth / 2,
    yPos + 5,
    { align: 'center' }
  );

  yPos += 12;
  doc.setFont('helvetica', 'normal');
  doc.text(`Car Rental : ${booking.Currency || 'EUR'} ${booking.Price || '270'}`, margin, yPos);
  yPos += 5;
  doc.text(`Optional extras ${booking.Currency || 'EUR'} 0.00`, margin, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(
    'NOTE: All additional charges (if any), such as out of hours, one ways etc are already calculated on the car rental price.',
    margin,
    yPos
  );

  // Save the PDF
  const fileName = `Voucher_MC${booking.BookingId.toString().padStart(
    7,
    '0'
  )}_${booking.CustomerName?.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};
