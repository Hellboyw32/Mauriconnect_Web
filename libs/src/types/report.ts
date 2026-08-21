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
