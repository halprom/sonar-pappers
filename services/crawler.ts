import axios from 'axios';
import { PappersCompany, GraphNode, GraphLink, NodeType, LinkCost, CrawlStats, CrawlError, PathStep } from '../types';
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

    // HYBRID TRAVERSAL ALGORITHM
    // Queue stores { siren, networkDepth, path, lastRelation, lastLinkCost }
    // networkDepth ONLY increments for COSTLY links (network jumps via persons/upward links)
    // FREE links (descending org chart to subsidiaries) do NOT increment depth
    interface QueueItem {
      siren: string;
      networkDepth: number;  // Budget consumed by COSTLY links only
      path: PathStep[];
      lastRelation?: string;
      entryLinkCost?: LinkCost;  // Cost of the link that led here
    }

    const queue: QueueItem[] = [{
      siren: rootSiren,
      networkDepth: 0,
      path: [],
      entryLinkCost: LinkCost.FREE // Root is free to explore
    }];

    this.visited.add(rootSiren);

    let companiesScanned = 0;

    while (queue.length > 0) {
      if (this.cancelFlag) break;

      // CRITICAL: Check limit BEFORE fetching to prevent extra API calls
      if (companiesScanned >= limit) {
        break;
      }

      const current = queue.shift()!;

      // Notify progress
      onProgress(this.getStats(companiesScanned, current.networkDepth));

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

      // =========================================================
      // DETECT COLLECTIVE PROCEDURES (ALERTS)
      // Check both procedures_collectives AND publications_bodacc
      // =========================================================
      const ALERT_KEYWORDS = ['conciliation', 'observation', 'redressement', 'liquidation', 'sauvegarde'];
      let hasAlert = false;
      let procedures: any[] = [];

      // 1. Check procedures_collectives field (standard field)
      if (companyData.procedure_collective_existe || (companyData.procedures_collectives && companyData.procedures_collectives.length > 0)) {
        if (companyData.procedures_collectives) {
          for (const proc of companyData.procedures_collectives) {
            const procType = (proc.type || '').toLowerCase();
            if (ALERT_KEYWORDS.some(kw => procType.includes(kw))) {
              hasAlert = true;
              procedures.push(proc);
            }
          }
        } else {
          // procedure_collective_existe is true but no details - flag as alert anyway
          hasAlert = true;
        }
      }

      // 2. Check publications_bodacc for type="Procédure collective" (for radiated companies)
      if (companyData.publications_bodacc && Array.isArray(companyData.publications_bodacc)) {
        for (const pub of companyData.publications_bodacc) {
          if (pub.type && pub.type.toLowerCase().includes('procédure collective')) {
            // Check nature/famille for specific keywords
            const nature = (pub.nature || '').toLowerCase();
            const famille = (pub.famille || '').toLowerCase();
            if (ALERT_KEYWORDS.some(kw => nature.includes(kw) || famille.includes(kw))) {
              hasAlert = true;
              // Add as procedure if not already detected
              const procedureFromBodacc = {
                type: pub.nature || pub.famille || 'Procédure collective',
                date_debut: pub.date_jugement || pub.date,
                date_fin: null,
                source: 'BODACC'
              };
              procedures.push(procedureFromBodacc);
            }
          }
        }
      }

      console.log(`[Crawler] ${currentLabel} (${current.siren}) - hasAlert: ${hasAlert}, procedures: ${procedures.length}`);

      // 1. Process/Update the Company Node
      if (this.nodes.has(current.siren)) {
        const existingNode = this.nodes.get(current.siren)!;
        existingNode.data = companyData;
        existingNode.status = status;
        existingNode.label = currentLabel;
        existingNode.hasAlert = hasAlert;
        existingNode.procedures = procedures;
        if (existingNode.type !== NodeType.ROOT) existingNode.type = NodeType.COMPANY;
      } else {
        this.nodes.set(current.siren, {
          id: current.siren,
          label: currentLabel,
          type: current.siren === rootSiren ? NodeType.ROOT : NodeType.COMPANY,
          data: companyData,
          degree: current.networkDepth,
          status: status,
          hasAlert: hasAlert,
          procedures: procedures
        });
      }

      // =========================================================
      // HYBRID TRAVERSAL: Process Representatives (COSTLY links)
      // =========================================================
      if (companyData.representants) {
        for (const rep of companyData.representants) {

          // --- FILTER: Exclude Statutory Auditors ---
          if (rep.qualite && rep.qualite.toLowerCase().includes('commissaire aux comptes')) {
            continue;
          }

          const repId = generatePersonId(rep);
          const repLabel = rep.personne_morale ? (rep.denomination || repId) : (rep.nom_complet || `${rep.prenom} ${rep.nom}`);
          const isPersonMoral = rep.personne_morale === true;

          // Check if we can traverse this link based on depth budget
          // Physical persons are COSTLY network jumps
          if (!isPersonMoral && current.networkDepth >= maxDepth) {
            continue;
          }

          const repLinkCost = LinkCost.COSTLY;

          // Add Node
          if (!this.nodes.has(repId)) {
            this.nodes.set(repId, {
              id: repId,
              label: repLabel,
              type: isPersonMoral ? NodeType.COMPANY : NodeType.PERSON,
              data: rep,
              degree: current.networkDepth + 1,
              status: 'active'
            });
          }

          // Add Link (Dirigeant -> Entreprise)
          const repStep: PathStep = {
            name: repLabel,
            type: isPersonMoral ? NodeType.COMPANY : NodeType.PERSON,
            relationFromPrevious: rep.qualite
          };

          this.links.push({
            source: repId,
            target: current.siren,
            label: rep.qualite,
            active: rep.actuel !== false,
            path: [...currentPath, repStep],
            cost: repLinkCost
          });

          // 1. Case: Moral Person (Company)
          // Traverse to this company if not visited
          if (isPersonMoral && rep.siren && !this.visited.has(rep.siren)) {
            const newNetworkDepth = current.networkDepth + 1;
            if (newNetworkDepth <= maxDepth && companiesScanned < limit) {
              this.visited.add(rep.siren);
              queue.push({
                siren: rep.siren,
                networkDepth: newNetworkDepth,
                path: currentPath,
                lastRelation: rep.qualite,
                entryLinkCost: LinkCost.COSTLY
              });
            }
          }

          // 2. Case: Physical Person
          // Perform REVERSE SEARCH to find other mandates
          if (!isPersonMoral) {
            const newNetworkDepth = current.networkDepth + 1;
            const hasName = !!(rep.nom && rep.prenom);
            const depthOk = newNetworkDepth <= maxDepth;
            const limitOk = companiesScanned < limit;

            console.log(`[Crawler] Checking Rep: ${repLabel} (Moral: ${isPersonMoral}) - Depth: ${newNetworkDepth}/${maxDepth} (${depthOk}) - HasName: ${hasName} - Limit: ${limitOk}`);

            if (hasName && depthOk && limitOk) {

              // Fetch other companies managed by this person
              console.log(`[Crawler] triggering fetchPersonMandates for ${rep.nom} ${rep.prenom}`);
              const mandates = await this.fetchPersonMandates(rep.nom!, rep.prenom!, rep.date_naissance);

              for (const mandate of mandates) {
                if (mandate.siren === current.siren) continue; // Skip current company
                if (!mandate.siren) continue;

                // Add Mandate Node (Company)
                if (!this.nodes.has(mandate.siren)) {
                  this.nodes.set(mandate.siren, {
                    id: mandate.siren,
                    label: mandate.denomination,
                    type: NodeType.COMPANY,
                    data: mandate,
                    degree: newNetworkDepth,
                    status: 'unknown'
                  });
                }

                // Add Link (Person -> Mandate)
                // This completes the jump: Company A <- Person -> Company B
                this.links.push({
                  source: repId,
                  target: mandate.siren,
                  label: "Mandataire", // We might not know exact role from search, assume generic
                  active: true,
                  path: [...currentPath, repStep], // Path extends from Person
                  cost: LinkCost.COSTLY
                });

                // Queue Mandate for crawling
                if (!this.visited.has(mandate.siren) && companiesScanned < limit) {
                  this.visited.add(mandate.siren);
                  queue.push({
                    siren: mandate.siren,
                    networkDepth: newNetworkDepth, // Consumed 1 depth for the Person Jump
                    path: [...currentPath, repStep], // Path flows through person
                    lastRelation: "Mandataire",
                    entryLinkCost: LinkCost.COSTLY
                  });
                }
              }
            }
          }
        }
      }

      // =========================================================
      // HYBRID TRAVERSAL: Process Owned Companies (FREE links)
      // =========================================================
      if (companyData.entreprises_dirigees) {
        for (const sub of companyData.entreprises_dirigees) {
          if (!sub.siren) continue;

          // Add Node
          if (!this.nodes.has(sub.siren)) {
            // ... existing logic
            const isRadiated = sub.denomination?.toLowerCase().includes('(radiée)') || sub.denomination?.toLowerCase().includes('(radiee)');
            this.nodes.set(sub.siren, {
              id: sub.siren,
              label: sub.denomination,
              type: NodeType.COMPANY,
              data: sub,
              degree: current.networkDepth,
              status: isRadiated ? 'closed' : 'unknown'
            });
          }

          // Add Link
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
            path: [...currentPath, subStep],
            cost: LinkCost.FREE
          });

          // Queue
          if (!this.visited.has(sub.siren)) {
            if (companiesScanned < limit) {
              this.visited.add(sub.siren);
              queue.push({
                siren: sub.siren,
                networkDepth: current.networkDepth,
                path: currentPath,
                lastRelation: sub.qualite || "Mandataire",
                entryLinkCost: LinkCost.FREE
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

  // Find other companies managed by a physical person using /recherche-dirigeants
  private async fetchPersonMandates(nom: string, prenom: string, dateNaissance?: string): Promise<{ siren: string, denomination: string }[]> {
    if (this.apiKey === 'DEMO') {
      return [];
    }

    try {
      const params: any = {
        api_token: this.apiKey,
        nom_dirigeant: nom,
        prenom_dirigeant: prenom,
        type_dirigeant: 'physique',
        par_page: 100 // Get many results
      };

      // Date format for Pappers: JJ-MM-AAAA
      if (dateNaissance) {
        const [y, m, d] = dateNaissance.split('-');
        if (y && m && d) {
          const formattedDate = `${d}-${m}-${y}`;
          params.date_de_naissance_dirigeant_min = formattedDate;
          params.date_de_naissance_dirigeant_max = formattedDate;
        }
      }

      console.log(`[Crawler] Searching mandates for ${prenom} ${nom} (${dateNaissance}) via /recherche-dirigeants`, params);

      const response = await axios.get(`${PAPPERS_API_URL}/recherche-dirigeants`, { params });
      this.credits += 1;

      // Response structure: { resultats: [{ nom, prenom, ..., entreprises: [{siren, denomination, ...}] }], total, page }
      if (response.data && response.data.resultats && response.data.resultats.length > 0) {
        // Get enterprises from all matching directors
        const allEnterprises: { siren: string, denomination: string }[] = [];

        for (const dirigeant of response.data.resultats) {
          if (dirigeant.entreprises && Array.isArray(dirigeant.entreprises)) {
            for (const ent of dirigeant.entreprises) {
              if (ent.siren) {
                allEnterprises.push({
                  siren: ent.siren,
                  denomination: ent.nom_entreprise || ent.denomination || ent.siren
                });
              }
            }
          }
        }

        console.log(`[Crawler] Found ${allEnterprises.length} mandates for ${prenom} ${nom}`);
        return allEnterprises;
      }

      console.log(`[Crawler] No mandates found for ${prenom} ${nom}`);
      return [];

    } catch (err) {
      console.warn("Failed to fetch mandates for person:", nom, prenom, err);
      return [];
    }
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