import { derived, writable } from "svelte/store";

export const isMicPermissionGranted = writable(false);
export const isCamPermissionGranted = writable(false);

export const arePermissionsGranted = derived(
    [isMicPermissionGranted,isCamPermissionGranted],
    ([$isMicPermissionGranted,$isCamPermissionGranted])=> $isCamPermissionGranted && $isMicPermissionGranted
);