import { useCallback, useContext, useEffect, useRef, useState } from "react";
import JSZip from "jszip";

import { GameContext } from "../context";
import { iEpisodeResult } from "../types";

interface EpisodeResultZip {
  download: () => Promise<void>;
  pendingEpisodeCount: number;
}

function addEpisodeToZip(zip: JSZip, episodeResult: iEpisodeResult): void {
  zip.file("obsList.json", JSON.stringify(episodeResult.obsList, null, 2));
  zip.file("actions.json", JSON.stringify(episodeResult.actions, null, 2));
  zip.file("rewards.json", JSON.stringify(episodeResult.rewards, null, 2));
  zip.file("playInfos.json", JSON.stringify(episodeResult.playInfos, null, 2));
  zip.file("episodeMetadata.json", JSON.stringify(episodeResult.episodeMetadata, null, 2));
  const episodeData = {
    episodeSeed: episodeResult.episodeSeed,
    obsList: episodeResult.obsList,
    actions: episodeResult.actions,
    rewards: episodeResult.rewards,
    playInfos: episodeResult.playInfos,
    episodeMetadata: episodeResult.episodeMetadata,
  };
  zip.file("episode.json", JSON.stringify(episodeData, null, 2));
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function useEpisodeResultLocalSave(
  subjectId: number | string, 
  sessionId: number | string, 
  save: boolean
): EpisodeResultZip {
  const subjectIdStr = String(subjectId);
  const sessionIdStr = String(sessionId);
  const [pendingEpisodeCount, setPendingEpisodeCount] = useState(0);
  const collectedEpisodesRef = useRef<iEpisodeResult[]>([]);
  const processedEpisodeRefs = useRef(new WeakSet<object>());
  const savingRef = useRef(false);
  const { episodeResultQueue, removeEpisodeResult } = useContext(GameContext);

  const saveEpisodesAsZip = useCallback(
    async (episodes: iEpisodeResult[]): Promise<boolean> => {
      if (savingRef.current || episodes.length === 0) {
        return false;
      }
      savingRef.current = true;

      try {
        const zip = new JSZip();
        const episodeResult = episodes[0];
        addEpisodeToZip(zip, episodeResult);

        const manifestData = {
          subjectId: subjectIdStr,
          sessionId: sessionIdStr,
          episodeCount: episodes.length,
          createdAt: new Date().toISOString(),
          formatVersion: 1,
        };
        zip.file("manifest.json", JSON.stringify(manifestData, null, 2));

        const blob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        const seed = String(episodeResult.episodeSeed);
        const fileName = `subject_${subjectIdStr}_session_${sessionIdStr}_seed_${seed}.zip`;
        triggerBrowserDownload(blob, fileName);

        return true;
      } catch (error) {
        console.error(`Failed to download episode result file: ${pendingEpisodeCount} episodes pending.`, error);
        return false;
      } finally {
        savingRef.current = false;
      }
    },
    [subjectIdStr, sessionIdStr, pendingEpisodeCount]
  );

  const download = useCallback(async (): Promise<void> => {
    // NOTE: use the copy because the array can be modifed while being saved
    const episodes = [...collectedEpisodesRef.current];

    if (episodes.length === 0) {
      console.warn("No episode to download");
      return;
    }

    const success = await saveEpisodesAsZip(episodes);
    if (success) {
      collectedEpisodesRef.current.splice(0, episodes.length);
      setPendingEpisodeCount(collectedEpisodesRef.current.length);
    }
  }, [saveEpisodesAsZip]);

  useEffect(() => {
    if (!save) {
      collectedEpisodesRef.current = [];
      processedEpisodeRefs.current = new WeakSet<object>();
      queueMicrotask(() => {
        setPendingEpisodeCount(0);
      });

      removeEpisodeResult();
      return;
    }

    if (!episodeResultQueue?.length) {
      return;
    }

    const episodeResult = episodeResultQueue[0];

    if (typeof episodeResult === "object" && episodeResult !== null && processedEpisodeRefs.current.has(episodeResult)) {
      return;
    }

    if (typeof episodeResult === "object" && episodeResult !== null) {
      processedEpisodeRefs.current.add(episodeResult);
    }

    collectedEpisodesRef.current.push(episodeResult);
    const pendingCount = collectedEpisodesRef.current.length;
    queueMicrotask(() => {
      setPendingEpisodeCount(pendingCount);
    });

    // NOTE: Remove from the queue first and then download. 
    // The data still remains in collectedEpisodesRef, so it can be downloaded by manually calling download();
    removeEpisodeResult();
    void download();
  }, [save, episodeResultQueue, removeEpisodeResult, download]);
  return { download, pendingEpisodeCount };
}
