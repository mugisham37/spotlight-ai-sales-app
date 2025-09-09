import React from "react";
import { redirect } from "next/navigation";
import { onAuthenticateUser } from "@/actions/auth";
import { getWebinarByPresenterId } from "@/actions/webinar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Video, TrendingUp } from "lucide-react";
import PageHeader from "@/components/ReusableComponents/PageHeader";
import WebinarCard from "./_components/WebinarCard";

const page = async () => {
  const checkUser = await onAuthenticateUser();

  if (!checkUser.user) {
    redirect("/");
  }

  const webinarsResult = await getWebinarByPresenterId(checkUser.user.id);
  const webinars = webinarsResult.webinars || [];

  return (
    <Tabs defaultValue="all" className="w-full flex flex-col gap-8">
      <PageHeader
        leftIcon={<Home className="w-3 h-3" />}
        mainIcon={<Video className="w-12 h-12" />}
        rightIcon={<TrendingUp className="w-4 h-4" />}
        heading="The home to all your webinars"
        placeholder="Search webinars..."
      />

      <TabsList className="bg-transparent space-x-3 w-fit">
        <TabsTrigger
          value="all"
          className="bg-secondary opacity-50 data-[state=active]:opacity-100 px-8 py-4 rounded-lg"
        >
          All
        </TabsTrigger>
        <TabsTrigger
          value="upcoming"
          className="bg-secondary opacity-50 data-[state=active]:opacity-100 px-8 py-4 rounded-lg"
        >
          Upcoming
        </TabsTrigger>
        <TabsTrigger
          value="ended"
          className="bg-secondary opacity-50 data-[state=active]:opacity-100 px-8 py-4 rounded-lg"
        >
          Ended
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="all"
        className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 place-items-start gap-x-6 gap-y-10"
      >
        {webinars.length > 0 ? (
          webinars.map((webinar) => (
            <WebinarCard key={webinar.id} webinar={webinar} />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <Video className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              No webinars found
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Create your first webinar to get started
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent
        value="upcoming"
        className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 place-items-start gap-x-6 gap-y-10"
      >
        {webinars
          .filter((webinar) => new Date(webinar.startTime) > new Date())
          .map((webinar) => (
            <WebinarCard key={webinar.id} webinar={webinar} />
          ))}
      </TabsContent>

      <TabsContent
        value="ended"
        className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 place-items-start gap-x-6 gap-y-10"
      >
        {webinars
          .filter((webinar) => new Date(webinar.startTime) <= new Date())
          .map((webinar) => (
            <WebinarCard key={webinar.id} webinar={webinar} />
          ))}
      </TabsContent>
    </Tabs>
  );
};

export default page;
