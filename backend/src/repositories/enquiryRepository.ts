import { request, sql } from './db';

export const enquiryRepository = {
  async insert(p: { type: 'Quote' | 'Contact'; name: string; email: string; phone: string | null; message: string; ipAddress: string | null }): Promise<number> {
    const r = await (await request())
      .input('type', sql.VarChar(20), p.type)
      .input('name', sql.NVarChar(200), p.name)
      .input('email', sql.NVarChar(254), p.email)
      .input('phone', sql.VarChar(20), p.phone)
      .input('message', sql.NVarChar(2000), p.message)
      .input('ip', sql.VarChar(45), p.ipAddress)
      .query(`INSERT INTO rental.Enquiries (EnquiryType, Name, Email, Phone, Message, IpAddress)
              OUTPUT inserted.EnquiryId VALUES (@type, @name, @email, @phone, @message, @ip)`);
    return r.recordset[0].EnquiryId;
  },
};

export type EnquiryRepository = typeof enquiryRepository;
