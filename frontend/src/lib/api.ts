// API base URL - uses environment variable in production, localhost in development
// Ensure it ends with /api
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  // If URL doesn't end with /api, append it
  if (!envUrl.endsWith('/api')) {
    return envUrl.endsWith('/') ? `${envUrl}api` : `${envUrl}/api`;
  }
  return envUrl;
};
const API_BASE_URL = getApiBaseUrl();

// Types
export interface Host {
  id: number;
  phone: string;
  name: string;
  is_setup_complete: boolean;
  created_at: string;
}

export interface Party {
  id: number;
  name: string;
  start_time: string;
  location: string;
  description?: string;
  invite_code: string;
  host_id: number;
  created_at: string;
}

export interface PartyWithCounts extends Party {
  rsvp_count: number;
  attending_count: number;
}

export interface RSVP {
  id: number;
  guest_name: string;
  guest_phone: string;
  is_attending: boolean;
  party_id: number;
  degree: number;
  invited_by_rsvp_id?: number;
  invitation_code?: string;
  is_confirmed: boolean;
  has_sent_invitation: boolean;
  created_at: string;
}

export interface GuestRSVP extends RSVP {
  party: Party;
  first_downstream_acceptance?: {
    name: string;
    phone: string;
  };
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface SignupRequest {
  phone: string;
  password: string;
  name?: string;
}

export interface SetupRequest {
  name: string;
}

export interface PartyCreateRequest {
  name: string;
  start_time: string;
  location: string;
  description?: string;
}

export interface RSVPRequest {
  guest_name: string;
  guest_phone: string;
  is_attending: boolean;
  invited_by_code?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// API utility functions
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Handle headers from options
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        // Handle array of tuples
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        // Handle Record
        Object.assign(headers, options.headers);
      }
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: headers as HeadersInit,
    });

    console.log('Request details:', { url, headers, body: options.body }); // Debug logging

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.log('Error data:', errorData); // Debug logging
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => 
            typeof err === 'string' ? err : err.message || err.detail || JSON.stringify(err)
          ).join(', ');
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (Array.isArray(errorData)) {
          errorMessage = errorData.map((err: any) => 
            typeof err === 'string' ? err : err.message || err.detail || JSON.stringify(err)
          ).join(', ');
        }
      } catch (e) {
        console.log('Error parsing JSON:', e); // Debug logging
        // If JSON parsing fails, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Authentication endpoints
  async signup(data: SignupRequest): Promise<Host> {
    return this.request<Host>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.access_token);
    return response;
  }

  async setup(data: SetupRequest): Promise<Host> {
    return this.request<Host>('/auth/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentHost(): Promise<Host> {
    return this.request<Host>('/auth/me');
  }

  // Party endpoints
  async createParty(data: PartyCreateRequest): Promise<Party> {
    return this.request<Party>('/parties/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getParties(): Promise<PartyWithCounts[]> {
    return this.request<PartyWithCounts[]>('/parties/');
  }

  async getParty(partyId: number): Promise<Party> {
    return this.request<Party>(`/parties/${partyId}`);
  }

  async deleteParty(partyId: number): Promise<void> {
    return this.request<void>(`/parties/${partyId}`, {
      method: 'DELETE',
    });
  }

  async getPartyRSVPs(partyId: number): Promise<RSVP[]> {
    return this.request<RSVP[]>(`/parties/${partyId}/rsvps`);
  }

  // RSVP endpoints (public)
  async getPartyByInviteCode(inviteCode: string): Promise<Party> {
    return this.request<Party>(`/rsvp/party/${inviteCode}`);
  }

  async createRSVP(inviteCode: string, data: RSVPRequest): Promise<RSVP> {
    return this.request<RSVP>(`/rsvp/party/${inviteCode}/rsvp`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRSVPDetails(rsvpId: number): Promise<{
    rsvp: RSVP;
    invitation_url?: string;
    can_invite: boolean;
    needs_invitation: boolean;
  }> {
    return this.request(`/rsvp/rsvp/${rsvpId}`);
  }

  async getGuestRSVPs(phone: string): Promise<GuestRSVP[]> {
    return this.request<GuestRSVP[]>(`/rsvp/guest/${phone}/rsvps`);
  }

  async getGuestPartyRSVP(phone: string, inviteCode: string): Promise<GuestRSVP> {
    return this.request<GuestRSVP>(`/rsvp/guest/${phone}/party/${inviteCode}`);
  }

  async getPartyRSVPsAll(inviteCode: string): Promise<Array<RSVP & { referrer_name: string }>> {
    return this.request(`/rsvp/party/${inviteCode}/rsvps/all`);
  }

  async getPartyRSVPsPublic(inviteCode: string): Promise<{
    party_name: string;
    attending_count: number;
    total_rsvps: number;
    attending_guests: Array<{ guest_name: string; is_attending: boolean }>;
  }> {
    return this.request(`/rsvp/party/${inviteCode}/rsvps`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Test export
export const testExport = 'test';
