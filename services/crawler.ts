import axios from 'axios';
import { PappersCompany, GraphNode, GraphLink, NodeType, CrawlStats, CrawlError, PathStep } from '../types';
import { MOCK_DATA_ROOT_SIREN, PAPPERS_API_URL } from '../constants';

// Helper to generate a consistent ID for a person based on name/dob
const generatePersonId = (rep: any): string => {
  if (rep.siren) return rep.siren; // Moral person
  const base = `${rep.nom || ''}_${rep.prenom || ''} `.toUpperCase().replace(/\s+/g, '_');
  return `${base}_${rep.date_naissance || 'UNK'} `;
};

export class PappersCrawler {
  private visited: Set<string> = new Set();
  private nodes: Map<string, GraphNode> = new Map();
  private links: GraphLink[] = [];
  private errors: CrawlError[] = [];
  private credits: number = 0;
  private cancelFlag: boolean = false;

  constructor(private apiKey: string) { }

  public cancel() {
    this.cancelFlag = true;
  }

  // Demo Mock Data Generator - Handcrafted Coherent Network
  private async mockFetch(siren: string): Promise<PappersCompany> {
    await new Promise(r => setTimeout(r, 150)); // Fast demo response

    const MOCK_DB: Record<string, PappersCompany> = {
      // Root: AERO FUTURE GROUP
      "443061841": {
        siren: "443061841",
        denomination: "AERO FUTURE GROUP",
        forme_juridique: "SA à conseil d'administration",
        date_creation: "2000-01-15",
        siege: { ville: "TOULOUSE", code_postal: "31000" },
        statut_rcs: "Inscrit",
        representants: [
          { qualite: "Président du Conseil", nom_complet: "DUPONT Jean", nom: "DUPONT", prenom: "Jean", date_naissance: "1965-05-12", actuel: true },
          { qualite: "Directeur Général", nom_complet: "MARTIN Sophie", nom: "MARTIN", prenom: "Sophie", date_naissance: "1978-08-23", actuel: true },
          { qualite: "Administrateur", nom_complet: "LEROY Pierre", nom: "LEROY", prenom: "Pierre", date_naissance: "1955-11-30", actuel: true }
        ],
        entreprises_dirigees: [
          { siren: "555000111", denomination: "AERO ENGINES", qualite: "Président" },
          { siren: "555000222", denomination: "AERO WINGS", qualite: "Président" },
          { siren: "555000333", denomination: "AERO TECH", qualite: "Président" },
          { siren: "555000444", denomination: "AERO LEGACY", qualite: "Liquidateur" }
        ]
      },
      // Sub 1: AERO ENGINES (Active, shared director Jean Dupont)
      "555000111": {
        siren: "555000111",
        denomination: "AERO ENGINES",
        forme_juridique: "SAS",
        date_creation: "2005-03-10",
        siege: { ville: "BORDEAUX", code_postal: "33000" },
        statut_rcs: "Inscrit",
        representants: [
          { qualite: "Président", nom: "DUPONT", prenom: "Jean", date_naissance: "1965-05-12", actuel: true }, // Same Jean Dupont
          { qualite: "Directeur Général", nom: "CURIE Marie", prenom: "Marie", date_naissance: "1980-02-15", actuel: true }
        ],
        entreprises_dirigees: [
          { siren: "555000555", denomination: "ENGINES PARTS", qualite: "Président" }
        ]
      },
      // Sub 2: AERO WINGS (Active)
      "555000222": {
        siren: "555000222",
        denomination: "AERO WINGS",
        forme_juridique: "SAS",
        date_creation: "2010-06-20",
        siege: { ville: "NANTES", code_postal: "44000" },
        statut_rcs: "Inscrit",
        representants: [
          { qualite: "Président", denomination: "AERO FUTURE GROUP", siren: "443061841", personne_morale: true, actuel: true },
          { qualite: "Directeur Général", nom: "BERNARD Luc", prenom: "Luc", date_naissance: "1975-04-04", actuel: true }
        ]
      },
      // Sub 3: AERO TECH (Liquidation Judiciaire)
      "555000333": {
        siren: "555000333",
        denomination: "AERO TECH",
        forme_juridique: "SARL",
        date_creation: "2015-09-01",
        siege: { ville: "LYON", code_postal: "69000" },
        statut_rcs: "Inscrit", // Still registered but in procedure
        procedures_collectives: [
          { type: "Liquidation judiciaire", date_debut: "2023-11-15" }
        ],
        representants: [
          { qualite: "Gérant", nom: "DURAND Paul", prenom: "Paul", date_naissance: "1982-12-12", actuel: true }
        ]
      },
      // Sub 4: AERO LEGACY (Radiée)
      "555000444": {
        siren: "555000444",
        denomination: "AERO LEGACY (Radiée)",
        forme_juridique: "SA",
        date_creation: "1990-01-01",
        siege: { ville: "PARIS", code_postal: "75001" },
        statut_rcs: "Radié",
        representants: [
          { qualite: "Liquidateur", denomination: "AERO FUTURE GROUP", siren: "443061841", personne_morale: true, actuel: true }
        ]
      },
      // Sub 1.1: ENGINES PARTS
      "555000555": {
        siren: "555000555",
        denomination: "ENGINES PARTS",
        forme_juridique: "SAS",
        date_creation: "2020-01-01",
        siege: { ville: "BORDEAUX", code_postal: "33000" },
        statut_rcs: "Inscrit",
        representants: [
          { qualite: "Président", denomination: "AERO ENGINES", siren: "555000111", personne_morale: true, actuel: true },
          // Marie Curie is also admin here
          { qualite: "Administrateur", nom: "CURIE", prenom: "Marie", date_naissance: "1980-02-15", actuel: true }
        ]
      }
    };

    if (MOCK_DB[siren]) {
      return MOCK_DB[siren];
    }

    // FALLBACK: Deterministic procedural generation for unknown nodes (to allow exploration)
    const sirenNum = parseInt(siren) || 0;
    const isRadiated = siren.endsWith('4');

    return {
      siren,
      denomination: `UNKNOWN ENTITY ${siren.slice(-3)}`,
      forme_juridique: "SAS",
      date_creation: "2020-01-01",
      statut_rcs: isRadiated ? 'Radié' : 'Inscrit',
      siege: { ville: "PARIS", code_postal: "75000" },
      representants: [
        { qualite: "Président", nom: "GENERIC", prenom: "User", date_naissance: "1980-01-01", actuel: true }
      ]
    };
  }


  private async fetchCompany(siren: string): Promise<PappersCompany | null> {
    if (!siren || siren.length !== 9) return null;

    if (this.apiKey === 'DEMO') {
      return this.mockFetch(siren);
    }

    try {
      // NOTE: In a real production app, this call should go through a backend proxy 
      // to avoid exposing the API key and to handle CORS if Pappers blocks browser requests.
      const response = await axios.get(`${PAPPERS_API_URL}/entreprise`, {
        params: {
          api_token: this.apiKey, // Using query param for simplicity in client-side, header is safer
          siren: siren,
          champs_supplementaires: 'representants,entreprises_dirigees'
        }
      });

      this.credits += 1; // Base cost estimation
      return response.data;
    } catch (err: any) {
      const status = err.response?.status || 0;
      this.errors.push({
        siren,
        code: status,
        message: err.message || "Unknown error",
        timestamp: new Date()
      });
      return null;
    }
  }

  public async crawl(
    rootSiren: string,
    maxDepth: number,
    limit: number,
    onProgress: (stats: CrawlStats) => void
  ): Promise<{ nodes: GraphNode[]; links: GraphLink[]; stats: CrawlStats }> {

    // Queue stores { siren, personDepth, pathFromRoot }
    // personDepth only increments when traversing through a physical person
    // Companies are always crawled regardless of depth
    const queue: { siren: string; personDepth: number; path: PathStep[]; lastRelation?: string }[] = [{
      siren: rootSiren,
      personDepth: 0,
      path: []
    }];

    this.visited.add(rootSiren);

    let companiesScanned = 0;

    while (queue.length > 0) {
      if (this.cancelFlag) break;

      // CRITICAL: Check limit BEFORE fetching to prevent extra API calls
      // Use strictly >= to stop immediately
      if (companiesScanned >= limit) {
        break;
      }

      const current = queue.shift()!;

      // Notify progress
      onProgress(this.getStats(companiesScanned, current.personDepth));

      const companyData = await this.fetchCompany(current.siren);

      if (!companyData) continue;
      companiesScanned++;

      // Determine Node Label and Type
      const currentLabel = companyData.denomination || companyData.nom_entreprise || current.siren;
      const isRootNode = current.siren === rootSiren;
      const currentNodeType = isRootNode ? NodeType.ROOT : NodeType.COMPANY;

      // Build the current path step
      const currentStep: PathStep = {
        name: currentLabel,
        type: currentNodeType,
        relationFromPrevious: current.lastRelation
      };
      const currentPath: PathStep[] = [...current.path, currentStep];
      const status = companyData.statut_rcs === 'Radié' ? 'closed' : 'active';

      // 1. Process/Update the Company Node
      if (this.nodes.has(current.siren)) {
        // Update existing node (it might have been created as a placeholder)
        // This ensures status (Active/Radié) and data are correct
        const existingNode = this.nodes.get(current.siren)!;
        existingNode.data = companyData;
        existingNode.status = status;
        existingNode.label = currentLabel;
        // Ensure type is updated if it was just inferred
        if (existingNode.type !== NodeType.ROOT) existingNode.type = NodeType.COMPANY;
      } else {
        this.nodes.set(current.siren, {
          id: current.siren,
          label: currentLabel,
          type: current.siren === rootSiren ? NodeType.ROOT : NodeType.COMPANY,
          data: companyData,
          degree: current.personDepth,
          status: status
        });
      }

      // Note: No global depth check here - depth only applies to persons

      // 2. Process Representatives
      if (companyData.representants) {
        for (const rep of companyData.representants) {

          // --- FILTER: Exclude Statutory Auditors ---
          if (rep.qualite && rep.qualite.toLowerCase().includes('commissaire aux comptes')) {
            continue;
          }

          const repId = generatePersonId(rep);
          const repLabel = rep.personne_morale ? (rep.denomination || repId) : (rep.nom_complet || `${rep.prenom} ${rep.nom}`);
          const isPersonMoral = rep.personne_morale === true;

          // For physical persons, check depth limit
          if (!isPersonMoral && current.personDepth >= maxDepth) {
            // Skip adding this person - we've reached max depth for persons
            continue;
          }

          // Add Node
          if (!this.nodes.has(repId)) {
            this.nodes.set(repId, {
              id: repId,
              label: repLabel,
              type: isPersonMoral ? NodeType.COMPANY : NodeType.PERSON,
              data: rep,
              degree: current.personDepth + (isPersonMoral ? 0 : 1),
              status: 'active'
            });
          }

          // Add Link (Dirigeant -> Entreprise)
          // Build path step for this person with their role
          const repStep: PathStep = {
            name: repLabel,
            type: isPersonMoral ? NodeType.COMPANY : NodeType.PERSON,
            relationFromPrevious: rep.qualite // e.g., "Président", "Gérant"
          };

          this.links.push({
            source: repId,
            target: current.siren,
            label: rep.qualite,
            active: rep.actuel !== false,
            path: [...currentPath, repStep] // Path from root to this person with relationships
          });

          // If Moral Person (company), queue for crawling - NO depth increment for companies
          if (isPersonMoral && rep.siren && !this.visited.has(rep.siren)) {
            if (companiesScanned < limit) {
              this.visited.add(rep.siren);
              queue.push({
                siren: rep.siren,
                personDepth: current.personDepth, // Companies don't increment person depth
                path: currentPath,
                lastRelation: rep.qualite
              });
            }
          }
        }
      }

      // 3. Process Owned Companies (Entreprises Dirigées)
      if (companyData.entreprises_dirigees) {
        for (const sub of companyData.entreprises_dirigees) {
          if (!sub.siren) continue;

          // Add Node (Placeholder until fetched)
          if (!this.nodes.has(sub.siren)) {
            // Detect "Radiée" in name for immediate visual feedback
            const isRadiated = sub.denomination?.toLowerCase().includes('(radiée)') || sub.denomination?.toLowerCase().includes('(radiee)');

            this.nodes.set(sub.siren, {
              id: sub.siren,
              label: sub.denomination,
              type: NodeType.COMPANY,
              data: sub,
              degree: current.personDepth,
              status: isRadiated ? 'closed' : 'unknown'
            });
          }

          // Add Link (Entreprise -> Filiale)
          // Build path step for this sub-company with the relationship
          const subStep: PathStep = {
            name: sub.denomination,
            type: NodeType.COMPANY,
            relationFromPrevious: sub.qualite || "Mandataire"
          };

          this.links.push({
            source: current.siren,
            target: sub.siren,
            label: sub.qualite || "Mandataire",
            active: true,
            path: [...currentPath, subStep] // Path from root to this sub-company with relationships
          });

          // Queue for crawling
          if (!this.visited.has(sub.siren)) {
            if (companiesScanned < limit) {
              this.visited.add(sub.siren);
              queue.push({
                siren: sub.siren,
                personDepth: current.personDepth, // Companies don't increment person depth
                path: currentPath,
                lastRelation: sub.qualite || "Mandataire"
              });
            }
          }
        }
      }
    }

    return {
      nodes: Array.from(this.nodes.values()),
      links: this.links,
      stats: this.getStats(companiesScanned, maxDepth)
    };
  }

  private getStats(scanned: number, depth: number): CrawlStats {
    return {
      companiesScanned: scanned,
      peopleFound: Array.from(this.nodes.values()).filter(n => n.type === NodeType.PERSON).length,
      linksFound: this.links.length,
      depthReached: depth,
      errors: this.errors,
      creditsConsumed: this.credits
    };
  }
}