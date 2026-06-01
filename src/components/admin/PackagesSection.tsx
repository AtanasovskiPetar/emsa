import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, PackagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { type ProjectCapacityPool, type ProjectPackage } from "@/constants/types";
import { apiClient } from "@/lib/api-client";

export interface DraftPackage {
  _draftId: string;
  name: string;
  description: string;
  maxParticipants: number | null;
  capacityPoolDraftId: string | null;
  order: number;
}

export interface DraftCapacityPool {
  _draftId: string;
  name: string;
  maxParticipants: number;
}

// ── Package form (inline) ─────────────────────────────────────────────────────

interface PackageFormProps {
  initial?: {
    name: string;
    description: string;
    maxParticipants: number | null;
    capacityPoolDraftId: string | null;
    capacityPoolId: string | null;
  };
  pools: DraftCapacityPool[];
  existingPools: ProjectCapacityPool[];
  onSave: (data: {
    name: string;
    description: string;
    maxParticipants: number | null;
    capacityPoolDraftId: string | null;
    capacityPoolId: string | null;
  }) => void;
  onCancel: () => void;
}

function PackageForm({ initial, pools, existingPools, onSave, onCancel }: PackageFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [maxPax, setMaxPax] = useState<string>(
    initial?.maxParticipants ? String(initial.maxParticipants) : ""
  );
  const [poolSelection, setPoolSelection] = useState<string>(
    initial?.capacityPoolDraftId
      ? `draft:${initial.capacityPoolDraftId}`
      : initial?.capacityPoolId
        ? `existing:${initial.capacityPoolId}`
        : "none"
  );

  function handleSave() {
    if (!name.trim()) return;
    const draftMatch = poolSelection.match(/^draft:(.+)$/);
    const existingMatch = poolSelection.match(/^existing:(.+)$/);
    onSave({
      name: name.trim(),
      description,
      maxParticipants: draftMatch || existingMatch ? null : maxPax ? parseInt(maxPax, 10) : null,
      capacityPoolDraftId: draftMatch ? draftMatch[1]! : null,
      capacityPoolId: existingMatch ? existingMatch[1]! : null,
    });
  }

  const hasPool = poolSelection !== "none";

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3">
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-3 flex flex-col gap-1">
          <Label className="text-xs">Name *</Label>
          <Input
            placeholder="Package name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="col-span-1 flex flex-col gap-1">
          <Label className="text-xs">Max spots</Label>
          <Input
            type="number"
            min={1}
            placeholder="∞"
            value={hasPool ? "" : maxPax}
            disabled={hasPool}
            onChange={(e) => setMaxPax(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Description</Label>
        <Input
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {(pools.length > 0 || existingPools.length > 0) && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Shared capacity pool</Label>
          <Select value={poolSelection} onValueChange={setPoolSelection}>
            <SelectTrigger>
              <SelectValue placeholder="No shared pool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No shared pool (use own limit)</SelectItem>
              {existingPools.map((p) => (
                <SelectItem key={p.id} value={`existing:${p.id}`}>
                  {p.name} ({p.maxParticipants} spots)
                </SelectItem>
              ))}
              {pools.map((p) => (
                <SelectItem key={p._draftId} value={`draft:${p._draftId}`}>
                  {p.name} ({p.maxParticipants} spots) — new
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Pool form (inline) ────────────────────────────────────────────────────────

interface PoolFormProps {
  initial?: { name: string; maxParticipants: number };
  onSave: (data: { name: string; maxParticipants: number }) => void;
  onCancel: () => void;
}

function PoolForm({ initial, onSave, onCancel }: PoolFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [maxPax, setMaxPax] = useState<string>(
    initial?.maxParticipants ? String(initial.maxParticipants) : ""
  );

  function handleSave() {
    const n = parseInt(maxPax, 10);
    if (!name.trim() || !n || n < 1) return;
    onSave({ name: name.trim(), maxParticipants: n });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">New capacity pool</p>
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-3 flex flex-col gap-1">
          <Label className="text-xs">Pool name *</Label>
          <Input placeholder="Pool name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="col-span-1 flex flex-col gap-1">
          <Label className="text-xs">Total spots *</Label>
          <Input
            type="number"
            min={1}
            placeholder="30"
            value={maxPax}
            onChange={(e) => setMaxPax(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!name.trim() || !maxPax || parseInt(maxPax, 10) < 1}
        >
          Add pool
        </Button>
      </div>
    </div>
  );
}

// ── Packages section ──────────────────────────────────────────────────────────

interface PackagesSectionProps {
  projectId: string | undefined;
  draftPackages: DraftPackage[];
  draftPools: DraftCapacityPool[];
  onDraftPackagesChange: (pkgs: DraftPackage[]) => void;
  onDraftPoolsChange: (pools: DraftCapacityPool[]) => void;
}

export function PackagesSection({
  projectId,
  draftPackages,
  draftPools,
  onDraftPackagesChange,
  onDraftPoolsChange,
}: PackagesSectionProps) {
  const queryClient = useQueryClient();
  const [addingPackage, setAddingPackage] = useState(false);
  const [editingPackageDraftId, setEditingPackageDraftId] = useState<string | null>(null);
  const [addingPool, setAddingPool] = useState(false);
  const [editingPoolDraftId, setEditingPoolDraftId] = useState<string | null>(null);

  const { data: existingPackages = [] } = useQuery<ProjectPackage[]>({
    queryKey: queryKeys.admin.projectPackages(projectId ?? ""),
    queryFn: () =>
      apiClient.get<ProjectPackage[]>(ApiRoutes.ADMIN_PROJECT_PACKAGES.replace(":id", projectId!)),
    enabled: !!projectId,
  });

  const { data: existingPools = [] } = useQuery<ProjectCapacityPool[]>({
    queryKey: queryKeys.admin.projectCapacityPools(projectId ?? ""),
    queryFn: () =>
      apiClient.get<ProjectCapacityPool[]>(
        ApiRoutes.ADMIN_PROJECT_CAPACITY_POOLS.replace(":id", projectId!)
      ),
    enabled: !!projectId,
  });

  const invalidatePackages = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.projectPackages(projectId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.projectCapacityPools(projectId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects() });
  };

  const { mutate: createPkgApi } = useMutation({
    mutationFn: (body: object) =>
      apiClient.post(ApiRoutes.ADMIN_PROJECT_PACKAGES.replace(":id", projectId!), body),
    onSuccess: () => {
      invalidatePackages();
      setAddingPackage(false);
    },
  });

  const { mutate: updatePkgApi } = useMutation({
    mutationFn: ({ pkgId, body }: { pkgId: string; body: object }) =>
      apiClient.patch(
        ApiRoutes.ADMIN_PROJECT_PACKAGE_BY_ID.replace(":id", projectId!).replace(
          ":packageId",
          pkgId
        ),
        body
      ),
    onSuccess: () => {
      invalidatePackages();
      setEditingPackageDraftId(null);
    },
  });

  const { mutate: deletePkgApi } = useMutation({
    mutationFn: (pkgId: string) =>
      apiClient.delete(
        ApiRoutes.ADMIN_PROJECT_PACKAGE_BY_ID.replace(":id", projectId!).replace(
          ":packageId",
          pkgId
        )
      ),
    onSuccess: invalidatePackages,
  });

  const { mutate: createPoolApi } = useMutation({
    mutationFn: (body: object) =>
      apiClient.post(ApiRoutes.ADMIN_PROJECT_CAPACITY_POOLS.replace(":id", projectId!), body),
    onSuccess: () => {
      invalidatePackages();
      setAddingPool(false);
    },
  });

  const { mutate: updatePoolApi } = useMutation({
    mutationFn: ({ poolId, body }: { poolId: string; body: object }) =>
      apiClient.patch(
        ApiRoutes.ADMIN_PROJECT_CAPACITY_POOL_BY_ID.replace(":id", projectId!).replace(
          ":poolId",
          poolId
        ),
        body
      ),
    onSuccess: () => {
      invalidatePackages();
      setEditingPoolDraftId(null);
    },
  });

  const { mutate: deletePoolApi } = useMutation({
    mutationFn: (poolId: string) =>
      apiClient.delete(
        ApiRoutes.ADMIN_PROJECT_CAPACITY_POOL_BY_ID.replace(":id", projectId!).replace(
          ":poolId",
          poolId
        )
      ),
    onSuccess: invalidatePackages,
  });

  function addDraftPool(data: { name: string; maxParticipants: number }) {
    onDraftPoolsChange([
      ...draftPools,
      { _draftId: crypto.randomUUID(), name: data.name, maxParticipants: data.maxParticipants },
    ]);
    setAddingPool(false);
  }

  function updateDraftPool(draftId: string, data: { name: string; maxParticipants: number }) {
    onDraftPoolsChange(draftPools.map((p) => (p._draftId === draftId ? { ...p, ...data } : p)));
    setEditingPoolDraftId(null);
  }

  function removeDraftPool(draftId: string) {
    onDraftPoolsChange(draftPools.filter((p) => p._draftId !== draftId));
    onDraftPackagesChange(
      draftPackages.map((p) =>
        p.capacityPoolDraftId === draftId ? { ...p, capacityPoolDraftId: null } : p
      )
    );
  }

  function addDraftPackage(data: {
    name: string;
    description: string;
    maxParticipants: number | null;
    capacityPoolDraftId: string | null;
    capacityPoolId: string | null;
  }) {
    onDraftPackagesChange([
      ...draftPackages,
      {
        _draftId: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        maxParticipants: data.maxParticipants,
        capacityPoolDraftId: data.capacityPoolDraftId,
        order: draftPackages.length,
      },
    ]);
    setAddingPackage(false);
  }

  function updateDraftPackage(
    draftId: string,
    data: {
      name: string;
      description: string;
      maxParticipants: number | null;
      capacityPoolDraftId: string | null;
      capacityPoolId: string | null;
    }
  ) {
    onDraftPackagesChange(
      draftPackages.map((p) =>
        p._draftId === draftId
          ? {
              ...p,
              name: data.name,
              description: data.description,
              maxParticipants: data.maxParticipants,
              capacityPoolDraftId: data.capacityPoolDraftId,
            }
          : p
      )
    );
    setEditingPackageDraftId(null);
  }

  function removeDraftPackage(draftId: string) {
    onDraftPackagesChange(draftPackages.filter((p) => p._draftId !== draftId));
  }

  const isEditMode = !!projectId;
  const packagesToShow = isEditMode ? existingPackages : draftPackages;
  const poolsToShow = isEditMode ? existingPools : draftPools;

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">Registration Packages</span>
        </div>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => {
              setAddingPool(true);
              setAddingPackage(false);
            }}
          >
            <Plus className="size-3" />
            Add pool
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => {
              setAddingPackage(true);
              setAddingPool(false);
            }}
          >
            <PackagePlus className="size-3" />
            Add package
          </Button>
        </div>
      </div>

      {poolsToShow.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Capacity pools</p>
          {isEditMode
            ? (existingPools as ProjectCapacityPool[]).map((pool) =>
                editingPoolDraftId === pool.id ? (
                  <PoolForm
                    key={pool.id}
                    initial={{ name: pool.name, maxParticipants: pool.maxParticipants }}
                    onSave={(data) => updatePoolApi({ poolId: pool.id, body: data })}
                    onCancel={() => setEditingPoolDraftId(null)}
                  />
                ) : (
                  <div
                    key={pool.id}
                    className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-sm"
                  >
                    <span>
                      {pool.name}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {pool.maxParticipants} shared spots
                      </span>
                    </span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => setEditingPoolDraftId(pool.id)}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deletePoolApi(pool.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                )
              )
            : draftPools.map((pool) =>
                editingPoolDraftId === pool._draftId ? (
                  <PoolForm
                    key={pool._draftId}
                    initial={{ name: pool.name, maxParticipants: pool.maxParticipants }}
                    onSave={(data) => updateDraftPool(pool._draftId, data)}
                    onCancel={() => setEditingPoolDraftId(null)}
                  />
                ) : (
                  <div
                    key={pool._draftId}
                    className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-sm"
                  >
                    <span>
                      {pool.name}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {pool.maxParticipants} shared spots
                      </span>
                    </span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => setEditingPoolDraftId(pool._draftId)}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeDraftPool(pool._draftId)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                )
              )}
        </div>
      )}

      {addingPool && (
        <PoolForm
          onSave={isEditMode ? (data) => createPoolApi(data) : addDraftPool}
          onCancel={() => setAddingPool(false)}
        />
      )}

      {packagesToShow.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Packages</p>
          {isEditMode
            ? (existingPackages as ProjectPackage[]).map((pkg) =>
                editingPackageDraftId === pkg.id ? (
                  <PackageForm
                    key={pkg.id}
                    initial={{
                      name: pkg.name,
                      description: pkg.description,
                      maxParticipants: pkg.maxParticipants,
                      capacityPoolDraftId: null,
                      capacityPoolId: pkg.capacityPoolId,
                    }}
                    pools={[]}
                    existingPools={existingPools}
                    onSave={(data) =>
                      updatePkgApi({
                        pkgId: pkg.id,
                        body: {
                          name: data.name,
                          description: data.description,
                          maxParticipants: data.capacityPoolId ? null : data.maxParticipants,
                          capacityPoolId: data.capacityPoolId,
                        },
                      })
                    }
                    onCancel={() => setEditingPackageDraftId(null)}
                  />
                ) : (
                  <div
                    key={pkg.id}
                    className="flex items-start justify-between gap-2 rounded-md bg-muted/40 px-3 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{pkg.name}</p>
                      {pkg.description && (
                        <p className="truncate text-xs text-muted-foreground">{pkg.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {pkg.capacityPoolId
                          ? `Pool: ${pkg.capacityPoolName} (${pkg.capacityPoolMax} shared)`
                          : pkg.maxParticipants
                            ? `${pkg.maxParticipants} spots`
                            : "Unlimited"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => setEditingPackageDraftId(pkg.id)}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deletePkgApi(pkg.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                )
              )
            : draftPackages.map((pkg) =>
                editingPackageDraftId === pkg._draftId ? (
                  <PackageForm
                    key={pkg._draftId}
                    initial={{
                      name: pkg.name,
                      description: pkg.description,
                      maxParticipants: pkg.maxParticipants,
                      capacityPoolDraftId: pkg.capacityPoolDraftId,
                      capacityPoolId: null,
                    }}
                    pools={draftPools}
                    existingPools={[]}
                    onSave={(data) => updateDraftPackage(pkg._draftId, data)}
                    onCancel={() => setEditingPackageDraftId(null)}
                  />
                ) : (
                  <div
                    key={pkg._draftId}
                    className="flex items-start justify-between gap-2 rounded-md bg-muted/40 px-3 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{pkg.name}</p>
                      {pkg.description && (
                        <p className="truncate text-xs text-muted-foreground">{pkg.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {pkg.capacityPoolDraftId
                          ? `Pool: ${draftPools.find((p) => p._draftId === pkg.capacityPoolDraftId)?.name ?? "—"}`
                          : pkg.maxParticipants
                            ? `${pkg.maxParticipants} spots`
                            : "Unlimited"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => setEditingPackageDraftId(pkg._draftId)}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeDraftPackage(pkg._draftId)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                )
              )}
        </div>
      )}

      {addingPackage && (
        <PackageForm
          pools={isEditMode ? [] : draftPools}
          existingPools={isEditMode ? existingPools : []}
          onSave={
            isEditMode
              ? (data) =>
                  createPkgApi({
                    name: data.name,
                    description: data.description,
                    maxParticipants: data.capacityPoolId ? null : data.maxParticipants,
                    capacityPoolId: data.capacityPoolId,
                    order: existingPackages.length,
                  })
              : addDraftPackage
          }
          onCancel={() => setAddingPackage(false)}
        />
      )}

      {packagesToShow.length === 0 && poolsToShow.length === 0 && !addingPool && !addingPackage && (
        <p className="text-xs text-muted-foreground">
          No packages — all participants join a single pool. Add packages for tiered registration.
        </p>
      )}
    </div>
  );
}
