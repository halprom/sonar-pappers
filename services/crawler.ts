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

  // Demo Mock Data Generator - Creates a vast network for demonstration
  private async mockFetch(siren: string): Promise<PappersCompany> {
    await new Promise(r => setTimeout(r, 300)); // Simulate latency

    // Deterministic pseudo-random generation based on SIREN
    const isRoot = siren === MOCK_DATA_ROOT_SIREN;
    const sirenNum = parseInt(siren) || 443061841;
    const suffix = siren.slice(-3);
    const depthIndicator = siren.slice(-4, -3);

    // Determine company characteristics based on SIREN patterns
    const activeWithProcedure = suffix.endsWith('2');
    const radiatedOnly = suffix.endsWith('3');
    const radiatedWithProcedure = suffix.endsWith('4');
    const isRadiated = radiatedOnly || radiatedWithProcedure;
    const hasProcedure = activeWithProcedure || radiatedWithProcedure;

    // Generate diverse company names
    const companyPrefixes = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'OMEGA', 'NEXUS', 'VERTEX', 'AXIOM', 'PRISM', 'ZENITH'];
    const companySuffixes = ['TECH', 'INVEST', 'CAPITAL', 'HOLDINGS', 'GROUP', 'VENTURES', 'PARTNERS', 'SOLUTIONS', 'DYNAMICS', 'SYSTEMS'];
    const prefixIdx = sirenNum % companyPrefixes.length;
    const suffixIdx = (sirenNum + 3) % companySuffixes.length;

    let name = `${companyPrefixes[prefixIdx]} ${companySuffixes[suffixIdx]}`;
    if (isRoot) name = "GOOGLE FRANCE";
    else if (activeWithProcedure) name = `${companyPrefixes[prefixIdx]} (Proc. Coll.)`;
    else if (radiatedOnly) name = `${companyPrefixes[prefixIdx]} (Radiée)`;
    else if (radiatedWithProcedure) name = `${companyPrefixes[prefixIdx]} (Radiée + Proc.)`;

    // Generate diverse person names
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Antoine', 'Camille', 'Louis', 'Emma', 'Hugo', 'Léa', 'Lucas', 'Chloé'];
    const lastNames = ['MARTIN', 'BERNARD', 'DUBOIS', 'THOMAS', 'ROBERT', 'RICHARD', 'PETIT', 'DURAND', 'LEROY', 'MOREAU', 'SIMON', 'LAURENT'];
    const roles = ['Président', 'Directeur Général', 'Gérant', 'Administrateur', 'Commissaire aux comptes'];

    // Generate representatives - 1-2 different people per company (reduced for demo)
    const numReps = 1 + (sirenNum % 2);
    const representants: any[] = [];

    for (let i = 0; i < numReps; i++) {
      const nameIdx = (sirenNum + i * 7) % firstNames.length;
      const surnameIdx = (sirenNum + i * 11) % lastNames.length;
      const roleIdx = i % roles.length;
      const birthYear = 1960 + ((sirenNum + i * 5) % 30);
      const birthMonth = 1 + ((sirenNum + i) % 12);
      const birthDay = 1 + ((sirenNum + i * 3) % 28);

      representants.push({
        qualite: roles[roleIdx],
        personne_morale: false,
        nom: lastNames[surnameIdx],
        prenom: firstNames[nameIdx],
        date_naissance: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
        actuel: true
      });
    }

    // Add 1 holding company as moral person representative (reduced for demo)
    const numHoldings = isRoot ? 1 : 0;
    for (let i = 0; i < numHoldings; i++) {
      const holdingIdx = (sirenNum + i * 13) % companyPrefixes.length;
      representants.push({
        qualite: 'Holding',
        personne_morale: true,
        denomination: `${companyPrefixes[holdingIdx]} HOLDING`,
        siren: String((sirenNum + 100 + i * 50) % 1000000000).padStart(9, '4'),
        actuel: true
      });
    }

    // Generate subsidiaries - Root company has 3, others have 1-2 (reduced for demo)
    const entreprises_dirigees: any[] = [];
    const numSubsidiaries = isRoot ? 3 : Math.max(0, 2 - parseInt(depthIndicator) || 0);

    for (let i = 0; i < numSubsidiaries; i++) {
      const subSiren = String((sirenNum + 1000 + i * 111) % 1000000000).padStart(9, '4');
      const subNameIdx = (sirenNum + i * 17) % companyPrefixes.length;
      const subSuffixIdx = (sirenNum + i * 19) % companySuffixes.length;
      const subRoleIdx = i % roles.length;

      // Add variety - some with procedures, some radiated
      let subName = `${companyPrefixes[subNameIdx]} ${companySuffixes[subSuffixIdx]}`;
      if (i === 1 && isRoot) subName = `${companyPrefixes[subNameIdx]} (Proc. Coll.)`;
      if (i === 2 && isRoot) subName = `${companyPrefixes[subNameIdx]} (Radiée)`;
      if (i === 3 && isRoot) subName = `${companyPrefixes[subNameIdx]} (Radiée + Proc.)`;

      entreprises_dirigees.push({
        siren: subSiren,
        denomination: subName,
        qualite: roles[subRoleIdx]
      });
    }

    return {
      siren,
      denomination: name,
      forme_juridique: ['SAS', 'SARL', 'SA', 'SCI'][sirenNum % 4],
      date_creation: `${2000 + (sirenNum % 20)}-01-01`,
      statut_rcs: isRadiated ? 'Radié' : 'Inscrit',
      siege: {
        ville: ['PARIS', 'LYON', 'MARSEILLE', 'TOULOUSE', 'NICE', 'NANTES', 'BORDEAUX', 'LILLE'][sirenNum % 8],
        code_postal: String(75000 + (sirenNum % 95)).slice(0, 5)
      },
      procedures_collectives: hasProcedure ? [
        { type: 'Liquidation judiciaire', date_debut: `2023-${String(1 + (sirenNum % 12)).padStart(2, '0')}-15` }
      ] : [],
      representants,
      entreprises_dirigees
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