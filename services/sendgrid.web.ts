// Web-specific implementation of SendGrid service
export const sendVisaExpiryNotification = async (recipients: string[], data: any[]) => {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipients, data }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send notification');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const sendEmailUsingSendGrid = async (params: { to: string[], subject: string, htmlContent: string, textContent: string }) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 