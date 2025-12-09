
// Pappers API Types
export interface PappersCompany {
  siren: string;
  denomination: string;
  nom_entreprise?: string;
  siege?: {
    ville: string;
    code_postal: string;
  };
  forme_juridique?: string;
  date_creation?: string;
  capital?: number;
  representants?: PappersRepresentative[];
  entreprises_dirigees?: PappersCompanySummary[];
  procedures_collectives?: any[];
  statut_rcs?: string;
}

export interface PappersRepresentative {
  qualite: string;
  personne_morale?: boolean;
  nom?: string;
  prenom?: string;
  nom_complet?: string;
  date_naissance?: string;
  denomination?: string; // If personne_morale
  siren?: string; // If personne_morale
  date_prise_de_poste?: string;
  actuel?: boolean;
}

export interface PappersCompanySummary {
  siren: string;
  denomination: string;
  qualite?: string;
}

// Graph Application Types
export enum NodeType {
  COMPANY = 'COMPANY',
  PERSON = 'PERSON',
  ROOT = 'ROOT'
}

// Link cost classification for hybrid traversal algorithm
export enum LinkCost {
  FREE = 'FREE',       // Descending org chart links (subsidiaries) - no depth cost
  COSTLY = 'COSTLY'    // Network jumps (via persons, upward links) - consumes depth budget
}

export interface GraphNode {
  id: string; // SIREN for companies, Name+DOB or ID for people
  label: string;
  type: NodeType;
  data?: any; // Raw Pappers data
  radius?: number; // Visualization property
  degree?: number; // Distance from root
  status?: 'active' | 'closed' | 'unknown';
}

// Path step represents one entity in the relationship chain
export interface PathStep {
  name: string;           // Entity name/label
  type: NodeType;         // COMPANY, PERSON, or ROOT
  relationFromPrevious?: string; // Role/relationship from the previous entity (e.g., "Président de", "Holding de")
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
  active: boolean;
  path: PathStep[]; // Full path from root to target with relationship info
  cost?: LinkCost;  // Classification: FREE (subsidiary) or COSTLY (network jump)
}

export interface CrawlStats {
  companiesScanned: number;
  peopleFound: number;
  linksFound: number;
  depthReached: number;
  errors: CrawlError[];
  creditsConsumed: number;
}

export interface CrawlError {
  siren: string;
  code: number;
  message: string;
  timestamp: Date;
}

export interface CrawlConfig {
  apiKey: string;
  rootSiren: string;
  maxDepth: number;
  limit: number;
}
