/**
 * Alliance Service - Client-side service for alliance operations
 * Handles API interactions for alliance presets
 */

import { apiRequest } from "./queryClient";
import { Alliance } from "./types";

export interface AlliancePreset extends Alliance {
  id: string;
  name: string;
  isFavorite?: boolean;
}

/**
 * Gets all alliance presets from the server
 */
export async function fetchAllAlliancePresets(): Promise<AlliancePreset[]> {
  try {
    return await apiRequest<AlliancePreset[]>({
      endpoint: "/api/alliances",
    });
  } catch (error) {
    console.error("Error fetching alliance presets:", error);
    // Fall back to local data if server is unavailable
    return [];
  }
}

/**
 * Gets a specific alliance preset by ID
 */
export async function fetchAlliancePreset(id: string): Promise<AlliancePreset | null> {
  try {
    return await apiRequest<AlliancePreset>({
      endpoint: `/api/alliances/${id}`,
    });
  } catch (error) {
    console.error(`Error fetching alliance preset ${id}:`, error);
    return null;
  }
}

/**
 * Creates a new alliance preset on the server
 */
export async function createAlliancePreset(
  name: string,
  teams: string[],
  isFavorite: boolean = false
): Promise<AlliancePreset | null> {
  try {
    return await apiRequest<AlliancePreset>({
      endpoint: "/api/alliances",
      method: "POST",
      data: {
        name,
        teams,
        isFavorite,
      },
    });
  } catch (error) {
    console.error("Error creating alliance preset:", error);
    return null;
  }
}

/**
 * Deletes an alliance preset from the server
 */
export async function deleteServerAlliancePreset(id: string): Promise<boolean> {
  try {
    await apiRequest({
      endpoint: `/api/alliances/${id}`,
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.error(`Error deleting alliance preset ${id}:`, error);
    return false;
  }
}

/**
 * Syncs a local alliance preset to the server
 * If already exists, updates it; otherwise creates a new one
 */
export async function syncAlliancePreset(
  preset: Omit<AlliancePreset, "id"> & { id?: string }
): Promise<AlliancePreset | null> {
  try {
    if (preset.id) {
      // This would be a PUT/PATCH to update, but we'll implement it later
      // For now, delete and recreate
      await deleteServerAlliancePreset(preset.id);
    }
    
    return await createAlliancePreset(
      preset.name,
      preset.teams,
      preset.isFavorite
    );
  } catch (error) {
    console.error("Error syncing alliance preset:", error);
    return null;
  }
}