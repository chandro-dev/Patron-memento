# Diagrama de clases: Patron Memento en esta aplicacion

Este diagrama describe la implementacion usada en `app/page.tsx`.

```mermaid
classDiagram
  direction LR

  class EditorState {
    +string title
    +string content
    +"Tecnico|Visual|Practico" tone
    +string accent
  }

  class Snapshot {
    +number id
    +string label
    +string createdAt
    +string title
    +string content
    +string tone
    +string accent
  }

  class EditorMemento {
    -Snapshot state
    +getState() Snapshot
  }

  class ArticleOriginator {
    -EditorState state
    +update(nextState: EditorState) void
    +save(label: string) EditorMemento
    +restore(memento: EditorMemento) EditorState
  }

  class HomeComponent {
    -EditorState editorState
    -EditorMemento[] past
    -EditorMemento[] future
    -Snapshot activeSnapshot
    +saveSnapshot(label?: string) void
    +undo() void
    +redo() void
    +restoreSnapshotAt(index: number) void
    +clearHistory() void
  }

  EditorState <|-- Snapshot
  EditorMemento o-- Snapshot : encapsula
  ArticleOriginator --> EditorState : modifica
  ArticleOriginator --> EditorMemento : crea/restaura
  HomeComponent --> ArticleOriginator : usa
  HomeComponent o-- EditorMemento : past/future
```

## Lectura del patron

- `ArticleOriginator` es el Originator: conoce el estado editable y sabe crear/restaurar snapshots.
- `EditorMemento` es el Memento: guarda una copia del estado y solo expone `getState()`.
- `HomeComponent` actua como Caretaker: mantiene `past` y `future`, pero no modifica internamente el Memento.
- `Snapshot` extiende el estado con metadatos visuales para el historial: `id`, `label` y `createdAt`.

## Version PlantUML

```plantuml
@startuml
title Patron Memento en la aplicacion Next

skinparam classAttributeIconSize 0
skinparam shadowing false
skinparam class {
  BackgroundColor #FFFFFF
  BorderColor #172033
  ArrowColor #2563EB
}

class EditorState {
  +title: string
  +content: string
  +tone: "Tecnico" | "Visual" | "Practico"
  +accent: string
}

class Snapshot {
  +id: number
  +label: string
  +createdAt: string
  +title: string
  +content: string
  +tone: string
  +accent: string
}

class EditorMemento {
  -state: Snapshot
  +getState(): Snapshot
}

class ArticleOriginator {
  -state: EditorState
  +update(nextState: EditorState): void
  +save(label: string): EditorMemento
  +restore(memento: EditorMemento): EditorState
}

class HomeComponent {
  -editorState: EditorState
  -past: EditorMemento[]
  -future: EditorMemento[]
  -activeSnapshot: Snapshot
  +saveSnapshot(label?: string): void
  +undo(): void
  +redo(): void
  +restoreSnapshotAt(index: number): void
  +clearHistory(): void
}

EditorState <|-- Snapshot
EditorMemento o-- Snapshot : encapsula
ArticleOriginator --> EditorState : modifica
ArticleOriginator --> EditorMemento : crea/restaura
HomeComponent --> ArticleOriginator : usa
HomeComponent o-- EditorMemento : past/future

note right of ArticleOriginator
  Originator:
  crea y restaura Mementos.
end note

note right of EditorMemento
  Memento:
  conserva una copia del estado.
end note

note bottom of HomeComponent
  Caretaker:
  administra undo y redo.
end note

@enduml
```
