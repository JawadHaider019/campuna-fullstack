'use client';

import React, { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log fatal root-level error for debugging
    console.error('[Campuna Global Root Error]:', error);
  }, [error]);

  return (
    <html lang="de">
      <head>
        <title>Kritischer Fehler | Campuna</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#f7f3ea',
        color: '#1A1A1A',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '560px',
          width: '90%',
          margin: '40px auto',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '40px 32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          {/* Logo / Symbol Header */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '28px'
          }}>
            ⚠️
          </div>

          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '9999px',
            backgroundColor: '#f3f4f6',
            color: '#4b5563',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px'
          }}>
            Campuna System
          </span>

          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 12px 0',
            lineHeight: 1.3
          }}>
            Kritischer Anwendungsfehler
          </h1>

          <p style={{
            fontSize: '15px',
            color: '#4b5563',
            lineHeight: 1.6,
            margin: '0 0 28px 0'
          }}>
            Die Anwendung konnte nicht ordnungsgemäß initialisiert werden. Bitte versuche, die Anwendung neu zu laden.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => reset()}
              style={{
                width: '100%',
                padding: '12px 24px',
                borderRadius: '12px',
                backgroundColor: '#00630D',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 99, 13, 0.3)',
                transition: 'background-color 0.2s ease'
              }}
            >
              🔄 Anwendung neu laden
            </button>

            <a
              href="/"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 24px',
                borderRadius: '12px',
                backgroundColor: '#f9fafb',
                color: '#374151',
                fontSize: '15px',
                fontWeight: '600',
                border: '1px solid #d1d5db',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Zur Startseite zurückkehren
            </a>
          </div>

          {error?.digest && (
            <p style={{
              marginTop: '24px',
              fontSize: '11px',
              color: '#9ca3af',
              fontFamily: 'monospace'
            }}>
              Fehler-Referenz: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
