"use client";

import React, { useMemo, useState } from "react";
import CustomUnderlinedButton from "../../../common/CustomUnderlinedButton";
import NoAvailableEmptyState from "../../../common/NoAvailableEmptyState";
import { Dialog } from "@/components/common/Dialog";
import {
  ErrorResponse,
  GradingScheme,
  GradingSchemeStatus,
} from "@/@types";
import {
  useActivateGradingScheme,
  useDeactivateGradingScheme,
  useDeleteGradingScheme,
  useDuplicateGradingScheme,
  useGetCalendars,
  useGetGradingSchemes,
  useNewGradingSchemeVersion,
} from "@/hooks/school-admin";
import { toast } from "react-toastify";
import { getTermLabel } from "@/utils/schoolTerms";
import { GradingSchemeWizardDialog } from "./GradingSchemeWizardDialog";
import { GradingSchemeDetailDrawer } from "./GradingSchemeDetailDrawer";

const TABS: Array<{ key: GradingSchemeStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "draft", label: "Draft" },
  { key: "inactive", label: "Inactive" },
];

function badgeClass(status: GradingSchemeStatus) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "draft") return "bg-amber-50 text-amber-800";
  return "bg-neutral-100 text-neutral-600";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const GradingSchemesSection: React.FC = () => {
  const [tab, setTab] = useState<GradingSchemeStatus | "all">("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<GradingScheme | null>(null);
  const [detailScheme, setDetailScheme] = useState<GradingScheme | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "activate" | "deactivate" | "delete";
    scheme: GradingScheme;
  } | null>(null);

  const { schemes, isLoading, refetch } = useGetGradingSchemes(
    tab === "all" ? "" : tab,
  );
  const { calendars } = useGetCalendars();
  const { mutate: activateScheme, isPending: activating } =
    useActivateGradingScheme();
  const { mutate: deactivateScheme, isPending: deactivating } =
    useDeactivateGradingScheme();
  const { mutate: deleteScheme, isPending: deleting } =
    useDeleteGradingScheme();
  const { mutate: duplicateScheme, isPending: duplicating } =
    useDuplicateGradingScheme();
  const { mutate: createVersion, isPending: versioning } =
    useNewGradingSchemeVersion();

  const rows = useMemo(() => schemes ?? [], [schemes]);

  const onError = (error: unknown) => {
    toast.error(
      JSON.stringify(
        (error as ErrorResponse)?.response?.data?.message ?? "Request failed",
      ),
    );
  };

  const openCreate = () => {
    setEditingScheme(null);
    setWizardOpen(true);
  };

  const openEdit = (scheme: GradingScheme) => {
    if (scheme.status !== "draft") {
      toast.info("Only draft schemes can be edited. Create a new version instead.");
      return;
    }
    setEditingScheme(scheme);
    setWizardOpen(true);
  };

  const runConfirm = () => {
    if (!confirmAction) return;
    const { type, scheme } = confirmAction;
    if (type === "activate") {
      activateScheme(scheme.id, {
        onSuccess: () => {
          toast.success("Scheme activated");
          setConfirmAction(null);
          refetch();
        },
        onError,
      });
      return;
    }
    if (type === "deactivate") {
      deactivateScheme(scheme.id, {
        onSuccess: () => {
          toast.success("Scheme deactivated");
          setConfirmAction(null);
          refetch();
        },
        onError,
      });
      return;
    }
    deleteScheme(scheme.id, {
      onSuccess: () => {
        toast.success("Scheme deleted");
        setConfirmAction(null);
        if (detailScheme?.id === scheme.id) setDetailScheme(null);
        refetch();
      },
      onError,
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-md font-semibold text-neutral-800">
          Grading schemes
        </h1>
        <CustomUnderlinedButton
          text="Create scheme"
          textColor="text-purple-500"
          onClick={openCreate}
          showIcon={false}
        />
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Configure scoring scale, grade bands, pass mark, and rounding. Save as
        draft, then activate when ready.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium ${
              tab === item.key
                ? "bg-purple-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-3 py-2.5 font-medium text-neutral-600">Name</th>
              <th className="px-3 py-2.5 font-medium text-neutral-600">Version</th>
              <th className="px-3 py-2.5 font-medium text-neutral-600">Scale</th>
              <th className="px-3 py-2.5 font-medium text-neutral-600">Pass</th>
              <th className="px-3 py-2.5 font-medium text-neutral-600">Scope</th>
              <th className="px-3 py-2.5 font-medium text-neutral-600">Status</th>
              <th className="px-3 py-2.5 font-medium text-neutral-600">
                Effective
              </th>
              <th className="px-3 py-2.5 font-medium text-neutral-600">Updated</th>
              <th className="px-3 py-2.5 font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((scheme) => (
              <tr
                key={scheme.id}
                className="border-b border-neutral-100 hover:bg-neutral-50/80"
              >
                <td className="px-3 py-2.5 font-medium text-neutral-900">
                  {scheme.name}
                </td>
                <td className="px-3 py-2.5 text-neutral-700">v{scheme.version}</td>
                <td className="px-3 py-2.5 text-neutral-700">
                  {scheme.scoreScaleMin}–{scheme.scoreScaleMax}
                </td>
                <td className="px-3 py-2.5 text-neutral-700">{scheme.passMark}</td>
                <td className="px-3 py-2.5 text-neutral-700">
                  {scheme.scopeType === "school"
                    ? "School-wide"
                    : `${scheme.classLevelIds?.length ?? 0} levels`}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${badgeClass(
                      scheme.status,
                    )}`}
                  >
                    {scheme.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-neutral-700">
                  {getTermLabel(calendars, scheme.effectiveFrom, "—")}
                </td>
                <td className="px-3 py-2.5 text-neutral-700">
                  {formatDate(scheme.updatedAt)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      className="cursor-pointer text-purple-600 underline"
                      onClick={() => setDetailScheme(scheme)}
                    >
                      View
                    </button>
                    {scheme.status === "draft" && (
                      <button
                        type="button"
                        className="cursor-pointer text-purple-600 underline"
                        onClick={() => openEdit(scheme)}
                      >
                        Edit
                      </button>
                    )}
                    {scheme.status !== "active" && (
                      <button
                        type="button"
                        className="cursor-pointer text-emerald-700 underline"
                        onClick={() =>
                          setConfirmAction({ type: "activate", scheme })
                        }
                      >
                        Activate
                      </button>
                    )}
                    {scheme.status === "active" && (
                      <>
                        <button
                          type="button"
                          className="cursor-pointer text-amber-700 underline"
                          onClick={() =>
                            setConfirmAction({ type: "deactivate", scheme })
                          }
                        >
                          Deactivate
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer text-purple-600 underline disabled:opacity-50"
                          disabled={versioning}
                          onClick={() =>
                            createVersion(scheme.id, {
                              onSuccess: () => {
                                toast.success("New draft version created");
                                refetch();
                              },
                              onError,
                            })
                          }
                        >
                          New version
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="cursor-pointer text-neutral-600 underline disabled:opacity-50"
                      disabled={duplicating}
                      onClick={() =>
                        duplicateScheme(scheme.id, {
                          onSuccess: () => {
                            toast.success("Scheme duplicated as draft");
                            refetch();
                          },
                          onError,
                        })
                      }
                    >
                      Duplicate
                    </button>
                    {scheme.status !== "active" && (
                      <button
                        type="button"
                        className="cursor-pointer text-red-600 underline"
                        onClick={() =>
                          setConfirmAction({ type: "delete", scheme })
                        }
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8">
                  <NoAvailableEmptyState message="No grading schemes yet. Create one to configure scoring and grade bands." />
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-8 text-center text-neutral-500"
                >
                  Loading schemes…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <GradingSchemeWizardDialog
        open={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setEditingScheme(null);
        }}
        editingScheme={editingScheme}
        onSaved={() => refetch()}
      />

      <GradingSchemeDetailDrawer
        scheme={detailScheme}
        onClose={() => setDetailScheme(null)}
        onActivate={(scheme) => setConfirmAction({ type: "activate", scheme })}
        onDeactivate={(scheme) =>
          setConfirmAction({ type: "deactivate", scheme })
        }
        onDelete={(scheme) => setConfirmAction({ type: "delete", scheme })}
        onNewVersion={(scheme) =>
          createVersion(scheme.id, {
            onSuccess: () => {
              toast.success("New draft version created");
              setDetailScheme(null);
              refetch();
            },
            onError,
          })
        }
        onEdit={(scheme) => {
          setDetailScheme(null);
          openEdit(scheme);
        }}
      />

      <Dialog
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        dialogTitle={
          confirmAction?.type === "activate"
            ? "Activate grading scheme?"
            : confirmAction?.type === "deactivate"
              ? "Deactivate grading scheme?"
              : "Delete grading scheme?"
        }
        subheader={
          confirmAction?.type === "activate"
            ? "This replaces any overlapping active scheme for the same scope and syncs teacher letter grades."
            : confirmAction?.type === "deactivate"
              ? "Teachers will keep current letter bands until another scheme is activated."
              : "This permanently removes the scheme and its grade bands. This cannot be undone."
        }
        saveButtonText={
          confirmAction?.type === "activate"
            ? "Activate"
            : confirmAction?.type === "deactivate"
              ? "Deactivate"
              : "Delete"
        }
        onSave={runConfirm}
        busy={activating || deactivating || deleting}
      >
        <p className="px-1 text-sm text-neutral-600">
          Scheme:{" "}
          <span className="font-medium">{confirmAction?.scheme.name}</span> (v
          {confirmAction?.scheme.version})
        </p>
        {confirmAction?.type === "activate" &&
        confirmAction.scheme.bands?.length ? (
          <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-neutral-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-2 py-1 text-left">Grade</th>
                  <th className="px-2 py-1 text-left">Label</th>
                  <th className="px-2 py-1 text-left">Range</th>
                </tr>
              </thead>
              <tbody>
                {confirmAction.scheme.bands.map((band) => (
                  <tr key={band.id ?? `${band.code}-${band.minScore}`} className="border-t">
                    <td className="px-2 py-1">{band.code}</td>
                    <td className="px-2 py-1">{band.label}</td>
                    <td className="px-2 py-1 tabular-nums">
                      {band.minScore}–{band.maxScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
};
