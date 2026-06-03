"use client";

import {
  ArrowLeft,
  ArrowRight,
  Braces,
  CheckCircle2,
  Clock3,
  Code2,
  DatabaseZap,
  FileText,
  History,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

type EditorState = {
  title: string;
  content: string;
  tone: "Tecnico" | "Visual" | "Practico";
  accent: string;
};

type Snapshot = EditorState & {
  id: number;
  label: string;
  createdAt: string;
};

class EditorMemento {
  constructor(private readonly state: Snapshot) {}

  getState(): Snapshot {
    return structuredClone(this.state);
  }
}

class ArticleOriginator {
  private state: EditorState;

  constructor(initialState: EditorState) {
    this.state = initialState;
  }

  update(nextState: EditorState) {
    this.state = nextState;
  }

  save(label: string): EditorMemento {
    return new EditorMemento({
      ...this.state,
      id: Date.now(),
      label,
      createdAt: new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date()),
    });
  }

  restore(memento: EditorMemento): EditorState {
    const { id, label, createdAt, ...restoredState } = memento.getState();
    this.state = restoredState;
    return this.state;
  }
}

const initialState: EditorState = {
  title: "Patron Memento",
  content:
    "El Originator guarda una copia privada de su estado. El Caretaker conserva esas copias sin conocer sus detalles internos.",
  tone: "Tecnico",
  accent: "#13b981",
};

const presetStates: EditorState[] = [
  {
    title: "Version tecnica",
    content:
      "Memento captura y externaliza el estado interno de un objeto para poder restaurarlo luego sin romper encapsulamiento.",
    tone: "Tecnico",
    accent: "#13b981",
  },
  {
    title: "Version visual",
    content:
      "Piensa en una maquina del tiempo para un editor: cada guardado crea una capsula y cada restauracion vuelve a ese instante.",
    tone: "Visual",
    accent: "#f97316",
  },
  {
    title: "Version practica",
    content:
      "Usalo para undo/redo, borradores, historiales de configuracion, asistentes por pasos y editores sin persistencia remota.",
    tone: "Practico",
    accent: "#2563eb",
  },
];

const toneNotes = {
  Tecnico: "Define responsabilidades y encapsulamiento.",
  Visual: "Convierte el historial en algo facil de recordar.",
  Practico: "Conecta el patron con casos reales de producto.",
};

const codeSample = `type EditorState = {
  title: string;
  content: string;
  tone: "Tecnico" | "Visual" | "Practico";
  accent: string;
};

class EditorMemento {
  constructor(private readonly state: EditorState) {}
  getState() {
    return structuredClone(this.state);
  }
}

class ArticleOriginator {
  private state: EditorState;

  save(): EditorMemento {
    return new EditorMemento(this.state);
  }

  restore(memento: EditorMemento) {
    this.state = memento.getState();
  }
}`;

export default function Home() {
  const [editorState, setEditorState] = useState<EditorState>(initialState);
  const [past, setPast] = useState<EditorMemento[]>([]);
  const [future, setFuture] = useState<EditorMemento[]>([]);
  const [activeSnapshot, setActiveSnapshot] = useState<Snapshot | null>(null);
  const [restorePulse, setRestorePulse] = useState(0);

  const originator = useMemo(() => new ArticleOriginator(editorState), [editorState]);
  const snapshots = past.map((memento) => memento.getState());

  function updateState(nextState: EditorState) {
    setEditorState(nextState);
    setActiveSnapshot(null);
  }

  function saveSnapshot(label = `Estado ${past.length + 1}`) {
    originator.update(editorState);
    const memento = originator.save(label);
    setPast((current) => [...current, memento]);
    setFuture([]);
    setActiveSnapshot(memento.getState());
  }

  function restoreFrom(memento: EditorMemento) {
    const restored = originator.restore(memento);
    setEditorState(restored);
    setActiveSnapshot(memento.getState());
    setRestorePulse((value) => value + 1);
  }

  function undo() {
    if (!past.length) return;
    const current = originator.save("Estado actual");
    const previous = past[past.length - 1];
    restoreFrom(previous);
    setPast((items) => items.slice(0, -1));
    setFuture((items) => [current, ...items]);
  }

  function redo() {
    if (!future.length) return;
    const next = future[0];
    const current = originator.save("Estado actual");
    restoreFrom(next);
    setFuture((items) => items.slice(1));
    setPast((items) => [...items, current]);
  }

  function clearHistory() {
    setPast([]);
    setFuture([]);
    setActiveSnapshot(null);
  }

  return (
    <main className="app-shell">
      <section className="hero-band">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            Patron de comportamiento
          </span>
          <h1>Patron Memento</h1>
          <p>
            Una demostracion viva en TypeScript: captura estados, navega el historial
            y observa como el Caretaker restaura sin inspeccionar el contenido privado.
          </p>
        </div>
        <div className="hero-metrics" aria-label="Resumen del patron">
          <Metric label="Originator" value="Editor" />
          <Metric label="Mementos" value={String(past.length)} />
          <Metric label="Redo" value={String(future.length)} />
        </div>
      </section>

      <section className="workspace">
        <div className="editor-panel">
          <div className="panel-title">
            <div>
              <span className="section-kicker">Originator</span>
              <h2>Editor que cambia de estado</h2>
            </div>
            <div className="toolbar">
              <button className="icon-button" onClick={undo} disabled={!past.length} title="Undo">
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <button className="icon-button" onClick={redo} disabled={!future.length} title="Redo">
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button className="primary-button" onClick={() => saveSnapshot()}>
                <Save size={18} aria-hidden="true" />
                Guardar
              </button>
            </div>
          </div>

          <div
            className="state-preview"
            style={{ "--accent": editorState.accent } as React.CSSProperties}
            key={`${editorState.title}-${restorePulse}`}
          >
            <div className="preview-top">
              <span>{editorState.tone}</span>
              <Clock3 size={18} aria-hidden="true" />
            </div>
            <h3>{editorState.title}</h3>
            <p>{editorState.content}</p>
            <div className="state-note">{toneNotes[editorState.tone]}</div>
          </div>

          <div className="form-grid">
            <label>
              Titulo
              <input
                value={editorState.title}
                onChange={(event) =>
                  updateState({ ...editorState, title: event.target.value })
                }
              />
            </label>
            <label>
              Enfoque
              <select
                value={editorState.tone}
                onChange={(event) =>
                  updateState({
                    ...editorState,
                    tone: event.target.value as EditorState["tone"],
                  })
                }
              >
                <option>Tecnico</option>
                <option>Visual</option>
                <option>Practico</option>
              </select>
            </label>
            <label className="wide">
              Contenido
              <textarea
                value={editorState.content}
                onChange={(event) =>
                  updateState({ ...editorState, content: event.target.value })
                }
                rows={5}
              />
            </label>
          </div>

          <div className="preset-row">
            {presetStates.map((preset) => (
              <button
                key={preset.title}
                className="preset-button"
                onClick={() => updateState(preset)}
                style={{ "--accent": preset.accent } as React.CSSProperties}
              >
                <span />
                {preset.tone}
              </button>
            ))}
          </div>
        </div>

        <aside className="history-panel">
          <div className="panel-title">
            <div>
              <span className="section-kicker">Caretaker</span>
              <h2>Historial de Mementos</h2>
            </div>
            <button className="icon-button" onClick={clearHistory} disabled={!past.length && !future.length} title="Limpiar">
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="timeline">
            {snapshots.length === 0 ? (
              <div className="empty-state">
                <History size={28} aria-hidden="true" />
                <p>Guarda un estado para crear el primer Memento.</p>
              </div>
            ) : (
              snapshots.map((snapshot, index) => (
                <button
                  key={snapshot.id}
                  className={`timeline-item ${
                    activeSnapshot?.id === snapshot.id ? "active" : ""
                  }`}
                  onClick={() => restoreFrom(past[index])}
                >
                  <span className="timeline-dot" />
                  <strong>{snapshot.label}</strong>
                  <small>{snapshot.createdAt}</small>
                  <em>{snapshot.title}</em>
                </button>
              ))
            )}
          </div>
        </aside>
      </section>

      <section className="learning-grid">
        <article className="concept-panel">
          <span className="section-kicker">Mapa mental</span>
          <h2>Roles del patron</h2>
          <div className="role-flow">
            <Role icon={<FileText size={22} />} name="Originator" text="Objeto que posee el estado y sabe crear/restaurar snapshots." />
            <Role icon={<DatabaseZap size={22} />} name="Memento" text="Copia encapsulada del estado. El exterior no modifica su contenido." />
            <Role icon={<History size={22} />} name="Caretaker" text="Administra la pila de estados para undo, redo o restauracion directa." />
          </div>
        </article>

        <article className="code-panel">
          <div className="panel-title">
            <div>
              <span className="section-kicker">TypeScript</span>
              <h2>Implementacion declarada</h2>
            </div>
            <Code2 size={22} aria-hidden="true" />
          </div>
          <pre>
            <code>{codeSample}</code>
          </pre>
        </article>

        <article className="check-panel">
          <span className="section-kicker">Lectura rapida</span>
          <h2>Cuando usarlo</h2>
          <ul>
            <li>
              <CheckCircle2 size={18} aria-hidden="true" />
              Necesitas volver a estados anteriores sin exponer detalles internos.
            </li>
            <li>
              <CheckCircle2 size={18} aria-hidden="true" />
              El historial vive en memoria y se actualiza en tiempo real.
            </li>
            <li>
              <CheckCircle2 size={18} aria-hidden="true" />
              Quieres separar quien cambia el estado de quien conserva las copias.
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Role({
  icon,
  name,
  text,
}: {
  icon: React.ReactNode;
  name: string;
  text: string;
}) {
  return (
    <div className="role-card">
      <div className="role-icon">{icon}</div>
      <div>
        <h3>{name}</h3>
        <p>{text}</p>
      </div>
      <Braces className="role-mark" size={22} aria-hidden="true" />
    </div>
  );
}
