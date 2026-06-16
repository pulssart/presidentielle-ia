import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  ArrowUp,
  ChartNoAxesColumnIncreasing,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import ranking from "./data/ranking.json";
import "./styles.css";

const statusLabels = {
  déclaré: "Déclaré",
  "primaire gauche": "Primaire",
  probable: "Probable",
  possible: "Possible",
  incertain: "Incertain",
};

const programLabels = {
  oui: "Dans le programme",
  partiel: "Présent, incomplet",
  faible: "Traces faibles",
  "non établi": "Non établi",
};

const programVariants = {
  oui: "default",
  partiel: "secondary",
  faible: "outline",
  "non établi": "destructive",
};

const aiUseLabels = {
  reconnu: "Usage reconnu",
  "équipe probable": "Équipe probable",
  "non déclaré": "Non déclaré",
  "non trouvé": "Non trouvé",
};

const aiUseVariants = {
  reconnu: "default",
  "équipe probable": "secondary",
  "non déclaré": "outline",
  "non trouvé": "outline",
};

const programCount = ranking.candidates.filter((candidate) => candidate.programStatus === "oui").length;
const aiUseCount = ranking.candidates.filter((candidate) => candidate.aiUseStatus === "reconnu").length;
const sourceCount = ranking.candidates.reduce((count, item) => count + item.sources.length, 0);

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function ProgramBadge({ value }) {
  return (
    <Badge
      variant={programVariants[value] ?? "outline"}
      className={cn(value === "oui" && "bg-primary/90")}
    >
      {programLabels[value] ?? value}
    </Badge>
  );
}

function AiUseBadge({ value }) {
  return (
    <Badge
      variant={aiUseVariants[value] ?? "outline"}
      className={cn(value === "reconnu" && "bg-primary/90")}
    >
      {aiUseLabels[value] ?? value}
    </Badge>
  );
}

function TrendIcon({ trend }) {
  if (trend === "up") return <ArrowUp aria-label="Tendance en hausse" />;
  if (trend === "down") return <ArrowDown aria-label="Tendance en baisse" />;
  return <span className="h-px w-3 bg-muted-foreground" aria-label="Tendance stable" />;
}

function Score({ value, trend, compact = false }) {
  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2")}>
      <div className="flex min-w-12 items-center gap-1.5 font-heading text-base font-semibold">
        <span>{value}</span>
        <TrendIcon trend={trend} />
      </div>
      <Progress value={value} className="h-2 min-w-24 bg-muted [&_[data-slot=progress-indicator]]:bg-primary" />
    </div>
  );
}

function CandidateAvatar({ candidate }) {
  const initials = candidate.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <span className="relative inline-flex size-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
      <span className="grid size-full place-items-center font-mono text-xs font-medium text-muted-foreground">
        {initials}
      </span>
      {candidate.photoUrl ? (
        <img
          src={candidate.photoUrl}
          alt={`Portrait de ${candidate.name}`}
          className="absolute inset-0 size-full object-cover"
          loading="eager"
          decoding="async"
        />
      ) : null}
    </span>
  );
}

function SourceList({ sources }) {
  return (
    <div className="flex flex-col gap-2">
      {sources.map((source) => (
        <Button key={source.url} variant="outline" size="sm" asChild className="h-auto justify-start py-2">
          <a href={source.url} target="_blank" rel="noreferrer">
            <FileText data-icon="inline-start" />
            <span className="truncate">{source.title}</span>
            <ExternalLink data-icon="inline-end" />
          </a>
        </Button>
      ))}
    </div>
  );
}

function CandidateTable({ candidates, sorted, selectedName, onSelect }) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-28 pl-5">Rang</TableHead>
            <TableHead>Candidat</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Programme</TableHead>
            <TableHead>Usage IA</TableHead>
            <TableHead className="w-56">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow
              key={candidate.name}
              data-state={selectedName === candidate.name ? "selected" : undefined}
              className="cursor-pointer transition duration-300 data-[state=selected]:bg-primary/5"
              onClick={() => onSelect(candidate.name)}
            >
              <TableCell className="pl-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg border bg-background font-mono text-sm font-medium">
                    {sorted.findIndex((item) => item.name === candidate.name) + 1}
                  </span>
                  <CandidateAvatar candidate={candidate} />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{candidate.name}</span>
                  <span className="text-muted-foreground">{candidate.party}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{statusLabels[candidate.status] ?? candidate.status}</Badge>
              </TableCell>
              <TableCell>
                <ProgramBadge value={candidate.programStatus} />
              </TableCell>
              <TableCell>
                <AiUseBadge value={candidate.aiUseStatus} />
              </TableCell>
              <TableCell>
                <Score value={candidate.score} trend={candidate.trend} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CandidateCards({ candidates, sorted, selectedName, onSelect }) {
  return (
    <div className="flex flex-col gap-2 md:hidden">
      {candidates.map((candidate) => (
        <button
          key={candidate.name}
          type="button"
          onClick={() => onSelect(candidate.name)}
          className={cn(
            "rounded-xl border bg-card p-3 text-left text-card-foreground transition duration-300 active:scale-[0.99]",
            selectedName === candidate.name && "border-primary/30 bg-primary/5"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-lg border bg-background font-medium">
                {sorted.findIndex((item) => item.name === candidate.name) + 1}
              </span>
              <CandidateAvatar candidate={candidate} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{candidate.name}</div>
              <div className="text-sm text-muted-foreground">{candidate.party}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{statusLabels[candidate.status] ?? candidate.status}</Badge>
                <ProgramBadge value={candidate.programStatus} />
                <AiUseBadge value={candidate.aiUseStatus} />
              </div>
              <div className="mt-3">
                <Score value={candidate.score} trend={candidate.trend} compact />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function EvidencePanel({ candidate }) {
  return (
    <Card className="overflow-hidden border-primary/10 bg-card/95 shadow-[0_24px_70px_-42px_rgba(25,74,48,0.35)] lg:sticky lg:top-4">
      <div className="h-1 bg-primary" />
      <CardHeader>
        <div>
          <CardDescription>Dossier candidat</CardDescription>
          <CardTitle className="text-2xl">{candidate.name}</CardTitle>
        </div>
        <CardAction>
          <div className="text-right">
            <div className="font-heading text-4xl font-semibold leading-none">{candidate.score}</div>
            <div className="text-xs text-muted-foreground">/100</div>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/60 p-3">
            <div className="text-xs text-muted-foreground">Statut</div>
            <div className="mt-1 font-medium">{statusLabels[candidate.status] ?? candidate.status}</div>
          </div>
          <div className="rounded-lg border bg-muted/60 p-3">
            <div className="text-xs text-muted-foreground">Programme IA</div>
            <div className="mt-1 font-medium">{programLabels[candidate.programStatus] ?? candidate.programStatus}</div>
          </div>
          <div className="rounded-lg border bg-muted/60 p-3 sm:col-span-1">
            <div className="text-xs text-muted-foreground">Usage IA</div>
            <div className="mt-1 font-medium">{aiUseLabels[candidate.aiUseStatus] ?? candidate.aiUseStatus}</div>
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="font-medium">Usage IA déclaré</h3>
          <p className="text-sm leading-6 text-muted-foreground">{candidate.aiUseEvidence}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-medium">Pourquoi ce score</h3>
          <p className="text-sm leading-6 text-muted-foreground">{candidate.evidence}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-medium">Point faible</h3>
          <p className="text-sm leading-6 text-muted-foreground">{candidate.risks}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-medium">Sources</h3>
          <SourceList sources={candidate.sources} />
        </section>
      </CardContent>
    </Card>
  );
}

function Methodology() {
  return (
    <Card id="methode" className="bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck />
          Méthode
        </CardTitle>
        <CardDescription>{ranking.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ranking.methodology.map((item) => (
          <div key={item.name} className="grid grid-cols-[1fr_auto] gap-4 rounded-lg border bg-muted/45 p-3">
            <div className="flex flex-col gap-1">
              <span className="font-medium">{item.name}</span>
              <span className="text-sm leading-5 text-muted-foreground">{item.description}</span>
            </div>
            <Badge variant="secondary">{item.weight}%</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function App() {
  const [query, setQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [selectedName, setSelectedName] = useState(ranking.candidates[0]?.name);

  const sorted = useMemo(
    () => [...ranking.candidates].sort((a, b) => b.score - a.score),
    []
  );

  const filtered = useMemo(() => {
    return sorted.filter((candidate) => {
      const text = `${candidate.name} ${candidate.party} ${candidate.status}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesProgram = programFilter === "all" || candidate.programStatus === programFilter;
      return matchesQuery && matchesProgram;
    });
  }, [query, programFilter, sorted]);

  const selected =
    filtered.find((candidate) => candidate.name === selectedName) ?? filtered[0] ?? sorted[0];

  return (
    <main className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_16%_12%,rgba(38,90,61,0.13),transparent_32%),radial-gradient(circle_at_92%_20%,rgba(165,142,82,0.12),transparent_28%)]" />

      <section className="grid items-end gap-6 py-3 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-6">
        <div className="flex max-w-4xl flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-primary shadow-[0_0_0_6px_rgba(38,90,61,0.10)]" />
            Classement quotidien, sources visibles
          </div>
          <h1 className="max-w-5xl font-heading text-5xl font-semibold leading-none tracking-tight text-balance sm:text-6xl lg:text-[4.85rem]">
            Qui parle sérieusement d'IA pour 2027 ?
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            Classement sourcé des candidats français selon leur compréhension de l'IA,
            la place du sujet dans leur programme et la précision de leurs mesures.
          </p>
        </div>
        <Card className="border-primary/10 bg-card/85 shadow-[0_24px_80px_-45px_rgba(25,74,48,0.45)]">
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <CalendarClock />
              <div>
                <div className="text-xs text-muted-foreground">Dernière analyse</div>
                <div className="font-medium">{formatDate(ranking.generatedAt)}</div>
              </div>
              <RefreshCw className="animate-[slow-spin_10s_linear_infinite]" />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="font-heading text-2xl font-semibold">{ranking.candidates.length}</div>
                <div className="text-xs text-muted-foreground">candidats</div>
              </div>
              <div>
                <div className="font-heading text-2xl font-semibold">{programCount}</div>
                <div className="text-xs text-muted-foreground">programmes IA</div>
              </div>
              <div>
                <div className="font-heading text-2xl font-semibold">{aiUseCount}</div>
                <div className="text-xs text-muted-foreground">usage reconnu</div>
              </div>
              <div>
                <div className="font-heading text-2xl font-semibold">{sourceCount}</div>
                <div className="text-xs text-muted-foreground">sources</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="classement" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_410px]">
        <Card className="overflow-hidden bg-card/95 shadow-[0_24px_70px_-45px_rgba(24,24,22,0.22)]">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="bg-background/70 pl-9"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Chercher un candidat"
                />
              </div>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Tous les programmes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Tous les programmes</SelectItem>
                    <SelectItem value="oui">IA dans le programme</SelectItem>
                    <SelectItem value="partiel">Partiel</SelectItem>
                    <SelectItem value="faible">Faible</SelectItem>
                    <SelectItem value="non établi">Non établi</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0 md:px-0">
            {filtered.length > 0 ? (
              <>
                <CandidateTable
                  candidates={filtered}
                  sorted={sorted}
                  selectedName={selected?.name}
                  onSelect={setSelectedName}
                />
                <div className="p-3">
                  <CandidateCards
                    candidates={filtered}
                    sorted={sorted}
                    selectedName={selected?.name}
                    onSelect={setSelectedName}
                  />
                </div>
              </>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                <ChartNoAxesColumnIncreasing className="text-muted-foreground" />
                <div>
                  <div className="font-medium">Aucun candidat trouvé</div>
                  <div className="mt-1 text-sm text-muted-foreground">Change la recherche ou le filtre programme.</div>
                </div>
                <Button variant="outline" onClick={() => { setQuery(""); setProgramFilter("all"); }}>
                  Réinitialiser
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {selected && <EvidencePanel candidate={selected} />}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
        <Methodology />
        <Card className="bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 />
              Automatisation
            </CardTitle>
            <CardDescription>
              Le cron GitHub Actions relance chaque jour une recherche web avec OpenAI,
              détecte les nouveaux candidats, réévalue les scores et conserve les sources.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <code className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
              npm run update:ranking
            </code>
            <code className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
              .github/workflows/update-ranking.yml
            </code>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <footer id="sources" className="flex flex-col justify-between gap-2 pb-4 text-sm text-muted-foreground sm:flex-row">
        <span>Analyse neutre, sourcée, perfectible.</span>
        <span>{ranking.candidates.reduce((count, item) => count + item.sources.length, 0)} sources indexées</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
