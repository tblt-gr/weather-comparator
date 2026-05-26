"use client";

import { Download, FileDown, Link2 } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";
import { toPng } from "html-to-image";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { exportWeatherCsv } from "@/lib/weather/exportCsv";
import type { WeatherYearDataset } from "@/types/weather";

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
    <div className="flex flex-wrap gap-2">
      <Button
        disabled={!canShareWeatherUrl(shareUrl)}
        onClick={() => {
          void handleShare();
        }}
        type="button"
        variant="outline"
      >
        <Link2 />
        {shareLabel}
      </Button>
      <Button
        disabled={!hasData}
        onClick={() => downloadCsv(datasets)}
        type="button"
        variant="outline"
      >
        <FileDown />
        CSV
      </Button>
      <Button
        disabled={!hasData}
        onClick={() => downloadPng(chartRef)}
        type="button"
        variant="outline"
      >
        <Download />
        PNG
      </Button>
    </div>
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
