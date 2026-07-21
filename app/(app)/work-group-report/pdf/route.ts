export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { getDictionary } from "@/lib/i18n/server";
import {
  buildReportGroups,
  getDays,
  getGroupsForCell,
  type ReportDay,
  type ReportGroup,
  type ReportMember,
  type ReportPeriod,
  type WorkGroupAssignmentRecord,
} from "@/lib/workGroups/workGroupReport";

const pageWidth = 842;
const pageHeight = 595;
const margin = 20;
const labelColumnWidth = 58;
const headerHeight = 24;
const footerHeight = 18;
const titleHeight = 28;
const rowHeight =
  (pageHeight - margin * 2 - titleHeight - headerHeight - footerHeight) / 2;
const minimumContentScale = 0.42;

type PdfLayoutMetrics = {
  contentScale: number;
  cellTopPadding: number;
  cellBottomPadding: number;
  cellPaddingX: number;
  groupGap: number;
  separatorGap: number;
  titleFontSize: number;
  titleLineHeight: number;
  timeFontSize: number;
  timeLineHeight: number;
  memberFontSize: number;
  memberLineHeight: number;
};

type PdfTextStyle = {
  font?: "regular" | "bold";
  size?: number;
  color?: [number, number, number];
};

type PdfPageBuilder = {
  commands: string[];
  rect: (
    x: number,
    y: number,
    width: number,
    height: number,
    options?: {
      fill?: [number, number, number];
      stroke?: [number, number, number];
      lineWidth?: number;
    }
  ) => void;
  text: (
    value: string,
    x: number,
    y: number,
    style?: PdfTextStyle
  ) => void;
};

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function toPdfY(y: number) {
  return pageHeight - y;
}

function setColor(color: [number, number, number], operator: "rg" | "RG") {
  return `${color.map((component) => component.toFixed(3)).join(" ")} ${operator}`;
}

function wrapText(value: string, maxWidth: number, fontSize: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const averageCharWidth = fontSize * 0.58;
  const maxChars = Math.max(8, Math.floor(maxWidth / averageCharWidth));
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxChars) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (word.length <= maxChars) {
      currentLine = word;
      return;
    }

    for (let index = 0; index < word.length; index += maxChars) {
      lines.push(word.slice(index, index + maxChars));
    }

    currentLine = "";
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
}

function createPdfPageBuilder(): PdfPageBuilder {
  const commands: string[] = [];

  return {
    commands,
    rect(x, y, width, height, options = {}) {
      const fill = options.fill;
      const stroke = options.stroke ?? [0.22, 0.29, 0.11];
      const lineWidth = options.lineWidth ?? 0.6;
      const pdfY = pageHeight - y - height;

      commands.push("q");
      commands.push(`${lineWidth.toFixed(2)} w`);

      if (fill) {
        commands.push(setColor(fill, "rg"));
        commands.push(`${x.toFixed(2)} ${pdfY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
      }

      commands.push(setColor(stroke, "RG"));
      commands.push(`${x.toFixed(2)} ${pdfY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`);
      commands.push("Q");
    },
    text(value, x, y, style = {}) {
      const fontName = style.font === "bold" ? "F2" : "F1";
      const fontSize = style.size ?? 8;
      const color = style.color ?? [0.13, 0.18, 0.08];

      commands.push("BT");
      commands.push(setColor(color, "rg"));
      commands.push(`/${fontName} ${fontSize.toFixed(2)} Tf`);
      commands.push(`1 0 0 1 ${x.toFixed(2)} ${toPdfY(y).toFixed(2)} Tm`);
      commands.push(`(${escapePdfText(value)}) Tj`);
      commands.push("ET");
    },
  };
}

function drawWrappedText({
  page,
  value,
  x,
  y,
  maxWidth,
  fontSize,
  lineHeight,
  maxY,
  style,
}: {
  page: PdfPageBuilder;
  value: string;
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  lineHeight: number;
  maxY: number;
  style?: PdfTextStyle;
}) {
  let nextY = y;

  for (const line of wrapText(value, maxWidth, fontSize)) {
    if (nextY > maxY) {
      page.text("...", x, nextY, {
        ...style,
        size: fontSize,
      });
      return nextY + lineHeight;
    }

    page.text(line, x, nextY, {
      ...style,
      size: fontSize,
    });
    nextY += lineHeight;
  }

  return nextY;
}

function drawMember({
  page,
  member,
  x,
  y,
  maxWidth,
  maxY,
  metrics,
}: {
  page: PdfPageBuilder;
  member: ReportMember;
  x: number;
  y: number;
  maxWidth: number;
  maxY: number;
  metrics: PdfLayoutMetrics;
}) {
  return drawWrappedText({
    page,
    value: member.name,
    x,
    y,
    maxWidth,
    fontSize: metrics.memberFontSize,
    lineHeight: metrics.memberLineHeight,
    maxY,
    style: {
      font: member.isLead ? "bold" : "regular",
      color: member.isLead ? [0.78, 0, 0] : [0.13, 0.18, 0.08],
    },
  });
}

function drawGroup({
  page,
  group,
  x,
  y,
  width,
  maxY,
  metrics,
}: {
  page: PdfPageBuilder;
  group: ReportGroup;
  x: number;
  y: number;
  width: number;
  maxY: number;
  metrics: PdfLayoutMetrics;
}) {
  let nextY = drawWrappedText({
    page,
    value: group.title.toUpperCase(),
    x,
    y,
    maxWidth: width,
    fontSize: metrics.titleFontSize,
    lineHeight: metrics.titleLineHeight,
    maxY,
    style: {
      font: "bold",
    },
  });

  page.text(`(${group.timeLabel})`, x, nextY, {
    font: "bold",
    size: metrics.timeFontSize,
  });
  nextY += metrics.timeLineHeight;

  if (group.members.length === 0) {
    page.text("-", x, nextY, { size: metrics.memberFontSize });
    return nextY + metrics.memberLineHeight;
  }

  group.members.forEach((member) => {
    nextY = drawMember({
      page,
      member,
      x,
      y: nextY,
      maxWidth: width,
      maxY,
      metrics,
    });
  });

  return nextY;
}

function drawCellGroups({
  page,
  groups,
  x,
  y,
  width,
  height,
  metrics,
}: {
  page: PdfPageBuilder;
  groups: ReportGroup[];
  x: number;
  y: number;
  width: number;
  height: number;
  metrics: PdfLayoutMetrics;
}) {
  let nextY = y + metrics.cellTopPadding;
  const maxY = y + height - metrics.cellBottomPadding;

  groups.forEach((group, index) => {
    if (index > 0) {
      page.rect(x, nextY - metrics.separatorGap / 2, width, 0.1, {
        stroke: [0.72, 0.76, 0.68],
        lineWidth: 0.3,
      });
      nextY += metrics.separatorGap;
    }

    nextY = drawGroup({
      page,
      group,
      x: x + metrics.cellPaddingX,
      y: nextY,
      width: width - metrics.cellPaddingX * 2,
      maxY,
      metrics,
    });
    nextY += metrics.groupGap;
  });
}

function createLayoutMetrics(contentScale: number): PdfLayoutMetrics {
  const scale = Math.max(minimumContentScale, Math.min(contentScale, 1));

  return {
    contentScale: scale,
    cellTopPadding: 8 * scale,
    cellBottomPadding: 7 * scale,
    cellPaddingX: Math.max(2.5, 5 * scale),
    groupGap: 4.2 * scale,
    separatorGap: 4.2 * scale,
    titleFontSize: Math.max(4.8, 7.8 * scale),
    titleLineHeight: Math.max(5.3, 8.8 * scale),
    timeFontSize: Math.max(4.7, 7.5 * scale),
    timeLineHeight: Math.max(5.2, 9.2 * scale),
    memberFontSize: Math.max(4.6, 7.4 * scale),
    memberLineHeight: Math.max(5.1, 8.4 * scale),
  };
}

function estimateWrappedTextHeight({
  value,
  maxWidth,
  fontSize,
  lineHeight,
}: {
  value: string;
  maxWidth: number;
  fontSize: number;
  lineHeight: number;
}) {
  return wrapText(value, maxWidth, fontSize).length * lineHeight;
}

function estimateGroupHeight({
  group,
  width,
  metrics,
}: {
  group: ReportGroup;
  width: number;
  metrics: PdfLayoutMetrics;
}) {
  const contentWidth = width - metrics.cellPaddingX * 2;
  const titleHeight = estimateWrappedTextHeight({
    value: group.title.toUpperCase(),
    maxWidth: contentWidth,
    fontSize: metrics.titleFontSize,
    lineHeight: metrics.titleLineHeight,
  });

  if (group.members.length === 0) {
    return titleHeight + metrics.timeLineHeight + metrics.memberLineHeight;
  }

  return group.members.reduce(
    (height, member) =>
      height +
      estimateWrappedTextHeight({
        value: member.name,
        maxWidth: contentWidth,
        fontSize: metrics.memberFontSize,
        lineHeight: metrics.memberLineHeight,
      }),
    titleHeight + metrics.timeLineHeight
  );
}

function estimateCellHeight({
  groups,
  width,
  metrics,
}: {
  groups: ReportGroup[];
  width: number;
  metrics: PdfLayoutMetrics;
}) {
  if (groups.length === 0) {
    return metrics.cellTopPadding + metrics.cellBottomPadding;
  }

  return (
    metrics.cellTopPadding +
    metrics.cellBottomPadding +
    groups.reduce((height, group, index) => {
      return (
        height +
        (index > 0 ? metrics.separatorGap : 0) +
        estimateGroupHeight({
          group,
          width,
          metrics,
        }) +
        metrics.groupGap
      );
    }, 0)
  );
}

function getPeriodLayoutMetrics({
  days,
  groups,
  period,
  width,
  height,
}: {
  days: ReportDay[];
  groups: ReportGroup[];
  period: ReportPeriod;
  width: number;
  height: number;
}) {
  let scale = 1;

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const metrics = createLayoutMetrics(scale);
    const requiredHeight = Math.max(
      ...days.map((day) =>
        estimateCellHeight({
          groups: getGroupsForCell({
            groups,
            dayKey: day.key,
            period,
          }),
          width,
          metrics,
        })
      ),
      1
    );
    const nextScale = Math.min(scale, (scale * height) / requiredHeight);

    if (requiredHeight <= height || Math.abs(nextScale - scale) < 0.01) {
      return createLayoutMetrics(nextScale);
    }

    scale = Math.max(minimumContentScale, nextScale);
  }

  return createLayoutMetrics(scale);
}

function buildPdf({
  title,
  days,
  groups,
  morningLabel,
  afternoonLabel,
  leadHelp,
}: {
  title: string;
  days: ReportDay[];
  groups: ReportGroup[];
  morningLabel: string;
  afternoonLabel: string;
  leadHelp: string;
}) {
  const page = createPdfPageBuilder();
  const startX = margin;
  const startY = margin + titleHeight;
  const tableWidth = pageWidth - margin * 2;
  const dayColumnWidth = (tableWidth - labelColumnWidth) / Math.max(days.length, 1);
  const periods: { key: ReportPeriod; label: string }[] = [
    { key: "morning", label: morningLabel },
    { key: "afternoon", label: afternoonLabel },
  ];

  page.text(title, margin, margin + 6, {
    font: "bold",
    size: 16,
  });

  page.rect(startX, startY, labelColumnWidth, headerHeight, {
    fill: [1, 1, 1],
  });

  days.forEach((day, index) => {
    page.rect(
      startX + labelColumnWidth + index * dayColumnWidth,
      startY,
      dayColumnWidth,
      headerHeight,
      {
        fill: [0.82, 0.9, 0.98],
      }
    );
    page.text(day.label, startX + labelColumnWidth + index * dayColumnWidth + 8, startY + 17, {
      font: "bold",
      size: days.length > 4 ? 8 : 9,
    });
  });

  periods.forEach((period, periodIndex) => {
    const rowY = startY + headerHeight + periodIndex * rowHeight;
    const metrics = getPeriodLayoutMetrics({
      days,
      groups,
      period: period.key,
      width: dayColumnWidth,
      height: rowHeight,
    });

    page.rect(startX, rowY, labelColumnWidth, rowHeight, {
      fill: [0.82, 0.9, 0.98],
    });
    page.text(period.label.toUpperCase(), startX + 10, rowY + rowHeight / 2, {
      font: "bold",
      size: Math.max(7, 9 * metrics.contentScale),
    });

    days.forEach((day, dayIndex) => {
      const cellX = startX + labelColumnWidth + dayIndex * dayColumnWidth;
      const cellGroups = getGroupsForCell({
        groups,
        dayKey: day.key,
        period: period.key,
      });

      page.rect(cellX, rowY, dayColumnWidth, rowHeight, {
        fill: [1, 1, 1],
      });
      drawCellGroups({
        page,
        groups: cellGroups,
        x: cellX,
        y: rowY,
        width: dayColumnWidth,
        height: rowHeight,
        metrics,
      });
    });
  });

  page.text(leadHelp, pageWidth / 2 - 160, pageHeight - margin - 6, {
    size: 8,
    color: [0.13, 0.18, 0.08],
  });

  return createPdfDocument(page.commands.join("\n"));
}

function createPdfDocument(content: string) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");

  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

export async function GET() {
  const [{ supabase, tenant, activeCompany }, { dict }] = await Promise.all([
    requireCompanyContext(),
    getDictionary(),
  ]);

  let groups: ReportGroup[] = [];

  if (activeCompany) {
    const { data, error } = await supabase
      .from("work_group_assignments")
      .select(
        "id, is_lead, work_group_id, work_groups:work_group_id(id, code, description, scheduled_at), treasury_members:treasury_member_id(first_name, last_name, is_default)"
      )
      .eq("tenant_id", tenant.id)
      .eq("company_id", activeCompany.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(
        `${dict.workGroups.assignmentsReadError}: ${error.message}`
      );
    }

    groups = buildReportGroups((data ?? []) as WorkGroupAssignmentRecord[]);
  }

  const days = getDays(groups);
  const pdf = buildPdf({
    title: dict.workGroups.reportTitle,
    days,
    groups,
    morningLabel: dict.workGroups.morning,
    afternoonLabel: dict.workGroups.afternoon,
    leadHelp: dict.workGroups.reportLeadHelp,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="informe-grupos-trabajo.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
