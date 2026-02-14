const DashboardHome = () => {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Welcome Back</h1>
        <p className="text-muted-foreground mt-1">Here's your coaching overview for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Momentum Score" value="0" sublabel="Points" />
        <StatCard label="Current Streak" value="0" sublabel="Days" />
        <StatCard label="Today's Completion" value="0%" sublabel="Power Moves" />
        <StatCard label="Activities This Week" value="0" sublabel="Logged" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Today's Power Moves</h3>
          <p className="text-muted-foreground text-sm">No power moves assigned yet. Start your day strong!</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Recent Activity</h3>
          <p className="text-muted-foreground text-sm">No recent activities. Log your first activity to get started.</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sublabel }: { label: string; value: string; sublabel: string }) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-3xl font-display font-bold text-foreground mt-1">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
  </div>
);

export default DashboardHome;
