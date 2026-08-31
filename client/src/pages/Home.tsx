import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Cloud,
  Copy,
  Factory,
  FileCheck2,
  FileText,
  Gauge,
  HardHat,
  LayoutDashboard,
  Link2,
  LogOut,
  MapPin,
  Menu,
  PackageCheck,
  PanelLeft,
  Plus,
  QrCode,
  Route,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Truck,
  UserRoundCog,
  UsersRound,
  Wrench,
  X,
  Zap,
} from "lucide-react";

type RoleKey = "gestao" | "terceiros" | "pessoas" | "campo";
type SectionKey =
  | "visao"
  | "ordens"
  | "agenda"
  | "clientes"
  | "equipamentos"
  | "pessoas"
  | "terceiros"
  | "estoque"
  | "relatorios"
  | "integracoes";

type NavItem = {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const navItems: NavItem[] = [
  { key: "visao", label: "Visão geral", icon: LayoutDashboard },
  { key: "ordens", label: "Ordens de serviço", icon: FileText, badge: "24" },
  { key: "agenda", label: "Agenda e despacho", icon: CalendarDays },
  { key: "clientes", label: "Clientes", icon: Factory },
  { key: "equipamentos", label: "Equipamentos", icon: Wrench },
  { key: "pessoas", label: "Pessoas", icon: UsersRound },
  { key: "terceiros", label: "Terceiros", icon: UserRoundCog },
  { key: "estoque", label: "Estoque", icon: PackageCheck, badge: "3" },
  { key: "relatorios", label: "Relatórios", icon: Gauge },
  { key: "integracoes", label: "Integrações", icon: Link2 },
];

const roles: Array<{
  key: RoleKey;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  { key: "gestao", label: "Gestão Inovadoor", description: "Operação, OS e indicadores", icon: LayoutDashboard },
  { key: "terceiros", label: "Painel de terceiros", description: "Empresas parceiras e SLA", icon: UserRoundCog },
  { key: "pessoas", label: "Gestão de pessoas", description: "Times, acessos e desempenho", icon: UsersRound },
  { key: "campo", label: "Equipe de campo", description: "PWA para executar serviços", icon: HardHat },
];

const workOrders = [
  { id: "OS-2026-0842", customer: "FrioSul Distribuição", type: "Manutenção corretiva", unit: "São José dos Pinhais", tech: "Marcos Lima", status: "Em campo", statusKey: "progress", time: "09:30", priority: "Alta" },
  { id: "OS-2026-0841", customer: "Metalúrgica Aurora", type: "Preventiva — Porta seccional", unit: "Araucária", tech: "Camila Rocha", status: "Agendada", statusKey: "scheduled", time: "10:45", priority: "Média" },
  { id: "OS-2026-0839", customer: "LogPark Curitiba", type: "Instalação — Abrigo de doca", unit: "Curitiba", tech: "Rafael Alves", status: "Aguardando peça", statusKey: "waiting", time: "13:00", priority: "Alta" },
  { id: "OS-2026-0836", customer: "Alimentos Paraná", type: "Inspeção de segurança", unit: "Pinhais", tech: "João Vitor", status: "Concluída", statusKey: "done", time: "Ontem", priority: "Baixa" },
  { id: "OS-2026-0832", customer: "Centro Logístico Norte", type: "Manutenção preventiva", unit: "Colombo", tech: "Equipe Updoors", status: "Em aprovação", statusKey: "approval", time: "Ontem", priority: "Média" },
];

const teamMembers = [
  { name: "Marcos Lima", role: "Técnico sênior", initials: "ML", color: "bg-orange-100 text-orange-700", status: "Em atendimento", location: "Araucária", progress: 68 },
  { name: "Camila Rocha", role: "Técnica de campo", initials: "CR", color: "bg-blue-100 text-blue-700", status: "A caminho", location: "Curitiba", progress: 42 },
  { name: "Rafael Alves", role: "Técnico parceiro", initials: "RA", color: "bg-emerald-100 text-emerald-700", status: "Disponível", location: "Pinhais", progress: 18 },
  { name: "João Vitor", role: "Técnico de campo", initials: "JV", color: "bg-violet-100 text-violet-700", status: "Em pausa", location: "Colombo", progress: 55 },
];

const customers = [
  { name: "FrioSul Distribuição", city: "São José dos Pinhais", assets: 12, open: 2, health: "Estável" },
  { name: "Metalúrgica Aurora", city: "Araucária", assets: 8, open: 1, health: "Atenção" },
  { name: "LogPark Curitiba", city: "Curitiba", assets: 24, open: 3, health: "Estável" },
  { name: "Alimentos Paraná", city: "Pinhais", assets: 6, open: 0, health: "Estável" },
];

const assets = [
  { code: "EQP-00921", name: "Porta rápida — Docas 04", customer: "FrioSul Distribuição", model: "Inova Speed 400", last: "28 ago 2026", state: "Operacional" },
  { code: "EQP-00876", name: "Porta seccional — Galpão B", customer: "Metalúrgica Aurora", model: "Inova Seccional", last: "21 ago 2026", state: "Manutenção" },
  { code: "EQP-00714", name: "Abrigo de doca — Expedição", customer: "LogPark Curitiba", model: "Inova Dock", last: "16 ago 2026", state: "Operacional" },
  { code: "EQP-00689", name: "Porta rápida — Câmara fria", customer: "Alimentos Paraná", model: "Inova Flex", last: "02 ago 2026", state: "Atenção" },
];

const thirdParties = [
  { name: "Updoors Assistência", region: "Sul", open: 7, sla: "94%", status: "Homologado", contact: "Eduardo Martins" },
  { name: "Portas & Cia Técnica", region: "Sudeste", open: 4, sla: "88%", status: "Em revisão", contact: "Ana Paula" },
  { name: "Manutec Industrial", region: "Centro-Oeste", open: 3, sla: "97%", status: "Homologado", contact: "Ricardo Souza" },
  { name: "Técnica Norte", region: "Norte", open: 2, sla: "91%", status: "Homologado", contact: "Juliana Costa" },
];

const people = [
  { name: "Marcos Lima", area: "Operações de campo", profile: "Técnico sênior", last: "Online agora", access: "Ativo" },
  { name: "Camila Rocha", area: "Operações de campo", profile: "Técnica de campo", last: "Há 4 min", access: "Ativo" },
  { name: "Beatriz Nogueira", area: "Gestão", profile: "Coordenadora", last: "Há 18 min", access: "Ativo" },
  { name: "Rafael Alves", area: "Terceiros", profile: "Técnico parceiro", last: "Ontem", access: "Pendente" },
];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusPill({ status, statusKey }: { status: string; statusKey?: string }) {
  const styles: Record<string, string> = {
    progress: "bg-blue-50 text-blue-700 ring-blue-200",
    scheduled: "bg-slate-50 text-slate-600 ring-slate-200",
    waiting: "bg-amber-50 text-amber-700 ring-amber-200",
    done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    approval: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset", styles[statusKey ?? ""] ?? "bg-slate-50 text-slate-600 ring-slate-200")}>{status}</span>;
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, detail, icon: Icon, tone, trend }: { label: string; value: string; detail: string; icon: LucideIcon; tone: string; trend?: "up" | "down" }) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(15,23,42,0.08)] sm:p-5">
      <div className="flex items-start justify-between">
        <div className={cx("flex h-10 w-10 items-center justify-center rounded-xl", tone)}><Icon className="h-[18px] w-[18px]" /></div>
        {trend && <span className={cx("flex items-center gap-0.5 text-[11px] font-semibold", trend === "up" ? "text-emerald-600" : "text-rose-600")}><ArrowUpRight className={cx("h-3.5 w-3.5", trend === "down" && "rotate-90")} />{trend === "up" ? "12,5%" : "3,1%"}</span>}
      </div>
      <p className="mt-4 text-[12px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </div>
  );
}

function MiniMap() {
  return (
    <div className="relative h-[294px] overflow-hidden rounded-2xl bg-[#dce9e8] [background-image:linear-gradient(30deg,rgba(255,255,255,.55)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.55)_87.5%,rgba(255,255,255,.55)),linear-gradient(150deg,rgba(255,255,255,.55)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.55)_87.5%,rgba(255,255,255,.55)),linear-gradient(30deg,rgba(255,255,255,.55)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.55)_87.5%,rgba(255,255,255,.55)),linear-gradient(150deg,rgba(255,255,255,.55)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.55)_87.5%,rgba(255,255,255,.55)),linear-gradient(60deg,rgba(131,173,168,.3)_25%,transparent_25.5%,transparent_75%,rgba(131,173,168,.3)_75%)] [background-position:0_0,0_0,20px_35px,20px_35px,0_0] [background-size:40px_70px]">
      <div className="absolute inset-x-0 top-[34%] h-7 -rotate-6 bg-[#f9e3ae]/70 shadow-[0_0_10px_rgba(255,255,255,.7)]" />
      <div className="absolute inset-y-0 left-[43%] w-6 rotate-[23deg] bg-[#b9d6cf]/80" />
      <div className="absolute left-[23%] top-[24%] h-20 w-32 rotate-12 rounded-[30%] bg-[#c5dfd8]/90" />
      <div className="absolute right-[12%] bottom-[18%] h-20 w-36 -rotate-12 rounded-[35%] bg-[#c5dfd8]/90" />
      <div className="absolute left-[36%] top-[23%] h-3 w-3 rounded-full bg-orange-500 ring-4 ring-orange-200/70 shadow-lg shadow-orange-500/50" />
      <div className="absolute left-[63%] top-[46%] h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-200/70 shadow-lg shadow-blue-600/50" />
      <div className="absolute left-[29%] bottom-[24%] h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-200/70 shadow-lg shadow-emerald-600/50" />
      <div className="absolute right-[22%] top-[23%] h-3 w-3 rounded-full bg-violet-600 ring-4 ring-violet-200/70 shadow-lg shadow-violet-600/50" />
      <div className="absolute left-[29%] top-[13%] rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">São José dos Pinhais</div>
      <div className="absolute right-[16%] top-[41%] rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">Curitiba</div>
      <div className="absolute bottom-[12%] left-[21%] rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">Araucária</div>
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-white/85 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur"><MapPin className="h-3 w-3 text-orange-600" />4 técnicos ativos</div>
      <div className="absolute right-3 top-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm">Tempo real · 10:24</div>
    </div>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (section: SectionKey) => void }) {
  return (
    <>
      <SectionHeading eyebrow="Operação · segunda-feira" title="Bom dia, Beatriz" description="Acompanhe a operação de portas industriais em tempo real." action={<button onClick={() => onNavigate("ordens")} className="hidden items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#dd5c12] sm:flex"><Plus className="h-4 w-4" />Nova ordem</button>} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="OS em andamento" value="24" detail="8 em campo agora" icon={FileCheck2} tone="bg-blue-50 text-blue-700" trend="up" />
        <StatCard label="Técnicos ativos" value="18 / 22" detail="4 disponíveis para despacho" icon={UsersRound} tone="bg-emerald-50 text-emerald-700" trend="up" />
        <StatCard label="SLA no prazo" value="92%" detail="+4,6 p.p. vs. semana anterior" icon={Clock3} tone="bg-amber-50 text-amber-700" trend="up" />
        <StatCard label="Atenções críticas" value="03" detail="2 OS aguardando peça" icon={CircleAlert} tone="bg-rose-50 text-rose-700" trend="down" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(350px,.8fr)]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-base font-bold text-slate-950">Fluxo de ordens de serviço</h2><p className="mt-1 text-xs text-slate-400">Distribuição da operação nas últimas 24 horas</p></div><button onClick={() => onNavigate("relatorios")} className="text-xs font-semibold text-orange-600 hover:text-orange-700">Ver relatório <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button></div>
          <div className="flex h-44 items-end gap-2 border-b border-slate-100 pb-0 sm:gap-3">
            {[42, 56, 38, 76, 65, 88, 72, 58, 92, 75, 84, 68, 97, 81, 74, 89, 66, 78].map((height, index) => <div key={index} className="group flex flex-1 flex-col items-center justify-end gap-2"><div className={cx("w-full max-w-[24px] rounded-t-md transition group-hover:opacity-80", index > 14 ? "bg-orange-500" : "bg-blue-100")} style={{ height: `${height * 1.15}px`, minHeight: `${height * 1.15}px`, backgroundColor: index > 14 ? "#f97316" : "#dbeafe" }} /><span className="text-[9px] text-slate-300">{index % 3 === 0 ? `${8 + index}:00` : ""}</span></div>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-100" />Ordens abertas</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-orange-500" />Em execução</span><span className="ml-auto font-semibold text-slate-700">128 atividades este mês</span></div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-base font-bold text-slate-950">Equipe em campo</h2><p className="mt-1 text-xs text-slate-400">Localização atual dos atendimentos</p></div><button onClick={() => onNavigate("agenda")} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-orange-600"><ArrowUpRight className="h-4 w-4" /></button></div><MiniMap /></div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(350px,.8fr)]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-base font-bold text-slate-950">Próximas atividades</h2><p className="mt-1 text-xs text-slate-400">Acompanhe as OS prioritárias da operação</p></div><button onClick={() => onNavigate("ordens")} className="text-xs font-semibold text-orange-600">Ver todas <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" /></button></div><div className="divide-y divide-slate-100">{workOrders.slice(0, 4).map(order => <div key={order.id} className="flex items-center gap-3 py-3 first:pt-1"><div className={cx("hidden h-9 w-9 items-center justify-center rounded-xl sm:flex", order.statusKey === "progress" ? "bg-blue-50 text-blue-600" : order.statusKey === "waiting" ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500")}><Wrench className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{order.customer}</p><p className="mt-0.5 truncate text-xs text-slate-400">{order.id} · {order.type}</p></div><div className="hidden text-right md:block"><p className="text-xs font-medium text-slate-600">{order.tech}</p><p className="mt-0.5 text-[11px] text-slate-400">{order.time}</p></div><StatusPill status={order.status} statusKey={order.statusKey} /></div>)}</div></div>
        <div className="rounded-2xl border border-slate-200/80 bg-[#0d1d2e] p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.15)] sm:p-6"><div className="flex items-start justify-between"><div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300"><Sparkles className="h-3 w-3" />Field insights</span><h2 className="mt-4 font-display text-lg font-bold">A operação está 8% mais ágil</h2><p className="mt-2 text-xs leading-5 text-slate-300">A taxa de conclusão no primeiro atendimento melhorou nesta semana.</p></div><Activity className="h-5 w-5 text-orange-300" /></div><div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] text-slate-400">Primeiro atendimento</p><p className="mt-1 text-xl font-bold">78%</p><p className="mt-1 text-[10px] text-emerald-300">+6,2 p.p.</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] text-slate-400">Tempo médio</p><p className="mt-1 text-xl font-bold">2h18</p><p className="mt-1 text-[10px] text-emerald-300">-14 min</p></div></div><button onClick={() => onNavigate("relatorios")} className="mt-5 flex items-center gap-2 text-xs font-semibold text-orange-300 hover:text-orange-200">Explorar indicadores <ArrowUpRight className="h-3.5 w-3.5" /></button></div>
      </div>
    </>
  );
}

function TableToolbar({ buttonLabel = "Novo cadastro", onAdd }: { buttonLabel?: string; onAdd?: () => void }) {
  return <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:max-w-sm"><Search className="h-4 w-4 text-slate-400" /><input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Buscar por nome ou código" /></div><div className="flex items-center gap-2"><button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300"><SlidersHorizontal className="h-3.5 w-3.5" />Filtros</button><button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/15 transition hover:bg-[#dd5c12]"><Plus className="h-3.5 w-3.5" />{buttonLabel}</button></div></div>;
}

function OrdersPage({ onAdd }: { onAdd: () => void }) {
  return <><SectionHeading eyebrow="Operação" title="Ordens de serviço" description="Crie, distribua e acompanhe cada atendimento do início ao encerramento." action={<div className="hidden items-center gap-2 sm:flex"><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">Sincronizado há 2 min</span></div>} /><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><StatCard label="Total em aberto" value="24" detail="+5 desde ontem" icon={FileText} tone="bg-blue-50 text-blue-700" /><StatCard label="Em campo" value="08" detail="4 em deslocamento" icon={MapPin} tone="bg-orange-50 text-orange-700" /><StatCard label="Aguardando peça" value="03" detail="Requer atenção" icon={Boxes} tone="bg-amber-50 text-amber-700" /><StatCard label="Concluídas hoje" value="16" detail="94% dentro do SLA" icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" /></div><div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"><TableToolbar buttonLabel="Nova ordem" onAdd={onAdd} /><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.14em] text-slate-400"><th className="pb-3 pl-1 font-semibold">Ordem / cliente</th><th className="pb-3 font-semibold">Tipo de serviço</th><th className="pb-3 font-semibold">Responsável</th><th className="pb-3 font-semibold">Prioridade</th><th className="pb-3 font-semibold">Status</th><th className="pb-3 pr-1 text-right font-semibold">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{workOrders.map(order => <tr key={order.id} className="group text-sm"><td className="py-4 pl-1"><p className="font-semibold text-slate-800">{order.customer}</p><p className="mt-1 text-xs text-slate-400">{order.id} · {order.unit}</p></td><td className="py-4 text-xs text-slate-600">{order.type}</td><td className="py-4"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{order.tech.split(" ").map(x => x[0]).join("")}</span><span className="text-xs font-medium text-slate-600">{order.tech}</span></div></td><td className="py-4 text-xs"><span className={cx("font-semibold", order.priority === "Alta" ? "text-rose-600" : order.priority === "Média" ? "text-amber-600" : "text-slate-500")}>{order.priority}</span></td><td className="py-4"><StatusPill status={order.status} statusKey={order.statusKey} /></td><td className="py-4 pr-1 text-right"><button className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-50 hover:text-orange-600"><ChevronRight className="h-4 w-4" /></button></td></tr>)}</tbody></table></div></div></>;
}

function CalendarPage({ onAdd }: { onAdd: () => void }) {
  const days = ["Hoje · 31 ago", "Ter · 01 set", "Qua · 02 set", "Qui · 03 set"];
  const cards = [[{ time: "09:30", title: "FrioSul Distribuição", tech: "Marcos Lima", color: "blue" }, { time: "14:00", title: "Alimentos Paraná", tech: "João Vitor", color: "emerald" }], [{ time: "10:45", title: "Metalúrgica Aurora", tech: "Camila Rocha", color: "orange" }, { time: "15:30", title: "LogPark Curitiba", tech: "Rafael Alves", color: "violet" }], [{ time: "08:30", title: "Centro Logístico Norte", tech: "Equipe Updoors", color: "blue" }], [{ time: "11:00", title: "FrioSul Distribuição", tech: "Camila Rocha", color: "emerald" }]];
  return <><SectionHeading eyebrow="Planejamento" title="Agenda e despacho" description="Monte a melhor rota para cada equipe e antecipe conflitos de agenda." action={<button onClick={onAdd} className="hidden items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 sm:flex"><Route className="h-4 w-4" />Otimizar rotas</button>} /><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500"><ChevronRight className="h-4 w-4 rotate-180" /></button><button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500"><ChevronRight className="h-4 w-4" /></button><span className="ml-2 text-sm font-semibold text-slate-800">31 de agosto — 06 de setembro, 2026</span></div><div className="flex items-center gap-2 text-xs"><span className="flex items-center gap-1.5 text-slate-500"><i className="h-2 w-2 rounded-full bg-blue-500" />Equipe própria</span><span className="flex items-center gap-1.5 text-slate-500"><i className="h-2 w-2 rounded-full bg-orange-500" />Terceiros</span></div></div><div className="grid gap-3 lg:grid-cols-4">{days.map((day, index) => <div key={day} className={cx("min-h-[340px] rounded-2xl border bg-white p-3", index === 0 ? "border-orange-200 shadow-[0_8px_30px_rgba(243,111,33,0.09)]" : "border-slate-200/80")}><div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3"><div><p className={cx("text-xs font-bold", index === 0 ? "text-orange-600" : "text-slate-700")}>{day}</p><p className="mt-0.5 text-[10px] text-slate-400">{cards[index].length} atividades</p></div>{index === 0 && <span className="h-2 w-2 rounded-full bg-orange-500 ring-4 ring-orange-100" />}</div><div className="space-y-2">{cards[index].map(card => <div key={card.time + card.title} className={cx("rounded-xl border-l-4 bg-slate-50 p-3", card.color === "blue" ? "border-blue-500" : card.color === "orange" ? "border-orange-500" : card.color === "emerald" ? "border-emerald-500" : "border-violet-500")}><div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-500">{card.time}</span><span className="text-[10px] text-slate-400">45 min</span></div><p className="mt-2 truncate text-xs font-bold text-slate-700">{card.title}</p><p className="mt-1 truncate text-[10px] text-slate-400">{card.tech}</p></div>)}<button onClick={onAdd} className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 py-2.5 text-[10px] font-semibold text-slate-400 transition hover:border-orange-300 hover:text-orange-600"><Plus className="h-3 w-3" />Adicionar atividade</button></div></div>)}</div></>;
}

function CustomersPage({ onAdd }: { onAdd: () => void }) {
  return <><SectionHeading eyebrow="Relacionamento" title="Clientes e unidades" description="Tenha o histórico de ativos e atendimentos de cada operação." /><TableToolbar buttonLabel="Novo cliente" onAdd={onAdd} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{customers.map(customer => <div key={customer.name} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Factory className="h-5 w-5" /></div><span className={cx("rounded-full px-2 py-1 text-[10px] font-bold", customer.health === "Atenção" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>{customer.health}</span></div><h3 className="mt-4 text-sm font-bold text-slate-800">{customer.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" />{customer.city}</p><div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4"><div><p className="text-[10px] text-slate-400">Equipamentos</p><p className="mt-1 text-base font-bold text-slate-800">{customer.assets}</p></div><div><p className="text-[10px] text-slate-400">OS abertas</p><p className="mt-1 text-base font-bold text-orange-600">{customer.open}</p></div></div></div>)}</div></>;
}

function AssetsPage({ onAdd }: { onAdd: () => void }) {
  return <><SectionHeading eyebrow="Ativos e manutenção" title="Equipamentos" description="Controle o ciclo de vida das portas, componentes e abrigos de doca." /><div className="mb-5 flex flex-wrap gap-2"><button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-3.5 py-2.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Cadastrar equipamento</button><button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"><QrCode className="h-3.5 w-3.5" />Gerar QR Codes</button></div><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Ativos cadastrados" value="1.284" detail="+32 neste mês" icon={Boxes} tone="bg-blue-50 text-blue-700" /><StatCard label="Manutenções próximas" value="18" detail="Nos próximos 7 dias" icon={CalendarDays} tone="bg-amber-50 text-amber-700" /><StatCard label="Disponibilidade" value="98,4%" detail="Portas operacionais" icon={Zap} tone="bg-emerald-50 text-emerald-700" /></div><div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-base font-bold text-slate-950">Ativos monitorados</h2><button className="text-xs font-semibold text-orange-600">Exportar lista</button></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.14em] text-slate-400"><th className="pb-3 pl-1 font-semibold">Equipamento</th><th className="pb-3 font-semibold">Cliente</th><th className="pb-3 font-semibold">Modelo</th><th className="pb-3 font-semibold">Última manutenção</th><th className="pb-3 font-semibold">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">{assets.map(asset => <tr key={asset.code} className="text-sm"><td className="py-4 pl-1"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><QrCode className="h-4 w-4" /></div><div><p className="font-semibold text-slate-800">{asset.name}</p><p className="mt-0.5 text-xs text-slate-400">{asset.code}</p></div></div></td><td className="py-4 text-xs text-slate-600">{asset.customer}</td><td className="py-4 text-xs text-slate-600">{asset.model}</td><td className="py-4 text-xs text-slate-500">{asset.last}</td><td className="py-4"><span className={cx("rounded-full px-2.5 py-1 text-[11px] font-semibold", asset.state === "Operacional" ? "bg-emerald-50 text-emerald-700" : asset.state === "Manutenção" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700")}>{asset.state}</span></td></tr>)}</tbody></table></div></div></>;
}

function PeoplePage({ onAdd }: { onAdd: () => void }) {
  return <><SectionHeading eyebrow="Acessos e performance" title="Gestão de pessoas" description="Organize colaboradores, perfis de acesso, equipes e produtividade." action={<button onClick={onAdd} className="hidden items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 text-sm font-semibold text-white sm:flex"><Plus className="h-4 w-4" />Convidar pessoa</button>} /><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Pessoas cadastradas" value="46" detail="22 em campo" icon={UsersRound} tone="bg-blue-50 text-blue-700" /><StatCard label="Acessos ativos" value="41" detail="5 convites pendentes" icon={ShieldCheck} tone="bg-emerald-50 text-emerald-700" /><StatCard label="Produtividade média" value="87%" detail="+8 p.p. no trimestre" icon={Gauge} tone="bg-orange-50 text-orange-700" trend="up" /></div><div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-base font-bold text-slate-950">Pessoas e permissões</h2><button className="text-xs font-semibold text-orange-600">Gerenciar perfis</button></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.14em] text-slate-400"><th className="pb-3 pl-1 font-semibold">Pessoa</th><th className="pb-3 font-semibold">Área / perfil</th><th className="pb-3 font-semibold">Último acesso</th><th className="pb-3 font-semibold">Acesso</th><th className="pb-3 pr-1 text-right font-semibold">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{people.map(person => <tr key={person.name} className="text-sm"><td className="py-4 pl-1"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{person.name.split(" ").map(x => x[0]).join("")}</span><span className="font-semibold text-slate-800">{person.name}</span></div></td><td className="py-4"><p className="text-xs font-medium text-slate-600">{person.profile}</p><p className="mt-0.5 text-[11px] text-slate-400">{person.area}</p></td><td className="py-4 text-xs text-slate-500">{person.last}</td><td className="py-4"><span className={cx("rounded-full px-2.5 py-1 text-[11px] font-semibold", person.access === "Ativo" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{person.access}</span></td><td className="py-4 pr-1 text-right"><button className="rounded-lg p-2 text-slate-300 hover:bg-slate-50 hover:text-orange-600"><Settings2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div></div></>;
}

function ThirdPartiesPage({ onAdd }: { onAdd: () => void }) {
  return <><SectionHeading eyebrow="Rede autorizada" title="Terceiros e fornecedores" description="Acompanhe homologação, capacidade e cumprimento de SLA da rede parceira." action={<button onClick={onAdd} className="hidden items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 text-sm font-semibold text-white sm:flex"><Plus className="h-4 w-4" />Novo terceiro</button>} /><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Parceiros ativos" value="32" detail="4 em processo de homologação" icon={UserRoundCog} tone="bg-blue-50 text-blue-700" /><StatCard label="OS com terceiros" value="16" detail="67% dentro do prazo" icon={Route} tone="bg-orange-50 text-orange-700" /><StatCard label="SLA da rede" value="93%" detail="+2,4 p.p. no mês" icon={ShieldCheck} tone="bg-emerald-50 text-emerald-700" trend="up" /></div><div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-base font-bold text-slate-950">Rede de atendimento</h2><button className="text-xs font-semibold text-orange-600">Exportar avaliação</button></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.14em] text-slate-400"><th className="pb-3 pl-1 font-semibold">Empresa</th><th className="pb-3 font-semibold">Região</th><th className="pb-3 font-semibold">Responsável</th><th className="pb-3 font-semibold">OS abertas</th><th className="pb-3 font-semibold">SLA 30 dias</th><th className="pb-3 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{thirdParties.map(partner => <tr key={partner.name} className="text-sm"><td className="py-4 pl-1"><p className="font-semibold text-slate-800">{partner.name}</p><p className="mt-0.5 text-[11px] text-slate-400">Fornecedor credenciado</p></td><td className="py-4 text-xs text-slate-600">{partner.region}</td><td className="py-4 text-xs text-slate-600">{partner.contact}</td><td className="py-4 text-xs font-semibold text-slate-700">{partner.open}</td><td className="py-4 text-xs font-semibold text-emerald-700">{partner.sla}</td><td className="py-4"><span className={cx("rounded-full px-2.5 py-1 text-[11px] font-semibold", partner.status === "Homologado" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{partner.status}</span></td></tr>)}</tbody></table></div></div></>;
}

function StockPage({ onAdd }: { onAdd: () => void }) {
  const items = [{ name: "Sensor de segurança", sku: "SNS-004", available: 18, min: 10, unit: "un" }, { name: "Borracha de vedação 4m", sku: "VED-011", available: 6, min: 8, unit: "kit" }, { name: "Central de comando", sku: "CMD-020", available: 3, min: 4, unit: "un" }, { name: "Kit fotocélula", sku: "FOT-002", available: 26, min: 12, unit: "un" }];
  return <><SectionHeading eyebrow="Materiais" title="Estoque e peças" description="Saiba o que está disponível em cada base e no veículo das equipes." action={<button onClick={onAdd} className="hidden items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 text-sm font-semibold text-white sm:flex"><Plus className="h-4 w-4" />Lançar movimentação</button>} /><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Itens cadastrados" value="248" detail="Em 4 bases operacionais" icon={PackageCheck} tone="bg-blue-50 text-blue-700" /><StatCard label="Estoque baixo" value="03" detail="Reabastecer esta semana" icon={CircleAlert} tone="bg-amber-50 text-amber-700" /><StatCard label="Movimentações hoje" value="18" detail="12 saídas para OS" icon={Activity} tone="bg-emerald-50 text-emerald-700" /></div><div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"><h2 className="mb-4 font-display text-base font-bold text-slate-950">Posição de estoque</h2><div className="space-y-2">{items.map(item => <div key={item.sku} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><PackageCheck className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-700">{item.name}</p><p className="mt-0.5 text-[11px] text-slate-400">{item.sku} · {item.unit}</p></div><div className="w-32"><div className="mb-1 flex justify-between text-[10px]"><span className="text-slate-400">Disponível</span><span className={cx("font-bold", item.available < item.min ? "text-amber-600" : "text-slate-700")}>{item.available}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cx("h-full rounded-full", item.available < item.min ? "bg-amber-400" : "bg-emerald-500")} style={{ width: `${Math.min(100, item.available / (item.min * 1.5) * 100)}%` }} /></div></div><button className="rounded-lg p-2 text-slate-300 hover:bg-slate-50 hover:text-orange-600"><ChevronRight className="h-4 w-4" /></button></div>)}</div></div></>;
}

function ReportsPage() {
  return <><SectionHeading eyebrow="Inteligência operacional" title="Relatórios e indicadores" description="Decisões mais rápidas com dados confiáveis da operação." action={<button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 sm:flex"><FileText className="h-4 w-4" />Exportar relatório</button>} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StatCard label="Tempo médio em campo" value="2h18" detail="-14 min vs. mês anterior" icon={Clock3} tone="bg-blue-50 text-blue-700" trend="up" /><StatCard label="Primeiro atendimento" value="78%" detail="Meta: 80%" icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" /><StatCard label="Avaliação média" value="4,7 / 5" detail="186 respostas" icon={Sparkles} tone="bg-amber-50 text-amber-700" trend="up" /><StatCard label="Custo por OS" value="R$ 184" detail="-6,8% no trimestre" icon={ArrowDownRight} tone="bg-violet-50 text-violet-700" /></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6"><div className="mb-6 flex items-start justify-between"><div><h2 className="font-display text-base font-bold text-slate-950">Conclusão por tipo de serviço</h2><p className="mt-1 text-xs text-slate-400">Últimos 30 dias</p></div><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><Settings2 className="h-4 w-4" /></button></div>{[{ label: "Manutenção preventiva", value: 86, color: "bg-blue-500" }, { label: "Manutenção corretiva", value: 72, color: "bg-orange-500" }, { label: "Instalação", value: 64, color: "bg-emerald-500" }, { label: "Inspeção de segurança", value: 91, color: "bg-violet-500" }].map(row => <div key={row.label} className="mb-5 last:mb-0"><div className="mb-2 flex justify-between text-xs"><span className="font-medium text-slate-600">{row.label}</span><span className="font-bold text-slate-800">{row.value}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className={cx("h-full rounded-full", row.color)} style={{ width: `${row.value}%` }} /></div></div>)}</div><div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6"><div className="mb-6 flex items-start justify-between"><div><h2 className="font-display text-base font-bold text-slate-950">Demanda por região</h2><p className="mt-1 text-xs text-slate-400">Distribuição de OS no Paraná</p></div><span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">Este mês</span></div><div className="flex h-48 items-end gap-4 border-b border-slate-100 px-3">{[{ label: "CWB", value: 92 }, { label: "ARA", value: 68 }, { label: "SJP", value: 84 }, { label: "PIN", value: 56 }, { label: "COL", value: 41 }, { label: "OUT", value: 29 }].map((bar, i) => <div key={bar.label} className="flex flex-1 flex-col items-center gap-2"><span className="text-[10px] font-semibold text-slate-500">{bar.value}</span><div className={cx("w-full max-w-9 rounded-t-lg", i === 0 ? "bg-orange-500" : "bg-orange-100")} style={{ height: `${bar.value * 1.35}px` }} /><span className="text-[10px] font-medium text-slate-400">{bar.label}</span></div>)}</div></div></div></>;
}

function IntegrationsPage() {
  const [connected, setConnected] = useState(false);
  return <><SectionHeading eyebrow="Conectividade" title="Integrações" description="Centralize o fluxo da Inovadoor com suas ferramentas de trabalho." /><div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]"><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"><div className="flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f1ff] text-[#6155c7]"><Boxes className="h-6 w-6" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold text-slate-950">monday.com</h2><span className={cx("rounded-full px-2.5 py-1 text-[10px] font-bold", connected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{connected ? "Conectado" : "Configuração pendente"}</span></div><p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Sincronize clientes, ordens de serviço, prazos e status entre o monday.com e a operação de campo Inovadoor.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-3">{[{ icon: Cloud, label: "Clientes", value: "Bidirecional" }, { icon: FileText, label: "Ordens de serviço", value: "Em tempo real" }, { icon: Activity, label: "Status e SLA", value: "Automático" }].map(item => <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"><item.icon className="h-4 w-4 text-slate-500" /><p className="mt-3 text-xs font-semibold text-slate-700">{item.label}</p><p className="mt-1 text-[10px] text-emerald-600">{item.value}</p></div>)}</div><div className="mt-6 rounded-xl border border-dashed border-slate-200 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold text-slate-700">Chave de API do workspace</p><p className="mt-1 text-[11px] text-slate-400">A credencial fica protegida no servidor.</p></div><button onClick={() => setConnected(true)} className="rounded-xl bg-[#f36f21] px-3.5 py-2 text-xs font-semibold text-white">{connected ? "Configuração salva" : "Conectar workspace"}</button></div><div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-400"><span className="flex-1">••••••••••••••••••••••••••</span><Copy className="h-3.5 w-3.5" /></div></div></div><div className="rounded-2xl border border-slate-200/80 bg-[#0d1d2e] p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.13)] sm:p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300"><Link2 className="h-5 w-5" /></div><h2 className="mt-5 font-display text-lg font-bold">Fluxos preparados</h2><p className="mt-2 text-sm leading-6 text-slate-300">A camada de integração foi desenhada para receber webhooks, sincronização programada e mapeamento de campos.</p><div className="mt-6 space-y-3">{["Criar OS a partir de item no monday", "Enviar relatório após conclusão", "Atualizar SLA e responsável", "Registrar erros e reprocessamentos"].map((item, i) => <div key={item} className="flex items-center gap-2.5 text-xs text-slate-300"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">{i < 2 ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />}</span>{item}</div>)}</div><button className="mt-7 text-xs font-semibold text-orange-300">Ver documentação da API <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button></div></div></>;
}

function FieldPwa({ onExit }: { onExit: () => void }) {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  return <div className="mx-auto min-h-[calc(100vh-5rem)] max-w-md overflow-hidden rounded-[30px] border border-slate-200 bg-[#f4f7fb] shadow-[0_20px_60px_rgba(15,23,42,.12)]"><div className="bg-[#0d1d2e] px-5 pb-6 pt-5 text-white"><div className="flex items-center justify-between"><button onClick={onExit} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10"><PanelLeft className="h-5 w-5" /></button><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-[11px] font-semibold text-slate-300">Online</span></div><button className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10"><Bell className="h-4 w-4" /></button></div><div className="mt-7"><p className="text-xs text-slate-400">Segunda-feira, 31 de agosto</p><h1 className="mt-1 font-display text-2xl font-bold">Olá, Marcos.</h1><p className="mt-2 text-xs text-slate-300">Você tem 3 atividades para hoje.</p></div><div className="mt-5 flex gap-2"><div className="flex-1 rounded-xl bg-white/10 p-3"><p className="text-[10px] text-slate-400">Hoje</p><p className="mt-1 text-xl font-bold">03</p></div><div className="flex-1 rounded-xl bg-white/10 p-3"><p className="text-[10px] text-slate-400">Concluídas</p><p className="mt-1 text-xl font-bold">01</p></div><div className="flex-1 rounded-xl bg-orange-400/15 p-3"><p className="text-[10px] text-orange-200">Em aberto</p><p className="mt-1 text-xl font-bold text-orange-200">02</p></div></div></div><div className="space-y-4 p-4"><div className="flex items-center justify-between"><h2 className="font-display text-sm font-bold text-slate-800">Próxima atividade</h2><button className="text-xs font-semibold text-orange-600">Ver agenda</button></div><div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-700">OS-2026-0842</span><h3 className="mt-3 text-base font-bold text-slate-800">FrioSul Distribuição</h3><p className="mt-1 text-xs text-slate-500">Manutenção corretiva · Porta rápida</p></div><span className="text-xs font-bold text-slate-500">09:30</span></div><div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><MapPin className="h-4 w-4 text-orange-600" /><span className="flex-1">Rua Joinville, 1840 · Araucária</span><ChevronRight className="h-4 w-4 text-slate-300" /></div><div className="mt-4 grid grid-cols-2 gap-2"><button className="rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600">Abrir rota</button><button onClick={() => setStarted(true)} className={cx("rounded-xl py-2.5 text-xs font-semibold", started ? "bg-emerald-500 text-white" : "bg-[#f36f21] text-white")}>{started ? "Atendimento iniciado" : "Iniciar atendimento"}</button></div></div><h2 className="pt-2 font-display text-sm font-bold text-slate-800">Checklist de execução</h2><div className="space-y-2">{["Conferir identificação do equipamento", "Testar sensores de segurança", "Registrar evidências fotográficas", "Coletar assinatura do cliente"].map((item, i) => <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3"><span className={cx("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold", i < (started ? 2 : 1) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")}>{i < (started ? 2 : 1) ? <Check className="h-3.5 w-3.5" /> : i + 1}</span><span className="flex-1 text-xs font-medium text-slate-600">{item}</span><ChevronRight className="h-3.5 w-3.5 text-slate-300" /></div>)}</div>{started && <button onClick={() => setCompleted(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d1d2e] py-3 text-xs font-bold text-white">{completed ? <><CheckCircle2 className="h-4 w-4 text-emerald-300" />OS concluída com sucesso</> : <>Finalizar e enviar relatório <ArrowUpRight className="h-4 w-4" /></>}</button>}<div className="flex items-center justify-center gap-2 pt-2 text-[10px] text-slate-400"><Cloud className="h-3.5 w-3.5 text-emerald-500" />Dados sincronizados automaticamente</div></div></div>;
}

function LoginPanel({ role, setRole, onEnter }: { role: RoleKey; setRole: (role: RoleKey) => void; onEnter: () => void }) {
  return <div className="fixed inset-0 z-50 flex overflow-y-auto bg-[#081522]"><div className="hidden w-[46%] flex-col justify-between bg-[radial-gradient(circle_at_74%_25%,rgba(243,111,33,.26),transparent_34%),linear-gradient(145deg,#0b1e30,#07111d)] p-10 text-white lg:flex"><div><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/30"><Factory className="h-5 w-5" /></div><div><p className="font-display text-sm font-bold tracking-wide">INOVADOOR</p><p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Field Ops</p></div></div><div className="mt-28 max-w-lg"><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Operação conectada</p><h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight">Mais controle para cada porta que mantém o negócio em movimento.</h1><p className="mt-6 max-w-md text-sm leading-7 text-slate-300">Uma única plataforma para planejar, executar e comprovar serviços de manutenção e instalação em campo.</p></div></div><div className="flex items-center gap-6 text-xs text-slate-400"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" />Acessos por perfil</span><span className="flex items-center gap-2"><Cloud className="h-4 w-4 text-blue-300" />PWA offline-ready</span></div></div><div className="flex min-h-full flex-1 items-center justify-center bg-[#f8fafc] p-5 sm:p-10"><div className="w-full max-w-md"><div className="mb-8 flex items-center gap-3 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white"><Factory className="h-5 w-5" /></div><div><p className="font-display text-sm font-bold text-slate-900">INOVADOOR</p><p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Field Ops</p></div></div><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Bem-vindo de volta</p><h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">Acesse sua operação</h2><p className="mt-2 text-sm text-slate-500">Escolha o ambiente que deseja acessar.</p></div><div className="grid gap-2.5">{roles.map(item => <button key={item.key} onClick={() => setRole(item.key)} className={cx("flex items-center gap-3 rounded-2xl border p-3.5 text-left transition", role === item.key ? "border-orange-300 bg-orange-50/70 ring-2 ring-orange-100" : "border-slate-200 bg-white hover:border-slate-300")}><span className={cx("flex h-9 w-9 items-center justify-center rounded-xl", role === item.key ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500")}><item.icon className="h-4 w-4" /></span><span className="flex-1"><span className="block text-sm font-bold text-slate-800">{item.label}</span><span className="mt-0.5 block text-xs text-slate-400">{item.description}</span></span>{role === item.key && <CheckCircle2 className="h-4 w-4 text-orange-600" />}</button>)}</div><div className="mt-6 space-y-3"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">E-mail corporativo</span><input defaultValue="beatriz@inovadoor.com.br" className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Senha</span><input type="password" defaultValue="inovadoor" className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" /></label></div><button onClick={onEnter} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f36f21] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#dd5c12]">Entrar na plataforma <ArrowUpRight className="h-4 w-4" /></button><p className="mt-5 text-center text-xs text-slate-400">Ambiente demonstrativo · autenticação e permissões prontas para configuração</p></div></div></div>;
}

export default function Home() {
  const [activeRole, setActiveRole] = useState<RoleKey>("gestao");
  const [activeSection, setActiveSection] = useState<SectionKey>("visao");
  const [showLogin, setShowLogin] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<SectionKey | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const currentNav = useMemo(() => navItems.find(item => item.key === activeSection) ?? navItems[0], [activeSection]);
  const roleLabel = roles.find(item => item.key === activeRole)?.label ?? "Gestão Inovadoor";

  const navigate = (section: SectionKey) => {
    setActiveSection(section);
    setMobileNavOpen(false);
  };

  const handleAdd = () => {
    setModal(activeSection);
    setToast("Formulário de cadastro aberto para configuração do fluxo.");
  };

  if (showLogin) return <LoginPanel role={activeRole} setRole={setActiveRole} onEnter={() => { setShowLogin(false); setActiveSection(activeRole === "campo" ? "visao" : activeRole === "pessoas" ? "pessoas" : activeRole === "terceiros" ? "terceiros" : "visao"); setToast(`Acesso iniciado: ${roles.find(r => r.key === activeRole)?.label}`); }} />;
  if (activeRole === "campo") return <FieldPwa onExit={() => setShowLogin(true)} />;

  const renderSection = () => {
    switch (activeSection) {
      case "visao": return <Dashboard onNavigate={navigate} />;
      case "ordens": return <OrdersPage onAdd={handleAdd} />;
      case "agenda": return <CalendarPage onAdd={handleAdd} />;
      case "clientes": return <CustomersPage onAdd={handleAdd} />;
      case "equipamentos": return <AssetsPage onAdd={handleAdd} />;
      case "pessoas": return <PeoplePage onAdd={handleAdd} />;
      case "terceiros": return <ThirdPartiesPage onAdd={handleAdd} />;
      case "estoque": return <StockPage onAdd={handleAdd} />;
      case "relatorios": return <ReportsPage />;
      case "integracoes": return <IntegrationsPage />;
    }
  };

  return <div className="min-h-screen bg-[#f5f7fb] text-slate-900"><div className="flex min-h-screen"><aside className={cx("fixed inset-y-0 left-0 z-40 w-[272px] border-r border-white/10 bg-[#0d1d2e] text-white transition-transform lg:static lg:translate-x-0", mobileNavOpen ? "translate-x-0" : "-translate-x-full")}><div className="flex h-full flex-col"><div className="flex h-[78px] items-center justify-between border-b border-white/10 px-6"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/20"><Factory className="h-[18px] w-[18px]" /></div><div><p className="font-display text-sm font-bold tracking-wide">INOVADOOR</p><p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Field Ops</p></div></div><button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 lg:hidden"><X className="h-5 w-5" /></button></div><div className="border-b border-white/10 px-4 py-4"><button onClick={() => setShowLogin(true)} className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left transition hover:bg-white/10"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-400/15 text-xs font-bold text-orange-300">BI</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-white">{roleLabel}</span><span className="mt-0.5 block text-[10px] text-slate-400">Workspace Paraná</span></span><ChevronDown className="h-3.5 w-3.5 text-slate-400" /></button></div><nav className="flex-1 overflow-y-auto px-3 py-5"><p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Operação</p><div className="space-y-1">{navItems.slice(0, 5).map(item => <button key={item.key} onClick={() => navigate(item.key)} className={cx("group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition", activeSection === item.key ? "bg-orange-500 text-white shadow-lg shadow-orange-500/15" : "text-slate-400 hover:bg-white/5 hover:text-white")}><item.icon className={cx("h-4 w-4", activeSection === item.key ? "text-orange-100" : "text-slate-500 group-hover:text-slate-300")} /><span className="flex-1">{item.label}</span>{item.badge && <span className={cx("rounded-full px-1.5 py-0.5 text-[9px] font-bold", activeSection === item.key ? "bg-white/20 text-white" : "bg-white/10 text-slate-400")}>{item.badge}</span>}</button>)}</div><p className="mb-3 mt-8 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Recursos</p><div className="space-y-1">{navItems.slice(5, 10).map(item => <button key={item.key} onClick={() => navigate(item.key)} className={cx("group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition", activeSection === item.key ? "bg-orange-500 text-white shadow-lg shadow-orange-500/15" : "text-slate-400 hover:bg-white/5 hover:text-white")}><item.icon className={cx("h-4 w-4", activeSection === item.key ? "text-orange-100" : "text-slate-500 group-hover:text-slate-300")} /><span className="flex-1">{item.label}</span>{item.badge && <span className={cx("rounded-full px-1.5 py-0.5 text-[9px] font-bold", activeSection === item.key ? "bg-white/20 text-white" : "bg-white/10 text-slate-400")}>{item.badge}</span>}</button>)}</div></nav><div className="border-t border-white/10 p-4"><div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-400/5 px-3 py-2.5"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.1)]" /><span className="text-[10px] font-medium text-emerald-200">Todos os serviços operacionais</span></div><button onClick={() => setShowLogin(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" />Trocar perfil</button></div></div></aside>{mobileNavOpen && <button aria-label="Fechar menu" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" />}<main className="min-w-0 flex-1"><header className="sticky top-0 z-20 flex h-[78px] items-center justify-between border-b border-slate-200/80 bg-[#f5f7fb]/90 px-4 backdrop-blur sm:px-7 lg:px-9"><div className="flex items-center gap-3"><button onClick={() => setMobileNavOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 lg:hidden"><Menu className="h-4 w-4" /></button><div><div className="flex items-center gap-2 text-xs text-slate-400"><span>Workspace Paraná</span><ChevronRight className="h-3 w-3" /><span className="font-semibold text-slate-600">{currentNav.label}</span></div><p className="mt-1 hidden text-[11px] text-slate-400 sm:block">Atualizado em tempo real · última sincronização há 2 minutos</p></div></div><div className="flex items-center gap-2 sm:gap-4"><button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-orange-600"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500 ring-2 ring-white" /></button><div className="hidden h-7 w-px bg-slate-200 sm:block" /><button onClick={() => setShowLogin(true)} className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2 transition hover:bg-white"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d1d2e] text-[10px] font-bold text-orange-300">BI</span><span className="hidden text-left sm:block"><span className="block text-xs font-bold text-slate-700">Beatriz Inovadoor</span><span className="block text-[10px] text-slate-400">Administradora</span></span><ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" /></button></div></header><div className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9">{renderSection()}</div></main></div>{modal && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">Novo registro</p><h2 className="mt-1 font-display text-xl font-bold text-slate-950">Configurar {modal === "ordens" ? "ordem de serviço" : modal === "equipamentos" ? "equipamento" : modal === "terceiros" ? "terceiro" : modal === "pessoas" ? "pessoa" : "cadastro"}</h2><p className="mt-1 text-xs text-slate-500">Este formulário já está preparado para receber o fluxo real do backoffice.</p></div><button onClick={() => setModal(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Nome / identificação</span><input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="Digite uma identificação" /></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Responsável</span><select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-orange-400"><option>Selecionar pessoa</option><option>Marcos Lima</option><option>Camila Rocha</option></select></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Prioridade</span><select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-orange-400"><option>Média</option><option>Alta</option><option>Baixa</option></select></label></div><div className="mt-6 flex justify-end gap-2"><button onClick={() => setModal(null)} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancelar</button><button onClick={() => { setModal(null); setToast("Registro salvo no ambiente demonstrativo."); }} className="rounded-xl bg-[#f36f21] px-4 py-2.5 text-xs font-semibold text-white">Salvar registro</button></div></div></div>}{toast && <div className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-3 rounded-2xl bg-[#0d1d2e] px-4 py-3 text-xs font-semibold text-white shadow-2xl"><CheckCircle2 className="h-4 w-4 text-emerald-300" />{toast}</div>}</div>;
}
