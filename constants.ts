import * as d3 from 'd3';

export const COLORS = {
  // Cyberpunk dark theme
  primary: '#1968b1',       // Primary blue
  secondary: '#64748B',     // Slate 500
  accent: '#00d4ff',        // Cyber glow
  background: '#020018',    // Dark background
  surface: 'rgba(20, 20, 40, 0.7)', // Glass surface

  // Node colors
  nodeRoot: '#8b5cf6',      // Purple for root
  nodeCompany: '#1968b1',   // Primary blue
  nodePerson: '#00d4ff',    // Cyan glow
  nodeInactive: '#64748B',  // Slate for inactive
  nodeProcedure: '#ef4444', // Red for procedures

  // Link colors
  linkActive: 'rgba(0, 212, 255, 0.5)',
  linkInactive: 'rgba(100, 116, 139, 0.3)',

  // Text
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
};

export const MOCK_DATA_ROOT_SIREN = "443061841"; // Google France for demo

export const PAPPERS_API_URL = "https://api.pappers.fr/v2";