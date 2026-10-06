import React, { useEffect, useRef, useState } from "react";
import { Check, Loader2, RefreshCw, Upload, X } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const getImageUrl = (url) => {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${BACKEND_URL}${
    url.startsWith("/") ? url : `/${url}`
  }`;
};

const TEAM_SLOTS = [
  {
    slot: 1,
    label: "01",
    title: "Team Photography 01",
  },
  {
    slot: 2,
    label: "02",
    title: "Team Photography 02",
  },
  {
    slot: 3,
    label: "03",
    title: "Team Photography 03",
  },
];

const request = async (endpoint, token, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
};

const uploadImage = async (token, file, endpoint) => {
  const formData = new FormData();
  formData.append("image", file);

  return request(endpoint, token, {
    method: "POST",
    body: formData,
  });
};

/* =========================================================
   IMAGE CARD
========================================================= */

const ImageCard = ({
  label,
  title,
  imageUrl,
  inputRef,
  uploading,
  onSelect,
  onRemove,
}) => {
  return (
    <article className="group overflow-hidden rounded-sm border border-[#351716]/10 bg-[#f8f1e6] shadow-[0_8px_30px_rgba(53,23,22,0.05)] transition-all duration-300 hover:border-[#c9a45c]/40 hover:shadow-[0_12px_35px_rgba(53,23,22,0.08)]">

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#eadfce]">

        {imageUrl ? (
          <>
            <img
              src={getImageUrl(imageUrl)}
              alt={title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
            />

            {/* Image overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#351716]/65 via-transparent to-transparent" />

            {/* Number */}
            <div className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center border border-[#f3e8d7]/70 bg-[#351716]/75 text-[10px] font-medium text-[#f3e8d7] backdrop-blur-sm">
              {label}
            </div>

            {/* Actions */}
            <div className="absolute inset-x-5 bottom-5 flex gap-2">

              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="border border-[#f3e8d7]/70 bg-[#351716]/80 px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#f3e8d7] backdrop-blur-sm transition hover:border-[#c9a45c] hover:bg-[#351716] hover:text-[#c9a45c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Replace"}
              </button>

              <button
                type="button"
                disabled={uploading}
                onClick={onRemove}
                className="border border-[#f3e8d7]/60 bg-[#351716]/65 px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#f3e8d7] backdrop-blur-sm transition hover:border-[#b66b63] hover:bg-[#351716] hover:text-[#e3aaa2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>

            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center px-6 text-center transition hover:bg-[#c9a45c]/[0.05]"
          >
            <span className="flex h-14 w-14 items-center justify-center border border-[#c9a45c]/40 text-[#a88342]">
              {uploading ? (
                <Loader2
                  size={20}
                  className="animate-spin"
                />
              ) : (
                <Upload
                  size={20}
                  strokeWidth={1.2}
                />
              )}
            </span>

            <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8b692e]">
              {uploading ? "Uploading..." : "Upload image"}
            </p>

            <p className="mt-3 text-xs text-[#7b6b61]">
              JPG, PNG or WEBP · Max 5 MB
            </p>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onSelect}
        />
      </div>

      {/* Card information */}
      <div className="border-t border-[#351716]/10 px-5 py-5">

        <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#a88342]">
          Customer section
        </p>

        <h3 className="mt-2 font-serif text-2xl text-[#351716]">
          {title}
        </h3>

        <p className="mt-2 text-xs leading-6 text-[#7b6b61]">
          This slot controls photography only. Customer-facing
          text stays unchanged.
        </p>

      </div>
    </article>
  );
};

/* =========================================================
   PAGE
========================================================= */

export default function OurStory() {
  const { token } = useAdminAuth();

  const [vineyard, setVineyard] = useState(null);
  const [team, setTeam] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [uploading, setUploading] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const vineyardInput = useRef(null);
  const teamInputs = useRef([]);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = async (silent = false) => {
    if (!token) return;

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await request(
        "/admin/our-story",
        token
      );

      const vineyardRows = Array.isArray(data.vineyard)
        ? data.vineyard
        : [];

      const teamRows = Array.isArray(data.team)
        ? [...data.team]
            .sort(
              (a, b) =>
                Number(a.display_order || 0) -
                Number(b.display_order || 0)
            )
            .filter(
              (item) =>
                Number(item.display_order) >= 1
            )
            .slice(0, 3)
        : [];

      setVineyard(vineyardRows[0] || null);
      setTeam(teamRows);
    } catch (err) {
      console.error(
        "Admin Our Story load error:",
        err
      );

      setError(
        err.message ||
          "Unable to load Our Story."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  /* =========================================================
     TEAM ITEM
  ========================================================= */

  const getTeamItem = (slot) => {
    return (
      team.find(
        (item) =>
          Number(item.display_order) === slot
      ) || null
    );
  };

  /* =========================================================
     UPLOAD
  ========================================================= */

  const handleFile = async (
    file,
    type,
    slot = null
  ) => {
    if (!file) return;

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      setError(
        "Only JPG, PNG and WEBP images are allowed."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image must be 5 MB or smaller."
      );
      return;
    }

    const key = slot
      ? `team-${slot}`
      : "vineyard";

    try {
      setError("");
      setMessage("");
      setUploading(key);

      const endpoint = slot
        ? `/admin/our-story/image/team/${slot}`
        : "/admin/our-story/image/vineyard";

      await uploadImage(
        token,
        file,
        endpoint
      );

      await loadData(true);

      setMessage(
        slot
          ? `Team image ${String(slot).padStart(
              2,
              "0"
            )} updated successfully.`
          : "Vineyard image updated successfully."
      );
    } catch (err) {
      console.error(
        "Admin Our Story upload error:",
        err
      );

      setError(
        err.message ||
          "Image upload failed."
      );
    } finally {
      setUploading("");
    }
  };

  /* =========================================================
     REMOVE IMAGE
  ========================================================= */

  const removeImage = async (
    type,
    slot = null
  ) => {
    const key = slot
      ? `team-${slot}`
      : "vineyard";

    try {
      setError("");
      setMessage("");
      setUploading(key);

      const endpoint = slot
        ? `/admin/our-story/image/team/${slot}`
        : "/admin/our-story/image/vineyard";

      await request(
        endpoint,
        token,
        {
          method: "DELETE",
        }
      );

      await loadData(true);

      setMessage(
        slot
          ? `Team image ${String(slot).padStart(
              2,
              "0"
            )} removed.`
          : "Vineyard image removed."
      );
    } catch (err) {
      console.error(
        "Admin Our Story remove error:",
        err
      );

      setError(
        err.message ||
          "Unable to remove image."
      );
    } finally {
      setUploading("");
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f3e8d7] text-[#351716]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-[#351716]/10 bg-[#f3e8d7]">

        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-[9px] font-semibold uppercase tracking-[0.34em] text-[#8b692e]">
                VINEORA · Our Story
              </p>

              <div className="mt-6 flex items-center gap-4">

                <span className="h-px w-12 bg-[#c9a45c]/70" />

                <span className="text-[9px] uppercase tracking-[0.24em] text-[#7b6b61]">
                  Photography Management
                </span>

              </div>

              <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-none tracking-[-0.025em] text-[#351716] sm:text-5xl lg:text-6xl">

                Manage the images behind

                <span className="block text-[#a88342]">
                  the customer story.
                </span>

              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-[#6f5d53]">

                Only the approved photography for
                section 03 — The Vineyard and
                section 07 — Our Team is
                controlled here.

              </p>

            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 self-start border border-[#351716]/15 bg-[#f8f1e6] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#351716] shadow-sm transition hover:border-[#c9a45c] hover:text-[#8b692e] disabled:cursor-not-allowed disabled:opacity-50 lg:self-auto"
            >

              <RefreshCw
                size={13}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh

            </button>

          </div>

        </div>

      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-16">

        {/* ERROR */}

        {error && (
          <div className="mb-7 flex items-start justify-between gap-4 border border-[#b66b63]/30 bg-[#fff4f1] px-5 py-4 text-xs text-[#8f3e36] shadow-sm">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-[#8f3e36] transition hover:text-[#5e2520]"
            >
              <X size={14} />
            </button>

          </div>
        )}

        {/* SUCCESS */}

        {message && (
          <div className="mb-7 flex items-start justify-between gap-4 border border-[#c9a45c]/30 bg-[#fbf5e9] px-5 py-4 text-xs text-[#76591e] shadow-sm">

            <span className="flex items-center gap-2">

              <Check size={14} />

              {message}

            </span>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="text-[#76591e] transition hover:text-[#4f3b14]"
            >
              <X size={14} />
            </button>

          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center border border-[#351716]/10 bg-[#f8f1e6] shadow-sm">

            <div className="text-center">

              <Loader2
                size={22}
                className="mx-auto animate-spin text-[#a88342]"
              />

              <p className="mt-5 text-[9px] uppercase tracking-[0.28em] text-[#7b6b61]">
                Loading photography
              </p>

            </div>

          </div>
        ) : (
          <>

            {/* =================================================
                VINEYARD
            ================================================= */}

            <section>

              <div className="mb-9 grid gap-6 border-b border-[#351716]/10 pb-7 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8b692e]">
                    03 — The Vineyard
                  </p>

                  <span className="mt-5 block h-px w-14 bg-[#c9a45c]/70" />

                </div>

                <div>

                  <h2 className="font-serif text-4xl leading-tight text-[#351716] sm:text-5xl">

                    One image.

                    <span className="block text-[#a88342]">
                      The land behind the wine.
                    </span>

                  </h2>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#6f5d53]">

                    Upload the single vineyard
                    photograph used in the
                    customer Our Story page.

                  </p>

                </div>

              </div>

              <div className="max-w-4xl">

                <ImageCard
                  label="03"
                  title="Vineyard Photography"
                  imageUrl={
                    vineyard?.image_url
                  }
                  inputRef={
                    vineyardInput
                  }
                  uploading={
                    uploading === "vineyard"
                  }
                  onSelect={(event) => {
                    const file =
                      event.target.files?.[0];

                    event.target.value = "";

                    handleFile(
                      file,
                      "vineyard"
                    );
                  }}
                  onRemove={() =>
                    removeImage(
                      "vineyard"
                    )
                  }
                />

              </div>

            </section>

            {/* =================================================
                TEAM
            ================================================= */}

            <section className="mt-24 border-t border-[#351716]/10 pt-24">

              <div className="mb-9 grid gap-6 border-b border-[#351716]/10 pb-7 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8b692e]">
                    07 — Our Team
                  </p>

                  <span className="mt-5 block h-px w-14 bg-[#c9a45c]/70" />

                </div>

                <div>

                  <h2 className="font-serif text-4xl leading-tight text-[#351716] sm:text-5xl">

                    Three images.

                    <span className="block text-[#a88342]">
                      The people behind every
                      bottle.
                    </span>

                  </h2>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#6f5d53]">

                    Each slot maps to one of
                    the three team image
                    positions on the existing
                    customer page.

                  </p>

                </div>

              </div>

              <div className="grid gap-5 lg:grid-cols-3">

                {TEAM_SLOTS.map((slot) => {

                  const item =
                    getTeamItem(slot.slot);

                  const inputRef = {
                    current:
                      teamInputs.current[
                        slot.slot - 1
                      ] || null,
                  };

                  return (
                    <ImageCard
                      key={slot.slot}
                      label={slot.label}
                      title={slot.title}
                      imageUrl={
                        item?.image_url
                      }
                      inputRef={inputRef}
                      uploading={
                        uploading ===
                        `team-${slot.slot}`
                      }
                      onSelect={(event) => {

                        const file =
                          event.target.files?.[0];

                        event.target.value = "";

                        handleFile(
                          file,
                          "team",
                          slot.slot
                        );
                      }}
                      onRemove={() =>
                        removeImage(
                          "team",
                          slot.slot
                        )
                      }
                    />
                  );
                })}

              </div>

            </section>

            {/* =================================================
                FOOTNOTE
            ================================================= */}

            <div className="mt-16 border-t border-[#351716]/10 pt-6 text-[9px] uppercase tracking-[0.18em] text-[#7b6b61]">

              Changes are saved directly to
              PostgreSQL and immediately
              available to the customer Our
              Story API.

            </div>

          </>
        )}

      </div>

    </main>
  );
}