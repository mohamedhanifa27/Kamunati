// Basic dev mailer mock
export async function sendEmail({ to, subject, html, text }: { to: string, subject: string, html: string, text: string }) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('--- DEV MAILER ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text}`);
    console.log('------------------');
  }
}
