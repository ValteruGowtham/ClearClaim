"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, getTask, createTask, getStats, type Task, type TaskStats, type TaskFilters } from "@/lib/api";

export function useTasks(filters?: TaskFilters) {
  return useQuery<Task[]>({
    queryKey: ["tasks", filters],
    queryFn: () => getTasks(filters),
    refetchInterval: 5_000,
  });
}

export function useTask(id: string | null) {
  return useQuery<Task>({
    queryKey: ["task", id],
    queryFn: () => getTask(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll every 3s while task is still running
      if (status === "pending" || status === "in_progress") return 3_000;
      return false;
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useStats() {
  return useQuery<TaskStats>({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: 10_000,
  });
}
