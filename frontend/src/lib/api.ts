const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  is_superadmin: boolean;
  memberships: {
    organization_id: string;
    organization_name: string;
    hostel_id?: string;
    role: string;
  }[];
}

export interface HostelStats {
  hostel_id: string;
  hostel_name: string;
  total_buildings: number;
  total_rooms: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  active_students: number;
}

export interface RoomItem {
  id: string;
  room_number: string;
  capacity: number;
  beds: {
    id: string;
    bed_number: string;
    status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";
    is_active: boolean;
  }[];
}

export interface StudentItem {
  id: string;
  admission_number: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
  hostel_id: string;
  bed_number?: string;
  room_number?: string;
}

export interface GateLogItem {
  id: string;
  event_type: "CHECK_IN" | "CHECK_OUT";
  student_name: string;
  admission_number: string;
  timestamp: string;
  remarks?: string;
}

export interface LeaveRequestItem {
  id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  room_number?: string;
  reason: string;
  destination: string;
  departure_date: string;
  expected_return: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  warden_remarks?: string;
  outpass_token: string;
}

export interface InvoiceItem {
  id: string;
  invoice_number: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  notes?: string;
  items: { id: string; description: string; amount: number }[];
  payments: {
    id: string;
    receipt_number: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    transaction_reference?: string;
    payment_date: string;
  }[];
}

export interface FinanceOverviewStats {
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  total_overdue: number;
  collection_rate: number;
  total_invoices_count: number;
  paid_invoices_count: number;
  pending_invoices_count: number;
}

export interface ComplaintItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  student_name: string;
  created_at: string;
}

export async function checkBackendHealth(): Promise<{ status: string; service?: string } | null> {
  try {
    const res = await fetch("http://127.0.0.1:8000/health", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchHostels(token?: string) {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/hostels`, { headers, cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchRooms(hostelId?: string, token?: string): Promise<RoomItem[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const url = hostelId ? `${API_BASE}/accommodation/rooms?hostel_id=${hostelId}` : `${API_BASE}/accommodation/rooms`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchStudents(hostelId?: string, token?: string): Promise<StudentItem[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const url = hostelId ? `${API_BASE}/students?hostel_id=${hostelId}` : `${API_BASE}/students`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchGateLogs(hostelId?: string, token?: string): Promise<GateLogItem[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const url = hostelId ? `${API_BASE}/operations/gate-logs?hostel_id=${hostelId}` : `${API_BASE}/operations/gate-logs`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchLeaveRequests(hostelId?: string, token?: string): Promise<LeaveRequestItem[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const url = hostelId ? `${API_BASE}/operations/leave-requests?hostel_id=${hostelId}` : `${API_BASE}/operations/leave-requests`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function submitLeaveRequest(data: any, token?: string): Promise<LeaveRequestItem> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/operations/leave-requests`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to submit request" }));
    throw new Error(err.detail || "Submission failed");
  }
  return await res.json();
}

export async function approveLeaveRequest(leaveId: string, action: "APPROVE" | "REJECT", remarks?: string, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/operations/leave-requests/${leaveId}/approve?action=${action}${remarks ? `&remarks=${encodeURIComponent(remarks)}` : ""}`, {
    method: "PATCH",
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Approval failed" }));
    throw new Error(err.detail || "Action failed");
  }
  return await res.json();
}

export async function verifyGatePass(data: { hostel_id: string; pass_token_or_admission: string; event_type: string; remarks?: string }, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/operations/gate-pass/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Verification failed" }));
    throw new Error(err.detail || "Verification failed");
  }
  return await res.json();
}

export async function fetchInvoices(hostelId?: string, token?: string): Promise<InvoiceItem[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const url = hostelId ? `${API_BASE}/finance/invoices?hostel_id=${hostelId}` : `${API_BASE}/finance/invoices`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createInvoice(data: any, token?: string): Promise<InvoiceItem> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/finance/invoices`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to create invoice" }));
    throw new Error(err.detail || "Invoice generation failed");
  }
  return await res.json();
}

export async function recordPayment(data: any, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/finance/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to record payment" }));
    throw new Error(err.detail || "Payment failed");
  }
  return await res.json();
}

export async function fetchFinanceStats(hostelId?: string, token?: string): Promise<FinanceOverviewStats> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const url = hostelId ? `${API_BASE}/finance/stats?hostel_id=${hostelId}` : `${API_BASE}/finance/stats`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return {
      total_billed: 0,
      total_collected: 0,
      total_outstanding: 0,
      total_overdue: 0,
      collection_rate: 0,
      total_invoices_count: 0,
      paid_invoices_count: 0,
      pending_invoices_count: 0
    };
    return await res.json();
  } catch {
    return {
      total_billed: 0,
      total_collected: 0,
      total_outstanding: 0,
      total_overdue: 0,
      collection_rate: 0,
      total_invoices_count: 0,
      paid_invoices_count: 0,
      pending_invoices_count: 0
    };
  }
}

export async function fetchComplaints(hostelId?: string, token?: string): Promise<ComplaintItem[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const url = hostelId ? `${API_BASE}/operations/complaints?hostel_id=${hostelId}` : `${API_BASE}/operations/complaints`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function recordGateEvent(data: { hostel_id: string; student_admission_number: string; event_type: string; remarks?: string }, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/operations/gate-log`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to record event" }));
    throw new Error(err.detail || "Failed to record gate event");
  }
  return await res.json();
}

export async function admitNewStudent(data: any, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/students/admit`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to admit student" }));
    throw new Error(err.detail || "Admission failed");
  }
  return await res.json();
}
