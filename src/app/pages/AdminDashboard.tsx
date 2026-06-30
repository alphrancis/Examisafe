import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../../api/firebase-client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import QRCode from "qrcode";

type Tab = "appupdate" | "finalmessage" | "password" | "webconfig" | "qrcode";

interface AppUpdateData {
    changelog: string;
    download_url1: string;
    download_url2: string;
    download_url3: string;
    latest_version: string;
}

interface FinalMessageData {
    Message: string;
}

interface PasswordData {
    "1": string;
    "2": string;
    "3": string;
}

interface WebConfigData {
    URL: string;
}

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>("appupdate");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const [appUpdate, setAppUpdate] = useState<AppUpdateData>({
        changelog: "",
        download_url1: "",
        download_url2: "",
        download_url3: "",
        latest_version: "",
    });

    const [finalMessage, setFinalMessage] = useState<FinalMessageData>({
        Message: "",
    });

    const [passwordData, setPasswordData] = useState<PasswordData>({
        "1": "",
        "2": "",
        "3": "",
    });

    const [webConfig, setWebConfig] = useState<WebConfigData>({
        URL: "",
    });

    // QR Code state
    const [qrText, setQrText] = useState("");
    const [qrDataUrl, setQrDataUrl] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const COLLECTION = "TNHSAExamiSafe";

    useEffect(() => {
        fetchAllData();
    }, []);

    // Real-time QR code generation
    useEffect(() => {
        const generateQR = async () => {
            if (!qrText.trim()) {
                setQrDataUrl("");
                return;
            }
            try {
                const dataUrl = await QRCode.toDataURL(qrText, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: "#000000",
                        light: "#ffffff",
                    },
                });
                setQrDataUrl(dataUrl);
            } catch (err) {
                console.error("QR generation error:", err);
            }
        };
        generateQR();
    }, [qrText]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [appSnap, msgSnap, passSnap, webSnap] = await Promise.all([
                getDoc(doc(db, COLLECTION, "AppUpdate")),
                getDoc(doc(db, COLLECTION, "FinalMessage")),
                getDoc(doc(db, COLLECTION, "Password")),
                getDoc(doc(db, COLLECTION, "WebConfig")),
            ]);

            if (appSnap.exists()) setAppUpdate(appSnap.data() as AppUpdateData);
            if (msgSnap.exists()) setFinalMessage(msgSnap.data() as FinalMessageData);
            if (passSnap.exists()) setPasswordData(passSnap.data() as PasswordData);
            if (webSnap.exists()) setWebConfig(webSnap.data() as WebConfigData);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (docName: string, data: any) => {
        setSaving(true);
        setSaveMessage("");
        try {
            await setDoc(doc(db, COLLECTION, docName), data);
            setSaveMessage(`✅ ${docName} saved!`);
            setTimeout(() => setSaveMessage(""), 3000);
        } catch (err: any) {
            setSaveMessage(`❌ Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/admin");
    };

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setSidebarOpen(false);
    };

    const handleDownloadQR = () => {
        if (!qrDataUrl) return;
        const link = document.createElement("a");
        link.href = qrDataUrl;
        link.download = `qrcode-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: "appupdate", label: "App Update" },
        { key: "finalmessage", label: "Final Message" },
        { key: "password", label: "Passwords" },
        { key: "webconfig", label: "Web Config" },
        { key: "qrcode", label: "Generate QR" },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-lg">Loading data...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Mobile Header with hamburger */}
            <div className="lg:hidden bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-gray-300 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sidebarOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex bg-gray-800 border-b border-gray-700 px-6 py-4 items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-gray-400 text-sm">TNHSA ExamiSafe</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">{user?.email}</span>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="flex relative">
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar - always visible on desktop, slide-out on mobile */}
                <div
                    className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-200 ease-in-out h-screen lg:h-auto lg:min-h-screen ${
                        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
                >
                    <div className="p-4 space-y-1 lg:pt-4 pt-16">
                        {/* Mobile user info inside sidebar */}
                        <div className="lg:hidden px-4 py-3 mb-4 border-b border-gray-700">
                            <p className="text-gray-300 text-sm truncate">{user?.email}</p>
                            <button
                                onClick={handleLogout}
                                className="mt-2 w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Logout
                            </button>
                        </div>

                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === tab.key
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0">
                    {saveMessage && (
                        <div className="mb-4 sm:mb-6 bg-green-900/50 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg text-sm">
                            {saveMessage}
                        </div>
                    )}

                    {/* App Update Panel */}
                    {activeTab === "appupdate" && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 sm:mb-6">App Update</h2>
                            <div className="space-y-4 sm:space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Latest Version</label>
                                    <input
                                        type="text"
                                        value={appUpdate.latest_version}
                                        onChange={(e) => setAppUpdate({ ...appUpdate, latest_version: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Change Log</label>
                                    <textarea
                                        value={appUpdate.changelog}
                                        onChange={(e) => setAppUpdate({ ...appUpdate, changelog: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Download URL 1</label>
                                    <input
                                        type="text"
                                        value={appUpdate.download_url1}
                                        onChange={(e) => setAppUpdate({ ...appUpdate, download_url1: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Download URL 2</label>
                                    <input
                                        type="text"
                                        value={appUpdate.download_url2}
                                        onChange={(e) => setAppUpdate({ ...appUpdate, download_url2: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Download URL 3</label>
                                    <input
                                        type="text"
                                        value={appUpdate.download_url3}
                                        onChange={(e) => setAppUpdate({ ...appUpdate, download_url3: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSave("AppUpdate", appUpdate)}
                                    disabled={saving}
                                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors text-base"
                                >
                                    {saving ? "Saving..." : "Save App Update"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Final Message Panel */}
                    {activeTab === "finalmessage" && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 sm:mb-6">Final Message</h2>
                            <div className="space-y-4 sm:space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                                    <textarea
                                        value={finalMessage.Message}
                                        onChange={(e) => setFinalMessage({ Message: e.target.value })}
                                        rows={6}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSave("FinalMessage", finalMessage)}
                                    disabled={saving}
                                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors text-base"
                                >
                                    {saving ? "Saving..." : "Save Final Message"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Password Panel */}
                    {activeTab === "password" && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 sm:mb-6">Passwords</h2>
                            <div className="space-y-4 sm:space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Password 1</label>
                                    <input
                                        type="text"
                                        value={passwordData["1"]}
                                        onChange={(e) => setPasswordData({ ...passwordData, "1": e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Password 2</label>
                                    <input
                                        type="text"
                                        value={passwordData["2"]}
                                        onChange={(e) => setPasswordData({ ...passwordData, "2": e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Password 3</label>
                                    <input
                                        type="text"
                                        value={passwordData["3"]}
                                        onChange={(e) => setPasswordData({ ...passwordData, "3": e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSave("Password", passwordData)}
                                    disabled={saving}
                                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors text-base"
                                >
                                    {saving ? "Saving..." : "Save Passwords"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Web Config Panel */}
                    {activeTab === "webconfig" && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 sm:mb-6">Web Config</h2>
                            <div className="space-y-4 sm:space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                                    <input
                                        type="text"
                                        value={webConfig.URL}
                                        onChange={(e) => setWebConfig({ URL: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSave("WebConfig", webConfig)}
                                    disabled={saving}
                                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors text-base"
                                >
                                    {saving ? "Saving..." : "Save Web Config"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* QR Code Generator Panel */}
                    {activeTab === "qrcode" && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 sm:mb-6">Generate QR Code</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Text / URL / Data
                                    </label>
                                    <textarea
                                        value={qrText}
                                        onChange={(e) => setQrText(e.target.value)}
                                        placeholder="Type something here to generate a QR code..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        {qrText.length} characters · QR updates automatically as you type
                                    </p>
                                </div>

                                {/* QR Preview */}
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="bg-white rounded-xl p-6 shadow-lg">
                                        {qrDataUrl ? (
                                            <img
                                                src={qrDataUrl}
                                                alt="Generated QR Code"
                                                className="w-64 h-64 sm:w-72 sm:h-72"
                                            />
                                        ) : (
                                            <div className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center bg-gray-100 rounded-lg">
                                                <div className="text-center">
                                                    <svg
                                                        className="w-16 h-16 mx-auto text-gray-400 mb-2"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                                        />
                                                    </svg>
                                                    <p className="text-gray-500 text-sm">Start typing to generate QR</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {qrDataUrl && (
                                        <button
                                            onClick={handleDownloadQR}
                                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-base"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                />
                                            </svg>
                                            Download QR Code
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}