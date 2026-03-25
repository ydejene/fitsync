export default function DashboardLoading() { return (<div className="w-full h-full p-4 sm:p-6 animate-pulse" aria-busy="true">
  <div className="flex items-center justify-between mb-8">
    <div><div className="h-8 w-48 bg-[#E5E5E5] rounded-lg mb-2"></div><div className="h-4 w-32 bg-[#F0F0F0] rounded-md"></div></div>
    <div className="h-10 w-32 bg-[#E5E5E5] rounded-xl hidden sm:block"></div>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {[1,2,3,4].map((i)=>(<div key={i} className="bg-white p-5 rounded-xl border border-[#E5E5E5] shadow-sm flex flex-col justify-between h-32"><div className="flex justify-between items-start"><div className="h-4 w-20 bg-[#F0F0F0] rounded-md"></div><div className="h-8 w-8 bg-[#FFF0EB] rounded-lg"></div></div><div className="h-6 w-24 bg-[#E5E5E5] rounded-lg"></div></div>))}
  </div>
  <div className="bg-white rounded-xl border border-[#E5E5E5] shadow-sm overflow-hidden p-6">
    <div className="h-6 w-40 bg-[#E5E5E5] rounded-lg mb-6"></div>
    <div className="space-y-4">
      {[1,2,3,4,5].map((i)=>(<div key={i} className="flex items-center justify-between border-b border-[#F5F5F5] pb-4 last:border-0"><div className="flex items-center gap-4"><div className="h-10 w-10 bg-[#E5E5E5] rounded-full"></div><div><div className="h-4 w-32 bg-[#F0F0F0] rounded-md mb-1.5"></div><div className="h-3 w-24 bg-[#F5F5F5] rounded-md"></div></div></div><div className="h-4 w-16 bg-[#F0F0F0] rounded-md hidden sm:block"></div><div className="h-4 w-20 bg-[#F0F0F0] rounded-md hidden md:block"></div><div className="h-8 w-16 bg-[#E5E5E5] rounded-lg"></div></div>))}
    </div>
  </div>
  </div>); }