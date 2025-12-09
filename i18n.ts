// Translations for the application

export type Language = 'fr' | 'en';

export interface Translations {
    // Landing Page
    landing: {
        title: string;
        subtitle: string;
        sirenLabel: string;
        sirenPlaceholder: string;
        depthLabel: string;
        limitLabel: string;
        apiTokenLabel: string;
        apiTokenPlaceholder: string;
        launchButton: string;
        scanning: string;
    };
    // Header
    header: {
        companies: string;
        people: string;
        links: string;
        rescan: string;
        scanning: string;
        stop: string;
        returnToLanding: string;
    };
    // Tabs
    tabs: {
        networkGraph: string;
        dataTable: string;
        alertsTable: string;
        orgChart: string;
        directors: string;
    };
    // Results Table
    table: {
        title: string;
        subtitle: string;
        sourceEntity: string;
        role: string;
        targetEntity: string;
        pathFromRoot: string;
        direct: string;
        noData: string;
    };
    // Alerts Table
    alerts: {
        title: string;
        subtitle: string;
        company: string;
        siren: string;
        status: string;
        procedures: string;
        actions: string;
        verifiedAt: string;
        active: string;
        closed: string;
        noAlerts: string;
        noAlertsSubtitle: string;
        alertCount: string;
        alertsCount: string;
        liquidation: string;
        redressement: string;
    };
    // Sidebar (Node Details)
    sidebar: {
        id: string;
        type: string;
        status: string;
        city: string;
        relationshipPath: string;
        collectiveProcedures: string;
        viewOnPappers: string;
        activeStatus: string;
        closedStatus: string;
    };
    // Common
    common: {
        loading: string;
        cancel: string;
        close: string;
        confirmReturn: string;
    };
    // Loading view
    loading: {
        connecting: string;
        fetching: string;
        calculating: string;
        mapping: string;
        analyzing: string;
        complete: string;
    };
}

export const translations: Record<Language, Translations> = {
    fr: {
        landing: {
            title: 'Explorateur de Réseau',
            subtitle: 'Analysez les connexions entre entreprises et dirigeants',
            sirenLabel: 'SIREN',
            sirenPlaceholder: 'Entrez un numéro SIREN',
            depthLabel: 'Profondeur',
            limitLabel: 'Limite',
            apiTokenLabel: 'Token API',
            apiTokenPlaceholder: 'Token Pappers API',
            launchButton: 'Lancer le Scan',
            scanning: 'Scan en cours...',
        },
        header: {
            companies: 'Entreprises',
            people: 'Personnes',
            links: 'Liens',
            rescan: 'Relancer',
            scanning: 'Scan...',
            stop: 'Arrêter',
            returnToLanding: 'Retour à l\'accueil',
        },
        tabs: {
            networkGraph: 'Graphe Réseau',
            dataTable: 'Tableau de Données',
            alertsTable: 'Tableau des Alertes',
            orgChart: 'Organigramme',
            directors: 'Dirigeants',
        },
        table: {
            title: 'Détails des Connexions',
            subtitle: 'Liste de toutes les relations identifiées dans le réseau',
            sourceEntity: 'Entité Source',
            role: 'Rôle',
            targetEntity: 'Entité Cible',
            pathFromRoot: 'Chemin depuis la Racine',
            direct: 'Direct',
            noData: 'Aucune donnée disponible',
        },
        alerts: {
            title: 'Alertes de Procédures Collectives',
            subtitle: 'Entreprises avec procédures collectives en cours ou passées',
            company: 'Entreprise',
            siren: 'SIREN',
            status: 'Statut',
            procedures: 'Procédures',
            actions: 'Actions',
            verifiedAt: 'Vérifié le',
            active: 'Actif',
            closed: 'Radié/Fermé',
            noAlerts: 'Aucune alerte détectée',
            noAlertsSubtitle: 'Aucune entreprise du réseau n\'a de procédure collective',
            alertCount: 'Alerte',
            alertsCount: 'Alertes',
            liquidation: 'Liquidation judiciaire',
            redressement: 'Redressement judiciaire',
        },
        sidebar: {
            id: 'ID',
            type: 'Type',
            status: 'Statut',
            city: 'Ville',
            relationshipPath: 'Chemin Relationnel',
            collectiveProcedures: 'Procédures Collectives',
            viewOnPappers: 'Voir sur Pappers.fr',
            activeStatus: 'Actif',
            closedStatus: 'Radié/Fermé',
        },
        common: {
            loading: 'Chargement...',
            cancel: 'Annuler',
            close: 'Fermer',
            confirmReturn: 'Retourner à la page d\'accueil ? Cela effacera vos résultats actuels.',
        },
        loading: {
            connecting: 'Connexion à l\'API Pappers...',
            fetching: 'Récupération des données...',
            calculating: 'Calcul des relations...',
            mapping: 'Cartographie du réseau...',
            analyzing: 'Analyse des structures...',
            complete: '% terminé',
        },
    },
    en: {
        landing: {
            title: 'Network Explorer',
            subtitle: 'Analyze connections between companies and directors',
            sirenLabel: 'SIREN',
            sirenPlaceholder: 'Enter a SIREN number',
            depthLabel: 'Depth',
            limitLabel: 'Limit',
            apiTokenLabel: 'API Token',
            apiTokenPlaceholder: 'Pappers API Token',
            launchButton: 'Launch Scan',
            scanning: 'Scanning...',
        },
        header: {
            companies: 'Companies',
            people: 'People',
            links: 'Links',
            rescan: 'Rescan',
            scanning: 'Scanning...',
            stop: 'Stop',
            returnToLanding: 'Return to landing page',
        },
        tabs: {
            networkGraph: 'Network Graph',
            dataTable: 'Data Table',
            alertsTable: 'Alerts Table',
            orgChart: 'Org Chart',
            directors: 'Directors',
        },
        table: {
            title: 'Connection Details',
            subtitle: 'List of all identified relationships within the network',
            sourceEntity: 'Source Entity',
            role: 'Role',
            targetEntity: 'Target Entity',
            pathFromRoot: 'Path from Root',
            direct: 'Direct',
            noData: 'No data available',
        },
        alerts: {
            title: 'Collective Procedure Alerts',
            subtitle: 'Companies with current or past collective procedures',
            company: 'Company',
            siren: 'SIREN',
            status: 'Status',
            procedures: 'Procedures',
            actions: 'Actions',
            verifiedAt: 'Verified at',
            active: 'Active',
            closed: 'Closed/Inactive',
            noAlerts: 'No Alerts Found',
            noAlertsSubtitle: 'No companies in this network have collective procedures',
            alertCount: 'Alert',
            alertsCount: 'Alerts',
            liquidation: 'Judicial Liquidation',
            redressement: 'Judicial Reorganization',
        },
        sidebar: {
            id: 'ID',
            type: 'Type',
            status: 'Status',
            city: 'City',
            relationshipPath: 'Relationship Path',
            collectiveProcedures: 'Collective Procedures',
            viewOnPappers: 'View on Pappers.fr',
            activeStatus: 'Active',
            closedStatus: 'Closed/Inactive',
        },
        common: {
            loading: 'Loading...',
            cancel: 'Cancel',
            close: 'Close',
            confirmReturn: 'Return to landing page? This will clear your current results.',
        },
        loading: {
            connecting: 'Connecting to Pappers API...',
            fetching: 'Fetching Node Data...',
            calculating: 'Calculating Relations...',
            mapping: 'Mapping Network Topology...',
            analyzing: 'Analyzing Corporate Structures...',
            complete: '% complete',
        },
    },
};
