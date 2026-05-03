import { format } from "date-fns";
import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV } from "@/lib/exportToCSV";
import { readRegistrations } from "@/lib/registrations";

const Registrations = () => {
  const registrations = readRegistrations();
  const exportRows = registrations.map((registration) => ({
    name: registration.fullName || "",
    email: registration.email || "",
    phone: registration.phone || "",
    eventName: registration.eventName,
    sportType: registration.sportType,
    registrationMode: registration.registrationMode,
    teamName: registration.teamName,
    playerCount: registration.playerCount || "",
    approvalStatus: registration.approvalStatus,
    registeredAt: registration.registeredAt || registration.submittedAt || "",
  }));

  const handleExport = () => {
    exportToCSV(
      exportRows,
      `sports_registrations_${format(new Date(), "yyyy-MM-dd")}.csv`,
      {
        name: "Full Name",
        email: "Email",
        phone: "Phone",
        eventName: "Event",
        sportType: "Sport",
        registrationMode: "Registration Type",
        teamName: "Team",
        playerCount: "Players",
        approvalStatus: "Approval Status",
        registeredAt: "Registration Date",
      },
    );
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-display font-bold text-foreground">Registrations</h1>
            <p className="text-muted-foreground">Admin view of all tournament registrations.</p>
          </div>
          <Button className="w-fit gap-2" onClick={handleExport} disabled={registrations.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <Card className="border-border bg-gradient-card">
          <CardHeader>
            <CardTitle>All Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                      No registrations yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  exportRows.map((registration, index) => (
                    <TableRow key={`${registration.eventName}-${registration.email}-${index}`}>
                      <TableCell>{registration.name}</TableCell>
                      <TableCell>{registration.email}</TableCell>
                      <TableCell>{registration.phone}</TableCell>
                      <TableCell>{registration.eventName}</TableCell>
                      <TableCell>{registration.sportType}</TableCell>
                      <TableCell className="capitalize">{registration.registrationMode}</TableCell>
                      <TableCell>{registration.teamName}</TableCell>
                      <TableCell>{registration.playerCount}</TableCell>
                      <TableCell>
                        <Badge variant={registration.approvalStatus === "approved" ? "default" : registration.approvalStatus === "pending" ? "secondary" : "outline"}>
                          {registration.approvalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {registration.registeredAt
                          ? new Date(registration.registeredAt).toLocaleString("en-IN")
                          : ""}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Registrations;
