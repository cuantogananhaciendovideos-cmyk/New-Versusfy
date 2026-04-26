import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { Shield, ShieldAlert, ShieldCheck, Info, Database } from 'lucide-react';
import { doc, getDocFromServer } from 'firebase/firestore';

export const FirebaseStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'missing'>('checking');
  const [details, setDetails] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [dbId, setDbId] = useState<string>('');

  const [detectedKeys, setDetectedKeys] = useState<string[]>([]);
  const [gmailStatus, setGmailStatus] = useState<string>('');

  useEffect(() => {
    const runtimeConfig = (window as any).VERSUSFY_RUNTIME_CONFIG || {};
    setProjectId(runtimeConfig.projectId || '');
    setDbId(runtimeConfig.databaseId || '(default)');
    setDetectedKeys(runtimeConfig.detectedKeys || []);
    setGmailStatus(runtimeConfig.gmailStatus || 'MISSING');

    if (!db) {
      setStatus('missing');
      setDetails('Versusfy: No Firebase configuration detected. Real-time features disabled.');
      return;
    }

    const testConnection = async () => {
      try {
        // Real tactical ping
        await getDocFromServer(doc(db, '_versusfy_tactical', 'ping'));
        setStatus('connected');
        setDetails('Versusfy Supreme Shield: Active & Synchronized.');
      } catch (e: any) {
        console.warn("Connection test warning:", e.message);
        if (e.message.includes('not found') || e.message.includes('Database')) {
          setStatus('error');
          const isGenProject = runtimeConfig.projectId?.startsWith('gen-');
          if (isGenProject && runtimeConfig.databaseId && runtimeConfig.databaseId !== '(default)') {
            setDetails(`Versusfy Error: Trying to use DB "${runtimeConfig.databaseId}" with the wrong Project ID (${runtimeConfig.projectId?.slice(0, 8)}). Set FIREBASE_PROJECT_ID on Railway.`);
          } else {
            setDetails(`Database "${runtimeConfig.databaseId || '(default)'}" not found. Verify your Railway VITE_FIREBASE_DATABASE_ID.`);
          }
        } else if (e.message.includes('permissions')) {
          setStatus('connected');
          setDetails('Firebase active. Permissions enforced.');
        } else if (e.message.includes('offline') || e.message.includes('unavailable')) {
          setStatus('error');
          const hasApiKey = runtimeConfig.apiKey && runtimeConfig.apiKey.length > 20;
          setDetails(hasApiKey 
            ? `Connection Error: Client reported "offline". Verify VITE_FIREBASE_PROJECT_ID (${runtimeConfig.projectId}) matches your API Key.` 
            : "Connection Error: API Key missing or invalid. Check Railway Variables.");
        } else {
          setStatus('error');
          setDetails(`Connection Error: ${e.message.slice(0, 80)}...`);
        }
      }
    };

    testConnection();
  }, []);

  if (status === 'connected') return null; // Don't show anything if everything is fine

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl border backdrop-blur-md shadow-2xl max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-500 ${
      status === 'error' || status === 'missing' 
        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
    }`}>
      <div className="flex items-start gap-3">
        {status === 'connected' ? (
          <ShieldCheck className="w-5 h-5 shrink-0" />
        ) : status === 'error' || status === 'missing' ? (
          <ShieldAlert className="w-5 h-5 shrink-0" />
        ) : (
          <Shield className="w-5 h-5 shrink-0" />
        )}
        <div>
          <h4 className="text-sm font-bold mb-1">
            {status === 'missing' ? 'Firebase Disconnected' : 'Firebase Status'}
          </h4>
          <p className="text-xs opacity-80 leading-relaxed">
            {details}
          </p>
          {(status === 'missing' || status === 'error') && (
            <div className="mt-3 pt-3 border-t border-current/10">
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1 opacity-60 flex items-center gap-1">
                <Info className="w-3 h-3" /> Fix Instructions
              </p>
              <p className="text-[10px] leading-tight">
                Check <strong>VITE_FIREBASE_API_KEY</strong> in Railway Variables. Ensure no spaces or quotes.
              </p>
              {detectedKeys.length > 0 && (
                <div className="mt-2 pt-2 border-t border-current/5">
                  <p className="text-[9px] font-black uppercase mb-1">Railway Variables:</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {detectedKeys.map(k => (
                      <span key={k} className="bg-emerald-green/20 text-emerald-green px-1.5 py-0.5 rounded text-[8px] font-bold">
                        {k}
                      </span>
                    ))}
                  </div>
                  <div className="bg-black/20 p-2 rounded text-[9px] font-mono leading-tight">
                    <p>GMAIL USER: <span className={gmailStatus === 'READY' ? 'text-emerald-green' : 'text-apple-red'}>{gmailStatus}</span></p>
                    <p>REQUISITOS: GMAIL_USER + GMAIL_APP_PASSWORD (16 chars)</p>
                    <p>PROYECTO: {projectId?.startsWith('gen-') ? 'AI STUDIO (DEFAULT)' : projectId}</p>
                    <p>BASE DATOS: {dbId}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
