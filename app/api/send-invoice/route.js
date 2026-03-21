import { NextResponse } from 'next/server';
import { sendEmail, generateInvoiceHtml } from '@/lib/email-service';
import { getSale } from '@/lib/firebase/collections/sale';
import { getCustomer } from '@/lib/firebase/collections/customer';
import { getAllAdmins } from '@/lib/firebase/collections/admin';

export async function POST(req) {
  try {
    const { saleId, customerId } = await req.json();

    if (!saleId || !customerId) {
      return NextResponse.json({ error: 'Missing required fields: saleId or customerId' }, { status: 400 });
    }

    const [sale, customer, admins] = await Promise.all([
      getSale(saleId),
      getCustomer(customerId),
      getAllAdmins()
    ]);

    if (!sale) return NextResponse.json({ error: 'Sale record not found' }, { status: 404 });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    if (!customer.email) return NextResponse.json({ error: 'Customer email not available' }, { status: 400 });

    const staffName = admins.find(a => a.id === sale.createdBy || a.id === sale.staffId)?.name || sale.staffName || 'Authorized Signatory';
    const invoiceNo = sale.salesRefId?.[0] || 'N/A';

    const html = generateInvoiceHtml({
      sale,
      customer,
      staffName,
      companyLogoUrl: '/your_logo-removebg-preview.png',
    });

    await sendEmail({
      to: customer.email,
      subject: `Invoice from Agency Analytics - #${invoiceNo}`,
      html,
      fromName: staffName,
      fromEmail: process.env.BREVO_FROM_EMAIL || 'agency@example.com',
    });

    return NextResponse.json({ success: true, message: 'Invoice email sent successfully' });
  } catch (error) {
    console.error('Error in send-invoice API:', error);
    return NextResponse.json({ error: error.message || 'Failed to send invoice email' }, { status: 500 });
  }
}
