
import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteBudgetAlertProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    budgetId: string | null;
    onSuccess: () => void;
}

const deleteBudget = async (budgetId: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
    if (error) throw error;
};

const DeleteBudgetAlert: React.FC<DeleteBudgetAlertProps> = ({ open, setOpen, budgetId, onSuccess }) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: deleteBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            toast.success("Budget deleted successfully!");
            onSuccess();
            setOpen(false);
        },
        onError: (error) => {
            toast.error("Failed to delete budget: " + error.message);
        },
    });

    const handleDelete = () => {
        if (budgetId) {
            mutation.mutate(budgetId);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your budget.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={mutation.isPending}
                      >
                        {mutation.isPending ? "Deleting..." : "Delete"}
                      </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteBudgetAlert;
