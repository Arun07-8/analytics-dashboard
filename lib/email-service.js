import nodemailer from 'nodemailer';

/**
 * Sends an invoice email using Brevo SMTP.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email body (HTML)
 * @param {string} options.fromName - Sender name
 * @param {string} options.fromEmail - Sender email (must be authorized in Brevo)
 */
export async function sendEmail({ to, subject, html, fromName, fromEmail }) {
  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: process.env.BREVO_SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASSWORD, // This is the Brevo API Key
    },
  });

  const info = await transporter.sendMail({
    from: `"${fromName || 'Invoice System'}" <${fromEmail || process.env.BREVO_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });

  return info;
}

/**
 * Generates HTML for the invoice email.
 */
export function generateInvoiceHtml({ sale, customer, staffName, companyLogoUrl }) {
  const date = new Date(sale.createdAt?.toDate ? sale.createdAt.toDate() : (sale.createdAt || Date.now()));
  const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const invoiceNo = sale.salesRefId?.[0] || 'N/A';
  
  const servicesHtml = (sale.services || []).map((s, i) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #4a5568;">${i + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #2d3748; font-weight: 600;">${s.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #4a5568; text-align: right;">₹${s.price?.toLocaleString('en-IN')}</td>
      <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #1a202c; font-weight: 700; text-align: right;">₹${s.price?.toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const isPaid = Number(sale.paidAmount) >= Number(sale.totalAmount);
  const balanceDue = Number(sale.totalAmount) - (Number(sale.paidAmount) || 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7fafc; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); padding: 40px 30px; color: white; }
        .content { padding: 30px; }
        .footer { background: #f8fafc; padding: 20px 30px; text-align: center; color: #718096; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-paid { background: #c6f6d5; color: #22543d; }
        .badge-pending { background: #fed7d7; color: #822727; }
        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .total-row { background: #edf2f7; font-weight: bold; }
        .accent { color: #ff5722; font-weight: 800; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <table width="100%">
            <tr>
              <td>
                <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 0.1em;">Invoice</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;"># ${invoiceNo}</p>
              </td>
              <td align="right">
                <div class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}">${isPaid ? 'Paid in Full' : 'Payment Pending'}</div>
              </td>
            </tr>
          </table>
        </div>
        
        <div class="content">
          <table width="100%" style="margin-bottom: 30px;">
            <tr>
              <td width="50%" valign="top">
                <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 800; color: #a0aec0; text-transform: uppercase;">Billed To</p>
                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #2d3748;">${customer.name}</p>
                <p style="margin: 2px 0; font-size: 14px; color: #718096;">${customer.mobile}</p>
                ${customer.email ? `<p style="margin: 2px 0; font-size: 14px; color: #718096;">${customer.email}</p>` : ''}
              </td>
              <td align="right" valign="top">
                <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 800; color: #a0aec0; text-transform: uppercase;">Date Issued</p>
                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #2d3748;">${formattedDate}</p>
              </td>
            </tr>
          </table>

          <table class="table">
            <thead>
              <tr style="background: #1e3a5f; color: white;">
                <th align="left" style="padding: 12px; font-size: 10px; text-transform: uppercase;">#</th>
                <th align="left" style="padding: 12px; font-size: 10px; text-transform: uppercase;">Description</th>
                <th align="right" style="padding: 12px; font-size: 10px; text-transform: uppercase;">Rate</th>
                <th align="right" style="padding: 12px; font-size: 10px; text-transform: uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${servicesHtml}
              <tr class="total-row">
                <td colspan="3" align="right" style="padding: 15px; font-size: 12px; text-transform: uppercase; color: #4a5568;">Total Amount</td>
                <td align="right" style="padding: 15px; font-size: 18px; color: #1e3a5f;">₹${Number(sale.totalAmount)?.toLocaleString('en-IN')}</td>
              </tr>
              ${!isPaid && Number(sale.paidAmount) > 0 ? `
              <tr>
                <td colspan="3" align="right" style="padding: 10px 15px; font-size: 11px; text-transform: uppercase; color: #38a169;">Advance Paid</td>
                <td align="right" style="padding: 10px 15px; font-size: 14px; color: #38a169; font-weight: 700;">₹${Number(sale.paidAmount)?.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="background: #fffaf0;">
                <td colspan="3" align="right" style="padding: 15px; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #c05621;">Balance Due</td>
                <td align="right" style="padding: 15px; font-size: 20px; color: #c05621; font-weight: 900;">₹${balanceDue?.toLocaleString('en-IN')}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #edf2f7;">
            <p style="margin: 0; font-size: 12px; color: #718096; font-style: italic;">
              "We appreciate your business. If you have any questions about this invoice, please reach out to us."
            </p>
            <div style="margin-top: 20px;">
              <p style="margin: 0; font-size: 14px; font-weight: 700; color: #2d3748;">${staffName}</p>
              <p style="margin: 0; font-size: 11px; font-weight: 800; color: #ff5722; text-transform: uppercase; letter-spacing: 0.1em;">Authorized Signatory</p>
            </div>
          </div>
        </div>

        <div class="footer">
          <p style="margin-bottom: 5px;"><strong>Agency Analytics</strong></p>
          <p style="margin: 0;">Main Street, City · agency@example.com</p>
          <p style="margin: 10px 0 0 0; font-size: 10px; color: #a0aec0;">&copy; ${new Date().getFullYear()} Agency Analytics. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
