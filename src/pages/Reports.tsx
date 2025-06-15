
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBar } from "lucide-react";

const Reports = () => {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 text-gray-300">
      <Card className="bg-slate-900 border-slate-800 text-gray-300">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <ChartBar className="h-8 w-8" /> Reports & Analytics
          </CardTitle>
          <CardDescription className="text-gray-400 mt-1">
            Analyze your financial data with insightful reports and charts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-700 rounded-lg">
            <p className="text-gray-500">This page is under construction.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
