export interface SimCardReportRow {
  AgentName: string;
  SimCardCount: number;
}

export type SimCardReport = SimCardReportRow[];

export interface InsuranceReportRow {
  DeliveryAgentName: string;
  TotalInsurance: number;
}

export type InsuranceReport = InsuranceReportRow[];

// One line of the Settlement report, laid out like the paper settlement sheet
// (spGetSettlementReportByDate): Client Name | CarNo | Model | DropOffDate |
// D.Off Time | Amount | PayMode | Agent | Remarks.
export interface SettlementReportRow {
  BookingId: number;
  ClientName: string;
  // "No Show" for a no-show booking; blank when no car is assigned yet.
  CarNo: string;
  Model: string;
  // ISO date string from the driver (e.g. "2026-11-28T00:00:00.000Z"); the first
  // 10 characters are the calendar date, so read it with toLocalDate().
  DropOffDate: string;
  // HH:mm
  DropOffTime: string;
  // The price, or "Already Paid" for a prepaid booking.
  Amount: string;
  // Card -> POS machine name, "Cash", or "-" when already paid.
  PayMode: string;
  Agent: string;
  // "FC <amount>" when full-cover insurance was taken.
  Remarks: string;
}
