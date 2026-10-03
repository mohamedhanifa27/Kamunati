'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';
import { ShieldAlert, ShieldCheck, Shield, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

const zxcvbnFactory = new ZxcvbnFactory({
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  translations: zxcvbnEnPackage.translations,
});
const zxcvbn = zxcvbnFactory.check.bind(zxcvbnFactory);

const LEVELS = [
  { score: 0, label: 'Very weak', fill: 12 },
  { score: 1, label: 'Weak', fill: 30 },
  { score: 2, label: 'Fair', fill: 55 },
  { score: 3, label: 'Good', fill: 80 },
  { score: 4, label: 'Strong', fill: 100 },
];

export function PasswordStrengthMeter({ password, userInputs, onScoreChange }: { password: string, userInputs: string[], onScoreChange: (score: number) => void }) {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const res = zxcvbn(password, userInputs);
      setResult(res);
      onScoreChange(res.score);
    }, 120);
    return () => clearTimeout(timer);
  }, [password, userInputs, onScoreChange]);

  const score = result?.score || 0;
  const level = LEVELS[score];
  const hasMinLength = password.length >= 12;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  
  // Checking sequence from zxcvbn warning for common password or names
  const notCommon = result && !result.feedback.warning.includes('common');
  const notName = result && !result.sequence.some((match: any) => match.pattern === 'user_inputs');

  const rules = [
    { label: 'At least 12 characters', passed: hasMinLength },
    { label: 'Mixes upper and lower case', passed: hasUpperLower },
    { label: 'Includes a number', passed: hasNumber },
    { label: 'Includes a symbol', passed: hasSymbol },
    { label: 'Not a common password', passed: notCommon && password.length > 0 },
    { label: 'Does not contain your name/email', passed: notName && password.length > 0 },
  ];

  let colorClass = 'text-red-500';
  if (score === 2) colorClass = 'text-orange-400';
  if (score >= 3) colorClass = 'text-green-500';

  const tips = result?.feedback?.suggestions || [];

  return (
    <div className="mt-4 space-y-4">
      {/* Meter Bar */}
      <div 
        className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
        aria-valuetext={level.label}
      >
        <div 
          className="absolute top-0 left-0 h-full w-full origin-left transition-transform duration-300 ease-out"
          style={{
            background: 'linear-gradient(90deg, #FF4D4F 0%, #FFA940 50%, #3DD68C 100%)',
            transform: `scaleX(${level.fill / 100})`
          }}
        />
      </div>
      
      {/* Status Live Region */}
      <div className="flex items-center gap-2" aria-live="polite">
        {score >= 3 ? <ShieldCheck size={18} className={colorClass} /> : score === 2 ? <Shield size={18} className={colorClass} /> : <ShieldAlert size={18} className={colorClass} />}
        <span className={`text-sm font-medium ${colorClass}`}>{level.label}</span>
      </div>

      {/* Feedback Tips */}
      {tips.length > 0 && (
        <div className="text-sm text-neutral-400">
          <p className="flex items-start gap-1">
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> 
            {tips.map((t: string) => t.replace(/use a few rare words.*/i, "Add another word or two").replace(/avoid dates.*/i, "Avoid dates and years")).join('. ')}
          </p>
        </div>
      )}

      {/* Rules Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 p-4 rounded-xl bg-white/5 border border-white/5">
        {rules.map((rule, idx) => (
          <div key={idx} className={`flex items-center gap-2 text-sm ${rule.passed ? 'text-green-400' : 'text-neutral-500'}`}>
            {rule.passed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            {rule.label}
          </div>
        ))}
      </div>
    </div>
  );
}
