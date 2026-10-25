import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateProductionContent } from "./ai-writer.functions";
import { getLumaInfographicStatus, startLumaInfographic } from "./luma.functions";
import { saveProductionItem } from "./production.functions";

import { field, useCloudState } from "@/hooks/use-cloud-state";
import {
  applyDecision, applySubmit, buildItems, canSubmit, invalidateApproval, initialOrders, initialProductions,
  type ApprovalStatus, type Campaign, type ChannelOrder, type HistoryEntry, type NewsOrder, type NewsStatus, type OutputType, type ProductionBrief, type ProductionContent, type ProductionItem,
} from "./data";
import {
  advanceExecution,
  executionDone,
  initialCampaigns,
  regeneratePost,
  retry,
  SOCIAL_ACCOUNTS,
  statusAfterDecision,
  type AccountRole,
  type AccountStatus,
  type Post,
  type SocialAccount,
} from "./sosial";

export type ApprovalKind =
  | "Konten"
  | "Distribusi Sosial"
  | "Distribusi News";

export type ApprovalRef = {
  kind: ApprovalKind;
  id: string;
};

export type QueueItem = {
  key: string;
  ref: ApprovalRef;
  title: string;
  group: "Konten" | "Distribusi";
  subtype: string;
  source: string;
  status: ApprovalStatus;
  version?: number | undefined;
  submittedBy: string;
  submittedAt: string;
  submittedDay: string;
};

export type LogEntry = {
  at: string;
  text: string;
};

export type Origin = Pick<
  ProductionItem,
  | "source"
  | "strategySlug"
  | "strategyTitle"
  | "situationSlug"
  | "situationName"
>;

type Value = {
  productions: ProductionItem[];
  campaigns: Campaign[];
  orders: NewsOrder[];
  queue: QueueItem[];
  log: LogEntry[];

  createProductions: (
    brief: ProductionBrief,
    types: OutputType[],
    origin: Origin,
  ) => string[];

  generate: (
    id: string,
    settings?: Partial<ProductionContent>,
  ) => void;

  saveContent: (id: string, content: ProductionContent) => void;
  submit: (id: string) => void;

  decide: (
    ref: ApprovalRef,
    decision: Exclude<ApprovalStatus, "Menunggu">,
    note?: string,
  ) => void;

  createCampaign: (
    c: Omit<
      Campaign,
      "id" | "status" | "approval" | "history" | "approvals"
    >,
    submit: boolean,
