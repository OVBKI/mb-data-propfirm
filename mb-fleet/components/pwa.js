"use client";
// Brique PWA : enregistrement du service worker + bouton d'installation.
import { useEffect, useState } from "react";

// Enregistre le service worker (à monter une fois dans le layout racine).
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // En dev, Next ne sert pas /sw.js de façon fiable — on l'active surtout en prod,
    // mais l'enregistrement est sans danger dans les deux cas.
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// Bouton « Installer l'application ».
// - Android/Windows/Chrome : déclenche le prompt natif.
// - iOS/Safari : ouvre une notice (Partager → Sur l'écran d'accueil).
// - Déjà installée : ne s'affiche pas.
export function InstallButton({ className = "", children = "Installer l'application" }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [ios, setIos] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIos(isIos());
    setInstalled(isStandalone());

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Évite le flash côté serveur ; masque si déjà installée.
  if (!mounted || installed) return null;
  // Sur navigateurs sans prompt et hors iOS (rien à proposer), on masque.
  if (!deferred && !ios) return null;

  async function handleClick() {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice?.catch(() => {});
      setDeferred(null);
      return;
    }
    if (ios) setShowIosHelp(true);
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        <DownloadIcon />
        {children}
      </button>

      {showIosHelp && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setShowIosHelp(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-bold text-lg text-ink-900">Installer Fleetly sur iPhone</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-brand-50 text-brand-600 grid place-items-center font-semibold">1</span>
                Appuyez sur <strong>Partager</strong> <ShareIcon /> dans la barre de Safari.
              </li>
              <li className="flex gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-brand-50 text-brand-600 grid place-items-center font-semibold">2</span>
                Choisissez <strong>« Sur l'écran d'accueil »</strong>.
              </li>
              <li className="flex gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-brand-50 text-brand-600 grid place-items-center font-semibold">3</span>
                Validez avec <strong>Ajouter</strong>. Fleetly apparaît comme une app 🎉
              </li>
            </ol>
            <button
              onClick={() => setShowIosHelp(false)}
              className="mt-6 w-full bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl py-2.5 transition-colors"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline align-middle text-brand-600" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
