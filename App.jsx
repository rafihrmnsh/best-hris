import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  Users,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Trash2,
  Edit,
  Save,
  X,
  Printer,
  Briefcase,
  FileText,
  Settings,
  MapPin,
  Building2,
  GraduationCap,
  Lock,
  ShieldCheck,
  UserCircle,
  Upload,
} from "lucide-react";

// Import Header Image
import headerImage from "./img/header.jpg";
import logoImage from "./img/logo.png";

// Firebase Imports
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

// --- 1. KONFIGURASI & HELPERS ---

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const formatDateIndo = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

// --- FIREBASE INIT ---
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : { apiKey: "DUMMY_KEY", authDomain: "demo", projectId: "demo" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== "undefined" ? __app_id : "pt-best-hris-v4";

// --- DATA DEMO (Simulasi Database) ---
const DEMO_DEPT = [
  "IT",
  "HRGA",
  "Sales & Marketing",
  "Operasional",
  "Keuangan",
];
const DEMO_LOC = [
  "Kantor Pusat (Jakarta)",
  "Site Plant A",
  "Project Site B",
  "Remote",
];

const DEMO_EMPLOYEES = [
  {
    id: "1",
    nik: "2023001",
    namaLengkap: "Admin HR",
    jabatan: "HR Manager",
    departemen: "HRGA",
    statusType: "PKWTT",
    statusCategory: "-",
    noHp: "08123456789",
    lokasiKerja: "Kantor Pusat (Jakarta)",
    tanggalMasuk: "2020-01-15",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    nik: "2024001",
    namaLengkap: "Budi Developer",
    jabatan: "Frontend Engineer",
    departemen: "IT",
    statusType: "PKWT",
    statusCategory: "Pro Hire",
    noHp: "08129876543",
    lokasiKerja: "Remote",
    tanggalMasuk: "2024-01-10",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    nik: "2024002",
    namaLengkap: "Siti Surveyor",
    jabatan: "Field Staff",
    departemen: "Operasional",
    statusType: "PKWT",
    statusCategory: "By Project",
    noHp: "085677889900",
    lokasiKerja: "Project Site B",
    tanggalMasuk: "2024-03-01",
    createdAt: new Date().toISOString(),
  },
];

// --- KOMPONEN UI ---

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${colorClass.replace("bg-", "text-")}`} />
    </div>
    <div>
      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b bg-slate-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Briefcase size={20} className="text-blue-600" /> {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

// --- APLIKASI UTAMA ---

export default function App() {
  // -- STATE UTAMA --
  const [user, setUser] = useState({ uid: "guest", username: "Staff" }); // Default Guest
  const [role, setRole] = useState("user"); // Default Role
  const [view, setView] = useState("dashboard");
  const [isDemo, setIsDemo] = useState(true);

  // -- DATA --
  const [employees, setEmployees] = useState(DEMO_EMPLOYEES);
  const [departments, setDepartments] = useState(DEMO_DEPT);
  const [locations, setLocations] = useState(DEMO_LOC);
  const [pkwtCategories, setPkwtCategories] = useState([
    "Pro Hire",
    "By Project",
  ]);

  // -- UI STATE --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false); // Modal Login Admin
  const [activeTab, setActiveTab] = useState("pribadi");
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("Semua");

  // -- FORM STATE --
  const initialFormState = {
    nik: "",
    namaLengkap: "",
    email: "",
    noHp: "",
    tempatLahir: "",
    tanggalLahir: "",
    jenisKelamin: "Laki-laki",
    alamatDomisili: "",
    jabatan: "",
    departemen: "",
    lokasiKerja: "",
    statusType: "PKWTT", // PKWTT atau PKWT
    statusCategory: "-", // Pro Hire atau By Project (jika PKWT)
    tanggalMasuk: "",
    tanggalHabisKontrak: "",
    pendidikanTerakhir: "",
    namaInstitusi: "",
    namaKontakDarurat: "",
    noHpKontak: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  // -- INIT --
  useEffect(() => {
    Promise.all([
      loadScript(
        "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"
      ),
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
      ),
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"
      ),
    ]);
    // Firebase Auth check removed for default guest mode
  }, []);

  // -- FETCH DATA --
  useEffect(() => {
    if (!user) return;

    if (isDemo) {
      setEmployees(DEMO_EMPLOYEES);
    } else {
      // ... existing firebase logic ...
      const q = query(
        collection(db, "artifacts", appId, "public", "data", "karyawan"),
        orderBy("createdAt", "desc")
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        () => {
          setIsDemo(true);
          setEmployees(DEMO_EMPLOYEES);
        }
      );
      return () => unsub();
    }
  }, [user, isDemo]);

  // -- HANDLERS AUTH --
  const handleAdminLogin = (username, password) => {
    if (username === "adminbest" && password === "best123") {
      setUser({ uid: "admin-user", username: "Administrator" });
      setRole("admin");
      setIsAdminLoginOpen(false);
    } else {
      alert("Username atau Password Admin salah!");
    }
  };

  const handleExitAdmin = () => {
    setUser({ uid: "guest", username: "Staff" });
    setRole("user");
    setView("dashboard");
  };

  // -- HANDLERS CRUD ADMIN --
  const handleSave = async (e) => {
    e.preventDefault();
    if (role !== "admin")
      return alert("Akses Ditolak: Hanya Admin yang bisa menyimpan data.");

    try {
      if (isDemo) {
        if (editingId) {
          setEmployees((prev) =>
            prev.map((x) => (x.id === editingId ? { ...x, ...formData } : x))
          );
        } else {
          setEmployees((prev) => [
            {
              ...formData,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      } else {
        const colRef = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "karyawan"
        );
        if (editingId) {
          await updateDoc(doc(colRef, editingId), {
            ...formData,
            updatedAt: serverTimestamp(),
          });
        } else {
          await addDoc(colRef, { ...formData, createdAt: serverTimestamp() });
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (role !== "admin") return alert("Akses Ditolak.");
    if (!confirm("Hapus data karyawan ini?")) return;

    if (isDemo) {
      setEmployees((prev) => prev.filter((x) => x.id !== id));
    } else {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "karyawan", id)
      );
    }
  };

  const handleAddMaster = (type, val) => {
    if (role !== "admin") return;
    if (type === "dept") setDepartments((prev) => [...prev, val]);
    if (type === "loc") setLocations((prev) => [...prev, val]);
    if (type === "pkwtCat") setPkwtCategories((prev) => [...prev, val]);
  };

  const handleDeleteMaster = (type, val) => {
    if (role !== "admin") return;
    if (type === "dept")
      setDepartments((prev) => prev.filter((x) => x !== val));
    if (type === "loc") setLocations((prev) => prev.filter((x) => x !== val));
    if (type === "pkwtCat")
      setPkwtCategories((prev) => prev.filter((x) => x !== val));
  };

  // -- HANDLERS IMPORT --
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = window.XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = window.XLSX.utils.sheet_to_json(ws);

        // Map data to match employee structure
        const newEmployees = data.map((row) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          nik: row.NIK || row.nik || "",
          namaLengkap: row["Nama Lengkap"] || row.namaLengkap || "",
          jabatan: row.Jabatan || row.jabatan || "",
          departemen: row.Departemen || row.departemen || "",
          statusType: row["Tipe Status"] || row.statusType || "PKWTT",
          statusCategory:
            row["Kategori Status"] ||
            row["Kategori PKWT"] ||
            row["Kategori"] ||
            row["Category"] ||
            row.statusCategory ||
            "-",
          noHp: row["No HP"] || row.noHp || "",
          email: row.Email || row.email || "",
          alamatDomisili: row["Alamat Domisili"] || row.alamatDomisili || "",
          tempatLahir: row["Tempat Lahir"] || row.tempatLahir || "",
          tanggalLahir: row["Tanggal Lahir"] || row.tanggalLahir || "",
          pendidikanTerakhir:
            row["Pendidikan Terakhir"] || row.pendidikanTerakhir || "",
          namaInstitusi: row["Nama Institusi"] || row.namaInstitusi || "",
          lokasiKerja: row["Lokasi Kerja"] || row.lokasiKerja || "",
          tanggalMasuk: row["Tanggal Masuk"] || row.tanggalMasuk || "",
          createdAt: new Date().toISOString(),
        }));

        if (role === "admin") {
          setEmployees((prev) => [...newEmployees, ...prev]);
          alert(`Berhasil mengimpor ${newEmployees.length} data karyawan.`);
        }
      } catch (error) {
        console.error("Error import:", error);
        alert("Gagal mengimpor file. Pastikan format valid.");
      } finally {
        // Reset input value to allow re-uploading the same file
        e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // -- PDF PRINT --
  const printBiodata = (emp) => {
    if (!window.jspdf) return;

    const img = new Image();
    img.src = headerImage;

    img.onload = () => {
      const doc = new window.jspdf.jsPDF();

      // Image Dimensions (A4 Width = 210mm)
      const imgWidth = 210;
      const imgHeight = (img.height * imgWidth) / img.width;

      // Add Image (Top Left)
      try {
        doc.addImage(img, "JPEG", 0, 0, imgWidth, imgHeight);
      } catch (e) {
        console.error("Error adding image to PDF", e);
      }

      // Add a separator line below the image
      doc.setLineWidth(0.5);
      doc.setDrawColor(100); // Dark gray color
      doc.line(15, imgHeight + 5, 195, imgHeight + 5); // From X=15 to X=195, 5mm below image

      // Title (Adjust Y based on image height and separator line)
      const startY = imgHeight + 15;

      doc.setFontSize(18);
      doc.setTextColor(40, 60, 100); // Dark blue
      doc.setFont("helvetica", "bold");
      doc.text("Biodata Karyawan", 105, startY, { align: "center" });

      let y = startY + 15;
      const lineHeight = 8;
      const leftColX = 20;
      const valColX = 65;

      const addSection = (title) => {
        doc.setFontSize(14);
        doc.setTextColor(40, 60, 100);
        doc.setFont("helvetica", "bold");
        doc.text(title, 20, y);
        y += 10;
      };

      const addRow = (label, value) => {
        doc.setFontSize(11);
        doc.setTextColor(64, 116, 181); // Light blue for label
        doc.setFont("helvetica", "normal");
        doc.text(label, leftColX, y);

        doc.text(":", valColX - 5, y);

        doc.setTextColor(0); // Black for value
        doc.text(value ? String(value) : "-", valColX, y);
        y += lineHeight;
      };

      // 1. Informasi Pribadi
      addSection("1. Informasi Pribadi");
      addRow("NIK", emp.nik);
      addRow("Nama Lengkap", emp.namaLengkap);
      addRow("Tempat Lahir", emp.tempatLahir);
      addRow("Tanggal Lahir", formatDateIndo(emp.tanggalLahir));
      addRow("No. HP", emp.noHp);
      addRow("Email", emp.email);
      addRow("Alamat Domisili", emp.alamatDomisili);
      y += 5;

      // 2. Informasi Pendidikan
      addSection("2. Informasi Pendidikan");
      addRow("Jenjang Pendidikan", emp.pendidikanTerakhir);
      addRow("Institusi Pendidikan", emp.namaInstitusi);
      y += 5;

      // 3. Informasi Pekerjaan
      addSection("3. Informasi Pekerjaan");
      addRow("Departemen", emp.departemen);
      addRow("Lokasi Kerja", emp.lokasiKerja);
      addRow("Tipe Status", emp.statusType);
      addRow("Jabatan", emp.jabatan);
      addRow("Tanggal Masuk", formatDateIndo(emp.tanggalMasuk));

      doc.save(`Biodata_${emp.namaLengkap || "Karyawan"}.pdf`);
    };

    img.onerror = () => {
      alert(
        "Gagal memuat gambar header. Pastikan file 'header.jpg' ada di folder 'public' proyek ini."
      );
    };
  };

  // -- FILTER & STATS --
  const filteredData = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nik?.includes(searchTerm);
      const matchDept = filterDept === "Semua" || emp.departemen === filterDept;
      return matchSearch && matchDept;
    });
  }, [employees, searchTerm, filterDept]);

  const stats = {
    total: employees.length,
    pkwtt: employees.filter((e) => e.statusType === "PKWTT").length,
    pkwt: employees.filter((e) => e.statusType === "PKWT").length,
  };

  // -- DASHBOARD UI --
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white text-slate-600 flex flex-col shadow-xl z-20 border-r border-slate-200">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex justify-center"> {/* Centering the logo */}
            <img src={logoImage} alt="PT BEST" className="w-48 h-auto" />
          </div>
          <div className="text-center">
            <span className="text-xs text-blue-600 uppercase font-bold tracking-wider">
              {role === "admin" ? "Admin Panel" : "Staff Portal"}
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setView("dashboard")}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition font-medium ${
              view === "dashboard"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "hover:bg-slate-50 text-slate-600 hover:text-blue-600"
            }`}
          >
            <LayoutDashboard size={20} /> <span>Dasbor</span>
          </button>
          <button
            onClick={() => setView("karyawan")}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition font-medium ${
              view === "karyawan"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "hover:bg-slate-50 text-slate-600 hover:text-blue-600"
            }`}
          >
            <Users size={20} /> <span>Data Karyawan</span>
          </button>
          {role === "admin" && (
            <button
              onClick={() => setView("settings")}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition font-medium ${
                view === "settings"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "hover:bg-slate-50 text-slate-600 hover:text-blue-600"
            }`}
            >
              <Settings size={20} /> <span>Master Data</span>
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-slate-100">
          {role === "admin" ? (
            <button
              onClick={handleExitAdmin}
              className="flex items-center gap-3 w-full px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition font-medium"
            >
              <LogOut size={20} /> <span>Keluar Admin</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAdminLoginOpen(true)}
              className="flex items-center gap-3 w-full px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium"
            >
              <ShieldCheck size={20} /> <span>Login Admin</span>
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className={`${role === "admin" ? "bg-red-50" : "bg-white"} h-16 border-b px-8 flex items-center justify-between shadow-sm z-10`}>
          <h2 className="font-bold text-xl text-slate-700 capitalize">
            {view === "settings"
              ? "Pengaturan Master Data"
              : view === "dashboard"
              ? "Ringkasan Data"
              : "Direktori Karyawan"}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-700 capitalize">
                {role}
              </p>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString("id-ID")}
              </p>
            </div>
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${
                role === "admin" ? "bg-blue-600" : "bg-slate-500"
              }`}
            >
              {role === "admin" ? (
                <ShieldCheck size={20} />
              ) : (
                <UserCircle size={20} />
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {/* VIEW: DASHBOARD */}
          {view === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Total Karyawan"
                  value={stats.total}
                  icon={Users}
                  colorClass="bg-blue-600"
                />
                <StatCard
                  title="PKWTT (Tetap)"
                  value={stats.pkwtt}
                  icon={Briefcase}
                  colorClass="bg-emerald-600"
                />
                <StatCard
                  title="PKWT (Kontrak)"
                  value={stats.pkwt}
                  icon={User}
                  colorClass="bg-amber-500"
                />
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4">
                  Sebaran Departemen
                </h3>
                <div className="space-y-2">
                  {departments.map((dept) => {
                    const count = employees.filter(
                      (e) => e.departemen === dept
                    ).length;
                    const pct = stats.total ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={dept}>
                        <div className="flex justify-between text-sm mb-1 font-medium">
                          <span>{dept}</span>
                          <span>{count}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: MASTER DATA (ADMIN ONLY) */}
          {view === "settings" && role === "admin" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Building2 className="text-blue-600" /> Departemen
                </h3>
                <div className="flex gap-2 mb-4">
                  <input
                    id="newDept"
                    className="border rounded px-3 py-2 flex-1"
                    placeholder="Tambah Departemen..."
                  />
                  <button
                    onClick={() => {
                      const val = document.getElementById("newDept").value;
                      if (val) {
                        handleAddMaster("dept", val);
                        document.getElementById("newDept").value = "";
                      }
                    }}
                    className="bg-blue-600 text-white p-2 rounded"
                  >
                    <Plus />
                  </button>
                </div>
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {departments.map((d, i) => (
                    <li
                      key={i}
                      className="flex justify-between bg-slate-50 p-2 rounded border"
                    >
                      {d}{" "}
                      <button
                        onClick={() => handleDeleteMaster("dept", d)}
                        className="text-red-500 hover:bg-red-100 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <MapPin className="text-emerald-600" /> Lokasi Kerja
                </h3>
                <div className="flex gap-2 mb-4">
                  <input
                    id="newLoc"
                    className="border rounded px-3 py-2 flex-1"
                    placeholder="Tambah Lokasi..."
                  />
                  <button
                    onClick={() => {
                      const val = document.getElementById("newLoc").value;
                      if (val) {
                        handleAddMaster("loc", val);
                        document.getElementById("newLoc").value = "";
                      }
                    }}
                    className="bg-emerald-600 text-white p-2 rounded"
                  >
                    <Plus />
                  </button>
                </div>
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {locations.map((l, i) => (
                    <li
                      key={i}
                      className="flex justify-between bg-slate-50 p-2 rounded border"
                    >
                      {l}{" "}
                      <button
                        onClick={() => handleDeleteMaster("loc", l)}
                        className="text-red-500 hover:bg-red-100 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <FileText className="text-purple-600" /> Kategori PKWT
                </h3>
                <div className="flex gap-2 mb-4">
                  <input
                    id="newPkwtCat"
                    className="border rounded px-3 py-2 flex-1"
                    placeholder="Tambah Kategori..."
                  />
                  <button
                    onClick={() => {
                      const val = document.getElementById("newPkwtCat").value;
                      if (val) {
                        handleAddMaster("pkwtCat", val);
                        document.getElementById("newPkwtCat").value = "";
                      }
                    }}
                    className="bg-purple-600 text-white p-2 rounded"
                  >
                    <Plus />
                  </button>
                </div>
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {pkwtCategories.map((c, i) => (
                    <li
                      key={i}
                      className="flex justify-between bg-slate-50 p-2 rounded border"
                    >
                      {c}{" "}
                      <button
                        onClick={() => handleDeleteMaster("pkwtCat", c)}
                        className="text-red-500 hover:bg-red-100 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* VIEW: KARYAWAN */}
          {view === "karyawan" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border flex flex-wrap justify-between gap-4">
                <div className="flex gap-2 flex-1 min-w-[250px]">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-2.5 text-slate-400"
                      size={18}
                    />
                    <input
                      className="pl-10 pr-4 py-2 border rounded w-full"
                      placeholder="Cari nama / NIK..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="border rounded px-2"
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                  >
                    <option value="Semua">Semua Dept</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                {role === "admin" && (
                  <>
                    <div className="flex items-center">
                      <input
                        type="file"
                        id="importCsv"
                        accept=".csv, .xlsx, .xls"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <label
                        htmlFor="importCsv"
                        className="bg-emerald-600 text-white px-4 py-2 rounded flex items-center gap-2 font-medium hover:bg-emerald-700 cursor-pointer mr-2"
                      >
                        <Upload size={18} /> Import CSV
                      </label>
                    </div>
                    <button
                      onClick={() => {
                        setFormData(initialFormState);
                        setEditingId(null);
                        setIsModalOpen(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 font-medium hover:bg-blue-700"
                    >
                      <Plus size={18} /> Tambah
                    </button>
                  </>
                )}
              </div>

              <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="p-4">Nama & NIK</th>
                      <th className="p-4">Posisi</th>
                      <th className="p-4">Status (Kategori)</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredData.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">
                            {emp.namaLengkap}
                          </div>
                          <div className="text-xs text-slate-500">
                            {emp.nik}
                          </div>
                        </td>
                        <td className="p-4">
                          <div>{emp.jabatan}</div>
                          <div className="text-xs text-blue-600">
                            {emp.departemen}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              emp.statusType === "PKWTT"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {emp.statusType}
                          </span>
                          {emp.statusType === "PKWT" && (
                            <div className="text-xs text-slate-500 mt-1 font-medium">
                              {emp.statusCategory}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => printBiodata(emp)}
                            className="p-2 text-slate-500 hover:bg-slate-200 rounded"
                          >
                            <Printer size={16} />
                          </button>
                          {role === "admin" && (
                            <>
                              <button
                                onClick={() => {
                                  setFormData(emp);
                                  setEditingId(emp.id);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(emp.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL FORM KARYAWAN (ADMIN ONLY) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Data Karyawan" : "Input Karyawan Baru"}
      >
        <form onSubmit={handleSave}>
          <div className="flex border-b mb-6">
            {["pribadi", "pekerjaan", "pendukung"].map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 capitalize border-b-2 transition ${
                  activeTab === t
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {activeTab === "pribadi" && (
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  required
                  className="border p-2 rounded"
                  placeholder="NIK"
                  value={formData.nik}
                  onChange={(e) =>
                    setFormData({ ...formData, nik: e.target.value })
                  }
                />
                <input
                  required
                  className="border p-2 rounded"
                  placeholder="Nama Lengkap"
                  value={formData.namaLengkap}
                  onChange={(e) =>
                    setFormData({ ...formData, namaLengkap: e.target.value })
                  }
                />
                <input
                  className="border p-2 rounded"
                  placeholder="Tempat Lahir"
                  value={formData.tempatLahir}
                  onChange={(e) =>
                    setFormData({ ...formData, tempatLahir: e.target.value })
                  }
                />
                <div>
                  <input
                    type="date"
                    className="w-full border p-2 rounded"
                    value={formData.tanggalLahir}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggalLahir: e.target.value })
                    }
                  />
                  {formData.tanggalLahir && (
                    <p className="text-xs text-slate-500 mt-1">
                      Terpilih: {formatDateIndo(formData.tanggalLahir)}
                    </p>
                  )}
                </div>
                <input
                  className="border p-2 rounded"
                  placeholder="No HP"
                  value={formData.noHp}
                  onChange={(e) =>
                    setFormData({ ...formData, noHp: e.target.value })
                  }
                />
                <input
                  className="border p-2 rounded"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <textarea
                  className="md:col-span-2 border p-2 rounded"
                  placeholder="Alamat Domisili"
                  value={formData.alamatDomisili}
                  onChange={(e) =>
                    setFormData({ ...formData, alamatDomisili: e.target.value })
                  }
                />
              </div>
            )}

            {activeTab === "pekerjaan" && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">
                    Departemen
                  </label>
                  <select
                    className="w-full border p-2 rounded"
                    value={formData.departemen}
                    onChange={(e) =>
                      setFormData({ ...formData, departemen: e.target.value })
                    }
                  >
                    <option value="">- Pilih -</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">
                    Lokasi Kerja
                  </label>
                  <select
                    className="w-full border p-2 rounded"
                    value={formData.lokasiKerja}
                    onChange={(e) =>
                      setFormData({ ...formData, lokasiKerja: e.target.value })
                    }
                  >
                    <option value="">- Pilih -</option>
                    {locations.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LOGIKA STATUS BERJENJANG */}
                <div className="bg-slate-50 p-3 rounded border md:col-span-2 grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500">
                      Tipe Status
                    </label>
                    <select
                      className="w-full border p-2 rounded mt-1"
                      value={formData.statusType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statusType: e.target.value,
                          statusCategory: "-",
                        })
                      }
                    >
                      <option value="PKWTT">PKWTT (Tetap)</option>
                      <option value="PKWT">PKWT (Kontrak)</option>
                    </select>
                  </div>
                  {formData.statusType === "PKWT" && (
                    <div>
                      <label className="text-xs font-bold text-slate-500">
                        Kategori PKWT
                      </label>
                      <select
                        className="w-full border p-2 rounded mt-1"
                        value={formData.statusCategory}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            statusCategory: e.target.value,
                          })
                        }
                      >
                        <option value="-">- Pilih Kategori -</option>
                        {pkwtCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">
                    Jabatan
                  </label>
                  <input
                    className="w-full border p-2 rounded"
                    value={formData.jabatan}
                    onChange={(e) =>
                      setFormData({ ...formData, jabatan: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">
                    Tanggal Masuk
                  </label>
                  <input
                    type="date"
                    className="w-full border p-2 rounded"
                    value={formData.tanggalMasuk}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggalMasuk: e.target.value })
                    }
                  />
                  {formData.tanggalMasuk && (
                    <p className="text-xs text-slate-500 mt-1">
                      Terpilih: {formatDateIndo(formData.tanggalMasuk)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "pendukung" && (
              <div className="space-y-4">
                <div className="border p-3 rounded">
                  <h4 className="font-bold text-sm mb-2">Pendidikan</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="border p-2 rounded"
                      placeholder="Jenjang"
                      value={formData.pendidikanTerakhir}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pendidikanTerakhir: e.target.value,
                        })
                      }
                    />
                    <input
                      className="border p-2 rounded"
                      placeholder="Institusi"
                      value={formData.namaInstitusi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          namaInstitusi: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL LOGIN ADMIN */}
      <Modal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        title="" // Empty title as we have custom header
      >
        <div className="text-center mb-6">
          <img
            src={logoImage}
            alt="PT BEST"
            className="h-20 mx-auto mb-4 object-contain"
          />
          <h2 className="text-xl font-bold text-slate-800">Admin Login</h2>
          <p className="text-slate-500 text-sm">
            Masukkan kredensial administrator
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const u = e.target.username.value;
            const p = e.target.password.value;
            handleAdminLogin(u, p);
          }}
          className="space-y-5"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <input
              name="username"
              type="text"
              placeholder="Username"
              required
              autoFocus
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setIsAdminLoginOpen(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Login
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} PT Bakti Energi Sejahtera
          </p>
        </div>
      </Modal>
    </div>
  );
}
