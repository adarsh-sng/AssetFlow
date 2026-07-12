import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, ChevronRight } from "lucide-react";
import { StatusPill } from "../components/ui/StatusPill";
import { queryKeys } from "../lib/query-keys";

type Tab = "departments" | "categories" | "employees";

interface Department {
  id: string;
  name: string;
  head: string;
  parentDept: string;
  status: "ACTIVE" | "INACTIVE";
}

const mockDepartments: Department[] = [
  {
    id: "1",
    name: "Engineering",
    head: "aditi rao",
    parentDept: "—",
    status: "ACTIVE",
  },
  {
    id: "2",
    name: "Facilities",
    head: "rohan mehta",
    parentDept: "—",
    status: "ACTIVE",
  },
  {
    id: "3",
    name: "Field ops (east)",
    head: "sana ismail",
    parentDept: "Field Ops",
    status: "INACTIVE",
  },
];

const tabs: { key: Tab; label: string }[] = [
  { key: "departments", label: "Departments" },
  { key: "categories", label: "Categories" },
  { key: "employees", label: "Employees" },
];

export function OrgSetupPage() {
  const [activeTab, setActiveTab] = useState<Tab>("departments");

  const { data: departments = mockDepartments } = useQuery<Department[]>({
    queryKey: queryKeys.departments.lists(),
    queryFn: async () => {
      const res = await fetch("/api/organization/departments");
      if (!res.ok) return mockDepartments;
      return res.json();
    },
    initialData: mockDepartments,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-4xl font-light">Organization Setup</h1>
        <button className="flex items-center gap-2 bg-accent px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-colors">
          <Plus size={14} />
          Add
        </button>
      </div>

      <div className="flex gap-1 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-foreground text-foreground"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "departments" && (
        <div className="border border-border-subtle bg-white shadow-custom">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Department
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Head
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Parent Dept
                </th>
                <th className="px-5 py-3 text-2xs font-bold uppercase tracking-widest text-foreground/50">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr
                  key={dept.id}
                  className="hover:bg-background transition-colors"
                >
                  <td className="px-5 py-4 text-sm font-medium">{dept.name}</td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {dept.head}
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground/60">
                    {dept.parentDept}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill
                      variant={dept.status === "ACTIVE" ? "active" : "warning"}
                    >
                      {dept.status}
                    </StatusPill>
                  </td>
                  <td className="px-5 py-4">
                    <ChevronRight size={16} className="text-foreground/30" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="space-y-4">
          <p className="text-sm text-foreground/50">To be built</p>
        </div>
      )}

      {activeTab === "employees" && (
        <div className="space-y-4">
          <p className="text-sm text-foreground/50">To be built</p>
        </div>
      )}

      <p className="text-xs text-foreground/40">
        Editing a department here also drives the pilllist in Assets &
        Allocation
      </p>
    </div>
  );
}
