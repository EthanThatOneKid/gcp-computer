'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Terminal,
  Cpu,
  Clock,
  HardDrive,
  ExternalLink,
  Check,
  Sparkles,
  Globe,
  Database,
} from 'lucide-react';

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
    name: 'Anthea',
    role: 'Autonomous Agent Architect',
    avatar: 'A',
    text: 'I used to run coding agents locally on my machine, which felt like letting a stranger run arbitrary CLI commands on my host system. Spawning isolated sandboxes on GCP Computer in milliseconds keeps my code clean, protected, and fully observable.',
    stat: '12 local tools replaced',
    setup: 'Docker alpine-node driver',
  },
  {
    name: 'Jing',
    role: 'AI Quant Lead',
    avatar: 'J',
    text: 'We run deep research loops that execute code packages overnight. The Inactivity Reaper is a lifesaver—it automatically hibernates our Compute Engine instances after 10 minutes of idle time. No more surprise multi-thousand-dollar cloud bills.',
    stat: '85% compute cost savings',
    setup: 'GCP Compute Engine VMs',
  },
  {
    name: 'Joe',
    role: 'Full-Stack Dev & Tinker',
    avatar: 'J',
    text: "GCP Computer goes beyond basic chat scripts. It gives my developer agent a real Linux environment with root access. It can download npm packages, run migrations, and spin up databases. It's the ultimate 'Vibe Coding' terminal.",
    stat: '140ms startup latency',
    setup: 'Dedicated micro-sandbox',
  },
  {
    name: 'Kate',
    role: 'Solo SaaS Founder',
    avatar: 'K',
    text: 'With safe volume mounting, I can grant the agent direct, temporary access to a single subdirectory of my codebase. It commits modifications, spins up local testing servers, and outputs logs straight to my Slack webhooks.',
    stat: '24/7 background agent execution',
    setup: 'Slack + GitHub mounts',
  },
];

const demoSteps = [
  {
    tab: '1. Provision Sandbox',
    title: 'Instant Workspace Spawning',
    cmd: 'gcp-computer:~$ spawn-sandbox --provider gcp-compute-engine --image node-22-alpine',
    output: [
      '⚡ Initializing Sandbox Manager...',
      '✔ Resolving Compute Engine credentials [gcp-key.json]',
      "✔ Spin-up sequence initiated for VM 'gcp-sandbox-us-west1-b'",
      '✔ VM status: RUNNING (142ms latency)',
      '✔ Local directory mounted at: /workspace -> c:/Users/ethan/project',
      '🚀 Sandbox secure container is ready.',
    ],
  },
  {
    tab: '2. Run Agent Loop',
    title: 'EVE Agent Multi-Turn Orchestration',
    cmd: 'gcp-computer:~$ eve-agent run --task "Find and fix type bugs in src/db/schema.ts and run npm run build"',
    output: [
      '🤖 Agent starting loop [StopWhen conditions active]',
      '🔍 Executing tool: list_directory("/workspace/src/db")',
      '   └ Result: schema.ts (1,240 bytes) found',
      '🛠 Executing tool: read_file("/workspace/src/db/schema.ts")',
      "🤖 Thought: The export interface schema has a mismatch on property 'createdAt' type.",
      '🛠 Executing tool: replace_file_content(...) -> Type fixed successfully',
      '🛠 Executing tool: execute_command("npm run build")',
      '   └ Output: Build successful. 0 errors. (1.4s)',
      '✔ Agent completed task. Goal achieved.',
    ],
  },
  {
    tab: '3. Direct Shell Exec',
    title: 'Root Interactive Console',
    cmd: 'gcp-computer:~$ exec-sandbox --cmd "df -h && docker ps -a"',
    output: [
      'Filesystem      Size  Used Avail Use% Mounted on',
      '/dev/sda1        97G   12G   86G  13% /',
      'tmpfs            64M     0   64M   0% /dev',
      'workspace        97G   12G   86G  13% /workspace',
      '',
      'CONTAINER ID   IMAGE                 COMMAND                  STATUS        NAMES',
      'c198b2cd31fa   node:22-alpine        "docker-entrypoint.s…"   Up 2 minutes  gcp-sandbox-active',
    ],
  },
];

export default function PremiumLandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeTestimony, setActiveTestimony] = useState(0);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const copyEnvCommand = () => {
    navigator.clipboard.writeText(
      'APP_MODE=local-emulated\nNEXTAUTH_SECRET=a-secure-random-secret\nNEXTAUTH_URL=http://localhost:3000',
    );
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="gcp-page gcp-mesh-grid relative min-h-screen overflow-x-hidden">
      {/* Background Decorative Ethereal Gradients in GCP Brand Likeness */}
      <div className="animate-pulse-glow pointer-events-none absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-radial from-[rgba(66,133,244,0.08)] to-transparent blur-[120px] filter" />
      <div className="pointer-events-none absolute top-[20%] right-[-10%] h-[60%] w-[60%] rounded-full bg-radial from-[rgba(210,190,255,0.06)] to-transparent blur-[150px] filter" />
      <div className="pointer-events-none absolute bottom-[10%] left-[10%] h-[50%] w-[50%] rounded-full bg-radial from-[rgba(239,119,89,0.05)] to-transparent blur-[130px] filter" />



      {/* HERO SECTION */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 text-center sm:pt-24 sm:pb-32">
        {/* Brand Indicator Badge */}
        <div className="mx-auto mb-6 flex max-w-fit items-center gap-2 rounded-full border border-[rgba(210,190,255,0.2)] bg-[rgba(210,190,255,0.06)] px-4 py-1.5 backdrop-blur-sm">
          <Sparkles size={14} className="text-[var(--color-lavender)]" />
          <span className="text-[10px] font-semibold tracking-[0.2em] text-[var(--color-lavender)] uppercase">
            GDG HACKATHON PROTOCOL
          </span>
        </div>

        {/* Display Header */}
        <h1 className="mx-auto max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight text-[var(--color-pristine-white)] sm:text-6xl sm:leading-[1.15]">
          Your Secure Sandbox on <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#4285F4] via-[var(--color-lavender)] to-[#EA4335] bg-clip-text text-transparent">
            Google Cloud Platform
          </span>
        </h1>

        {/* Hero description */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[rgba(255,255,255,0.7)] sm:text-lg">
          GCP Computer provides AI coding agents with isolated Linux workspaces in milliseconds.
          Execute terminal commands, edit directories, mount repositories safely, and let the agent
          work without compromising your local operating system.
        </p>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="gcp-btn-primary flex transform items-center justify-center px-8 py-3 text-sm shadow-[0_0_20px_rgba(210,190,255,0.25)] hover:-translate-y-[1px] hover:shadow-[0_0_30px_rgba(210,190,255,0.4)]"
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
        <div className="gcp-glass overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Mock Console Top Bar */}
          <div className="flex flex-col items-stretch justify-between gap-2 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(20,20,20,0.8)] px-4 py-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#EA4335]" />
              <span className="h-3 w-3 rounded-full bg-[#FBBC05]" />
              <span className="h-3 w-3 rounded-full bg-[#34A853]" />
              <span className="ml-2 flex items-center gap-1 font-mono text-xs text-[rgba(255,255,255,0.5)]">
                <Terminal size={12} className="animate-pulse text-[var(--color-lavender)]" />
                terminal-emulator://gcp-sandbox-vm
              </span>
            </div>

            {/* Interactive Tabs */}
            <div className="flex gap-1">
              {demoSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`rounded px-3 py-1.5 font-mono text-xs font-medium transition-all ${
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
          <div className="min-h-[340px] overflow-x-auto bg-[rgba(10,10,10,0.95)] p-6 font-mono text-xs leading-relaxed text-[rgba(255,255,255,0.95)]">
            {/* Active Step Specs */}
            <div className="mb-4 flex items-center gap-2 border-b border-[rgba(255,255,255,0.03)] pb-2 text-[rgba(255,255,255,0.4)]">
              <span className="font-bold text-[var(--color-terracotta)]">STATE:</span>
              <span>{demoSteps[activeStep].title}</span>
            </div>

            {/* Simulated prompt input */}
            <div className="mb-3 flex items-center gap-2 font-bold text-[rgba(255,255,255,0.85)]">
              <span className="text-[#34A853]">✓</span>
              <span>{demoSteps[activeStep].cmd}</span>
            </div>

            {/* Simulated output stream */}
            <div className="space-y-1.5 border-l-2 border-[rgba(210,190,255,0.15)] py-1 pl-4 text-[rgba(255,255,255,0.8)]">
              {demoSteps[activeStep].output.map((line, idx) => (
                <p
                  key={idx}
                  className={
                    line.startsWith('✔') || line.startsWith('🚀')
                      ? 'text-[#34A853]'
                      : line.startsWith('🤖')
                        ? 'text-[var(--color-lavender)]'
                        : line.startsWith('⚡')
                          ? 'text-[#4285F4]'
                          : line.startsWith('🛠')
                            ? 'text-[var(--color-terracotta)]'
                            : 'text-[rgba(255,255,255,0.8)]'
                  }
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Typing cursor indicator */}
            <div className="mt-4 flex items-center gap-1 text-[rgba(255,255,255,0.45)]">
              <span>gcp-computer:~$</span>
              <span className="h-4 w-2 animate-pulse bg-[var(--color-lavender)]" />
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section
        id="features"
        className="mx-auto max-w-7xl border-t border-[rgba(232,230,228,0.06)] bg-[rgba(13,13,13,0.5)] px-6 py-24"
      >
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.24em] text-[var(--color-terracotta)] uppercase">
            Platform Engine
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Provisioned for Agents. Designed for Isolation.
          </h2>
          <p className="mt-4 text-sm text-[rgba(255,255,255,0.6)]">
            A developer platform targeting sandboxed security vectors. We bridge the gap between
            heavy agent tasks and zero-trust local constraints.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Hyper-secure VMs */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[rgba(66,133,244,0.15)] bg-[rgba(66,133,244,0.1)] text-[#4285F4]">
              <Cpu size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Compute Engine Sandboxing</h3>
            <p className="mt-2.5 text-xs leading-relaxed text-[rgba(255,255,255,0.6)]">
              Dynamically provision high-performance Linux VMs on demand. Keep execution nodes
              cleanly separated and isolated from your primary operating system.
            </p>
          </div>

          {/* Card 2: Local Volume Mounts */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[rgba(52,168,83,0.15)] bg-[rgba(52,168,83,0.1)] text-[#34A853]">
              <HardDrive size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Bi-Directional Volume Mounts</h3>
            <p className="mt-2.5 text-xs leading-relaxed text-[rgba(255,255,255,0.6)]">
              Mount single project folders directly inside the remote container or VM. The agent
              edits files natively while rest of your system remains completely secure.
            </p>
          </div>

          {/* Card 3: Inactivity Reaper */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[rgba(251,188,5,0.15)] bg-[rgba(251,188,5,0.1)] text-[#FBBC05]">
              <Clock size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Smart Inactivity Reaper</h3>
            <p className="mt-2.5 text-xs leading-relaxed text-[rgba(255,255,255,0.6)]">
              Keep cloud budgets tight. The background coordinator tracks agent task states and
              automatically suspends or terminates inactive VM nodes after 10 minutes.
            </p>
          </div>

          {/* Card 4: EVE Agent Loops */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[rgba(210,190,255,0.15)] bg-[rgba(210,190,255,0.1)] text-[var(--color-lavender)]">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Vercel EVE Loop Orchestration</h3>
            <p className="mt-2.5 text-xs leading-relaxed text-[rgba(255,255,255,0.6)]">
              Integrate multi-turn reasoning loops. Leverages smart `stopWhen` rules to stop tool
              execution loops as soon as target objectives are satisfied.
            </p>
          </div>

          {/* Card 5: Streamed Agent Logs */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[rgba(239,119,89,0.15)] bg-[rgba(239,119,89,0.1)] text-[var(--color-terracotta)]">
              <Terminal size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Live Streamed Server-Sent Logs</h3>
            <p className="mt-2.5 text-xs leading-relaxed text-[rgba(255,255,255,0.6)]">
              Watch your agent think, debug, and write files in real-time. Features structured
              visual dropdown logs for inner command calls and API evaluations.
            </p>
          </div>

          {/* Card 6: Multi-Tenant Database */}
          <div className="gcp-glass gcp-glass-hover rounded-xl p-6 transition-all duration-300">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.8)]">
              <Database size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Postgres State Persistence</h3>
            <p className="mt-2.5 text-xs leading-relaxed text-[rgba(255,255,255,0.6)]">
              All interactions, session states, sandboxing configurations, and agent chats are fully
              logged and safely tracked via our structured database layer.
            </p>
          </div>
        </div>
      </section>

      {/* SYSTEM ARCHITECTURE VISUALIZATION */}
      <section
        id="architecture"
        className="mx-auto max-w-7xl border-t border-[rgba(232,230,228,0.06)] px-6 py-24"
      >
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-[var(--color-lavender)] uppercase">
              System Topology
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Zero-Trust Architecture Diagram
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[rgba(255,255,255,0.7)]">
              GCP Computer provides clear, decoupled routing between client actions, EVE core loop
              execution, and actual isolated host shells.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(66,133,244,0.1)] font-mono text-xs font-bold text-[#4285F4]">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Frontend client sends task query
                  </h4>
                  <p className="mt-0.5 text-[11px] text-[rgba(255,255,255,0.5)]">
                    Secure SSE streams update the dashboard container in real-time.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(210,190,255,0.1)] font-mono text-xs font-bold text-[var(--color-lavender)]">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    EVE Core initiates multi-turn tool resolution
                  </h4>
                  <p className="mt-0.5 text-[11px] text-[rgba(255,255,255,0.5)]">
                    Evaluates code edits and CLI tools using Gemini/Vertex API.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(239,119,89,0.1)] font-mono text-xs font-bold text-[var(--color-terracotta)]">
                  3
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Sandbox driver executes command inside safe container
                  </h4>
                  <p className="mt-0.5 text-[11px] text-[rgba(255,255,255,0.5)]">
                    Runs on either a local Docker instance or a VM on Google Compute Engine.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Visual Graphic using pure CSS & SVG */}
          <div className="gcp-glass relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] p-8">
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 bg-radial from-[rgba(210,190,255,0.08)] to-transparent blur-3xl filter" />

            <div className="relative flex flex-col gap-6 font-mono text-xs">
              {/* Box 1: Client */}
              <div className="flex items-center justify-between rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#4285F4]" />
                  <div>
                    <div className="font-bold text-white">NEXT.JS DASHBOARD</div>
                    <div className="text-[10px] text-[rgba(255,255,255,0.5)]">UI Console State</div>
                  </div>
                </div>
                <span className="rounded bg-[rgba(66,133,244,0.15)] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#4285F4] uppercase">
                  SSE Stream
                </span>
              </div>

              {/* Arrow */}
              <div className="flex h-6 items-center justify-center">
                <div className="h-full w-[2px] bg-gradient-to-b from-[#4285F4] to-[var(--color-lavender)]" />
              </div>

              {/* Box 2: Orchestrator */}
              <div className="flex items-center justify-between rounded border border-[var(--color-lavender)] bg-[rgba(210,190,255,0.03)] p-4 shadow-[0_0_15px_rgba(210,190,255,0.05)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[var(--color-lavender)]" />
                  <div>
                    <div className="font-bold text-white">EVE CORE ORCHESTRATOR</div>
                    <div className="text-[10px] text-[rgba(255,255,255,0.5)]">
                      Gemini Multi-Turn AI SDK
                    </div>
                  </div>
                </div>
                <span className="rounded bg-[rgba(210,190,255,0.15)] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[var(--color-lavender)] uppercase">
                  Tool-Call
                </span>
              </div>

              {/* Arrow */}
              <div className="flex h-6 items-center justify-center">
                <div className="h-full w-[2px] bg-gradient-to-b from-[var(--color-lavender)] to-[var(--color-terracotta)]" />
              </div>

              {/* Box 3: Target Sandbox */}
              <div className="rounded border border-[var(--color-terracotta)] bg-[rgba(239,119,89,0.03)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-[var(--color-terracotta)]" />
                    <div>
                      <div className="font-bold text-white">SANDBOX ENGINE</div>
                      <div className="text-[10px] text-[rgba(255,255,255,0.5)]">
                        Dedicated Runtime Driver
                      </div>
                    </div>
                  </div>
                  <span className="rounded bg-[rgba(239,119,89,0.15)] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[var(--color-terracotta)] uppercase">
                    Isolated
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-[rgba(255,255,255,0.05)] pt-2 text-[10px]">
                  <div className="rounded border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-2 text-center">
                    <span className="font-bold text-white">DOCKER DRIVER</span>
                    <p className="mt-0.5 text-[9px] opacity-60">Alpine containers</p>
                  </div>
                  <div className="rounded border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-2 text-center">
                    <span className="font-bold text-white">GCP DRIVER</span>
                    <p className="mt-0.5 text-[9px] opacity-60">Compute Engine VMs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "LIFE WITH GCP COMPUTER" - CUSTOMER STORIES SECTION */}
      <section
        id="testimonials"
        className="mx-auto max-w-7xl border-t border-[rgba(232,230,228,0.06)] bg-[rgba(13,13,13,0.3)] px-6 py-24"
      >
        <div className="mx-auto mb-16 max-w-3xl text-center">
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

        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          {/* List of selectors */}
          <div className="flex flex-col justify-center gap-3 lg:col-span-4">
            {testimonies.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTestimony(idx)}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  activeTestimony === idx
                    ? 'border-[var(--color-lavender)] bg-[rgba(255,255,255,0.04)] text-white shadow-md'
                    : 'border-transparent bg-transparent text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.02)] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      activeTestimony === idx
                        ? 'bg-[var(--color-lavender)] text-[var(--color-deep-black)]'
                        : 'bg-[rgba(255,255,255,0.08)]'
                    }`}
                  >
                    {item.avatar}
                  </div>
                  <div>
                    <div className="text-xs leading-none font-semibold">{item.name}</div>
                    <div className="mt-1 font-mono text-[10px] text-[rgba(255,255,255,0.45)]">
                      {item.role}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Testimonial Active Display */}
          <div className="gcp-glass flex min-h-[300px] flex-col justify-between rounded-xl border border-[rgba(255,255,255,0.06)] p-8 lg:col-span-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-4">
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {testimonies[activeTestimony].name}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-[var(--color-terracotta)]">
                    {testimonies[activeTestimony].role}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded bg-[rgba(210,190,255,0.1)] px-2.5 py-1 font-mono text-[10px] text-[var(--color-lavender)]">
                    {testimonies[activeTestimony].setup}
                  </span>
                </div>
              </div>
              <blockquote className="text-base leading-relaxed text-[rgba(255,255,255,0.85)] italic">
                &ldquo;{testimonies[activeTestimony].text}&rdquo;
              </blockquote>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-4 text-xs text-[rgba(255,255,255,0.55)]">
              <span>Verified Deployment Case</span>
              <span className="font-mono font-bold text-[var(--color-lavender)]">
                {testimonies[activeTestimony].stat}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* QUICKSTART / GETTING STARTED SECTION */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-2xl font-medium text-white sm:text-3xl">
          Get Started in Emulation Mode
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[rgba(255,255,255,0.65)]">
          No GCP API keys ready yet? Run the app in offline emulator mode. Credentials
          authentication and memory emulation work out-of-the-box.
        </p>

        <div className="mx-auto mt-8 max-w-lg overflow-hidden rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.4)] text-left font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[rgba(20,20,20,0.8)] px-4 py-2 text-[rgba(255,255,255,0.5)]">
            <span>.env config</span>
            <button
              onClick={copyEnvCommand}
              className="text-[10px] text-[var(--color-lavender)] hover:underline"
            >
              {copiedEnv ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="p-4 leading-relaxed text-[rgba(255,255,255,0.85)] select-all">
            {`APP_MODE=local-emulated
NEXTAUTH_SECRET=a-secure-random-secret
NEXTAUTH_URL=http://localhost:3000`}
          </pre>
        </div>

        <div className="mt-10 flex justify-center gap-4">
          <Link href="/login" className="gcp-btn-primary px-8 py-3 text-sm">
            <span>Proceed to Login</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>


    </div>
  );
}
