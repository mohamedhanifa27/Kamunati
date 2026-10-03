'use client';

import React, { useState } from 'react';
import { RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { ZxcvbnFactory } from '@zxcvbn-ts/core';
const zxcvbnFactory = new ZxcvbnFactory();
const zxcvbn = zxcvbnFactory.check.bind(zxcvbnFactory);

// Minimal stub of EFF wordlist for demo. A real app would fetch a JSON of 1300+ words.
const EFF_WORDS = ['abacus', 'battery', 'staple', 'horse', 'correct', 'cactus', 'quantum', 'velocity', 'crimson', 'nebula', 'ocean', 'breeze', 'forest', 'twilight'];
const SYMBOLS = '!@#$%^&*';
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiou';
const DIGITS = '0123456789';

function getRandomInt(max: number) {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max; // Minor modulo bias for large max, but fine for small character sets
}

function getRandomChar(charset: string) {
  return charset[getRandomInt(charset.length)];
}

function generatePassphrase() {
  const words = Array.from({ length: 4 }, () => EFF_WORDS[getRandomInt(EFF_WORDS.length)]);
  return words.join('-') + getRandomChar(DIGITS) + getRandomChar(SYMBOLS);
}

function generateRandom() {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*'; // Removed O, 0, l, 1, I
  return Array.from({ length: 16 }, () => getRandomChar(chars)).join('');
}

function generatePronounceable() {
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += i % 2 === 0 ? getRandomChar(CONSONANTS) : getRandomChar(VOWELS);
  }
  return pass + getRandomChar(DIGITS) + getRandomChar(SYMBOLS);
}

function ensureStrong(generator: () => string): string {
  let pass = '';
  let score = 0;
  while (score < 4) {
    pass = generator();
    score = zxcvbn(pass).score;
  }
  return pass;
}

export function PasswordSuggestionPanel({ onSelect }: { onSelect: (password: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{type: string, pass: string}[]>([]);
  const [showValues, setShowValues] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateAll = () => {
    setSuggestions([
      { type: 'Passphrase', pass: ensureStrong(generatePassphrase) },
      { type: 'Random', pass: ensureStrong(generateRandom) },
      { type: 'Pronounceable', pass: ensureStrong(generatePronounceable) },
    ]);
  };

  const handleOpen = () => {
    if (suggestions.length === 0) generateAll();
    setIsOpen(true);
  };

  const handleCopy = (pass: string, idx: number) => {
    navigator.clipboard.writeText(pass);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) {
    return (
      <button 
        type="button" 
        onClick={handleOpen}
        className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
      >
        Suggest a strong password
      </button>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10 shadow-xl space-y-4 relative overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-heading font-bold text-lg">Strong Suggestions</h3>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowValues(!showValues)} className="p-1.5 text-neutral-400 hover:text-white bg-white/5 rounded-lg transition-colors">
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button type="button" onClick={generateAll} className="p-1.5 text-neutral-400 hover:text-white bg-white/5 rounded-lg transition-colors" title="Regenerate">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      
      {suggestions.map((s, idx) => (
        <div key={idx} className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">{s.type}</span>
            <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Check size={12}/> Strong</span>
          </div>
          <div className="font-mono text-lg tracking-wider text-white select-all break-all">
            {showValues ? s.pass : '•'.repeat(s.pass.length)}
          </div>
          <div className="flex gap-2 mt-1">
            <button 
              type="button" 
              onClick={() => onSelect(s.pass)}
              className="flex-1 py-1.5 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Use this
            </button>
            <button 
              type="button" 
              onClick={() => handleCopy(s.pass, idx)}
              className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {copiedIndex === idx ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copiedIndex === idx ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
