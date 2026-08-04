"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, Check, Loader2, Upload } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type {
  MealSpiceLevel,
  MealStockStatus,
  MealDTO,
  MealVariationGroupDTO,
  MealVariationOptionDTO,
  VariationSelectionType,
} from "@/types";

interface VariationOptionForm extends Omit<MealVariationOptionDTO, "id"> {
  clientId: string;
}

interface VariationGroupForm extends Omit<MealVariationGroupDTO, "id" | "options"> {
  clientId: string;
  options: VariationOptionForm[];
}

type MealForm = Omit<MealDTO, "id" | "variationGroups"> & {
  variationGroups: VariationGroupForm[];
};

function isLocalMealPhotoUrl(imageUrl: string) {
  return imageUrl.startsWith("/api/meal-photos?");
}

const MAX_MEAL_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MEAL_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EMPTY: MealForm = {
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  isAvailable: true,
  stockStatus: "IN_STOCK",
  allergenInfo: null,
  spiceLevel: null,
  sortOrder: 0,
  variationGroups: [],
};

function createClientId() {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyOption(sortOrder = 0): VariationOptionForm {
  return {
    clientId: createClientId(),
    name: "",
    price: 0,
    sortOrder,
  };
}

function createEmptyGroup(sortOrder = 0): VariationGroupForm {
  return {
    clientId: createClientId(),
    name: "",
    selectionType: "SINGLE",
    sortOrder,
    options: [createEmptyOption(0)],
  };
}

function toVariationGroupForm(group: MealVariationGroupDTO): VariationGroupForm {
  return {
    clientId: group.id,
    name: group.name,
    selectionType: group.selectionType,
    sortOrder: group.sortOrder,
    options: group.options.map((option) => ({
      clientId: option.id,
      name: option.name,
      price: option.price,
      sortOrder: option.sortOrder,
    })),
  };
}

function toMealForm(meal: MealDTO): MealForm {
  return {
    name: meal.name,
    description: meal.description,
    price: meal.price,
    imageUrl: meal.imageUrl,
    isAvailable: meal.isAvailable,
    stockStatus: meal.stockStatus,
    allergenInfo: meal.allergenInfo,
    spiceLevel: meal.spiceLevel,
    sortOrder: meal.sortOrder,
    variationGroups: meal.variationGroups.map(toVariationGroupForm),
  };
}

function normalizeMealForm(form: MealForm) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price) || 0,
    imageUrl: form.imageUrl.trim(),
    isAvailable: Boolean(form.isAvailable),
    stockStatus: form.stockStatus,
    allergenInfo: String(form.allergenInfo ?? "").trim() || null,
    spiceLevel: form.spiceLevel,
    sortOrder: Number(form.sortOrder) || 0,
    variationGroups: form.variationGroups.map((group, groupIndex) => ({
      name: group.name.trim(),
      selectionType: group.selectionType,
      sortOrder: Number(group.sortOrder) || groupIndex,
      options: group.options.map((option, optionIndex) => ({
        name: option.name.trim(),
        price: Number(option.price) || 0,
        sortOrder: Number(option.sortOrder) || optionIndex,
      })),
    })),
  };
}

export default function AdminMealsPage() {
  const [meals, setMeals] = useState<MealDTO[]>([]);
  const [editing, setEditing] = useState<string | null>(null); // meal id or "new"
  const [form, setForm] = useState<MealForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const mealsRes = await fetch("/api/admin/meals");

        const mealsData = await mealsRes.json().catch(() => null);

        if (!mealsRes.ok) {
          throw new Error(
            mealsData && typeof mealsData.error === "string"
              ? mealsData.error
              : "Could not load meals"
          );
        }

        if (!cancelled) {
          setMeals(Array.isArray(mealsData) ? mealsData : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load meals");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  function startNew() { setEditing("new"); setForm(EMPTY); setError(""); }
  function startEdit(m: MealDTO) {
    setError("");
    setEditing(m.id);
    setForm(toMealForm(m));
  }
  function cancel() { setEditing(null); setError(""); }

  function openMealPhotoPicker() {
    if (photoUploading) {
      return;
    }

    setError("");
    photoInputRef.current?.click();
  }

  async function handleMealPhotoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();
    const hasAllowedExtension =
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".webp");

    if (!hasAllowedExtension || (file.type && !ACCEPTED_MEAL_PHOTO_TYPES.has(file.type))) {
      setError("Meal photo must be a JPG, JPEG, PNG, or WEBP file.");
      return;
    }

    if (file.size > MAX_MEAL_PHOTO_SIZE_BYTES) {
      setError("Meal photo must be 5MB or smaller.");
      return;
    }

    setPhotoUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/meal-photos", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not upload meal photo"
        );
      }

      if (typeof data.url !== "string" || !data.url) {
        throw new Error("Could not upload meal photo");
      }

      setForm((current) => ({ ...current, imageUrl: data.url }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload meal photo");
    } finally {
      setPhotoUploading(false);
    }
  }

  function addVariationGroup() {
    setForm((current) => ({
      ...current,
      variationGroups: [...current.variationGroups, createEmptyGroup(current.variationGroups.length)],
    }));
  }

  function updateVariationGroup(
    clientId: string,
    patch: Partial<Omit<VariationGroupForm, "clientId" | "options">>
  ) {
    setForm((current) => ({
      ...current,
      variationGroups: current.variationGroups.map((group) =>
        group.clientId === clientId ? { ...group, ...patch } : group
      ),
    }));
  }

  function removeVariationGroup(clientId: string) {
    setForm((current) => ({
      ...current,
      variationGroups: current.variationGroups.filter((group) => group.clientId !== clientId),
    }));
  }

  function addVariationOption(groupClientId: string) {
    setForm((current) => ({
      ...current,
      variationGroups: current.variationGroups.map((group) =>
        group.clientId === groupClientId
          ? { ...group, options: [...group.options, createEmptyOption(group.options.length)] }
          : group
      ),
    }));
  }

  function updateVariationOption(
    groupClientId: string,
    optionClientId: string,
    patch: Partial<Omit<VariationOptionForm, "clientId">>
  ) {
    setForm((current) => ({
      ...current,
      variationGroups: current.variationGroups.map((group) =>
        group.clientId === groupClientId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.clientId === optionClientId ? { ...option, ...patch } : option
              ),
            }
          : group
      ),
    }));
  }

  function removeVariationOption(groupClientId: string, optionClientId: string) {
    setForm((current) => ({
      ...current,
      variationGroups: current.variationGroups.map((group) =>
        group.clientId === groupClientId
          ? {
              ...group,
              options: group.options.filter((option) => option.clientId !== optionClientId),
            }
          : group
      ),
    }));
  }

  async function save() {
    const normalized = normalizeMealForm(form);

    if (!normalized.name) {
      setError("Meal name is required");
      return;
    }

    if (normalized.price < 0) {
      setError("Meal price cannot be negative");
      return;
    }

    if (normalized.variationGroups.length === 0 && normalized.price <= 0) {
      setError("Price must be greater than 0 when no variations are configured");
      return;
    }

    for (const [groupIndex, group] of normalized.variationGroups.entries()) {
      if (!group.name) {
        setError(`Variation group ${groupIndex + 1} needs a name`);
        return;
      }

      const validOptions = group.options.filter((option) => option.name);

      if (validOptions.length === 0) {
        setError(`Variation group ${group.name} needs at least one option`);
        return;
      }
    }

    setSaving(true);
    setError("");

    if (editing === "new") {
      try {
        const res = await fetch("/api/admin/meals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalized),
        });
        const meal = await res.json();

        if (!res.ok) {
          throw new Error(meal.error ?? "Could not add meal");
        }

        startTransition(() => {
          setMeals((prev) => [...prev, meal].sort((a, b) => a.sortOrder - b.sortOrder));
        });
        setEditing(null);
        setForm(EMPTY);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add meal");
      }
    } else {
      const mealId = editing;
      const previousMeal = meals.find((meal) => meal.id === mealId);

      if (!previousMeal) {
        setSaving(false);
        setError("Meal not found");
        return;
      }

      const optimisticMeal: MealDTO = {
        ...previousMeal,
        ...normalized,
        variationGroups: normalized.variationGroups.map((group, groupIndex) => ({
          id: previousMeal.variationGroups[groupIndex]?.id ?? `${mealId}-group-${groupIndex}`,
          name: group.name,
          selectionType: group.selectionType,
          sortOrder: group.sortOrder,
          options: group.options
            .filter((option) => option.name)
            .map((option, optionIndex) => ({
              id:
                previousMeal.variationGroups[groupIndex]?.options[optionIndex]?.id ??
                `${mealId}-option-${groupIndex}-${optionIndex}`,
              name: option.name,
              price: option.price,
              sortOrder: option.sortOrder,
            })),
        })),
      };

      try {
        const res = await fetch(`/api/admin/meals/${mealId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalized),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Could not update meal");
        }

        const updatedMeal = await res.json();

        startTransition(() => {
          setMeals((prev) => prev
            .map((meal) => meal.id === mealId ? updatedMeal : meal)
            .sort((a, b) => a.sortOrder - b.sortOrder));
        });
        setEditing(null);
      } catch (err) {
        startTransition(() => {
          setMeals((prev) => prev
            .map((meal) => meal.id === optimisticMeal.id ? previousMeal : meal)
            .sort((a, b) => a.sortOrder - b.sortOrder));
        });
        setError(err instanceof Error ? err.message : "Could not update meal");
      }
    }

    setSaving(false);
  }

  async function deleteMeal(id: string) {
    if (!confirm("Delete this meal?")) return;
    await fetch(`/api/admin/meals/${id}`, { method: "DELETE" });
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  async function toggleAvailable(m: MealDTO) {
    await fetch(`/api/admin/meals/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, isAvailable: !m.isAvailable }),
    });
    setMeals((prev) => prev.map((x) => x.id === m.id ? { ...x, isAvailable: !x.isAvailable } : x));
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-2xl">Meals</h1>
          <p className="text-gray-500 text-sm">{meals.length} meals on the menu</p>
        {loading ? (
          <div className="card p-4 text-sm text-gray-500">Loading meals...</div>
        ) : null}

        </div>
        <button onClick={startNew} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus size={15} /> Add Meal
        </button>
      </div>

      {/* Add / Edit form */}
      {editing && (
        <div className="card p-5 space-y-4 border-brand-red/40">
          <h2 className="text-white font-bold">{editing === "new" ? "New Meal" : "Edit Meal"}</h2>
          {error && <p className="text-brand-red text-xs">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Name", type: "text" },
              { key: "price", label: "Price (£)", type: "number" },
              { key: "sortOrder", label: "Sort Order", type: "number" },
            ].map(({ key, label, type }) => (
              <div key={key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-400">{label}</label>
                <input
                  type={type}
                  value={(form as Record<string, unknown>)[key] as string}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    [key]: type === "number" ? Number(e.target.value) || 0 : e.target.value,
                  }))}
                  className="w-full bg-surface-dark border border-surface-border rounded-xl
                             px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
            ))}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400">Image URL</label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="w-full bg-surface-dark border border-surface-border rounded-xl
                           px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                placeholder="Select a photo below or paste an external image URL"
              />
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-surface-border bg-surface-dark/60 p-4">
            <input
              ref={photoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleMealPhotoSelected}
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-brand-gold font-semibold text-xs uppercase tracking-widest">
                  Meal Photos
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Upload a custom photo from your device for this meal, or keep using a custom image URL.
                </p>
              </div>
              {form.imageUrl ? (
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, imageUrl: "" }))}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Clear photo
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openMealPhotoPicker}
                disabled={photoUploading}
                className="rounded-xl border border-surface-border px-4 py-2 text-sm text-white transition-colors hover:border-brand-red/40 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="inline-flex items-center gap-2">
                  {photoUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {photoUploading ? "Uploading..." : "Upload Photo"}
                </span>
              </button>
              <p className="text-xs text-gray-600">Accepted: JPG, JPEG, PNG, WEBP. Maximum file size: 5MB.</p>
            </div>

            {form.imageUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-surface-border bg-surface-dark aspect-[4/3] max-w-xs">
                <Image
                  src={form.imageUrl}
                  alt="Selected meal photo"
                  fill
                  sizes="320px"
                  unoptimized={isLocalMealPhotoUrl(form.imageUrl)}
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-400">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-surface-dark border border-surface-border rounded-xl
                         px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-400">Stock Status</label>
              <select
                value={form.stockStatus}
                onChange={(e) => setForm((f) => ({ ...f, stockStatus: e.target.value as MealStockStatus }))}
                className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                <option value="IN_STOCK">In stock</option>
                <option value="LOW_STOCK">Low stock</option>
                <option value="SOLD_OUT">Sold out</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-400">Spice Level</label>
              <select
                value={form.spiceLevel ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, spiceLevel: (e.target.value || null) as MealSpiceLevel | null }))}
                className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                <option value="">Not set</option>
                <option value="NOT_SPICY">Not spicy</option>
                <option value="MILD">Mild</option>
                <option value="MEDIUM">Medium</option>
                <option value="HOT">Hot</option>
                <option value="EXTRA_HOT">Extra hot</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-400">Allergen Info</label>
            <input
              type="text"
              value={form.allergenInfo ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, allergenInfo: e.target.value }))}
              placeholder="e.g. Peanuts, dairy, gluten"
              className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            />
          </div>
          <div className="space-y-4 rounded-xl border border-surface-border bg-surface-dark/60 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-brand-gold font-semibold text-xs uppercase tracking-widest">
                  Customer Customisation
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Create the variation groups and customer-selectable options for this meal. Selected variation prices override the base meal price.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariationGroup}
                className="rounded-xl border border-surface-border px-3 py-2 text-xs text-white hover:border-brand-red/40 transition-colors"
              >
                Add variation group
              </button>
            </div>

            {form.variationGroups.length === 0 ? (
              <p className="text-xs text-gray-500">
                No variation groups yet. Meals without groups will be added as standard items.
              </p>
            ) : (
              <div className="space-y-4">
                {form.variationGroups.map((group, groupIndex) => (
                  <div key={group.clientId} className="rounded-xl border border-surface-border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-400">Group name</label>
                          <input
                            value={group.name}
                            onChange={(e) => updateVariationGroup(group.clientId, { name: e.target.value })}
                            className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                            placeholder="e.g. Size"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-400">Selection mode</label>
                          <select
                            value={group.selectionType}
                            onChange={(e) => updateVariationGroup(group.clientId, { selectionType: e.target.value as VariationSelectionType })}
                            className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                          >
                            <option value="SINGLE">Choose one</option>
                            <option value="MULTIPLE">Choose multiple</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-400">Sort order</label>
                          <input
                            type="number"
                            value={group.sortOrder}
                            onChange={(e) => updateVariationGroup(group.clientId, { sortOrder: Number(e.target.value) || 0 })}
                            className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariationGroup(group.clientId)}
                        className="mt-6 text-gray-500 hover:text-brand-red transition-colors"
                        aria-label={`Remove variation group ${groupIndex + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-gray-400">Options</p>
                        <button
                          type="button"
                          onClick={() => addVariationOption(group.clientId)}
                          className="text-xs text-brand-gold hover:text-white transition-colors"
                        >
                          Add option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {group.options.map((option, optionIndex) => (
                          <div key={option.clientId} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_100px_auto] gap-3 items-end">
                            <div className="space-y-1">
                              <label className="block text-xs font-medium text-gray-400">Option name</label>
                              <input
                                value={option.name}
                                onChange={(e) => updateVariationOption(group.clientId, option.clientId, { name: e.target.value })}
                                className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-medium text-gray-400">Price (£)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={option.price}
                                onChange={(e) => updateVariationOption(group.clientId, option.clientId, { price: Number(e.target.value) || 0 })}
                                className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-medium text-gray-400">Sort</label>
                              <input
                                type="number"
                                value={option.sortOrder}
                                onChange={(e) => updateVariationOption(group.clientId, option.clientId, { sortOrder: Number(e.target.value) || 0 })}
                                className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVariationOption(group.clientId, option.clientId)}
                              className="mb-2 text-gray-500 hover:text-brand-red transition-colors"
                              aria-label={`Remove option ${optionIndex + 1}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
              className="rounded"
            />
            Available for ordering
          </label>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </button>
            <button onClick={cancel} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-border text-gray-400 hover:text-white text-sm transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Meals list */}
      <div className="space-y-3">
        {meals.map((m) => (
          <div key={m.id} className={`card p-4 flex items-center gap-4 ${!m.isAvailable ? "opacity-50" : ""}`}>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">{m.name}</p>
              <p className="text-gray-500 text-xs truncate">{m.description}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em]">
                <span className="rounded-full border border-surface-border px-2 py-1 text-gray-400">{m.stockStatus.replace("_", " ")}</span>
                {m.spiceLevel ? <span className="rounded-full border border-surface-border px-2 py-1 text-gray-400">{m.spiceLevel.replace(/_/g, " ")}</span> : null}
              </div>
              {m.allergenInfo ? <p className="mt-1 text-[11px] text-gray-600 truncate">Allergens: {m.allergenInfo}</p> : null}
              <p className="text-gray-600 text-[11px] mt-1">
                {m.variationGroups.length === 0
                  ? "No customisation groups"
                  : `${m.variationGroups.length} variation group${m.variationGroups.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <span className="text-brand-gold font-bold shrink-0">{formatCurrency(m.price)}</span>
            <button
              onClick={() => toggleAvailable(m)}
              className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${
                m.isAvailable ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"
              }`}
            >
              {m.isAvailable ? "Available" : "Hidden"}
            </button>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => startEdit(m)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-border transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => deleteMeal(m.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-red transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
