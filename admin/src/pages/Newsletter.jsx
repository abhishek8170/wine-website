import {
  useEffect,
  useState,
} from "react";

import {
  Mail,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";

import {
  getAdminNewsletterSubscribers,
  updateAdminNewsletterSubscriberStatus,
} from "../services/api";

import { useAdminAuth } from "../context/AdminAuthContext";


const Newsletter = () => {
  const { token } = useAdminAuth();

  const [subscribers, setSubscribers] = useState([]);

  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");


  /*
  |--------------------------------------------------------------------------
  | LOAD SUBSCRIBERS
  |--------------------------------------------------------------------------
  */

  const loadSubscribers = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getAdminNewsletterSubscribers(
          token
        );

      if (response.success) {
        setSubscribers(
          response.subscribers || []
        );

        setCounts(
          response.counts || {
            total: 0,
            active: 0,
            inactive: 0,
          }
        );
      }
    } catch (error) {
      console.error(
        "Newsletter loading error:",
        error
      );

      setError(
        error.message ||
        "Failed to load newsletter subscribers"
      );
    } finally {
      setLoading(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (token) {
      loadSubscribers();
    }
  }, [token]);


  /*
  |--------------------------------------------------------------------------
  | UPDATE SUBSCRIBER STATUS
  |--------------------------------------------------------------------------
  */

  const handleStatusChange = async (
    subscriber
  ) => {
    try {
      setUpdatingId(
        subscriber.id
      );

      setError("");

      const newStatus =
        !subscriber.is_active;

      const response =
        await updateAdminNewsletterSubscriberStatus(
          token,
          subscriber.id,
          newStatus
        );

      if (response.success) {
        await loadSubscribers();
      }
    } catch (error) {
      console.error(
        "Newsletter status update error:",
        error
      );

      setError(
        error.message ||
        "Failed to update subscriber status"
      );
    } finally {
      setUpdatingId(null);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | DATE FORMAT
  |--------------------------------------------------------------------------
  */

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(
      date
    ).toLocaleDateString(
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
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5eee4] p-6 md:p-8">

        <div className="flex min-h-[60vh] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#c9a45c] border-t-transparent" />

            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#6c5850]">
              Loading newsletter
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
    <div className="min-h-screen bg-[#f5eee4] p-4 md:p-6 lg:p-8">

      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <div className="mb-2 flex items-center gap-2">

            <Mail
              size={18}
              className="text-[#a88342]"
            />

            <span className="text-xs font-medium uppercase tracking-[0.25em] text-[#a88342]">
              Customer Engagement
            </span>

          </div>

          <h1 className="font-serif text-3xl font-semibold text-[#351716] md:text-4xl">
            Newsletter
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c5850]">
            Manage customers who have subscribed
            to the VINEORA Journal.
          </p>

        </div>


        {/* REFRESH */}

        <button
          type="button"
          onClick={loadSubscribers}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-[#d8c7b2] bg-[#fffaf3] px-4 py-2.5 text-sm font-medium text-[#351716] transition hover:border-[#c9a45c] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >

          <RefreshCw size={16} />

          Refresh

        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* SUMMARY CARDS */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* TOTAL */}

        <div className="rounded-xl border border-[#dfd0be] bg-[#fffaf3] p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8a766b]">
                Total Subscribers
              </p>

              <p className="mt-3 text-3xl font-semibold text-[#351716]">
                {counts.total}
              </p>

            </div>

            <div className="rounded-lg bg-[#351716] p-3 text-[#f3e8d7]">

              <Users size={19} />

            </div>

          </div>

        </div>


        {/* ACTIVE */}

        <div className="rounded-xl border border-[#dfd0be] bg-[#fffaf3] p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8a766b]">
                Active Subscribers
              </p>

              <p className="mt-3 text-3xl font-semibold text-[#351716]">
                {counts.active}
              </p>

            </div>

            <div className="rounded-lg bg-[#efe5d4] p-3 text-[#8b6a32]">

              <UserCheck size={19} />

            </div>

          </div>

        </div>


        {/* INACTIVE */}

        <div className="rounded-xl border border-[#dfd0be] bg-[#fffaf3] p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8a766b]">
                Inactive Subscribers
              </p>

              <p className="mt-3 text-3xl font-semibold text-[#351716]">
                {counts.inactive}
              </p>

            </div>

            <div className="rounded-lg bg-[#eee5dc] p-3 text-[#6c5850]">

              <UserX size={19} />

            </div>

          </div>

        </div>

      </div>


      {/* SUBSCRIBER TABLE */}

      <div className="overflow-hidden rounded-xl border border-[#dfd0be] bg-[#fffaf3] shadow-sm">

        {/* TABLE HEADER */}

        <div className="border-b border-[#dfd0be] px-5 py-4 md:px-6">

          <div className="flex flex-col gap-1">

            <h2 className="font-serif text-xl font-semibold text-[#351716]">
              Newsletter Subscribers
            </h2>

            <p className="text-sm text-[#8a766b]">
              Subscribers collected from the
              customer newsletter form.
            </p>

          </div>

        </div>


        {/* MOBILE / DESKTOP TABLE */}

        <div className="overflow-x-auto">

          <table className="min-w-[760px] w-full">

            <thead>

              <tr className="border-b border-[#dfd0be] bg-[#f8f1e8]">

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#6c5850]">
                  Name
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#6c5850]">
                  Email
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#6c5850]">
                  Subscribed On
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#6c5850]">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[#6c5850]">
                  Control
                </th>

              </tr>

            </thead>


            <tbody>

              {subscribers.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="px-5 py-16 text-center"
                  >

                    <Mail
                      size={30}
                      className="mx-auto text-[#c9a45c]"
                    />

                    <p className="mt-3 font-medium text-[#351716]">
                      No newsletter subscribers
                    </p>

                    <p className="mt-1 text-sm text-[#8a766b]">
                      Subscribers will appear here
                      when customers join the Journal.
                    </p>

                  </td>

                </tr>

              ) : (

                subscribers.map(
                  (subscriber) => (

                    <tr
                      key={subscriber.id}
                      className="border-b border-[#eadfd2] last:border-b-0 hover:bg-[#fdf8f1]"
                    >

                      {/* NAME */}

                      <td className="px-5 py-4">

                        <p className="font-medium text-[#351716]">
                          {subscriber.first_name ||
                            "—"}
                        </p>

                      </td>


                      {/* EMAIL */}

                      <td className="px-5 py-4">

                        <p className="text-sm text-[#6c5850]">
                          {subscriber.email}
                        </p>

                      </td>


                      {/* DATE */}

                      <td className="px-5 py-4">

                        <p className="text-sm text-[#6c5850]">
                          {formatDate(
                            subscriber.subscribed_at
                          )}
                        </p>

                      </td>


                      {/* STATUS */}

                      <td className="px-5 py-4">

                        <span
                          className={
                            subscriber.is_active
                              ? "inline-flex items-center rounded-full border border-[#cbdcca] bg-[#edf6ec] px-3 py-1 text-xs font-medium text-[#426044]"
                              : "inline-flex items-center rounded-full border border-[#ddd3cb] bg-[#f1ece8] px-3 py-1 text-xs font-medium text-[#766860]"
                          }
                        >
                          <span
                            className={
                              subscriber.is_active
                                ? "mr-2 h-1.5 w-1.5 rounded-full bg-[#426044]"
                                : "mr-2 h-1.5 w-1.5 rounded-full bg-[#766860]"
                            }
                          />

                          {subscriber.is_active
                            ? "Active"
                            : "Inactive"}

                        </span>

                      </td>


                      {/* CONTROL */}

                      <td className="px-5 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(
                              subscriber
                            )
                          }
                          disabled={
                            updatingId ===
                            subscriber.id
                          }
                          aria-label={
                            subscriber.is_active
                              ? "Deactivate subscriber"
                              : "Activate subscriber"
                          }
                          className="inline-flex items-center gap-2 rounded-md border border-[#d8c7b2] bg-white px-3 py-2 text-xs font-medium text-[#351716] transition hover:border-[#c9a45c] hover:bg-[#f8f1e8] disabled:cursor-not-allowed disabled:opacity-60"
                        >

                          {updatingId ===
                          subscriber.id ? (

                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#c9a45c] border-t-transparent" />

                          ) : (

                            <span
                              className={
                                subscriber.is_active
                                  ? "relative h-5 w-9 rounded-full bg-[#351716]"
                                  : "relative h-5 w-9 rounded-full bg-[#c8b9ab]"
                              }
                            >

                              <span
                                className={
                                  subscriber.is_active
                                    ? "absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-[#f3e8d7]"
                                    : "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white"
                                }
                              />

                            </span>

                          )}

                          {subscriber.is_active
                            ? "Deactivate"
                            : "Activate"}

                        </button>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};


export default Newsletter;