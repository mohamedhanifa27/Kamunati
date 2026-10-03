'use client';

import React, { useState, useRef } from 'react';
import useSWR from 'swr';
import { Loader2, Check, Eye, EyeOff, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { PasswordStrengthMeter } from '../../../components/user/PasswordStrengthMeter';
import { PasswordSuggestionPanel } from '../../../components/user/PasswordSuggestionPanel';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SecuritySettings() {
  const router = useRouter();
  const { data: profile } = useSWR('/api/me/profile', fetcher);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  
  // Step 2
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [changeToken, setChangeToken] = useState('');

  // Step 3
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [strengthScore, setStrengthScore] = useState(0);

  const maskedEmail = profile ? `${profile.email[0]}***@${profile.email.split('@')[1]}` : 'your email';

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/account/password/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send code');
      } else {
        setStep(2);
      }
    } catch (e) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newCode = [...code];
    newCode[idx] = val;
    setCode(newCode);
    
    if (val && idx < 5) {
      codeRefs.current[idx + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    const focusIdx = pasted.length < 6 ? pasted.length : 5;
    codeRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) return;
    
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/account/password/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAttemptsLeft(data.maxAttempts - data.attempts);
        setError(data.error || 'Invalid code');
        if (data.attempts >= data.maxAttempts) {
          // Lock out
          setTimeout(() => setStep(1), 3000);
        }
      } else {
        setChangeToken(data.changeToken);
        setStep(3);
      }
    } catch (e) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (strengthScore < 3) {
      setError('Password is not strong enough');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/account/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changeToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to change password');
      } else {
        setStep(4);
      }
    } catch (e) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (pass: string) => {
    setNewPassword(pass);
    setConfirmPassword(pass);
  };

  return (
    <div className="max-w-xl mx-auto md:mx-0">
      <h2 className="text-2xl font-heading font-bold mb-8">Change Password</h2>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold mb-2">Step 1: Confirm identity</h3>
            <p className="text-neutral-400 text-sm mb-6">Enter your current password to continue.</p>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-start gap-2">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Current Password</label>
              <div className="relative">
                <input 
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 pr-12 text-white focus:outline-none focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-3.5 text-neutral-400 hover:text-white transition-colors">
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || !currentPassword}
              className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Send verification code
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-2">
              <button type="button" onClick={() => setStep(1)} className="p-2 hover:bg-white/10 rounded-full transition-colors -ml-2"><ArrowLeft size={18}/></button>
              <h3 className="text-xl font-bold">Step 2: Enter the code</h3>
            </div>
            <p className="text-neutral-400 text-sm mb-6">If your password is correct, a code has been sent to {maskedEmail}</p>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-start gap-2">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                <span>{error}. {attemptsLeft !== undefined && `You have ${attemptsLeft} attempts remaining.`}</span>
              </div>
            )}

            <div className="flex justify-between gap-2 md:gap-4 max-w-[300px] mx-auto">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { codeRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(idx, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(idx, e)}
                  onPaste={handleCodePaste}
                  className="w-10 h-12 md:w-12 md:h-14 bg-white/10 border border-white/20 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-primary focus:bg-white/15 transition-colors"
                />
              ))}
            </div>

            <button 
              type="submit"
              disabled={loading || code.join('').length < 6}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/80 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Verify Code
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleChangePassword} className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold mb-2">Step 3: Choose a new password</h3>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-start gap-2">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex justify-between">
                  New Password
                  <PasswordSuggestionPanel onSelect={handleSuggestionSelect} />
                </label>
                <div className="relative">
                  <input 
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    spellCheck={false}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 pr-12 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3.5 text-neutral-400 hover:text-white transition-colors">
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {newPassword && profile && (
                  <PasswordStrengthMeter 
                    password={newPassword} 
                    userInputs={[profile.email.split('@')[0], profile.email, profile.displayName]} 
                    onScoreChange={setStrengthScore} 
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showNew ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    spellCheck={false}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 pr-12 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || !newPassword || !confirmPassword || strengthScore < 3 || newPassword !== confirmPassword}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/80 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Change Password
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center py-8 space-y-6 animate-fade-in flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
              <Check size={32} className="text-green-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Password Changed</h3>
              <p className="text-neutral-400 text-sm">
                Your password has been updated successfully. Other devices have been signed out for your security.
              </p>
            </div>
            <button 
              onClick={() => router.push('/settings')}
              className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Back to Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
