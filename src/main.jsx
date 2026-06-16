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

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function ProgramBadge({ value }) {
  return <span className={`program program-${slug(value)}`}>{programLabels[value] ?? value}</span>;
}

function TrendIcon({ trend }) {
  if (trend === "up") return <ArrowUp size={14} aria-label="Tendance en hausse" />;
  if (trend === "down") return <ArrowDown size={14} aria-label="Tendance en baisse" />;
  return <span className="flat" aria-label="Tendance stable" />;
}

function slug(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
}

function ScoreBar({ value }) {
  return (
    <div className="scoreBar" aria-label={`Score ${value} sur 100`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function CandidateRow({ candidate, rank, active, onSelect }) {
  return (
    <button className={`candidateRow ${active ? "active" : ""}`} onClick={() => onSelect(candidate.name)}>
      <span className="rank">{rank}</span>
      <span className="candidateMain">
        <strong>{candidate.name}</strong>
        <small>{candidate.party}</small>
      </span>
      <span className="status">{statusLabels[candidate.status] ?? candidate.status}</span>
      <ProgramBadge value={candidate.programStatus} />
      <span className="scoreCell">
        <span>{candidate.score}</span>
        <TrendIcon trend={candidate.trend} />
      </span>
      <ScoreBar value={candidate.score} />
    </button>
  );
}

function SourceList({ sources }) {
  return (
    <div className="sources">
      {sources.map((source) => (
        <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
          <FileText size={15} />
          <span>{source.title}</span>
          <ExternalLink size={13} />
        </a>
      ))}
    </div>
  );
}

function EvidencePanel({ candidate }) {
  return (
    <aside className="evidencePanel">
      <div className="panelHeader">
        <div>
          <p>Dossier candidat</p>
          <h2>{candidate.name}</h2>
        </div>
        <div className="bigScore">
          <span>{candidate.score}</span>
          <small>/100</small>
        </div>
      </div>

      <div className="panelGrid">
        <div>
          <small>Statut</small>
          <strong>{statusLabels[candidate.status] ?? candidate.status}</strong>
        </div>
        <div>
          <small>Programme IA</small>
          <strong>{programLabels[candidate.programStatus] ?? candidate.programStatus}</strong>
        </div>
      </div>

      <section>
        <h3>Pourquoi ce score</h3>
        <p>{candidate.evidence}</p>
      </section>

      <section>
        <h3>Point faible</h3>
        <p>{candidate.risks}</p>
      </section>

      <section>
        <h3>Sources</h3>
        <SourceList sources={candidate.sources} />
      </section>
    </aside>
  );
}

function Methodology() {
  return (
    <section className="methodology">
      <div className="sectionTitle">
        <ShieldCheck size={18} />
        <h2>Méthode</h2>
      </div>
      <p>{ranking.summary}</p>
      <div className="methodRows">
        {ranking.methodology.map((item) => (
          <div key={item.name} className="methodRow">
            <div>
              <strong>{item.name}</strong>
              <span>{item.description}</span>
            </div>
            <b>{item.weight}%</b>
          </div>
        ))}
      </div>
    </section>
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
    <main>
      <header className="topbar">
        <a className="brand" href="/">
          <Sparkles size={20} />
          <span>Présidentielle IA</span>
        </a>
        <nav aria-label="Navigation">
          <a href="#classement">Classement</a>
          <a href="#methode">Méthode</a>
          <a href="#sources">Sources</a>
        </nav>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <h1>Qui parle sérieusement d'IA pour 2027 ?</h1>
          <p>
            Classement sourcé des candidats français selon leur compréhension de l'IA,
            la place du sujet dans leur programme et la précision de leurs mesures.
          </p>
        </div>
        <div className="updateCard">
          <CalendarClock size={18} />
          <div>
            <span>Dernière analyse</span>
            <strong>{formatDate(ranking.generatedAt)}</strong>
          </div>
          <RefreshCw size={17} />
        </div>
      </section>

      <section className="workspace" id="classement">
        <div className="rankingPanel">
          <div className="toolbar">
            <label className="searchBox">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Chercher un candidat"
              />
            </label>
            <select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}>
              <option value="all">Tous les programmes</option>
              <option value="oui">IA dans le programme</option>
              <option value="partiel">Partiel</option>
              <option value="faible">Faible</option>
              <option value="non établi">Non établi</option>
            </select>
          </div>

          <div className="tableHeader">
            <span>Rang</span>
            <span>Candidat</span>
            <span>Statut</span>
            <span>Programme</span>
            <span>Score</span>
            <span>Lecture</span>
          </div>

          <div className="candidateList">
            {filtered.map((candidate, index) => (
              <CandidateRow
                key={candidate.name}
                candidate={candidate}
                rank={sorted.findIndex((item) => item.name === candidate.name) + 1}
                active={selected?.name === candidate.name}
                onSelect={setSelectedName}
              />
            ))}
          </div>
        </div>

        {selected && <EvidencePanel candidate={selected} />}
      </section>

      <section className="lowerGrid" id="methode">
        <Methodology />
        <section className="automation">
          <div className="sectionTitle">
            <CheckCircle2 size={18} />
            <h2>Automatisation</h2>
          </div>
          <p>
            Le cron GitHub Actions relance chaque jour une recherche web avec OpenAI,
            détecte les nouveaux candidats, réévalue les scores et conserve les sources.
          </p>
          <code>npm run update:ranking</code>
          <code>.github/workflows/update-ranking.yml</code>
        </section>
      </section>

      <footer id="sources">
        <span>Analyse neutre, sourcée, perfectible.</span>
        <span>{ranking.candidates.reduce((count, item) => count + item.sources.length, 0)} sources indexées</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
