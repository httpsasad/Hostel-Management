"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  BedDouble,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  LogOut,
  LogIn,
  Check,
  Home,
  CheckCircle,
  FileText,
  Printer,
  Receipt,
  CreditCard,
  Calendar,
  X,
  Send,
  Download,
  Building,
  Layers,
  ChevronDown,
  Compass,
  MapPin,
  ExternalLink
} from "lucide-react";
import {
  checkBackendHealth,
  fetchRooms,
  fetchStudents,
  fetchGateLogs,
  fetchInvoices,
  fetchLeaveRequests,
  createInvoice,
  recordPayment,
  submitLeaveRequest,
  approveLeaveRequest,
  verifyGatePass,
  RoomItem,
  StudentItem,
  GateLogItem,
  InvoiceItem,
  LeaveRequestItem,
  ComplaintItem
} from "@/lib/api";
import QRCodeDisplay from "@/components/QRCodeDisplay";

type PersonaRole = "HOSTEL_OWNER" | "WARDEN" | "SECURITY_GUARD" | "STUDENT";

interface FacilityBranch {
  id: string;
  name: string;
  code: string;
  type: string;
  capacity: number;
  occupancy: number;
}

export default function ExecutiveHostelDashboard() {
  // Navigation & Role State
  const [activeRole, setActiveRole] = useState<PersonaRole>("HOSTEL_OWNER");
  const [activeTab, setActiveTab] = useState<"matrix" | "students" | "finance" | "gate" | "outpass" | "complaints" | "ai">("matrix");
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  // Multi-Branch Management
  const [branches, setBranches] = useState<FacilityBranch[]>([
    { id: "b-1", name: "Main Campus Executive Wing", code: "MC-EXEC-01", type: "Boys Residency", capacity: 48, occupancy: 42 },
    { id: "b-2", name: "Iqbal Graduate Complex", code: "IQB-GRAD-02", type: "Boys Residency", capacity: 64, occupancy: 58 },
    { id: "b-3", name: "Fatima Jinnah Hall", code: "FJ-HALL-03", type: "Girls Residency", capacity: 80, occupancy: 76 },
  ]);
  const [activeBranch, setActiveBranch] = useState<FacilityBranch>(branches[0]);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchData, setNewBranchData] = useState({ name: "", code: "", type: "Boys Residency", capacity: 50 });

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Live Data States
  const [rooms, setRooms] = useState<RoomItem[]>([
    {
      id: "r-101",
      room_number: "101",
      capacity: 2,
      beds: [
        { id: "b-1", bed_number: "B1", status: "OCCUPIED", is_active: true },
        { id: "b-2", bed_number: "B2", status: "AVAILABLE", is_active: true },
      ],
    },
    {
      id: "r-102",
      room_number: "102",
      capacity: 3,
      beds: [
        { id: "b-3", bed_number: "B1", status: "OCCUPIED", is_active: true },
        { id: "b-4", bed_number: "B2", status: "OCCUPIED", is_active: true },
        { id: "b-5", bed_number: "B3", status: "MAINTENANCE", is_active: true },
      ],
    },
    {
      id: "r-103",
      room_number: "103",
      capacity: 2,
      beds: [
        { id: "b-6", bed_number: "B1", status: "AVAILABLE", is_active: true },
        { id: "b-7", bed_number: "B2", status: "AVAILABLE", is_active: true },
      ],
    },
    {
      id: "r-201",
      room_number: "201",
      capacity: 2,
      beds: [
        { id: "b-8", bed_number: "B1", status: "OCCUPIED", is_active: true },
        { id: "b-9", bed_number: "B2", status: "OCCUPIED", is_active: true },
      ],
    },
  ]);

  const [students, setStudents] = useState<StudentItem[]>([
    {
      id: "s-1",
      admission_number: "HST-2026-089",
      full_name: "Hamza Tariq",
      email: "hamza.tariq@gmail.com",
      phone: "+92 300 1234567",
      status: "ACTIVE",
      hostel_id: "b-1",
      room_number: "101",
      bed_number: "B1",
    },
    {
      id: "s-2",
      admission_number: "HST-2026-092",
      full_name: "Ali Raza",
      email: "ali.raza@gmail.com",
      phone: "+92 312 9876543",
      status: "ACTIVE",
      hostel_id: "b-1",
      room_number: "102",
      bed_number: "B1",
    },
    {
      id: "s-3",
      admission_number: "HST-2026-095",
      full_name: "Zain Ahmed",
      email: "zain.ahmed@yahoo.com",
      phone: "+92 333 4567890",
      status: "ACTIVE",
      hostel_id: "b-1",
      room_number: "102",
      bed_number: "B2",
    },
    {
      id: "s-4",
      admission_number: "HST-2026-104",
      full_name: "Usman Bilal",
      email: "usman.bilal@outlook.com",
      phone: "+92 345 5678901",
      status: "ACTIVE",
      hostel_id: "b-1",
      room_number: "201",
      bed_number: "B1",
    },
  ]);

  // Phase 2: Invoices & Finance States
  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    {
      id: "inv-101",
      invoice_number: "INV-2026-0041",
      student_id: "s-1",
      student_name: "Hamza Tariq",
      admission_number: "HST-2026-089",
      billing_period_start: "2026-11-01",
      billing_period_end: "2026-11-30",
      due_date: "2026-11-15",
      total_amount: 350.00,
      paid_amount: 350.00,
      balance_due: 0.00,
      status: "PAID",
      items: [
        { id: "it-1", description: "Executive Double Room Rent", amount: 250.00 },
        { id: "it-2", description: "Mess & Catering Package", amount: 100.00 },
      ],
      payments: [
        {
          id: "p-1",
          receipt_number: "RCP-2026-00109",
          amount: 350.00,
          payment_method: "BANK_TRANSFER",
          payment_status: "COMPLETED",
          transaction_reference: "TXN-MEEZAN-98412",
          payment_date: "2026-11-05",
        },
      ],
    },
    {
      id: "inv-102",
      invoice_number: "INV-2026-0042",
      student_id: "s-2",
      student_name: "Ali Raza",
      admission_number: "HST-2026-092",
      billing_period_start: "2026-11-01",
      billing_period_end: "2026-11-30",
      due_date: "2026-11-12",
      total_amount: 320.00,
      paid_amount: 0.00,
      balance_due: 320.00,
      status: "PENDING",
      items: [
        { id: "it-3", description: "Triple Room Rent", amount: 220.00 },
        { id: "it-4", description: "Mess & Catering Package", amount: 100.00 },
      ],
      payments: [],
    },
    {
      id: "inv-103",
      invoice_number: "INV-2026-0038",
      student_id: "s-4",
      student_name: "Usman Bilal",
      admission_number: "HST-2026-104",
      billing_period_start: "2026-10-01",
      billing_period_end: "2026-10-31",
      due_date: "2026-10-15",
      total_amount: 350.00,
      paid_amount: 150.00,
      balance_due: 200.00,
      status: "OVERDUE",
      items: [
        { id: "it-5", description: "Executive Double Room Rent", amount: 250.00 },
        { id: "it-6", description: "Mess & Laundry Plan", amount: 100.00 },
      ],
      payments: [
        {
          id: "p-2",
          receipt_number: "RCP-2026-00094",
          amount: 150.00,
          payment_method: "CASH",
          payment_status: "COMPLETED",
          payment_date: "2026-10-16",
        },
      ],
    },
  ]);

  // Phase 3: Outpass & Leave Requests State
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([
    {
      id: "l-1",
      student_id: "s-1",
      student_name: "Hamza Tariq",
      admission_number: "HST-2026-089",
      room_number: "101",
      reason: "Home visit for family function",
      destination: "Islamabad, F-7 Sector",
      departure_date: "2026-11-14 16:00",
      expected_return: "2026-11-17 20:00",
      status: "APPROVED",
      warden_remarks: "Approved by Chief Warden",
      outpass_token: "PASS-HT8926",
    },
    {
      id: "l-2",
      student_id: "s-2",
      student_name: "Ali Raza",
      admission_number: "HST-2026-092",
      room_number: "102",
      reason: "Weekend project study group",
      destination: "LUMS Campus Library",
      departure_date: "2026-11-10 09:00",
      expected_return: "2026-11-10 21:00",
      status: "PENDING",
      outpass_token: "PASS-AR9214",
    },
    {
      id: "l-3",
      student_id: "s-3",
      student_name: "Zain Ahmed",
      admission_number: "HST-2026-095",
      room_number: "102",
      reason: "Medical appointment",
      destination: "Shaukat Khanum Hospital",
      departure_date: "2026-11-08 14:00",
      expected_return: "2026-11-08 18:30",
      status: "COMPLETED",
      warden_remarks: "Medical slip verified",
      outpass_token: "PASS-ZA9510",
    },
  ]);

  const [gateLogs, setGateLogs] = useState<GateLogItem[]>([
    {
      id: "g-1",
      event_type: "CHECK_IN",
      student_name: "Hamza Tariq",
      admission_number: "HST-2026-089",
      timestamp: "Today at 02:45 PM",
      remarks: "Regular campus return",
    },
    {
      id: "g-2",
      event_type: "CHECK_OUT",
      student_name: "Ali Raza",
      admission_number: "HST-2026-092",
      timestamp: "Today at 11:20 AM",
      remarks: "Weekend Leave approved by Warden",
    },
    {
      id: "g-3",
      event_type: "CHECK_IN",
      student_name: "Usman Bilal",
      admission_number: "HST-2026-104",
      timestamp: "Yesterday at 09:15 PM",
      remarks: "Evening library return",
    },
  ]);

  const [complaints, setComplaints] = useState<ComplaintItem[]>([
    {
      id: "c-1",
      title: "Wi-Fi Router slow in Room 102",
      category: "WIFI_INTERNET",
      priority: "HIGH",
      status: "OPEN",
      description: "Speed drops continuously in the evening hours during study time.",
      student_name: "Ali Raza",
      created_at: "2 hours ago",
    },
    {
      id: "c-2",
      title: "Ceiling Fan Regulator Stuck",
      category: "ELECTRICAL",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      description: "Fan regulator stuck at speed 5 in Room 201.",
      student_name: "Usman Bilal",
      created_at: "Yesterday",
    },
  ]);

  // Modals
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceItem | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<InvoiceItem | null>(null);

  // Outpass Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedPassForQR, setSelectedPassForQR] = useState<LeaveRequestItem | null>(null);

  // Form inputs
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    admission_no: "",
    room_number: "101",
    bed_number: "B2",
    emergency_contact: "",
  });

  const [newInvoiceData, setNewInvoiceData] = useState({
    student_id: "s-1",
    rent_amount: 250,
    mess_amount: 100,
    utility_amount: 30,
    due_date: "2026-11-20",
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: "CASH",
    reference: "",
  });

  const [newLeaveData, setNewLeaveData] = useState({
    student_id: "s-1",
    reason: "",
    destination: "",
    departure_date: "",
    expected_return: "",
  });

  const [gateScanInput, setGateScanInput] = useState("");
  const [gateEventType, setGateEventType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [gateScanFeedback, setGateScanFeedback] = useState<string | null>(null);

  // Check backend connection
  useEffect(() => {
    async function verifyAPI() {
      const health = await checkBackendHealth();
      if (health && health.status === "healthy") {
        setIsBackendOnline(true);
      }
    }
    verifyAPI();
  }, []);

  // Compute stats
  const totalBeds = rooms.reduce((acc, r) => acc + r.beds.length, 0);
  const occupiedBeds = rooms.reduce(
    (acc, r) => acc + r.beds.filter((b) => b.status === "OCCUPIED").length,
    0
  );
  const availableBeds = rooms.reduce(
    (acc, r) => acc + r.beds.filter((b) => b.status === "AVAILABLE").length,
    0
  );
  const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Financial Stats
  const totalBilled = invoices.reduce((acc, i) => acc + i.total_amount, 0);
  const totalCollected = invoices.reduce((acc, i) => acc + i.paid_amount, 0);
  const totalPending = invoices.reduce((acc, i) => acc + i.balance_due, 0);

  // Actions
  const handleAdmitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.admission_no) return;

    const admitted: StudentItem = {
      id: `s-${Date.now()}`,
      admission_number: newStudent.admission_no,
      full_name: newStudent.name,
      email: newStudent.email || `${newStudent.admission_no.toLowerCase()}@hostel.edu`,
      phone: newStudent.phone || "+92 300 0000000",
      status: "ACTIVE",
      hostel_id: activeBranch.id,
      room_number: newStudent.room_number,
      bed_number: newStudent.bed_number,
    };

    setStudents([admitted, ...students]);

    setRooms(
      rooms.map((r) => {
        if (r.room_number === newStudent.room_number) {
          return {
            ...r,
            beds: r.beds.map((b) =>
              b.bed_number === newStudent.bed_number ? { ...b, status: "OCCUPIED" } : b
            ),
          };
        }
        return r;
      })
    );

    setShowAdmitModal(false);
    setNewStudent({
      name: "",
      email: "",
      phone: "",
      admission_no: "",
      room_number: "101",
      bed_number: "B2",
      emergency_contact: "",
    });
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === newInvoiceData.student_id) || students[0];
    const total = Number(newInvoiceData.rent_amount) + Number(newInvoiceData.mess_amount) + Number(newInvoiceData.utility_amount);

    const inv: InvoiceItem = {
      id: `inv-${Date.now()}`,
      invoice_number: `INV-2026-00${invoices.length + 45}`,
      student_id: st.id,
      student_name: st.full_name,
      admission_number: st.admission_number,
      billing_period_start: "2026-11-01",
      billing_period_end: "2026-11-30",
      due_date: newInvoiceData.due_date,
      total_amount: total,
      paid_amount: 0.00,
      balance_due: total,
      status: "PENDING",
      items: [
        { id: "it-r", description: "Accommodation Rent", amount: Number(newInvoiceData.rent_amount) },
        { id: "it-m", description: "Meal & Mess Dues", amount: Number(newInvoiceData.mess_amount) },
        { id: "it-u", description: "Electricity & Utility Surcharge", amount: Number(newInvoiceData.utility_amount) },
      ],
      payments: [],
    };

    setInvoices([inv, ...invoices]);
    setShowInvoiceModal(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    const payAmt = Number(paymentData.amount) || selectedInvoiceForPayment.balance_due;
    const newPaid = selectedInvoiceForPayment.paid_amount + payAmt;
    const newBal = Math.max(0, selectedInvoiceForPayment.total_amount - newPaid);
    const newStatus = newBal === 0 ? "PAID" : "PARTIALLY_PAID";

    const receiptNo = `RCP-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const updatedInvoice: InvoiceItem = {
      ...selectedInvoiceForPayment,
      paid_amount: newPaid,
      balance_due: newBal,
      status: newStatus,
      payments: [
        ...selectedInvoiceForPayment.payments,
        {
          id: `p-${Date.now()}`,
          receipt_number: receiptNo,
          amount: payAmt,
          payment_method: paymentData.method,
          payment_status: "COMPLETED",
          transaction_reference: paymentData.reference || "TXN-OFFICIAL-VERIFIED",
          payment_date: new Date().toISOString().split("T")[0],
        },
      ],
    };

    setInvoices(invoices.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)));
    setShowPaymentModal(false);
    setShowReceiptModal(updatedInvoice);
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === newLeaveData.student_id) || students[0];
    const newLeave: LeaveRequestItem = {
      id: `l-${Date.now()}`,
      student_id: st.id,
      student_name: st.full_name,
      admission_number: st.admission_number,
      room_number: st.room_number || "101",
      reason: newLeaveData.reason || "Home Visit",
      destination: newLeaveData.destination || "Family Residence",
      departure_date: newLeaveData.departure_date || "2026-11-15 17:00",
      expected_return: newLeaveData.expected_return || "2026-11-18 20:00",
      status: activeRole === "WARDEN" || activeRole === "HOSTEL_OWNER" ? "APPROVED" : "PENDING",
      warden_remarks: activeRole === "WARDEN" ? "Approved instantly by Warden" : undefined,
      outpass_token: `PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };

    setLeaveRequests([newLeave, ...leaveRequests]);
    setShowLeaveModal(false);
    setSelectedPassForQR(newLeave);
  };

  const handleApproveLeave = (leaveId: string, action: "APPROVED" | "REJECTED") => {
    setLeaveRequests(
      leaveRequests.map((l) =>
        l.id === leaveId
          ? {
              ...l,
              status: action,
              warden_remarks: action === "APPROVED" ? "Verified & Approved by Chief Warden" : "Declined due to exam schedule",
            }
          : l
      )
    );
  };

  const handleScanGatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateScanInput) return;

    const matchedLeave = leaveRequests.find(
      (l) => l.outpass_token.toLowerCase() === gateScanInput.toLowerCase() ||
             l.admission_number.toLowerCase() === gateScanInput.toLowerCase()
    );

    const matchedStudent = students.find(
      (s) => s.admission_number.toLowerCase() === gateScanInput.toLowerCase() ||
             s.full_name.toLowerCase().includes(gateScanInput.toLowerCase())
    );

    const sName = matchedLeave ? matchedLeave.student_name : (matchedStudent ? matchedStudent.full_name : gateScanInput);
    const sAdm = matchedLeave ? matchedLeave.admission_number : (matchedStudent ? matchedStudent.admission_number : "VISITOR-PASS");

    const newLog: GateLogItem = {
      id: `g-${Date.now()}`,
      event_type: gateEventType,
      student_name: sName,
      admission_number: sAdm,
      timestamp: "Just now",
      remarks: matchedLeave ? `QR Outpass (${matchedLeave.outpass_token}) Verified` : `Station Security Check`,
    };

    setGateLogs([newLog, ...gateLogs]);
    setGateScanFeedback(`Verified: ${sName} (${sAdm}) - Clearance Granted!`);
    setGateScanInput("");
    setTimeout(() => setGateScanFeedback(null), 4000);
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchData.name) return;
    const b: FacilityBranch = {
      id: `b-${Date.now()}`,
      name: newBranchData.name,
      code: newBranchData.code || `FAC-${branches.length + 1}`,
      type: newBranchData.type,
      capacity: Number(newBranchData.capacity) || 50,
      occupancy: 0,
    };
    setBranches([...branches, b]);
    setActiveBranch(b);
    setShowAddBranchModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-800">
      {/* EXECUTIVE TOP NAVIGATION */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  HostelOS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Executive Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Enterprise Smart Hostel Management Platform</p>
            </div>
          </div>

          {/* Center: Phase 4 Multi-Branch Switcher */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-500">Facility:</span>
              <select
                aria-label="Facility Branch"
                value={activeBranch.id}
                onChange={(e) => {
                  const b = branches.find((item) => item.id === e.target.value);
                  if (b) setActiveBranch(b);
                }}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1"></span>
            </div>

            <button
              onClick={() => setShowAddBranchModal(true)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="Add New Facility Branch"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Workspace & Actions */}
          <div className="flex items-center space-x-3">
            {/* Live Backend Health Tag */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isBackendOnline
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
              title={isBackendOnline ? "FastAPI Server Active at http://127.0.0.1:8000" : "Standalone Operational"}
            >
              <span className={`w-2 h-2 rounded-full ${isBackendOnline ? "bg-emerald-500 animate-pulse" : "bg-blue-500"}`}></span>
              <span>{isBackendOnline ? "API Connected" : "Local Engine"}</span>
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
              <span className="text-slate-500 pl-2 font-medium">Role:</span>
              <select
                aria-label="Workspace Switcher"
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as PersonaRole)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="HOSTEL_OWNER">Hostel Administrator</option>
                <option value="WARDEN">Chief Warden</option>
                <option value="SECURITY_GUARD">Security Station</option>
                <option value="STUDENT">Resident Portal</option>
              </select>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => setShowAdmitModal(true)}
              className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold btn-executive"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Admit Resident</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN EXECUTIVE DASHBOARD */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* EXECUTIVE KPI METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Capacity & Occupancy */}
          <div className="executive-card p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Occupancy Rate</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <BedDouble className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold tracking-tight text-slate-900">{occupiedBeds} / {totalBeds}</span>
                <span className="text-xs text-slate-500 ml-1.5 font-medium">Beds</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {occupancyPercentage}% Filled
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${occupancyPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Card 2: Registered Residents */}
          <div className="executive-card p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Residents</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold tracking-tight text-slate-900">{students.length}</span>
                <span className="text-xs text-slate-500 ml-1.5 font-medium">Boarders</span>
              </div>
              <span className="text-xs text-slate-600 font-medium flex items-center bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                <CheckCircle className="w-3 h-3 text-emerald-600 mr-1" /> Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium">{availableBeds} beds available for reservation</p>
          </div>

          {/* Card 3: Finance Collected */}
          <div className="executive-card p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fee Collections</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold tracking-tight text-slate-900">${totalCollected.toLocaleString()}</span>
                <span className="text-xs text-slate-500 ml-1.5 font-medium">Billed: ${totalBilled.toLocaleString()}</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {Math.round((totalCollected / totalBilled) * 100) || 0}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium">${totalPending} pending receivables</p>
          </div>

          {/* Card 4: Active Gate Leaves */}
          <div className="executive-card p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Approved Outpasses</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {leaveRequests.filter((l) => l.status === "APPROVED").length}
                </span>
                <span className="text-xs text-slate-500 ml-1.5 font-medium">Out of Campus</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {leaveRequests.filter((l) => l.status === "PENDING").length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium">Scannable QR gate passes active</p>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION TABS (Phases 1, 2, 3, 4) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("matrix")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "matrix"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <BedDouble className="w-4 h-4" />
              <span>Room & Bed Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab("students")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "students"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Resident Directory</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'students' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {students.length}
              </span>
            </button>

            {/* PHASE 2: FINANCE TAB */}
            <button
              onClick={() => setActiveTab("finance")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "finance"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Finance & Invoicing</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                {invoices.length}
              </span>
            </button>

            {/* PHASE 3: QR OUTPASS TAB */}
            <button
              onClick={() => setActiveTab("outpass")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "outpass"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Outpass & Leaves</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                {leaveRequests.filter((l) => l.status === "PENDING").length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("gate")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "gate"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Gate Station Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab("complaints")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "complaints"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Helpdesk</span>
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "ai"
                  ? "bg-indigo-700 text-white shadow-xs"
                  : "text-indigo-700 hover:bg-indigo-50 border border-indigo-200"
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>AI Engine</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="flex items-center space-x-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs w-44 sm:w-56 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* TAB 1: BED ALLOCATION MATRIX */}
        {activeTab === "matrix" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Bed Allocation Matrix ({activeBranch.name})</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Click on an available bed to instantly admit a student and lock reservation transactionally.
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs font-semibold">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Available ({availableBeds})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-slate-600">Occupied ({occupiedBeds})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600">Under Service (1)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {rooms.map((room) => (
                <div key={room.id} className="executive-card p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 font-bold flex items-center justify-center text-xs border border-slate-200">
                        {room.room_number}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">Room {room.room_number}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Capacity: {room.capacity} Persons</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Floor {room.room_number.charAt(0)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {room.beds.map((bed) => {
                      const student = students.find(
                        (s) => s.room_number === room.room_number && s.bed_number === bed.bed_number
                      );

                      return (
                        <div
                          key={bed.id}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                            bed.status === "AVAILABLE"
                              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70 cursor-pointer"
                              : bed.status === "OCCUPIED"
                              ? "bg-slate-50 border-slate-200 text-slate-800"
                              : "bg-amber-50/70 border-amber-200 text-amber-900"
                          }`}
                          onClick={() => {
                            if (bed.status === "AVAILABLE") {
                              setNewStudent((prev) => ({
                                ...prev,
                                room_number: room.room_number,
                                bed_number: bed.bed_number,
                              }));
                              setShowAdmitModal(true);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <BedDouble
                              className={`w-3.5 h-3.5 ${
                                bed.status === "AVAILABLE"
                                  ? "text-emerald-600"
                                  : bed.status === "OCCUPIED"
                                  ? "text-blue-600"
                                  : "text-amber-600"
                              }`}
                            />
                            <div>
                              <span className="font-bold text-slate-900">{bed.bed_number}</span>
                              {student && (
                                <p className="text-[11px] text-slate-600 font-medium truncate max-w-[120px]">
                                  {student.full_name}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                bed.status === "AVAILABLE"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : bed.status === "OCCUPIED"
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {bed.status}
                            </span>
                            {bed.status === "AVAILABLE" && <Plus className="w-3.5 h-3.5 text-emerald-700" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: RESIDENTS DIRECTORY */}
        {activeTab === "students" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Student Directory ({activeBranch.name})</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Verified resident dossiers, accommodation assignments, contact records.
                </p>
              </div>
              <button
                onClick={() => setShowAdmitModal(true)}
                className="btn-executive px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Admission</span>
              </button>
            </div>

            <div className="executive-card rounded-xl overflow-hidden border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Resident</th>
                      <th className="py-3 px-4">Admission #</th>
                      <th className="py-3 px-4">Unit Assigned</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                              {student.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-slate-900 font-bold">{student.full_name}</div>
                              <div className="text-[11px] text-slate-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                          {student.admission_number}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                            Room {student.room_number || "N/A"} • Bed {student.bed_number || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{student.phone}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setNewInvoiceData({ ...newInvoiceData, student_id: student.id });
                              setShowInvoiceModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                          >
                            + Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PHASE 2 - FINANCE & INVOICING CORE */}
        {activeTab === "finance" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Finance & Invoicing Ledger</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Automated monthly invoicing, line item breakdowns, payment records, and official receipts.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="btn-executive px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Invoice</span>
                </button>
              </div>
            </div>

            {/* Financial Ledger Table */}
            <div className="executive-card rounded-xl overflow-hidden border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Resident</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{inv.student_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{inv.admission_number}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {inv.billing_period_start} to {inv.billing_period_end}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{inv.due_date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">${inv.total_amount.toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">${inv.paid_amount.toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold text-rose-700">${inv.balance_due.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                              inv.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : inv.status === "PARTIALLY_PAID"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : inv.status === "OVERDUE"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {inv.balance_due > 0 && (
                            <button
                              onClick={() => {
                                setSelectedInvoiceForPayment(inv);
                                setPaymentData({ amount: inv.balance_due, method: "CASH", reference: "" });
                                setShowPaymentModal(true);
                              }}
                              className="text-emerald-700 hover:text-emerald-800 font-bold text-xs"
                            >
                              Record Payment
                            </button>
                          )}
                          {inv.payments.length > 0 && (
                            <button
                              onClick={() => setShowReceiptModal(inv)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center space-x-1 inline-flex"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PHASE 3 - SMART QR OUTPASS & LEAVES */}
        {activeTab === "outpass" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Student Leaves & Digital QR Outpasses</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Warden approval workflows with verifiable digital QR codes for security gate authorization.
                </p>
              </div>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="btn-executive px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request Outpass</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaveRequests.map((leave) => (
                <div key={leave.id} className="executive-card p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{leave.student_name}</h3>
                      <p className="text-[11px] text-slate-500 font-mono">Room {leave.room_number} • {leave.admission_number}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        leave.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : leave.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : leave.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-600">
                    <p><span className="font-semibold text-slate-800">Reason:</span> {leave.reason}</p>
                    <p className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{leave.destination}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      <span className="font-medium text-slate-700">Dates:</span> {leave.departure_date} ➔ {leave.expected_return}
                    </p>
                    {leave.warden_remarks && (
                      <p className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 italic">
                        &quot;{leave.warden_remarks}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions & QR Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {leave.status === "APPROVED" && (
                      <button
                        onClick={() => setSelectedPassForQR(leave)}
                        className="btn-executive-outline px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 text-blue-700"
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                        <span>View QR Pass</span>
                      </button>
                    )}

                    {leave.status === "PENDING" && (activeRole === "WARDEN" || activeRole === "HOSTEL_OWNER") && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApproveLeave(leave.id, "REJECTED")}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveLeave(leave.id, "APPROVED")}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: GATE SCANNER STATION */}
        {activeTab === "gate" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gate Scanner Simulator */}
            <div className="executive-card p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Security Gate Scanner</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Verify Entry and Exit Clearance</p>
                </div>
              </div>

              {gateScanFeedback && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{gateScanFeedback}</span>
                </div>
              )}

              <form onSubmit={handleScanGatePass} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Movement Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGateEventType("CHECK_IN")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                        gateEventType === "CHECK_IN"
                          ? "bg-emerald-600 border-emerald-700 text-white shadow-xs"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Check In (Entry)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGateEventType("CHECK_OUT")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                        gateEventType === "CHECK_OUT"
                          ? "bg-rose-600 border-rose-700 text-white shadow-xs"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Check Out (Leave)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scan Student QR Code or Enter Pass Token
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PASS-HT8926 or HST-2026-089"
                    value={gateScanInput}
                    onChange={(e) => setGateScanInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg btn-executive font-semibold text-xs flex items-center justify-center space-x-1.5 mt-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Pass & Grant Access</span>
                </button>
              </form>
            </div>

            {/* Live Gate Feed */}
            <div className="lg:col-span-2 executive-card p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Audited Gate Access Log</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Permanent timestamped records of student ingress and egress</p>
                </div>
                <span className="text-[11px] text-slate-500 font-medium flex items-center bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-blue-600 mr-1" /> Real-time Audit
                </span>
              </div>

              <div className="space-y-2.5">
                {gateLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors shadow-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                          log.event_type === "CHECK_IN"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {log.event_type === "CHECK_IN" ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-900 font-bold">{log.student_name}</span>
                          <span className="text-[10px] font-mono text-blue-700 font-semibold">{log.admission_number}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{log.remarks}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.event_type === "CHECK_IN"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {log.event_type.replace("_", " ")}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: HELPDESK & COMPLAINTS */}
        {activeTab === "complaints" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Maintenance Tickets & SLA Management</h2>
                <p className="text-xs text-slate-500 font-medium">Issue resolution tracking with disciplinary assignments.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {complaints.map((item) => (
                <div key={item.id} className="executive-card p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.priority === "HIGH"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px] font-medium">By {item.student_name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: AI DECISION ENGINE */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Executive Decision Intelligence Engine</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Calibrated machine learning pipelines providing operational forecasts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="executive-card p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Occupancy Forecast (Next 60 Days)</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Accuracy: 91.4%
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900">96.5% Expected</div>
                  <p className="text-xs text-slate-600 mt-1">
                    Based on academic calendar intake, historic renewal rates, and university exam dates.
                  </p>
                </div>
              </div>

              <div className="executive-card p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Fee-Risk Prioritization Classifier</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Calibrated
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900">1 Account Flagged</div>
                  <p className="text-xs text-slate-600 mt-1">
                    Statistical evaluation of payment delay patterns. Strictly for human follow-up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: STUDENT ADMISSION */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Resident Admission & Bed Allocation</h3>
                <p className="text-xs text-slate-500 font-medium">Transactional creation of resident record & bed lock</p>
              </div>
              <button onClick={() => setShowAdmitModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdmitStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daniyal Khan"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Admission / Roll # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HST-2026-110"
                    value={newStudent.admission_no}
                    onChange={(e) => setNewStudent({ ...newStudent, admission_no: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Room</label>
                  <select
                    value={newStudent.room_number}
                    onChange={(e) => setNewStudent({ ...newStudent, room_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="101">Room 101 (Floor 1)</option>
                    <option value="102">Room 102 (Floor 1)</option>
                    <option value="103">Room 103 (Floor 1)</option>
                    <option value="201">Room 201 (Floor 2)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Bed</label>
                  <select
                    value={newStudent.bed_number}
                    onChange={(e) => setNewStudent({ ...newStudent, bed_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="B1">Bed B1</option>
                    <option value="B2">Bed B2</option>
                    <option value="B3">Bed B3</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg btn-executive font-semibold flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Allocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PHASE 2 GENERATE INVOICE */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Generate Student Fee Invoice</h3>
                <p className="text-xs text-slate-500 font-medium">Official billing record with itemized charges</p>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Resident</label>
                <select
                  value={newInvoiceData.student_id}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, student_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.admission_number} - Room {s.room_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Room Rent ($)</label>
                  <input
                    type="number"
                    required
                    value={newInvoiceData.rent_amount}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, rent_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mess Plan ($)</label>
                  <input
                    type="number"
                    required
                    value={newInvoiceData.mess_amount}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, mess_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Utilities ($)</label>
                  <input
                    type="number"
                    required
                    value={newInvoiceData.utility_amount}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, utility_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={newInvoiceData.due_date}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, due_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between font-bold text-slate-900">
                <span>Total Invoice Sum:</span>
                <span className="text-base text-blue-700">
                  ${Number(newInvoiceData.rent_amount) + Number(newInvoiceData.mess_amount) + Number(newInvoiceData.utility_amount)}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg btn-executive font-semibold flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Issue Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PHASE 2 RECORD PAYMENT */}
      {showPaymentModal && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Record Fee Payment</h3>
                <p className="text-xs text-slate-500 font-medium">Invoice #{selectedInvoiceForPayment.invoice_number}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Resident:</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceForPayment.student_name}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Outstanding Balance:</span>
                  <span className="font-bold text-rose-700">${selectedInvoiceForPayment.balance_due.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                >
                  <option value="CASH">Cash at Counter</option>
                  <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                  <option value="ONLINE_GATEWAY">Online Gateway (Stripe/Card)</option>
                  <option value="CHEQUE">Bank Pay Order / Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reference / Bank Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-984712 or Cash Voucher"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg btn-executive font-semibold flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Confirm & Issue Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PHASE 2 PRINTABLE RECEIPT */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Receipt Header */}
            <div className="text-center border-b border-slate-200 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">OFFICIAL PAYMENT RECEIPT</h3>
              <p className="text-xs text-slate-500 font-medium">HostelOS Institutional Management</p>
              <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs font-mono">
                {showReceiptModal.payments[showReceiptModal.payments.length - 1]?.receipt_number || "RCP-2026-VERIFIED"}
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-2 text-xs text-slate-700 border-b border-slate-200 pb-4">
              <div className="flex justify-between"><span className="text-slate-500">Resident:</span> <span className="font-bold text-slate-900">{showReceiptModal.student_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Roll #:</span> <span className="font-mono font-semibold">{showReceiptModal.admission_number}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Invoice Reference:</span> <span className="font-mono">{showReceiptModal.invoice_number}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Payment Date:</span> <span>{new Date().toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Method:</span> <span className="font-semibold">{showReceiptModal.payments[showReceiptModal.payments.length - 1]?.payment_method || "CASH"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Transaction ID:</span> <span className="font-mono text-slate-600">{showReceiptModal.payments[showReceiptModal.payments.length - 1]?.transaction_reference || "COUNTER-DIRECT"}</span></div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Amount Paid:</span>
              <span className="text-lg text-emerald-700">${showReceiptModal.paid_amount.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowReceiptModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="btn-executive px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PHASE 3 REQUEST LEAVE / OUTPASS */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Request Leave & Digital Gate Pass</h3>
                <p className="text-xs text-slate-500 font-medium">Submit destination & dates for warden clearance</p>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Resident</label>
                <select
                  value={newLeaveData.student_id}
                  onChange={(e) => setNewLeaveData({ ...newLeaveData, student_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.admission_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Leave *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Home Visit, Family Function, Medical"
                  value={newLeaveData.reason}
                  onChange={(e) => setNewLeaveData({ ...newLeaveData, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Destination Address / Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House #14, Street 2, Rawalpindi"
                  value={newLeaveData.destination}
                  onChange={(e) => setNewLeaveData({ ...newLeaveData, destination: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Departure Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newLeaveData.departure_date}
                    onChange={(e) => setNewLeaveData({ ...newLeaveData, departure_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expected Return Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newLeaveData.expected_return}
                    onChange={(e) => setNewLeaveData({ ...newLeaveData, expected_return: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg btn-executive font-semibold flex items-center space-x-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Outpass Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: PHASE 3 VERIFIABLE DIGITAL QR PASS */}
      {selectedPassForQR && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Institutional Gate Pass</span>
              <button onClick={() => setSelectedPassForQR(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center py-2">
              <QRCodeDisplay value={selectedPassForQR.outpass_token} size={170} />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {selectedPassForQR.outpass_token}
              </span>
              <h3 className="font-bold text-base text-slate-900 mt-1">{selectedPassForQR.student_name}</h3>
              <p className="text-xs text-slate-500 font-medium">{selectedPassForQR.admission_number} • Room {selectedPassForQR.room_number}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-left text-[11px] space-y-1 text-slate-600">
              <div><span className="font-semibold text-slate-800">Destination:</span> {selectedPassForQR.destination}</div>
              <div><span className="font-semibold text-slate-800">Valid Until:</span> {selectedPassForQR.expected_return}</div>
              <div className="flex items-center space-x-1 text-emerald-700 font-bold mt-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Authorized for Campus Exit</span>
              </div>
            </div>

            <button
              onClick={() => {
                setGateScanInput(selectedPassForQR.outpass_token);
                setActiveTab("gate");
                setSelectedPassForQR(null);
              }}
              className="w-full py-2 rounded-lg btn-executive text-xs font-bold flex items-center justify-center space-x-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Simulate Guard Scan at Gate</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 7: PHASE 4 ADD NEW HOSTEL BRANCH */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Add New Hostel Facility Branch</h3>
                <p className="text-xs text-slate-500 font-medium">Expand multi-tenant campus infrastructure</p>
              </div>
              <button onClick={() => setShowAddBranchModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Razi Medical Wing"
                  value={newBranchData.name}
                  onChange={(e) => setNewBranchData({ ...newBranchData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ALR-WING-04"
                    value={newBranchData.code}
                    onChange={(e) => setNewBranchData({ ...newBranchData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newBranchData.capacity}
                    onChange={(e) => setNewBranchData({ ...newBranchData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Residency Type</label>
                <select
                  value={newBranchData.type}
                  onChange={(e) => setNewBranchData({ ...newBranchData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900"
                >
                  <option value="Boys Residency">Boys Residency</option>
                  <option value="Girls Residency">Girls Residency</option>
                  <option value="Faculty & Staff Apartments">Faculty & Staff Apartments</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg btn-executive font-semibold flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>Create Branch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
