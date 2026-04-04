export type BodyType = 'star' | 'planet' | 'moon' | 'asteroid' | 'station';

export type StructureType = 'mine' | 'power_plant' | 'refinery' | 'research_lab';

export interface CelestialBodySummary {
  id: string;
  name: string;
  type: BodyType;
  x: number;
  y: number;
  z: number;
  radius: number;
  resourceRichness: number;
  ownerUsername: string | null;
  distance?: number;
}

export interface CelestialBodyDetail extends CelestialBodySummary {
  structures: StructureInfo[];
  resources: ResourceStoreInfo | null;
}

export interface StructureInfo {
  id: string;
  type: StructureType;
  level: number;
  operational: boolean;
  completesAt: string | null;
}

export interface ResourceStoreInfo {
  minerals: number;
  energy: number;
  alloys: number;
  credits: number;
  researchPoints: number;
  lastCalculatedAt: string;
}

export interface PlayerStatus {
  username: string;
  bodies: CelestialBodySummary[];
  totalResources: ResourceStoreInfo;
  activeConstruction: StructureInfo[];
  activeResearch: ResearchInfo | null;
  recentLogs: LogEntryInfo[];
}

export interface TechnologyInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  cost: number;
  durationSeconds: number;
  prerequisiteId: string | null;
  status: 'available' | 'locked' | 'in_progress' | 'completed';
}

export interface ResearchInfo {
  id: string;
  technologyId: string;
  technologyName: string;
  startedAt: string;
  completesAt: string;
  completed: boolean;
}

export interface LogEntryInfo {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export interface StructureCost {
  minerals: number;
  energy: number;
  alloys: number;
}

export const STRUCTURE_DEFINITIONS: Record<
  StructureType,
  {
    name: string;
    cost: StructureCost;
    buildTimeSeconds: number;
    prerequisiteTech: string | null;
    production: {
      minerals?: number;
      energy?: number;
      alloys?: number;
      researchPoints?: number;
      mineralConsumption?: number;
    };
  }
> = {
  mine: {
    name: 'Mine',
    cost: { minerals: 100, energy: 0, alloys: 0 },
    buildTimeSeconds: 300,
    prerequisiteTech: null,
    production: { minerals: 10 },
  },
  power_plant: {
    name: 'Power Plant',
    cost: { minerals: 100, energy: 0, alloys: 0 },
    buildTimeSeconds: 300,
    prerequisiteTech: null,
    production: { energy: 10 },
  },
  refinery: {
    name: 'Refinery',
    cost: { minerals: 200, energy: 50, alloys: 0 },
    buildTimeSeconds: 900,
    prerequisiteTech: 'basic_industry',
    production: { alloys: 5, mineralConsumption: 10 },
  },
  research_lab: {
    name: 'Research Lab',
    cost: { minerals: 200, energy: 100, alloys: 0 },
    buildTimeSeconds: 900,
    prerequisiteTech: null,
    production: { researchPoints: 5 },
  },
};

export const STARTING_RESOURCES = {
  minerals: 500,
  energy: 200,
  alloys: 0,
  credits: 0,
  researchPoints: 0,
};
