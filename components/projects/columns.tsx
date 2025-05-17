"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Project } from "@/lib/types"

export const columns: ColumnDef<Project>[] = [
    {
        accessorKey: "status",
        header: "Status"
    },
    {
        accessorKey: "client_id",
        header: "Client"
    },
    {
        accessorKey: "name"
    }
]