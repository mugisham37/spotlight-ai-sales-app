import React from "react";
import { Users, BarChart3, Home, AlertCircle } from "lucide-react";
import { getWebinarAttendance } from "@/actions/attendence";
import { AttendedTypeEnum } from "@/lib/types";
import { PageHeader } from "./_components/PageHeader";
import PipelineLayout from "./_components/PipelineLayout";
import { formatColumnTitle, getColumnColor } from "./_components/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  params: Promise<{
    webinarId: string;
  }>;
};

const PipelinePage = async ({ params }: Props) => {
  const { webinarId } = await params;
  const pipelineData = await getWebinarAttendance(webinarId);

  if (!pipelineData.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {pipelineData.error || "Failed to load pipeline data"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!pipelineData.data) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          No Pipeline Data
        </h2>
        <p className="text-muted-foreground max-w-md">
          No attendance data found for this webinar. Attendees will appear here
          once they start joining.
        </p>
      </div>
    );
  }

  const totalAttendees = Object.values(pipelineData.data).reduce(
    (sum, column) => sum + column.count,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <PageHeader
        leftIcon={<Users className="w-4 h-4" />}
        mainIcon={<BarChart3 className="w-12 h-12" />}
        rightIcon={<Home className="w-3 h-3" />}
        heading={`Track your ${totalAttendees} attendees through the pipeline`}
        placeholder="Search Name, Tag or Email"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex overflow-x-auto pb-4 gap-4 md:gap-6 min-h-[600px]">
          {Object.entries(pipelineData.data).map(([columnType, columnData]) => (
            <PipelineLayout
              key={columnType}
              title={formatColumnTitle(columnType as AttendedTypeEnum)}
              count={columnData.count}
              users={columnData.users}
              tags={columnData.webinarTags || pipelineData.webinarTags || []}
              colorClass={getColumnColor(columnType as AttendedTypeEnum)}
            />
          ))}
        </div>

        {totalAttendees === 0 && (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-muted/50 mb-4 inline-block">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Waiting for attendees
            </h3>
            <p className="text-muted-foreground">
              Your pipeline will populate as people register and attend your
              webinar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelinePage;
