
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface DebtFilters {
  search: string;
  status: string;
  type: string;
  startDate?: Date;
  endDate?: Date;
}

interface DebtFiltersProps {
  filters: DebtFilters;
  onFiltersChange: (filters: DebtFilters) => void;
  onClearFilters: () => void;
}

export function DebtFilters({ filters, onFiltersChange, onClearFilters }: DebtFiltersProps) {
  const updateFilter = (key: keyof DebtFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = filters.search || filters.status !== "all" || filters.type !== "all" || filters.startDate || filters.endDate;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Label className="text-sm font-medium">Filters</Label>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by name or notes..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="cleared">Cleared</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={filters.type} onValueChange={(value) => updateFilter("type", value)}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="borrowed">Borrowed (You Owe)</SelectItem>
              <SelectItem value="lent">Lent (They Owe)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Due Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, "MMM dd") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => updateFilter("startDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, "MMM dd") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => updateFilter("endDate", date)}
                  disabled={(date) => filters.startDate ? date < filters.startDate : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
