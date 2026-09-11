import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle,
  Smartphone,
  Send,
  ExternalLink,
  Copy,
  RefreshCw,
  LogOut,
  X,
  AlertTriangle,
  FileText
} from 'lucide-react';
import {
  fetchWhatsAppStatus,
  fetchWhatsAppReport,
  sendWhatsAppReport,
  disconnectWhatsApp,
  WhatsAppStatus
} from '../services/api';

interface WhatsAppDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [report, setReport] = useState<string>('');
  const [recipientType, setRecipientType] = useState<'self' | 'custom'>('self');
  const [customNumber, setCustomNumber] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Poll status while modal is open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const checkStatusAndReport = async () => {
      try {
        const [statusData, reportData] = await Promise.all([
          fetchWhatsAppStatus(),
          fetchWhatsAppReport()
        ]);
        if (isMounted) {
          setStatus(statusData);
          setReport(reportData.report);
        }
      } catch (err) {
        console.error('Error fetching WhatsApp details:', err);
      }
    };

    checkStatusAndReport();

    const interval = setInterval(() => {
      fetchWhatsAppStatus()
        .then((data) => {
          if (isMounted) setStatus(data);
        })
        .catch(() => {});
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async () => {
    setSending(true);
    setSendSuccess(null);
    setSendError(null);

    const targetRecipient = recipientType === 'self' ? 'self' : customNumber.trim();

    if (recipientType === 'custom' && !customNumber.trim()) {
      setSendError('Please enter a valid mobile number.');
      setSending(false);
      return;
    }

    try {
      const res = await sendWhatsAppReport(targetRecipient, report);
      if (res.success) {
        setSendSuccess(`Report successfully sent to ${res.recipient}! Delivered to WhatsApp.`);
      } else {
        setSendError(res.error || 'Failed to dispatch report.');
      }
    } catch (err: any) {
      setSendError(err.message || 'Error communicating with WhatsApp bridge.');
    } finally {
      setSending(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to unlink this WhatsApp device?')) return;
    try {
      await disconnectWhatsApp();
      const updated = await fetchWhatsAppStatus();
      setStatus(updated);
    } catch (err: any) {
      alert('Failed to disconnect: ' + err.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const directWebUrl = `https://wa.me/${recipientType === 'custom' && customNumber ? customNumber.replace(/\D/g, '') : ''}?text=${encodeURIComponent(report)}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-[#2C444D]/50 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-white border border-[#C7B8A4] rounded-2xl shadow-2xl flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#C7B8A4] flex items-center justify-between bg-[#FAF8F5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#C7B8A4] flex items-center justify-center text-[#5A7C83] shadow-xs">
              <MessageSquare className="w-5 h-5 fill-[#5A7C83]/20" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C444D] flex items-center gap-2">
                <span>WhatsApp Intelligence Dispatch</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white text-[#5A7C83] border border-[#5A7C83] font-bold">
                  Automated Gateway
                </span>
              </h2>
              <p className="text-xs text-[#2C444D]/70">
                Dispatch analytical reports & CPI forecasts directly to WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#2C444D]/60 hover:text-[#2C444D] hover:bg-white border border-transparent hover:border-[#C7B8A4] flex items-center justify-center transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 2-Column Responsive Layout */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Column: Device Link & QR Code (5 cols) */}
            <div className="md:col-span-5 border border-[#C7B8A4] rounded-xl p-4 bg-[#FAF8F5] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#C7B8A4]/50">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#5A7C83]" />
                    <span className="font-bold text-[#2C444D] uppercase tracking-wider text-[11px]">
                      1. Device Pairing
                    </span>
                  </div>
                  {status?.is_connected ? (
                    <div className="flex items-center gap-1.5 bg-white border border-[#5A7C83] text-[#5A7C83] px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-[#5A7C83] animate-pulse" />
                      <span>LINKED</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-white border border-[#A88C6C] text-[#A88C6C] px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-[#A88C6C] animate-pulse" />
                      <span>SCAN QR</span>
                    </div>
                  )}
                </div>

                {status?.is_connected ? (
                  <div className="pt-4 space-y-3">
                    <div className="p-3 bg-white border border-[#C7B8A4] rounded-xl shadow-xs space-y-2">
                      <div className="flex items-center gap-2 text-[#5A7C83] font-bold">
                        <CheckCircle className="w-4 h-4" />
                        <span>Active Session</span>
                      </div>
                      <div className="text-[#2C444D] font-mono text-sm font-extrabold">
                        +{status.user_number}
                      </div>
                      <p className="text-[11px] text-[#2C444D]/70 leading-relaxed">
                        Your WhatsApp is authenticated. You can send reports directly to yourself or any custom number.
                      </p>
                    </div>

                    <button
                      onClick={handleDisconnect}
                      className="btn-secondary w-full h-8 text-xs text-[#A88C6C] hover:border-[#A88C6C]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Unlink Device Session
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 flex flex-col items-center space-y-3">
                    {status?.qr_code ? (
                      <div className="p-2.5 bg-white rounded-xl border border-[#C7B8A4] shadow-xs">
                        <img
                          src={status.qr_code}
                          alt="WhatsApp Link QR Code"
                          className="w-44 h-44 object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-44 h-44 rounded-xl border border-dashed border-[#C7B8A4] bg-white flex flex-col items-center justify-center text-[#A88C6C] gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#5A7C83]" />
                        <span className="font-semibold">Generating QR...</span>
                      </div>
                    )}

                    <div className="text-[#2C444D]/80 text-[11px] space-y-1 w-full bg-white p-3 rounded-lg border border-[#C7B8A4] shadow-xs">
                      <strong className="text-[#2C444D] uppercase tracking-wide block text-[10px] mb-1 font-bold">
                        Instructions:
                      </strong>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Open WhatsApp on mobile</li>
                        <li>Tap <strong>Settings</strong> &gt; <strong>Linked Devices</strong></li>
                        <li>Tap <strong>Link a Device</strong> &amp; scan this code</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#C7B8A4]/40 text-[11px] text-[#2C444D]/60 text-center font-mono">
                * Real-time Multi-Device synchronization via Baileys
              </div>
            </div>

            {/* Right Column: Recipient & Intelligence Dossier (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Recipient Picker */}
              <div className="border border-[#C7B8A4] rounded-xl p-4 bg-white shadow-xs space-y-3">
                <div className="font-bold text-[#2C444D] uppercase tracking-wider text-[11px]">
                  2. Choose Report Recipient
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                      recipientType === 'self'
                        ? 'border-[#2C444D] bg-[#FAF8F5] text-[#2C444D] shadow-xs ring-1 ring-[#2C444D]'
                        : 'border-[#C7B8A4] hover:bg-[#FAF8F5] text-[#2C444D]/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name="recipientType"
                      checked={recipientType === 'self'}
                      onChange={() => setRecipientType('self')}
                      className="accent-[#2C444D]"
                    />
                    <div>
                      <div className="font-bold text-xs text-[#2C444D]">Message Yourself</div>
                      <div className="text-[10px] text-[#2C444D]/60">Linked phone number</div>
                    </div>
                  </label>

                  <label
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                      recipientType === 'custom'
                        ? 'border-[#2C444D] bg-[#FAF8F5] text-[#2C444D] shadow-xs ring-1 ring-[#2C444D]'
                        : 'border-[#C7B8A4] hover:bg-[#FAF8F5] text-[#2C444D]/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name="recipientType"
                      checked={recipientType === 'custom'}
                      onChange={() => setRecipientType('custom')}
                      className="accent-[#2C444D]"
                    />
                    <div>
                      <div className="font-bold text-xs text-[#2C444D]">Custom Number</div>
                      <div className="text-[10px] text-[#2C444D]/60">Judges or stakeholders</div>
                    </div>
                  </label>
                </div>

                {recipientType === 'custom' && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-[#2C444D] mb-1">
                      Recipient Mobile Number (with country code):
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 919876543210 or 9876543210"
                      value={customNumber}
                      onChange={(e) => setCustomNumber(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#FAF8F5] border border-[#C7B8A4] text-xs font-mono text-[#2C444D] placeholder-[#2C444D]/50 focus:outline-none focus:border-[#5A7C83]"
                    />
                  </div>
                )}
              </div>

              {/* Report Preview */}
              <div className="border border-[#C7B8A4] rounded-xl p-4 bg-white shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#2C444D] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#5A7C83]" />
                    <span>3. Intelligence Bulletin Preview</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="btn-secondary h-7 px-2.5 text-[11px]"
                  >
                    <Copy className="w-3 h-3 text-[#A88C6C]" />
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>

                <div className="bg-[#FAF8F5] border border-[#C7B8A4] text-[#2C444D] font-mono text-[11px] p-3 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                  {report || 'Generating live report from database...'}
                </div>
              </div>

              {/* Feedback Alerts */}
              {sendSuccess && (
                <div className="p-3 rounded-xl border border-[#5A7C83] bg-[#FAF8F5] text-[#5A7C83] font-bold flex items-center gap-2 shadow-xs">
                  <CheckCircle className="w-4 h-4 text-[#5A7C83] shrink-0" />
                  <span>{sendSuccess}</span>
                </div>
              )}

              {sendError && (
                <div className="p-3 rounded-xl border border-[#A88C6C] bg-[#FAF8F5] text-[#A88C6C] font-bold flex items-center gap-2 shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-[#A88C6C] shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#C7B8A4] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <a
            href={directWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full sm:w-auto"
            title="Open in WhatsApp Web with pre-filled report"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#A88C6C]" />
            Direct WhatsApp Web Link
          </a>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto"
            >
              Close
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !status?.is_connected}
              className={`btn-primary w-full sm:w-auto ${
                !status?.is_connected ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Report via WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
