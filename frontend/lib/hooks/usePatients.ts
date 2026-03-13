"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPatients, createPatient, type Patient } from "@/lib/api";

export function usePatients() {
  return useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: getPatients,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
