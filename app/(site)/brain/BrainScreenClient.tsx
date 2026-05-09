'use client';

// Brain Screen using 4 stacked PNG images (base + 3 highlighted variants).
// Transparent click hot-spots positioned over each lobe trigger the swap.
// Per cognilift-brain-design.md: static images for Phase 2 MVP, Lottie polish later.

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BRAIN_MODULES, type ModuleKey } from '@/lib/brain-modules';

const BRAIN_IMAGE: Record<ModuleKey, string> = {
  thinking: '/images/brain/brain_thinking.png',
  focus: '/images/brain/brain_focus.png',
  memory: '/images/brain/brain_memory.png',
};

export default function BrainScreenClient({ childName }: { childName: string }) {
  const router = useRouter();
  const [selectedZone, setSelectedZone] = useState<ModuleKey>('memory');
  const selected = BRAIN_MODULES[selectedZone];

  function handleTrain() {
    router.push(`/brain/${selectedZone}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white py-10 px-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-4">
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-1">
            Hi {childName}
          </p>
          <h1 className="text-2xl font-bold">Your Brain</h1>
          <p className="text-blue-200 text-xs mt-1">Tap a part to train it</p>
        </div>

        {/* Brain visual: 4 stacked images, only active is visible. Hot-spots overlay. */}
        <div className="relative aspect-square w-full">
          {/* Base — always rendered (loads first), fades to 0 once a zone is picked */}
          <Image
            src="/images/brain/brain_base.png"
            alt="Brain"
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-contain transition-opacity duration-300 opacity-0"
          />
          {/* Highlighted variants — each visible only when its zone is selected */}
          {(['thinking', 'focus', 'memory'] as ModuleKey[]).map((zone) => (
            <Image
              key={zone}
              src={BRAIN_IMAGE[zone]}
              alt={`Brain — ${zone} highlighted`}
              fill
              priority={zone === 'memory'}
              sizes="(max-width: 448px) 100vw, 448px"
              className={`absolute inset-0 object-contain transition-opacity duration-300 ${
                selectedZone === zone ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}

          {/* Transparent click hot-spots (positioned by % so they scale with image).
              The brain in the image faces LEFT — front of head on left side. */}
          <button
            type="button"
            onClick={() => setSelectedZone('thinking')}
            className="absolute rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300/60"
            style={{ top: '12%', left: '15%', width: '32%', height: '30%' }}
            aria-label="Train Thinking"
            aria-pressed={selectedZone === 'thinking'}
          />
          <button
            type="button"
            onClick={() => setSelectedZone('focus')}
            className="absolute rounded-full focus:outline-none focus:ring-2 focus:ring-green-300/60"
            style={{ top: '8%', left: '42%', width: '32%', height: '30%' }}
            aria-label="Train Focus"
            aria-pressed={selectedZone === 'focus'}
          />
          <button
            type="button"
            onClick={() => setSelectedZone('memory')}
            className="absolute rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300/60"
            style={{ top: '45%', left: '20%', width: '55%', height: '30%' }}
            aria-label="Train Memory"
            aria-pressed={selectedZone === 'memory'}
          />
        </div>

        {/* Zone indicator pills (also tappable, for accessibility + clearer signaling) */}
        <div className="flex justify-center gap-2 mt-2 mb-4">
          {(['thinking', 'focus', 'memory'] as ModuleKey[]).map((zone) => {
            const mod = BRAIN_MODULES[zone];
            const isActive = selectedZone === zone;
            const colorBg = {
              thinking: isActive ? 'bg-orange-500' : 'bg-orange-500/20',
              focus: isActive ? 'bg-green-500' : 'bg-green-500/20',
              memory: isActive ? 'bg-purple-500' : 'bg-purple-500/20',
            }[zone];
            return (
              <button
                key={zone}
                type="button"
                onClick={() => setSelectedZone(zone)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${colorBg} ${
                  isActive ? 'text-white scale-105' : 'text-white/70'
                }`}
              >
                <span>{mod.emoji}</span>
                <span>{mod.name}</span>
              </button>
            );
          })}
        </div>

        {/* Description card */}
        <div className="bg-white text-gray-800 rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{selected.emoji}</span>
            <h2 className="text-lg font-bold">{selected.name}</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {selected.shortDescription}
          </p>
        </div>

        {/* CTA: Train this part */}
        <button
          type="button"
          onClick={handleTrain}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl text-base shadow-xl transition-all hover:scale-[1.02]"
        >
          Train {selected.name} →
        </button>
      </div>
    </main>
  );
}
