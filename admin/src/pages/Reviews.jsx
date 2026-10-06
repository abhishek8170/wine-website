import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  Eye,
  EyeOff,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

const getToken = () => {
  return (
    sessionStorage.getItem("adminToken") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token")
  );
};

const getStatus = (review) => {
  if (review.is_approved && review.is_active) {
    return "approved";
  }

  if (!review.is_approved && review.is_active) {
    return "pending";
  }

  if (!review.is_approved && !review.is_active) {
    return "rejected";
  }

  return "inactive";
};

const statusStyles = {
  pending: {
    label: "Pending",
    className:
      "border border-[#c9a45c]/50 bg-[#f5ead7] text-[#8a6a2f]",
  },
  approved: {
    label: "Approved",
    className:
      "border border-emerald-700/20 bg-emerald-50 text-emerald-800",
  },
  rejected: {
    label: "Rejected",
    className:
      "border border-red-700/20 bg-red-50 text-red-800",
  },
  inactive: {
    label: "Inactive",
    className:
      "border border-[#6c5850]/20 bg-[#ece3d8] text-[#6c5850]",
  },
};

const Stars = ({ rating, size = 15 }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Number(rating)
              ? "fill-[#c9a45c] text-[#c9a45c]"
              : "text-[#c9a45c]/30"
          }
        />
      ))}
    </div>
  );
};

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedReview, setSelectedReview] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH REVIEWS
  |--------------------------------------------------------------------------
  */

  const fetchReviews = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = getToken();

      const response = await fetch(
        `${API_URL}/admin/reviews`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to load reviews"
        );
      }

      setReviews(
        data?.reviews ||
          data?.data?.reviews ||
          data?.data ||
          []
      );
    } catch (error) {
      console.error("Fetch admin reviews error:", error);
      alert(error.message || "Failed to load reviews");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | UPDATE STATUS
  |--------------------------------------------------------------------------
  */

  const updateStatus = async (reviewId, status) => {
    try {
      setActionLoading(`${reviewId}-${status}`);

      const token = getToken();

      const response = await fetch(
        `${API_URL}/admin/reviews/${reviewId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update review status"
        );
      }

      setReviews((currentReviews) =>
        currentReviews.map((review) =>
          Number(review.id) === Number(reviewId)
            ? {
                ...review,
                ...(data.review || {}),
                is_approved:
                  data?.review?.is_approved ??
                  review.is_approved,
                is_active:
                  data?.review?.is_active ??
                  review.is_active,
              }
            : review
        )
      );

      if (selectedReview?.id === reviewId) {
        setSelectedReview((current) => ({
          ...current,
          ...(data.review || {}),
        }));
      }
    } catch (error) {
      console.error(
        "Update review status error:",
        error
      );

      alert(
        error.message ||
          "Failed to update review status"
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE REVIEW
  |--------------------------------------------------------------------------
  */

  const deleteReview = async (reviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this review?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`${reviewId}-delete`);

      const token = getToken();

      const response = await fetch(
        `${API_URL}/admin/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete review"
        );
      }

      setReviews((currentReviews) =>
        currentReviews.filter(
          (review) =>
            Number(review.id) !== Number(reviewId)
        )
      );

      if (selectedReview?.id === reviewId) {
        setSelectedReview(null);
      }
    } catch (error) {
      console.error(
        "Delete review error:",
        error
      );

      alert(
        error.message ||
          "Failed to delete review"
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER REVIEWS
  |--------------------------------------------------------------------------
  */

  const filteredReviews = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return reviews.filter((review) => {
      const status = getStatus(review);

      const matchesTab =
        activeTab === "all" ||
        status === activeTab;

      if (!matchesTab) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [
        review.customer_name,
        review.customer_email,
        review.product_name,
        review.review_title,
        review.review_text,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [reviews, activeTab, searchTerm]);

  /*
  |--------------------------------------------------------------------------
  | COUNTS
  |--------------------------------------------------------------------------
  */

  const counts = useMemo(() => {
    const result = {
      all: reviews.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      inactive: 0,
    };

    reviews.forEach((review) => {
      const status = getStatus(review);

      if (result[status] !== undefined) {
        result[status] += 1;
      }
    });

    return result;
  }, [reviews]);

  /*
  |--------------------------------------------------------------------------
  | DATE
  |--------------------------------------------------------------------------
  */

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | TABS
  |--------------------------------------------------------------------------
  */

  const tabs = [
    {
      id: "all",
      label: "All Reviews",
      count: counts.all,
    },
    {
      id: "pending",
      label: "Pending",
      count: counts.pending,
    },
    {
      id: "approved",
      label: "Approved",
      count: counts.approved,
    },
    {
      id: "rejected",
      label: "Rejected",
      count: counts.rejected,
    },
    {
      id: "inactive",
      label: "Inactive",
      count: counts.inactive,
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3e8d7] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#c9a45c] border-t-transparent" />

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#6c5850]">
              Loading reviews
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-[#f3e8d7] px-4 py-6 text-[#351716] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a45c]/40 bg-[#f8f1e6]">
                <MessageSquare
                  size={20}
                  className="text-[#a88342]"
                />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a88342]">
                  Customer Feedback
                </p>

                <h1 className="mt-1 font-serif text-3xl font-medium text-[#351716] sm:text-4xl">
                  Reviews
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-[#6c5850]">
              Review customer feedback, moderate submissions,
              and manage which reviews appear on the storefront.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchReviews(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 border border-[#351716]/15 bg-[#f8f1e6] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#351716] transition hover:border-[#c9a45c] hover:text-[#8b1e2d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing"
              : "Refresh Reviews"}
          </button>
        </div>

        {/* SUMMARY */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-[#351716]/10 bg-[#f8f1e6] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6c5850]">
              Total
            </p>

            <p className="mt-2 font-serif text-2xl text-[#351716]">
              {counts.all}
            </p>
          </div>

          <div className="border border-[#c9a45c]/30 bg-[#f8f1e6] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a6a2f]">
              Pending
            </p>

            <p className="mt-2 font-serif text-2xl text-[#8a6a2f]">
              {counts.pending}
            </p>
          </div>

          <div className="border border-emerald-700/10 bg-[#f8f1e6] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
              Approved
            </p>

            <p className="mt-2 font-serif text-2xl text-emerald-800">
              {counts.approved}
            </p>
          </div>

          <div className="border border-red-700/10 bg-[#f8f1e6] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-800">
              Rejected
            </p>

            <p className="mt-2 font-serif text-2xl text-red-800">
              {counts.rejected}
            </p>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="mb-6 border border-[#351716]/10 bg-[#f8f1e6] p-4">
          <div className="flex flex-col gap-4">

            {/* TABS */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => {
                const active =
                  activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setActiveTab(tab.id)
                    }
                    className={`flex shrink-0 items-center gap-2 border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.13em] transition ${
                      active
                        ? "border-[#351716] bg-[#351716] text-[#f3e8d7]"
                        : "border-[#351716]/10 bg-[#f3e8d7] text-[#6c5850] hover:border-[#c9a45c] hover:text-[#351716]"
                    }`}
                  >
                    {tab.label}

                    <span
                      className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] ${
                        active
                          ? "bg-[#c9a45c] text-[#351716]"
                          : "bg-[#e9ddcd] text-[#6c5850]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SEARCH */}
            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88342]"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search customer, product or review..."
                className="w-full border border-[#351716]/10 bg-[#f3e8d7] py-3 pl-11 pr-4 text-sm text-[#351716] outline-none transition placeholder:text-[#8b7b70] focus:border-[#c9a45c]"
              />
            </div>
          </div>
        </div>

        {/* REVIEWS */}
        {filteredReviews.length === 0 ? (
          <div className="border border-[#351716]/10 bg-[#f8f1e6] px-6 py-16 text-center">
            <MessageSquare
              size={32}
              className="mx-auto text-[#c9a45c]"
            />

            <h2 className="mt-4 font-serif text-xl text-[#351716]">
              No reviews found
            </h2>

            <p className="mt-2 text-sm text-[#6c5850]">
              {searchTerm
                ? "Try changing your search."
                : "There are no reviews in this section yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const status =
                getStatus(review);

              const statusInfo =
                statusStyles[status];

              const updating =
                actionLoading !== null &&
                String(actionLoading).startsWith(
                  `${review.id}-`
                );

              return (
                <div
                  key={review.id}
                  className="border border-[#351716]/10 bg-[#f8f1e6] transition hover:border-[#c9a45c]/40"
                >
                  <div className="p-5 sm:p-6">

                    {/* TOP */}
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">
                          <Stars
                            rating={review.rating}
                          />

                          <span className="text-xs font-semibold text-[#6c5850]">
                            {review.rating}/5
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusInfo.className}`}
                          >
                            {status ===
                              "pending" && (
                              <Clock3
                                size={12}
                              />
                            )}

                            {status ===
                              "approved" && (
                              <Check
                                size={12}
                              />
                            )}

                            {status ===
                              "rejected" && (
                              <X size={12} />
                            )}

                            {status ===
                              "inactive" && (
                              <EyeOff
                                size={12}
                              />
                            )}

                            {statusInfo.label}
                          </span>

                          {review.is_verified_purchase && (
                            <span className="inline-flex items-center gap-1.5 border border-[#a88342]/25 bg-[#f5ead7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a6a2f]">
                              <Check
                                size={12}
                              />
                              Verified Purchase
                            </span>
                          )}
                        </div>

                        <h2 className="mt-4 font-serif text-xl font-medium text-[#351716]">
                          {review.review_title ||
                            "Customer Review"}
                        </h2>

                        {review.review_text && (
                          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#6c5850]">
                            {review.review_text}
                          </p>
                        )}
                      </div>

                      {/* DATE */}
                      <div className="shrink-0 text-left xl:text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a88342]">
                          Submitted
                        </p>

                        <p className="mt-1 text-xs text-[#6c5850]">
                          {formatDate(
                            review.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    {/* DETAILS */}
                    <div className="mt-6 grid gap-4 border-t border-[#351716]/10 pt-5 sm:grid-cols-2 lg:grid-cols-3">

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a88342]">
                          Customer
                        </p>

                        <p className="mt-1 text-sm font-medium text-[#351716]">
                          {review.customer_name ||
                            "Unknown Customer"}
                        </p>

                        {review.customer_email && (
                          <p className="mt-0.5 break-all text-xs text-[#6c5850]">
                            {review.customer_email}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a88342]">
                          Product
                        </p>

                        <p className="mt-1 text-sm font-medium text-[#351716]">
                          {review.product_name ||
                            "Unknown Product"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a88342]">
                          Review ID
                        </p>

                        <p className="mt-1 text-sm text-[#6c5850]">
                          #{review.id}
                        </p>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#351716]/10 pt-5">

                      {/* PENDING */}
                      {status === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={updating}
                            onClick={() =>
                              updateStatus(
                                review.id,
                                "approved"
                              )
                            }
                            className="inline-flex items-center gap-2 bg-[#351716] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f3e8d7] transition hover:bg-[#8b1e2d] disabled:opacity-50"
                          >
                            <Check size={14} />
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={updating}
                            onClick={() =>
                              updateStatus(
                                review.id,
                                "rejected"
                              )
                            }
                            className="inline-flex items-center gap-2 border border-red-700/20 bg-red-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-800 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </>
                      )}

                      {/* APPROVED */}
                      {status === "approved" && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() =>
                            updateStatus(
                              review.id,
                              "inactive"
                            )
                          }
                          className="inline-flex items-center gap-2 border border-[#351716]/15 bg-[#f3e8d7] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c5850] transition hover:border-[#c9a45c] disabled:opacity-50"
                        >
                          <EyeOff size={14} />
                          Deactivate
                        </button>
                      )}

                      {/* INACTIVE */}
                      {status === "inactive" && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() =>
                            updateStatus(
                              review.id,
                              "approved"
                            )
                          }
                          className="inline-flex items-center gap-2 bg-[#351716] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f3e8d7] transition hover:bg-[#8b1e2d] disabled:opacity-50"
                        >
                          <Eye size={14} />
                          Activate
                        </button>
                      )}

                      {/* REJECTED */}
                      {status === "rejected" && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() =>
                            updateStatus(
                              review.id,
                              "approved"
                            )
                          }
                          className="inline-flex items-center gap-2 bg-[#351716] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f3e8d7] transition hover:bg-[#8b1e2d] disabled:opacity-50"
                        >
                          <Check size={14} />
                          Approve
                        </button>
                      )}

                      {/* VIEW */}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedReview(
                            review
                          )
                        }
                        className="inline-flex items-center gap-2 border border-[#351716]/15 bg-[#f8f1e6] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#351716] transition hover:border-[#c9a45c] hover:text-[#8b1e2d]"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      {/* DELETE */}
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                          deleteReview(
                            review.id
                          )
                        }
                        className="ml-auto inline-flex items-center gap-2 border border-red-700/15 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-800 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REVIEW DETAILS MODAL */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#351716]/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[#c9a45c]/30 bg-[#f8f1e6] shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-[#351716]/10 px-5 py-5 sm:px-7">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a88342]">
                  Review Details
                </p>

                <h2 className="mt-1 font-serif text-2xl text-[#351716]">
                  {selectedReview.review_title ||
                    "Customer Review"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedReview(null)
                }
                className="flex h-9 w-9 items-center justify-center border border-[#351716]/10 text-[#6c5850] transition hover:border-[#c9a45c] hover:text-[#351716]"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="space-y-6 px-5 py-6 sm:px-7">

              <div className="flex flex-wrap items-center gap-3">
                <Stars
                  rating={
                    selectedReview.rating
                  }
                  size={17}
                />

                <span className="text-sm text-[#6c5850]">
                  {selectedReview.rating}/5
                </span>

                {selectedReview.is_verified_purchase && (
                  <span className="border border-[#a88342]/25 bg-[#f5ead7] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a6a2f]">
                    Verified Purchase
                  </span>
                )}
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a88342]">
                  Customer
                </p>

                <p className="mt-1 text-sm font-medium text-[#351716]">
                  {selectedReview.customer_name ||
                    "Unknown Customer"}
                </p>

                {selectedReview.customer_email && (
                  <p className="mt-1 text-xs text-[#6c5850]">
                    {selectedReview.customer_email}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a88342]">
                  Product
                </p>

                <p className="mt-1 text-sm font-medium text-[#351716]">
                  {selectedReview.product_name ||
                    "Unknown Product"}
                </p>
              </div>

              {selectedReview.review_text && (
                <div className="border border-[#351716]/10 bg-[#f3e8d7] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a88342]">
                    Customer Message
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#6c5850]">
                    {selectedReview.review_text}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {getStatus(selectedReview) ===
                  "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(
                          selectedReview.id,
                          "approved"
                        )
                      }
                      disabled={
                        actionLoading !== null
                      }
                      className="inline-flex items-center gap-2 bg-[#351716] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f3e8d7] hover:bg-[#8b1e2d]"
                    >
                      <Check size={14} />
                      Approve Review
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(
                          selectedReview.id,
                          "rejected"
                        )
                      }
                      disabled={
                        actionLoading !== null
                      }
                      className="inline-flex items-center gap-2 border border-red-700/20 bg-red-50 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-800 hover:bg-red-100"
                    >
                      <X size={14} />
                      Reject Review
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;