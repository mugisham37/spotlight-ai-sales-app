import React from "react";

type Props = {
  params: Promise<{
    webinarId: string;
  }>;
};

export const page = ({ params }: Props) => {
  const { webinarId } = await params;
  const piplineData = await getWebinarAttendence(webinarId);

  if (!piplineData.data) {
    return <div className="text-3xl h-[400px] flex justify-center items-center">No Pipeline Found</div>
  }
  return (
    <div className="w-full flex flex-col gap-8">
      <PageHeader
        leftIcon={<LeadIcon className="w-4 h-4" />}
        mainIcon={<PipelineIcon className="w-12 h-12" />}
        rightIcon={<HomeIcon className="w-3 h-3" />}
        heading="Keep track of all your customers"
        placeholder="Search Name, Tag or Email"
      />
      <div className="flex overflow-x-auto pb-4 gap-4 md:gap-6">
        {Object.entries(pipelineData.data).map([columnType, columnData])=>(
          <PipelineLayout
          key={columnType}
          title={formatColumnTitle(columnType as AttendedTypeEnum)}
          count={columnData.count}
          users={columnData.users}
          tags={columnData.WebinarTags}
          />
        )}
      </div>
    </div>
  );
};

export default page;
