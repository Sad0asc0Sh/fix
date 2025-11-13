import { Skeleton } from "@/components/Skeleton";
import StatCard from "@/components/StatCard";

export default function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8">
      {/* Skeleton for Title */}
      <Skeleton className="h-9 w-64" />

      {/* Skeleton for Main Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={<Skeleton className="h-5 w-24" />}
          value={<Skeleton className="h-9 w-32" />}
          icon={<Skeleton className="h-8 w-8 rounded-full" />}
          comparison={<Skeleton className="h-4 w-40" />}
        />
        <StatCard
          title={<Skeleton className="h-5 w-32" />}
          value={<Skeleton className="h-9 w-12" />}
          icon={<Skeleton className="h-8 w-8 rounded-full" />}
          comparison={<Skeleton className="h-4 w-24" />}
        />
        <StatCard
          title={<Skeleton className="h-5 w-20" />}
          value={<Skeleton className="h-9 w-12" />}
          icon={<Skeleton className="h-8 w-8 rounded-full" />}
          comparison={<Skeleton className="h-4 w-36" />}
        />
        <StatCard
          title={<Skeleton className="h-5 w-28" />}
          value={<Skeleton className="h-9 w-12" />}
          icon={<Skeleton className="h-8 w-8 rounded-full" />}
          comparison={<Skeleton className="h-4 w-40" />}
        />
      </div>

      {/* Skeleton for Chart and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Skeleton for Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-[350px] w-full" />
        </div>

        {/* Skeleton for Latest Orders */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <Skeleton className="h-6 w-1/2 mb-6" />
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

