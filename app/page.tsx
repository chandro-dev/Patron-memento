"use client";

import {
  ArrowLeft,
  ArrowRight,
  Braces,
  Boxes,
  CheckCircle2,
  Clock3,
  Code2,
  DatabaseZap,
  FileSignature,
  FileText,
  History,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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

type VisualEffect = "idle" | "save" | "undo" | "redo" | "restore";

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

const initialSnapshot: Snapshot = {
  ...initialState,
  id: 1,
  label: "Estado inicial",
  createdAt: "Inicio",
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
  const [past, setPast] = useState<EditorMemento[]>([
    new EditorMemento(initialSnapshot),
  ]);
  const [future, setFuture] = useState<EditorMemento[]>([]);
  const [activeSnapshot, setActiveSnapshot] = useState<Snapshot | null>(
    initialSnapshot,
  );
  const [restorePulse, setRestorePulse] = useState(0);
  const [visualEffect, setVisualEffect] = useState<VisualEffect>("idle");
  const [effectPulse, setEffectPulse] = useState(0);
  const [lastAction, setLastAction] = useState(
    "Estado inicial cargado en el Originator.",
  );

  const originator = useMemo(() => new ArticleOriginator(editorState), [editorState]);
  const snapshots = past.map((memento) => memento.getState());
  const latestSnapshot = snapshots.at(-1);
  const hasUnsavedChanges = latestSnapshot
    ? !statesMatch(editorState, latestSnapshot)
    : false;
  const canUndo = past.length > 1 || hasUnsavedChanges;
  const canRedo = future.length > 0;
  const contentLength = editorState.content.trim().length;

  const announceAction = useCallback((message: string, effect: VisualEffect) => {
    setLastAction(message);
    setVisualEffect(effect);
    setEffectPulse((value) => value + 1);
  }, []);

  function updateState(nextState: EditorState) {
    setEditorState(nextState);
    setActiveSnapshot(null);
    setLastAction("El Originator cambio su estado interno. Todavia no hay un nuevo Memento.");
    setVisualEffect("idle");
  }

  function saveSnapshot(label = `Estado ${past.length + 1}`) {
    originator.update(editorState);
    const memento = originator.save(label);
    setPast((current) => [...current, memento]);
    setFuture([]);
    setActiveSnapshot(memento.getState());
    announceAction("save(): el Originator creo un Memento y el Caretaker lo guardo.", "save");
  }

  const restoreFrom = useCallback((memento: EditorMemento) => {
    const restored = originator.restore(memento);
    setEditorState(restored);
    setActiveSnapshot(memento.getState());
    setRestorePulse((value) => value + 1);
  }, [originator]);

  const undo = useCallback(() => {
    const lastSaved = past.at(-1);
    if (!lastSaved) return;

    if (!statesMatch(editorState, lastSaved.getState())) {
      const current = originator.save("Cambio sin guardar");
      restoreFrom(lastSaved);
      setFuture((items) => [current, ...items]);
      announceAction("Ctrl+Z: se descarto el cambio sin guardar y se volvio al ultimo Memento.", "undo");
      return;
    }

    if (past.length < 2) return;

    const current = past[past.length - 1];
    const previous = past[past.length - 2];
    restoreFrom(previous);
    setPast((items) => items.slice(0, -1));
    setFuture((items) => [current, ...items]);
    announceAction("Ctrl+Z: el Caretaker entrego el Memento anterior al Originator.", "undo");
  }, [announceAction, editorState, originator, past, restoreFrom]);

  const redo = useCallback(() => {
    if (!future.length) return;
    const next = future[0];
    restoreFrom(next);
    setFuture((items) => items.slice(1));
    setPast((items) => [...items, next]);
    announceAction("Ctrl+Y: el Caretaker recupero un Memento desde la pila de redo.", "redo");
  }, [announceAction, future, restoreFrom]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const isUndo = (event.ctrlKey || event.metaKey) && key === "z" && !event.shiftKey;
      const isRedo =
        (event.ctrlKey || event.metaKey) &&
        (key === "y" || (key === "z" && event.shiftKey));

      if (!isUndo && !isRedo) return;

      event.preventDefault();
      if (isUndo) undo();
      if (isRedo) redo();
    }

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [redo, undo]);

  function clearHistory() {
    const resetMemento = new EditorMemento(initialSnapshot);
    setPast([resetMemento]);
    setFuture([]);
    restoreFrom(resetMemento);
    announceAction("Historial reiniciado: solo queda el Memento inicial.", "restore");
  }

  function restoreSnapshotAt(index: number) {
    const selected = past[index];
    if (!selected) return;

    restoreFrom(selected);
    setPast((items) => items.slice(0, index + 1));
    setFuture((items) => [...past.slice(index + 1), ...items]);
    announceAction("Restauracion directa: el Caretaker envio ese Memento al Originator.", "restore");
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
              <button className="icon-button" onClick={undo} disabled={!canUndo} title="Deshacer con Ctrl+Z">
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <button className="icon-button" onClick={redo} disabled={!canRedo} title="Rehacer con Ctrl+Y">
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button className="primary-button" onClick={() => saveSnapshot()}>
                <Save size={18} aria-hidden="true" />
                Guardar
              </button>
            </div>
          </div>

          <div className="shortcut-strip" aria-label="Atajos de teclado">
            <span>
              <kbd>Ctrl</kbd>
              <kbd>Z</kbd>
              Deshacer estado
            </span>
            <span>
              <kbd>Ctrl</kbd>
              <kbd>Y</kbd>
              Rehacer estado
            </span>
            <strong>{hasUnsavedChanges ? "Cambio pendiente" : "Estado guardado"}</strong>
          </div>

          <div className="inside-flow" aria-label="Estado interno del patron Memento">
            <FlowStep
              icon={<FileText size={28} />}
              title="Originator"
              value={hasUnsavedChanges ? "Cambio sin guardar" : "Sin cambios pendientes"}
              text="El editor posee el estado actual y decide cuando crear o restaurar un snapshot."
            />
            <FlowStep
              icon={<Boxes size={28} />}
              title="Memento"
              value={activeSnapshot?.label ?? "Editando en vivo"}
              text="Cada copia conserva titulo, contenido, enfoque y color sin exponer detalles al historial."
            />
            <FlowStep
              icon={<History size={28} />}
              title="Caretaker"
              value={`${past.length} guardados / ${future.length} rehacer`}
              text="Administra las pilas de undo y redo sin modificar el estado encapsulado."
            />
          </div>

          <div className={`action-banner effect-${visualEffect}`} key={`action-${effectPulse}`}>
            <Clock3 size={22} aria-hidden="true" />
            <div>
              <span>Operacion actual</span>
              <strong>{lastAction}</strong>
            </div>
          </div>

          <div
            className={`state-preview effect-${visualEffect}`}
            style={{ "--accent": editorState.accent } as React.CSSProperties}
            key={`${editorState.title}-${restorePulse}-${effectPulse}`}
          >
            <div className="preview-top">
              <span>{editorState.tone}</span>
              <Clock3 size={18} aria-hidden="true" />
            </div>
            <h3>{editorState.title}</h3>
            <p>{editorState.content}</p>
            <div className="state-note">{toneNotes[editorState.tone]}</div>
          </div>

          <div className="capture-card">
            <div className="capture-head">
              <div>
                <span className="section-kicker">Estado editable</span>
                <h3>Datos que se guardan dentro del Memento</h3>
              </div>
              <div className="capture-badge">
                <FileSignature size={18} aria-hidden="true" />
                {hasUnsavedChanges ? "Listo para guardar" : "Sin cambios"}
              </div>
            </div>

            <div className="capture-fields">
              <label className="field-card title-field">
                <span>Titulo del estado</span>
                <input
                  value={editorState.title}
                  onChange={(event) =>
                    updateState({ ...editorState, title: event.target.value })
                  }
                  placeholder="Nombre del snapshot"
                />
              </label>

              <fieldset className="tone-picker">
                <legend>Enfoque</legend>
                <div>
                  {presetStates.map((preset) => (
                    <button
                      key={preset.tone}
                      type="button"
                      className={editorState.tone === preset.tone ? "selected" : ""}
                      onClick={() =>
                        updateState({
                          ...editorState,
                          tone: preset.tone,
                          accent: preset.accent,
                        })
                      }
                      style={{ "--accent": preset.accent } as React.CSSProperties}
                    >
                      <span />
                      {preset.tone}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="field-card content-field">
                <span>Contenido capturado</span>
                <textarea
                  value={editorState.content}
                  onChange={(event) =>
                    updateState({ ...editorState, content: event.target.value })
                  }
                  rows={6}
                  placeholder="Describe el estado que quieres capturar..."
                />
              </label>
            </div>

            <div className="capture-summary">
              <span>
                <strong>{editorState.title || "Sin titulo"}</strong> se guardara como{" "}
                <strong>{editorState.tone}</strong>.
              </span>
              <span>{contentLength} caracteres</span>
            </div>
          </div>

          <div className="preset-row" aria-label="Ejemplos rapidos de estados">
            <span>Ejemplos rapidos</span>
            {presetStates.map((preset) => (
              <button
                key={preset.title}
                className="preset-button"
                onClick={() => updateState(preset)}
                style={{ "--accent": preset.accent } as React.CSSProperties}
              >
                <i aria-hidden="true" />
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
            <button className="icon-button" onClick={clearHistory} disabled={past.length === 1 && !future.length} title="Limpiar">
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
                  onClick={() => restoreSnapshotAt(index)}
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

function statesMatch(current: EditorState, snapshot: Snapshot) {
  return (
    current.title === snapshot.title &&
    current.content === snapshot.content &&
    current.tone === snapshot.tone &&
    current.accent === snapshot.accent
  );
}

function FlowStep({
  icon,
  title,
  value,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  text: string;
}) {
  return (
    <article className="flow-step">
      <div className="flow-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{text}</p>
      </div>
    </article>
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
