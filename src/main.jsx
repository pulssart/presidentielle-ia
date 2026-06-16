import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
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

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function ProgramBadge({ value }) {
  return (
    <Badge variant={programVariants[value] ?? "outline"}>
      {programLabels[value] ?? value}
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
      <Progress value={value} className="h-2 min-w-24" />
    </div>
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
          <TableRow>
            <TableHead className="w-16">Rang</TableHead>
            <TableHead>Candidat</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Programme</TableHead>
            <TableHead className="w-56">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow
              key={candidate.name}
              data-state={selectedName === candidate.name ? "selected" : undefined}
              className="cursor-pointer"
              onClick={() => onSelect(candidate.name)}
            >
              <TableCell>
                <span className="inline-flex size-8 items-center justify-center rounded-lg border bg-background font-medium">
                  {sorted.findIndex((item) => item.name === candidate.name) + 1}
                </span>
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
            "rounded-xl border bg-card p-3 text-left text-card-foreground transition-colors",
            selectedName === candidate.name && "bg-muted"
          )}
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background font-medium">
              {sorted.findIndex((item) => item.name === candidate.name) + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{candidate.name}</div>
              <div className="text-sm text-muted-foreground">{candidate.party}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{statusLabels[candidate.status] ?? candidate.status}</Badge>
                <ProgramBadge value={candidate.programStatus} />
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
    <Card className="lg:sticky lg:top-4">
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
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground">Statut</div>
            <div className="mt-1 font-medium">{statusLabels[candidate.status] ?? candidate.status}</div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground">Programme IA</div>
            <div className="mt-1 font-medium">{programLabels[candidate.programStatus] ?? candidate.programStatus}</div>
          </div>
        </div>

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
    <Card id="methode">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck />
          Méthode
        </CardTitle>
        <CardDescription>{ranking.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ranking.methodology.map((item) => (
          <div key={item.name} className="grid grid-cols-[1fr_auto] gap-4 rounded-lg bg-muted p-3">
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
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-4 sm:px-6 lg:px-10">
      <header className="flex h-14 items-center justify-between border-b">
        <a className="flex items-center gap-2 font-heading font-semibold" href="/presidentielle-ia/">
          <Sparkles className="text-primary" />
          <span>Présidentielle IA</span>
        </a>
        <nav className="hidden items-center gap-2 sm:flex" aria-label="Navigation">
          <Button variant="ghost" size="sm" asChild>
            <a href="#classement">Classement</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="#methode">Méthode</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="#sources">Sources</a>
          </Button>
        </nav>
      </header>

      <section className="grid items-end gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-14">
        <div className="flex max-w-4xl flex-col gap-5">
          <h1 className="font-heading text-5xl font-semibold leading-none tracking-tight sm:text-7xl lg:text-8xl">
            Qui parle sérieusement d'IA pour 2027 ?
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            Classement sourcé des candidats français selon leur compréhension de l'IA,
            la place du sujet dans leur programme et la précision de leurs mesures.
          </p>
        </div>
        <Card>
          <CardContent className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <CalendarClock />
            <div>
              <div className="text-xs text-muted-foreground">Dernière analyse</div>
              <div className="font-medium">{formatDate(ranking.generatedAt)}</div>
            </div>
            <RefreshCw />
          </CardContent>
        </Card>
      </section>

      <section id="classement" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
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
          </CardContent>
        </Card>

        {selected && <EvidencePanel candidate={selected} />}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
        <Methodology />
        <Card>
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
