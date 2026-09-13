import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Boxes,
  Camera,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Cloud,
  Copy,
  Factory,
  FileCheck2,
  FilePlus2,
  FileText,
  Gauge,
  HardHat,
  LayoutDashboard,
  Link2,
  LogOut,
  LocateFixed,
  MapPin,
  Menu,
  PackageCheck,
  PanelLeft,
  PenLine,
  Plus,
  QrCode,
  Route,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  UserRoundCog,
  UsersRound,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

type RoleKey = "gestao" | "terceiros" | "pessoas" | "campo" | "cliente";
type SectionKey =
  | "visao"
  | "ordens"
  | "agenda"
  | "planejamento"
  | "assistencia"
  | "clientes"
  | "equipamentos"
  | "formularios"
  | "pessoas"
  | "terceiros"
  | "estoque"
  | "relatorios"
  | "integracoes";
type ModalKey =
  | "customer"
  | "equipmentStandard"
  | "equipmentInstall"
  | "thirdParty"
  | "workOrder"
  | "ticket"
  | "link"
  | "form"
  | "customForm"
  | null;

type Customer = {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  contact: string;
  assets: number;
  open: number;
};
type Equipment = {
  id: string;
  code: string;
  name: string;
  model: string;
  customerId: string;
  standardId?: string;
  serialNumber?: string;
  installationLocation?: string;
  state: "Operacional" | "Manutenção" | "Atenção";
  lastMaintenance: string;
};
type ThirdParty = {
  id: string;
  name: string;
  region: string;
  contact: string;
  open: number;
  sla: number;
  status: "Homologado" | "Em revisão" | "Bloqueado";
};
type Person = {
  id: string;
  name: string;
  area: string;
  profile: string;
  last: string;
  access: "Ativo" | "Pendente";
};
type WorkOrder = {
  id: string;
  customerId: string;
  equipmentId: string;
  title: string;
  type: string;
  responsible: string;
  thirdPartyId: string;
  formId: string;
  status: string;
  statusKey: string;
  priority: "Alta" | "Média" | "Baixa";
  scheduled: string;
  source: "gestao" | "cliente";
};
type ServiceForm = {
  id: string;
  name: string;
  category: "Atendimento" | "Instalação";
  description: string;
  fields: string[];
  used: number;
  updated: string;
};
type EquipmentStandard = {
  id: string;
  code: string;
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  description: string;
};
type CustomField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "checkbox";
  required: boolean;
  options?: string[];
  condition?: { fieldKey: string; equals: string };
};
type CustomFormDefinition = {
  id: string;
  entityType:
    | "customer"
    | "equipmentStandard"
    | "equipmentInstall"
    | "thirdParty"
    | "person"
    | "workOrder"
    | "ticket";
  name: string;
  description: string;
  fields: CustomField[];
};
type Ticket = {
  id: string;
  customerId: string;
  equipmentId: string;
  title: string;
  description: string;
  priority: "Alta" | "Média" | "Baixa";
  status: "Novo" | "Em triagem" | "Convertido em OS";
  created: string;
};
type EvidencePayload = {
  type: "foto" | "assinatura";
  fileName: string;
  mimeType: string;
  dataUrl: string;
  latitude?: string;
  longitude?: string;
};
type PhotoEvidence = {
  id: string;
  name: string;
  dataUrl: string;
  status: "enviando" | "enviada" | "offline";
};

type DemoStore = {
  customers: Customer[];
  equipmentStandards: EquipmentStandard[];
  customForms: CustomFormDefinition[];
  equipment: Equipment[];
  thirdParties: ThirdParty[];
  people: Person[];
  workOrders: WorkOrder[];
  forms: ServiceForm[];
  tickets: Ticket[];
};

type NavItem = {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  badge?: string;
};
type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  tone: "orange" | "blue" | "green";
  read: boolean;
};
type MondayColumnMap = {
  status: string;
  quantity: string;
  customer: string;
  equipment: string;
  workOrder: string;
  completed: string;
  photos: string;
  videos: string;
};

const navItems: NavItem[] = [
  { key: "visao", label: "Visão geral", icon: LayoutDashboard },
  { key: "ordens", label: "Ordens de serviço", icon: FileText, badge: "24" },
  { key: "agenda", label: "Agenda e despacho", icon: CalendarDays },
  { key: "planejamento", label: "Planejamento de instalação", icon: Route },
  { key: "assistencia", label: "Assistência técnica", icon: Ticket },
  { key: "clientes", label: "Clientes", icon: Factory },
  { key: "equipamentos", label: "Equipamentos", icon: Wrench },
  { key: "formularios", label: "Formulários", icon: ClipboardList, badge: "2" },
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
  {
    key: "gestao",
    label: "Gestão Inovadoor",
    description: "Operação, OS e indicadores",
    icon: LayoutDashboard,
  },
  {
    key: "terceiros",
    label: "Painel de terceiros",
    description: "Empresas parceiras e SLA",
    icon: UserRoundCog,
  },
  {
    key: "pessoas",
    label: "Gestão de pessoas",
    description: "Times, acessos e desempenho",
    icon: UsersRound,
  },
  {
    key: "campo",
    label: "Equipe de campo",
    description: "PWA para executar serviços",
    icon: HardHat,
  },
  {
    key: "cliente",
    label: "Portal do cliente",
    description: "Abrir e acompanhar chamados",
    icon: Ticket,
  },
];

const seedStore: DemoStore = {
  customers: [
    {
      id: "cli-1",
      name: "FrioSul Distribuição",
      city: "São José dos Pinhais",
      state: "PR",
      address: "Rua Joinville, 1840",
      contact: "Patrícia Gomes · (41) 99921-4410",
      assets: 12,
      open: 2,
    },
    {
      id: "cli-2",
      name: "Metalúrgica Aurora",
      city: "Araucária",
      state: "PR",
      address: "Av. das Indústrias, 720",
      contact: "André Oliveira · (41) 99810-2270",
      assets: 8,
      open: 1,
    },
    {
      id: "cli-3",
      name: "LogPark Curitiba",
      city: "Curitiba",
      state: "PR",
      address: "Rod. Contorno Sul, 5100",
      contact: "Bianca Lopes · (41) 99770-1190",
      assets: 24,
      open: 3,
    },
    {
      id: "cli-4",
      name: "Alimentos Paraná",
      city: "Pinhais",
      state: "PR",
      address: "Rua do Expeditor, 90",
      contact: "Carlos Mendes · (41) 99680-5541",
      assets: 6,
      open: 0,
    },
  ],
  equipmentStandards: [
    {
      id: "std-porta-rapida",
      code: "PAD-PORTA-RAPIDA",
      name: "Porta rápida",
      category: "Porta industrial",
      manufacturer: "Inovadoor",
      model: "Inova Speed 400",
      description: "Porta rápida para alto fluxo de docas e áreas industriais.",
    },
    {
      id: "std-porta-seccional",
      code: "PAD-PORTA-SECCIONAL",
      name: "Porta seccional",
      category: "Porta industrial",
      manufacturer: "Inovadoor",
      model: "Inova Seccional",
      description: "Porta seccional para fechamento e isolamento de galpões.",
    },
    {
      id: "std-abrigo-doca",
      code: "PAD-ABRIGO-DOCA",
      name: "Abrigo de doca",
      category: "Doca",
      manufacturer: "Inovadoor",
      model: "Inova Dock",
      description:
        "Abrigo de doca para proteção da operação de carga e descarga.",
    },
  ],
  customForms: [
    {
      id: "custom-customer",
      entityType: "customer",
      name: "Dados comerciais do cliente",
      description: "Campos adicionais para qualificação e relacionamento.",
      fields: [
        {
          key: "segmento",
          label: "Segmento do cliente",
          type: "select",
          required: false,
          options: ["Alimentos", "Logística", "Indústria", "Varejo"],
        },
        {
          key: "contrato",
          label: "Número do contrato",
          type: "text",
          required: false,
        },
      ],
    },
    {
      id: "custom-equipmentInstall",
      entityType: "equipmentInstall",
      name: "Dados de comissionamento",
      description: "Informações específicas da instalação da porta.",
      fields: [
        {
          key: "alturaVao",
          label: "Altura do vão (mm)",
          type: "number",
          required: false,
        },
        {
          key: "ambiente",
          label: "Ambiente de instalação",
          type: "select",
          required: true,
          options: ["Câmara fria", "Expedição", "Doca", "Produção"],
        },
      ],
    },
    {
      id: "custom-thirdParty",
      entityType: "thirdParty",
      name: "Homologação do parceiro",
      description: "Informações complementares de homologação.",
      fields: [
        {
          key: "certificacao",
          label: "Certificação vigente",
          type: "text",
          required: false,
        },
        {
          key: "validade",
          label: "Validade da homologação",
          type: "date",
          required: false,
        },
      ],
    },
    {
      id: "custom-workOrder",
      entityType: "workOrder",
      name: "Encerramento técnico",
      description: "Campos obrigatórios antes de concluir a ordem de serviço.",
      fields: [
        {
          key: "causaRaiz",
          label: "Causa raiz",
          type: "textarea",
          required: true,
        },
        {
          key: "pecasAplicadas",
          label: "Peças aplicadas",
          type: "text",
          required: true,
        },
      ],
    },
  ],
  equipment: [
    {
      id: "eq-1",
      code: "EQP-00921",
      name: "Porta rápida — Docas 04",
      model: "Inova Speed 400",
      customerId: "cli-1",
      state: "Operacional",
      lastMaintenance: "28 ago 2026",
    },
    {
      id: "eq-2",
      code: "EQP-00876",
      name: "Porta seccional — Galpão B",
      model: "Inova Seccional",
      customerId: "cli-2",
      state: "Manutenção",
      lastMaintenance: "21 ago 2026",
    },
    {
      id: "eq-3",
      code: "EQP-00714",
      name: "Abrigo de doca — Expedição",
      model: "Inova Dock",
      customerId: "cli-3",
      state: "Operacional",
      lastMaintenance: "16 ago 2026",
    },
    {
      id: "eq-4",
      code: "EQP-00689",
      name: "Porta rápida — Câmara fria",
      model: "Inova Flex",
      customerId: "cli-4",
      state: "Atenção",
      lastMaintenance: "02 ago 2026",
    },
  ],
  thirdParties: [
    {
      id: "tp-1",
      name: "Updoors Assistência",
      region: "Sul",
      contact: "Eduardo Martins",
      open: 7,
      sla: 94,
      status: "Homologado",
    },
    {
      id: "tp-2",
      name: "Portas & Cia Técnica",
      region: "Sudeste",
      contact: "Ana Paula",
      open: 4,
      sla: 88,
      status: "Em revisão",
    },
    {
      id: "tp-3",
      name: "Manutec Industrial",
      region: "Centro-Oeste",
      contact: "Ricardo Souza",
      open: 3,
      sla: 97,
      status: "Homologado",
    },
    {
      id: "tp-4",
      name: "Técnica Norte",
      region: "Norte",
      contact: "Juliana Costa",
      open: 2,
      sla: 91,
      status: "Homologado",
    },
  ],
  people: [
    {
      id: "p-1",
      name: "Marcos Lima",
      area: "Operações de campo",
      profile: "Técnico sênior",
      last: "Online agora",
      access: "Ativo",
    },
    {
      id: "p-2",
      name: "Camila Rocha",
      area: "Operações de campo",
      profile: "Técnica de campo",
      last: "Há 4 min",
      access: "Ativo",
    },
    {
      id: "p-3",
      name: "Beatriz Nogueira",
      area: "Gestão",
      profile: "Coordenadora",
      last: "Há 18 min",
      access: "Ativo",
    },
    {
      id: "p-4",
      name: "Rafael Alves",
      area: "Terceiros",
      profile: "Técnico parceiro",
      last: "Ontem",
      access: "Pendente",
    },
  ],
  workOrders: [
    {
      id: "OS-2026-0842",
      customerId: "cli-1",
      equipmentId: "eq-1",
      title: "Falha no sensor de segurança",
      type: "Manutenção corretiva",
      responsible: "Marcos Lima",
      thirdPartyId: "",
      formId: "form-atendimento",
      status: "Em campo",
      statusKey: "progress",
      priority: "Alta",
      scheduled: "Hoje · 09:30",
      source: "gestao",
    },
    {
      id: "OS-2026-0841",
      customerId: "cli-2",
      equipmentId: "eq-2",
      title: "Revisão preventiva",
      type: "Preventiva — Porta seccional",
      responsible: "Camila Rocha",
      thirdPartyId: "",
      formId: "form-atendimento",
      status: "Agendada",
      statusKey: "scheduled",
      priority: "Média",
      scheduled: "Hoje · 10:45",
      source: "gestao",
    },
    {
      id: "OS-2026-0839",
      customerId: "cli-3",
      equipmentId: "eq-3",
      title: "Montagem do abrigo",
      type: "Instalação — Abrigo de doca",
      responsible: "Rafael Alves",
      thirdPartyId: "tp-1",
      formId: "form-instalacao",
      status: "Aguardando peça",
      statusKey: "waiting",
      priority: "Alta",
      scheduled: "Hoje · 13:00",
      source: "gestao",
    },
    {
      id: "OS-2026-0836",
      customerId: "cli-4",
      equipmentId: "eq-4",
      title: "Inspeção de segurança",
      type: "Inspeção de segurança",
      responsible: "João Vitor",
      thirdPartyId: "",
      formId: "form-atendimento",
      status: "Concluída",
      statusKey: "done",
      priority: "Baixa",
      scheduled: "Ontem",
      source: "gestao",
    },
  ],
  forms: [
    {
      id: "form-atendimento",
      name: "Atendimento técnico",
      category: "Atendimento",
      description:
        "Checklist padrão para diagnóstico, execução e encerramento de manutenção.",
      fields: [
        "Identificação do equipamento",
        "Diagnóstico da falha",
        "Peças utilizadas",
        "Fotos do serviço",
        "Assinatura do cliente",
      ],
      used: 86,
      updated: "Hoje, 09:12",
    },
    {
      id: "form-instalacao",
      name: "Instalação de porta industrial",
      category: "Instalação",
      description:
        "Roteiro de instalação, comissionamento e aceite da nova porta.",
      fields: [
        "Conferência do local",
        "Fixação e nivelamento",
        "Teste de abertura",
        "Fotos da instalação",
        "Termo de aceite",
      ],
      used: 32,
      updated: "28 ago 2026",
    },
    {
      id: "form-inspecao",
      name: "Inspeção de segurança",
      category: "Atendimento",
      description: "Verificação preventiva dos itens críticos de segurança.",
      fields: [
        "Sensores",
        "Fotocélulas",
        "Botoeiras",
        "Sinalização",
        "Recomendação técnica",
      ],
      used: 41,
      updated: "22 ago 2026",
    },
  ],
  tickets: [],
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function StatusPill({
  status,
  statusKey,
}: {
  status: string;
  statusKey?: string;
}) {
  const styles: Record<string, string> = {
    progress: "bg-blue-50 text-blue-700 ring-blue-200",
    scheduled: "bg-slate-50 text-slate-600 ring-slate-200",
    waiting: "bg-amber-50 text-amber-700 ring-amber-200",
    done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    approval: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        styles[statusKey ?? ""] ?? "bg-slate-50 text-slate-600 ring-slate-200"
      )}
    >
      {status}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(15,23,42,0.08)] sm:p-5">
      <div className="flex items-start justify-between">
        <div
          className={cx(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            tone
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        {trend && (
          <span
            className={cx(
              "flex items-center gap-0.5 text-[11px] font-semibold",
              trend === "up" ? "text-emerald-600" : "text-rose-600"
            )}
          >
            <ArrowUpRight
              className={cx("h-3.5 w-3.5", trend === "down" && "rotate-90")}
            />
            {trend === "up" ? "12,5%" : "3,1%"}
          </span>
        )}
      </div>
      <p className="mt-4 text-[12px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </div>
  );
}

function MiniMap() {
  return (
    <div className="relative h-[294px] overflow-hidden rounded-2xl bg-[#dce9e8] [background-image:linear-gradient(30deg,rgba(255,255,255,.55)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.55)_87.5%,rgba(255,255,255,.55)),linear-gradient(150deg,rgba(255,255,255,.55)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.55)_87.5%,rgba(255,255,255,.55)),linear-gradient(60deg,rgba(131,173,168,.3)_25%,transparent_25.5%,transparent_75%,rgba(131,173,168,.3)_75%)] [background-size:40px_70px]">
      <div className="absolute inset-x-0 top-[34%] h-7 -rotate-6 bg-[#f9e3ae]/70" />
      <div className="absolute inset-y-0 left-[43%] w-6 rotate-[23deg] bg-[#b9d6cf]/80" />
      <div className="absolute left-[36%] top-[23%] h-3 w-3 rounded-full bg-orange-500 ring-4 ring-orange-200/70 shadow-lg" />
      <div className="absolute left-[63%] top-[46%] h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-200/70 shadow-lg" />
      <div className="absolute left-[29%] bottom-[24%] h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-200/70 shadow-lg" />
      <div className="absolute right-[22%] top-[23%] h-3 w-3 rounded-full bg-violet-600 ring-4 ring-violet-200/70 shadow-lg" />
      <div className="absolute left-[29%] top-[13%] rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
        São José dos Pinhais
      </div>
      <div className="absolute right-[16%] top-[41%] rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
        Curitiba
      </div>
      <div className="absolute bottom-[12%] left-[21%] rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
        Araucária
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-white/85 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur">
        <MapPin className="h-3 w-3 text-orange-600" />4 técnicos ativos
      </div>
      <div className="absolute right-3 top-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm">
        Tempo real · 10:24
      </div>
    </div>
  );
}

function Dashboard({
  store,
  onNavigate,
  onNewTicket,
}: {
  store: DemoStore;
  onNavigate: (section: SectionKey) => void;
  onNewTicket: () => void;
}) {
  const open = store.workOrders.filter(
    order => !["Concluída", "Cancelada"].includes(order.status)
  ).length;
  const inField = store.workOrders.filter(
    order => order.status === "Em campo"
  ).length;
  const critical = store.workOrders.filter(
    order => order.priority === "Alta" && order.status !== "Concluída"
  ).length;
  const clientTickets = store.tickets.filter(
    ticket => ticket.status !== "Convertido em OS"
  ).length;
  return (
    <>
      <SectionHeading
        eyebrow="Operação · segunda-feira"
        title="Bom dia, Beatriz"
        description="Acompanhe a operação de portas industriais em tempo real."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={onNewTicket}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 sm:flex"
            >
              <Ticket className="h-3.5 w-3.5" />
              Abrir chamado
            </button>
            <button
              onClick={() => onNavigate("ordens")}
              className="flex items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#dd5c12]"
            >
              <Plus className="h-4 w-4" />
              Nova ordem
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="OS em andamento"
          value={String(open)}
          detail={`${inField} em campo agora`}
          icon={FileCheck2}
          tone="bg-blue-50 text-blue-700"
          trend="up"
        />
        <StatCard
          label="Técnicos ativos"
          value="18 / 22"
          detail="4 disponíveis para despacho"
          icon={UsersRound}
          tone="bg-emerald-50 text-emerald-700"
          trend="up"
        />
        <StatCard
          label="SLA no prazo"
          value="92%"
          detail="+4,6 p.p. vs. semana anterior"
          icon={Clock3}
          tone="bg-amber-50 text-amber-700"
          trend="up"
        />
        <StatCard
          label="Atenções críticas"
          value={String(Math.max(3, critical))}
          detail={`${clientTickets} chamados de clientes na triagem`}
          icon={CircleAlert}
          tone="bg-rose-50 text-rose-700"
          trend="down"
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(350px,.8fr)]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-950">
                Fluxo de ordens de serviço
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Distribuição da operação nas últimas 24 horas
              </p>
            </div>
            <button
              onClick={() => onNavigate("relatorios")}
              className="text-xs font-semibold text-orange-600"
            >
              Ver relatório <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex h-44 items-end gap-2 border-b border-slate-100 pb-0 sm:gap-3">
            {[
              42, 56, 38, 76, 65, 88, 72, 58, 92, 75, 84, 68, 97, 81, 74, 89,
              66, 78,
            ].map((height, index) => (
              <div
                key={index}
                className="group flex flex-1 flex-col items-center justify-end gap-2"
              >
                <div
                  className={cx(
                    "w-full max-w-[24px] rounded-t-md transition group-hover:opacity-80",
                    index > 14 ? "bg-orange-500" : "bg-blue-100"
                  )}
                  style={{
                    height: `${height * 0.78}px`,
                    minHeight: `${height * 0.78}px`,
                  }}
                />
                <span className="text-[9px] text-slate-300">
                  {index % 3 === 0 ? `${8 + index}:00` : ""}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-blue-100" />
              Ordens abertas
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-orange-500" />
              Em execução
            </span>
            <span className="ml-auto font-semibold text-slate-700">
              128 atividades este mês
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-950">
                Equipe em campo
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Localização atual dos atendimentos
              </p>
            </div>
            <button
              onClick={() => onNavigate("agenda")}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-orange-600"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <MiniMap />
        </div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(350px,.8fr)]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-950">
                Próximas atividades
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                OS prioritárias e solicitações convertidas em atendimento
              </p>
            </div>
            <button
              onClick={() => onNavigate("ordens")}
              className="text-xs font-semibold text-orange-600"
            >
              Ver todas <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {store.workOrders.slice(0, 4).map(order => (
              <div
                key={order.id}
                className="flex items-center gap-3 py-3 first:pt-1"
              >
                <div
                  className={cx(
                    "hidden h-9 w-9 items-center justify-center rounded-xl sm:flex",
                    order.statusKey === "progress"
                      ? "bg-blue-50 text-blue-600"
                      : order.statusKey === "waiting"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-slate-50 text-slate-500"
                  )}
                >
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {store.customers.find(c => c.id === order.customerId)?.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {order.id} · {order.type}
                    {order.source === "cliente" ? " · Portal do cliente" : ""}
                  </p>
                </div>
                <div className="hidden text-right md:block">
                  <p className="text-xs font-medium text-slate-600">
                    {order.responsible}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {order.scheduled}
                  </p>
                </div>
                <StatusPill status={order.status} statusKey={order.statusKey} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-[#0d1d2e] p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.15)] sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Field insights
              </span>
              <h2 className="mt-4 font-display text-lg font-bold">
                A operação está 8% mais ágil
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                Os chamados feitos pelo cliente já entram na mesma fila de
                triagem da equipe Inovadoor.
              </p>
            </div>
            <Activity className="h-5 w-5 text-orange-300" />
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] text-slate-400">Primeiro atendimento</p>
              <p className="mt-1 text-xl font-bold">78%</p>
              <p className="mt-1 text-[10px] text-emerald-300">+6,2 p.p.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] text-slate-400">Formulários</p>
              <p className="mt-1 text-xl font-bold">03</p>
              <p className="mt-1 text-[10px] text-emerald-300">
                Atendimento + instalação
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("relatorios")}
            className="mt-5 flex items-center gap-2 text-xs font-semibold text-orange-300 hover:text-orange-200"
          >
            Explorar indicadores <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

function TableToolbar({
  buttonLabel,
  onAdd,
  searchPlaceholder = "Buscar por nome ou código",
}: {
  buttonLabel: string;
  onAdd: () => void;
  searchPlaceholder?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:max-w-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          placeholder={searchPlaceholder}
        />
      </div>
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
        </button>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/15 transition hover:bg-[#dd5c12]"
        >
          <Plus className="h-3.5 w-3.5" />
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

function OrdersPage({ store, onAdd }: { store: DemoStore; onAdd: () => void }) {
  return (
    <>
      <SectionHeading
        eyebrow="Operação"
        title="Ordens de serviço"
        description="Solicitações de cliente, manutenção e instalação em uma única fila."
        action={
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
              Sincronizado há 2 min
            </span>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total em aberto"
          value={String(
            store.workOrders.filter(o => o.status !== "Concluída").length
          )}
          detail="Solicitações em acompanhamento"
          icon={FileText}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Em campo"
          value={String(
            store.workOrders.filter(o => o.status === "Em campo").length
          ).padStart(2, "0")}
          detail="Atendimentos em execução"
          icon={MapPin}
          tone="bg-orange-50 text-orange-700"
        />
        <StatCard
          label="Aguardando peça"
          value={String(
            store.workOrders.filter(o => o.status === "Aguardando peça").length
          ).padStart(2, "0")}
          detail="Requer atenção"
          icon={Boxes}
          tone="bg-amber-50 text-amber-700"
        />
        <StatCard
          label="Chamados de clientes"
          value={String(store.tickets.length).padStart(2, "0")}
          detail="Abertos pelo portal"
          icon={Ticket}
          tone="bg-violet-50 text-violet-700"
        />
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
        <TableToolbar buttonLabel="Nova ordem" onAdd={onAdd} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <th className="pb-3 pl-1 font-semibold">Ordem / cliente</th>
                <th className="pb-3 font-semibold">Tipo / formulário</th>
                <th className="pb-3 font-semibold">Responsável</th>
                <th className="pb-3 font-semibold">Prioridade</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 pr-1 text-right font-semibold">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.workOrders.map(order => (
                <tr key={order.id} className="group text-sm">
                  <td className="py-4 pl-1">
                    <p className="font-semibold text-slate-800">
                      {
                        store.customers.find(c => c.id === order.customerId)
                          ?.name
                      }
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {order.id} · {order.scheduled}
                    </p>
                  </td>
                  <td className="py-4">
                    <p className="text-xs font-medium text-slate-600">
                      {order.type}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                      <ClipboardCheck className="h-3 w-3" />
                      {store.forms.find(f => f.id === order.formId)?.name ??
                        "Sem formulário"}
                    </p>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                        {order.responsible
                          .split(" ")
                          .map(x => x[0])
                          .join("")}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {order.responsible}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-xs">
                    <span
                      className={cx(
                        "font-semibold",
                        order.priority === "Alta"
                          ? "text-rose-600"
                          : order.priority === "Média"
                            ? "text-amber-600"
                            : "text-slate-500"
                      )}
                    >
                      {order.priority}
                    </span>
                  </td>
                  <td className="py-4">
                    <StatusPill
                      status={order.status}
                      statusKey={order.statusKey}
                    />
                  </td>
                  <td className="py-4 pr-1 text-right">
                    <span
                      className={cx(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                        order.source === "cliente"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-slate-50 text-slate-500"
                      )}
                    >
                      {order.source === "cliente" ? "Portal" : "Gestão"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function CustomersPage({
  store,
  onAdd,
}: {
  store: DemoStore;
  onAdd: () => void;
}) {
  return (
    <>
      <SectionHeading
        eyebrow="Relacionamento"
        title="Clientes e unidades"
        description="Cadastre clientes, contatos, endereços e acompanhe os ativos vinculados."
      />
      <TableToolbar
        buttonLabel="Novo cliente"
        onAdd={onAdd}
        searchPlaceholder="Buscar cliente ou unidade"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {store.customers.map(customer => (
          <div
            key={customer.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Factory className="h-5 w-5" />
              </div>
              <span
                className={cx(
                  "rounded-full px-2 py-1 text-[10px] font-bold",
                  customer.open > 0
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                )}
              >
                {customer.open > 0
                  ? `${customer.open} OS abertas`
                  : "Sem pendências"}
              </span>
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-800">
              {customer.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3 w-3" />
              {customer.city} · {customer.state}
            </p>
            <p className="mt-3 truncate text-[11px] text-slate-500">
              {customer.contact}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <div>
                <p className="text-[10px] text-slate-400">Equipamentos</p>
                <p className="mt-1 text-base font-bold text-slate-800">
                  {
                    store.equipment.filter(e => e.customerId === customer.id)
                      .length
                  }
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Chamados</p>
                <p className="mt-1 text-base font-bold text-orange-600">
                  {
                    store.tickets.filter(t => t.customerId === customer.id)
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EquipmentPage({
  store,
  onAddStandard,
  onInstall,
  onLink,
}: {
  store: DemoStore;
  onAddStandard: () => void;
  onInstall: () => void;
  onLink: () => void;
}) {
  const authenticated =
    typeof window !== "undefined" &&
    Boolean(window.sessionStorage.getItem("manus-cookie"));
  const remoteStandards = trpc.equipment.standards.list.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });
  const remoteEquipment = trpc.equipment.list.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });
  const standards: EquipmentStandard[] =
    remoteStandards.data?.map(item => ({
      id: String(item.id),
      code: item.code,
      name: item.name,
      category: item.category,
      manufacturer: item.manufacturer || "—",
      model: item.model || "—",
      description: item.description || "",
    })) ?? store.equipmentStandards;
  const installed: Equipment[] =
    remoteEquipment.data?.map(item => ({
      id: String(item.id),
      code: item.code,
      name: item.name,
      model: item.model || "—",
      customerId: item.customerId ? String(item.customerId) : "",
      standardId: item.catalogId ? String(item.catalogId) : undefined,
      serialNumber: item.serialNumber || "—",
      installationLocation: item.installationLocation || "—",
      state:
        item.state === "manutencao"
          ? "Manutenção"
          : item.state === "atencao"
            ? "Atenção"
            : "Operacional",
      lastMaintenance: item.lastMaintenanceAt
        ? new Date(item.lastMaintenanceAt).toLocaleDateString("pt-BR")
        : "—",
    })) ?? store.equipment;
  return (
    <>
      <SectionHeading
        eyebrow="Catálogo e ativos"
        title="Equipamentos"
        description="Cadastre o padrão uma vez e depois instale unidades com cliente, local e número de série."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onAddStandard}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700"
            >
              <Boxes className="h-3.5 w-3.5 text-orange-600" />
              Novo padrão
            </button>
            <button
              onClick={onInstall}
              className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/15"
            >
              <Plus className="h-3.5 w-3.5" />
              Instalar no cliente
            </button>
          </div>
        }
      />
      <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-800">
        <strong>Fluxo correto:</strong> 1) cadastre o equipamento padrão, como
        “Porta rápida”; 2) instale uma unidade no cliente informando local e
        número de série; 3) use o vínculo em chamados, OS e formulários. O
        padrão não recebe cliente nem número de série.
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Padrões cadastrados"
          value={String(standards.length)}
          detail="Modelos reutilizáveis"
          icon={Boxes}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Unidades instaladas"
          value={String(installed.length)}
          detail="Ativos rastreáveis"
          icon={Wrench}
          tone="bg-orange-50 text-orange-700"
        />
        <StatCard
          label="Com cliente e local"
          value={String(
            installed.filter(
              item =>
                item.customerId &&
                item.installationLocation &&
                item.installationLocation !== "—"
            ).length
          )}
          detail="Vínculos completos"
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-700"
        />
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-950">
              Equipamentos padrão
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Catálogo mestre sem vínculo com cliente.
            </p>
          </div>
          <button
            onClick={onAddStandard}
            className="text-xs font-semibold text-orange-600"
          >
            Cadastrar padrão
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <th className="pb-3 pl-1 font-semibold">Código</th>
                <th className="pb-3 font-semibold">Padrão</th>
                <th className="pb-3 font-semibold">Categoria</th>
                <th className="pb-3 font-semibold">Fabricante / modelo</th>
                <th className="pb-3 pr-1 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {standards.map(item => (
                <tr key={item.id} className="text-sm">
                  <td className="py-4 pl-1 font-mono text-xs font-semibold text-slate-600">
                    {item.code}
                  </td>
                  <td className="py-4">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {item.description}
                    </p>
                  </td>
                  <td className="py-4 text-xs text-slate-600">
                    {item.category}
                  </td>
                  <td className="py-4 text-xs text-slate-600">
                    {item.manufacturer} · {item.model}
                  </td>
                  <td className="py-4 pr-1 text-right">
                    <button
                      onClick={onInstall}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-orange-600 hover:bg-orange-50"
                    >
                      Instalar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-950">
              Unidades instaladas
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Cada registro representa uma porta física em um cliente.
            </p>
          </div>
          <button
            onClick={onLink}
            className="text-xs font-semibold text-orange-600"
          >
            Ajustar vínculo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <th className="pb-3 pl-1 font-semibold">Padrão / unidade</th>
                <th className="pb-3 font-semibold">Cliente</th>
                <th className="pb-3 font-semibold">Local instalado</th>
                <th className="pb-3 font-semibold">Número de série</th>
                <th className="pb-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {installed.map(item => (
                <tr key={item.id} className="text-sm">
                  <td className="py-4 pl-1">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {item.code} · {item.model}
                    </p>
                  </td>
                  <td className="py-4 text-xs font-medium text-slate-600">
                    {store.customers.find(
                      customer => customer.id === item.customerId
                    )?.name ?? "Sem cliente"}
                  </td>
                  <td className="py-4 text-xs text-slate-600">
                    {item.installationLocation || "Não informado"}
                  </td>
                  <td className="py-4 font-mono text-xs font-semibold text-slate-700">
                    {item.serialNumber || "Não informado"}
                  </td>
                  <td className="py-4">
                    <StatusPill
                      status={item.state}
                      statusKey={
                        item.state === "Operacional"
                          ? "done"
                          : item.state === "Manutenção"
                            ? "waiting"
                            : "approval"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ThirdPartiesPage({
  store,
  onAdd,
}: {
  store: DemoStore;
  onAdd: () => void;
}) {
  return (
    <>
      <SectionHeading
        eyebrow="Rede autorizada"
        title="Terceiros e fornecedores"
        description="Homologue parceiros, distribua OS e acompanhe cumprimento de SLA."
        action={
          <button
            onClick={onAdd}
            className="hidden items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 text-sm font-semibold text-white sm:flex"
          >
            <Plus className="h-4 w-4" />
            Novo terceiro
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Parceiros ativos"
          value={String(
            store.thirdParties.filter(p => p.status === "Homologado").length
          )}
          detail={`${store.thirdParties.length} fornecedores cadastrados`}
          icon={UserRoundCog}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="OS com terceiros"
          value={String(store.workOrders.filter(o => o.thirdPartyId).length)}
          detail="Distribuídas na rede"
          icon={Route}
          tone="bg-orange-50 text-orange-700"
        />
        <StatCard
          label="SLA da rede"
          value="93%"
          detail="+2,4 p.p. no mês"
          icon={ShieldCheck}
          tone="bg-emerald-50 text-emerald-700"
          trend="up"
        />
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-950">
              Rede de atendimento
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              A visão de terceiros fica separada por perfil de acesso.
            </p>
          </div>
          <button className="text-xs font-semibold text-orange-600">
            Exportar avaliação
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <th className="pb-3 pl-1 font-semibold">Empresa</th>
                <th className="pb-3 font-semibold">Região</th>
                <th className="pb-3 font-semibold">Responsável</th>
                <th className="pb-3 font-semibold">OS abertas</th>
                <th className="pb-3 font-semibold">SLA 30 dias</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.thirdParties.map(partner => (
                <tr key={partner.id} className="text-sm">
                  <td className="py-4 pl-1">
                    <p className="font-semibold text-slate-800">
                      {partner.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Fornecedor credenciado
                    </p>
                  </td>
                  <td className="py-4 text-xs text-slate-600">
                    {partner.region}
                  </td>
                  <td className="py-4 text-xs text-slate-600">
                    {partner.contact}
                  </td>
                  <td className="py-4 text-xs font-semibold text-slate-700">
                    {partner.open}
                  </td>
                  <td className="py-4 text-xs font-semibold text-emerald-700">
                    {partner.sla}%
                  </td>
                  <td className="py-4">
                    <span
                      className={cx(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        partner.status === "Homologado"
                          ? "bg-emerald-50 text-emerald-700"
                          : partner.status === "Em revisão"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                      )}
                    >
                      {partner.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function PeoplePage({ store, onAdd }: { store: DemoStore; onAdd: () => void }) {
  return (
    <>
      <SectionHeading
        eyebrow="Acessos e performance"
        title="Gestão de pessoas"
        description="Organize colaboradores, perfis de acesso, equipes e produtividade."
        action={
          <button
            onClick={onAdd}
            className="hidden items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 text-sm font-semibold text-white sm:flex"
          >
            <Plus className="h-4 w-4" />
            Convidar pessoa
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pessoas cadastradas"
          value={String(store.people.length)}
          detail="22 em campo"
          icon={UsersRound}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Acessos ativos"
          value={String(store.people.filter(p => p.access === "Ativo").length)}
          detail="Convites controlados por perfil"
          icon={ShieldCheck}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Produtividade média"
          value="87%"
          detail="+8 p.p. no trimestre"
          icon={Gauge}
          tone="bg-orange-50 text-orange-700"
          trend="up"
        />
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-950">
            Pessoas e permissões
          </h2>
          <button className="text-xs font-semibold text-orange-600">
            Gerenciar perfis
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <th className="pb-3 pl-1 font-semibold">Pessoa</th>
                <th className="pb-3 font-semibold">Área / perfil</th>
                <th className="pb-3 font-semibold">Último acesso</th>
                <th className="pb-3 font-semibold">Acesso</th>
                <th className="pb-3 pr-1 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.people.map(person => (
                <tr key={person.id} className="text-sm">
                  <td className="py-4 pl-1">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {person.name
                          .split(" ")
                          .map(x => x[0])
                          .join("")}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {person.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-xs font-medium text-slate-600">
                      {person.profile}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {person.area}
                    </p>
                  </td>
                  <td className="py-4 text-xs text-slate-500">{person.last}</td>
                  <td className="py-4">
                    <span
                      className={cx(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        person.access === "Ativo"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {person.access}
                    </span>
                  </td>
                  <td className="py-4 pr-1 text-right">
                    <button className="rounded-lg p-2 text-slate-300 hover:bg-slate-50 hover:text-orange-600">
                      <Settings2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function FormsPage({
  store,
  onAdd,
  onAddCustom,
  onEditCustom,
  onDuplicateCustom,
  onDeactivateCustom,
  onPreview,
}: {
  store: DemoStore;
  onAdd: () => void;
  onAddCustom: () => void;
  onEditCustom: (form: CustomFormDefinition) => void;
  onDuplicateCustom: (form: CustomFormDefinition) => void;
  onDeactivateCustom: (form: CustomFormDefinition) => void;
  onPreview: (form: ServiceForm) => void;
}) {
  const authenticated =
    typeof window !== "undefined" &&
    Boolean(window.sessionStorage.getItem("manus-cookie"));
  const remoteForms = trpc.forms.list.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });
  const remoteCustomForms = trpc.customForms.list.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });
  const displayForms: ServiceForm[] =
    remoteForms.data?.map(form => ({
      id: String(form.id),
      name: form.name,
      category: form.category === "instalacao" ? "Instalação" : "Atendimento",
      description: form.description || "Template operacional Inovadoor.",
      fields: (() => {
        try {
          return JSON.parse(form.fieldsJson || "[]") as string[];
        } catch {
          return [];
        }
      })(),
      used: 0,
      updated: "Sincronizado agora",
    })) ?? store.forms;
  const customForms: CustomFormDefinition[] =
    remoteCustomForms.data?.map(form => ({
      id: String(form.id),
      entityType: form.entityType as CustomFormDefinition["entityType"],
      name: form.name,
      description: form.description || "",
      fields: (() => {
        try {
          return JSON.parse(form.fieldsJson || "[]") as CustomField[];
        } catch {
          return [];
        }
      })(),
    })) ?? store.customForms;
  const entityLabels: Record<CustomFormDefinition["entityType"], string> = {
    customer: "Clientes",
    equipmentStandard: "Equipamentos padrão",
    equipmentInstall: "Instalação de equipamentos",
    thirdParty: "Terceiros",
    person: "Pessoas",
    workOrder: "Ordens de serviço",
    ticket: "Chamados",
  };
  return (
    <>
      <SectionHeading
        eyebrow="Padronização operacional"
        title="Formulários e cadastros"
        description="Crie templates de atendimento e defina campos extras para cada tipo de cadastro."
        action={
          <div className="flex gap-2">
            <button
              onClick={onAddCustom}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 sm:flex"
            >
              <Settings2 className="h-4 w-4 text-orange-600" />
              Personalizar cadastro
            </button>
            <button
              onClick={onAdd}
              className="hidden items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 text-sm font-semibold text-white sm:flex"
            >
              <FilePlus2 className="h-4 w-4" />
              Novo formulário
            </button>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Templates operacionais"
          value={String(displayForms.length)}
          detail="Atendimento e instalação"
          icon={ClipboardList}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Cadastros customizados"
          value={String(customForms.length)}
          detail="Campos extras por entidade"
          icon={Settings2}
          tone="bg-orange-50 text-orange-700"
        />
        <StatCard
          label="Campos configurados"
          value={String(
            customForms.reduce((total, form) => total + form.fields.length, 0)
          )}
          detail="Com validação e tipos"
          icon={ShieldCheck}
          tone="bg-emerald-50 text-emerald-700"
        />
      </div>
      <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-base font-bold text-slate-950">
              Campos customizáveis por cadastro
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
              Cada entidade pode ter seu próprio formulário com campos de texto,
              número, data, seleção, checkbox e obrigatoriedade. Esses campos
              aparecem automaticamente no modal correspondente.
            </p>
          </div>
          <button
            onClick={onAddCustom}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d1d2e] px-3.5 py-2.5 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar definição
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customForms.map(form => (
            <div
              key={form.id}
              className="rounded-xl border border-white bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {form.name}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-orange-600">
                    {entityLabels[form.entityType]}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  Ativo
                </span>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">
                {form.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {form.fields.map(field => (
                  <span
                    key={field.key}
                    className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600"
                  >
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => onEditCustom(form)}
                  className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDuplicateCustom(form)}
                  className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                >
                  Duplicar
                </button>
                <button
                  onClick={() => onDeactivateCustom(form)}
                  className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                >
                  Desativar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {displayForms.map(form => (
          <div
            key={form.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={cx(
                  "flex h-11 w-11 items-center justify-center rounded-xl",
                  form.category === "Instalação"
                    ? "bg-orange-50 text-orange-600"
                    : "bg-blue-50 text-blue-600"
                )}
              >
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                Ativo
              </span>
            </div>
            <h2 className="mt-4 font-display text-base font-bold text-slate-900">
              {form.name}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {form.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {form.fields.map(field => (
                <span
                  key={field}
                  className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600"
                >
                  {field}
                </span>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-[11px] text-slate-400">
                Usado em {form.used} OS · atualizado {form.updated}
              </span>
              <button
                onClick={() => onPreview(form)}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600"
              >
                Abrir template <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CalendarPage({
  store,
  onAdd,
}: {
  store: DemoStore;
  onAdd: () => void;
}) {
  const days = [
    "Hoje · 31 ago",
    "Ter · 01 set",
    "Qua · 02 set",
    "Qui · 03 set",
  ];
  const cards = [
    [store.workOrders[0], store.workOrders[3]],
    [store.workOrders[1]],
    [store.workOrders[2]],
    [],
  ];
  return (
    <>
      <SectionHeading
        eyebrow="Planejamento"
        title="Agenda e despacho"
        description="Monte a melhor rota para cada equipe e antecipe conflitos de agenda."
        action={
          <button
            onClick={onAdd}
            className="hidden items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 sm:flex"
          >
            <Route className="h-4 w-4" />
            Otimizar rotas
          </button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500">
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 text-sm font-semibold text-slate-800">
            31 de agosto — 06 de setembro, 2026
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500">
            <i className="h-2 w-2 rounded-full bg-blue-500" />
            Equipe própria
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <i className="h-2 w-2 rounded-full bg-orange-500" />
            Terceiros
          </span>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        {days.map((day, index) => (
          <div
            key={day}
            className={cx(
              "min-h-[340px] rounded-2xl border bg-white p-3",
              index === 0
                ? "border-orange-200 shadow-[0_8px_30px_rgba(243,111,33,0.09)]"
                : "border-slate-200/80"
            )}
          >
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p
                  className={cx(
                    "text-xs font-bold",
                    index === 0 ? "text-orange-600" : "text-slate-700"
                  )}
                >
                  {day}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {cards[index].filter(Boolean).length} atividades
                </p>
              </div>
              {index === 0 && (
                <span className="h-2 w-2 rounded-full bg-orange-500 ring-4 ring-orange-100" />
              )}
            </div>
            <div className="space-y-2">
              {cards[index].filter(Boolean).map(
                (card, i) =>
                  card && (
                    <div
                      key={card.id}
                      className={cx(
                        "rounded-xl border-l-4 bg-slate-50 p-3",
                        card.thirdPartyId
                          ? "border-orange-500"
                          : "border-blue-500"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">
                          {card.scheduled.split("·").pop()?.trim()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          45 min
                        </span>
                      </div>
                      <p className="mt-2 truncate text-xs font-bold text-slate-700">
                        {
                          store.customers.find(c => c.id === card.customerId)
                            ?.name
                        }
                      </p>
                      <p className="mt-1 truncate text-[10px] text-slate-400">
                        {card.responsible}
                      </p>
                    </div>
                  )
              )}
              <button
                onClick={onAdd}
                className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 py-2.5 text-[10px] font-semibold text-slate-400 transition hover:border-orange-300 hover:text-orange-600"
              >
                <Plus className="h-3 w-3" />
                Adicionar atividade
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function StockPage({ onAdd }: { onAdd: () => void }) {
  const items = [
    {
      name: "Sensor de segurança",
      sku: "SNS-004",
      available: 18,
      min: 10,
      unit: "un",
    },
    {
      name: "Borracha de vedação 4m",
      sku: "VED-011",
      available: 6,
      min: 8,
      unit: "kit",
    },
    {
      name: "Central de comando",
      sku: "CMD-020",
      available: 3,
      min: 4,
      unit: "un",
    },
    {
      name: "Kit fotocélula",
      sku: "FOT-002",
      available: 26,
      min: 12,
      unit: "un",
    },
  ];
  return (
    <>
      <SectionHeading
        eyebrow="Materiais"
        title="Estoque e peças"
        description="Saiba o que está disponível em cada base e no veículo das equipes."
        action={
          <button
            onClick={onAdd}
            className="hidden items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 text-sm font-semibold text-white sm:flex"
          >
            <Plus className="h-4 w-4" />
            Lançar movimentação
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Itens cadastrados"
          value="248"
          detail="Em 4 bases operacionais"
          icon={PackageCheck}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Estoque baixo"
          value="03"
          detail="Reabastecer esta semana"
          icon={CircleAlert}
          tone="bg-amber-50 text-amber-700"
        />
        <StatCard
          label="Movimentações hoje"
          value="18"
          detail="12 saídas para OS"
          icon={Activity}
          tone="bg-emerald-50 text-emerald-700"
        />
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
        <h2 className="mb-4 font-display text-base font-bold text-slate-950">
          Posição de estoque
        </h2>
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.sku}
              className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <PackageCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-700">
                  {item.name}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {item.sku} · {item.unit}
                </p>
              </div>
              <div className="w-32">
                <div className="mb-1 flex justify-between text-[10px]">
                  <span className="text-slate-400">Disponível</span>
                  <span
                    className={cx(
                      "font-bold",
                      item.available < item.min
                        ? "text-amber-600"
                        : "text-slate-700"
                    )}
                  >
                    {item.available}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cx(
                      "h-full rounded-full",
                      item.available < item.min
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                    )}
                    style={{
                      width: `${Math.min(100, (item.available / (item.min * 1.5)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <button className="rounded-lg p-2 text-slate-300 hover:bg-slate-50 hover:text-orange-600">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ReportsPage() {
  return (
    <>
      <SectionHeading
        eyebrow="Inteligência operacional"
        title="Relatórios e indicadores"
        description="Decisões mais rápidas com dados confiáveis da operação."
        action={
          <button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 sm:flex">
            <FileText className="h-4 w-4" />
            Exportar relatório
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tempo médio em campo"
          value="2h18"
          detail="-14 min vs. mês anterior"
          icon={Clock3}
          tone="bg-blue-50 text-blue-700"
          trend="up"
        />
        <StatCard
          label="Primeiro atendimento"
          value="78%"
          detail="Meta: 80%"
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Avaliação média"
          value="4,7 / 5"
          detail="186 respostas"
          icon={Sparkles}
          tone="bg-amber-50 text-amber-700"
          trend="up"
        />
        <StatCard
          label="Custo por OS"
          value="R$ 184"
          detail="-6,8% no trimestre"
          icon={ArrowDownRight}
          tone="bg-violet-50 text-violet-700"
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="font-display text-base font-bold text-slate-950">
              Conclusão por tipo de serviço
            </h2>
            <p className="mt-1 text-xs text-slate-400">Últimos 30 dias</p>
          </div>
          {[
            { label: "Manutenção preventiva", value: 86, color: "bg-blue-500" },
            {
              label: "Manutenção corretiva",
              value: 72,
              color: "bg-orange-500",
            },
            { label: "Instalação", value: 64, color: "bg-emerald-500" },
            {
              label: "Inspeção de segurança",
              value: 91,
              color: "bg-violet-500",
            },
          ].map(row => (
            <div key={row.label} className="mb-5 last:mb-0">
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-medium text-slate-600">{row.label}</span>
                <span className="font-bold text-slate-800">{row.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className={cx("h-full rounded-full", row.color)}
                  style={{ width: `${row.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="font-display text-base font-bold text-slate-950">
              Demanda por região
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Distribuição de OS no Paraná
            </p>
          </div>
          <div className="flex h-48 items-end gap-4 border-b border-slate-100 px-3">
            {[
              { label: "CWB", value: 92 },
              { label: "ARA", value: 68 },
              { label: "SJP", value: 84 },
              { label: "PIN", value: 56 },
              { label: "COL", value: 41 },
              { label: "OUT", value: 29 },
            ].map((bar, i) => (
              <div
                key={bar.label}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="text-[10px] font-semibold text-slate-500">
                  {bar.value}
                </span>
                <div
                  className={cx(
                    "w-full max-w-9 rounded-t-lg",
                    i === 0 ? "bg-orange-500" : "bg-orange-100"
                  )}
                  style={{ height: `${bar.value * 1.35}px` }}
                />
                <span className="text-[10px] font-medium text-slate-400">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function IntegrationsPage({
  onPersist,
}: {
  onPersist: (config: {
    workspaceId: string;
    settingsJson: string;
  }) => Promise<boolean>;
}) {
  const [boardId, setBoardId] = useState(
    () => window.localStorage.getItem("inovadoor-monday-board") || "123456789"
  );
  const [direction, setDirection] = useState(
    () =>
      window.localStorage.getItem("inovadoor-monday-direction") ||
      "bidirecional"
  );
  const [webhookUrl, setWebhookUrl] = useState(
    () =>
      window.localStorage.getItem("inovadoor-monday-webhook") ||
      "https://inovafield-3zs6fpc2.manus.space/api/monday/webhook"
  );
  const [columnNames, setColumnNames] = useState<MondayColumnMap>(() => {
    try {
      return {
        status: "situacao",
        quantity: "quantidade",
        customer: "cliente",
        equipment: "equipamento",
        workOrder: "os_criadas",
        completed: "os_concluidas",
        photos: "fotos",
        videos: "videos",
        ...JSON.parse(
          window.localStorage.getItem("inovadoor-monday-columns") || "{}"
        ),
      };
    } catch {
      return {
        status: "situacao",
        quantity: "quantidade",
        customer: "cliente",
        equipment: "equipamento",
        workOrder: "os_criadas",
        completed: "os_concluidas",
        photos: "fotos",
        videos: "videos",
      };
    }
  });
  const [saved, setSaved] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [localItem, setLocalItem] = useState<{
    mondayItemId: string;
    name: string;
    status: string;
    boardId: string;
    columnsJson: string;
    workOrderIdsJson: string;
  } | null>(null);
  const authenticated =
    typeof window !== "undefined" &&
    Boolean(window.sessionStorage.getItem("manus-cookie"));
  const simulatedItems = trpc.integrations.monday.simulatedItems.useQuery(
    { boardId },
    { enabled: authenticated, retry: false }
  );
  const inboundMutation =
    trpc.integrations.monday.simulateInbound.useMutation();
  const outboundMutation =
    trpc.integrations.monday.simulateOutbound.useMutation();
  const utils = trpc.useUtils();
  const connectionStatus = trpc.integrations.monday.status.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });
  const saveMapping = async () => {
    if (!webhookUrl.startsWith("https://")) return;
    const persisted = await onPersist({
      workspaceId: boardId,
      settingsJson: JSON.stringify({
        direction,
        webhookUrl,
        columns: columnNames,
      }),
    });
    window.localStorage.setItem(
      "inovadoor-monday-connected",
      persisted ? "true" : "false"
    );
    window.localStorage.setItem("inovadoor-monday-board", boardId);
    window.localStorage.setItem("inovadoor-monday-direction", direction);
    window.localStorage.setItem("inovadoor-monday-webhook", webhookUrl);
    window.localStorage.setItem(
      "inovadoor-monday-columns",
      JSON.stringify(columnNames)
    );
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };
  const simulateInbound = async () => {
    if (!authenticated) {
      const workOrderIds = Array.from(
        { length: 10 },
        (_, index) => `MON-ITEM-PORTAS-10-${String(index + 1).padStart(2, "0")}`
      );
      setLocalItem({
        mondayItemId: "ITEM-PORTAS-10",
        name: "Projeto Expedição FrioSul · 10 portas",
        status: "Expedido",
        boardId,
        columnsJson: JSON.stringify({
          situacao: "Expedido",
          quantidade: 10,
          cliente: "FrioSul Distribuição",
          cidade: "Araucária",
          equipamento: "Porta rápida",
          os_criadas: 10,
          os_concluidas: 0,
          fotos: 0,
          videos: 0,
        }),
        workOrderIdsJson: JSON.stringify(workOrderIds),
      });
      setSimulated(true);
      return;
    }
    await inboundMutation.mutateAsync({
      boardId,
      mondayItemId: "ITEM-PORTAS-10",
      itemName: "Projeto Expedição FrioSul · 10 portas",
      status: "Expedido",
      quantity: 10,
      customerName: "FrioSul Distribuição",
      city: "Araucária",
      equipmentStandard: "Porta rápida",
      serialPrefix: "PR-FS-2026",
      installationBase: "Centro de distribuição · Doca",
    });
    await utils.integrations.monday.simulatedItems.invalidate();
    setSimulated(true);
  };
  const simulateOutboundAll = async () => {
    const item = (simulatedItems.data?.[0] as typeof localItem) ?? localItem;
    if (!item) return;
    let workOrderIds: string[] = [];
    try {
      workOrderIds = JSON.parse(item.workOrderIdsJson) as string[];
    } catch {
      workOrderIds = [];
    }
    if (!authenticated) {
      const current = localItem;
      if (!current) return;
      const currentColumns = (() => {
        try {
          return JSON.parse(current.columnsJson) as Record<string, unknown>;
        } catch {
          return {};
        }
      })();
      setLocalItem({
        ...current,
        status: "Concluído",
        columnsJson: JSON.stringify({
          ...currentColumns,
          situacao: "Concluído",
          os_concluidas: 10,
          fotos: 20,
          videos: 10,
          ultima_sincronizacao: new Date().toISOString(),
        }),
      });
      setSimulated(true);
      return;
    }
    for (let index = 0; index < workOrderIds.length; index += 1) {
      const workOrderExternalId = workOrderIds[index];
      if (!workOrderExternalId) continue;
      await outboundMutation.mutateAsync({
        mondayItemId: item.mondayItemId,
        workOrderExternalId,
        status: "Concluída",
        evidenceCount: 2,
        videoCount: 1,
      });
      if (index % 3 === 0)
        await utils.integrations.monday.simulatedItems.invalidate();
    }
    await utils.integrations.monday.simulatedItems.invalidate();
    setSimulated(true);
  };
  const item = (simulatedItems.data?.[0] as typeof localItem) ?? localItem;
  const columns = item
    ? (() => {
        try {
          return JSON.parse(item.columnsJson) as Record<string, unknown>;
        } catch {
          return {};
        }
      })()
    : null;
  return (
    <>
      <SectionHeading
        eyebrow="Conectividade"
        title="Integrações"
        description="Centralize o fluxo da Inovadoor com suas ferramentas de trabalho."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f1ff] text-[#6155c7]">
              <Boxes className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold text-slate-950">
                  monday.com
                </h2>
                <span
                  className={cx(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold",
                    connectionStatus.data?.status === "conectado"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  )}
                >
                  {connectionStatus.data?.status === "conectado"
                    ? "Conectado"
                    : "Simulação pronta"}
                </span>
              </div>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                A situação “Expedido” cria uma OS por porta. Atualizações da
                execução retornam para as colunas do item no monday.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
            <InputField
              label="Board ID"
              value={boardId}
              onChange={setBoardId}
              placeholder="Ex.: 123456789"
            />
            <SelectField
              label="Direção"
              value={direction}
              onChange={setDirection}
              options={[
                { value: "bidirecional", label: "Bidirecional" },
                { value: "monday-para-inovadoor", label: "monday → Inovadoor" },
                { value: "inovadoor-para-monday", label: "Inovadoor → monday" },
              ]}
            />
            <div className="sm:col-span-2">
              <InputField
                label="Webhook de entrada"
                value={webhookUrl}
                onChange={setWebhookUrl}
                placeholder="https://.../api/monday/webhook"
              />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Mapeamento das colunas do board
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ["status", "Situação"],
                    ["quantity", "Quantidade"],
                    ["customer", "Cliente"],
                    ["equipment", "Equipamento"],
                    ["workOrder", "OS criadas"],
                    ["completed", "OS concluídas"],
                    ["photos", "Fotos"],
                    ["videos", "Vídeos"],
                  ] as Array<[keyof MondayColumnMap, string]>
                ).map(([key, label]) => (
                  <InputField
                    key={key}
                    label={label}
                    value={columnNames[key]}
                    onChange={value =>
                      setColumnNames(current => ({ ...current, [key]: value }))
                    }
                    placeholder={`ID de ${label.toLowerCase()}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                Use o ID técnico da coluna no monday.com, não apenas o título
                exibido.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <p className="flex-1 text-[11px] leading-5 text-slate-500">
                Colunas mapeadas: Situação, Quantidade, Cliente, Equipamento,
                OS, Concluídas, Fotos e Vídeos.
              </p>
              <button
                onClick={saveMapping}
                className="rounded-xl bg-[#f36f21] px-3.5 py-2 text-xs font-semibold text-white"
              >
                {saved ? "Mapeamento salvo" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-700">
                Dados simulados
              </p>
              <h2 className="mt-1 font-display text-lg font-bold text-slate-950">
                Teste do projeto com 10 portas
              </h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Simule um item do monday com Situação = Expedido. O sistema divide a
            quantidade em 10 OS de instalação, uma por porta, e depois envia
            conclusão, fotos e vídeos simulados de volta.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              onClick={simulateInbound}
              disabled={inboundMutation.isPending}
              className="rounded-xl bg-[#0d1d2e] px-3.5 py-3 text-xs font-bold text-white"
            >
              {inboundMutation.isPending
                ? "Criando OS…"
                : "1 · Importar Expedido"}
            </button>
            <button
              onClick={simulateOutboundAll}
              disabled={!item || outboundMutation.isPending}
              className="rounded-xl border border-orange-200 bg-white px-3.5 py-3 text-xs font-bold text-orange-700"
            >
              {outboundMutation.isPending
                ? "Sincronizando…"
                : "2 · Concluir 10 OS"}
            </button>
          </div>
          {!authenticated && (
            <p className="mt-3 text-[10px] font-semibold text-orange-700">
              Preview demonstrativo: entre com a conta para persistir a
              simulação no banco.
            </p>
          )}
          {simulatedItems.isLoading ? (
            <p className="mt-5 text-xs text-slate-500">
              Carregando itens simulados…
            </p>
          ) : (
            item && (
              <div className="mt-5 rounded-xl border border-orange-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Item {item.mondayItemId} · board {item.boardId}
                    </p>
                  </div>
                  <span
                    className={cx(
                      "rounded-full px-2 py-1 text-[10px] font-bold",
                      item.status === "Concluído"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-blue-50 text-blue-700"
                    )}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["OS", columns?.os_criadas ?? 0],
                    ["Concluídas", columns?.os_concluidas ?? 0],
                    ["Fotos", columns?.fotos ?? 0],
                    ["Vídeos", columns?.videos ?? 0],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-lg bg-slate-50 p-2.5"
                    >
                      <p className="text-[10px] text-slate-400">
                        {String(label)}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] leading-4 text-slate-500">
                  A coluna Situação, o contador de OS, a última OS atualizada,
                  fotos e vídeos são sincronizados a cada conclusão.
                </p>
              </div>
            )
          )}
          {simulated && !item && (
            <div className="mt-5 rounded-xl bg-white p-4 text-xs font-semibold text-emerald-700">
              Fluxo simulado preparado no navegador. Com sessão ativa, o item
              será persistido no banco.
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200/80 bg-[#0d1d2e] p-5 text-white sm:p-6">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-orange-300" />
          <h2 className="font-display text-base font-bold">
            Fluxo de sincronização
          </h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ["1", "monday", "Situação = Expedido"],
            ["2", "Inovadoor", "10 OS criadas"],
            ["3", "Campo", "Fotos + vídeos + conclusão"],
            ["4", "monday", "Status e evidências retornam"],
          ].map(([step, label, detail]) => (
            <div
              key={step}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <span className="text-xs font-bold text-orange-300">{step}</span>
              <p className="mt-2 text-xs font-bold text-white">{label}</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-400">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function OperationsDashboard({
  mode,
  role,
}: {
  mode: "installation" | "assistance";
  role: RoleKey;
}) {
  const authenticated =
    typeof window !== "undefined" &&
    Boolean(window.sessionStorage.getItem("manus-cookie"));
  const plansQuery = trpc.integrations.operations.installationPlans.useQuery(
    undefined,
    { enabled: authenticated, retry: false }
  );
  const requestsQuery = trpc.integrations.operations.technicalRequests.useQuery(
    undefined,
    { enabled: authenticated, retry: false }
  );
  const acceptMutation =
    trpc.integrations.operations.acceptInstallation.useMutation();
  const convertMutation =
    trpc.integrations.operations.convertTechnicalRequest.useMutation();
  const [notice, setNotice] = useState("");
  const demoPlans = [
    {
      id: -1,
      title: "Obra demonstrativa · Centro de Distribuição Araucária",
      customerName: "FrioSul Distribuição",
      location: "Araucária · PR",
      mondayStatus: "Expedido",
      status: "disponivel",
    },
  ];
  const demoRequests = [
    {
      id: -1,
      title: "Porta rápida com falha no sensor de segurança",
      customerName: "Metalúrgica Aurora",
      location: "São José dos Pinhais · PR",
      priority: "alta",
      status: "triagem",
    },
  ];
  const plans = plansQuery.data?.length ? plansQuery.data : demoPlans;
  const requests = requestsQuery.data?.length
    ? requestsQuery.data
    : demoRequests;
  const isInstallation = mode === "installation";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">
            Operação · monday.com
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
            {isInstallation
              ? "Planejamento de instalação"
              : "Assistência técnica"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isInstallation
              ? "Disponibilize obras, controle aceite e abra a OS somente para o instalador escolhido."
              : "Faça triagem por prioridade, equipe, SLA e converta o chamado em OS."}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
          Perfil: {role === "terceiros" ? "Terceiro" : "Gestão"}
        </span>
      </div>
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
          {notice}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {(isInstallation ? plans : requests).map(item => {
          const plan = item as (typeof demoPlans)[number];
          const request = item as (typeof demoRequests)[number];
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold uppercase text-orange-700">
                    {isInstallation
                      ? (plan.status ?? "disponível")
                      : (request.priority ?? "média")}
                  </span>
                  <h2 className="mt-3 text-base font-bold text-slate-800">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.customerName || "Cliente não informado"} ·{" "}
                    {item.location || "Local não informado"}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {isInstallation
                    ? plan.mondayStatus || "monday"
                    : request.status}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {isInstallation ? (
                  <button
                    className="rounded-xl bg-[#0d1d2e] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    disabled={acceptMutation.isPending}
                    onClick={() => {
                      if (!authenticated || item.id < 0) {
                        setNotice(
                          "Modo demonstrativo: o aceite abrirá a OS após o login do instalador."
                        );
                        return;
                      }
                      void acceptMutation
                        .mutateAsync({ planId: item.id })
                        .then(() => {
                          setNotice(
                            "Obra aceita e OS criada para este instalador."
                          );
                          void plansQuery.refetch();
                        });
                    }}
                  >
                    {role === "campo"
                      ? "Aceitar obra"
                      : "Ver candidatos / aceite"}
                  </button>
                ) : (
                  <button
                    className="rounded-xl bg-[#0d1d2e] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    disabled={role !== "gestao" || convertMutation.isPending}
                    onClick={() => {
                      if (!authenticated || item.id < 0) {
                        setNotice(
                          "Modo demonstrativo: a conversão criará uma OS após o login da gestão."
                        );
                        return;
                      }
                      void convertMutation
                        .mutateAsync({ id: item.id })
                        .then(() => {
                          setNotice("Chamado convertido em ordem de serviço.");
                          void requestsQuery.refetch();
                        });
                    }}
                  >
                    Converter em OS
                  </button>
                )}
                <button
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                  onClick={() =>
                    setNotice("Detalhes operacionais preparados para abertura.")
                  }
                >
                  Abrir detalhes
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldPwa({
  onExit,
  onEvidence,
  requiredFields = [],
}: {
  onExit: () => void;
  onEvidence?: (payload: EvidencePayload) => Promise<boolean>;
  requiredFields?: CustomField[];
}) {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isOffline, setIsOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [photos, setPhotos] = useState<PhotoEvidence[]>([]);
  const [signatureReady, setSignatureReady] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const requiredFieldsComplete = requiredFields.every(field =>
    Boolean(customValues[field.key]?.trim())
  );
  const [pendingEvidence, setPendingEvidence] = useState<EvidencePayload[]>(
    () => {
      try {
        return JSON.parse(
          window.localStorage.getItem("inovadoor-field-evidence-pending") ||
            "[]"
        ) as EvidencePayload[];
      } catch {
        return [];
      }
    }
  );
  const signatureCanvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastSignaturePoint = useRef<{ x: number; y: number } | null>(null);
  const onEvidenceRef = useRef(onEvidence);

  useEffect(() => {
    onEvidenceRef.current = onEvidence;
  }, [onEvidence]);

  useEffect(() => {
    const canvas = signatureCanvas.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      const context = canvas.getContext("2d");
      if (context) {
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.lineCap = "round";
        context.lineJoin = "round";
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const queueEvidence = (payload: EvidencePayload) => {
    setPendingEvidence(current => {
      const next = [...current, payload];
      window.localStorage.setItem(
        "inovadoor-field-evidence-pending",
        JSON.stringify(next)
      );
      return next;
    });
  };

  const sendEvidence = async (payload: EvidencePayload): Promise<boolean> => {
    if (!isOffline && onEvidence) {
      const sent = await onEvidence(payload);
      if (sent) return true;
    }
    queueEvidence(payload);
    return false;
  };

  useEffect(() => {
    if (isOffline || !onEvidenceRef.current || pendingEvidence.length === 0)
      return;
    const syncHandler = onEvidenceRef.current;
    let cancelled = false;
    const synchronize = async () => {
      const remaining: EvidencePayload[] = [];
      for (const payload of pendingEvidence) {
        if (!(await syncHandler(payload))) remaining.push(payload);
      }
      if (!cancelled) {
        setPendingEvidence(remaining);
        window.localStorage.setItem(
          "inovadoor-field-evidence-pending",
          JSON.stringify(remaining)
        );
      }
    };
    void synchronize();
    return () => {
      cancelled = true;
    };
  }, [isOffline, pendingEvidence.length]);

  const captureLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  const capturePhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 20);
    if (!files.length) return;
    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const id = `${file.name}-${file.lastModified}-${Math.random()}`;
      setPhotos(current => [
        ...current,
        { id, name: file.name, dataUrl, status: "enviando" },
      ]);
      const sent = await sendEvidence({
        type: "foto",
        fileName: file.name,
        mimeType: file.type || "image/jpeg",
        dataUrl,
        latitude: location ? String(location.latitude) : undefined,
        longitude: location ? String(location.longitude) : undefined,
      });
      setPhotos(current =>
        current.map(photo =>
          photo.id === id
            ? { ...photo, status: sent ? "enviada" : "offline" }
            : photo
        )
      );
    }
    event.target.value = "";
  };

  const canvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvas.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  const beginSignature = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvas.current;
    const point = canvasPoint(event);
    if (!canvas || !point) return;
    drawing.current = true;
    lastSignaturePoint.current = point;
    canvas.setPointerCapture(event.pointerId);
    const context = canvas.getContext("2d");
    if (context) {
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.strokeStyle = "#0d1d2e";
      context.lineWidth = 2.5;
      context.lineCap = "round";
      context.lineJoin = "round";
    }
  };
  const drawSignature = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const point = canvasPoint(event);
    const context = signatureCanvas.current?.getContext("2d");
    const previous = lastSignaturePoint.current;
    if (point && context && previous) {
      const midpoint = {
        x: (previous.x + point.x) / 2,
        y: (previous.y + point.y) / 2,
      };
      context.quadraticCurveTo(previous.x, previous.y, midpoint.x, midpoint.y);
      context.lineTo(point.x, point.y);
      context.stroke();
      lastSignaturePoint.current = point;
      setSignatureReady(true);
    }
  };
  const endSignature = () => {
    if (drawing.current && signatureReady) {
      const dataUrl = signatureCanvas.current?.toDataURL("image/png");
      if (dataUrl)
        void sendEvidence({
          type: "assinatura",
          fileName: "assinatura-cliente.png",
          mimeType: "image/png",
          dataUrl,
          latitude: location ? String(location.latitude) : undefined,
          longitude: location ? String(location.longitude) : undefined,
        });
    }
    drawing.current = false;
    lastSignaturePoint.current = null;
  };
  const clearSignature = () => {
    const canvas = signatureCanvas.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureReady(false);
    lastSignaturePoint.current = null;
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-5rem)] max-w-md overflow-hidden rounded-[30px] border border-slate-200 bg-[#f4f7fb] shadow-[0_20px_60px_rgba(15,23,42,.12)]">
      <div className="bg-[#0d1d2e] px-5 pb-6 pt-5 text-white">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span
              className={cx(
                "h-2 w-2 rounded-full",
                isOffline ? "bg-amber-400" : "bg-emerald-400"
              )}
            />
            <span className="text-[11px] font-semibold text-slate-300">
              {isOffline ? "Offline" : "Online"}
            </span>
          </div>
          <button className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10">
            <Bell className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-7">
          <p className="text-xs text-slate-400">Segunda-feira, 31 de agosto</p>
          <h1 className="mt-1 font-display text-2xl font-bold">Olá, Marcos.</h1>
          <p className="mt-2 text-xs text-slate-300">
            Você tem 3 atividades para hoje.
          </p>
        </div>
        <div className="mt-5 flex gap-2">
          <div className="flex-1 rounded-xl bg-white/10 p-3">
            <p className="text-[10px] text-slate-400">Hoje</p>
            <p className="mt-1 text-xl font-bold">03</p>
          </div>
          <div className="flex-1 rounded-xl bg-white/10 p-3">
            <p className="text-[10px] text-slate-400">Concluídas</p>
            <p className="mt-1 text-xl font-bold">01</p>
          </div>
          <div className="flex-1 rounded-xl bg-orange-400/15 p-3">
            <p className="text-[10px] text-orange-200">Em aberto</p>
            <p className="mt-1 text-xl font-bold text-orange-200">02</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-slate-800">
            Próxima atividade
          </h2>
          <button className="text-xs font-semibold text-orange-600">
            Ver agenda
          </button>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-700">
                OS-2026-0842
              </span>
              <h3 className="mt-3 text-base font-bold text-slate-800">
                FrioSul Distribuição
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Manutenção corretiva · Porta rápida
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">09:30</span>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <MapPin className="h-4 w-4 text-orange-600" />
            <span className="flex-1">Rua Joinville, 1840 · Araucária</span>
            <button
              onClick={captureLocation}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-orange-600"
              title="Registrar GPS"
            >
              {locating ? (
                <Activity className="h-4 w-4 animate-pulse" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
            </button>
          </div>
          {location && (
            <p className="mt-2 text-[10px] font-medium text-emerald-600">
              GPS registrado: {location.latitude.toFixed(5)},{" "}
              {location.longitude.toFixed(5)}
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600">
              Abrir rota
            </button>
            <button
              onClick={() => setStarted(true)}
              className={cx(
                "rounded-xl py-2.5 text-xs font-semibold",
                started
                  ? "bg-emerald-500 text-white"
                  : "bg-[#f36f21] text-white"
              )}
            >
              {started ? "Atendimento iniciado" : "Iniciar atendimento"}
            </button>
          </div>
        </div>
        <h2 className="pt-2 font-display text-sm font-bold text-slate-800">
          Checklist de execução
        </h2>
        <div className="space-y-2">
          {[
            "Conferir identificação do equipamento",
            "Testar sensores de segurança",
            "Registrar evidências fotográficas",
            "Coletar assinatura do cliente",
          ].map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3"
            >
              <span
                className={cx(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                  i < (started ? 2 : 1)
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {i < (started ? 2 : 1) ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              <span className="flex-1 text-xs font-medium text-slate-600">
                {item}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            </div>
          ))}
        </div>
        {started && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-700">
                    Evidências do atendimento
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Fotos ficam na fila offline e são enviadas quando houver
                    conexão.
                  </p>
                </div>
                <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-2 text-[10px] font-bold text-orange-700">
                  <Camera className="h-3.5 w-3.5" />
                  Adicionar fotos
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={capturePhotos}
                    className="hidden"
                  />
                </label>
              </div>
              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={`Evidência ${index + 1}: ${photo.name}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPhotos(current =>
                            current.filter(item => item.id !== photo.id)
                          )
                        }
                        className="absolute right-1 top-1 rounded-full bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100"
                        aria-label={`Remover ${photo.name}`}
                      >
                        ×
                      </button>
                      <span
                        className={cx(
                          "absolute bottom-1 left-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white",
                          photo.status === "enviada"
                            ? "bg-emerald-600"
                            : photo.status === "offline"
                              ? "bg-amber-600"
                              : "bg-slate-700/80"
                        )}
                      >
                        {photo.status === "enviada"
                          ? "Enviada"
                          : photo.status === "offline"
                            ? "Offline"
                            : "Enviando"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                  <LocateFixed className="h-3.5 w-3.5 text-emerald-500" />
                  {location ? "GPS anexado" : "Registre o GPS acima"}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {pendingEvidence.length} na fila
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-700">
                    Assinatura do cliente
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Desenhe com o dedo ou caneta para registrar o aceite.
                  </p>
                </div>
                <button
                  onClick={clearSignature}
                  className="text-[10px] font-bold text-slate-400"
                >
                  Refazer
                </button>
              </div>
              <canvas
                ref={signatureCanvas}
                width={600}
                height={180}
                onPointerDown={beginSignature}
                onPointerMove={drawSignature}
                onPointerUp={endSignature}
                onPointerCancel={endSignature}
                className="mt-3 h-36 w-full touch-none rounded-xl border border-dashed border-slate-200 bg-[linear-gradient(to_bottom,transparent_95%,#e2e8f0_95%)] bg-[length:100%_28px]"
              />
              {signatureReady && (
                <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <Check className="h-3 w-3" />
                  Assinatura capturada
                </p>
              )}
            </div>
            <>
              {requiredFields.length > 0 && (
                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-orange-600" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-700">
                        Campos obrigatórios da OS
                      </h3>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Preencha os campos configurados pela Gestão antes de
                        concluir.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {requiredFields.map(field => (
                      <InputField
                        key={field.key}
                        label={`${field.label} *`}
                        value={customValues[field.key] ?? ""}
                        onChange={value =>
                          setCustomValues(current => ({
                            ...current,
                            [field.key]: value,
                          }))
                        }
                        placeholder="Obrigatório para conclusão"
                      />
                    ))}
                  </div>
                </div>
              )}
              <button
                disabled={!requiredFieldsComplete}
                onClick={() => setCompleted(true)}
                className={cx(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white",
                  requiredFieldsComplete
                    ? "bg-[#0d1d2e]"
                    : "cursor-not-allowed bg-slate-300"
                )}
              >
                {completed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    OS concluída com sucesso
                  </>
                ) : requiredFieldsComplete ? (
                  <>
                    Finalizar e enviar relatório <Send className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Preencha os campos obrigatórios{" "}
                    <ShieldCheck className="h-4 w-4" />
                  </>
                )}
              </button>
            </>
          </>
        )}
        <div className="flex items-center justify-center gap-2 pt-2 text-[10px] text-slate-400">
          <Cloud className="h-3.5 w-3.5 text-emerald-500" />
          {isOffline
            ? "Salvo no dispositivo para sincronizar"
            : "Dados sincronizados automaticamente"}
        </div>
      </div>
    </div>
  );
}

function ClientPortal({
  store,
  onExit,
  onOpenTicket,
}: {
  store: DemoStore;
  onExit: () => void;
  onOpenTicket: () => void;
}) {
  const customer = store.customers[0];
  const tickets = store.tickets.filter(
    ticket => ticket.customerId === customer.id
  );
  const equipment = store.equipment.filter(
    item => item.customerId === customer.id
  );
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <header className="flex h-[78px] items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
            <Factory className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="font-display text-sm font-bold tracking-wide text-slate-900">
              INOVADOOR
            </p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
              Portal do cliente
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-right sm:block">
            <span className="block text-xs font-bold text-slate-700">
              {customer.name}
            </span>
            <span className="block text-[10px] text-slate-400">
              Unidade {customer.city}
            </span>
          </span>
          <button
            onClick={onExit}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:text-orange-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-5 sm:p-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
              Acompanhamento de serviços
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
              Olá, FrioSul.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Abra um chamado e acompanhe as solicitações da sua unidade.
            </p>
          </div>
          <button
            onClick={onOpenTicket}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f36f21] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20"
          >
            <Plus className="h-4 w-4" />
            Abrir chamado
          </button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Chamados abertos"
            value={String(tickets.length)}
            detail="Em acompanhamento pela Inovadoor"
            icon={Ticket}
            tone="bg-orange-50 text-orange-600"
          />
          <StatCard
            label="Equipamentos"
            value={String(equipment.length)}
            detail="Vinculados à sua unidade"
            icon={Wrench}
            tone="bg-blue-50 text-blue-700"
          />
          <StatCard
            label="SLA contratado"
            value="24h"
            detail="Tempo de primeira resposta"
            icon={Clock3}
            tone="bg-emerald-50 text-emerald-700"
          />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-slate-950">
                  Meus chamados
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Histórico de solicitações e atendimentos
                </p>
              </div>
              <button
                onClick={onOpenTicket}
                className="text-xs font-bold text-orange-600"
              >
                Novo chamado
              </button>
            </div>
            {tickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <Ticket className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Nenhum chamado aberto
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Quando precisar, abra uma solicitação em poucos passos.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="flex items-center gap-3 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Ticket className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {ticket.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {ticket.id} · {ticket.created}
                      </p>
                    </div>
                    <span
                      className={cx(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold",
                        ticket.status === "Novo"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {ticket.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-[#0d1d2e] p-5 text-white sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300">
              <Wrench className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-lg font-bold">
              Seus equipamentos
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Consulte os ativos vinculados a esta unidade ao abrir um chamado.
            </p>
            <div className="mt-6 space-y-3">
              {equipment.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-bold text-white">
                      {item.name}
                    </p>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-bold text-emerald-300">
                      {item.state}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {item.code} · {item.model}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoginPanel({
  role,
  setRole,
  onEnter,
}: {
  role: RoleKey;
  setRole: (role: RoleKey) => void;
  onEnter: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto bg-[#081522]">
      <div className="hidden w-[46%] flex-col justify-between bg-[radial-gradient(circle_at_74%_25%,rgba(243,111,33,.26),transparent_34%),linear-gradient(145deg,#0b1e30,#07111d)] p-10 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/30">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-bold tracking-wide">
                INOVADOOR
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Field Ops
              </p>
            </div>
          </div>
          <div className="mt-24 max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
              Operação conectada
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight">
              Mais controle para cada porta que mantém o negócio em movimento.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
              Gestão, clientes, terceiros, equipamentos e equipes em um só
              fluxo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Acessos por perfil
          </span>
          <span className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-300" />
            PWA offline-ready
          </span>
        </div>
      </div>
      <div className="flex min-h-full flex-1 items-center justify-center bg-[#f8fafc] p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-slate-900">
                INOVADOOR
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Field Ops
              </p>
            </div>
          </div>
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
              Bem-vindo de volta
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
              Acesse sua operação
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Escolha o ambiente que deseja acessar.
            </p>
          </div>
          <div className="grid gap-2.5">
            {roles.map(item => (
              <button
                key={item.key}
                onClick={() => setRole(item.key)}
                className={cx(
                  "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition",
                  role === item.key
                    ? "border-orange-300 bg-orange-50/70 ring-2 ring-orange-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <span
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    role === item.key
                      ? "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-slate-800">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {item.description}
                  </span>
                </span>
                {role === item.key && (
                  <CheckCircle2 className="h-4 w-4 text-orange-600" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                E-mail de acesso
              </span>
              <input
                defaultValue={
                  role === "cliente"
                    ? "manutencao@friosul.com.br"
                    : "beatriz@inovadoor.com.br"
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Senha
              </span>
              <input
                type="password"
                defaultValue="inovadoor"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>
          </div>
          <button
            onClick={onEnter}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f36f21] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#dd5c12]"
          >
            Entrar na plataforma <ArrowUpRight className="h-4 w-4" />
          </button>
          <p className="mt-5 text-center text-xs text-slate-400">
            Ambiente de validação do fluxo · permissões prontas para
            autenticação real
          </p>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="text-orange-600"> *</span>}
      </span>
      <input
        value={value}
        required={required}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CustomFieldsPanel({
  definition,
  values,
  onChange,
}: {
  definition?: CustomFormDefinition;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  if (!definition || definition.fields.length === 0) return null;
  const visibleFields = definition.fields.filter(
    field =>
      !field.condition ||
      values[field.condition.fieldKey] === field.condition.equals
  );
  return (
    <div className="sm:col-span-2 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-800">{definition.name}</p>
          <p className="mt-1 text-[10px] text-slate-500">
            Campos adicionais configurados para este cadastro.
          </p>
        </div>
        <Settings2 className="h-4 w-4 text-orange-600" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {visibleFields.map(field =>
          field.type === "select" ? (
            <SelectField
              key={field.key}
              label={`${field.label}${field.required ? " *" : ""}`}
              value={values[field.key] ?? ""}
              onChange={value => onChange(field.key, value)}
              options={(field.options ?? []).map(option => ({
                value: option,
                label: option,
              }))}
            />
          ) : (
            <InputField
              key={field.key}
              label={`${field.label}${field.required ? " *" : ""}`}
              value={values[field.key] ?? ""}
              onChange={value => onChange(field.key, value)}
              placeholder={
                field.type === "date"
                  ? "dd/mm/aaaa"
                  : field.type === "number"
                    ? "0"
                    : "Preencha este campo"
              }
            />
          )
        )}
      </div>
    </div>
  );
}

function CreateModal({
  modal,
  store,
  onClose,
  onSave,
  editingCustomForm,
}: {
  modal: Exclude<ModalKey, null>;
  store: DemoStore;
  onClose: () => void;
  onSave: (payload: Record<string, string>) => void;
  editingCustomForm?: CustomFormDefinition | null;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => ({
    customerId: store.customers[0]?.id ?? "",
    equipmentId: store.equipment[0]?.id ?? "",
    standardId: store.equipmentStandards[0]?.id ?? "",
    thirdPartyId: store.thirdParties[0]?.id ?? "",
    formId: store.forms[0]?.id ?? "",
    priority: "Média",
    category: "Atendimento",
    status: "Homologado",
    fields: "Fotos, assinatura, checklist",
    state: "Operacional",
    entityType: editingCustomForm?.entityType ?? "customer",
    fieldType: "text",
    required: "Não",
    fieldOptions: "",
    ...(editingCustomForm
      ? {
          editId: editingCustomForm.id,
          name: editingCustomForm.name,
          description: editingCustomForm.description,
          customFields: editingCustomForm.fields
            .map(
              field =>
                `${field.key}|${field.label}|${field.type}|${field.required ? "sim" : "não"}|${field.options?.join(",") ?? ""}|${field.condition ? `${field.condition.fieldKey}=${field.condition.equals}` : ""}`
            )
            .join(";"),
        }
      : {}),
  }));
  const update = (key: string, value: string) =>
    setValues(current => ({ ...current, [key]: value }));
  const title: Record<Exclude<ModalKey, null>, string> = {
    customer: "Cadastrar cliente",
    equipmentStandard: "Cadastrar equipamento padrão",
    equipmentInstall: "Instalar equipamento no cliente",
    thirdParty: "Cadastrar terceiro",
    workOrder: "Criar ordem de serviço",
    ticket: "Abrir chamado",
    link: "Ajustar vínculo equipamento–cliente",
    form: "Gerar formulário operacional",
    customForm: "Criar formulário de cadastro",
  };
  const definition = store.customForms.find(form => form.entityType === modal);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(values);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
              Formulário configurável
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-950">
              {title[modal]}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Campos padrão e campos extras são definidos por entidade.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
          <CustomFieldsPanel
            definition={definition}
            values={values}
            onChange={update}
          />
          {modal === "customForm" && (
            <>
              <div className="sm:col-span-2">
                <div className="rounded-xl bg-orange-50 p-3 text-xs leading-5 text-orange-800">
                  Crie um formulário para qualquer cadastro. Separe os campos
                  por ponto e vírgula no formato{" "}
                  <strong>chave|rótulo|tipo|obrigatório|opções</strong>. Ex.:
                  garantia|Prazo de garantia|select|sim|12 meses,24 meses
                </div>
              </div>
              <div className="sm:col-span-2">
                <InputField
                  label="Nome do formulário"
                  required
                  value={values.name ?? ""}
                  onChange={value => update("name", value)}
                  placeholder="Dados técnicos adicionais"
                />
              </div>
              <SelectField
                label="Aplicar em"
                value={values.entityType ?? "customer"}
                onChange={value => update("entityType", value)}
                options={[
                  { value: "customer", label: "Clientes" },
                  { value: "equipmentStandard", label: "Equipamentos padrão" },
                  {
                    value: "equipmentInstall",
                    label: "Instalação de equipamentos",
                  },
                  { value: "thirdParty", label: "Terceiros" },
                  { value: "person", label: "Pessoas" },
                  { value: "workOrder", label: "Ordens de serviço" },
                  { value: "ticket", label: "Chamados" },
                ]}
              />
              <InputField
                label="Descrição"
                value={values.description ?? ""}
                onChange={value => update("description", value)}
                placeholder="Quando usar este formulário"
              />
              <div className="sm:col-span-2">
                <InputField
                  label="Campos customizados"
                  required
                  value={values.customFields ?? ""}
                  onChange={value => update("customFields", value)}
                  placeholder="garantia|Prazo|select|sim|12 meses,24 meses; observacao|Observação|textarea|não|"
                />
              </div>
            </>
          )}
          {modal === "customer" && (
            <>
              <div className="sm:col-span-2">
                <InputField
                  label="Razão social / nome"
                  required
                  value={values.name ?? ""}
                  onChange={value => update("name", value)}
                  placeholder="Ex.: Novo cliente industrial"
                />
              </div>
              <InputField
                label="Cidade"
                required
                value={values.city ?? ""}
                onChange={value => update("city", value)}
                placeholder="Curitiba"
              />
              <InputField
                label="Estado"
                value={values.state ?? "PR"}
                onChange={value => update("state", value)}
                placeholder="PR"
              />
              <div className="sm:col-span-2">
                <InputField
                  label="Endereço da unidade"
                  value={values.address ?? ""}
                  onChange={value => update("address", value)}
                  placeholder="Rua, número e complemento"
                />
              </div>
              <div className="sm:col-span-2">
                <InputField
                  label="Contato principal"
                  value={values.contact ?? ""}
                  onChange={value => update("contact", value)}
                  placeholder="Nome · telefone · e-mail"
                />
              </div>
            </>
          )}
          {modal === "equipmentStandard" && (
            <>
              <InputField
                label="Código do padrão"
                required
                value={values.code ?? ""}
                onChange={value => update("code", value)}
                placeholder="PAD-PORTA-RAPIDA"
              />
              <InputField
                label="Nome do padrão"
                required
                value={values.name ?? ""}
                onChange={value => update("name", value)}
                placeholder="Porta rápida"
              />
              <InputField
                label="Categoria"
                value={values.category ?? "Porta industrial"}
                onChange={value => update("category", value)}
                placeholder="Porta industrial"
              />
              <InputField
                label="Fabricante"
                value={values.manufacturer ?? "Inovadoor"}
                onChange={value => update("manufacturer", value)}
                placeholder="Inovadoor"
              />
              <InputField
                label="Modelo"
                value={values.model ?? ""}
                onChange={value => update("model", value)}
                placeholder="Inova Speed 400"
              />
              <div className="sm:col-span-2">
                <InputField
                  label="Descrição"
                  value={values.description ?? ""}
                  onChange={value => update("description", value)}
                  placeholder="Uso e características do padrão"
                />
              </div>
            </>
          )}
          {modal === "equipmentInstall" && (
            <>
              <div className="sm:col-span-2">
                <SelectField
                  label="Equipamento padrão"
                  value={values.standardId ?? ""}
                  onChange={value => update("standardId", value)}
                  options={store.equipmentStandards.map(item => ({
                    value: item.id,
                    label: `${item.name} · ${item.code}`,
                  }))}
                />
              </div>
              <div className="sm:col-span-2">
                <SelectField
                  label="Cliente / unidade"
                  value={values.customerId ?? ""}
                  onChange={value => update("customerId", value)}
                  options={store.customers.map(customer => ({
                    value: customer.id,
                    label: `${customer.name} · ${customer.city}`,
                  }))}
                />
              </div>
              <InputField
                label="Número de série"
                required
                value={values.serialNumber ?? ""}
                onChange={value => update("serialNumber", value)}
                placeholder="PR-2026-00045"
              />
              <InputField
                label="Local da instalação"
                required
                value={values.installationLocation ?? ""}
                onChange={value => update("installationLocation", value)}
                placeholder="Doca 05 · Galpão A"
              />
            </>
          )}
          {modal === "link" && (
            <>
              <div className="sm:col-span-2">
                <SelectField
                  label="Unidade instalada"
                  value={values.equipmentId ?? ""}
                  onChange={value => update("equipmentId", value)}
                  options={store.equipment.map(item => ({
                    value: item.id,
                    label: `${item.name} · ${item.serialNumber || item.code}`,
                  }))}
                />
              </div>
              <div className="sm:col-span-2">
                <SelectField
                  label="Cliente / unidade"
                  value={values.customerId ?? ""}
                  onChange={value => update("customerId", value)}
                  options={store.customers.map(customer => ({
                    value: customer.id,
                    label: `${customer.name} · ${customer.city}`,
                  }))}
                />
              </div>
              <InputField
                label="Local da instalação"
                value={values.installationLocation ?? ""}
                onChange={value => update("installationLocation", value)}
                placeholder="Doca 05 · Galpão A"
              />
              <InputField
                label="Número de série"
                value={values.serialNumber ?? ""}
                onChange={value => update("serialNumber", value)}
                placeholder="PR-2026-00045"
              />
            </>
          )}
          {modal === "thirdParty" && (
            <>
              <div className="sm:col-span-2">
                <InputField
                  label="Empresa parceira"
                  required
                  value={values.name ?? ""}
                  onChange={value => update("name", value)}
                  placeholder="Nome do fornecedor"
                />
              </div>
              <InputField
                label="Região de atendimento"
                value={values.region ?? ""}
                onChange={value => update("region", value)}
                placeholder="Sul"
              />
              <InputField
                label="Responsável"
                value={values.contact ?? ""}
                onChange={value => update("contact", value)}
                placeholder="Nome do contato"
              />
            </>
          )}
          {modal === "form" && (
            <>
              <div className="sm:col-span-2">
                <InputField
                  label="Nome do formulário"
                  required
                  value={values.name ?? ""}
                  onChange={value => update("name", value)}
                  placeholder="Ex.: Comissionamento de porta rápida"
                />
              </div>
              <SelectField
                label="Categoria"
                value={values.category ?? "Atendimento"}
                onChange={value => update("category", value)}
                options={["Atendimento", "Instalação"].map(value => ({
                  value,
                  label: value,
                }))}
              />
              <InputField
                label="Campos do formulário"
                value={values.fields ?? "Fotos, assinatura, checklist"}
                onChange={value => update("fields", value)}
                placeholder="Separe os campos por vírgula"
              />
              <div className="sm:col-span-2">
                <InputField
                  label="Descrição e instrução"
                  value={values.description ?? ""}
                  onChange={value => update("description", value)}
                  placeholder="Explique quando usar este template"
                />
              </div>
            </>
          )}
          {modal !== "customForm" &&
            modal !== "customer" &&
            modal !== "equipmentStandard" &&
            modal !== "equipmentInstall" &&
            modal !== "link" &&
            modal !== "thirdParty" &&
            modal !== "form" && (
              <div className="sm:col-span-2">
                <InputField
                  label="Título"
                  required
                  value={values.title ?? ""}
                  onChange={value => update("title", value)}
                  placeholder="Descreva o cadastro"
                />
              </div>
            )}
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              const fakeEvent = {
                preventDefault: () => undefined,
              } as React.FormEvent;
              submit(fakeEvent);
            }}
            className="rounded-xl bg-[#f36f21] px-4 py-2.5 text-xs font-semibold text-white"
          >
            Salvar formulário
          </button>
        </div>
      </div>
    </div>
  );
}

function FormPreview({
  form,
  onClose,
}: {
  form: ServiceForm;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">
              {form.category}
            </span>
            <h2 className="mt-3 font-display text-xl font-bold text-slate-950">
              {form.name}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {form.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {form.fields.map((field, index) => (
            <div
              key={field}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-500">
                {index + 1}
              </span>
              <span className="flex-1 text-xs font-semibold text-slate-700">
                {field}
              </span>
              <span className="text-[10px] font-bold text-orange-600">
                Obrigatório
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-700">
          <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
          Este template será sugerido automaticamente ao criar uma OS do tipo{" "}
          {form.category.toLowerCase()}.
        </div>
        <button
          onClick={onClose}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d1d2e] py-3 text-xs font-bold text-white"
        >
          Usar este formulário <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const createFormMutation = trpc.forms.create.useMutation();
  const createCustomFormMutation = trpc.customForms.create.useMutation();
  const updateCustomFormMutation = trpc.customForms.update.useMutation();
  const duplicateCustomFormMutation = trpc.customForms.duplicate.useMutation();
  const addEvidenceMutation = trpc.evidence.add.useMutation();
  const mondayConnectionMutation =
    trpc.integrations.monday.connect.useMutation();
  const equipmentStandardMutation =
    trpc.equipment.standards.create.useMutation();
  const equipmentInstallMutation = trpc.equipment.install.useMutation();
  const equipmentLinkMutation = trpc.equipment.linkCustomer.useMutation();
  const notificationsReadMutation = trpc.notifications.markRead.useMutation();
  const notificationsAllReadMutation =
    trpc.notifications.markAllRead.useMutation();
  const authenticated =
    typeof window !== "undefined" &&
    Boolean(window.sessionStorage.getItem("manus-cookie"));
  const [activeRole, setActiveRole] = useState<RoleKey>("gestao");
  const [activeSection, setActiveSection] = useState<SectionKey>("visao");
  const [showLogin, setShowLogin] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<ModalKey>(null);
  const [editingCustomForm, setEditingCustomForm] =
    useState<CustomFormDefinition | null>(null);
  const [previewForm, setPreviewForm] = useState<ServiceForm | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n-1",
      title: "OS-2026-0842 em campo",
      detail: "Marcos Lima iniciou o atendimento há 12 min.",
      tone: "blue",
      read: false,
    },
    {
      id: "n-2",
      title: "Chamado recebido",
      detail: "FrioSul Distribuição aguarda triagem.",
      tone: "orange",
      read: false,
    },
    {
      id: "n-3",
      title: "Sincronização concluída",
      detail: "Lote de 10 portas atualizado no monday.com.",
      tone: "green",
      read: true,
    },
  ]);
  const remoteNotifications = trpc.notifications.list.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });
  const [store, setStore] = useState<DemoStore>(() => {
    if (typeof window === "undefined") return seedStore;
    try {
      const saved = window.localStorage.getItem("inovadoor-field-ops-store");
      return saved ? { ...seedStore, ...JSON.parse(saved) } : seedStore;
    } catch {
      return seedStore;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(
      "inovadoor-field-ops-store",
      JSON.stringify(store)
    );
  }, [store]);
  useEffect(() => {
    if (!authenticated || !remoteNotifications.data) return;
    setNotifications(
      remoteNotifications.data.map(item => ({
        id: String(item.id),
        title: item.title,
        detail: item.detail,
        tone: item.tone,
        read: Boolean(item.readAt),
      }))
    );
  }, [authenticated, remoteNotifications.data]);
  useEffect(() => {
    const mandatoryWorkOrderForm = seedStore.customForms.find(
      form => form.entityType === "workOrder"
    );
    if (
      mandatoryWorkOrderForm &&
      !store.customForms.some(form => form.entityType === "workOrder")
    )
      setStore(current => ({
        ...current,
        customForms: [...current.customForms, mandatoryWorkOrderForm],
      }));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const currentNav = useMemo(
    () => navItems.find(item => item.key === activeSection) ?? navItems[0],
    [activeSection]
  );
  const unreadNotifications = notifications.filter(item => !item.read).length;
  const allowedSections = useMemo(() => {
    if (activeRole === "pessoas")
      return new Set<SectionKey>(["visao", "pessoas", "relatorios"]);
    if (activeRole === "terceiros")
      return new Set<SectionKey>(["visao", "ordens", "agenda", "assistencia"]);
    return new Set<SectionKey>(navItems.map(item => item.key));
  }, [activeRole]);
  const visibleNavItems = navItems.filter(item =>
    allowedSections.has(item.key)
  );
  const roleLabel =
    roles.find(item => item.key === activeRole)?.label ?? "Gestão Inovadoor";
  const navigate = (section: SectionKey) => {
    if (!allowedSections.has(section)) {
      setToast("Este módulo não está disponível para o perfil atual.");
      return;
    }
    setActiveSection(section);
    setMobileNavOpen(false);
  };
  const openModal = (key: Exclude<ModalKey, null>) => {
    if (key !== "customForm") setEditingCustomForm(null);
    setModal(key);
  };
  const editCustomForm = (form: CustomFormDefinition) => {
    setEditingCustomForm(form);
    setModal("customForm");
  };
  const duplicateCustomForm = async (form: CustomFormDefinition) => {
    const copy = {
      ...form,
      id: makeId("custom"),
      name: `${form.name} (cópia)`,
    };
    setStore(current => ({
      ...current,
      customForms: [copy, ...current.customForms],
    }));
    if (
      window.sessionStorage.getItem("manus-cookie") &&
      /^\d+$/.test(form.id)
    ) {
      try {
        await duplicateCustomFormMutation.mutateAsync({
          id: Number(form.id),
          name: copy.name,
        });
      } catch {
        /* fallback local */
      }
    }
    setToast("Formulário duplicado. Você pode editar os campos da cópia.");
  };
  const deactivateCustomForm = async (form: CustomFormDefinition) => {
    setStore(current => ({
      ...current,
      customForms: current.customForms.filter(item => item.id !== form.id),
    }));
    if (
      window.sessionStorage.getItem("manus-cookie") &&
      /^\d+$/.test(form.id)
    ) {
      try {
        await updateCustomFormMutation.mutateAsync({
          id: Number(form.id),
          active: 0,
        });
      } catch {
        /* fallback local */
      }
    }
    setToast("Formulário desativado e removido dos cadastros ativos.");
  };

  const saveModal = async (payload: Record<string, string>) => {
    const now = "31 ago 2026";
    if (modal === "customer") {
      const item: Customer = {
        id: makeId("cli"),
        name: payload.name || "Novo cliente",
        city: payload.city || "Curitiba",
        state: payload.state || "PR",
        address: payload.address || "Endereço pendente",
        contact: payload.contact || "Contato pendente",
        assets: 0,
        open: 0,
      };
      setStore(current => ({
        ...current,
        customers: [...current.customers, item],
      }));
      setToast("Cliente cadastrado e pronto para receber equipamentos.");
    }
    if (modal === "equipmentStandard") {
      let id = makeId("std");
      if (window.sessionStorage.getItem("manus-cookie")) {
        try {
          const created = await equipmentStandardMutation.mutateAsync({
            code: payload.code,
            name: payload.name,
            category: payload.category,
            manufacturer: payload.manufacturer,
            model: payload.model,
            description: payload.description,
          });
          id = String(created?.id ?? id);
        } catch {
          // O modo local mantém o cadastro disponível para demonstração.
        }
      }
      const item: EquipmentStandard = {
        id,
        code: payload.code || "PAD-NOVO",
        name: payload.name || "Novo padrão",
        category: payload.category || "Porta industrial",
        manufacturer: payload.manufacturer || "Inovadoor",
        model: payload.model || "Modelo pendente",
        description: payload.description || "Descrição pendente",
      };
      setStore(current => ({
        ...current,
        equipmentStandards: [...current.equipmentStandards, item],
      }));
      setToast(
        "Equipamento padrão cadastrado. Agora instale uma unidade no cliente."
      );
    }
    if (modal === "equipmentInstall") {
      const standard = store.equipmentStandards.find(
        item => item.id === payload.standardId
      );
      const serialNumber = payload.serialNumber || "SERIAL-PENDENTE";
      if (store.equipment.some(item => item.serialNumber === serialNumber)) {
        setToast("Este número de série já está cadastrado.");
        return;
      }
      if (
        window.sessionStorage.getItem("manus-cookie") &&
        /^\d+$/.test(payload.standardId || "") &&
        /^\d+$/.test(payload.customerId || "")
      ) {
        try {
          await equipmentInstallMutation.mutateAsync({
            catalogId: Number(payload.standardId),
            customerId: Number(payload.customerId),
            serialNumber,
            installationLocation:
              payload.installationLocation || "Local pendente",
            state:
              payload.state === "Manutenção"
                ? "manutencao"
                : payload.state === "Atenção"
                  ? "atencao"
                  : "operacional",
            notes: payload.notes,
          });
        } catch {
          // O modo local mantém o vínculo disponível para demonstração.
        }
      }
      const item: Equipment = {
        id: makeId("eq"),
        code: `INST-${serialNumber}`
          .replace(/[^A-Za-z0-9-]/g, "-")
          .slice(0, 80),
        name: standard?.name || "Equipamento instalado",
        model: standard?.model || "Modelo pendente",
        customerId: payload.customerId || "",
        standardId: payload.standardId || "",
        serialNumber,
        installationLocation: payload.installationLocation || "Local pendente",
        state: (payload.state as Equipment["state"]) || "Operacional",
        lastMaintenance: now,
      };
      setStore(current => ({
        ...current,
        equipment: [...current.equipment, item],
      }));
      setToast(
        `${item.name} instalado e vinculado ao cliente pelo serial ${serialNumber}.`
      );
    }
    if (modal === "link") {
      if (
        window.sessionStorage.getItem("manus-cookie") &&
        /^\d+$/.test(payload.equipmentId || "") &&
        /^\d+$/.test(payload.customerId || "")
      ) {
        try {
          await equipmentLinkMutation.mutateAsync({
            equipmentId: Number(payload.equipmentId),
            customerId: Number(payload.customerId),
            installationLocation: payload.installationLocation,
            serialNumber: payload.serialNumber,
          });
        } catch {
          /* fallback local */
        }
      }
      setStore(current => ({
        ...current,
        equipment: current.equipment.map(item =>
          item.id === payload.equipmentId
            ? {
                ...item,
                customerId: payload.customerId,
                installationLocation:
                  payload.installationLocation || item.installationLocation,
                serialNumber: payload.serialNumber || item.serialNumber,
              }
            : item
        ),
      }));
      setToast(
        "Vínculo equipamento–cliente atualizado com local e identificação."
      );
    }
    if (modal === "thirdParty") {
      const item: ThirdParty = {
        id: makeId("tp"),
        name: payload.name || "Novo fornecedor",
        region: payload.region || "A definir",
        contact: payload.contact || "Contato pendente",
        open: 0,
        sla: Number(payload.sla || 90),
        status: (payload.status as ThirdParty["status"]) || "Em revisão",
      };
      setStore(current => ({
        ...current,
        thirdParties: [...current.thirdParties, item],
      }));
      setToast("Terceiro cadastrado para homologação.");
    }
    if (modal === "workOrder") {
      const item: WorkOrder = {
        id: `OS-2026-${Math.floor(1000 + Math.random() * 8999)}`,
        customerId: payload.customerId,
        equipmentId: payload.equipmentId,
        title: payload.title || "Novo atendimento",
        type: payload.type || "Manutenção corretiva",
        responsible: payload.responsible || "Equipe de campo",
        thirdPartyId: payload.thirdPartyId || "",
        formId: payload.formId || store.forms[0]?.id || "",
        status: "Agendada",
        statusKey: "scheduled",
        priority: (payload.priority as WorkOrder["priority"]) || "Média",
        scheduled: payload.scheduled || "A definir",
        source: "gestao",
      };
      setStore(current => ({
        ...current,
        workOrders: [item, ...current.workOrders],
      }));
      setToast(`${item.id} criada com formulário vinculado.`);
    }
    if (modal === "ticket") {
      const ticket: Ticket = {
        id: `CH-${Math.floor(1000 + Math.random() * 8999)}`,
        customerId: store.customers[0]?.id ?? "",
        equipmentId: payload.equipmentId || "",
        title: payload.title || "Chamado do cliente",
        description: payload.description || "Descrição pendente",
        priority: (payload.priority as Ticket["priority"]) || "Média",
        status: "Novo",
        created: "Agora",
      };
      const order: WorkOrder = {
        id: `OS-2026-${Math.floor(1000 + Math.random() * 8999)}`,
        customerId: ticket.customerId,
        equipmentId: ticket.equipmentId,
        title: ticket.title,
        type: "Solicitação do cliente",
        responsible: "Triagem Inovadoor",
        thirdPartyId: "",
        formId: store.forms[0]?.id || "",
        status: "Em aprovação",
        statusKey: "approval",
        priority: ticket.priority,
        scheduled: "Aguardando triagem",
        source: "cliente",
      };
      setStore(current => ({
        ...current,
        tickets: [ticket, ...current.tickets],
        workOrders: [order, ...current.workOrders],
      }));
      setToast(`${ticket.id} recebido e encaminhado para a triagem.`);
    }
    if (modal === "form") {
      const fields = (payload.fields || "Fotos, assinatura, checklist")
        .split(",")
        .map(field => field.trim())
        .filter(Boolean);
      const form: ServiceForm = {
        id: makeId("form"),
        name: payload.name || "Novo formulário",
        category:
          (payload.category as ServiceForm["category"]) || "Atendimento",
        description:
          payload.description || "Template configurado pela Gestão Inovadoor.",
        fields,
        used: 0,
        updated: "Agora",
      };
      setStore(current => ({ ...current, forms: [form, ...current.forms] }));
      try {
        if (window.sessionStorage.getItem("manus-cookie")) {
          createFormMutation.mutate(
            {
              name: form.name,
              category:
                form.category === "Instalação" ? "instalacao" : "atendimento",
              description: form.description,
              fields,
            },
            { onError: () => undefined }
          );
        }
      } catch {
        // O modo demonstrativo continua funcionando quando não há sessão.
      }
      setToast("Formulário gerado e disponível para novas OS.");
    }
    if (modal === "customForm") {
      const fields: CustomField[] = (
        payload.customFields || "campo|Campo adicional|text|não|"
      )
        .split(";")
        .map(raw => raw.trim())
        .filter(Boolean)
        .map((raw, index) => {
          const [
            key = `campo_${index + 1}`,
            label = key,
            type = "text",
            required = "não",
            options = "",
          ] = raw.split("|").map(value => value.trim());
          const safeType = (
            [
              "text",
              "textarea",
              "number",
              "date",
              "select",
              "checkbox",
            ] as const
          ).includes(type as CustomField["type"])
            ? (type as CustomField["type"])
            : "text";
          const [conditionKey, conditionEquals] = (raw.split("|")[5] || "")
            .split("=")
            .map(value => value.trim());
          return {
            key,
            label,
            type: safeType,
            required:
              required.toLowerCase() === "sim" ||
              required.toLowerCase() === "true",
            options: options
              ? options
                  .split(",")
                  .map(value => value.trim())
                  .filter(Boolean)
              : undefined,
            condition:
              conditionKey && conditionEquals
                ? { fieldKey: conditionKey, equals: conditionEquals }
                : undefined,
          };
        });
      const definition: CustomFormDefinition = {
        id: makeId("custom"),
        entityType:
          (payload.entityType as CustomFormDefinition["entityType"]) ||
          "customer",
        name: payload.name || "Formulário customizado",
        description:
          payload.description || "Campos configurados pela Gestão Inovadoor.",
        fields,
      };
      if (payload.editId) {
        setStore(current => ({
          ...current,
          customForms: current.customForms.map(item =>
            item.id === payload.editId ? definition : item
          ),
        }));
        if (
          window.sessionStorage.getItem("manus-cookie") &&
          /^\d+$/.test(payload.editId)
        ) {
          try {
            await updateCustomFormMutation.mutateAsync({
              id: Number(payload.editId),
              name: definition.name,
              description: definition.description,
              fields,
            });
          } catch {
            /* fallback local */
          }
        }
        setToast(`Formulário ${definition.name} atualizado.`);
      } else {
        setStore(current => ({
          ...current,
          customForms: [definition, ...current.customForms],
        }));
        if (window.sessionStorage.getItem("manus-cookie")) {
          try {
            await createCustomFormMutation.mutateAsync({
              entityType: definition.entityType,
              name: definition.name,
              description: definition.description,
              fields,
            });
          } catch {
            /* fallback local */
          }
        }
        setToast(
          `Formulário de ${definition.name} criado com ${fields.length} campos customizados.`
        );
      }
    }
    setModal(null);
  };

  if (showLogin)
    return (
      <LoginPanel
        role={activeRole}
        setRole={setActiveRole}
        onEnter={() => {
          setShowLogin(false);
          if (activeRole === "campo") return;
          if (activeRole === "cliente") return;
          setActiveSection(
            activeRole === "pessoas"
              ? "pessoas"
              : activeRole === "terceiros"
                ? "terceiros"
                : "visao"
          );
          setToast(
            `Acesso iniciado: ${roles.find(role => role.key === activeRole)?.label}`
          );
        }}
      />
    );
  if (activeRole === "campo")
    return (
      <FieldPwa
        requiredFields={store.customForms
          .find(form => form.entityType === "workOrder")
          ?.fields.filter(field => field.required)}
        onExit={() => setShowLogin(true)}
        onEvidence={async payload => {
          try {
            if (!window.sessionStorage.getItem("manus-cookie")) return false;
            await addEvidenceMutation.mutateAsync({
              workOrderExternalId: "OS-2026-0842",
              ...payload,
            });
            return true;
          } catch {
            return false;
          }
        }}
      />
    );
  if (activeRole === "cliente")
    return (
      <ClientPortal
        store={store}
        onExit={() => setShowLogin(true)}
        onOpenTicket={() => openModal("ticket")}
      />
    );

  const renderSection = () => {
    if (!allowedSections.has(activeSection))
      return (
        <Dashboard
          store={store}
          onNavigate={navigate}
          onNewTicket={() => openModal("ticket")}
        />
      );
    switch (activeSection) {
      case "visao":
        return (
          <Dashboard
            store={store}
            onNavigate={navigate}
            onNewTicket={() => openModal("ticket")}
          />
        );
      case "ordens":
        return (
          <OrdersPage store={store} onAdd={() => openModal("workOrder")} />
        );
      case "agenda":
        return (
          <CalendarPage store={store} onAdd={() => openModal("workOrder")} />
        );
      case "planejamento":
        return <OperationsDashboard mode="installation" role={activeRole} />;
      case "assistencia":
        return <OperationsDashboard mode="assistance" role={activeRole} />;
      case "clientes":
        return (
          <CustomersPage store={store} onAdd={() => openModal("customer")} />
        );
      case "equipamentos":
        return (
          <EquipmentPage
            store={store}
            onAddStandard={() => openModal("equipmentStandard")}
            onInstall={() => openModal("equipmentInstall")}
            onLink={() => openModal("link")}
          />
        );
      case "formularios":
        return (
          <FormsPage
            store={store}
            onAdd={() => openModal("form")}
            onAddCustom={() => openModal("customForm")}
            onEditCustom={editCustomForm}
            onDuplicateCustom={duplicateCustomForm}
            onDeactivateCustom={deactivateCustomForm}
            onPreview={setPreviewForm}
          />
        );
      case "pessoas":
        return (
          <PeoplePage
            store={store}
            onAdd={() => setToast("Convite de pessoa preparado para envio.")}
          />
        );
      case "terceiros":
        return (
          <ThirdPartiesPage
            store={store}
            onAdd={() => openModal("thirdParty")}
          />
        );
      case "estoque":
        return (
          <StockPage
            onAdd={() =>
              setToast("Movimentação de estoque preparada para lançamento.")
            }
          />
        );
      case "relatorios":
        return <ReportsPage />;
      case "integracoes":
        return (
          <IntegrationsPage
            onPersist={async config => {
              try {
                if (!window.sessionStorage.getItem("manus-cookie"))
                  return false;
                await mondayConnectionMutation.mutateAsync(config);
                return true;
              } catch {
                return false;
              }
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={cx(
            "fixed inset-y-0 left-0 z-40 w-[272px] border-r border-white/10 bg-[#0d1d2e] text-white transition-transform lg:static lg:translate-x-0",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-[78px] items-center justify-between border-b border-white/10 px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/20">
                  <Factory className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold tracking-wide">
                    INOVADOOR
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                    Field Ops
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-white/10 px-4 py-4">
              <button
                onClick={() => setShowLogin(true)}
                className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left transition hover:bg-white/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-400/15 text-xs font-bold text-orange-300">
                  BI
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-white">
                    {roleLabel}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-slate-400">
                    Workspace Paraná
                  </span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-5">
              <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Operação
              </p>
              <div className="space-y-1">
                {visibleNavItems
                  .filter(item =>
                    [
                      "visao",
                      "ordens",
                      "agenda",
                      "planejamento",
                      "assistencia",
                      "clientes",
                      "equipamentos",
                      "formularios",
                    ].includes(item.key)
                  )
                  .map(item => (
                    <button
                      key={item.key}
                      onClick={() => navigate(item.key)}
                      className={cx(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition",
                        activeSection === item.key
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/15"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon
                        className={cx(
                          "h-4 w-4",
                          activeSection === item.key
                            ? "text-orange-100"
                            : "text-slate-500 group-hover:text-slate-300"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cx(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                            activeSection === item.key
                              ? "bg-white/20 text-white"
                              : "bg-white/10 text-slate-400"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
              <p className="mb-3 mt-8 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Recursos
              </p>
              <div className="space-y-1">
                {visibleNavItems
                  .filter(item =>
                    [
                      "pessoas",
                      "terceiros",
                      "estoque",
                      "relatorios",
                      "integracoes",
                    ].includes(item.key)
                  )
                  .map(item => (
                    <button
                      key={item.key}
                      onClick={() => navigate(item.key)}
                      className={cx(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition",
                        activeSection === item.key
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/15"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon
                        className={cx(
                          "h-4 w-4",
                          activeSection === item.key
                            ? "text-orange-100"
                            : "text-slate-500 group-hover:text-slate-300"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cx(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                            activeSection === item.key
                              ? "bg-white/20 text-white"
                              : "bg-white/10 text-slate-400"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </nav>
            <div className="border-t border-white/10 p-4">
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-400/5 px-3 py-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.1)]" />
                <span className="text-[10px] font-medium text-emerald-200">
                  Todos os serviços operacionais
                </span>
              </div>
              <button
                onClick={() => setShowLogin(true)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Trocar perfil
              </button>
            </div>
          </div>
        </aside>
        {mobileNavOpen && (
          <button
            aria-label="Fechar menu"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          />
        )}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[78px] items-center justify-between border-b border-slate-200/80 bg-[#f5f7fb]/90 px-4 backdrop-blur sm:px-7 lg:px-9">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Workspace Paraná</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-semibold text-slate-600">
                    {currentNav.label}
                  </span>
                </div>
                <p className="mt-1 hidden text-[11px] text-slate-400 sm:block">
                  Atualizado em tempo real · dados demonstrativos persistidos
                  neste navegador
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <button
                  aria-label="Abrir notificações"
                  onClick={() => setNotificationsOpen(value => !value)}
                  className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-orange-600"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white ring-2 ring-[#f5f7fb]">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Notificações
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Atualizações da operação
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setNotifications(current =>
                            current.map(item => ({ ...item, read: true }))
                          );
                          if (authenticated) {
                            void notificationsAllReadMutation.mutateAsync();
                          }
                        }}
                        className="text-[11px] font-semibold text-orange-600 hover:text-orange-700"
                      >
                        Marcar lidas
                      </button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setNotifications(current =>
                              current.map(entry =>
                                entry.id === item.id
                                  ? { ...entry, read: true }
                                  : entry
                              )
                            );
                            if (authenticated && /^\d+$/.test(item.id)) {
                              void notificationsReadMutation.mutateAsync({
                                id: Number(item.id),
                              });
                            }
                          }}
                          className="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50"
                        >
                          <span
                            className={cx(
                              "mt-1 h-2 w-2 shrink-0 rounded-full",
                              item.tone === "orange"
                                ? "bg-orange-500"
                                : item.tone === "blue"
                                  ? "bg-blue-500"
                                  : "bg-emerald-500"
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className={cx(
                                "block text-xs font-semibold",
                                item.read ? "text-slate-600" : "text-slate-900"
                              )}
                            >
                              {item.title}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">
                              {item.detail}
                            </span>
                          </span>
                          {!item.read && (
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden h-7 w-px bg-slate-200 sm:block" />
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2 transition hover:bg-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d1d2e] text-[10px] font-bold text-orange-300">
                  BI
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-bold text-slate-700">
                    Beatriz Inovadoor
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Administradora
                  </span>
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
              </button>
            </div>
          </header>
          <div className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9">
            {renderSection()}
          </div>
        </main>
      </div>
      {modal && (
        <CreateModal
          modal={modal}
          store={store}
          editingCustomForm={editingCustomForm}
          onClose={() => {
            setModal(null);
            setEditingCustomForm(null);
          }}
          onSave={saveModal}
        />
      )}
      {previewForm && (
        <FormPreview form={previewForm} onClose={() => setPreviewForm(null)} />
      )}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-center gap-3 rounded-2xl bg-[#0d1d2e] px-4 py-3 text-xs font-semibold text-white shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          {toast}
        </div>
      )}
    </div>
  );
}
