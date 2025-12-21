"use client";
import React, { useState, useRef } from "react";
import { Dialog } from "@/components/common/Dialog";
import  InputField  from "@/components/InputField";
import { EventCategory, CreateEventCategoryPayload, ErrorResponse } from "@/@types";
import { useCreateEventCategory, useUpdateEventCategory, useDeleteEventCategory } from "@/hooks/school-admin";
import { toast } from "react-toastify";
import { Button, ActionIcon, Menu } from "@mantine/core";
import { IconTrash, IconEdit } from "@tabler/icons-react";

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: EventCategory[];
  onSuccess: () => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSuccess,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEventCategoryPayload>({
    name: "",
    description: "",
    color: "#3788d8", // Required field
  });
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateEventCategory();
  const updateMutation = useUpdateEventCategory();
  const deleteMutation = useDeleteEventCategory();

  const handleMenuOpen = () => {
    // Small delay to ensure menu is rendered, then trigger color picker
    setTimeout(() => {
      colorInputRef.current?.click();
    }, 100);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    if (!formData.color) {
      toast.error("Please select a color");
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success("Category created successfully");
      setFormData({ name: "", description: "", color: "#3788d8" });
      setIsCreating(false);
      onSuccess();
    } catch (error: unknown) {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    if (!formData.color) {
      toast.error("Please select a color");
      return;
    }

    try {
      await updateMutation.mutateAsync({ id, payload: formData });
      toast.success("Category updated successfully");
      setEditingId(null);
      setFormData({ name: "", description: "", color: "#3788d8" });
      onSuccess();
    } catch (error: unknown) {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
    }
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync(categoryToDelete);
      toast.success("Category deleted successfully");
      setIsConfirmDeleteDialogOpen(false);
      setCategoryToDelete(null);
      onSuccess();
    } catch (error: unknown) {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
    }
  };

  const startEdit = (category: EventCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#3788d8",
    });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: "", description: "", color: "#3788d8" });
  };

  return (
    <>
    <Dialog
      isOpen={isOpen}
      dialogTitle="Manage Event Categories"
      saveButtonText={ "Close"}
      hideCancelButton={true}
      onSave={() => {        
        onClose();
        cancelEdit();}}
        onClose={() => {
          onClose();
          cancelEdit();
        }}
      busy={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
      dialogWidth="w-[600px] max-w-[601px]"
    >
      <div className="my-3 flex flex-col gap-4">
        <Button
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            setFormData({ name: "", description: "", color: "#3788d8" });
          }}
          variant="light"
          size="sm"
        >
          + Add New Category
        </Button>

        {(isCreating || editingId) && (
          <div className="border-t pt-4 mt-2">
            <InputField
              className="!py-0"
              label="Category Name"
              placeholder="Enter category name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              isTransulent={false}
            />

            <InputField
              className="!py-0"
              label="Description"
              placeholder="Enter description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              isTransulent={false}
            />

            <label className="text-[12px] font-medium block">Click to pick a color</label>
            <div className="flex items-center gap-2">
              <Menu position="bottom-start" offset={5} withArrow onOpen={handleMenuOpen}>
                <Menu.Target>
                  <div
                    className="w-12 h-12 rounded border cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: formData.color }}
                    title="Click to pick a color"
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  <div className="p-3">
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-10 cursor-pointer rounded"
                      style={{ 
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <div className="mt-2 text-center">
                      <span className="text-xs text-gray-600 font-mono">{formData.color}</span>
                    </div>
                  </div>
                </Menu.Dropdown>
              </Menu>
            </div>

            <div className="flex justify-between gap-2 mt-2">
              <Button
                onClick={cancelEdit}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (isCreating) {
                    handleCreate();
                  } else if (editingId) {
                    handleUpdate(editingId);
                  }
                }}
                size="sm"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {isCreating ? "Create Category" : "Update Category"}
              </Button>
            </div>
          </div>
        )}

        <div className="border-t pt-4 mt-2">
          <h3 className="font-semibold mb-3">Existing Categories</h3>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-sm">No categories yet. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              {categories?.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: category.color || "#3788d8" }}
                    />
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-gray-500">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ActionIcon
                      variant="light"
                      onClick={() => startEdit(category)}
                      disabled={editingId === category.id}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => handleDeleteClick(category.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>

    {/* Confirm Delete Dialog */}
    <Dialog
      isOpen={isConfirmDeleteDialogOpen}
      busy={deleteMutation.isPending}
      dialogTitle="Confirm Delete"
      saveButtonText="Delete"
      onClose={() => {
        setIsConfirmDeleteDialogOpen(false);
        setCategoryToDelete(null);
      }}
      onSave={handleDelete}
    >
      <div className="my-3 flex flex-col gap-4">
        <p>
          Are you sure you want to delete this category? Events using this category will have their category removed.
        </p>
      </div>
    </Dialog>
    </>
  );
};

