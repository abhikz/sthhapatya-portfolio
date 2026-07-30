/**
 * Meridian Studio contact form handler.
 *
 * Deploy this as a Google Apps Script web app from the Gmail account that
 * should send and receive enquiries. Its public /exec URL belongs in the
 * data-endpoint attribute of #contactForm in meridian-studio-portfolio_1.html.
 */

const RECIPIENT_EMAIL = 'abhijeetzagade6516@gmail.com';
const MAX_MESSAGE_LENGTH = 5000;

function doPost(e) {
  try {
    const enquiry = parseEnquiry_(e);

    // Quietly accept bot submissions without sending an email.
    if (enquiry.website) return json_({ ok: true });

    validateEnquiry_(enquiry);

    const subject = 'New Meridian Studio enquiry from ' + enquiry.name;
    const plainText = [
      'New enquiry from the Meridian Studio website',
      '',
      'Name: ' + enquiry.name,
      'Email: ' + enquiry.email,
      'Project type: ' + enquiry.projectType,
      '',
      'Message:',
      enquiry.message
    ].join('\n');
    const htmlBody = [
      '<h2>New Meridian Studio enquiry</h2>',
      '<p><strong>Name:</strong> ' + html_(enquiry.name) + '<br>',
      '<strong>Email:</strong> <a href="mailto:' + html_(enquiry.email) + '">' + html_(enquiry.email) + '</a><br>',
      '<strong>Project type:</strong> ' + html_(enquiry.projectType) + '</p>',
      '<p><strong>Message</strong><br>' + html_(enquiry.message).replace(/\n/g, '<br>') + '</p>'
    ].join('');

    MailApp.sendEmail({
      to: RECIPIENT_EMAIL,
      replyTo: enquiry.email,
      subject: subject,
      body: plainText,
      htmlBody: htmlBody,
      name: 'Meridian Studio website'
    });

    return json_({ ok: true });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: 'Unable to process this enquiry.' });
  }
}

function parseEnquiry_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
  const source = raw ? JSON.parse(raw) : (e && e.parameter ? e.parameter : {});
  return {
    name: clean_(source.name, 120),
    email: clean_(source.email, 254),
    projectType: clean_(source.projectType, 100),
    message: clean_(source.message, MAX_MESSAGE_LENGTH),
    website: clean_(source.website, 200)
  };
}

function validateEnquiry_(enquiry) {
  if (!enquiry.name || !enquiry.message || !enquiry.email) {
    throw new Error('Name, email, and message are required.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) {
    throw new Error('A valid email address is required.');
  }
}

function clean_(value, maxLength) {
  return String(value || '')
    .replace(/[\r\n]+/g, '\n')
    .trim()
    .slice(0, maxLength);
}

function html_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
