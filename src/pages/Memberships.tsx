import MembershipTable from "@/components/MembershipTable";

const Memberships = () => {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-display font-bold text-foreground">Membership Tracker</h1>
          <p className="text-muted-foreground">Track member plans, approvals, expiry dates, and renewals.</p>
        </div>

        <MembershipTable />
      </div>
    </div>
  );
};

export default Memberships;
