export default function FuelPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuel Logs</h1>
          <p className="text-muted-foreground">Track fuel consumption across your fleet.</p>
        </div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Add Log
        </button>
      </div>
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        Fuel log table will be implemented here.
      </div>
    </div>
  );
}
