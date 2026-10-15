import { useState, useCallback } from 'react';
import { getDataStore } from '../lib/dataStore';
import { getAssignmentEngine } from '../lib/assignmentRules';

export function useLeadAssignment() {
  const [isAssigning, setIsAssigning] = useState(false);
  const [lastAssignmentResult, setLastAssignmentResult] = useState<{
    assigned: number;
    failed: number;
    timestamp: string;
  } | null>(null);

  const dataStore = getDataStore();
  const engine = getAssignmentEngine();

  /**
   * Auto-assign unassigned leads
   */
  const autoAssignLeads = useCallback(async () => {
    setIsAssigning(true);
    const leads = dataStore.getLeads();
    const unassigned = leads.filter(lead => !lead.assignedTo);

    try {
      if (unassigned.length === 0) {
        setLastAssignmentResult({
          assigned: 0,
          failed: 0,
          timestamp: new Date().toISOString(),
        });
        setIsAssigning(false);
        return { assigned: 0, failed: 0 };
      }

      // Use the assignment engine to assign leads
      const assignments = engine.assignBatch(unassigned);

      // Update leads in data store
      let assignedCount = 0;

      assignments.forEach((telecallerId, leadId) => {
        const updated = dataStore.updateLead(leadId, {
          assignedTo: telecallerId,
          status: 'New',
        });

        if (updated) {
          assignedCount++;
        }
      });

      const result = {
        assigned: assignedCount,
        failed: unassigned.length - assignedCount,
        timestamp: new Date().toISOString(),
      };

      setLastAssignmentResult(result);
      setIsAssigning(false);

      return result;
    } catch (error) {
      console.error('Error during auto-assignment:', error);
      setIsAssigning(false);
      return { assigned: 0, failed: unassigned.length };
    }
  }, [dataStore, engine]);

  /**
   * Assign specific leads to a telecaller
   */
  const assignLeadsToTelecaller = useCallback(async (
    leadIds: string[],
    telecallerId: string
  ) => {
    setIsAssigning(true);

    try {
      const count = dataStore.assignLeads(leadIds, telecallerId);
      setIsAssigning(false);
      return count;
    } catch (error) {
      console.error('Error assigning leads:', error);
      setIsAssigning(false);
      return 0;
    }
  }, [dataStore]);

  /**
   * Get assignment statistics
   */
  const getAssignmentStats = useCallback(() => {
    return engine.getAssignmentStats();
  }, [engine]);

  /**
   * Rebalance all leads
   */
  const rebalanceLeads = useCallback(async () => {
    setIsAssigning(true);

    try {
      const leads = dataStore.getLeads();
      const reassignments = engine.rebalanceLeads(leads);

      let rebalancedCount = 0;
      reassignments.forEach((telecallerId, leadId) => {
        const updated = dataStore.updateLead(leadId, {
          assignedTo: telecallerId,
        });
        if (updated) rebalancedCount++;
      });

      setLastAssignmentResult({
        assigned: rebalancedCount,
        failed: 0,
        timestamp: new Date().toISOString(),
      });

      setIsAssigning(false);
      return rebalancedCount;
    } catch (error) {
      console.error('Error during rebalancing:', error);
      setIsAssigning(false);
      return 0;
    }
  }, [dataStore, engine]);

  return {
    isAssigning,
    lastAssignmentResult,
    autoAssignLeads,
    assignLeadsToTelecaller,
    getAssignmentStats,
    rebalanceLeads,
  };
}
