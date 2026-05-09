"use client";

import { ErrorResponse } from "@/@types";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import Badge from "@/components/common/Badge";
import {
  useClearHubtelMerchantConfig,
  useGetHubtelMerchantConfig,
  useUpsertHubtelMerchantConfig,
} from "@/hooks/super-admin";
import {
  IconAlertTriangle,
  IconBuildingBank,
  IconCopy,
  IconPlugConnected,
  IconX,
} from "@tabler/icons-react";
import { Switch } from "@mantine/core";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

interface HubtelMerchantTabSectionProps {
  schoolId: string;
  schoolName?: string;
}

type MerchantFormState = {
  clientId: string;
  clientSecret: string;
  collectionAccountNumber: string;
  active: boolean;
};

const CALLBACK_PLACEHOLDER = "Callback URL is not available for this environment.";

export const HubtelMerchantTabSection: React.FC<HubtelMerchantTabSectionProps> = ({
  schoolId,
  schoolName,
}) => {
  const [form, setForm] = useState<MerchantFormState>({
    clientId: "",
    clientSecret: "",
    collectionAccountNumber: "",
    active: true,
  });
  const [copied, setCopied] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const {
    merchantConfig,
    isPending: loadingConfig,
    refetch,
  } = useGetHubtelMerchantConfig(schoolId);
  const { mutate: upsertConfig, isPending: saving } =
    useUpsertHubtelMerchantConfig(schoolId);
  const { mutate: clearConfig, isPending: clearing } =
    useClearHubtelMerchantConfig(schoolId);

  const merchant = merchantConfig?.merchant;

  useEffect(() => {
    if (!merchant) return;
    setForm({
      clientId: merchant.clientId ?? "",
      collectionAccountNumber: merchant.collectionAccountNumber ?? "",
      active: merchant.active ?? true,
      clientSecret: "",
    });
  }, [merchant]);

  const callbackUrl = merchant?.primaryCallbackUrl || "";
  const canCopyCallback = Boolean(callbackUrl);
  const requiredFieldsPopulated =
    form.clientId.trim().length > 0 &&
    form.clientSecret.trim().length > 0 &&
    form.collectionAccountNumber.trim().length > 0;

  const schoolLabel = useMemo(
    () => schoolName || merchantConfig?.schoolId || "this school",
    [merchantConfig?.schoolId, schoolName],
  );

  const getErrorMessage = (error: unknown, fallback: string) => {
    const message =
      (error as ErrorResponse)?.response?.data?.message ||
      (error as { message?: string })?.message;
    return message || fallback;
  };

  const validate = () => {
    const clientId = form.clientId.trim();
    const clientSecret = form.clientSecret.trim();
    const collectionAccountNumber = form.collectionAccountNumber.trim();

    if (clientId.length < 3 || clientId.length > 128) {
      toast.error("Client ID must be between 3 and 128 characters.");
      return false;
    }
    if (clientSecret.length < 3 || clientSecret.length > 256) {
      toast.error("Client secret must be between 3 and 256 characters.");
      return false;
    }
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(collectionAccountNumber)) {
      toast.error(
        "Collection account number can only include letters, numbers, underscore, or hyphen (max 32).",
      );
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    upsertConfig(
      {
        clientId: form.clientId.trim(),
        clientSecret: form.clientSecret.trim(),
        collectionAccountNumber: form.collectionAccountNumber.trim(),
        active: form.active,
      },
      {
        onSuccess: () => {
          toast.success("Hubtel merchant configuration updated.");
          setForm((prev) => ({ ...prev, clientSecret: "" }));
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, "Unable to save configuration."));
        },
      },
    );
  };

  const handleClear = () => {
    clearConfig(undefined, {
      onSuccess: () => {
        toast.success("Hubtel merchant configuration cleared.");
        setForm({
          clientId: "",
          clientSecret: "",
          collectionAccountNumber: "",
          active: false,
        });
        setIsRemoveDialogOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(getErrorMessage(error, "Unable to clear configuration."));
      },
    });
  };

  const copyCallbackUrl = async () => {
    if (!callbackUrl) return;
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy callback URL.");
    }
  };

  return (
    <div className="pb-8">
      <h1 className="text-2xl text-neutral-900">Hubtel merchant (payments)</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Configure or rotate Hubtel API credentials for {schoolLabel}.
      </p>

      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <IconPlugConnected size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900">Current status</h3>
              <p className="text-sm text-zinc-500">
                Live merchant for {schoolLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              text={merchant?.configured ? "Configured" : "Not configured"}
              variant={merchant?.configured ? "green" : "gray"}
              showDot
            />
            <Badge
              text={merchant?.active ? "Active" : "Inactive"}
              variant={merchant?.active ? "active" : "inactive"}
              showDot
            />
          </div>
        </div>

        <hr className="my-4 border-zinc-100" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Client ID</p>
            <div className="mt-2 inline-flex items-center rounded-lg bg-[#F1F0FF] px-2 py-1 font-mono text-xs font-medium">
              {merchant?.clientId || "Not set"}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Collection account number
            </p>
            <div className="mt-2 inline-flex items-center rounded-lg bg-[#F1F0FF] px-2 py-1 font-mono text-xs font-medium">
              {merchant?.collectionAccountNumber || "Not set"}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="text-xl font-semibold text-zinc-900">Credentials</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Saving overwrites existing credentials. The client secret is encrypted and never displayed again.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <InputField
              label="Client ID"
              required
              value={form.clientId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  clientId: e.target.value,
                }))
              }
              placeholder="hbtl_live_8f2a91"
            />
            <InputField
              label="Collection account number"
              required
              value={form.collectionAccountNumber}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  collectionAccountNumber: e.target.value,
                }))
              }
              placeholder="2025314"
            />
          </div>

          <InputField
            label="Client secret"
            required
            type="password"
            value={form.clientSecret}
            autoComplete="off"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                clientSecret: e.target.value,
              }))
            }
            placeholder="Enter new secret to rotate"
          />
          <p className="-mt-2 mb-4 text-xs text-zinc-500">
            Treat this like a password. Cleared from this form after a successful save.
          </p>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Active</p>
                <p className="text-xs text-zinc-500">
                  When off, the school can be saved but won&apos;t accept payments.
                </p>
              </div>
              <Switch
                checked={form.active}
                onChange={(e) => {
                  const isChecked = e.currentTarget.checked;
                  setForm((prev) => ({
                    ...prev,
                    active: isChecked,
                  }));
                }}
                color="#AB58E7"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <CustomButton
              text="Save"
              onClick={handleSave}
              loading={saving}
              disabled={clearing || loadingConfig || !requiredFieldsPopulated}
              className="rounded-lg! py-1.5! text-sm!"
            />
          </div>
        </section>

        <section className="self-start rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900">Callback URL</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Paste this into the Hubtel app&apos;s &apos;Receive Money&apos; callback field.
          </p>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <p className="flex-1 truncate font-mono text-xs text-zinc-800">
                {callbackUrl || CALLBACK_PLACEHOLDER}
              </p>
              <button
                type="button"
                onClick={copyCallbackUrl}
                disabled={!canCopyCallback}
                title={copied ? "Copied" : "Copy callback URL"}
                className="cursor-pointer rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconCopy size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {merchant?.configured && (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-red-200 p-2 rounded-lg">
                <IconAlertTriangle className="text-red-500" size={20} />
              </div>
              <div>
                <h4 className="text-base font-semibold">Danger zone</h4>
                <p className="text-sm text-gray-500">
                  Removing the configuration clears all credentials and deactivates Hubtel for this school.
                </p>
                <p className="text-sm text-gray-500">
                  Payments will fail until reconfigured.
                </p>
              </div>
            </div>

            <CustomButton
              text="Remove Hubtel configuration"
              onClick={() => setIsRemoveDialogOpen(true)}
              loading={clearing}
              disabled={saving || loadingConfig}
              icon={<IconBuildingBank size={16} />}
              className="!bg-red-600 hover:!bg-red-700 rounded-lg! py-1.5! text-sm!"
            />
          </div>
        </section>
      )}

      {isRemoveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[540px] rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl text-zinc-900">Remove Hubtel configuration?</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Hubtel payments for <span className="font-semibold text-zinc-800">{schoolLabel}</span> will stop
                  immediately.
                </p>
                <p className="text-sm text-zinc-500">
                  Parents and students won&apos;t be able to pay fees until a Super Admin reconfigures credentials.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="cursor-pointer text-zinc-500 hover:text-zinc-700"
                onClick={() => setIsRemoveDialogOpen(false)}
                disabled={clearing}
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRemoveDialogOpen(false)}
                disabled={clearing}
                className="cursor-pointer text-sm! rounded-xl border border-zinc-200 bg-white px-4 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={clearing}
                className="cursor-pointer text-sm! rounded-xl bg-red-600 px-4 py-1.5 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {clearing ? "Removing..." : "Yes, remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
