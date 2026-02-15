export const OUTLOOK_CONFIG = {
  clientId: import.meta.env.VITE_OUTLOOK_CLIENT_ID || '',
  authority: 'https://login.microsoftonline.com/common',
  redirectUri: `${window.location.origin}/integrations/outlook/callback`,
  scopes: [
    'User.Read',
    'Mail.Read',
    'Mail.ReadWrite',
    'Mail.Send',
    'Calendars.Read',
    'Calendars.ReadWrite',
    'offline_access'
  ],
  graphEndpoint: 'https://graph.microsoft.com/v1.0'
};

export const OUTLOOK_AUTH_URL =
  `${OUTLOOK_CONFIG.authority}/oauth2/v2.0/authorize?client_id=${OUTLOOK_CONFIG.clientId}&response_type=code&redirect_uri=${encodeURIComponent(OUTLOOK_CONFIG.redirectUri)}&scope=${encodeURIComponent(OUTLOOK_CONFIG.scopes.join(' '))}`;
