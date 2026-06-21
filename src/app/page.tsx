"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Terminal, 
  Cpu, 
  Shield, 
  Clock, 
  HardDrive, 
  RefreshCw, 
  Layers, 
  ExternalLink, 
  Check, 
  Play, 
  User, 
  Sparkles, 
  Globe, 
  Database, 
  Lock, 
  Settings, 
  ChevronRight,
  Flame,
  ChevronLeft
} from 'lucide-react';

// Google Cloud Logo SVG representation (GCP Hexagon style)
const GCPLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" fill="currentColor"/>
    <path d="M12 17l4-4h-3V9h-2v4H8l4 4z" fill="currentColor" opacity="0.8"/>
  </svg>
);

// GCP Hexagon Core Icon
const GCPHexagon = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Blue segment */}
    <path d="M60 10L103.3 35V85L60 110L16.7 85V35L60 10Z" stroke="url(#gcp-grad)" strokeWidth="4" fill="rgba(13, 13, 13, 0.8)"/>
    <path d="M60 20L94.6 40V80L60 100L25.4 80V40L60 20Z" fill="url(#gcp-grad-inner)" opacity="0.15"/>
    <defs>
      <linearGradient id="gcp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="30%" stopColor="#EA4335" />
        <stop offset="70%" stopColor="#FBBC05" />
        <stop offset="100%" stopColor="#34A853" />
      </linearGradient>
      <linearGradient id="gcp-grad-inner" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d2beff" />
        <stop offset="100%" stopColor="#ef7759" />
      </linearGradient>
    </defs>
  </svg>
);

interface Testimony {
  name: string;
  role: string;
  avatar: string;
  text: string;
  stat: string;
  setup: string;
}

const testimonies: Testimony[] = [
  {
    name: "Anthea",
    role: "Autonomous Agent Architect",
    avatar: "A",
    text: "I used to run coding agents locally on my machine, which felt like letting a stranger run arbitrary CLI commands on my host system. Spawning isolated sandboxes on GCP Computer in milliseconds keeps my code clean, protected, and fully observable.",
    stat: "12 local tools replaced",
    setup: "Docker alpine-node driver"
  },
  {
    name: "Jing",
    role: "AI Quant Lead",
    avatar: "J",
    text: "We run deep research loops that execute code packages overnight. The Inactivity Reaper is a lifesaver—it automatically hibernates our Compute Engine instances after 10 minutes of idle time. No more surprise multi-thousand-dollar cloud bills.",
    stat: "85% compute cost savings",
    setup: "GCP Compute Engine VMs"
  },
  {
    name: "Joe",
    role: "Full-Stack Dev & Tinker",
    avatar: "J",
    text: "GCP Computer goes beyond basic chat scripts. It gives my developer agent a real Linux environment with root access. It can download npm packages, run migrations, and spin up databases. It's the ultimate 'Vibe Coding' terminal.",
    stat: "140ms startup latency",
    setup: "Dedicated micro-sandbox"
  },
  {
    name: "Kate",
    role: "Solo SaaS Founder",
    avatar: "K",
    text: "With safe volume mounting, I can grant the agent direct, temporary access to a single subdirectory of my codebase. It commits modifications, spins up local testing servers, and outputs logs straight to my Slack webhooks.",
    stat: "24/7 background agent execution",
    setup: "Slack + GitHub mounts"
  }
];

const demoSteps = [
  {
    tab: "1. Provision Sandbox",
    title: "Instant Workspace Spawning",
    cmd: "gcp-computer:~$ spawn-sandbox --provider gcp-compute-engine --image node-22-alpine",
    output: [
      "⚡ Initializing Sandbox Manager...",
      "✔ Resolving Compute Engine credentials [gcp-key.json]",
      "✔ Spin-up sequence initiated for VM 'gcp-sandbox-us-west1-b'",
      "✔ VM status: RUNNING (142ms latency)",
      "✔ Local directory mounted at: /workspace -> c:/Users/ethan/project",
      "🚀 Sandbox secure container is ready."
    ]
  },
  {
    tab: "2. Run Agent Loop",
    title: "EVE Agent Multi-Turn Orchestration",
    cmd: "gcp-computer:~$ eve-agent run --task \"Find and fix type bugs in src/db/schema.ts and run npm run build\"",
    output: [
      "🤖 Agent starting loop [StopWhen conditions active]",
      "🔍 Executing tool: list_directory(\"/workspace/src/db\")",
      "   └ Result: schema.ts (1,240 bytes) found",
      "🛠 Executing tool: read_file(\"/workspace/src/db/schema.ts\")",
      "🤖 Thought: The export interface schema has a mismatch on property 'createdAt' type.",
      "🛠 Executing tool: replace_file_content(...) -> Type fixed successfully",
      "🛠 Executing tool: execute_command(\"npm run build\")",
      "   └ Output: Build successful. 0 errors. (1.4s)",
      "✔ Agent completed task. Goal achieved."
    ]
  },
  {
    tab: "3. Direct Shell Exec",
    title: "Root Interactive Console",
    cmd: "gcp-computer:~$ exec-sandbox --cmd \"df -h && docker ps -a\"",
    output: [
      "Filesystem      Size  Used Avail Use% Mounted on",
      "/dev/sda1        97G   12G   86G  13% /",
      "tmpfs            64M     0   64M   0% /dev",
      "workspace        97G   12G   86G  13% /workspace",
      "",
      "CONTAINER ID   IMAGE                 COMMAND                  STATUS        NAMES",
      "c198b2cd31fa   node:22-alpine        \"docker-entrypoint.s…\"   Up 2 minutes  gcp-sandbox-active"
    ]
  }
];

export default function PremiumLandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeTestimony, setActiveTestimony] = useState(0);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const copyEnvCommand = () => {
    navigator.clipboard.writeText("APP_MODE=local-emulated\nNEXTAUTH_SECRET=a-secure-random-secret\nNEXTAUTH_URL=http://localhost:3000");
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <main className="gcp-page gcp-mesh-grid relative min-h-screen overflow-x-hidden">
      {/* Background Decorative Ethereal Gradients in GCP Brand Likeness */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-radial from-[rgba(66,133,244,0.08)] to-transparent rounded-full filter blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-radial from-[rgba(210,190,255,0.06)] to-transparent rounded-full filter blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[50%] h-[50%] bg-radial from-[rgba(239,119,89,0.05)] to-transparent rounded-full filter blur-[130px] pointer-events-none" />

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-[100] w-full border-b border-[rgba(232,230,228,0.08)] bg-[rgba(13,13,13,0.8)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <GCPHexagon className="h-9 w-9 animate-float" />
            <span className="text-lg font-medium tracking-tight text-[var(--color-pristine-white)]">
              GCP <span className="text-[var(--color-lavender)]">Computer</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pristine-white)] opacity-60 hover:opacity-100 transition-opacity">Features</a>
            <a href="#demo" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pristine-white)] opacity-60 hover:opacity-100 transition-opacity">Interactive Demo</a>
            <a href="#architecture" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pristine-white)] opacity-60 hover:opacity-100 transition-opacity">Architecture</a>
            <a href="#testimonials" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pristine-white)] opacity-60 hover:opacity-100 transition-opacity">Stories</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] px-4 text-xs font-semibold text-[var(--color-pristine-white)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--color-lavender)] px-4 text-xs font-semibold text-[var(--color-deep-black)] hover:bg-[var(--color-lavender-hover)] transition-all active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 text-center sm:pt-24 sm:pb-32">
        {/* Brand Indicator Badge */}
        <div className="mx-auto mb-6 flex max-w-fit items-center gap-2 rounded-full border border-[rgba(210,190,255,0.2)] bg-[rgba(210,190,255,0.06)] px-4 py-1.5 backdrop-blur-sm">
          <Sparkles size={14} className="text-[var(--color-lavender)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-lavender)]">
            GDG HACKATHON PROTOCOL
          </span>
        </div>

        {/* Display Header */}
        <h1 className="mx-auto max-w-4xl text-4xl font-medium tracking-tight text-[var(--color-pristine-white)] sm:text-6xl leading-[1.1] sm:leading-[1.15]">
          Your Secure Sandbox on <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#4285F4] via-[var(--color-lavender)] to-[#EA4335] bg-clip-text text-transparent">
            Google Cloud Platform
          </span>
        </h1>

        {/* Hero description */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[rgba(255,255,255,0.7)] sm:text-lg">
          GCP Computer provides AI coding agents with isolated Linux workspaces in milliseconds.
          Execute terminal commands, edit directories, mount repositories safely, and let the agent work without compromising your local operating system.
        </p>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="gcp-btn-primary flex items-center justify-center px-8 py-3 text-sm shadow-[0_0_20px_rgba(210,190,255,0.25)] hover:shadow-[0_0_30px_rgba(210,190,255,0.4)] transform hover:-translate-y-[1px]"
          >
            <span>Launch Developer Console</span>
            <ArrowRight size={18} />
          </Link>
          <a
            href="#architecture"
            className="gcp-btn-secondary flex items-center justify-center px-8 py-3 text-sm"
          >
            <span>Read Architecture Specs</span>
            <ExternalLink size={16} />
          </a>
        </div>

        {/* GCP Subtext branding */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-[rgba(255,255,255,0.45)]">
          <div className="flex items-center gap-1.5">
            <Check size={14} className="text-[#34A853]" />
            <span>Google Cloud compute backend</span>
          </div>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-1.5">
            <Check size={14} className="text-[#FBBC05]" />
            <span>Vercel EVE Agent loops</span>
          </div>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-1.5">
            <Check size={14} className="text-[#4285F4]" />
            <span>Zero Local Setup Required</span>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SIMULATOR SHOWCASE */}
      <section id="demo" className="mx-auto max-w-5xl px-6 pb-28">
        <div className="gcp-glass rounded-xl border border-[rgba(255,255,255,0.06)] p-1 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Mock Console Top Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[rgba(20,20,20,0.8)] px-4 py-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#EA4335]" />
              <span className="h-3 w-3 rounded-full bg-[#FBBC05]" />
              <span className="h-3 w-3 rounded-full bg-[#34A853]" />
              <span className="ml-2 font-mono text-xs text-[rgba(255,255,255,0.5)] flex items-center gap-1">
                <Terminal size={12} className="text-[var(--color-lavender)] animate-pulse" />
                terminal-emulator://gcp-sandbox-vm
              </span>
            </div>
            
            {/* Interactive Tabs */}
            <div className="flex gap-1">
              {demoSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`rounded px-3 py-1.5 text-xs font-medium font-mono transition-all ${
                    activeStep === idx 
                      ? 'bg-[var(--color-lavender)] text-[var(--color-deep-black)] shadow-md' 
                      : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
                  }`}
                >
                  {step.tab}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Body */}
          <div className="bg-[rgba(10,10,10,0.95)] p-6 min-h-[340px] font-mono text-xs text-[rgba(255,255,255,0.95)] overflow-x-auto leading-relaxed">
            {/* Active Step Specs */}
            <div className="mb-4 flex items-center gap-2 text-[rgba(255,255,255,0.4)] border-b border-[rgba(255,255,255,0.03)] pb-2">
              <span className="text-[var(--color-terracotta)] font-bold">STATE:</span>
              <span>{demoSteps[activeStep].title}</span>
            </div>

            {/* Simulated prompt input */}
            <div className="flex items-center gap-2 text-[rgba(255,255,255,0.85)] font-bold mb-3">
              <span className="text-[#34A853]">✓</span>
              <span>{demoSteps[activeStep].cmd}</span>
            </div>

            {/* Simulated output stream */}
            <div className="space-y-1.5 pl-4 text-[rgba(255,255,255,0.8)] border-l-2 border-[rgba(210,190,255,0.15)] py-1">
              {demoSteps[activeStep].output.map((line, idx) => (
                <p key={idx} className={
                  line.startsWith('✔') || line.startsWith('🚀') ? 'text-[#34A853]' : 
                  line.startsWith('🤖') ? 'text-[var(--color-lavender)]' :
                  line.startsWith('⚡') ? 'text-[#4285F4]' :
                  line.startsWith('🛠') ? 'text-[var(--color-terracotta)]' : 'text-[rgba(255,255,255,0.8)]'
                }>
                  {line}
                </p>
              ))}
            </div>
            
            {/* Typing cursor indicator */}
            <div className="mt-4 flex items-center gap-1 text-[rgba(255,255,255,0.45)]">
              <span>gcp-computer:~$</span>
              <span className="h-4 w-2 bg-[var(--color-lavender)] animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 border-t border-[rgba(232,230,228,0.06)] bg-[rgba(13,13,13,0.5)]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-semibold tracking-[0.24em] text-[var(--color-terracotta)] uppercase">
            Platform Engine
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Provisioned for Agents. Designed for Isolation.
          </h2>
          <p className="mt-4 text-sm text-[rgba(255,255,255,0.6)]">
            A developer platform targeting sandboxed security vectors. We bridge the gap between heavy agent tasks and zero-trust local constraints.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Hyper-secure VMs */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(66,133,244,0.1)] text-[#4285F4] border border-[rgba(66,133,244,0.15)] mb-5">
              <Cpu size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Compute Engine Sandboxing</h3>
            <p className="mt-2.5 text-xs text-[rgba(255,255,255,0.6)] leading-relaxed">
              Dynamically provision high-performance Linux VMs on demand. Keep execution nodes cleanly separated and isolated from your primary operating system.
            </p>
          </div>

          {/* Card 2: Local Volume Mounts */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(52,168,83,0.1)] text-[#34A853] border border-[rgba(52,168,83,0.15)] mb-5">
              <HardDrive size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Bi-Directional Volume Mounts</h3>
            <p className="mt-2.5 text-xs text-[rgba(255,255,255,0.6)] leading-relaxed">
              Mount single project folders directly inside the remote container or VM. The agent edits files natively while rest of your system remains completely secure.
            </p>
          </div>

          {/* Card 3: Inactivity Reaper */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(251,188,5,0.1)] text-[#FBBC05] border border-[rgba(251,188,5,0.15)] mb-5">
              <Clock size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Smart Inactivity Reaper</h3>
            <p className="mt-2.5 text-xs text-[rgba(255,255,255,0.6)] leading-relaxed">
              Keep cloud budgets tight. The background coordinator tracks agent task states and automatically suspends or terminates inactive VM nodes after 10 minutes.
            </p>
          </div>

          {/* Card 4: EVE Agent Loops */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(210,190,255,0.1)] text-[var(--color-lavender)] border border-[rgba(210,190,255,0.15)] mb-5">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Vercel EVE Loop Orchestration</h3>
            <p className="mt-2.5 text-xs text-[rgba(255,255,255,0.6)] leading-relaxed">
              Integrate multi-turn reasoning loops. Leverages smart `stopWhen` rules to stop tool execution loops as soon as target objectives are satisfied.
            </p>
          </div>

          {/* Card 5: Streamed Agent Logs */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(239,119,89,0.1)] text-[var(--color-terracotta)] border border-[rgba(239,119,89,0.15)] mb-5">
              <Terminal size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Live Streamed Server-Sent Logs</h3>
            <p className="mt-2.5 text-xs text-[rgba(255,255,255,0.6)] leading-relaxed">
              Watch your agent think, debug, and write files in real-time. Features structured visual dropdown logs for inner command calls and API evaluations.
            </p>
          </div>

          {/* Card 6: Multi-Tenant Database */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.8)] border border-[rgba(255,255,255,0.1)] mb-5">
              <Database size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Postgres State Persistence</h3>
            <p className="mt-2.5 text-xs text-[rgba(255,255,255,0.6)] leading-relaxed">
              All interactions, session states, sandboxing configurations, and agent chats are fully logged and safely tracked via our structured database layer.
            </p>
          </div>
        </div>
      </section>

      {/* SYSTEM ARCHITECTURE VISUALIZATION */}
      <section id="architecture" className="mx-auto max-w-7xl px-6 py-24 border-t border-[rgba(232,230,228,0.06)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-[var(--color-lavender)] uppercase">
              System Topology
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Zero-Trust Architecture Diagram
            </h2>
            <p className="mt-4 text-sm text-[rgba(255,255,255,0.7)] leading-relaxed">
              GCP Computer provides clear, decoupled routing between client actions, EVE core loop execution, and actual isolated host shells.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(66,133,244,0.1)] text-[#4285F4] text-xs font-bold font-mono">1</span>
                <div>
                  <h4 className="text-xs font-semibold text-white">Frontend client sends task query</h4>
                  <p className="text-[11px] text-[rgba(255,255,255,0.5)] mt-0.5">Secure SSE streams update the dashboard container in real-time.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(210,190,255,0.1)] text-[var(--color-lavender)] text-xs font-bold font-mono">2</span>
                <div>
                  <h4 className="text-xs font-semibold text-white">EVE Core initiates multi-turn tool resolution</h4>
                  <p className="text-[11px] text-[rgba(255,255,255,0.5)] mt-0.5">Evaluates code edits and CLI tools using Gemini/Vertex API.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(239,119,89,0.1)] text-[var(--color-terracotta)] text-xs font-bold font-mono">3</span>
                <div>
                  <h4 className="text-xs font-semibold text-white">Sandbox driver executes command inside safe container</h4>
                  <p className="text-[11px] text-[rgba(255,255,255,0.5)] mt-0.5">Runs on either a local Docker instance or a VM on Google Compute Engine.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Visual Graphic using pure CSS & SVG */}
          <div className="gcp-glass rounded-xl p-8 border border-[rgba(255,255,255,0.06)] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-radial from-[rgba(210,190,255,0.08)] to-transparent filter blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col gap-6 text-xs font-mono">
              {/* Box 1: Client */}
              <div className="rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="text-[#4285F4] h-5 w-5" />
                  <div>
                    <div className="font-bold text-white">NEXT.JS DASHBOARD</div>
                    <div className="text-[10px] text-[rgba(255,255,255,0.5)]">UI Console State</div>
                  </div>
                </div>
                <span className="text-[10px] bg-[rgba(66,133,244,0.15)] text-[#4285F4] px-2 py-0.5 rounded uppercase font-semibold tracking-wider">SSE Stream</span>
              </div>

              {/* Arrow */}
              <div className="h-6 flex justify-center items-center">
                <div className="w-[2px] h-full bg-gradient-to-b from-[#4285F4] to-[var(--color-lavender)]" />
              </div>

              {/* Box 2: Orchestrator */}
              <div className="rounded border border-[var(--color-lavender)] bg-[rgba(210,190,255,0.03)] p-4 flex items-center justify-between shadow-[0_0_15px_rgba(210,190,255,0.05)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-[var(--color-lavender)] h-5 w-5" />
                  <div>
                    <div className="font-bold text-white">EVE CORE ORCHESTRATOR</div>
                    <div className="text-[10px] text-[rgba(255,255,255,0.5)]">Gemini Multi-Turn AI SDK</div>
                  </div>
                </div>
                <span className="text-[10px] bg-[rgba(210,190,255,0.15)] text-[var(--color-lavender)] px-2 py-0.5 rounded uppercase font-semibold tracking-wider">Tool-Call</span>
              </div>

              {/* Arrow */}
              <div className="h-6 flex justify-center items-center">
                <div className="w-[2px] h-full bg-gradient-to-b from-[var(--color-lavender)] to-[var(--color-terracotta)]" />
              </div>

              {/* Box 3: Target Sandbox */}
              <div className="rounded border border-[var(--color-terracotta)] bg-[rgba(239,119,89,0.03)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="text-[var(--color-terracotta)] h-5 w-5" />
                    <div>
                      <div className="font-bold text-white">SANDBOX ENGINE</div>
                      <div className="text-[10px] text-[rgba(255,255,255,0.5)]">Dedicated Runtime Driver</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[rgba(239,119,89,0.15)] text-[var(--color-terracotta)] px-2 py-0.5 rounded uppercase font-semibold tracking-wider">Isolated</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-[rgba(255,255,255,0.05)]">
                  <div className="rounded bg-[rgba(255,255,255,0.02)] p-2 border border-[rgba(255,255,255,0.05)] text-center">
                    <span className="font-bold text-white">DOCKER DRIVER</span>
                    <p className="text-[9px] opacity-60 mt-0.5">Alpine containers</p>
                  </div>
                  <div className="rounded bg-[rgba(255,255,255,0.02)] p-2 border border-[rgba(255,255,255,0.05)] text-center">
                    <span className="font-bold text-white">GCP DRIVER</span>
                    <p className="text-[9px] opacity-60 mt-0.5">Compute Engine VMs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "LIFE WITH GCP COMPUTER" - CUSTOMER STORIES SECTION */}
      <section id="testimonials" className="mx-auto max-w-7xl px-6 py-24 border-t border-[rgba(232,230,228,0.06)] bg-[rgba(13,13,13,0.3)]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-semibold tracking-[0.24em] text-[var(--color-lavender)] uppercase">
            User Success
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Life with GCP Computer
          </h2>
          <p className="mt-4 text-sm text-[rgba(255,255,255,0.6)]">
            See how AI engineers, developers, and founders configure their secure coding agents.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* List of selectors */}
          <div className="lg:col-span-4 flex flex-col justify-center gap-3">
            {testimonies.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTestimony(idx)}
                className={`w-full text-left rounded-lg p-4 border transition-all ${
                  activeTestimony === idx 
                    ? 'bg-[rgba(255,255,255,0.04)] border-[var(--color-lavender)] text-white shadow-md' 
                    : 'bg-transparent border-transparent text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.02)] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    activeTestimony === idx ? 'bg-[var(--color-lavender)] text-[var(--color-deep-black)]' : 'bg-[rgba(255,255,255,0.08)]'
                  }`}>
                    {item.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-xs leading-none">{item.name}</div>
                    <div className="text-[10px] text-[rgba(255,255,255,0.45)] mt-1 font-mono">{item.role}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Testimonial Active Display */}
          <div className="lg:col-span-8 gcp-glass rounded-xl p-8 border border-[rgba(255,255,255,0.06)] flex flex-col justify-between min-h-[300px]">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-[rgba(255,255,255,0.05)]">
                <div>
                  <h3 className="text-lg font-medium text-white">{testimonies[activeTestimony].name}</h3>
                  <p className="text-xs text-[var(--color-terracotta)] font-mono mt-0.5">{testimonies[activeTestimony].role}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono bg-[rgba(210,190,255,0.1)] text-[var(--color-lavender)] px-2.5 py-1 rounded">
                    {testimonies[activeTestimony].setup}
                  </span>
                </div>
              </div>
              <blockquote className="text-base text-[rgba(255,255,255,0.85)] leading-relaxed italic">
                &ldquo;{testimonies[activeTestimony].text}&rdquo;
              </blockquote>
            </div>

            <div className="mt-8 pt-4 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between text-xs text-[rgba(255,255,255,0.55)]">
              <span>Verified Deployment Case</span>
              <span className="font-bold text-[var(--color-lavender)] font-mono">{testimonies[activeTestimony].stat}</span>
            </div>
          </div>
        </div>
      </section>

      {/* QUICKSTART / GETTING STARTED SECTION */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-2xl font-medium text-white sm:text-3xl">
          Get Started in Emulation Mode
        </h2>
        <p className="mt-3 text-sm text-[rgba(255,255,255,0.65)] max-w-xl mx-auto leading-relaxed">
          No GCP API keys ready yet? Run the app in offline emulator mode. Credentials authentication and memory emulation work out-of-the-box.
        </p>

        <div className="mt-8 max-w-lg mx-auto text-left rounded-lg bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.08)] overflow-hidden font-mono text-xs">
          <div className="flex items-center justify-between bg-[rgba(20,20,20,0.8)] px-4 py-2 border-b border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.5)]">
            <span>.env config</span>
            <button 
              onClick={copyEnvCommand}
              className="text-[10px] text-[var(--color-lavender)] hover:underline"
            >
              {copiedEnv ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="p-4 text-[rgba(255,255,255,0.85)] leading-relaxed select-all">
{`APP_MODE=local-emulated
NEXTAUTH_SECRET=a-secure-random-secret
NEXTAUTH_URL=http://localhost:3000`}
          </pre>
        </div>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/login"
            className="gcp-btn-primary px-8 py-3 text-sm"
          >
            <span>Proceed to Login</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* BRONZE/SILVER SPONSOR FOOTER */}
      <footer className="border-t border-[rgba(232,230,228,0.06)] bg-[rgba(10,10,10,0.9)] py-12 text-xs text-[rgba(255,255,255,0.45)]">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <GCPHexagon className="h-5 w-5 opacity-60" />
            <span>GCP Computer &copy; 2026. Built for Google I/O Extended GDG Newport Beach.</span>
          </div>

          <div className="flex gap-4">
            <a href="https://about.google/brand-resource-center/guidance/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GCP Brand Guidance</a>
            <span>&middot;</span>
            <a href="https://github.com/EthanThatOneKid/gcp-computer" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              GitHub Repo
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
