import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardClient from "./_components";

const Dashboard = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }
  return <DashboardClient userId={session.user?.id || ""} />;
};

export default Dashboard;
