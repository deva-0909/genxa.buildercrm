// Automated Lead Assignment Engine
import { getDataStore } from './dataStore';

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email: string;
  source: string;
  project: string;
  status: string;
  assignedTo: string | null;
  priority: 'Hot' | 'Warm' | 'Cold';
  createdAt: string;
  budget?: string;
}

export interface Telecaller {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Inactive';
  currentLoad: number;
  maxLoad: number;
  projectSpecialization: string[];
  sourceSpecialization: string[];
  workingHours: {
    start: string;
    end: string;
  };
  performance: {
    contactRate: number;
    conversionRate: number;
  };
}

export interface AssignmentRule {
  type: 'project' | 'source' | 'load' | 'time' | 'performance';
  priority: number;
  enabled: boolean;
}

export class LeadAssignmentEngine {
  private telecallers: Telecaller[];
  private rules: AssignmentRule[];

  constructor(telecallers: Telecaller[], rules?: AssignmentRule[]) {
    this.telecallers = telecallers;
    this.rules = rules || this.getDefaultRules();
  }

  private getDefaultRules(): AssignmentRule[] {
    return [
      { type: 'time', priority: 1, enabled: true }, // Check working hours first
      { type: 'project', priority: 2, enabled: true }, // Project specialization
      { type: 'source', priority: 3, enabled: true }, // Source specialization
      { type: 'load', priority: 4, enabled: true }, // Load balancing
      { type: 'performance', priority: 5, enabled: true }, // Performance-based
    ];
  }

  /**
   * Main assignment method - assigns lead to best available telecaller
   */
  assignLead(lead: Lead): string | null {
    const availableTelecallers = this.getAvailableTelecallers();

    if (availableTelecallers.length === 0) {
      return null; // No telecallers available
    }

    // Apply rules in priority order
    let candidates = availableTelecallers;

    for (const rule of [...this.rules].sort((a, b) => a.priority - b.priority)) {
      if (!rule.enabled) continue;

      let next = candidates;
      switch (rule.type) {
        case 'time':
          next = this.filterByWorkingHours(candidates);
          break;
        case 'project':
          next = this.filterByProject(candidates, lead);
          break;
        case 'source':
          next = this.filterBySource(candidates, lead);
          break;
        case 'load':
          next = this.filterByLoad(candidates);
          break;
        case 'performance':
          next = this.sortByPerformance(candidates);
          break;
      }

      // If a rule filters out everyone (e.g. lead arrives after working hours),
      // skip that rule and keep the previous candidates instead of dropping the lead.
      if (next.length > 0) candidates = next;
    }

    // Return the best candidate or use round-robin if multiple
    return candidates.length > 0 ? this.selectBestCandidate(candidates) : null;
  }

  /**
   * Filter telecallers by working hours
   */
  private filterByWorkingHours(telecallers: Telecaller[]): Telecaller[] {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return telecallers.filter(tc => {
      const [startHour, startMin] = tc.workingHours.start.split(':').map(Number);
      const [endHour, endMin] = tc.workingHours.end.split(':').map(Number);

      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      return currentTime >= startTime && currentTime <= endTime;
    });
  }

  /**
   * Filter telecallers by project specialization
   */
  private filterByProject(telecallers: Telecaller[], lead: Lead): Telecaller[] {
    const specialized = telecallers.filter(tc =>
      tc.projectSpecialization.length === 0 ||
      tc.projectSpecialization.includes(lead.project)
    );

    // If no specialists, return all
    return specialized.length > 0 ? specialized : telecallers;
  }

  /**
   * Filter telecallers by source specialization
   */
  private filterBySource(telecallers: Telecaller[], lead: Lead): Telecaller[] {
    const sourceType = this.getSourceType(lead.source);

    const specialized = telecallers.filter(tc =>
      tc.sourceSpecialization.length === 0 ||
      tc.sourceSpecialization.includes(sourceType)
    );

    return specialized.length > 0 ? specialized : telecallers;
  }

  /**
   * Filter telecallers by current load (capacity)
   */
  private filterByLoad(telecallers: Telecaller[]): Telecaller[] {
    // Filter out telecallers at max capacity
    const available = telecallers.filter(tc => tc.currentLoad < tc.maxLoad);

    if (available.length === 0) {
      // If all are at capacity, return those with lowest load
      const minLoad = Math.min(...telecallers.map(tc => tc.currentLoad));
      return telecallers.filter(tc => tc.currentLoad === minLoad);
    }

    // Sort by load (ascending) - assign to least loaded
    return available.sort((a, b) => a.currentLoad - b.currentLoad);
  }

  /**
   * Sort telecallers by performance metrics
   */
  private sortByPerformance(telecallers: Telecaller[]): Telecaller[] {
    return telecallers.sort((a, b) => {
      // Weighted score: 60% contact rate + 40% conversion rate
      const scoreA = (a.performance.contactRate * 0.6) + (a.performance.conversionRate * 0.4);
      const scoreB = (b.performance.contactRate * 0.6) + (b.performance.conversionRate * 0.4);
      return scoreB - scoreA; // Descending order
    });
  }

  /**
   * Get available telecallers (active status)
   */
  private getAvailableTelecallers(): Telecaller[] {
    return this.telecallers.filter(tc => tc.status === 'Active');
  }

  /**
   * Select best candidate from filtered list
   */
  private selectBestCandidate(candidates: Telecaller[]): string {
    // Return the first candidate (already sorted by rules)
    return candidates[0].id;
  }

  /**
   * Get source type categorization
   */
  private getSourceType(source: string): string {
    if (source.toLowerCase().includes('facebook') ||
        source.toLowerCase().includes('google') ||
        source.toLowerCase().includes('ads')) {
      return 'Digital';
    }

    if (source.toLowerCase().includes('housing') ||
        source.toLowerCase().includes('magic') ||
        source.toLowerCase().includes('99acres')) {
      return 'Portal';
    }

    if (source.toLowerCase().includes('cp') ||
        source.toLowerCase().includes('channel')) {
      return 'CP';
    }

    if (source.toLowerCase().includes('walk')) {
      return 'Offline';
    }

    return 'Other';
  }

  /**
   * Batch assign multiple leads
   */
  assignBatch(leads: Lead[]): Map<string, string> {
    const assignments = new Map<string, string>();

    // Sort leads by priority first
    const sortedLeads = [...leads].sort((a, b) => {
      const priorityOrder = { 'Hot': 0, 'Warm': 1, 'Cold': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const lead of sortedLeads) {
      const assignedTo = this.assignLead(lead);
      if (assignedTo) {
        assignments.set(lead.id, assignedTo);

        // Update telecaller load for next iteration
        const telecaller = this.telecallers.find(tc => tc.id === assignedTo);
        if (telecaller) {
          telecaller.currentLoad += 1;
        }
      }
    }

    return assignments;
  }

  /**
   * Get assignment statistics
   */
  getAssignmentStats(): {
    totalTelecallers: number;
    activeTelecallers: number;
    averageLoad: number;
    maxLoad: number;
    utilizationRate: number;
  } {
    const active = this.getAvailableTelecallers();
    const totalLoad = active.reduce((sum, tc) => sum + tc.currentLoad, 0);
    const totalCapacity = active.reduce((sum, tc) => sum + tc.maxLoad, 0);

    return {
      totalTelecallers: this.telecallers.length,
      activeTelecallers: active.length,
      averageLoad: active.length > 0 ? totalLoad / active.length : 0,
      maxLoad: Math.max(...active.map(tc => tc.currentLoad), 0),
      utilizationRate: totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0,
    };
  }

  /**
   * Rebalance leads across telecallers
   */
  rebalanceLeads(leads: Lead[]): Map<string, string> {
    // Reset current loads
    this.telecallers.forEach(tc => tc.currentLoad = 0);

    // Count current assignments
    const loadCount = new Map<string, number>();
    leads.forEach(lead => {
      if (lead.assignedTo) {
        loadCount.set(lead.assignedTo, (loadCount.get(lead.assignedTo) || 0) + 1);
      }
    });

    // Update telecaller loads
    this.telecallers.forEach(tc => {
      tc.currentLoad = loadCount.get(tc.id) || 0;
    });

    // Find unassigned leads and reassign
    const unassigned = leads.filter(lead => !lead.assignedTo);
    return this.assignBatch(unassigned);
  }
}

// Helper function to create default telecallers
export function createDefaultTelecallers(): Telecaller[] {
  return [
    {
      id: 'TC001',
      name: 'Rajesh Kumar',
      role: 'Telecaller',
      status: 'Active',
      currentLoad: 0,
      maxLoad: 50,
      projectSpecialization: ['Skyline Heights', 'Metro Plaza'],
      sourceSpecialization: ['Digital', 'Portal'],
      workingHours: { start: '09:00', end: '18:00' },
      performance: { contactRate: 75, conversionRate: 24 }
    },
    {
      id: 'TC002',
      name: 'Sneha Reddy',
      role: 'Telecaller',
      status: 'Active',
      currentLoad: 0,
      maxLoad: 50,
      projectSpecialization: ['Green Valley', 'Ocean View'],
      sourceSpecialization: ['Digital', 'Portal'],
      workingHours: { start: '09:00', end: '18:00' },
      performance: { contactRate: 72, conversionRate: 22 }
    },
    {
      id: 'TC003',
      name: 'Amit Patel',
      role: 'Telecaller',
      status: 'Active',
      currentLoad: 0,
      maxLoad: 45,
      projectSpecialization: [],
      sourceSpecialization: ['CP', 'Offline'],
      workingHours: { start: '10:00', end: '19:00' },
      performance: { contactRate: 68, conversionRate: 20 }
    },
    {
      id: 'TC004',
      name: 'Priya Sharma',
      role: 'Senior Telecaller',
      status: 'Active',
      currentLoad: 0,
      maxLoad: 60,
      projectSpecialization: [],
      sourceSpecialization: [],
      workingHours: { start: '09:00', end: '18:00' },
      performance: { contactRate: 78, conversionRate: 26 }
    }
  ];
}

/**
 * Build the engine from the telecallers in Master Setup. Telecallers are identified
 * by name (the same value stored in lead.assignedTo), so assigned leads show up on
 * that telecaller's dashboard. Specialisation and performance settings come from
 * the defaults above when a name matches, otherwise the telecaller takes any lead.
 */
export function getAssignmentEngine(): LeadAssignmentEngine {
  const store = getDataStore();
  const defaults = createDefaultTelecallers();
  const leads = store.getLeads();
  const telecallers: Telecaller[] = store.getUsers()
    .filter(u => u.role === 'Telecaller')
    .map(u => {
      const preset = defaults.find(d => d.name === u.name);
      return {
        id: u.name,
        name: u.name,
        role: u.role,
        status: u.status,
        currentLoad: leads.filter(l => l.assignedTo === u.name && !['Dead'].includes(l.status)).length,
        maxLoad: u.target || 50,
        projectSpecialization: preset?.projectSpecialization ?? [],
        sourceSpecialization: preset?.sourceSpecialization ?? [],
        workingHours: preset?.workingHours ?? { start: '09:00', end: '19:00' },
        performance: preset?.performance ?? { contactRate: 70, conversionRate: 20 },
      };
    });
  return new LeadAssignmentEngine(telecallers);
}
