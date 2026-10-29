interface ModuleGridProps {
  modules: string[];
}

export default function ModuleGrid({ modules }: ModuleGridProps) {
  return (
    <ul className="module-grid">
      {modules.map((module) => (
        <li key={module}>{module}</li>
      ))}
    </ul>
  );
}
