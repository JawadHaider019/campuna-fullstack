'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  RotateCcw, 
  Home, 
  MessageSquare, 
  Search, 
  Compass, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle 
} from 'lucide-react';

export default function Error({ error, reset }) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log client/server render runtime error for diagnostic tracking
    console.error('[Campuna Error Boundary caught]:', error);
  }, [error]);

  return (
    <main className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-sand/40 via-white to-sand/20">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Visual Badge / Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm animate-pulse">
            <AlertTriangle className="w-12 h-12 stroke-[1.75]" />
          </div>
          <span className="absolute -bottom-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-charcoal text-white tracking-wide uppercase">
            Fehler aufgetreten
          </span>
        </div>

        {/* Heading & Information */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-charcoal font-display">
            Da ist etwas schiefgelaufen!
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
            Ein unerwarteter Fehler hat das Laden der Seite unterbrochen. Wir wurden bereits informiert und kümmern uns darum.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-forest text-white font-medium hover:bg-forest/90 transition-all duration-200 shadow-md shadow-forest/20 active:scale-[0.98]"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Erneut versuchen</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-charcoal font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            <Home className="w-5 h-5 text-gray-500" />
            <span>Zur Startseite</span>
          </Link>
        </div>

        {/* Helpful Secondary Links */}
        <div className="pt-6 border-t border-gray-200/80">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">
            Hilfreiche Bereiche
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-600">
            <Link 
              href="/inserate" 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-forest/10 hover:text-forest transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Inserate entdecken</span>
            </Link>
            <Link 
              href="/faq-hilfe" 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-forest/10 hover:text-forest transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Hilfe & FAQ</span>
            </Link>
            <Link 
              href="/kontakt" 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-forest/10 hover:text-forest transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Support kontaktieren</span>
            </Link>
          </div>
        </div>

        {/* Technical Error Details Accordion */}
        {(error?.message || error?.digest) && (
          <div className="pt-2 text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mx-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <span>{showDetails ? 'Technische Details ausblenden' : 'Technische Fehlerdetails anzeigen'}</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDetails && (
              <div className="mt-3 p-4 rounded-xl bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto shadow-inner border border-gray-800">
                {error?.digest && (
                  <p className="text-gray-400 mb-1">
                    <span className="text-amber-400">Digest:</span> {error.digest}
                  </p>
                )}
                {error?.message && (
                  <p className="text-red-400 whitespace-pre-wrap break-all">
                    {error.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
