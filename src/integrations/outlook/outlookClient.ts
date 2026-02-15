import { supabase } from '@/integrations/supabase/client';
import { OUTLOOK_CONFIG } from './outlookConfig';

export class OutlookClient {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getAccessToken(): Promise<string> {
    const { data: integration } = await supabase
      .from('email_integrations')
      .select('*')
      .eq('user_id', this.userId)
      .eq('provider', 'outlook')
      .single();

    if (!integration) {
      throw new Error('No Outlook integration found');
    }

    const expiresAt = new Date(integration.token_expires_at!);
    const now = new Date();

    if (now >= expiresAt) {
      const { data: refreshResult, error } = await supabase.functions.invoke(
        'outlook-refresh-token',
        { body: { refreshToken: integration.refresh_token } }
      );

      if (error) throw error;

      await supabase
        .from('email_integrations')
        .update({
          access_token: refreshResult.accessToken,
          token_expires_at: refreshResult.expiresAt
        })
        .eq('id', integration.id);

      return refreshResult.accessToken;
    }

    return integration.access_token!;
  }

  async fetchMessages(top: number = 50): Promise<any[]> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `${OUTLOOK_CONFIG.graphEndpoint}/me/messages?$top=${top}&$orderby=receivedDateTime desc`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }
    const data = await response.json();
    return data.value;
  }

  async sendEmail(params: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
  }): Promise<void> {
    const accessToken = await this.getAccessToken();
    const message = {
      subject: params.subject,
      body: { contentType: 'HTML', content: params.body },
      toRecipients: params.to.map(email => ({ emailAddress: { address: email } })),
      ccRecipients: params.cc?.map(email => ({ emailAddress: { address: email } })),
      bccRecipients: params.bcc?.map(email => ({ emailAddress: { address: email } })),
    };

    const response = await fetch(
      `${OUTLOOK_CONFIG.graphEndpoint}/me/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  }

  async saveDraft(params: {
    subject: string;
    body: string;
    to?: string[];
  }): Promise<string> {
    const accessToken = await this.getAccessToken();
    const message = {
      subject: params.subject,
      body: { contentType: 'HTML', content: params.body },
      toRecipients: params.to?.map(email => ({ emailAddress: { address: email } })),
    };

    const response = await fetch(
      `${OUTLOOK_CONFIG.graphEndpoint}/me/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to save draft: ${response.statusText}`);
    }
    const data = await response.json();
    return data.id;
  }

  async getEmailThread(conversationId: string): Promise<any[]> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `${OUTLOOK_CONFIG.graphEndpoint}/me/messages?$filter=conversationId eq '${conversationId}'&$orderby=receivedDateTime asc`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch thread: ${response.statusText}`);
    }
    const data = await response.json();
    return data.value;
  }

  async fetchCalendarEvents(startDate: string, endDate: string): Promise<any[]> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `${OUTLOOK_CONFIG.graphEndpoint}/me/calendar/calendarView?startDateTime=${startDate}&endDateTime=${endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
    }
    const data = await response.json();
    return data.value;
  }

  async createCalendarEvent(params: {
    subject: string;
    body?: string;
    start: string;
    end: string;
    attendees?: string[];
    location?: string;
  }): Promise<string> {
    const accessToken = await this.getAccessToken();
    const event = {
      subject: params.subject,
      body: { contentType: 'HTML', content: params.body || '' },
      start: { dateTime: params.start, timeZone: 'UTC' },
      end: { dateTime: params.end, timeZone: 'UTC' },
      attendees: params.attendees?.map(email => ({
        emailAddress: { address: email },
        type: 'required'
      })),
      location: params.location ? { displayName: params.location } : undefined
    };

    const response = await fetch(
      `${OUTLOOK_CONFIG.graphEndpoint}/me/calendar/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }
    const data = await response.json();
    return data.id;
  }
}
