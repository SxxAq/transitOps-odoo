export default function TripsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
          <p className="text-muted-foreground">Manage and track trips.</p>
        </div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Create Trip
        </button>
      </div>
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        Trip table will be implemented here.
      </div>
    </div>
  );
}
