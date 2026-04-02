import { useEffect, useState, type ComponentType } from "react";

import { modules as discoveredModules } from "./.generated/mockup-components";

type ModuleMap = Record<string, () => Promise<Record<string, unknown>>>;

function _resolveComponent(
  mod: Record<string, unknown>,
  name: string,
): ComponentType | undefined {
  const fns = Object.values(mod).filter(
    (v) => typeof v === "function",
  ) as ComponentType[];
  return (
    (mod.default as ComponentType) ||
    (mod.Preview as ComponentType) ||
    (mod[name] as ComponentType) ||
    fns[fns.length - 1]
  );
}

function PreviewRenderer({
  componentPath,
  modules,
}: {
  componentPath: string;
  modules: ModuleMap;
}) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setComponent(null);
    setError(null);

    async function loadComponent(): Promise<void> {
      const key = `./components/mockups/${componentPath}.tsx`;
      const loader = modules[key];
      if (!loader) {
        setError(`No component found at ${componentPath}.tsx`);
        return;
      }

      try {
        const mod = await loader();
        if (cancelled) {
          return;
        }
        const name = componentPath.split("/").pop()!;
        const comp = _resolveComponent(mod, name);
        if (!comp) {
          setError(
            `No exported React component found in ${componentPath}.tsx\n\nMake sure the file has at least one exported function component.`,
          );
          return;
        }
        setComponent(() => comp);
      } catch (e) {
        if (cancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : String(e);
        setError(`Failed to load preview.\n${message}`);
      }
    }

    void loadComponent();

    return () => {
      cancelled = true;
    };
  }, [componentPath, modules]);

  if (error) {
    return (
      <pre style={{ color: "red", padding: "2rem", fontFamily: "system-ui" }}>
        {error}
      </pre>
    );
  }

  if (!Component) return null;

  return <Component />;
}

function getBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}


const MOCKUPS = [
  {
    row: "Dashboard Layout Variants",
    items: [
      {
        path: "VariantA-CommandCentre",
        label: "Variant A — Command Centre",
        desc: "Top nav · KPI strip · Bento widget grid",
      },
      {
        path: "VariantB-FocusMode",
        label: "Variant B — Focus Mode",
        desc: "Icon rail · Today's feed · Slide-in detail panel",
      },
      {
        path: "VariantC-DataDense",
        label: "Variant C — Data Dense",
        desc: "BI-style · Sparkline KPIs · Full registry table · Status ribbon",
      },
    ],
  },
  {
    row: "Workflow UI Variants",
    items: [
      {
        path: "WorkflowA-GuidedStepper",
        label: "Workflow A — Guided Stepper",
        desc: "Horizontal progress track · Segmented risk controls · AI sidebar",
      },
      {
        path: "WorkflowB-KanbanCommand",
        label: "Workflow B — Kanban Command",
        desc: "4-column board · Swimlane headers · Right detail drawer",
      },
    ],
  },
];

function Gallery() {
  const basePath = getBasePath();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a0a2e",
        color: "#dde4f0",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "28px 32px",
      }}
    >
      <div style={{ marginBottom: 28, borderBottom: "1px solid #4a2478", paddingBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#FFD400",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 14,
              color: "#1a0a2e",
              flexShrink: 0,
            }}
          >
            EA
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              McCain EA Platform — Dashboard Layout Mockups
            </h1>
            <p style={{ fontSize: 12, color: "#9b87c0", margin: "4px 0 0" }}>
              5 live-rendered design variants · Click any frame to explore
            </p>
          </div>
        </div>
      </div>

      {MOCKUPS.map((group) => (
        <div key={group.row} style={{ marginBottom: 36 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                height: 2,
                width: 28,
                background: "#FFD400",
                borderRadius: 999,
                flexShrink: 0,
              }}
            />
            <h2
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".1em",
                color: "#FFD400",
                margin: 0,
              }}
            >
              {group.row}
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${group.items.length}, 1fr)`,
              gap: 20,
            }}
          >
            {group.items.map((item) => (
              <div
                key={item.path}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <div
                  style={{
                    background: "#2a1045",
                    border: "1px solid #4a2478",
                    borderBottom: "none",
                    borderRadius: "10px 10px 0 0",
                    padding: "10px 14px 8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#dde4f0",
                      marginBottom: 2,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#9b87c0" }}>{item.desc}</div>
                </div>
                <div
                  style={{
                    border: "1px solid #4a2478",
                    borderRadius: "0 0 10px 10px",
                    overflow: "hidden",
                    aspectRatio: "16/9",
                    position: "relative",
                  }}
                >
                  <iframe
                    src={`${basePath}/preview/${item.path}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      display: "block",
                    }}
                    title={item.label}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function getPreviewPath(): string | null {
  const basePath = getBasePath();
  const { pathname } = window.location;
  const local =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  const match = local.match(/^\/preview\/(.+)$/);
  return match ? match[1] : null;
}

function App() {
  const previewPath = getPreviewPath();

  if (previewPath) {
    return (
      <PreviewRenderer
        componentPath={previewPath}
        modules={discoveredModules}
      />
    );
  }

  useEffect(() => {
    window.location.replace("https://dbc48cc8-3297-4616-8b4b-4276ec4b5724-00-25bwirsql5kf7.picard.replit.dev/");
  }, []);

  return null;
}

export default App;
