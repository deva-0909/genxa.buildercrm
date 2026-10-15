import { useState, useEffect } from 'react';
import { X, RefreshCw, Building } from 'lucide-react';
import { getDataStore } from '../lib/dataStore';

interface CheckAvailabilityDialogProps {
  onClose: () => void;
}

export function CheckAvailabilityDialog({ onClose }: CheckAvailabilityDialogProps) {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTower, setSelectedTower] = useState('Tower A');
  const [floorPlan, setFloorPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const dataStore = getDataStore();
  const projects = dataStore.getProjects();

  // Refresh availability when project/tower changes
  useEffect(() => {
    if (selectedProject) {
      loadAvailability();
    }
  }, [selectedProject, selectedTower]);

  const loadAvailability = () => {
    setLoading(true);
    setTimeout(() => {
      generateFloorPlan();
      setLoading(false);
    }, 500);
  };

  const generateFloorPlan = () => {
    const bookings = dataStore.getBookings();
    const blockedUnits = dataStore.getBlockedUnits();

    const floors = 15;
    const unitsPerFloor = 4;

    const newFloorPlan = [];

    for (let f = 1; f <= floors; f++) {
      const floorUnits = [];
      for (let u = 1; u <= unitsPerFloor; u++) {
        const unitNum = `${selectedTower.split(' ')[1]}-${f}0${u}`; // e.g., A-101

        const booking = bookings.find(b => b.project === selectedProject && b.unit === unitNum);
        const block = blockedUnits.find(b => b.project === selectedProject && b.unit === unitNum && b.status === 'Active');

        let status = 'Available';
        let detail: string | null = null;

        if (booking) {
          status = 'Sold';
          detail = booking.customer;
        } else if (block) {
          status = 'Blocked';
          detail = `${block.customer} (Exp: ${block.expiryDate})`;
        }

        floorUnits.push({
          number: unitNum,
          status,
          detail,
          type: u <= 2 ? '2 BHK' : '3 BHK'
        });
      }
      newFloorPlan.push({ floor: f, units: floorUnits });
    }

    // Reverse to show top floors first like a real building
    setFloorPlan(newFloorPlan.reverse());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 border-green-200 text-green-700 hover:bg-green-200';
      case 'Sold': return 'bg-red-100 border-red-200 text-red-700 opacity-75';
      case 'Blocked': return 'bg-yellow-100 border-yellow-200 text-yellow-700 hover:bg-yellow-200';
      default: return 'bg-gray-100 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Unit Availability Status
            </h3>
            <p className="text-sm text-gray-600">Real-time inventory grid</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4 items-center shrink-0">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Select Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          {selectedProject && (
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={selectedTower}
              onChange={(e) => setSelectedTower(e.target.value)}
            >
              <option>Tower A</option>
              <option>Tower B</option>
              <option>Tower C</option>
            </select>
          )}

          <div className="flex-1" />

          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
              <span>Sold</span>
            </div>
          </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {!selectedProject ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Building className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a project to view availability</p>
            </div>
          ) : loading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {floorPlan.map((floor) => (
                <div key={floor.floor} className="flex gap-4 items-center">
                  <div className="w-16 text-sm font-medium text-gray-500 text-right">
                    Floor {floor.floor}
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    {floor.units.map((unit: any) => (
                      <div
                        key={unit.number}
                        className={`
                          border rounded-lg p-3 text-center transition-all cursor-default
                          ${getStatusColor(unit.status)}
                        `}
                        title={unit.detail ? `${unit.status}: ${unit.detail}` : unit.status}
                      >
                        <div className="font-medium text-sm">{unit.number}</div>
                        <div className="text-[10px] mt-1 opacity-75">{unit.type}</div>
                        {unit.status !== 'Available' && (
                          <div className="text-[10px] mt-1 font-medium truncate px-1">
                            {unit.status}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
