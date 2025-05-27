"use client";

import { useEffect, useState } from "react";
import { Row } from "@tanstack/react-table";
import { Timesheet } from "@/lib/types";

type Props = {
  row: Row<Timesheet>;
};

export const ClockInCell = ({ row }: Props) => {
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    const value = row.getValue("clock_in") as string;
    const date = new Date(value);
    setFormattedTime(
      date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Nassau",
      })
    );
  }, [row]);

  return <span>{formattedTime}</span>;
};

export const ClockOutCell = ({ row }: Props) => {
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    const value = row.getValue("clock_out") as string;
    const date = new Date(value);
    setFormattedTime(
      date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Nassau",
      })
    );
  }, [row]);

  return <span>{formattedTime}</span>;
};
