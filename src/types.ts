/**
 * Types and interfaces for the Alerta Temprana de Servicios (Brandsen)
 */

export type IncidentCategory =
  | 'Luminaria rota'
  | 'Bache'
  | 'Árbol caído'
  | 'Cable cortado'
  | 'Residuos especiales'
  | 'Otro';

export type IncidentStatus =
  | 'Reportado'
  | 'En Revisión'
  | 'En Cuadrilla'
  | 'Cerrado';

export interface IncidentReport {
  id: string;
  category: IncidentCategory;
  description: string;
  lat: number;
  lng: number;
  address: string;
  locality?: string; // e.g. Brandsen, Gómez, Jeppener, Altamirano, Samborombón, Oliden, Las Acacias
  status: IncidentStatus;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  neighborName?: string;
  neighborPhone?: string;
  internalComments?: string[];
}

export interface IncidentFilters {
  status: IncidentStatus | 'Todos';
  category: IncidentCategory | 'Todas';
  locality?: string | 'Todas';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

export interface AdminUser {
  username: string;
  role: string;
  isAuthenticated: boolean;
}

export interface DatabaseArchitectureGuide {
  title: string;
  description: string;
  tables: {
    name: string;
    description: string;
    fields: {
      name: string;
      type: string;
      constraints: string;
      description: string;
    }[];
  }[];
  geographicQueryExample: string;
}
