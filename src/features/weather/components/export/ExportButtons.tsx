"use client";

import { Download, FileDown, Link2, MoreVertical } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";
import { toPng } from "html-to-image";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportWeatherCsv } from "@/features/weather/logic/exports";
import type { WeatherYearDataset } from "@/features/weather/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type ExportButtonsProps = {
  datasets: WeatherYearDataset[];
  chartRef: RefObject<HTMLDivElement | null>;
  shareUrl: string | null;
};

type ShareFeedbackStatus = "error" | "idle" | "success";

type ShareLabels = {
  defaultLabel: string;
  errorLabel: string;
  successLabel: string;
};

export function canShareWeatherUrl(shareUrl: string | null) {
  return shareUrl !== null;
}

export function getShareFeedbackLabel(status: ShareFeedbackStatus, labels: ShareLabels) {
  if (status === "success") {
    return labels.successLabel;
  }

  if (status === "error") {
    return labels.errorLabel;
  }

  return labels.defaultLabel;
}

export function ExportButtons({ datasets, chartRef, shareUrl }: ExportButtonsProps) {
  const { t } = useLocale();
  const hasData = datasets.length > 0;
  const [shareStatus, setShareStatus] = useState<ShareFeedbackStatus>("idle");

  useEffect(() => {
    if (shareStatus === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShareStatus("idle");
    }, 1600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [shareStatus]);

  async function handleShare() {
    if (!canShareWeatherUrl(shareUrl)) {
      return;
    }

    try {
      await copyTextToClipboard(shareUrl);
      setShareStatus("success");
    } catch {
      setShareStatus("error");
    }
  }

  const shareLabel = getShareFeedbackLabel(shareStatus, {
    defaultLabel: t["share.button"],
    errorLabel: t["share.failed"],
    successLabel: t["share.copied"],
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t["export.menuLabel"]}
          className="h-11 w-11 shrink-0"
          type="button"
          variant="outline"
        >
          <MoreVertical aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={!canShareWeatherUrl(shareUrl)}
          onSelect={(event) => {
            event.preventDefault();
            void handleShare();
          }}
        >
          <Link2 />
          {shareLabel}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!hasData} onSelect={() => downloadCsv(datasets)}>
          <FileDown />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!hasData}
          onSelect={() => {
            void downloadPng(chartRef);
          }}
        >
          <Download />
          PNG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getChartExportBackground(background: string) {
  return background.trim() || "hsl(0 0% 100%)";
}

export function shouldIncludeChartExportNode(domNode: HTMLElement) {
  return domNode.tagName !== "SCRIPT";
}

export async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard API unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command failed");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

function downloadCsv(datasets: WeatherYearDataset[]) {
  const csv = exportWeatherCsv(datasets);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, "weather-compare.csv");
  URL.revokeObjectURL(url);
}

async function downloadPng(chartRef: RefObject<HTMLDivElement | null>) {
  if (!chartRef.current) {
    return;
  }

  const url = await toPng(chartRef.current, {
    backgroundColor: getChartExportBackground(
      getComputedStyle(document.documentElement).getPropertyValue("--background")
    ),
    filter: shouldIncludeChartExportNode,
    pixelRatio: 2,
  });
  triggerDownload(url, "weather-compare.png");
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}
