import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  User,
  Eye,
  X,
  CheckCircle,
  Clock,
  MessageSquare,
} from "lucide-react";

import {
  getAdminContactMessages,
  updateAdminContactMessageStatus,
} from "../services/api";

import { useAdminAuth } from "../context/AdminAuthContext";

const ContactMessages = () => {
  const { token } = useAdminAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // ============================================
  // LOAD CONTACT MESSAGES
  // ============================================

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminContactMessages(token);

      if (data.success) {
        setMessages(data.messages || []);
      } else {
        setError(
          data.message || "Failed to load contact messages"
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to load contact messages"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadMessages();
    }
  }, [token]);

  // ============================================
  // UPDATE STATUS
  // ============================================

  const handleStatusChange = async (id, status) => {
    try {
      setUpdatingId(id);

      const data =
        await updateAdminContactMessageStatus(
          token,
          id,
          status
        );

      if (!data.success) {
        throw new Error(
          data.message || "Failed to update status"
        );
      }

      setMessages((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updated_at:
                  data.contactMessage?.updated_at ||
                  item.updated_at,
              }
            : item
        )
      );

      setSelectedMessage((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              status,
              updated_at:
                data.contactMessage?.updated_at ||
                prev.updated_at,
            }
          : prev
      );
    } catch (err) {
      console.error(err);

      alert(
        err.message ||
          "Failed to update message status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================
  // STATUS BADGE
  // ============================================

  const getStatusBadge = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (
      normalized === "replied" ||
      normalized === "resolved" ||
      normalized === "closed"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c7dfcf] bg-[#edf8f0] px-3 py-1.5 text-xs font-semibold text-[#36724a]">
          <CheckCircle size={13} />
          {status}
        </span>
      );
    }

    if (
      normalized === "in progress" ||
      normalized === "processing"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ead9ad] bg-[#fff8e7] px-3 py-1.5 text-xs font-semibold text-[#9a701c]">
          <Clock size={13} />
          {status}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#efd0d0] bg-[#fff2f2] px-3 py-1.5 text-xs font-semibold text-[#a33b3b]">
        <MessageSquare size={13} />
        {status || "New"}
      </span>
    );
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#f3e8d7]">
        <div className="rounded-xl border border-[#dfcdb5] bg-[#fffaf3] px-6 py-4 shadow-sm">
          <p className="text-sm font-medium text-[#6c5850]">
            Loading contact messages...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // PAGE
  // ============================================

  return (
    <div className="min-h-screen bg-[#f3e8d7] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* ======================================
            PAGE HEADER
        ====================================== */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-px w-8 bg-[#c9a45c]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a88342]">
                Customer Support
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-[#351716] sm:text-3xl">
              Contact Messages
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6c5850]">
              View and manage messages received from
              customers.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-xl border border-[#ddcbb5] bg-[#fffaf3] px-5 py-3 shadow-sm lg:self-auto">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3e8d7] text-[#a88342]">
              <MessageSquare size={17} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7770]">
                Total Messages
              </p>

              <p className="mt-0.5 text-lg font-semibold text-[#351716]">
                {messages.length}
              </p>
            </div>

          </div>

        </div>

        {/* ======================================
            ERROR
        ====================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {/* ======================================
            MESSAGES TABLE CARD
        ====================================== */}

        <div className="overflow-hidden rounded-2xl border border-[#ddcbb5] bg-[#fffaf3] shadow-[0_8px_30px_rgba(53,23,22,0.06)]">

          <div className="border-b border-[#e7dac9] px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#351716]">
                  Customer Enquiries
                </h2>

                <p className="mt-1 text-xs text-[#8a7770]">
                  Review customer enquiries and update
                  their status.
                </p>
              </div>

              <Mail
                size={19}
                className="text-[#a88342]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="min-w-[1000px] w-full">

              {/* TABLE HEADER */}

              <thead className="bg-[#f7eee2]">

                <tr>

                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#6c5850]">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#6c5850]">
                    Contact
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#6c5850]">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#6c5850]">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#6c5850]">
                    Date
                  </th>

                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-[#6c5850]">
                    Action
                  </th>

                </tr>

              </thead>

              {/* TABLE BODY */}

              <tbody className="divide-y divide-[#eee3d5]">

                {messages.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="px-6 py-16 text-center"
                    >

                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3e8d7] text-[#a88342]">
                        <Mail size={25} />
                      </div>

                      <p className="mt-4 font-semibold text-[#351716]">
                        No contact messages
                      </p>

                      <p className="mt-1 text-sm text-[#8a7770]">
                        Customer messages will appear
                        here.
                      </p>

                    </td>

                  </tr>

                ) : (

                  messages.map((item) => (

                    <tr
                      key={item.id}
                      className="group transition-colors duration-200 hover:bg-[#fffdf9]"
                    >

                      {/* CUSTOMER */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e3d2bc] bg-[#f3e8d7] text-[#8c6338]">
                            <User size={17} />
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-[#351716]">
                              {item.name}
                            </p>

                            <p className="mt-0.5 text-[11px] text-[#9a857d]">
                              Message #{item.id}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* CONTACT */}

                      <td className="px-6 py-5">

                        <div className="space-y-1.5">

                          <div className="flex items-center gap-2 text-sm text-[#4f403b]">
                            <Mail
                              size={14}
                              className="shrink-0 text-[#a88342]"
                            />

                            <span className="truncate">
                              {item.email}
                            </span>
                          </div>

                          {item.phone && (
                            <div className="flex items-center gap-2 text-xs text-[#8a7770]">
                              <Phone
                                size={13}
                                className="shrink-0"
                              />

                              <span>
                                {item.phone}
                              </span>
                            </div>
                          )}

                        </div>

                      </td>

                      {/* SUBJECT */}

                      <td className="max-w-[280px] px-6 py-5">

                        <p className="truncate text-sm font-semibold text-[#351716]">
                          {item.subject ||
                            "No subject"}
                        </p>

                        <p className="mt-1 truncate text-xs leading-5 text-[#8a7770]">
                          {item.message}
                        </p>

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-5">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* DATE */}

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-[#6c5850]">

                        {item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "-"}

                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-5 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedMessage(item)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-[#d8c3a5] bg-[#fffaf3] px-4 py-2 text-sm font-medium text-[#351716] transition-all duration-200 hover:border-[#a88342] hover:bg-[#f3e8d7] hover:shadow-sm"
                        >
                          <Eye size={15} />
                          View
                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ======================================
          MESSAGE DETAILS MODAL
      ====================================== */}

      {selectedMessage && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#351716]/55 p-4 backdrop-blur-[2px]">

          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#dfcdb5] bg-[#fffaf3] shadow-[0_20px_70px_rgba(53,23,22,0.25)]">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-[#e6d8c7] bg-[#f8f0e5] px-6 py-5">

              <div>

                <div className="flex items-center gap-2">

                  <div className="h-px w-6 bg-[#c9a45c]" />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a88342]">
                    Customer Enquiry
                  </span>

                </div>

                <h2 className="mt-2 text-xl font-semibold text-[#351716]">
                  Message Details
                </h2>

                <p className="mt-1 text-xs text-[#8a7770]">
                  Message #{selectedMessage.id}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedMessage(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfcdb5] bg-[#fffaf3] text-[#6c5850] transition hover:border-[#a88342] hover:bg-[#f3e8d7] hover:text-[#351716]"
              >
                <X size={18} />
              </button>

            </div>

            {/* MODAL CONTENT */}

            <div className="max-h-[65vh] overflow-y-auto px-6 py-6">

              {/* CUSTOMER INFORMATION */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="rounded-xl border border-[#e6d8c7] bg-white p-4">

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a88342]">
                    Name
                  </p>

                  <p className="mt-2 text-sm font-semibold text-[#351716]">
                    {selectedMessage.name}
                  </p>

                </div>

                <div className="rounded-xl border border-[#e6d8c7] bg-white p-4">

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a88342]">
                    Email
                  </p>

                  <p className="mt-2 break-all text-sm text-[#351716]">
                    {selectedMessage.email}
                  </p>

                </div>

                <div className="rounded-xl border border-[#e6d8c7] bg-white p-4">

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a88342]">
                    Phone
                  </p>

                  <p className="mt-2 text-sm text-[#351716]">
                    {selectedMessage.phone ||
                      "Not provided"}
                  </p>

                </div>

                <div className="rounded-xl border border-[#e6d8c7] bg-white p-4">

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a88342]">
                    Date
                  </p>

                  <p className="mt-2 text-sm text-[#351716]">
                    {selectedMessage.created_at
                      ? new Date(
                          selectedMessage.created_at
                        ).toLocaleString(
                          "en-IN"
                        )
                      : "-"}

                  </p>

                </div>

              </div>

              {/* SUBJECT */}

              <div className="mt-6">

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a88342]">
                  Subject
                </p>

                <p className="mt-2 text-base font-semibold text-[#351716]">
                  {selectedMessage.subject ||
                    "No subject"}
                </p>

              </div>

              {/* MESSAGE */}

              <div className="mt-6">

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a88342]">
                  Message
                </p>

                <div className="mt-2 rounded-xl border border-[#e6d8c7] bg-white p-5">

                  <p className="whitespace-pre-wrap text-sm leading-7 text-[#4f403b]">
                    {selectedMessage.message}
                  </p>

                </div>

              </div>

              {/* STATUS */}

              <div className="mt-6">

                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a88342]">
                  Update Status
                </p>

                <div className="flex flex-wrap gap-2">

                  {[
                    "New",
                    "In Progress",
                    "Replied",
                    "Resolved",
                    "Closed",
                  ].map((status) => {

                    const isActive =
                      String(
                        selectedMessage.status
                      ).toLowerCase() ===
                      status.toLowerCase();

                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={
                          updatingId ===
                          selectedMessage.id
                        }
                        onClick={() =>
                          handleStatusChange(
                            selectedMessage.id,
                            status
                          )
                        }
                        className={`rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                          isActive
                            ? "border-[#a88342] bg-[#f3e8d7] text-[#351716] shadow-sm"
                            : "border-[#dfd2c4] bg-white text-[#6c5850] hover:border-[#c9a45c] hover:bg-[#fffaf3]"
                        } ${
                          updatingId ===
                          selectedMessage.id
                            ? "cursor-not-allowed opacity-60"
                            : ""
                        }`}
                      >
                        {status}
                      </button>
                    );

                  })}

                </div>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end border-t border-[#e6d8c7] bg-[#f8f0e5] px-6 py-4">

              <button
                type="button"
                onClick={() =>
                  setSelectedMessage(null)
                }
                className="rounded-lg bg-[#351716] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4a211f]"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default ContactMessages;