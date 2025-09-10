import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ReusableComponents/PageHeader";
import {
  Users,
  UserPlus,
  TrendingUp,
  Phone,
  Mail,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Lead data type definition
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  status: "new" | "contacted" | "qualified" | "converted";
  createdAt: string;
}

// Mock data - replace with actual data fetching
const mockLeadData: Lead[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    tags: ["Hot Lead", "Enterprise"],
    status: "qualified",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@company.com",
    phone: "+1 (555) 987-6543",
    tags: ["Warm Lead", "SMB"],
    status: "contacted",
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    name: "Michael Chen",
    email: "mchen@techcorp.com",
    phone: "+1 (555) 456-7890",
    tags: ["Cold Lead", "Tech"],
    status: "new",
    createdAt: "2024-01-13",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@startup.io",
    phone: "+1 (555) 321-0987",
    tags: ["Hot Lead", "Startup", "SaaS"],
    status: "converted",
    createdAt: "2024-01-12",
  },
];

const getStatusColor = (status: Lead["status"]) => {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "contacted":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "qualified":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "converted":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const LeadPage = () => {
  return (
    <div className="w-full flex flex-col gap-8">
      <PageHeader
        leftIcon={<UserPlus className="w-3 h-3 text-white" />}
        mainIcon={<Users className="w-12 h-12 text-white" />}
        rightIcon={<TrendingUp className="w-3 h-3 text-white" />}
        heading="Lead Management"
        placeholder="Search leads by name, email, or phone..."
      >
        <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </PageHeader>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">All Leads</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage and track your customer leads
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {mockLeadData.length} Total
              </Badge>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-gray-200">
              <TableHead className="text-sm font-medium text-gray-700 py-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Name
                </div>
              </TableHead>
              <TableHead className="text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
              </TableHead>
              <TableHead className="text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </div>
              </TableHead>
              <TableHead className="text-sm font-medium text-gray-700">
                Status
              </TableHead>
              <TableHead className="text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </div>
              </TableHead>
              <TableHead className="text-right text-sm font-medium text-gray-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockLeadData.map((lead) => (
              <TableRow
                key={lead.id}
                className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0"
              >
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {lead.name}
                    </span>
                    <span className="text-xs text-gray-500">ID: {lead.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">{lead.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-gray-700 font-mono text-sm">
                    {lead.phone}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`capitalize ${getStatusColor(lead.status)}`}
                  >
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map((tag, tagIndex) => (
                      <Badge
                        key={tagIndex}
                        variant="secondary"
                        className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Lead
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {mockLeadData.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first lead.
            </p>
            <div className="mt-6">
              <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadPage;
