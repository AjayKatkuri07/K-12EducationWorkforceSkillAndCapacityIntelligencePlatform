import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Printer,
  RefreshCw,
  Users,
  Gauge,
  Clock3,
  AlertTriangle,
  ShieldCheck,
  Brain,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  Search,
  Filter,
} from 'lucide-react';

import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatNumber = (value, digits = 0) => {
  const number = Number(value || 0);

  return number.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const formatPercent = (value) => {
  const number = Number(value || 0);

  return `${number.toFixed(1)}%`;
};

const getRiskClass = (risk) => {
  const value = String(risk || '').toLowerCase();

  if (['critical', 'high'].includes(value)) {
    return 'bg-rose-100 text-rose-700 border-rose-200';
  }

  if (['medium', 'moderate', 'warning'].includes(value)) {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }

  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
};

const getGapClass = (status) => {
  if (status === 'Critical Shortage') {
    return 'bg-rose-100 text-rose-700 border-rose-200';
  }

  if (status === 'Tight Capacity') {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }

  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
};

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass = 'bg-sky-50 text-sky-600',
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>

          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {value}
          </p>

          {subtitle && (
            <p className="text-[11px] text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-900">
          {title}
        </h2>

        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { role } = useAuth();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [campus, setCampus] = useState('');
  const [department, setDepartment] = useState('');
  const [risk, setRisk] = useState('');
  const [status, setStatus] = useState('');

  const [selectedReportType, setSelectedReportType] =
    useState('workers');

  const [exporting, setExporting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const loadReports = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = {};

      if (campus) params.campus = campus;
      if (department) params.department = department;
      if (risk) params.risk = risk;
      if (status) params.status = status;

      const response = await reportsAPI.getInventory(params);

      if (response.data?.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('[Reports] Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [campus, department, risk, status]);

  const clearFilters = () => {
    setCampus('');
    setDepartment('');
    setRisk('');
    setStatus('');
    setSearchTerm('');
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);

      const params = {};

      if (campus) params.campus = campus;
      if (department) params.department = department;
      if (risk) params.risk = risk;
      if (status) params.status = status;

      const response = await reportsAPI.exportCSV(
        selectedReportType,
        params
      );

      const blob = new Blob([response.data], {
        type: 'text/csv;charset=utf-8;',
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;
      link.download = `edustaff-${selectedReportType}-report-${Date.now()}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[Reports] CSV export failed:', error);
      alert('Unable to export the selected report.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const departments = useMemo(() => {
    return Object.keys(reportData?.departmentStats || {});
  }, [reportData]);

  const campuses = useMemo(() => {
    return [
      ...new Set(
        (reportData?.capacity?.forecasts || [])
          .map((item) => item.campus)
          .filter(Boolean)
      ),
    ];
  }, [reportData]);

  const filteredSkillGaps = useMemo(() => {
    const gaps = Object.entries(reportData?.skillGaps || {});

    if (!searchTerm.trim()) {
      return gaps;
    }

    return gaps.filter(([skillName]) =>
      skillName
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [reportData, searchTerm]);

  const workforce = reportData?.workforce || {};
  const certifications = reportData?.certifications || {};
  const capacity = reportData?.capacity || {};
  const assignments = reportData?.assignments || {};
  const decisionQuality = reportData?.decisionQuality || {};
  const riskSummary = reportData?.riskSummary || {};

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 w-72 bg-slate-200 rounded" />
          <div className="h-4 w-96 bg-slate-100 rounded mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-32 bg-white border border-slate-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>

        <div className="h-80 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>District Administration</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">
              Reports & Analytics
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Workforce Reports & Analytics
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Workforce capacity, skills, risk, AI decision quality,
            and operational intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadReports(true)}
            disabled={refreshing}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />

            Refresh
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print View
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60"
          >
            {exporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}

            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-end gap-4">
          <div className="flex items-center gap-2 xl:mr-2">
            <Filter className="w-4 h-4 text-slate-500" />

            <span className="text-xs font-bold text-slate-700">
              Report Filters
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            <label className="text-xs">
              <span className="block text-slate-500 font-semibold mb-1">
                Campus
              </span>

              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800"
              >
                <option value="">All Campuses</option>

                {campuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs">
              <span className="block text-slate-500 font-semibold mb-1">
                Department
              </span>

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800"
              >
                <option value="">All Departments</option>

                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs">
              <span className="block text-slate-500 font-semibold mb-1">
                Risk
              </span>

              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800"
              >
                <option value="">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            <label className="text-xs">
              <span className="block text-slate-500 font-semibold mb-1">
                Assignment Status
              </span>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="pending_review">Pending Review</option>
                <option value="assigned">Assigned</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>

          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-2"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Workforce KPIs */}
      <section>
        <SectionHeader
          icon={BarChart3}
          title="Workforce Performance"
          subtitle="Current workforce utilization and available operating capacity."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="Headcount"
            value={formatNumber(workforce.totalWorkers)}
            subtitle="Active workforce records"
            icon={Users}
          />

          <KpiCard
            title="Total FTE"
            value={formatNumber(workforce.totalFTE, 2)}
            subtitle="Full-time equivalent"
            icon={Activity}
          />

          <KpiCard
            title="Utilization"
            value={formatPercent(workforce.averageUtilization)}
            subtitle="Average workload utilization"
            icon={Gauge}
            iconClass="bg-violet-50 text-violet-600"
          />

          <KpiCard
            title="Workload"
            value={`${formatNumber(workforce.totalWorkloadHours)}h`}
            subtitle="Current weekly workload"
            icon={Clock3}
            iconClass="bg-amber-50 text-amber-600"
          />

          <KpiCard
            title="Available Capacity"
            value={`${formatNumber(workforce.availableHours)}h`}
            subtitle="Remaining weekly capacity"
            icon={TrendingUp}
            iconClass="bg-emerald-50 text-emerald-600"
          />
        </div>
      </section>

      {/* Capacity + Risk */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Capacity */}
        <section className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <SectionHeader
            icon={Gauge}
            title="Capacity Forecast Analysis"
            subtitle="Projected workforce demand versus available staffing."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-[11px] text-slate-500 font-semibold">
                Required FTE
              </p>

              <p className="text-xl font-extrabold text-slate-900 mt-1">
                {formatNumber(capacity.totalRequiredFTE, 2)}
              </p>
            </div>

            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
              <p className="text-[11px] text-rose-600 font-semibold">
                Capacity Deficit
              </p>

              <p className="text-xl font-extrabold text-rose-700 mt-1">
                {formatNumber(capacity.totalDeficitFTE, 2)} FTE
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-[11px] text-amber-700 font-semibold">
                Critical Forecasts
              </p>

              <p className="text-xl font-extrabold text-amber-700 mt-1">
                {formatNumber(capacity.criticalForecasts)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2 px-3">Campus</th>
                  <th className="py-2 px-3">Term</th>
                  <th className="py-2 px-3">Required FTE</th>
                  <th className="py-2 px-3">Deficit</th>
                  <th className="py-2 px-3">Risk</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {(capacity.forecasts || []).map((forecast) => (
                  <tr
                    key={forecast.id || `${forecast.campus}-${forecast.academicTerm}`}
                    className="hover:bg-slate-50"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {forecast.campus}
                    </td>

                    <td className="py-3 px-3 text-slate-500">
                      {forecast.academicTerm || 'Current'}
                    </td>

                    <td className="py-3 px-3 font-semibold">
                      {formatNumber(forecast.requiredStaffFTE, 2)}
                    </td>

                    <td className="py-3 px-3 font-semibold text-rose-600">
                      {formatNumber(forecast.deficitFTE, 2)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-1 rounded-md border text-[10px] font-bold ${getRiskClass(
                          forecast.riskLevel
                        )}`}
                      >
                        {forecast.riskLevel || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}

                {!capacity.forecasts?.length && (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-8 text-center text-slate-500"
                    >
                      No capacity forecast data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Risk */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <SectionHeader
            icon={AlertTriangle}
            title="Risk & Compliance"
            subtitle="Exceptions requiring management attention."
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />

                <span className="text-xs font-semibold text-slate-700">
                  High Burnout Risk
                </span>
              </div>

              <span className="font-bold text-rose-700">
                {riskSummary.highBurnout || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-amber-600" />

                <span className="text-xs font-semibold text-slate-700">
                  Expiring Certifications
                </span>
              </div>

              <span className="font-bold text-amber-700">
                {certifications.expiringSoon || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />

                <span className="text-xs font-semibold text-slate-700">
                  Expired Certifications
                </span>
              </div>

              <span className="font-bold text-rose-700">
                {certifications.expired || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-600" />

                <span className="text-xs font-semibold text-slate-700">
                  Critical Capacity
                </span>
              </div>

              <span className="font-bold text-slate-800">
                {riskSummary.criticalCapacityForecasts || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />

                <span className="text-xs font-semibold text-slate-700">
                  Critical Skill Gaps
                </span>
              </div>

              <span className="font-bold text-rose-700">
                {riskSummary.criticalSkillGaps || 0}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Skill Intelligence */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <SectionHeader
            icon={Brain}
            title="Skill Intelligence & Gap Analysis"
            subtitle="Qualified workforce against required competency thresholds."
          />

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />

            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search skills..."
              className="pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-3">Skill</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Demand</th>
                <th className="py-3 px-3">Required Level</th>
                <th className="py-3 px-3">Qualified Staff</th>
                <th className="py-3 px-3">Gap Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredSkillGaps.map(([skillName, detail]) => (
                <tr
                  key={skillName}
                  className="hover:bg-slate-50"
                >
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {skillName}
                  </td>

                  <td className="py-3 px-3 text-slate-500">
                    {detail.category || 'General'}
                  </td>

                  <td className="py-3 px-3">
                    {detail.demand || 'Normal'}
                  </td>

                  <td className="py-3 px-3">
                    Level {detail.requiredProficiency || 3}
                  </td>

                  <td className="py-3 px-3 font-bold">
                    {detail.qualifiedStaffCount || 0}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-1 rounded-md border text-[10px] font-bold ${getGapClass(
                        detail.gapStatus
                      )}`}
                    >
                      {detail.gapStatus}
                    </span>
                  </td>
                </tr>
              ))}

              {!filteredSkillGaps.length && (
                <tr>
                  <td
                    colSpan="6"
                    className="py-8 text-center text-slate-500"
                  >
                    No matching skill intelligence records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Department + AI Decision Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <SectionHeader
            icon={Users}
            title="Department Workforce Distribution"
            subtitle="Headcount, FTE, utilization, and workforce risk."
          />

          <div className="space-y-3">
            {Object.entries(reportData?.departmentStats || {}).map(
              ([name, stats]) => (
                <div
                  key={name}
                  className="p-3 rounded-xl border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {name}
                    </span>

                    <span className="text-xs font-bold text-slate-700">
                      {stats.headcount} staff
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <p className="text-[10px] text-slate-400">
                        FTE
                      </p>

                      <p className="text-xs font-bold">
                        {formatNumber(stats.fte, 2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">
                        Utilization
                      </p>

                      <p className="text-xs font-bold">
                        {formatPercent(
                          stats.averageUtilization
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">
                        High Risk
                      </p>

                      <p className="text-xs font-bold text-rose-600">
                        {stats.highRisk}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* AI */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <SectionHeader
            icon={Brain}
            title="AI & Decision Quality"
            subtitle="AI recommendations remain advisory until authorized human review."
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
              <p className="text-[10px] text-sky-700 font-semibold">
                AI Recommendations
              </p>

              <p className="text-2xl font-extrabold text-sky-800 mt-1">
                {decisionQuality.recommendationsWithScores || 0}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
              <p className="text-[10px] text-violet-700 font-semibold">
                Avg Match Score
              </p>

              <p className="text-2xl font-extrabold text-violet-800 mt-1">
                {formatNumber(
                  decisionQuality.averageMatchScore,
                  1
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] text-amber-700 font-semibold">
                Pending Review
              </p>

              <p className="text-2xl font-extrabold text-amber-800 mt-1">
                {assignments.pending || 0}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-[10px] text-emerald-700 font-semibold">
                Approved / Completed
              </p>

              <p className="text-2xl font-extrabold text-emerald-800 mt-1">
                {assignments.approved || 0}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex gap-3">
            <ShieldCheck className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />

            <div>
              <p className="text-xs font-bold text-slate-800">
                Human-in-the-loop control
              </p>

              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                AI recommendations are presented as decision
                support. Authorized managers remain responsible
                for approval, rejection, correction, or override.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Export Center */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <SectionHeader
          icon={FileText}
          title="Report Export Center"
          subtitle="Generate governed CSV datasets using the currently selected filters."
        />

        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={selectedReportType}
            onChange={(e) =>
              setSelectedReportType(e.target.value)
            }
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white"
          >
            <option value="workers">
              Workforce & Staff Profiles
            </option>

            <option value="assignments">
              Assignments & Allocations
            </option>

            <option value="capacity">
              Capacity Forecasts
            </option>

            <option value="audit">
              Audit Logs
            </option>
          </select>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />

            {exporting
              ? 'Generating CSV...'
              : 'Generate CSV Report'}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />

          Export activity is recorded in the audit trail.
        </div>
      </section>

      {/* Report History */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <SectionHeader
          icon={FileText}
          title="Report Generation History"
          subtitle="Recent report artifacts and governed export activity."
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-3">Report</th>
                <th className="py-3 px-3">Scope</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4 px-3">
                  <p className="font-bold text-slate-900">
                    Workforce Inventory
                  </p>

                  <p className="text-[10px] text-slate-500 mt-1">
                    Current workforce snapshot
                  </p>
                </td>

                <td className="py-4 px-3 text-slate-600">
                  {campus || 'All campuses'}
                </td>

                <td className="py-4 px-3">
                  <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    Ready
                  </span>
                </td>

                <td className="py-4 px-3">
                  <button
                    onClick={() => {
                      setSelectedReportType('workers');
                      handleExportCSV();
                    }}
                    className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                </td>
              </tr>

              <tr>
                <td className="py-4 px-3">
                  <p className="font-bold text-slate-900">
                    Capacity Forecast
                  </p>

                  <p className="text-[10px] text-slate-500 mt-1">
                    Staffing demand and deficit analysis
                  </p>
                </td>

                <td className="py-4 px-3 text-slate-600">
                  {campus || 'All campuses'}
                </td>

                <td className="py-4 px-3">
                  <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    Ready
                  </span>
                </td>

                <td className="py-4 px-3">
                  <button
                    onClick={() => {
                      setSelectedReportType('capacity');
                      handleExportCSV();
                    }}
                    className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] text-slate-400">
        <span>
          Report generated:{' '}
          {reportData?.generatedAt
            ? new Date(reportData.generatedAt).toLocaleString()
            : 'Unavailable'}
        </span>

        <span>
          Current role: {role || 'Unknown'} • AI outputs are advisory
          and subject to authorized human review.
        </span>
      </div>
    </div>
  );
}