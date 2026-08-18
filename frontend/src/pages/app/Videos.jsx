import React, { useEffect, useState } from "react";
import {
  recommendedVideos as mockRecommended,
  savedVideos as mockSaved,
} from "../../data/mockData.js";
import {
  fetchRecommendedVideos,
  fetchSavedVideos,
  saveVideo,
  markVideoClicked,
} from "../../api/client.js";
import "./Videos.css";

function normalize(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function toVideoItem(r) {
  // RecommendedVideo -> { video: {...}, id, reason, rank }
  if (r.video) {
    return {
      id: r.video.id,
      recId: r.id,
      youtubeId: r.video.youtube_id,
      title: r.video.title,
      channel: r.video.channel_title,
      duration: "—",
      difficulty: r.video.difficulty,
      rating: r.video.avg_rating,
    };
  }
  // SavedVideo -> { video: {...} } yoki to'g'ridan
  return {
    id: r.id ?? r.video?.id,
    youtubeId: r.youtubeId ?? r.video?.youtube_id,
    title: r.title ?? r.video?.title,
    channel: r.channel ?? r.video?.channel_title,
    duration: r.duration ?? "—",
    difficulty: r.difficulty,
  };
}

export default function Videos() {
  const [tab, setTab] = useState("recommended");
  const [recommended, setRecommended] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchRecommendedVideos().catch(() => null),
      fetchSavedVideos().catch(() => null),
    ]).then(([recData, savedData]) => {
      if (cancelled) return;

      const recList = normalize(recData);
      const savedList = normalize(savedData);

      if (recList.length > 0 || savedList.length > 0) {
        // Backend dan haqiqiy ma'lumot keldi
        setRecommended(recList.map(toVideoItem));
        setSaved(savedList.map(toVideoItem));
        setUsingMock(false);
      } else {
        // Ikkalasi ham bo'sh — mock ko'rsat
        setRecommended(mockRecommended);
        setSaved(mockSaved);
        setUsingMock(true);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const list = tab === "recommended" ? recommended : saved;

  function handleSave(video) {
    if (saved.find((v) => v.id === video.id)) return;
    setSaved((s) => [...s, video]);
    if (!usingMock) {
      saveVideo(video.id).catch(() => {
        setSaved((s) => s.filter((v) => v.id !== video.id));
      });
    }
  }

  function handleOpen(video) {
    if (video.recId && !usingMock) markVideoClicked(video.recId).catch(() => {});
    if (video.youtubeId) setPlaying(video);
  }

  return (
    <div>
      <h1 className="page-title">Video tavsiyalar</h1>
      <p className="page-sub">
        Dars natijalaringiz asosida AI tanlagan YouTube videolari
      </p>

      <div className="tab-row">
        <button
          className={"tab-btn" + (tab === "recommended" ? " active" : "")}
          onClick={() => setTab("recommended")}
        >
          Tavsiya etilgan
        </button>
        <button
          className={"tab-btn" + (tab === "saved" ? " active" : "")}
          onClick={() => setTab("saved")}
        >
          Saqlanganlar
        </button>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 24 }}>
          Yuklanmoqda...
        </div>
      ) : (
        <div className="video-grid">
          {list.map((v) => (
            <div key={v.id} className="video-card">
              <div
                className="video-thumb"
                onClick={() => handleOpen(v)}
                style={{ cursor: v.youtubeId ? "pointer" : "default" }}
              >
                ▶
              </div>
              <div className="video-body">
                <div className="video-title">{v.title}</div>
                <div className="video-meta">
                  <span>{v.channel}</span>
                  <span>{v.duration}</span>
                </div>
                <div className="video-actions">
                  {v.difficulty && (
                    <span className="video-tag">{v.difficulty}</span>
                  )}
                  {tab === "recommended" && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: "5px 12px", fontSize: 12 }}
                      onClick={() => handleSave(v)}
                      disabled={!!saved.find((s) => s.id === v.id)}
                    >
                      {saved.find((s) => s.id === v.id) ? "Saqlangan" : "Saqlash"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!loading && list.length === 0 && !usingMock && (
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              {tab === "recommended"
                ? "Tavsiyalar dars yoki mashq yakunlangandan so'ng paydo bo'ladi."
                : "Saqlanagan videolar yo'q."}
            </div>
          )}

          {usingMock && (
            <div style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 12, gridColumn: "1 / -1" }}>
              (Demo) Dars yakunlanmagan — namuna videolar ko'rsatilmoqda.
            </div>
          )}
        </div>
      )}

      {playing && (
        <div className="modal-backdrop" onClick={() => setPlaying(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(880px, 92vw)",
              aspectRatio: "16/9",
              background: "#000",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${playing.youtubeId}?autoplay=1`}
              title={playing.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}