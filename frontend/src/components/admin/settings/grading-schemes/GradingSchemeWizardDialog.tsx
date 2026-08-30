"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/common/Dialog";
import InputField from "@/components/InputField";
import {
  CreateGradingSchemePayload,
  ErrorResponse,
  GradingScheme,
  GradingSchemeRounding,
  GradingSchemeScopeType,
  UpdateGradingSchemePayload,
} from "@/@types";
import {
  useActivateGradingScheme,
  useCreateGradingScheme,
  useGetCalendars,
  useGetClassLevels,
  useUpdateGradingScheme,
} from "@/hooks/school-admin";
import { MultiSelect, NativeSelect, Switch } from "@mantine/core";
import { toast } from "react-toastify";
import { IconTrash } from "@tabler/icons-react";
import {
  buildTermSelectData,
  getSortedSchoolTerms,
  getTermLabel,
} from "@/utils/schoolTerms";
import {
  BandFormRow,
  SUGGESTED_AF_BANDS,
  bandsFromApi,
  bandsToPayload,
  mapScoreToBand,
  validateBandRows,
} from "./gradingSchemeUtils";

type Props = {
  open: boolean;
  onClose: () => void;
  editingScheme?: GradingScheme | null;
  onSaved: () => void;
};

const emptyBand = (): BandFormRow => ({
  code: "",
  label: "",
  description: "",
  minScore: "",
  maxScore: "",
});

export const GradingSchemeWizardDialog: React.FC<Props> = ({
  open,
  onClose,
  editingScheme,
  onSaved,
}) => {
  const isEdit = Boolean(editingScheme?.id);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [scoreScaleMin, setScoreScaleMin] = useState(0);
  const [scoreScaleMax, setScoreScaleMax] = useState(100);
  const [passMark, setPassMark] = useState(50);
  const [rounding, setRounding] = useState<GradingSchemeRounding>("nearest");
  const [allowManualOverride, setAllowManualOverride] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [scopeType, setScopeType] = useState<GradingSchemeScopeType>("school");
  const [classLevelIds, setClassLevelIds] = useState<string[]>([]);
  const [bands, setBands] = useState<BandFormRow[]>(SUGGESTED_AF_BANDS);
  const [previewScore, setPreviewScore] = useState(75);
  const [confirmActivateOpen, setConfirmActivateOpen] = useState(false);

  const { classLevels } = useGetClassLevels();
  const { calendars } = useGetCalendars();
  const termSelectData = useMemo(() => {
    const sorted = getSortedSchoolTerms(calendars);
    return [
      { value: "", label: "All terms (no restriction)" },
      ...buildTermSelectData(calendars ?? [], sorted),
    ];
  }, [calendars]);
  const { mutate: createScheme, isPending: creating } = useCreateGradingScheme();
  const { mutate: updateScheme, isPending: updating } = useUpdateGradingScheme();
  const { mutate: activateScheme, isPending: activating } =
    useActivateGradingScheme();
  const busy = creating || updating || activating;

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setConfirmActivateOpen(false);
    if (editingScheme) {
      setName(editingScheme.name);
      setScoreScaleMin(editingScheme.scoreScaleMin);
      setScoreScaleMax(editingScheme.scoreScaleMax);
      setPassMark(editingScheme.passMark);
      setRounding(editingScheme.rounding);
      setAllowManualOverride(editingScheme.allowManualOverride);
      setEffectiveFrom(editingScheme.effectiveFrom ?? "");
      setScopeType(editingScheme.scopeType);
      setClassLevelIds(editingScheme.classLevelIds ?? []);
      setBands(
        editingScheme.bands?.length
          ? bandsFromApi(editingScheme.bands)
          : SUGGESTED_AF_BANDS,
      );
    } else {
      setName("");
      setScoreScaleMin(0);
      setScoreScaleMax(100);
      setPassMark(50);
      setRounding("nearest");
      setAllowManualOverride(false);
      setEffectiveFrom("");
      setScopeType("school");
      setClassLevelIds([]);
      setBands(SUGGESTED_AF_BANDS);
    }
  }, [open, editingScheme]);

  const validation = useMemo(
    () => validateBandRows(bands, scoreScaleMin, scoreScaleMax, passMark),
    [bands, scoreScaleMin, scoreScaleMax, passMark],
  );

  const previewBand = useMemo(
    () => mapScoreToBand(previewScore, bands, rounding),
    [previewScore, bands, rounding],
  );

  const classLevelOptions = (classLevels ?? []).map((level) => ({
    value: level.id,
    label: level.name,
  }));

  const updateBand = (index: number, patch: Partial<BandFormRow>) => {
    setBands((prev) =>
      prev.map((band, i) => (i === index ? { ...band, ...patch } : band)),
    );
  };

  const buildPayload = (): CreateGradingSchemePayload => ({
    name: name.trim(),
    scoreScaleMin,
    scoreScaleMax,
    passMark,
    rounding,
    allowManualOverride,
    effectiveFrom: effectiveFrom || null,
    scopeType,
    classLevelIds: scopeType === "classLevels" ? classLevelIds : [],
    bands: bandsToPayload(bands),
  });

  const step1Ok =
    name.trim().length > 0 &&
    scoreScaleMin < scoreScaleMax &&
    passMark >= scoreScaleMin &&
    passMark <= scoreScaleMax &&
    (scopeType === "school" || classLevelIds.length > 0);
  const step2Ok = validation.errors.length === 0;

  const showError = (error: unknown) => {
    toast.error(
      JSON.stringify(
        (error as ErrorResponse)?.response?.data?.message ?? "Request failed",
      ),
    );
  };

  const saveDraft = () => {
    if (!step1Ok || !step2Ok) {
      toast.error(validation.errors[0] || "Fix validation errors before saving");
      return;
    }
    const payload = buildPayload();
    if (isEdit && editingScheme) {
      updateScheme(
        { id: editingScheme.id, payload: payload as UpdateGradingSchemePayload },
        {
          onSuccess: () => {
            toast.success("Draft scheme saved");
            onSaved();
            onClose();
          },
          onError: showError,
        },
      );
      return;
    }
    createScheme(payload, {
      onSuccess: () => {
        toast.success("Draft scheme created");
        onSaved();
        onClose();
      },
      onError: showError,
    });
  };

  const activateNow = () => {
    if (!step1Ok || !step2Ok) {
      toast.error(validation.errors[0] || "Fix validation errors first");
      return;
    }
    const payload = buildPayload();
    if (isEdit && editingScheme) {
      updateScheme(
        { id: editingScheme.id, payload },
        {
          onSuccess: () => {
            activateScheme(editingScheme.id, {
              onSuccess: () => {
                toast.success("Grading scheme activated");
                setConfirmActivateOpen(false);
                onSaved();
                onClose();
              },
              onError: showError,
            });
          },
          onError: showError,
        },
      );
      return;
    }
    createScheme(
      { ...payload, activate: true },
      {
        onSuccess: () => {
          toast.success("Grading scheme activated");
          setConfirmActivateOpen(false);
          onSaved();
          onClose();
        },
        onError: showError,
      },
    );
  };

  const onPrimary = () => {
    if (step < 4) {
      if (step === 1 && !step1Ok) {
        toast.error("Complete scale, pass mark, and scope before continuing");
        return;
      }
      if (step === 2 && !step2Ok) {
        toast.error(validation.errors[0] || "Fix band errors before continuing");
        return;
      }
      setStep((s) => s + 1);
      return;
    }
    saveDraft();
  };

  return (
    <>
      <Dialog
        isOpen={open}
        onClose={onClose}
        dialogTitle={isEdit ? "Edit grading scheme" : "Create grading scheme"}
        subheader={`Step ${step} of 4`}
        saveButtonText={step < 4 ? "Continue" : "Save as draft"}
        onSave={onPrimary}
        busy={busy}
        saveDisabled={busy}
        onBack={step > 1 ? () => setStep((s) => s - 1) : undefined}
        dialogWidth="w-[min(96vw,920px)] max-w-none"
      >
        <div className="space-y-4 px-1">
          {step === 1 && (
            <div className="space-y-3">
              <InputField
                label="Scheme name"
                isTransulent={false}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Scale minimum"
                  type="number"
                  isTransulent={false}
                  value={String(scoreScaleMin)}
                  onChange={(e) => setScoreScaleMin(Number(e.target.value))}
                />
                <InputField
                  label="Scale maximum"
                  type="number"
                  isTransulent={false}
                  value={String(scoreScaleMax)}
                  onChange={(e) => setScoreScaleMax(Number(e.target.value))}
                />
              </div>
              <InputField
                label="Pass mark"
                type="number"
                isTransulent={false}
                value={String(passMark)}
                onChange={(e) => setPassMark(Number(e.target.value))}
              />
              <NativeSelect
                label="Rounding"
                data={[
                  { value: "none", label: "None" },
                  { value: "nearest", label: "Nearest whole" },
                  { value: "up", label: "Round up" },
                  { value: "down", label: "Round down" },
                ]}
                value={rounding}
                onChange={(e) =>
                  setRounding(e.currentTarget.value as GradingSchemeRounding)
                }
              />
              <NativeSelect
                label="Effective from"
                description="Scheme applies from this term onward when grading"
                data={termSelectData}
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.currentTarget.value)}
                disabled={termSelectData.length <= 1}
              />
              <NativeSelect
                label="Scope"
                data={[
                  { value: "school", label: "School-wide" },
                  { value: "classLevels", label: "Selected class levels" },
                ]}
                value={scopeType}
                onChange={(e) =>
                  setScopeType(e.currentTarget.value as GradingSchemeScopeType)
                }
              />
              {scopeType === "classLevels" && (
                <MultiSelect
                  label="Class levels"
                  placeholder="Select class levels"
                  data={classLevelOptions}
                  value={classLevelIds}
                  onChange={setClassLevelIds}
                  searchable
                />
              )}
              <Switch
                label="Allow manual grade override (teachers)"
                checked={allowManualOverride}
                onChange={(e) =>
                  setAllowManualOverride(e.currentTarget.checked)
                }
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-neutral-600">
                  Define grade bands. Overlaps are blocked; gaps are warned.
                </p>
                <button
                  type="button"
                  className="text-xs text-purple-600 underline cursor-pointer"
                  onClick={() => setBands(SUGGESTED_AF_BANDS)}
                >
                  Fill suggested A–F
                </button>
              </div>
              {bands.map((band, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-3 items-start border border-neutral-200 rounded-lg p-3"
                >
                  <div className="col-span-1">
                    <InputField
                      label="Code"
                      isTransulent={false}
                      value={band.code}
                      onChange={(e) => updateBand(index, { code: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <InputField
                      label="Label"
                      isTransulent={false}
                      value={band.label}
                      onChange={(e) =>
                        updateBand(index, { label: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <InputField
                      label="Min"
                      type="number"
                      isTransulent={false}
                      value={String(band.minScore)}
                      onChange={(e) =>
                        updateBand(index, {
                          minScore:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <InputField
                      label="Max"
                      type="number"
                      isTransulent={false}
                      value={String(band.maxScore)}
                      onChange={(e) =>
                        updateBand(index, {
                          maxScore:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="col-span-6">
                    <InputField
                      label="Description"
                      isTransulent={false}
                      value={band.description}
                      onChange={(e) =>
                        updateBand(index, { description: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-1 mb-4">
                    <span
                      className="mb-1.5 text-xs block invisible select-none"
                      aria-hidden="true"
                    >
                      &nbsp;
                    </span>
                    <button
                      type="button"
                      aria-label="Remove band"
                      title="Remove band"
                      className="h-10 w-full flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent"
                      onClick={() =>
                        setBands((prev) => prev.filter((_, i) => i !== index))
                      }
                      disabled={bands.length <= 1}
                    >
                      <IconTrash size={18} stroke={1.75} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-purple-600 underline cursor-pointer"
                onClick={() => setBands((prev) => [...prev, emptyBand()])}
              >
                Add band
              </button>
              {validation.errors.length > 0 && (
                <div className="rounded-md bg-red-50 text-red-700 text-xs p-2 space-y-1">
                  {validation.errors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}
              {validation.gapWarnings.length > 0 && (
                <div className="rounded-md bg-amber-50 text-amber-800 text-xs p-2 space-y-1">
                  {validation.gapWarnings.map((warn) => (
                    <p key={warn}>{warn}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <InputField
                label="Sample score"
                type="number"
                isTransulent={false}
                value={String(previewScore)}
                onChange={(e) => setPreviewScore(Number(e.target.value))}
              />
              <input
                type="range"
                min={scoreScaleMin}
                max={scoreScaleMax}
                value={previewScore}
                onChange={(e) => setPreviewScore(Number(e.target.value))}
                className="w-full"
              />
              <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
                <p className="text-sm text-neutral-500">Mapped grade</p>
                {previewBand ? (
                  <>
                    <p className="text-xl font-semibold text-neutral-900">
                      {previewBand.code} — {previewBand.label}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {previewBand.description || "No description"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-amber-700">
                    No band matches this score (check gaps).
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-sm text-neutral-700">
              <p>
                <span className="font-medium">Name:</span> {name}
              </p>
              <p>
                <span className="font-medium">Scale:</span> {scoreScaleMin}–
                {scoreScaleMax} (pass {passMark}, rounding {rounding})
              </p>
              <p>
                <span className="font-medium">Scope:</span>{" "}
                {scopeType === "school"
                  ? "School-wide"
                  : `${classLevelIds.length} class level(s)`}
              </p>
              <p>
                <span className="font-medium">Effective from:</span>{" "}
                {getTermLabel(calendars, effectiveFrom)}
              </p>
              <p>
                <span className="font-medium">Bands:</span> {bands.length}
              </p>
              {validation.gapWarnings.length > 0 && (
                <div className="rounded-md bg-amber-50 text-amber-800 text-xs p-2">
                  {validation.gapWarnings.join(" · ")}
                </div>
              )}
              <button
                type="button"
                className="rounded-lg bg-purple-600 text-white px-3 py-1.5 text-sm cursor-pointer hover:bg-purple-700 disabled:opacity-50"
                onClick={() => setConfirmActivateOpen(true)}
                disabled={busy || !step2Ok}
              >
                Activate now
              </button>
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        isOpen={confirmActivateOpen}
        onClose={() => setConfirmActivateOpen(false)}
        dialogTitle="Activate grading scheme?"
        subheader="This becomes the active scheme for the selected scope and syncs letter grades used by teachers."
        saveButtonText="Activate"
        onSave={activateNow}
        busy={busy}
      >
        <p className="text-sm text-neutral-600 px-1">
          Any overlapping active scheme will be deactivated. Confirm to continue.
        </p>
      </Dialog>
    </>
  );
};
