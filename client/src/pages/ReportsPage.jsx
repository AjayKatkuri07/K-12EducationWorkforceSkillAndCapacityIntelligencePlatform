import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers
} from 'lucide-react';

export default function ReportsPage() {
  const { role, user } = useAuth();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState('workers');
  const [exporting, setExporting] = useState(false);

  // Mock report generation history
  const reportHistory = [
    {
      id: 'REP-2026-09',
      name: 'District Fall Capacity Deficit & Enrollment Reconciliation',
      format: 'CSV / PDF',
      generatedBy: 'Marcus Sterling (Workforce Planner)',
      date: '2026-09-08 08:30',
      size: '142 KB'
    },
    {
      id: 'REP-2026-08',
      name: 'Annual State Licensure & Special Ed Compliance Audit',
      format: 'PDF',
      generatedBy: 'Dr. Eleanor Vance (HR Admin)',
      date: '2026-09-05 14:15',
      size: '1.2 MB'
    },
    {
      id: 'REP-2026-07',
      name: 'STEM Faculty Workload & Burnout Telemetry Report',
      format: 'CSV',
      generatedBy: 'Sarah Jenkins (Team Lead)',
      date: '2026-09-01 11:00',
      size: '88 KB'
    }
  ];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await reportsAPI.getInventory();
        if (res.data.success) {
          setInventory(res.data.data);
        }
      } catch (err) {
        console.error('[Reports] Error loading inventory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportCSV = (type) => {
    const downloadUrl = reportsAPI.exportCSVUrl(type || selectedReportType);
    window.open(downloadUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>District Administration</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Reports & Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Workforce Inventory & Compliance Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Governed workforce summaries, department capacity balances, and auditable data export generators.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print View</span>
          </button>

          <button
            onClick={() => handleExportCSV(selectedReportType)}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector & Export Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">Dataset Scope:</span>
          <select
            value={selectedReportType}
            onChange={(e) => setSelectedReportType(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 font-semibold focus:ring-1 focus:ring-sky-500"
          >
            <option value="workers">Faculty & Staff Profiles (FTE, Skills, Risk)</option>
            <option value="assignments">Course & Intervention Allocations</option>
            <option value="capacity">Predictive Campus Capacity Forecasts</option>
            <option value="audit">Immutable System Audit Logs</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Reconciled: Today, 08:30 AM (Daily Automated Job)</span>
        </div>
      </div>

      {/* Governed Workforce Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Total Faculty Headcount</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{inventory?.totalWorkers || 14} Members</div>
          <p className="text-[11px] text-slate-500 mt-1">Across 3 district campuses</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Registered Licensures</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{inventory?.totalCerts || 18} Valid</div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            {inventory?.expiringCerts || 4} requiring renewal action
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Allocated Course Sections</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{inventory?.totalAssignments || 8} Sections</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">75% staffed with verified instructors</p>
        </div>
      </div>

      {/* Department Staffing Breakdown & Skill Gap Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department FTE Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Department Headcount & Allocation
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {inventory?.departmentStats &&
              Object.entries(inventory.departmentStats).map(([dept, count], idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{dept}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{count} Staff</span>
                    <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-sky-600 h-full rounded-full" style={{ width: `${(count / 6) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Governed Skill Gap Assessment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Governed Skill Gap Analysis
          </h2>
          <div className="space-y-2 text-xs">
            {inventory?.skillGaps &&
              Object.entries(inventory.skillGaps).slice(0, 5).map(([skillName, detail], idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{skillName}</div>
                    <div className="text-[10px] text-slate-500">{detail.category} • Demand: {detail.demand}</div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        detail.gapStatus === 'Critical Shortage'
                          ? 'bg-rose-100 text-rose-800'
                          : detail.gapStatus === 'Tight Capacity'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {detail.gapStatus}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">{detail.qualifiedStaffCount} Qualified Staff</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Report Generation History Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Saved Report Artifacts & Generation History</h2>
            <p className="text-xs text-slate-500">Historical snapshots retained for state audit compliance.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Report Identifier</th>
                <th className="py-3 px-4">Report Title</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Generated By</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportHistory.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{rep.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{rep.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {rep.format}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{rep.generatedBy}</td>
                  <td className="py-3 px-4 text-slate-500">{rep.date}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleExportCSV('workers')}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center justify-end gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{rep.size}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
