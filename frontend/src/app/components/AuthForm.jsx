'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronRight, ChevronDown, ShieldCheck, Mail } from 'lucide-react';
import { 
    registerUser, 
    checkVerificationStatus, 
    loginUser,
    requestPasswordReset,
    verifyResetOtp,
    resetPassword
} from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';

/* ─── Glass input ─── */
const Field = ({ id, type = 'text', placeholder, value, onChange, autoComplete }) => {
    const [show, setShow] = useState(false);
    const isPass = type === 'password';
    return (
        <div className="relative">
            <input
                id={id}
                type={isPass && show ? 'text' : type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="w-full bg-white/20 border border-white/50 rounded-xl px-4 py-2.5 font-sans text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-200 pr-10"
            />
            {isPass && (
                <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            )}
        </div>
    );
};

/* ─── Glass select ─── */
const SelectField = ({ id, value, onChange, options, placeholder }) => (
    <div className="relative">
        <select id={id} value={value} onChange={onChange}
            className="w-full appearance-none bg-white/20 border border-white/50 rounded-xl px-4 py-2.5 font-sans text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-200 pr-8 cursor-pointer">
            <option value="" disabled className="text-charcoal bg-white">{placeholder}</option>
            {options.map(o => <option key={o.value} value={o.value} className="text-charcoal bg-white">{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50 pointer-events-none" />
    </div>
);

const USER_TYPES = [
    { value: 'seller', label: 'Privater Nutzer' },
    { value: 'business', label: 'Gewerblicher Nutzer' }
];

export default function AuthForm({ initialMode = 'login' }) {
    const router = useRouter();
    const [mode, setMode] = useState(initialMode);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [referredByCode, setReferredByCode] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [userType, setUserType] = useState('');
    const [signupPw, setSignupPw] = useState('');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPw, setLoginPw] = useState('');
    const [loading, setLoading] = useState(false);

    // Business-only fields
    const [companyName, setCompanyName] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    // Forgot password & OTP state
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'otp' | 'reset_password' | 'success'
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [resetToken, setResetToken] = useState('');

    // Reset password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [authError, setAuthError] = useState('');
    const login = useAuthStore((state) => state.login);

    useEffect(() => {
        if (mode !== 'verify-email' || !signupEmail) return;

        const intervalId = setInterval(async () => {
            try {
                const response = await checkVerificationStatus(signupEmail);
                if (response.success && response.data.email_verified) {
                    clearInterval(intervalId);
                    toast.success('E-Mail erfolgreich verifiziert! Willkommen bei Campuna.');
                    login(response.data.user);
                    router.push('/mein-konto');
                }
            } catch (err) {
                console.error("Error polling verification status:", err);
            }
        }, 3000); // Check status every 3 seconds

        return () => clearInterval(intervalId);
    }, [mode, signupEmail, login, router]);

    const triggerOtpVerification = async (otpToVerify) => {
        if (!otpToVerify || otpToVerify.length !== 6) return;
        setLoading(true);
        setOtpError('');
        try {
            const res = await verifyResetOtp(forgotEmail, otpToVerify);
            setLoading(false);
            if (res.success && res.data?.reset_token) {
                setResetToken(res.data.reset_token);
                setForgotStep('reset_password');
                toast.success('Code erfolgreich bestätigt!');
            } else {
                const err = res.error || 'Ungültiger oder abgelaufener Code.';
                setOtpError(err);
                toast.error(err);
            }
        } catch (err) {
            setLoading(false);
            setOtpError('Fehler beim Überprüfen des Codes.');
            toast.error('Fehler beim Überprüfen des Codes.');
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otpCode];
        newOtp[index] = value.slice(-1);
        setOtpCode(newOtp);
        setOtpError('');

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-input-${index + 1}`);
            if (nextInput) nextInput.focus();
        }

        // Auto-verify if all 6 digits are filled
        const fullOtp = newOtp.join('');
        if (fullOtp.length === 6 && !newOtp.includes('')) {
            triggerOtpVerification(fullOtp);
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setOtpCode(digits);
            setOtpError('');
            const lastInput = document.getElementById('otp-input-5');
            if (lastInput) lastInput.focus();
            triggerOtpVerification(pastedData);
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            const prevInput = document.getElementById(`otp-input-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAuthError('');
        if (mode === 'forgot') {
            if (forgotStep === 'email') {
                if (!forgotEmail.trim()) {
                    toast.error('Bitte gib deine E-Mail-Adresse ein.');
                    setLoading(false);
                    return;
                }
                try {
                    const res = await requestPasswordReset(forgotEmail);
                    setLoading(false);
                    if (res.success) {
                        setForgotStep('otp');
                        toast.success('6-stelliger Bestätigungscode wurde per E-Mail gesendet!');
                    } else {
                        toast.error(res.error || 'Fehler beim Senden des Codes.');
                    }
                } catch (err) {
                    setLoading(false);
                    toast.error('Fehler beim Anfordern des Codes.');
                }
            } else if (forgotStep === 'otp') {
                const fullOtp = otpCode.join('');
                if (fullOtp.length < 6) {
                    setLoading(false);
                    setOtpError('Bitte gib den vollständigen 6-stelligen Code ein.');
                    return;
                }
                await triggerOtpVerification(fullOtp);
            } else if (forgotStep === 'reset_password') {
                if (newPassword.length < 8) {
                    setLoading(false);
                    setResetError('Das Passwort muss mindestens 8 Zeichen lang sein.');
                    return;
                }
                if (newPassword !== confirmNewPassword) {
                    setLoading(false);
                    setResetError('Die Passwörter stimmen nicht überein.');
                    return;
                }
                try {
                    const res = await resetPassword(forgotEmail, resetToken, newPassword);
                    setLoading(false);
                    if (res.success) {
                        toast.success('Passwort erfolgreich zurückgesetzt! Bitte logge dich ein.');
                        setLoginEmail(forgotEmail);
                        setMode('login');
                        setForgotStep('email');
                        setOtpCode(['', '', '', '', '', '']);
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setResetToken('');
                        setResetError('');
                    } else {
                        setResetError(res.error || 'Fehler beim Zurücksetzen des Passworts.');
                        toast.error(res.error || 'Fehler beim Zurücksetzen des Passworts.');
                    }
                } catch (err) {
                    setLoading(false);
                    setResetError('Ein unerwarteter Fehler ist aufgetreten.');
                }
            }
        } else if (mode === 'signup') {
            if (!userType) {
                setAuthError('Bitte wähle einen Benutzertyp aus (Privat oder Gewerblich).');
                toast.error('Bitte wähle deinen Benutzertyp aus.');
                setLoading(false);
                return;
            }

            if (userType === 'business') {
                if (!companyName.trim()) {
                    setAuthError('Bitte gib deinen Firmennamen an.');
                    toast.error('Firmenname ist für gewerbliche Nutzer erforderlich.');
                    setLoading(false);
                    return;
                }
                if (websiteUrl) {
                    const trimmedWebsite = websiteUrl.trim();
                    if (!trimmedWebsite.startsWith('https://')) {
                        setAuthError('Der Website-Link muss mit https:// beginnen.');
                        setLoading(false);
                        return;
                    }
                }
            }

            const userData = {
                email: signupEmail,
                password: signupPw,
                confirm_password: signupPw,
                account_type: userType === 'business' ? 'COMMERCIAL' : 'PRIVATE',
                first_name: firstName,
                last_name: lastName,
                company_name: companyName,
                company_email: userType === 'business' ? companyEmail : undefined,
                website_url: userType === 'business' ? websiteUrl : undefined,
                referred_by_code: referredByCode,
            };

            const response = await registerUser(userData);
            setLoading(false);
            if (response.success) {
                const user = response.data?.user;
                const accessToken = response.data?.access_token;
                const refreshToken = response.data?.refresh_token;

                if (user && accessToken) {
                    login(user, accessToken, refreshToken);
                    toast.success('Registrierung erfolgreich! Willkommen bei Campuna.');
                    if (user?.role === 'ADMIN') {
                        router.push('/admin');
                    } else {
                        router.push('/mein-konto');
                    }
                } else {
                    toast.success('Konto erfolgreich erstellt!');
                    setMode('login');
                }
            } else {
                const errMsg = response.error || 'Registrierung fehlgeschlagen.';
                setAuthError(errMsg);
                toast.error(errMsg);
            }
        } else {
            // Mode === 'login'
            const response = await loginUser({
                email: loginEmail,
                password: loginPw
            });
            setLoading(false);
            if (response.success) {
                const user = response.data.user;
                login(user, response.data.access_token, response.data.refresh_token);
                if (user?.role === 'ADMIN') {
                    toast.success('Willkommen im Administrationsbereich!');
                    router.push('/admin');
                } else {
                    toast.success('Erfolgreich angemeldet!');
                    router.push('/mein-konto');
                }
            } else {
                const errMsg = response.error || 'Login fehlgeschlagen.';
                setAuthError(errMsg);
                toast.error(errMsg);
            }
        }
    };

    const switchMode = (m) => {
        setMode(m);
        if (m === 'login') {
            router.push('/login');
        } else if (m === 'signup') {
            router.push('/register');
        }
        setLoading(false);
        setForgotStep('email');
        setOtpCode(['', '', '', '', '', '']);
        setOtpError('');
        setNewPassword('');
        setConfirmNewPassword('');
        setResetError('');
        setAuthError('');
    };

    const variants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
        exit: { opacity: 0, y: -16, transition: { duration: 0.2 } },
    };

    const labelCls = "font-sans text-[9px] font-semibold text-white/65 uppercase tracking-wider";

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center font-sans overflow-hidden bg-charcoal p-2 sm:p-3 lg:p-4">
            {/* ── Full-screen background image ── */}
            <motion.img
                src="/hero-campuna.webp"
                alt="Camping"
                className="absolute inset-0 w-full h-full object-cover z-0"
                initial={{ scale: 1.07, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
            />
            {/* Cinematic gradient overlay */}
            <div className="absolute inset-0 z-[1] bg-black/45" />

            {/* ── CENTRALIZED Frosted Glass Form Card ── */}
            <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                className="relative z-10 w-full max-w-[460px] bg-black/70 border border-white/20 shadow-[0_24px_64px_-8px_rgba(0,0,0,0.5)] flex flex-col rounded-3xl overflow-hidden"
            >
                {/* Card inner */}
                <div className="px-6 sm:px-8 py-3 sm:py-4 flex flex-col gap-1 sm:gap-2 overflow-y-auto max-h-[95vh]">
                    {/* Logo + mode label row */}
                    <div className="flex items-center justify-between mb-1">
                        <button onClick={() => router.push('/')} className="pointer-events-auto flex items-start cursor-pointer">
                            <img src="/logo.webp" alt="Campuna®"
                                className="w-[110px] h-[32px] object-contain brightness-0 invert opacity-85 hover:opacity-100 transition-opacity" />
                            <span className="text-2xl sm:text-3xl font-normal text-white ml-0.5 -mt-1 select-none leading-none">®</span>
                        </button>
                        <span className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                            {mode === 'signup' ? 'Registrieren' : mode === 'verify-email' ? 'Bestätigen' : mode === 'forgot' ? 'Zurücksetzen' : 'Einloggen'}
                        </span>
                    </div>

                    {/* ── Animated form content ── */}
                    <AnimatePresence mode="wait">
                        {mode === 'signup' ? (
                            <motion.form
                                key="signup"
                                variants={variants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                onSubmit={handleSubmit}
                                className="flex flex-col gap-2"
                            >
                                {/* Headline */}
                                <div>
                                    <h1 className="font-display text-[18px] font-extrabold text-white leading-tight mb-1">
                                        Erstelle dein Campuna-Konto
                                    </h1>
                                    <p className="font-sans text-[10px] text-white/55 leading-relaxed">
                                        Kaufen, verkaufen oder entdecken – alles rund ums Camping, einfach und transparent.
                                    </p>
                                </div>

                                {authError && (
                                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-xs font-sans">
                                        {authError}
                                    </div>
                                )}

                                {/* Vorname & Nachname */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="reg-firstname" className={labelCls}>Vorname</label>
                                        <Field id="reg-firstname" placeholder="z.B. Ronny" value={firstName}
                                            onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="reg-lastname" className={labelCls}>Nachname</label>
                                        <Field id="reg-lastname" placeholder="z.B. Schmidt" value={lastName}
                                            onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
                                    </div>
                                </div>

                                {/* E-Mail */}
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="reg-email" className={labelCls}>E-Mail</label>
                                    <Field id="reg-email" type="email" placeholder="deine@email.de" value={signupEmail}
                                        onChange={e => setSignupEmail(e.target.value)} autoComplete="email" />
                                </div>

                                {/* Benutzertyp (Erforderlich) */}
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="reg-usertype" className={labelCls}>
                                        Benutzertyp <span className="text-gold font-bold">*</span>
                                    </label>
                                    <SelectField id="reg-usertype" value={userType}
                                        onChange={e => setUserType(e.target.value)}
                                        options={USER_TYPES} placeholder="Bitte Nutzertyp wählen" />
                                </div>

                                {/* Business fields ── shown only when Gewerblicher Nutzer */}
                                <AnimatePresence>
                                    {userType === 'business' && (
                                        <motion.div
                                            key="business-fields"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex flex-col gap-2 pt-1 border-t border-white/15 mt-1">
                                                <p className="font-sans text-[10px] text-white/40 uppercase tracking-widest">Geschäftliche Angaben</p>

                                                {/* Row 1: Company Name + Company Email */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col gap-1">
                                                        <label htmlFor="biz-name" className={labelCls}>Firmenname</label>
                                                        <Field id="biz-name" placeholder="Campuna GmbH" value={companyName}
                                                            onChange={e => setCompanyName(e.target.value)} autoComplete="organization" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label htmlFor="biz-email" className={labelCls}>Firmen-E-Mail</label>
                                                        <Field id="biz-email" type="email" placeholder="info@firma.de" value={companyEmail}
                                                            onChange={e => setCompanyEmail(e.target.value)} autoComplete="email" />
                                                    </div>
                                                </div>

                                                {/* Website-Link ── full width */}
                                                <div className="flex flex-col gap-1">
                                                    <label htmlFor="biz-website" className={labelCls}>Website-Link</label>
                                                    <Field id="biz-website" type="url" placeholder="https://firma.de" value={websiteUrl}
                                                        onChange={e => setWebsiteUrl(e.target.value)} autoComplete="url" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Empfehlungscode (Optional) */}
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="reg-referral" className={labelCls}>Empfehlungscode (Optional)</label>
                                    <Field id="reg-referral" placeholder="z.B. CAMP-123456" value={referredByCode}
                                        onChange={e => setReferredByCode(e.target.value)} />
                                </div>

                                {/* Passwort */}
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="reg-pw" className={labelCls}>Passwort</label>
                                    <Field id="reg-pw" type="password" placeholder="Mindestens 8 Zeichen" value={signupPw}
                                        onChange={e => setSignupPw(e.target.value)} autoComplete="new-password" />
                                </div>

                                {/* Confirm password field removed as requested */}

                                {/* CTA */}
                                <motion.button id="signup-submit" type="submit"
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    disabled={loading}
                                    className="w-full bg-white text-forest font-sans font-bold text-sm py-3 rounded-xl hover:bg-forest hover:text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 mt-1 cursor-pointer">
                                    {loading
                                        ? <span className="w-4 h-4 border-2 border-forest/30 border-t-forest rounded-full animate-spin inline-block" />
                                        : 'Konto erstellen'}
                                </motion.button>

                                {/* Helper Switcher */}
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                                    className="flex items-center justify-center gap-1.5 "
                                >
                                    <span className="font-sans text-xs text-white/50 uppercase tracking-widest">Bereits Mitglied?</span>
                                    <button
                                        type="button"
                                        onClick={() => switchMode('login')}
                                        className="font-sans text-xs font-bold text-white hover:text-gold uppercase tracking-widest flex items-center gap-0.5 transition-colors cursor-pointer"
                                    >
                                        Einloggen
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>

                                {/* Legal */}
                                <p className="font-sans text-[9px] text-white/50 text-center leading-relaxed ">
                                    Mit der Erstellung stimmst du unseren{' '}
                                    <button type="button" className="text-gold/70 hover:text-gold transition-colors font-medium">AGB</button>
                                    {' '}und der{' '}
                                    <button type="button" className="text-gold/70 hover:text-gold transition-colors font-medium">Datenschutzerklärung</button>
                                    {' '}zu.
                                </p>
                            </motion.form>
                        ) : mode === 'verify-email' ? (
                            /* ── EMAIL VERIFICATION ── */
                            <motion.div
                                key="verify-email"
                                variants={variants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex flex-col gap-4 text-center py-6"
                            >
                                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Mail className="w-8 h-8 text-gold" />
                                </div>

                                <div>
                                    <h1 className="font-display text-[20px] font-extrabold text-white leading-tight mb-2">
                                        Bitte bestätige deine E-Mail
                                    </h1>
                                    <p className="font-sans text-xs text-white/70 leading-relaxed max-w-[340px] mx-auto">
                                        Wir haben einen Bestätigungslink an <strong className="text-white">{signupEmail}</strong> gesendet. Bitte klicke auf diesen Link, um dein Campuna-Konto freizuschalten.
                                    </p>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => switchMode('login')}
                                    className="w-full bg-white text-forest font-sans font-bold text-sm py-3 rounded-xl hover:bg-forest hover:text-white transition-all duration-300 shadow-lg cursor-pointer mt-2"
                                >
                                    Zurück zum Login
                                </motion.button>
                            </motion.div>
                        ) : mode === 'forgot' ? (
                            /* ── FORGOT PASSWORD ── */
                            <motion.form
                                key="forgot"
                                variants={variants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                onSubmit={handleSubmit}
                                className="flex flex-col gap-3"
                            >
                                <div className="mb-1">
                                    <h1 className="font-display text-[20px] font-extrabold text-white leading-tight mb-1">
                                        {forgotStep === 'otp'
                                            ? 'OTP Code eingeben'
                                            : forgotStep === 'reset_password'
                                                ? 'Neues Passwort festlegen'
                                                : 'Passwort zurücksetzen'}
                                    </h1>
                                    <p className="font-sans text-[11px] text-white/55 leading-relaxed">
                                        {forgotStep === 'otp'
                                            ? `Wir haben einen 6-stelligen Bestätigungscode an ${forgotEmail || 'deine E-Mail-Adresse'} gesendet.`
                                            : forgotStep === 'reset_password'
                                                ? 'Gib dein neues Passwort ein und bestätige es.'
                                                : 'Gib deine E-Mail-Adresse ein. Wir senden dir einen Bestätigungscode (OTP).'}
                                    </p>
                                </div>

                                {forgotStep === 'reset_password' ? (
                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="new-pw" className={labelCls}>Neues Passwort</label>
                                            <Field
                                                id="new-pw"
                                                type="password"
                                                placeholder="Mindestens 8 Zeichen"
                                                value={newPassword}
                                                onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
                                                autoComplete="new-password"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="confirm-new-pw" className={labelCls}>Passwort bestätigen</label>
                                            <Field
                                                id="confirm-new-pw"
                                                type="password"
                                                placeholder="Neues Passwort wiederholen"
                                                value={confirmNewPassword}
                                                onChange={e => { setConfirmNewPassword(e.target.value); setResetError(''); }}
                                                autoComplete="new-password"
                                            />
                                        </div>

                                        {resetError && (
                                            <p className="text-[10px] text-red-300 font-semibold text-center mt-1">
                                                {resetError}
                                            </p>
                                        )}

                                        <motion.button
                                            id="reset-pw-submit"
                                            type="submit"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            disabled={loading}
                                            className="w-full bg-white text-forest font-sans font-bold text-sm py-3 rounded-xl hover:bg-forest hover:text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 mt-1 cursor-pointer"
                                        >
                                            {loading
                                                ? <span className="w-4 h-4 border-2 border-forest/30 border-t-forest rounded-full animate-spin inline-block" />
                                                : 'Passwort speichern'}
                                        </motion.button>
                                    </div>
                                ) : forgotStep === 'otp' ? (
                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-1">
                                            <label className={labelCls}>6-stelliger Bestätigungscode</label>
                                            <div className="flex justify-between gap-1.5 my-1">
                                                {otpCode.map((digit, idx) => (
                                                    <input
                                                        key={idx}
                                                        id={`otp-input-${idx}`}
                                                        type="text"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                        onPaste={handleOtpPaste}
                                                        className="w-11 h-12 text-center text-lg font-mono font-bold bg-white/20 border border-white/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold/70 transition-all text-white placeholder-white/20"
                                                        placeholder="•"
                                                    />
                                                ))}
                                            </div>
                                            {otpError && (
                                                <p className="text-[10px] text-red-300 font-semibold text-center mt-1">
                                                    {otpError}
                                                </p>
                                            )}
                                        </div>

                                        <motion.button
                                            id="otp-submit"
                                            type="submit"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            disabled={loading}
                                            className="w-full bg-white text-forest font-sans font-bold text-sm py-3 rounded-xl hover:bg-forest hover:text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 mt-1 cursor-pointer"
                                        >
                                            {loading
                                                ? <span className="w-4 h-4 border-2 border-forest/30 border-t-forest rounded-full animate-spin inline-block" />
                                                : 'Code bestätigen'}
                                        </motion.button>

                                        <div className="flex justify-between items-center text-[10px] pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setForgotStep('email')}
                                                className="text-white/60 hover:text-white font-medium transition-colors cursor-pointer"
                                            >
                                                ← E-Mail ändern
                                            </button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    setOtpCode(['', '', '', '', '', '']);
                                                    setOtpError('');
                                                    try {
                                                        const res = await requestPasswordReset(forgotEmail);
                                                        if (res.success) {
                                                            toast.success(`Neuer Code an ${forgotEmail} gesendet!`);
                                                        } else {
                                                            toast.error(res.error || 'Fehler beim Senden des Codes.');
                                                        }
                                                    } catch {
                                                        toast.error('Fehler beim erneuten Senden des Codes.');
                                                    }
                                                }}
                                                className="text-gold/80 hover:text-gold font-semibold transition-colors cursor-pointer"
                                            >
                                                Code erneut senden
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="forgot-email" className={labelCls}>E-Mail Adresse</label>
                                            <Field
                                                id="forgot-email"
                                                type="email"
                                                placeholder="deine@email.de"
                                                value={forgotEmail}
                                                onChange={e => setForgotEmail(e.target.value)}
                                                autoComplete="email"
                                            />
                                        </div>

                                        <motion.button
                                            id="forgot-submit"
                                            type="submit"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            disabled={loading}
                                            className="w-full bg-white text-forest font-sans font-bold text-sm py-3 rounded-xl hover:bg-forest hover:text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 mt-1 cursor-pointer"
                                        >
                                            {loading
                                                ? <span className="w-4 h-4 border-2 border-forest/30 border-t-forest rounded-full animate-spin inline-block" />
                                                : 'OTP Code anfordern'}
                                        </motion.button>
                                    </>
                                )}

                                <div className="flex items-center justify-center gap-1.5 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => switchMode('login')}
                                        className="font-sans text-xs font-bold text-white hover:text-gold uppercase tracking-widest flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                                        Zurück zum Login
                                    </button>
                                </div>
                            </motion.form>
                        ) : (
                            /* ── LOGIN ── */
                            <motion.form
                                key="login"
                                variants={variants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                onSubmit={handleSubmit}
                                className="flex flex-col gap-3"
                            >
                                <div className="mb-1">
                                    <h1 className="font-display text-[20px] font-extrabold text-white leading-tight mb-1">
                                        Schön, dass du wieder da bist
                                    </h1>
                                    <p className="font-sans text-[11px] text-white/55 leading-relaxed">
                                        Melde dich an, um deine Inserate, Nachrichten und Kontoeinstellungen zu sehen.
                                    </p>
                                </div>

                                {authError && (
                                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-xs font-sans">
                                        {authError}
                                    </div>
                                )}

                                {/* E-Mail */}
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="login-email" className={labelCls}>E-Mail Adresse</label>
                                    <Field id="login-email" type="email" placeholder="deine@email.de" value={loginEmail}
                                        onChange={e => setLoginEmail(e.target.value)} autoComplete="email" />
                                </div>

                                {/* Passwort */}
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="login-pw" className={labelCls}>Passwort</label>
                                    <Field id="login-pw" type="password" placeholder="Dein Passwort" value={loginPw}
                                        onChange={e => setLoginPw(e.target.value)} autoComplete="current-password" />
                                </div>

                                {/* CTA */}
                                <motion.button id="login-submit" type="submit"
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    disabled={loading}
                                    className="w-full bg-white text-forest font-sans font-bold text-sm py-3 rounded-xl hover:bg-forest hover:text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 mt-1 cursor-pointer">
                                    {loading
                                        ? <span className="w-4 h-4 border-2 border-forest/30 border-t-forest rounded-full animate-spin inline-block" />
                                        : 'Anmelden'}
                                </motion.button>

                                {/* Helper Switcher */}
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                                    className="flex items-center justify-center gap-1.5 mt-2"
                                >
                                    <span className="font-sans text-xs text-white/50 uppercase tracking-widest">Neu hier?</span>
                                    <button
                                        type="button"
                                        onClick={() => switchMode('signup')}
                                        className="font-sans text-xs font-bold text-white hover:text-gold uppercase tracking-widest flex items-center gap-0.5 transition-colors cursor-pointer"
                                    >
                                        Registrieren
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>

                                {/* Forgot */}
                                <button
                                    type="button"
                                    onClick={() => switchMode('forgot')}
                                    className="font-sans text-xs text-white/40 hover:text-white transition-colors text-center mt-1 cursor-pointer"
                                >
                                    Passwort vergessen?
                                </button>

                                {/* DSGVO */}
                                <div className="flex items-center justify-center gap-1.5 pt-1 mt-auto">
                                    <ShieldCheck className="w-3 h-3 text-gold/50 shrink-0" />
                                    <p className="font-sans text-[9px] text-white/50 leading-relaxed">
                                        Sicherer Login. Deine Daten sind DSGVO-konform geschützt.
                                    </p>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
