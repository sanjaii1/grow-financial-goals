
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

type SavingsGoal = {
  name: string;
  current_amount: number;
  target_amount: number;
};

interface SavingsPlanProps {
  savingsGoals: SavingsGoal[];
}

export function SavingsPlan({ savingsGoals }: SavingsPlanProps) {
  const totalSaved = savingsGoals.reduce((acc, goal) => acc + goal.current_amount, 0);
  const totalTarget = savingsGoals.reduce((acc, goal) => acc + goal.target_amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Savings</CardTitle>
        <CardDescription>
          Total Saved: ₹{totalSaved.toLocaleString()} of ₹{totalTarget.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {savingsGoals.length > 0 ? (
          <div className="space-y-6">
            {savingsGoals.map((goal, index) => {
              const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      {goal.name}
                    </span>
                    <span className="text-sm font-bold">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-end items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      ₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No savings goals set yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
