import React, { useState, useEffect } from 'react';
import { capacityAPI, workersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  GraduationCap,
  Calendar,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  BarChart3,
  HeartHandshake
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const { role, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await capacityAPI.getOverview();
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('[Dashboard] Error fetching capacity overview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Workforce Intelligence Metrics...</p>
        </div>
      </div>
    );
  }

  // Filter campus data if needed
  const campusChartData = (data?.campusBreakdown || []).filter(c =>
    selectedCampus === 'All' ? true : c.campus.includes(selectedCampus)
  );

  const cohortDemandData = [
    { metric: 'Enrolment Growth', value: 8.5, benchmark: 5.0, unit: '%' },
    { metric: 'Avg Attendance', value: Number(data?.avgAttendance || 95.2), benchmark: 94.0, unit: '%' },
    { metric: 'Learning Progress Index', value: 83.4, benchmark: 80.0, unit: 'pts' },
    { metric: 'Intervention Volume', value: 148, benchmark: 100, unit: 'cases' },
    { metric: 'Parent Response Rate', value: 74.5, benchmark: 70.0, unit: '%' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>District Operations</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Workforce Capacity & Demand</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Workforce Capacity & Utilization Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational telemetry correlating student enrolment, attendance, and IEP demands with educator workloads.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/skill-intelligence"
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>AI Capacity Forecast</span>
          </Link>
          <Link
            to="/assignment-comparison"
            className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Rebalance Assignments</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-700">Scope Filters:</span>
          </div>

          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="All">All Campuses (District Total)</option>
            <option value="High">Oakridge High Campus</option>
            <option value="Middle">Oakridge Middle Campus</option>
            <option value="Elementary">Lincoln Elementary Campus</option>
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="All">All Risk Profiles</option>
            <option value="Critical">Critical Deficits Only</option>
            <option value="Moderate">Moderate Deficits Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Academic Year 2026-2027</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block ml-1" />
          <span className="text-emerald-700 font-semibold">Live SIS Linked</span>
        </div>
      </div>

      {/* 5 High-Impact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Faculty FTE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Faculty FTE</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{data?.totalFTE || '146.0'}</div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">100%</span>
            <span>of authorized headcount</span>
          </p>
        </div>

        {/* Average Utilization */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Avg Utilization</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{data?.avgUtilization || 91}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${(data?.avgUtilization || 91) > 95 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, data?.avgUtilization || 91)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Benchmark: 85 - 90% optimal</p>
        </div>

        {/* Burnout Warnings */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Burnout Warnings</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{data?.criticalBurnoutCount || 3}</div>
          <p className="text-[11px] text-rose-700 font-medium mt-1">
            Staff exceeding 100% capacity
          </p>
        </div>

        {/* Net Deficit Hours */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">District Deficit Hours</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{data?.totalDeficitHours || 320}h</div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            Equivalent to {data?.totalDeficitFTE || 8.0} FTE gap
          </p>
        </div>

        {/* Total Students Enrolled */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Students Enrolled</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{data?.totalStudents?.toLocaleString() || '2,960'}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            +5.4% YoY net growth
          </p>
        </div>
      </div>

      {/* Main Visuals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campus Capacity vs Deficit (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Campus Staffing Allocation vs Student Enrolment</h2>
              <p className="text-xs text-slate-500">Compares existing staff FTE with required operational staffing per campus</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded bg-sky-600 inline-block" /> Active FTE
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Deficit FTE
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="campus" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none'
                  }}
                />
                <Bar dataKey="staffFTE" name="Active Staff FTE" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deficitFTE" name="Deficit FTE Needed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            {campusChartData.map((c, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-800">{c.campus}</div>
                <div className="mt-1 flex items-center justify-between text-slate-600">
                  <span>Enrolment:</span>
                  <span className="font-semibold text-slate-900">{c.enrolment}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Gap Status:</span>
                  <span className={`font-bold ${c.deficitFTE > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {c.deficitFTE > 0 ? `-${c.deficitFTE} FTE (${c.deficitFTE * 40}h)` : 'Balanced (+1 FTE)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Demand Drivers Telemetry (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900">Student Demand Drivers</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                SIS Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Underlying operational metrics triggering staff shortages</p>

            <div className="space-y-3.5">
              {cohortDemandData.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.metric}</span>
                    <span className="font-bold text-slate-900">
                      {item.value} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-sky-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (item.value / (item.benchmark * 1.3)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>District Benchmark: {item.benchmark} {item.unit}</span>
                    <span className={item.value >= item.benchmark ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
                      {item.value >= item.benchmark ? 'Above Target' : 'Below Target'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-sky-900 mb-1">
              <HeartHandshake className="w-4 h-4 text-sky-600" />
              <span>IEP Intervention Priority</span>
            </div>
            <p className="text-[11px] text-sky-800 leading-relaxed">
              District has 148 active IEP caseloads requiring mandated 1-on-1 or small group staffing. Special Education is currently at 108% capacity.
            </p>
          </div>
        </div>
      </div>

      {/* Critical Action Alerts Section */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" />
              <span>Urgent Operational Attention</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Special Education Credential Expiry & STEM Overload Detected
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Maria Rodriguez's Special Education credential expires in 18 days, and David Chen is allocated at 105% capacity with 3 AP preparations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/workers"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Inspect Staff Directory
            </Link>
            <Link
              to="/assignment-comparison"
              className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Resolve Overload
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
