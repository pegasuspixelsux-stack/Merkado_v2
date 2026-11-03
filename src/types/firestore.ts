/**
 * Firestore data models for Coastal.
 *
 * Collections:
 *   users/{uid}       -> Agent      (document id = Firebase Auth uid)
 *   properties/{id}   -> Property
 *   leads/{id}        -> Lead
 *
 * Dates are exposed as epoch milliseconds; the service layer converts from/to
 * Firestore Timestamps.
 */

export type Currency = 'USD' | 'UYU';

// ---------------------------------------------------------------- Agents

export type AgentRole = 'admin' | 'agent';

export interface Agent {
  /** Firebase Auth uid. */
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AgentRole;
  /** Deactivated agents are locked out by the security rules. */
  active: boolean;
  avatarUrl?: string;
  createdAt?: number;
}

// ------------------------------------------------------------ Properties

export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial';
export type PropertyOperation = 'sale' | 'rent' | 'seasonal';
/** Only `active` properties are publicly readable. */
export type PropertyStatus = 'active' | 'reserved' | 'sold';

export interface PropertyLocation {
  city: string;
  neighborhood?: string;
  address?: string;
  state?: string;
  country: string;
  coordinates?: { lat: number; lng: number };
}

export interface PropertySpecs {
  bedrooms: number;
  bathrooms: number;
  /** Interior living area in square metres. */
  areaM2: number;
  lotM2?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
}

export interface PropertyPhoto {
  /** Public ImageKit URL. */
  url: string;
  /** ImageKit file id, needed to delete or replace the file later. */
  fileId?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  operation: PropertyOperation;
  price: number;
  currency: Currency;
  location: PropertyLocation;
  specs: PropertySpecs;
  photos: PropertyPhoto[];
  status: PropertyStatus;
  /** Shown in the homepage hero slideshow (up to 5 are displayed). */
  featured?: boolean;
  /** uid of the agent who owns the listing. */
  agentId: string;
  /** Agent contact details copied onto the listing, because agent profiles are not publicly readable. */
  agentName?: string;
  agentPhone?: string;
  createdAt: number;
  updatedAt: number;
}

/** Fields supplied by the caller; id and timestamps are generated. */
export type PropertyInput = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>;
export type PropertyUpdate = Partial<Omit<PropertyInput, 'agentId'>>;

// ----------------------------------------------------------------- Leads

export type LeadChannel = 'WhatsApp' | 'Portal' | 'Direct';
/** CRM pipeline stage. */
export type LeadStatus = 'new' | 'contacted' | 'closed';

export interface Lead {
  id: string;
  /** Property the client asked about; empty for general inquiries. */
  propertyId: string;
  clientName: string;
  email: string;
  phone: string;
  channel: LeadChannel;
  message: string;
  status: LeadStatus;
  /** Agent working the lead, if assigned. */
  assignedAgentId?: string;
  notes?: string;
  createdAt: number;
}
